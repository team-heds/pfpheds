import { API_URL, authFetch } from '@/service/apiClient'

export const ADMIN_DASHBOARD_DOMAINS = Object.freeze([
  'general',
  'pfp',
  'academic',
  'gamification',
])

export const ADMIN_DASHBOARD_PERIODS = Object.freeze([
  'day',
  'week',
  'month',
  'quarter',
  'year',
])
export const ADMIN_DASHBOARD_FILTER_KEYS = Object.freeze([
  'track',
  'role',
  'class',
  'cohort',
  'pfp',
  'institution',
  'status',
])

const METRIC_STATUSES = new Set(['ok', 'unavailable', 'error'])
const DOMAIN_STATUSES = new Set(['ok', 'partial', 'unavailable', 'error'])
const METRIC_SEMANTICS = new Set(['flow', 'snapshot', 'cumulative'])
const DASHBOARD_TIMEZONE = 'Europe/Zurich'
const CACHE_TTL_MS = 30_000
const responseCache = new Map()
const inFlightRequests = new Map()

const UI_METRIC_KEYS = Object.freeze({
  general: Object.freeze({
    users: 'users',
    roles: 'roles',
    permissions: 'permissions',
    routes: 'routes',
  }),
  pfp: Object.freeze({
    students: 'etudiants',
    institutions: 'institutions',
    places: 'places',
    pfpInProgress: 'pfpEnCours',
  }),
  academic: Object.freeze({
    teachers: 'enseignants',
    courses: 'cours',
    media: 'media',
    modules: 'modules',
  }),
  gamification: Object.freeze({
    activeChallenges: 'challengesActive',
    completedQuests: 'quests',
    badges: 'badges',
    activeUsers: 'usersActive',
  }),
})

function uniqueDomains(domains = ADMIN_DASHBOARD_DOMAINS) {
  const requested = Array.isArray(domains) ? domains : [domains]
  const unique = [...new Set(requested.filter(Boolean))]
  if (!unique.length || unique.some((domain) => !ADMIN_DASHBOARD_DOMAINS.includes(domain))) {
    throw new TypeError('Un ou plusieurs domaines dashboard sont invalides.')
  }
  return ADMIN_DASHBOARD_DOMAINS.filter((domain) => unique.includes(domain))
}

function validatePeriod(period) {
  const resolved = period || 'month'
  if (!ADMIN_DASHBOARD_PERIODS.includes(resolved)) {
    throw new TypeError('La période dashboard est invalide.')
  }
  return resolved
}

function validateReference(reference) {
  if (reference === undefined || reference === null || reference === '') return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(reference))) {
    throw new TypeError('La date de référence dashboard est invalide.')
  }
  return String(reference)
}

export function normalizeAdminDashboardFilters(filters = {}) {
  const unknownKeys = Object.keys(filters || {}).filter(
    (key) => !ADMIN_DASHBOARD_FILTER_KEYS.includes(key),
  )
  if (unknownKeys.length) throw new TypeError('Un filtre dashboard est invalide.')
  return Object.fromEntries(
    ADMIN_DASHBOARD_FILTER_KEYS.map((key) => {
      const raw = filters?.[key]
      const values = (Array.isArray(raw) ? raw : raw ? [raw] : [])
        .map((value) => String(value).trim())
        .filter(Boolean)
      return [key, [...new Set(values)].sort((a, b) => a.localeCompare(b, 'fr-CH'))]
    }).filter(([, values]) => values.length),
  )
}

function requestOptions(options = {}) {
  return {
    domains: uniqueDomains(options.domains),
    period: validatePeriod(options.period),
    reference: validateReference(options.reference),
    filters: normalizeAdminDashboardFilters(options.filters),
  }
}

function requestKey(options) {
  return `${options.domains.join(',')}|${options.period}|${options.reference || ''}|${JSON.stringify(options.filters)}`
}

function appendFilters(params, filters) {
  for (const key of ADMIN_DASHBOARD_FILTER_KEYS) {
    for (const value of filters[key] || []) params.append(key, value)
  }
  return params
}

