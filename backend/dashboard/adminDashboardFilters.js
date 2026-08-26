const { normalizeAudienceToken, normalizePermissions } = require('../security/userAudience')

const FILTER_KEYS = Object.freeze([
  'track',
  'role',
  'class',
  'cohort',
  'pfp',
  'institution',
  'status'
])
const MAX_VALUES_PER_FILTER = 20
const MAX_FILTER_VALUE_LENGTH = 120
const PFP_TYPES = Object.freeze(['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4'])
const PFP_STATUSES = Object.freeze(['draft', 'published', 'assigned'])

const FILTER_APPLICABILITY = Object.freeze({
  track: Object.freeze({ domains: ['general', 'pfp', 'academic'], metrics: ['users', 'students', 'teachers'] }),
  role: Object.freeze({ domains: ['general', 'pfp', 'academic'], metrics: ['users', 'students', 'teachers'] }),
  class: Object.freeze({ domains: ['general', 'pfp'], metrics: ['users', 'students'] }),
  cohort: Object.freeze({ domains: ['general', 'pfp'], metrics: ['users', 'students'] }),
  pfp: Object.freeze({ domains: ['pfp'], metrics: ['places', 'pfpInProgress'] }),
  institution: Object.freeze({ domains: ['pfp'], metrics: ['institutions', 'places', 'pfpInProgress'] }),
  status: Object.freeze({ domains: ['pfp'], metrics: ['pfpInProgress'] })
})

function filterError(message, code = 'FILTER_INVALID') {
  const error = new Error(message)
  error.status = 400
  error.code = code
  return error
}

function rawValues(value) {
  if (value === undefined || value === null || value === '') return []
  return (Array.isArray(value) ? value : [value]).flatMap((entry) => String(entry).split(','))
}

function normalizeFilterValues(key, value) {
  const values = [...new Set(rawValues(value).map((entry) => entry.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'fr-CH')
  )
  if (values.length > MAX_VALUES_PER_FILTER) {
    throw filterError(`Le filtre ${key} contient trop de valeurs.`)
  }
  for (const entry of values) {
    const containsControlCharacter = [...entry].some((character) => {
      const code = character.charCodeAt(0)
      return code <= 31 || code === 127
    })
    if (entry.length > MAX_FILTER_VALUE_LENGTH || containsControlCharacter) {
      throw filterError(`Une valeur du filtre ${key} est invalide.`)
    }
  }
  if (key === 'pfp' && values.some((entry) => !PFP_TYPES.includes(entry))) {
    throw filterError('Une valeur PFP est invalide.')
  }
  if (key === 'status' && values.some((entry) => !PFP_STATUSES.includes(entry))) {
    throw filterError('Un statut PFP est invalide.')
  }
  return values
}

function parseDashboardFilters(query = {}) {
  const unknownKeys = Object.keys(query).filter(
    (key) => !['domains', 'period', 'reference', ...FILTER_KEYS].includes(key)
  )
  if (unknownKeys.length) throw filterError('Un paramètre de filtre est inconnu.')

  return Object.freeze(
    Object.fromEntries(
      FILTER_KEYS.map((key) => [key, normalizeFilterValues(key, query[key])]).filter(
        ([, values]) => values.length
      )
    )
  )
}

function validateFilterCombination(filters, domains) {
  for (const key of Object.keys(filters || {})) {
    const applicability = FILTER_APPLICABILITY[key]
    if (!applicability || !applicability.domains.some((domain) => domains.includes(domain))) {
      throw filterError(
        `Le filtre ${key} ne s'applique pas aux domaines demandés.`,
        'FILTER_COMBINATION_INVALID'
      )
    }
  }
  return filters
}

function filterProfiles(profiles, filters = {}) {
  const roleTokens = new Set((filters.role || []).map(normalizeAudienceToken))
  return (profiles || []).filter((profile) => {
    if (filters.track?.length && !filters.track.includes(String(profile.primary_track_id || ''))) return false
    if (filters.class?.length && !filters.class.includes(String(profile.classe || ''))) return false
    if (filters.cohort?.length && !filters.cohort.includes(String(profile.pfp_cohort || ''))) return false
    if (roleTokens.size) {
      const tokens = [
        normalizeAudienceToken(profile.role),
        ...normalizePermissions(profile.permissions).map(normalizeAudienceToken)
      ]
      if (!tokens.some((token) => roleTokens.has(token))) return false
    }
    return true
  })
}

function applyColumnFilter(query, column, values) {
  if (!values?.length) return query
  return values.length === 1 ? query.eq(column, values[0]) : query.in(column, values)
}

function applyPlaceFilters(query, filters = {}) {
  let filtered = applyColumnFilter(query, 'InstitutionName', filters.institution)
  if (filters.pfp?.length === 1) filtered = filtered.not(filters.pfp[0], 'eq', {})
  else if (filters.pfp?.length) {
    filtered = filtered.or(filters.pfp.map((pfp) => `${pfp}.not.eq.{}`).join(','))
  }
  return filtered
}

function applyResultFilters(query, filters = {}) {
  let filtered = applyColumnFilter(query, 'pfp_type', filters.pfp)
  filtered = applyColumnFilter(filtered, 'assigned_institution_name', filters.institution)
  return applyColumnFilter(filtered, 'status', filters.status)
}

function publicApplicability(domains) {
  return Object.fromEntries(
    Object.entries(FILTER_APPLICABILITY)
      .filter(([, value]) => value.domains.some((domain) => domains.includes(domain)))
      .map(([key, value]) => [
        key,
        {
          domains: value.domains.filter((domain) => domains.includes(domain)),
          metrics: [...value.metrics]
        }
      ])
  )
}

function option(value, label = value) {
  const normalizedValue = String(value || '').trim()
  const normalizedLabel = String(label || normalizedValue).trim()
  if (!normalizedValue || !normalizedLabel) return null
  return { value: normalizedValue, label: normalizedLabel }
}

function uniqueOptions(entries) {
  return [...new Map(entries.filter(Boolean).map((entry) => [entry.value, entry])).values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'fr-CH')
  )
}

