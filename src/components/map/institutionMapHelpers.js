import {
  createInstitutionPlaceIndex,
  hasPfpOffer,
  hasValidInstitutionCoordinates,
  INSTITUTION_CRITERIA,
  INSTITUTION_PFP_TYPES,
  placeMatchesInstitutionFilters,
} from '@/service/institutionFiltersService'

// Vue de départ : le Valais, où se trouvent la plupart des institutions.
export const DEFAULT_CENTER = [46.25, 7.55]
export const DEFAULT_ZOOM = 9

// Cadre de la Suisse : une institution à l'étranger ne doit pas faire dézoomer sur le monde entier.
const SWISS_BOUNDS = { south: 45.7, north: 47.95, west: 5.8, east: 10.65 }

export const CRITERIA_LABELS = Object.freeze({
  AIGU: 'Soins aigus',
  AMBU: 'Ambulatoire',
  MSQ: 'Musculo-squelettique',
  NEUROGER: 'Neuro-gériatrie',
  SYSINT: 'Systèmes internes',
  REHAB: 'Réadaptation',
})

export const LANGUAGE_LABELS = Object.freeze({ FR: 'Français', DE: 'Allemand', IT: 'Italien', ENG: 'Anglais' })

const LANGUAGE_ALIASES = { FR: 'Français', DE: 'Allemand', ALL: 'Allemand', IT: 'Italien', EN: 'Anglais', ENG: 'Anglais' }

/** Langue d'une institution en toutes lettres (« FR/ALL » → « Français, Allemand »). */
export function languageLabel(value) {
  return String(value || '')
    .split(/[\s,;/+&-]+/)
    .filter(Boolean)
    .map((code) => LANGUAGE_ALIASES[code.toUpperCase()] || code)
    .join(', ')
}

export const institutionKey = (institution) => String(institution?.InstitutionId ?? institution?.id ?? '')

/** Coordonnées [lat, lng] d'une institution, ou null si elle ne peut pas être placée. */
export function institutionLatLng(institution) {
  if (!hasValidInstitutionCoordinates(institution)) return null
  const lat = Number(institution.Latitude)
  const lng = Number(institution.Longitude)
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null
  return [lat, lng]
}

export const isInSwitzerland = ([lat, lng]) =>
  lat >= SWISS_BOUNDS.south && lat <= SWISS_BOUNDS.north && lng >= SWISS_BOUNDS.west && lng <= SWISS_BOUNDS.east

/**
 * Cadre à afficher pour voir des points : [[sud, ouest], [nord, est]].
 * Par défaut les points hors de Suisse sont ignorés tant qu'il en reste en Suisse.
 */
export function boundsFor(points = [], { includeAbroad = false } = {}) {
  const swiss = includeAbroad ? points : points.filter(isInSwitzerland)
  const list = swiss.length ? swiss : points
  if (!list.length) return null
  const lats = list.map((point) => point[0])
  const lngs = list.map((point) => point[1])
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}

const isOn = (value) => value === true || value === 1 || ['true', '1'].includes(String(value ?? '').trim().toLowerCase())

/**
 * Ce que propose chaque institution, d'après ses places :
 * Map(id → { places, pfp: ['PFP2', …], criteria: ['REHAB', …] }).
 * `places` ne compte que les places qui correspondent aux filtres de stage, domaine et langue.
 */
export function summarizeOffers(places = [], filters = {}) {
  const summary = new Map()
  createInstitutionPlaceIndex(places).forEach((rows, id) => {
    summary.set(id, {
      places: rows.filter((row) => placeMatchesInstitutionFilters(row, filters)).length,
      pfp: INSTITUTION_PFP_TYPES.filter((key) => rows.some((row) => hasPfpOffer(row?.[key]))),
      criteria: INSTITUTION_CRITERIA.filter((key) => rows.some((row) => isOn(row?.[key]))),
    })
  })
  return summary
}

export const countActiveFilters = (filters = {}) =>
  ['cantons', 'criter', 'languages', 'pfp'].reduce((total, key) => total + (filters[key]?.length || 0), 0)

/**
 * Regroupe des points proches à l'écran.
 * `points` : [{ key, x, y }] en pixels ; renvoie [{ keys: [...], x, y }].
 * Regroupement glouton : chaque point rejoint le premier groupe dont le centre est à moins de `radius` px.
 */
export function clusterPoints(points = [], radius = 48) {
  const clusters = []
  points.forEach((point) => {
    const target = radius > 0
      ? clusters.find((cluster) => Math.hypot(cluster.x - point.x, cluster.y - point.y) <= radius)
      : null
    if (target) {
      target.keys.push(point.key)
      target.sumX += point.x
      target.sumY += point.y
      target.x = target.sumX / target.keys.length
      target.y = target.sumY / target.keys.length
    } else {
      clusters.push({ keys: [point.key], x: point.x, y: point.y, sumX: point.x, sumY: point.y })
    }
  })
  return clusters.map(({ keys, x, y }) => ({ keys, x, y }))
}

/** Décalages en pixels pour écarter des repères posés exactement au même endroit. */
export function spreadOffsets(count, distance = 26) {
  if (count <= 1) return [[0, 0]]
  return Array.from({ length: count }, (_, index) => {
    const angle = (2 * Math.PI * index) / count - Math.PI / 2
    return [Math.round(Math.cos(angle) * distance), Math.round(Math.sin(angle) * distance)]
  })
}

export function directionsUrl(latLng) {
  if (!latLng) return ''
  return `https://www.google.com/maps/dir/?api=1&destination=${latLng[0]},${latLng[1]}`
}

export function websiteUrl(url) {
  const value = String(url || '').trim()
  if (!value) return ''
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

export const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`
