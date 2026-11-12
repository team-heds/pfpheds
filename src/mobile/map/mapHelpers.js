import { hasValidInstitutionCoordinates } from '@/service/institutionFiltersService'

// Vue de départ : le Valais, où se trouvent la plupart des institutions.
export const DEFAULT_CENTER = [46.25, 7.45]
export const DEFAULT_ZOOM = 9

// Cadre de la Suisse : sert à ne pas dézoomer sur le monde entier pour une
// institution lointaine (stage à l'étranger).
const SWISS_BOUNDS = { south: 45.7, north: 47.95, west: 5.8, east: 10.65 }

export const institutionKey = (institution) => String(institution?.InstitutionId ?? institution?.id ?? '')

export function institutionLatLng(institution) {
  if (!hasValidInstitutionCoordinates(institution)) return null
  const lat = Number(institution.Latitude)
  const lng = Number(institution.Longitude)
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180 || (lat === 0 && lng === 0)) return null
  return [lat, lng]
}

/** Institutions qu'on peut placer sur la carte : [{ institution, key, latLng }]. */
export function mappableInstitutions(institutions = []) {
  return institutions
    .map((institution) => ({ institution, key: institutionKey(institution), latLng: institutionLatLng(institution) }))
    .filter((item) => item.latLng && item.key)
}

const inSwitzerland = ([lat, lng]) =>
  lat >= SWISS_BOUNDS.south && lat <= SWISS_BOUNDS.north && lng >= SWISS_BOUNDS.west && lng <= SWISS_BOUNDS.east

/**
 * Cadre à afficher pour voir les points : [[sud, ouest], [nord, est]].
 * Les points hors de Suisse sont ignorés tant qu'il en reste en Suisse.
 */
export function boundsFor(points = []) {
  const swiss = points.filter(inSwitzerland)
  const list = swiss.length ? swiss : points
  if (!list.length) return null
  const lats = list.map((point) => point[0])
  const lngs = list.map((point) => point[1])
  return [
    [Math.min(...lats), Math.min(...lngs)],
    [Math.max(...lats), Math.max(...lngs)],
  ]
}

const normalize = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/[̀-ͯ]/g, '')
  .toLocaleLowerCase('fr-CH')
  .trim()

/** Suggestions de recherche sur la carte : le nom d'abord, puis la localité. */
export function searchOnMap(items = [], term = '', limit = 6) {
  const query = normalize(term)
  if (query.length < 2) return []
  const scored = []
  items.forEach((item) => {
    const name = normalize(item.institution.Name)
    const place = normalize(`${item.institution.Locality} ${item.institution.Canton}`)
    const score = name.startsWith(query) ? 0 : name.includes(query) ? 1 : place.includes(query) ? 2 : -1
    if (score >= 0) scored.push({ item, score, name })
  })
  return scored
    .sort((a, b) => a.score - b.score || a.name.localeCompare(b.name, 'fr-CH'))
    .slice(0, limit)
    .map((entry) => entry.item)
}

/** Distance à vol d'oiseau en kilomètres. */
export function distanceKm([lat1, lng1], [lat2, lng2]) {
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(km) {
  if (!Number.isFinite(km)) return ''
  if (km < 1) return `${Math.max(50, Math.round(km * 20) * 50)} m`
  return km < 10 ? `${km.toFixed(1).replace('.', ',')} km` : `${Math.round(km)} km`
}