export function buildAdminDashboardStatsUrl(options = {}) {
  const resolved = requestOptions(options)
  const params = new URLSearchParams({
    domains: resolved.domains.join(','),
    period: resolved.period,
  })
  if (resolved.reference) params.set('reference', resolved.reference)
  appendFilters(params, resolved.filters)
  return `${String(API_URL).replace(/\/+$/, '')}/admin-dashboard/v1/stats?${params}`
}

export function buildAdminDashboardFilterOptionsUrl(options = {}) {
  const domains = uniqueDomains(options.domains)
  const params = new URLSearchParams({ domains: domains.join(',') })
  return `${String(API_URL).replace(/\/+$/, '')}/admin-dashboard/v1/filter-options?${params}`
}

export function buildGamificationActivityUrl(limit = 20) {
  const safeLimit = Math.max(1, Math.min(Number(limit) || 20, 50))
  return `${String(API_URL).replace(/\/+$/, '')}/admin-dashboard/v1/gamification/activity?limit=${safeLimit}`
}

export async function fetchGamificationActivity(options = {}) {
  const response = await authFetch(buildGamificationActivityUrl(options.limit), {
    method: 'GET',
    signal: options.signal,
  })
  const payload = await response.json()
  if (payload?.version !== '1' || !Array.isArray(payload.activities)) {
    throw new TypeError('Le contrat des activités gamification est invalide.')
  }
  return payload.activities.filter((activity) =>
    activity && typeof activity.title === 'string' && typeof activity.occurredAt === 'string'
  )
}

export function validateAdminDashboardFilterOptions(payload, requestedDomains) {
  if (!payload || payload.version !== '1' || !payload.options || !payload.applicability) {
    throw new TypeError('Le contrat des filtres admin est invalide.')
  }
  const domains = uniqueDomains(requestedDomains)
  if (!Array.isArray(payload.domains) || payload.domains.some((domain) => !domains.includes(domain))) {
    throw new TypeError('Les domaines des filtres admin sont invalides.')
  }
  for (const entries of Object.values(payload.options)) {
    if (!Array.isArray(entries)) throw new TypeError('Une liste de filtres admin est invalide.')
    for (const entry of entries) {
      if (!entry?.value || !entry?.label) throw new TypeError('Une option de filtre admin est invalide.')
    }
  }
  return payload
}

export async function fetchAdminDashboardFilterOptions(options = {}) {
  const domains = uniqueDomains(options.domains)
  const response = await authFetch(buildAdminDashboardFilterOptionsUrl({ domains }), {
    method: 'GET',
    signal: options.signal,
  })
  return validateAdminDashboardFilterOptions(await response.json(), domains)
}

export function validateAdminDashboardStatsResponse(payload, requestedDomains = ADMIN_DASHBOARD_DOMAINS) {
  if (
    !payload ||
    payload.version !== '1' ||
    !payload.asOf ||
    payload.period?.timezone !== DASHBOARD_TIMEZONE ||
    payload.previousPeriod?.timezone !== DASHBOARD_TIMEZONE ||
    !payload.domains
  ) {
    throw new TypeError('Le contrat du dashboard admin est invalide.')
  }

  const domains = uniqueDomains(requestedDomains)
  if (payload.appliedFilters !== undefined) normalizeAdminDashboardFilters(payload.appliedFilters)
  for (const domainName of domains) {
    const domain = payload.domains[domainName]
    if (!domain || !DOMAIN_STATUSES.has(domain.status) || !domain.metrics) {
      throw new TypeError(`Le domaine dashboard ${domainName} est invalide.`)
    }
    for (const metric of Object.values(domain.metrics)) {
      if (!metric || !METRIC_STATUSES.has(metric.status)) {
        throw new TypeError(`Une métrique du domaine ${domainName} est invalide.`)
      }
      if (
        !metric.source ||
        !metric.asOf ||
        metric.period?.timezone !== DASHBOARD_TIMEZONE ||
        !METRIC_SEMANTICS.has(metric.semantics)
      ) {
        throw new TypeError(`Le contexte d'une métrique du domaine ${domainName} est invalide.`)
      }
      if (metric.status === 'ok' && (!Number.isFinite(metric.value) || metric.value < 0)) {
        throw new TypeError(`Une valeur du domaine ${domainName} est invalide.`)
      }
      if (metric.status !== 'ok' && metric.value !== null) {
        throw new TypeError(`Une métrique indisponible du domaine ${domainName} expose une valeur.`)
      }

      const comparison = metric.comparison
      if (
        !comparison ||
        !METRIC_STATUSES.has(comparison.status) ||
        comparison.period?.timezone !== DASHBOARD_TIMEZONE
      ) {
        throw new TypeError(`La comparaison d'une métrique du domaine ${domainName} est invalide.`)
      }
      if (comparison.status === 'ok') {
        if (
          !Number.isFinite(comparison.value) ||
          comparison.value < 0 ||
          !Number.isFinite(comparison.absoluteChange) ||
          (comparison.percentChange !== null && !Number.isFinite(comparison.percentChange))
        ) {
          throw new TypeError(`Une valeur de comparaison du domaine ${domainName} est invalide.`)
        }
      } else if (
        comparison.value !== null ||
        comparison.absoluteChange !== null ||
        comparison.percentChange !== null
      ) {
        throw new TypeError(`Une comparaison indisponible du domaine ${domainName} expose une valeur.`)
      }
    }
  }
  return payload
}

