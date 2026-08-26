const CONTRACT_VERSION = '1'
const DASHBOARD_TIMEZONE = 'Europe/Zurich'
const DASHBOARD_DOMAINS = Object.freeze(['general', 'pfp', 'academic', 'gamification'])
const METRIC_STATUSES = new Set(['ok', 'unavailable', 'error'])
const DOMAIN_STATUSES = new Set(['ok', 'partial', 'unavailable', 'error'])
const FORBIDDEN_PERSONAL_FIELDS = new Set([
  'email',
  'display_name',
  'family_name',
  'forname',
  'firebase_id',
  'user_id'
])

function lifetimePeriod() {
  return Object.freeze({
    key: 'lifetime',
    start: null,
    end: null,
    timezone: DASHBOARD_TIMEZONE
  })
}

function createMetric({ value = null, status = 'ok', source, asOf, error = null }) {
  if (!METRIC_STATUSES.has(status)) throw new Error(`Statut de métrique invalide: ${status}`)
  if (!source) throw new Error('La source de la métrique est obligatoire.')
  if (!asOf) throw new Error('La date de fraîcheur de la métrique est obligatoire.')
  if (status === 'ok' && (!Number.isFinite(value) || value < 0)) {
    throw new Error('Une métrique disponible doit être un nombre positif ou nul.')
  }
  if (status !== 'ok' && value !== null) {
    throw new Error('Une métrique indisponible ou en erreur ne doit pas exposer de valeur.')
  }

  return Object.freeze({
    value,
    status,
    source,
    asOf,
    period: lifetimePeriod(),
    error: status === 'ok' ? null : error || 'METRIC_UNAVAILABLE'
  })
}

function deriveDomainStatus(metrics) {
  const statuses = Object.values(metrics).map((metric) => metric.status)
  if (!statuses.length || statuses.every((status) => status === 'unavailable')) return 'unavailable'
  if (statuses.every((status) => status === 'error')) return 'error'
  if (statuses.every((status) => status === 'ok')) return 'ok'
  return 'partial'
}

function createDomain(metrics) {
  const status = deriveDomainStatus(metrics)
  if (!DOMAIN_STATUSES.has(status)) throw new Error(`Statut de domaine invalide: ${status}`)
  return Object.freeze({ status, metrics: Object.freeze({ ...metrics }) })
}

function assertNoPersonalData(value, path = 'response') {
  if (!value || typeof value !== 'object') return
  for (const [key, entry] of Object.entries(value)) {
    if (FORBIDDEN_PERSONAL_FIELDS.has(String(key).toLowerCase())) {
      throw new Error(`Champ personnel interdit dans le contrat dashboard: ${path}.${key}`)
    }
    assertNoPersonalData(entry, `${path}.${key}`)
  }
}

function createDashboardStatsResponse({ domains, asOf }) {
  if (!asOf) throw new Error('La date de fraîcheur de la réponse est obligatoire.')
  for (const domain of Object.keys(domains)) {
    if (!DASHBOARD_DOMAINS.includes(domain)) throw new Error(`Domaine dashboard inconnu: ${domain}`)
  }

  const response = {
    version: CONTRACT_VERSION,
    asOf,
    period: lifetimePeriod(),
    domains: Object.freeze({ ...domains })
  }
  assertNoPersonalData(response)
  return Object.freeze(response)
}

function validateDashboardStatsResponse(response) {
  if (!response || response.version !== CONTRACT_VERSION) return false
  if (!response.asOf || !response.period || !response.domains) return false
  if (response.period.timezone !== DASHBOARD_TIMEZONE) return false

  try {
    assertNoPersonalData(response)
    for (const [domainName, domain] of Object.entries(response.domains)) {
      if (!DASHBOARD_DOMAINS.includes(domainName) || !DOMAIN_STATUSES.has(domain?.status)) return false
      if (!domain.metrics || typeof domain.metrics !== 'object') return false
      for (const metric of Object.values(domain.metrics)) {
        if (!METRIC_STATUSES.has(metric?.status)) return false
        if (!metric.source || !metric.asOf || metric.period?.timezone !== DASHBOARD_TIMEZONE)
          return false
        if (metric.status === 'ok' && (!Number.isFinite(metric.value) || metric.value < 0))
          return false
        if (metric.status !== 'ok' && metric.value !== null) return false
      }
    }
  } catch (_) {
    return false
  }
  return true
}

module.exports = {
  CONTRACT_VERSION,
  DASHBOARD_DOMAINS,
  DASHBOARD_TIMEZONE,
  assertNoPersonalData,
  createDashboardStatsResponse,
  createDomain,
  createMetric,
  lifetimePeriod,
  validateDashboardStatsResponse
}
