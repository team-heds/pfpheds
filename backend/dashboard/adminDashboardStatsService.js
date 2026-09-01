const {
  createComparison,
  createDashboardStatsResponse,
  createDomain,
  createMetric,
  unavailableComparison
} = require('./adminDashboardContract')
const { resolveDashboardPeriods } = require('./adminDashboardPeriod')
const {
  filterStudentProfiles,
  filterTeacherProfiles,
  isActiveProfile
} = require('../security/userAudience')
const {
  applyColumnFilter,
  applyPlaceFilters,
  applyResultFilters,
  filterProfiles
} = require('./adminDashboardFilters')

const SOURCES = Object.freeze({
  users: 'public.user_profiles',
  roles: 'public.roles',
  permissions: 'public.permissions',
  routes: 'public.dynamic_routes',
  students: 'public.user_profiles',
  institutions: 'public.institutions',
  places: 'public.places',
  pfpInProgress: 'public.student_result_vote',
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

async function selectAllRows(client, table, columns, configure = (query) => query) {
  const pageSize = 1000
  const rows = []
  for (let offset = 0; ; offset += pageSize) {
    const page = await selectRows(client, table, columns, (query) =>
      configure(query).range(offset, offset + pageSize - 1)
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

async function safeMetric({ key, domain, source, asOf, definition, periods, onMetricError }) {
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
    return createMetric({
      value,
      source,
      asOf,
      period: periods.current,
      semantics: definition.semantics,
      comparison: unavailableComparison(periods.previous, definition.reason)
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

async function loadMetrics(domain, definitions, asOf, periods, onMetricError) {
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
        onMetricError
      })
    ])
  )
  return createDomain(Object.fromEntries(entries))
}

function hasPeopleFilters(filters) {
  return ['track', 'role', 'class', 'cohort'].some((key) => filters[key]?.length)
}

function generalDefinitions(client, filters = {}) {
  return {
    users: flow(async (period) => {
      if (!hasPeopleFilters(filters)) {
        return countRows(client, 'user_profiles', 'user_id', (query) =>
          applyPeriod(query.eq('is_active', true), 'created_at', period)
        )
      }
      const profiles = await selectRows(
        client,
        'user_profiles',
        'role,permissions,is_active,classe,pfp_cohort,primary_track_id',
        (query) => applyPeriod(query, 'created_at', period)
      )
      return filterProfiles(profiles.filter(isActiveProfile), filters).length
    }),
    roles: snapshot(() => countRows(client, 'roles', 'id')),
    permissions: snapshot(() => countRows(client, 'permissions', 'slug')),
    routes: flow((period) =>
      countRows(client, 'dynamic_routes', 'id', (query) =>
        applyPeriod(query.eq('is_active', true), 'created_at', period)
      )
    )
  }
}

function pfpDefinitions(client, filters = {}) {
  return {
    students: flow(async (period) => {
      const profiles = await selectRows(
        client,
        'user_profiles',
        'user_id,role,permissions,is_active,classe,pfp_cohort,primary_track_id',
        (query) => applyPeriod(query, 'created_at', period)
      )
      return filterProfiles(filterStudentProfiles(profiles), filters).length
    }),
    institutions: snapshot(
      () =>
        countRows(client, 'institutions', 'InstitutionId', (query) =>
          applyColumnFilter(query, 'Name', filters.institution)
        ),
      'snapshot',
      'SOURCE_HAS_NO_CREATED_AT'
    ),
    places: flow((period) =>
      countRows(client, 'places', 'PlaceId', (query) =>
        applyPeriod(applyPlaceFilters(query, filters), 'CreatedAt', period)
      )
    ),
    pfpInProgress: flow((period) =>
      countRows(client, 'student_result_vote', 'id', (query) => {
        let filtered = applyResultFilters(query, filters)
        if (!filters.status?.length) filtered = filtered.in('status', ['assigned', 'published'])
        return applyPeriod(
          filtered
            .eq('pfp_validee', false)
            .eq('pfp_echec', false)
            .eq('pfp_arret', false),
          'assigned_at',
          period
        )
      })
    )
  }
}

function academicDefinitions(client, filters = {}) {
  return {
    teachers: flow(async (period) => {
      const profiles = await selectRows(
        client,
        'user_profiles',
        'role,permissions,is_active,classe,pfp_cohort,primary_track_id',
        (query) => applyPeriod(query, 'created_at', period)
      )
      return filterProfiles(filterTeacherProfiles(profiles), filters).length
    }),
    courses: flow((period) =>
      countRows(client, 'courses', 'id', (query) => applyPeriod(query, 'created_at', period))
    ),
    media: flow((period) =>
      countRows(client, 'video_library', 'id', (query) =>
        applyPeriod(query, 'published_date', period)
      )
    ),
    modules: flow((period) =>
      countRows(client, 'modules', 'id', (query) => applyPeriod(query, 'created_at', period))
    )
  }
}

function gamificationDefinitions(client, _filters = {}, asOf = new Date().toISOString()) {
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
    activeUsers: flow((period) =>
      countDistinct(client, 'xp_history', 'user_id', (query) =>
        applyPeriod(query, 'created_at', period)
      )
    )
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

      const domains = Object.fromEntries(
        await Promise.all(
          uniqueDomains.map(async (domain) => [
            domain,
            await loadMetrics(
              domain,
              DOMAIN_DEFINITIONS[domain](client, filters, asOf),
              asOf,
              periods,
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
    }
  }
}

module.exports = {
  DOMAIN_DEFINITIONS,
  SOURCES,
  applyPeriod,
  countDistinct,
  countRows,
  createAdminDashboardStatsService,
  loadRecentGamificationActivity,
  selectRows,
  selectAllRows,
  sumColumn
}
