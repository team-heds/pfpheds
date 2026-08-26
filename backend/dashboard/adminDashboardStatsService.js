const {
  createComparison,
  createDashboardStatsResponse,
  createDomain,
  createMetric,
  unavailableComparison
} = require('./adminDashboardContract')
const { resolveDashboardPeriods } = require('./adminDashboardPeriod')
const { filterStudentProfiles, filterTeacherProfiles } = require('../security/userAudience')

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
  completedQuests: 'public.quests.completion_count',
  badges: 'public.badges',
  activeUsers: 'public.gamification_data.total_xp'
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

async function sumColumn(client, table, column, configure = (query) => query) {
  const rows = await selectRows(client, table, column, configure)
  return rows.reduce((total, row) => total + Math.max(0, Number(row?.[column]) || 0), 0)
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

function generalDefinitions(client) {
  return {
    users: flow((period) =>
      countRows(client, 'user_profiles', 'user_id', (query) =>
        applyPeriod(query.eq('is_active', true), 'created_at', period)
      )
    ),
    roles: snapshot(() => countRows(client, 'roles', 'id')),
    permissions: snapshot(() => countRows(client, 'permissions', 'slug')),
    routes: flow((period) =>
      countRows(client, 'dynamic_routes', 'id', (query) =>
        applyPeriod(query.eq('is_active', true), 'created_at', period)
      )
    )
  }
}

function pfpDefinitions(client) {
  return {
    students: flow(async (period) => {
      const profiles = await selectRows(
        client,
        'user_profiles',
        'user_id,role,permissions,is_active',
        (query) => applyPeriod(query, 'created_at', period)
      )
      return filterStudentProfiles(profiles).length
    }),
    institutions: snapshot(
      () => countRows(client, 'institutions', 'InstitutionId'),
      'snapshot',
      'SOURCE_HAS_NO_CREATED_AT'
    ),
    places: flow((period) =>
      countRows(client, 'places', 'PlaceId', (query) => applyPeriod(query, 'CreatedAt', period))
    ),
    pfpInProgress: flow((period) =>
      countRows(client, 'student_result_vote', 'id', (query) =>
        applyPeriod(
          query
            .in('status', ['assigned', 'published'])
            .eq('pfp_validee', false)
            .eq('pfp_echec', false)
            .eq('pfp_arret', false),
          'assigned_at',
          period
        )
      )
    )
  }
}

function academicDefinitions(client) {
  return {
    teachers: flow(async (period) => {
      const profiles = await selectRows(
        client,
        'user_profiles',
        'role,permissions,is_active',
        (query) => applyPeriod(query, 'created_at', period)
      )
      return filterTeacherProfiles(profiles).length
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

function gamificationDefinitions(client) {
  return {
    activeChallenges: flow((period) =>
      countRows(client, 'challenges', 'id', (query) =>
        applyPeriod(query.eq('is_active', true), 'created_at', period)
      )
    ),
    completedQuests: snapshot(
      () => sumColumn(client, 'quests', 'completion_count'),
      'cumulative',
      'COMPLETION_EVENTS_UNAVAILABLE'
    ),
    badges: flow((period) =>
      countRows(client, 'badges', 'id', (query) =>
        applyPeriod(query.eq('is_active', true), 'created_at', period)
      )
    ),
    activeUsers: flow((period) =>
      countRows(client, 'gamification_data', 'id', (query) =>
        applyPeriod(query.gt('total_xp', 0), 'created_at', period)
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
    async loadStats(requestedDomains = Object.keys(DOMAIN_DEFINITIONS), periodOptions = {}) {
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
              DOMAIN_DEFINITIONS[domain](client),
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
        previousPeriod: periods.previous
      })
    }
  }
}

module.exports = {
  DOMAIN_DEFINITIONS,
  SOURCES,
  applyPeriod,
  countRows,
  createAdminDashboardStatsService,
  selectRows,
  sumColumn
}
