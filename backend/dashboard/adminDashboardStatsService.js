const {
  createComparison,
  createDashboardStatsResponse,
  createDomain,
  createMetric,
  unavailableComparison
} = require('./adminDashboardContract')
const { DASHBOARD_TIMEZONE, resolveDashboardPeriods } = require('./adminDashboardPeriod')
const {
  filterStudentProfiles,
  filterTeacherProfiles,
  isActiveProfile
} = require('../security/userAudience')
const {
  applyColumnFilter,
  applyPlaceFilters,
  applyResultFilters,
  filterProfiles,
  placeHasCapacity
} = require('./adminDashboardFilters')

const SOURCES = Object.freeze({
  users: 'public.user_profiles',
  connectedUsers: 'auth.users.last_sign_in_at',
  roles: 'public.roles',
  permissions: 'public.permissions',
  routes: 'public.dynamic_routes',
  students: 'public.user_profiles',
  institutions: 'public.institutions',
  places: 'public.places',
  pfpInProgress: 'public.student_result_vote',
  pfpValidationsPending: 'public.student_result_vote',
  teachers: 'public.user_profiles',
  courses: 'public.courses',
  media: 'public.video_library',
  modules: 'public.modules',
  activeChallenges: 'public.challenges',
  completedQuests: 'public.user_quest_progress.completed_at',
  badges: 'public.user_badges.earned_at',
  activeUsers: 'public.xp_history.created_at'
})

const GAMIFICATION_ACTIVITY_TITLES = Object.freeze({
  LOGIN: 'Connexion récompensée',
  PROFILE_UPDATE: 'Profil complété',
  POST: 'Publication récompensée',
  QUEST_COMPLETE: 'Quête terminée',
  CHALLENGE_COMPLETE: 'Défi terminé',
  BADGE_UNLOCK: 'Badge obtenu',
  DAILY_WHEEL: 'Roue quotidienne'
})

// Attributions de progression ou d'ouverture : elles ne prouvent pas une activité du joueur.
const SYSTEM_XP_ACTIONS = Object.freeze(new Set([
  'SEASON_RESET',
  'OPENING_BALANCE',
  'HOUSE_ASSIGNMENT',
  'GAMEMASTER_RESTORE'
]))
const CONNECTED_WINDOW_DAYS = 30
const AUTH_PAGE_SIZE = 1000

function queryError(table, error) {
  const wrapped = new Error(`Impossible de lire ${table}.`)
  wrapped.code = error?.code || 'UPSTREAM_QUERY_FAILED'
  wrapped.status = error?.status || error?.statusCode
  wrapped.cause = error
  wrapped.table = table
  return wrapped
}

async function countRows(client, table, column, configure = (query) => query) {
  const query = configure(client.from(table).select(column, { count: 'exact', head: true }))
  const { count, error } = await query
  if (error) throw queryError(table, error)
  if (!Number.isFinite(count)) throw queryError(table, { code: 'INVALID_COUNT' })
  return count
}

async function selectRows(client, table, columns, configure = (query) => query) {
  const { data, error } = await configure(client.from(table).select(columns))
  if (error) throw queryError(table, error)
  return data || []
}

// Sans ordre total, PostgreSQL peut répéter ou sauter des lignes d'une page à l'autre.
const PAGINATION_KEYS = Object.freeze({
  admin_kpi_snapshots: ['domain', 'metric'],
  places: ['PlaceId'],
  user_profiles: ['user_id'],
  xp_history: ['id']
})

async function selectAllRows(client, table, columns, configure = (query) => query) {
  const pageSize = 1000
  const rows = []
  const keys = PAGINATION_KEYS[table] || []
  for (let offset = 0; ; offset += pageSize) {
    const page = await selectRows(client, table, columns, (query) =>
      keys
        .reduce((ordered, key) => ordered.order(key, { ascending: true }), configure(query))
        .range(offset, offset + pageSize - 1)
    )
    rows.push(...page)
    if (page.length < pageSize) return rows
  }
}