export async function fetchAdminDashboardStats(options = {}) {
  const resolved = requestOptions(options)
  const key = requestKey(resolved)
  const cached = responseCache.get(key)
  if (!options.force && cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached.data
  }
  if (inFlightRequests.has(key)) return inFlightRequests.get(key)

  const request = (async () => {
    const response = await authFetch(buildAdminDashboardStatsUrl(resolved), {
      method: 'GET',
      signal: options.signal,
    })
    const payload = validateAdminDashboardStatsResponse(await response.json(), resolved.domains)
    responseCache.set(key, { cachedAt: Date.now(), data: payload })
    return payload
  })().finally(() => {
    inFlightRequests.delete(key)
  })

  inFlightRequests.set(key, request)
  return request
}

export function clearAdminDashboardStatsCache() {
  responseCache.clear()
  inFlightRequests.clear()
}

function comparisonLabel(comparison) {
  if (comparison?.status === 'ok') {
    const percent = comparison.percentChange
    if (percent === null) return `vs ${comparison.value.toLocaleString('fr-CH')}`
    const prefix = percent > 0 ? '+' : ''
    return `${prefix}${percent}% vs période précédente`
  }
  return 'Historique indisponible'
}

export function mapAdminDashboardKpis(domainName, configurations = [], payload, options = {}) {
  const domain = payload?.domains?.[domainName]
  const metricMap = UI_METRIC_KEYS[domainName] || {}
  const metricsByUiKey = Object.fromEntries(
    Object.entries(metricMap).map(([serverKey, uiKey]) => [uiKey, domain?.metrics?.[serverKey]]),
  )

  return configurations.map((configuration) => {
    const metric = metricsByUiKey[configuration.dataKey]
    const metricStatus = options.loading ? 'loading' : metric?.status || 'unavailable'
    const comparison = metric?.comparison
    const comparisonAvailable = comparison?.status === 'ok'

    return {
      ...configuration,
      value: metricStatus === 'ok' ? metric.value : null,
      status: metricStatus,
      error: metric?.error || (metricStatus === 'unavailable' ? 'METRIC_UNAVAILABLE' : null),
      loading: Boolean(options.loading),
      trend: comparisonAvailable ? comparison.percentChange : null,
      comparison: metricStatus === 'ok' ? comparisonLabel(comparison) : '',
      previousValue: comparisonAvailable ? comparison.value : undefined,
      comparisonData: comparison || null,
      source: metric?.source || null,
      asOf: metric?.asOf || payload?.asOf || null,
      semantics: metric?.semantics || null,
      chartData: [],
      alerts: [],
    }
  })
}

export function getAdminDashboardMetric(payload, domain, key) {
  return payload?.domains?.[domain]?.metrics?.[key] || null
}
