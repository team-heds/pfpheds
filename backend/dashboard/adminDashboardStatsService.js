const {
  createDashboardStatsResponse,
  createDomain,
  createMetric
} = require('./adminDashboardContract')
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

async function safeMetric({ key, domain, source, asOf, load, onMetricError }) {
  try {
    return createMetric({ value: await load(), source, asOf })
  } catch (error) {
    onMetricError?.({ key, domain, source, error })
    return createMetric({
      status: 'error',
      source,
      asOf,
      error: error.code || 'UPSTREAM_QUERY_FAILED'
    })
  }
}

async function loadMetrics(domain, definitions, asOf, onMetricError) {
  const entries = await Promise.all(
    Object.entries(definitions).map(async ([key, definition]) => [
      key,
      await safeMetric({ key, domain, source: SOURCES[key], asOf, load: definition, onMetricError })
    ])
  )
  return createDomain(Object.fromEntries(entries))
}

function generalDefinitions(client) {
  return {
    users: () => countRows(client, 'user_profiles', 'user_id', (query) => query.eq('is_active', true)),
    roles: () => countRows(client, 'roles', 'id'),
    permissions: () => countRows(client, 'permissions', 'slug'),
    routes: () => countRows(client, 'dynamic_routes', 'id', (query) => query.eq('is_active', true))
  }
}

function pfpDefinitions(client) {
  return {
    students: async () => {
      const profiles = await selectRows(client, 'user_profiles', 'user_id,role,permissions,is_active')
      return filterStudentProfiles(profiles).length
    },
    institutions: () => countRows(client, 'institutions', 'InstitutionId'),
    places: () => countRows(client, 'places', 'PlaceId'),
    pfpInProgress: () =>
      countRows(client, 'student_result_vote', 'id', (query) =>
        query
          .in('status', ['assigned', 'published'])
          .eq('pfp_validee', false)
          .eq('pfp_echec', false)
          .eq('pfp_arret', false)
      )
  }
}

function academicDefinitions(client) {
  return {
    teachers: async () => {
      const profiles = await selectRows(client, 'user_profiles', 'role,permissions,is_active')
      return filterTeacherProfiles(profiles).length
    },
    courses: () => countRows(client, 'courses', 'id'),
    media: () => countRows(client, 'video_library', 'id'),
    modules: () => countRows(client, 'modules', 'id')
  }
}

function gamificationDefinitions(client) {
  return {
    activeChallenges: () =>
      countRows(client, 'challenges', 'id', (query) => query.eq('is_active', true)),
    completedQuests: () => sumColumn(client, 'quests', 'completion_count'),
    badges: () => countRows(client, 'badges', 'id', (query) => query.eq('is_active', true)),
    activeUsers: () =>
      countRows(client, 'gamification_data', 'id', (query) => query.gt('total_xp', 0))
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
    async loadStats(requestedDomains = Object.keys(DOMAIN_DEFINITIONS)) {
      const asOf = now().toISOString()
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
              onMetricError
            )
          ])
        )
      )
      return createDashboardStatsResponse({ domains, asOf })
    }
  }
}

module.exports = {
  DOMAIN_DEFINITIONS,
  SOURCES,
  countRows,
  createAdminDashboardStatsService,
  selectRows,
  sumColumn
}