async function sumColumn(client, table, column, configure = (query) => query) {
  const rows = await selectRows(client, table, column, configure)
  return rows.reduce((total, row) => total + Math.max(0, Number(row?.[column]) || 0), 0)
}

async function countDistinct(client, table, column, configure = (query) => query) {
  const rows = await selectAllRows(client, table, column, configure)
  return new Set(rows.map((row) => row?.[column]).filter(Boolean)).size
}

// student_result_vote.year porte l'année de fin : 2027 = année académique 2026-2027.
async function loadActivePfpYear(client) {
  const rows = await selectRows(client, 'academic_years', 'end_date', (query) =>
    query.eq('is_active', true).limit(1)
  )
  const match = /^(\d{4})/.exec(String(rows[0]?.end_date || ''))
  if (!match) throw queryError('academic_years', { code: 'ACTIVE_ACADEMIC_YEAR_MISSING' })
  return match[1]
}

function memoize(load) {
  let promise = null
  return () => {
    promise ||= load()
    return promise
  }
}

function applyOpenPfpFilters(query, filters) {
  let filtered = applyResultFilters(query, filters)
  if (!filters.status?.length) filtered = filtered.in('status', ['assigned', 'published'])
  return filtered.eq('pfp_validee', false).eq('pfp_echec', false).eq('pfp_arret', false)
}

async function countPendingPfpValidations(client, filters = {}) {
  const year = await loadActivePfpYear(client)
  return countRows(client, 'student_result_vote', 'id', (query) =>
    applyOpenPfpFilters(query, filters).lt('year', year)
  )
}

// L'API d'administration ignore les comptes dont auth.users.aud est vide : on lit via une
// fonction réservée au backend.
async function loadRecentAuthUsers(client, sinceMs) {
  const ids = new Set()
  for (let offset = 0; ; offset += AUTH_PAGE_SIZE) {
    const { data, error } = await client
      .rpc('admin_recent_sign_in_user_ids', { p_since: new Date(sinceMs).toISOString() })
      .range(offset, offset + AUTH_PAGE_SIZE - 1)
    if (error) throw queryError('admin_recent_sign_in_user_ids', error)
    const rows = data || []
    for (const row of rows) ids.add(row.user_id)
    if (rows.length < AUTH_PAGE_SIZE) return ids
  }
}

async function loadGamemasterIds(client) {
  const houses = await selectRows(client, 'houses', 'id,name')
  const houseIds = houses
    .filter((house) => String(house?.name || '').trim().toLowerCase() === 'gamemaster')
    .map((house) => house.id)
  if (!houseIds.length) return new Set()
  const members = await selectAllRows(client, 'user_profiles', 'user_id', (query) =>
    query.in('house_id', houseIds)
  )
  return new Set(members.map((member) => member.user_id))
}

async function loadRecentGamificationActivity(client, limit = 20) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50))
  const rows = await selectRows(client, 'xp_history', 'action,source_type,amount,created_at', (query) =>
    query.order('created_at', { ascending: false }).limit(safeLimit)
  )
  return rows.map((row) => {
    const action = String(row?.action || 'ACTIVITY').toUpperCase()
    return Object.freeze({
      type: String(row?.source_type || action).toLowerCase(),
      title: GAMIFICATION_ACTIVITY_TITLES[action] || 'Activité gamification',
      xp: Number(row?.amount) || 0,
      occurredAt: row?.created_at || null
    })
  })
}

function applyPeriod(query, column, period) {
  return query.gte(column, period.start).lt(column, period.end)
}

function flow(load) {
  return Object.freeze({ semantics: 'flow', load })
}

function snapshot(load, semantics = 'snapshot', reason = 'HISTORY_UNAVAILABLE') {
  return Object.freeze({ semantics, load, reason })
}

function zurichDate(value) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DASHBOARD_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(value))
}