async function readOptions(client, table, columns, mapper) {
  const { data, error } = await client.from(table).select(columns)
  if (error) {
    const wrapped = new Error(`Impossible de lire ${table}.`)
    wrapped.code = error.code || 'UPSTREAM_QUERY_FAILED'
    throw wrapped
  }
  return uniqueOptions((data || []).map(mapper))
}

async function loadDashboardFilterOptions(client, domains) {
  const includesPeople = domains.some((domain) => ['general', 'pfp', 'academic'].includes(domain))
  const includesPfp = domains.includes('pfp')
  const options = {}

  if (includesPeople) {
    const [tracks, roles, classes] = await Promise.all([
      readOptions(client, 'tracks', 'id,label,is_active', (row) =>
        row.is_active === false ? null : option(row.id, row.label)
      ),
      readOptions(client, 'roles', 'slug,label', (row) => option(row.slug, row.label || row.slug)),
      readOptions(client, 'classes', 'code,name', (row) => option(row.code, row.code || row.name))
    ])
    Object.assign(options, {
      tracks,
      roles,
      classes,
      cohorts: [option('PFP1A'), option('PFP1B')]
    })
  }

  if (includesPfp) {
    options.pfpTypes = PFP_TYPES.map((value) => option(value))
    options.institutions = await readOptions(client, 'institutions', 'Name,is_hidden', (row) =>
      row.is_hidden ? null : option(row.Name)
    )
    options.statuses = [
      option('draft', 'Brouillon'),
      option('published', 'Publié'),
      option('assigned', 'Attribué')
    ]
  }

  return Object.freeze({
    version: '1',
    domains: [...domains],
    options: Object.freeze(options),
    applicability: Object.freeze(publicApplicability(domains))
  })
}

module.exports = {
  FILTER_APPLICABILITY,
  FILTER_KEYS,
  MAX_VALUES_PER_FILTER,
  PFP_STATUSES,
  PFP_TYPES,
  applyColumnFilter,
  applyPlaceFilters,
  applyResultFilters,
  filterProfiles,
  loadDashboardFilterOptions,
  normalizeFilterValues,
  parseDashboardFilters,
  publicApplicability,
  validateFilterCombination
}
