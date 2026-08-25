export const INSTITUTION_CRITERIA = ['AIGU', 'AMBU', 'MSQ', 'NEUROGER', 'SYSINT', 'REHAB']
export const INSTITUTION_LANGUAGES = ['FR', 'DE', 'IT', 'ENG']
export const INSTITUTION_PFP_TYPES = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']

export const EMPTY_INSTITUTION_FILTERS = Object.freeze({
  cantons: [],
  criter: [],
  languages: [],
  pfp: [],
})

const normalizeText = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .trim()
  .toLocaleLowerCase('fr-CH')

const normalizeId = (value) => String(value ?? '')

const isEnabledFlag = (value) => (
  value === true || value === 1 || normalizeText(value) === 'true' || normalizeText(value) === '1'
)

export function hasPfpOffer(value) {
  if (value == null || value === false) return false
  if (typeof value === 'number') return Number.isFinite(value) && value > 0
  if (typeof value === 'string') {
    const normalized = value.trim()
    if (!normalized) return false
    const numeric = Number(normalized.replace(',', '.'))
    return Number.isFinite(numeric) ? numeric > 0 : ['true', 'oui', 'yes'].includes(normalizeText(normalized))
  }
  if (Array.isArray(value)) return value.some(hasPfpOffer)
  if (typeof value === 'object') return Object.values(value).some(hasPfpOffer)
  return value === true
}

export function createInstitutionPlaceIndex(places = []) {
  return places.reduce((index, place) => {
    const institutionId = normalizeId(place?.InstitutionId)
    if (!institutionId) return index
    if (!index.has(institutionId)) index.set(institutionId, [])
    index.get(institutionId).push(place)
    return index
  }, new Map())
}

export function normalizeInstitutionFilters(filters = {}) {
  return {
    cantons: Array.isArray(filters.cantons) ? filters.cantons.filter(Boolean) : [],
    criter: Array.isArray(filters.criter) ? filters.criter.filter(Boolean) : [],
    languages: Array.isArray(filters.languages) ? filters.languages.filter(Boolean) : [],
    pfp: Array.isArray(filters.pfp) ? filters.pfp.filter(Boolean) : [],
  }
}

function matchesSearch(institution, searchTerm) {
  const search = normalizeText(searchTerm)
  if (!search) return true
  return [
    institution?.Name,
    institution?.Locality,
    institution?.Canton,
    institution?.InstitutionId,
    institution?.id,
    institution?.Address,
  ].some((value) => normalizeText(value).includes(search))
}

function matchesOneOf(place, selectedValues, matcher) {
  return selectedValues.length === 0 || selectedValues.some((value) => matcher(place, value))
}

export function placeMatchesInstitutionFilters(place, filters = EMPTY_INSTITUTION_FILTERS) {
  const normalized = normalizeInstitutionFilters(filters)
  return (
    matchesOneOf(place, normalized.criter, (row, key) => isEnabledFlag(row?.[key])) &&
    matchesOneOf(place, normalized.languages, (row, key) => isEnabledFlag(row?.[key])) &&
    matchesOneOf(place, normalized.pfp, (row, key) => hasPfpOffer(row?.[key]))
  )
}

export function filterInstitutions({ institutions = [], places = [], filters, searchTerm = '' } = {}) {
  const normalized = normalizeInstitutionFilters(filters)
  const placesByInstitution = createInstitutionPlaceIndex(places)
  const hasPlaceFilters = normalized.criter.length > 0 || normalized.languages.length > 0 || normalized.pfp.length > 0
  const selectedCantons = normalized.cantons.map(normalizeText)

  return institutions.filter((institution) => {
    if (institution?.is_hidden === true) return false
    if (!matchesSearch(institution, searchTerm)) return false
    if (selectedCantons.length > 0 && !selectedCantons.includes(normalizeText(institution?.Canton))) return false
    if (!hasPlaceFilters) return true

    const institutionId = normalizeId(institution?.InstitutionId ?? institution?.id)
    return (placesByInstitution.get(institutionId) || [])
      .some((place) => placeMatchesInstitutionFilters(place, normalized))
  })
}

export function getAvailableCantons(institutions = []) {
  return [...new Set(
    institutions
      .filter((institution) => institution?.is_hidden !== true)
      .map((institution) => String(institution?.Canton ?? '').trim())
      .filter(Boolean),
  )].sort((a, b) => a.localeCompare(b, 'fr-CH'))
}

export function hasValidInstitutionCoordinates(institution) {
  const latitude = institution?.Latitude
  const longitude = institution?.Longitude
  if (latitude == null || longitude == null || String(latitude).trim() === '' || String(longitude).trim() === '') return false
  return Number.isFinite(Number(latitude)) && Number.isFinite(Number(longitude))
}