function isMissingRelation(error) {
  const code = error?.cause?.code || error?.code
  return code === '42P01' || code === 'PGRST205'
}

// Dernière valeur connue de chaque KPI de stock dans la période de comparaison.
// Les photos sont globales : elles ne servent pas quand un filtre est actif.
async function loadSnapshotHistory(client, domains, period, filters, onMetricError) {
  if (Object.keys(filters || {}).length) {
    return { values: new Map(), reason: 'FILTERED_HISTORY_UNAVAILABLE' }
  }
  try {
    const lastIncludedInstant = new Date(new Date(period.end).getTime() - 1)
    const rows = await selectAllRows(
      client,
      'admin_kpi_snapshots',
      'snapshot_date,domain,metric,value',
      (query) =>
        query
          .in('domain', domains)
          .gte('snapshot_date', zurichDate(period.start))
          .lte('snapshot_date', zurichDate(lastIncludedInstant))
          .order('snapshot_date', { ascending: false })
    )
    const values = new Map()
    for (const row of rows) {
      const key = `${row.domain}.${row.metric}`
      const value = Number(row.value)
      if (!values.has(key) && Number.isFinite(value)) values.set(key, value)
    }
    return { values, reason: null }
  } catch (error) {
    if (!isMissingRelation(error)) {
      onMetricError?.({ key: 'history', domain: 'all', source: 'public.admin_kpi_snapshots', error })
    }
    return { values: new Map(), reason: null }
  }
}

async function safeMetric({ key, domain, source, asOf, definition, periods, history, onMetricError }) {
  let value
  try {
    value = await definition.load(periods.current)
  } catch (error) {
    onMetricError?.({ key, domain, source, error })
    return createMetric({
      status: 'error',
      source,
      asOf,
      period: periods.current,
      semantics: definition.semantics,
      comparison: unavailableComparison(periods.previous),
      error: error.code || 'UPSTREAM_QUERY_FAILED'
    })
  }

  if (definition.semantics !== 'flow') {
    const previousValue = history?.values.get(`${domain}.${key}`)
    return createMetric({
      value,
      source,
      asOf,
      period: periods.current,
      semantics: definition.semantics,
      comparison: Number.isFinite(previousValue)
        ? createComparison({ currentValue: value, previousValue, period: periods.previous })
        : unavailableComparison(periods.previous, history?.reason || definition.reason)
    })
  }

  try {
    const previousValue = await definition.load(periods.previous)
    return createMetric({
      value,
      source,
      asOf,
      period: periods.current,
      semantics: definition.semantics,
      comparison: createComparison({ currentValue: value, previousValue, period: periods.previous })
    })
  } catch (error) {
    onMetricError?.({ key: `${key}.previous`, domain, source, error })
    return createMetric({
      value,
      source,
      asOf,
      period: periods.current,
      semantics: definition.semantics,
      comparison: unavailableComparison(
        periods.previous,
        error.code || 'UPSTREAM_QUERY_FAILED',
        'error'
      )
    })
  }
}

async function loadMetrics(domain, definitions, asOf, periods, history, onMetricError) {
  const entries = await Promise.all(
    Object.entries(definitions).map(async ([key, definition]) => [
      key,
      await safeMetric({
        key,
        domain,
        source: SOURCES[key],
        asOf,
        definition,
        periods,
        history,
        onMetricError
      })
    ])
  )
  return createDomain(Object.fromEntries(entries))
}

function hasPeopleFilters(filters) {
  return ['track', 'role', 'class', 'cohort'].some((key) => filters[key]?.length)
}

