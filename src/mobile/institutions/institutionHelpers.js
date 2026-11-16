import {
  INSTITUTION_CRITERIA,
  INSTITUTION_LANGUAGES,
  INSTITUTION_PFP_TYPES,
  hasPfpOffer,
} from '@/service/institutionFiltersService'

// Libellés lisibles des codes utilisés par la plateforme (les codes restent affichés).
export const CRITERIA_LABELS = Object.freeze({
  AIGU: 'Soins aigus',
  AMBU: 'Ambulatoire',
  MSQ: 'Musculo-squelettique',
  NEUROGER: 'Neuro-gériatrie',
  SYSINT: 'Systèmes internes',
  REHAB: 'Réadaptation',
})

export const LANGUAGE_LABELS = Object.freeze({
  FR: 'Français',
  DE: 'Allemand',
  IT: 'Italien',
  ENG: 'Anglais',
})

const LANGUAGE_ALIASES = { FR: 'Français', DE: 'Allemand', ALL: 'Allemand', IT: 'Italien', EN: 'Anglais', ENG: 'Anglais' }

/** Langue d'une institution en toutes lettres (« FR » → « Français », « FR/ALL » → « Français, Allemand »). */
export function languageLabel(value) {
  return String(value || '')
    .split(/[\s,;/+&-]+/)
    .filter(Boolean)
    .map((code) => LANGUAGE_ALIASES[code.toUpperCase()] || code)
    .join(', ')
}

const isOn = (value) => value === true || value === 1 || ['true', '1'].includes(String(value ?? '').trim().toLowerCase())

/** Groupes de filtres proposés dans le panneau, dans l'ordre d'affichage. */
export function buildFilterGroups(cantons = []) {
  return [
    { key: 'pfp', label: 'Stage', options: INSTITUTION_PFP_TYPES.map((value) => ({ value, label: value })) },
    {
      key: 'criter',
      label: 'Domaine',
      options: INSTITUTION_CRITERIA.map((value) => ({ value, label: value, hint: CRITERIA_LABELS[value] })),
    },
    {
      key: 'languages',
      label: 'Langue',
      options: INSTITUTION_LANGUAGES.map((value) => ({ value, label: LANGUAGE_LABELS[value] || value })),
    },
    { key: 'cantons', label: 'Canton', options: cantons.map((value) => ({ value, label: value })) },
  ]
}

export const emptyFilters = () => ({ cantons: [], criter: [], languages: [], pfp: [] })

export const countActiveFilters = (filters = {}) =>
  ['cantons', 'criter', 'languages', 'pfp'].reduce((total, key) => total + (filters[key]?.length || 0), 0)

/** Ajoute ou retire une valeur d'un groupe de filtres, sans modifier l'objet d'origine. */
export function toggleFilter(filters, group, value) {
  const current = filters[group] || []
  const next = current.includes(value) ? current.filter((item) => item !== value) : [...current, value]
  return { ...emptyFilters(), ...filters, [group]: next }
}

/** Pastilles des filtres actifs : [{ group, value, label }]. */
export function activeFilterChips(filters = {}) {
  const labelOf = (group, value) => (group === 'languages' ? LANGUAGE_LABELS[value] || value : value)
  return ['pfp', 'criter', 'languages', 'cantons'].flatMap((group) =>
    (filters[group] || []).map((value) => ({ group, value, label: labelOf(group, value) })))
}

/** Ce qu'une institution propose, d'après ses places : domaines, langues, stages. */
export function summarizeOffer(places = []) {
  const collect = (keys, test) => keys.filter((key) => places.some((place) => test(place?.[key])))
  return {
    criteria: collect(INSTITUTION_CRITERIA, isOn),
    languages: collect(INSTITUTION_LANGUAGES, isOn),
    pfp: collect(INSTITUTION_PFP_TYPES, hasPfpOffer),
  }
}

/** Offre de chaque institution : Map(id → { criteria, languages, pfp }). */
export function indexOffers(places = []) {
  const byInstitution = new Map()
  places.forEach((place) => {
    const id = String(place?.InstitutionId ?? '')
    if (!id) return
    if (!byInstitution.has(id)) byInstitution.set(id, [])
    byInstitution.get(id).push(place)
  })
  return new Map([...byInstitution.entries()].map(([id, list]) => [id, summarizeOffer(list)]))
}

export function formatWebsiteUrl(url) {
  const value = String(url || '').trim()
  if (!value) return ''
  return /^https?:\/\//i.test(value) ? value : `https://${value}`
}

/**
 * Documents d'une institution : le lien propre à chaque place d'abord, sinon
 * le document commun de l'institution. Une même adresse n'apparaît qu'une fois.
 */
export function buildInstitutionFiles(institution, places = []) {
  const globalUrl = String(institution?.CyberleanURL || institution?.CyberlearnURL || '').trim()
  const files = new Map()
  places.forEach((place) => {
    const own = String(place?.fileurl || place?.fileURL || place?.CyberleanURL || place?.CyberlearnURL || '').trim()
    const url = own || globalUrl
    if (!url || files.has(url)) return
    files.set(url, { name: place?.NomPlace || 'Document sans nom', url, isGlobal: !own })
  })
  if (globalUrl && !files.has(globalUrl)) {
    files.set(globalUrl, { name: 'Concept de formation pratique', url: globalUrl, isGlobal: true })
  }
  return [...files.values()].sort((a, b) => Number(a.isGlobal) - Number(b.isGlobal))
}

/** Adresse d'itinéraire : s'ouvre dans l'application de cartes du téléphone. */
export function directionsUrl(institution) {
  const lat = Number(institution?.Latitude)
  const lng = Number(institution?.Longitude)
  if (institution?.Latitude != null && institution?.Longitude != null && Number.isFinite(lat) && Number.isFinite(lng) && (lat || lng)) {
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
  }
  const address = [institution?.Name, institution?.Address, institution?.Locality].filter(Boolean).join(', ')
  return address ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}` : ''
}

const STAGE_STATUS = Object.freeze({
  validee: { label: 'Réussi', tone: 'ok' },
  echec: { label: 'Échec', tone: 'danger' },
  arret: { label: 'Arrêt', tone: 'danger' },
  en_attente: { label: 'En cours ou à venir', tone: 'muted' },
  a_verifier: { label: 'Résultat à vérifier', tone: 'muted' },
})

export const stageStatus = (status) => STAGE_STATUS[status] || STAGE_STATUS.en_attente

/** « 2 févr. – 13 mars 2027 », sinon l'année, sinon rien. */
export function formatStagePeriod(stage) {
  const format = (value, withYear) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return ''
    return date.toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', ...(withYear ? { year: 'numeric' } : {}) })
  }
  const start = stage?.startDate ? format(stage.startDate, !stage.endDate) : ''
  const end = stage?.endDate ? format(stage.endDate, true) : ''
  if (start && end) return `${start} – ${end}`
  return start || end || (stage?.year ? String(stage.year) : '')
}