function generalDefinitions(client, filters = {}, asOf = new Date().toISOString()) {
  return {
    users: snapshot(async () => {
      const profiles = await selectAllRows(
        client,
        'user_profiles',
        'role,permissions,is_active,classe,pfp_cohort,primary_track_id'
      )
      return filterProfiles(profiles.filter(isActiveProfile), filters).length
    }),
    connectedUsers: snapshot(async () => {
      const sinceMs = new Date(asOf).getTime() - CONNECTED_WINDOW_DAYS * 24 * 60 * 60 * 1000
      const [profiles, recentIds] = await Promise.all([
        selectAllRows(
          client,
          'user_profiles',
          'user_id,role,permissions,is_active,classe,pfp_cohort,primary_track_id'
        ),
        loadRecentAuthUsers(client, sinceMs)
      ])
      return filterProfiles(profiles.filter(isActiveProfile), filters)
        .filter((profile) => recentIds.has(profile.user_id)).length
    }),
    roles: snapshot(() => countRows(client, 'roles', 'id')),
    permissions: snapshot(() => countRows(client, 'permissions', 'slug')),
    routes: snapshot(() =>
      countRows(client, 'dynamic_routes', 'id', (query) => query.eq('is_active', true))
    )
  }
}

function pfpDefinitions(client, filters = {}) {
  const activeYear = memoize(() => loadActivePfpYear(client))
  return {
    students: snapshot(async () => {
      const profiles = await selectAllRows(
        client,
        'user_profiles',
        'user_id,role,permissions,is_active,classe,pfp_cohort,primary_track_id',
        (query) => query
      )
      return filterProfiles(filterStudentProfiles(profiles), filters).length
    }),
    institutions: snapshot(
      () =>
        countRows(client, 'institutions', 'InstitutionId', (query) =>
          applyColumnFilter(query.or('is_hidden.is.null,is_hidden.eq.false'), 'Name', filters.institution)
        ),
      'snapshot',
      'SOURCE_HAS_NO_CREATED_AT'
    ),
    places: snapshot(async () => {
      if (!filters.pfp?.length) {
        return countRows(client, 'places', 'PlaceId', (query) => applyPlaceFilters(query, filters))
      }
      const [year, places] = await Promise.all([
        activeYear(),
        selectAllRows(client, 'places', `PlaceId,${filters.pfp.join(',')}`, (query) =>
          applyPlaceFilters(query, filters)
        )
      ])
      return places.filter((place) => placeHasCapacity(place, filters.pfp, year)).length
    }),
    pfpInProgress: snapshot(async () => {
      const year = await activeYear()
      return countRows(client, 'student_result_vote', 'id', (query) =>
        applyOpenPfpFilters(query, filters).eq('year', year)
      )
    }),
    pfpValidationsPending: snapshot(() => countPendingPfpValidations(client, filters))
  }
}

function academicDefinitions(client, filters = {}) {
  return {
    teachers: snapshot(async () => {
      const profiles = await selectAllRows(
        client,
        'user_profiles',
        'role,permissions,is_active,classe,pfp_cohort,primary_track_id'
      )
      return filterProfiles(filterTeacherProfiles(profiles), filters).length
    }),
    courses: snapshot(() => countRows(client, 'courses', 'id')),
    media: snapshot(() => countRows(client, 'video_library', 'id')),
    modules: snapshot(() =>
      countRows(client, 'modules', 'id', (query) => applyColumnFilter(query, 'track_id', filters.track))
    )
  }
}

function gamificationDefinitions(client, _filters = {}, asOf = new Date().toISOString()) {
  const gamemasterIds = memoize(() => loadGamemasterIds(client))
  return {
    activeChallenges: snapshot(
      () => {
        const today = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Zurich',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(new Date(asOf))
        return countRows(client, 'challenges', 'id', (query) =>
          query
            .eq('is_active', true)
            .or(`start_date.is.null,start_date.lte.${today}`)
            .or(`end_date.is.null,end_date.gte.${today}`)
        )
      },
      'snapshot',
      'ACTIVE_CHALLENGES_ARE_A_CURRENT_SNAPSHOT'
    ),
    completedQuests: flow((period) =>
      countRows(client, 'user_quest_progress', 'id', (query) =>
        applyPeriod(query.eq('status', 'completed'), 'completed_at', period)
      )
    ),
    badges: flow((period) =>
      countRows(client, 'user_badges', 'badge_id', (query) =>
        applyPeriod(query, 'earned_at', period)
      )
    ),
    activeUsers: flow(async (period) => {
      const [gamemasters, rows] = await Promise.all([
        gamemasterIds(),
        selectAllRows(client, 'xp_history', 'user_id,action', (query) =>
          applyPeriod(query, 'created_at', period)
        )
      ])
      return new Set(
        rows
          .filter((row) => row?.user_id && !gamemasters.has(row.user_id))
          .filter((row) => !SYSTEM_XP_ACTIONS.has(String(row.action || '').toUpperCase()))
          .map((row) => row.user_id)
      ).size
    })
  }
}

const DOMAIN_DEFINITIONS = Object.freeze({
  general: generalDefinitions,
  pfp: pfpDefinitions,
  academic: academicDefinitions,
  gamification: gamificationDefinitions
})

function createAdminDashboardStatsService(options) {
  const client = options?.client
  if (!client) throw new Error('Un client Supabase serveur est obligatoire.')
  const now = options.now || (() => new Date())
  const onMetricError = options.onMetricError

  return {
    async loadStats(requestedDomains = Object.keys(DOMAIN_DEFINITIONS), periodOptions = {}, filters = {}) {
      const asOf = now().toISOString()
      const periods = resolveDashboardPeriods({
        key: periodOptions.key,
        reference: periodOptions.reference,
        now
      })
      const uniqueDomains = [...new Set(requestedDomains)]
      for (const domain of uniqueDomains) {
        if (!DOMAIN_DEFINITIONS[domain]) throw new Error(`Domaine dashboard inconnu: ${domain}`)
      }

      const history = await loadSnapshotHistory(
        client,
        uniqueDomains,
        periods.previous,
        filters,
        onMetricError
      )
      const domains = Object.fromEntries(
        await Promise.all(
          uniqueDomains.map(async (domain) => [
            domain,
            await loadMetrics(
              domain,
              DOMAIN_DEFINITIONS[domain](client, filters, asOf),
              asOf,
              periods,
              history,
              onMetricError
            )
          ])
        )
      )
      return createDashboardStatsResponse({
        domains,
        asOf,
        period: periods.current,
        previousPeriod: periods.previous,
        appliedFilters: filters
      })
    },

    // Enregistre la valeur du jour des KPI de stock, sans filtre. Rejouable.
    async captureDailySnapshot() {
      const asOf = now().toISOString()
      const periods = resolveDashboardPeriods({ key: 'day', now })
      const snapshotDate = zurichDate(asOf)
      const rows = []
      for (const [domain, createDefinitions] of Object.entries(DOMAIN_DEFINITIONS)) {
        const definitions = createDefinitions(client, {}, asOf)
        for (const [metric, definition] of Object.entries(definitions)) {
          if (definition.semantics === 'flow') continue
          try {
            const value = await definition.load(periods.current)
            rows.push({ snapshot_date: snapshotDate, domain, metric, value, captured_at: asOf })
          } catch (error) {
            onMetricError?.({ key: metric, domain, source: SOURCES[metric], error })
          }
        }
      }
      if (!rows.length) return 0
      const { error } = await client
        .from('admin_kpi_snapshots')
        .upsert(rows, { onConflict: 'snapshot_date,domain,metric' })
      if (error) throw queryError('admin_kpi_snapshots', error)
      return rows.length
    }
  }
}

module.exports = {
  DOMAIN_DEFINITIONS,
  SOURCES,
  applyPeriod,
  countDistinct,
  countPendingPfpValidations,
  countRows,
  createAdminDashboardStatsService,
  loadRecentGamificationActivity,
  selectRows,
  selectAllRows,
  sumColumn
}
