export const PROFILE_CRITERIA_KEYS = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU', 'FR', 'DE']

const LEGACY_CRITERIA_KEY_MAP = {
  AMBU: 'ambu',
  DE: 'de',
  FR: 'fr',
  MSQ: 'msq',
  NEUROGER: 'neuroger',
  REHAB: 'rehab',
  SYSINT: 'sysint',
  AIGU: 'aigu'
}

const PFP_TYPE_BY_INDEX = ['PFP1', 'PFP2', 'PFP3', 'PFP4']
const FP_NUMBER_MAP = { PFP1: 1, PFP2: 2, PFP3: 3, PFP4: 4 }

export const parseBooleanFlag = (value) => {
  if (value === true || value === 1) return true
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    return normalized === 'true' || normalized === '1' || normalized === 'yes' || normalized === 'oui' || normalized === 'vrai'
  }
  return false
}

export const normalizePfpType = (pfpType) => {
  if (pfpType === 'PFP1A' || pfpType === 'PFP1B') return 'PFP1'
  return pfpType || ''
}

export const getYearSortValue = (value) => {
  if (!value) return -1
  const str = String(value)
  const rangeMatch = str.match(/(\d{4})\s*-\s*(\d{4})/)
  if (rangeMatch) {
    const endYear = Number(rangeMatch[2])
    return Number.isFinite(endYear) ? endYear : -1
  }

  const singleMatch = str.match(/\d{4}/)
  if (!singleMatch) return -1
  const year = Number(singleMatch[0])
  return Number.isFinite(year) ? year : -1
}

export const parsePfpEntries = (value) => {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed
      if (parsed && typeof parsed === 'object') return Object.values(parsed)
      return []
    } catch (error) {
      return []
    }
  }
  if (typeof value === 'object') return Object.values(value)
  return []
}

export const normalizeProfileStageEntries = (entries = []) => {
  if (!Array.isArray(entries) || entries.length === 0) return []

  const firstNonPfp1Index = entries.findIndex((entry, idx) => {
    const type = normalizePfpType(resolveLegacyPfpType(entry, idx))
    return type && type !== 'PFP1'
  })

  if (firstNonPfp1Index === 0) {
    return [...entries]
  }

  const leadingEntries =
    firstNonPfp1Index >= 0 ? entries.slice(0, firstNonPfp1Index) : [...entries]
  const canonicalPfp1 = leadingEntries[0] || null
  const trailingEntries = firstNonPfp1Index >= 0 ? entries.slice(firstNonPfp1Index) : []

  return canonicalPfp1 ? [canonicalPfp1, ...trailingEntries] : trailingEntries
}

export const extractStudentsPhysioFieldEntries = (rows, fieldNames = ['pfp_valided', 'pfp2_data']) => {
  if (!Array.isArray(rows) || rows.length === 0) return []

  return rows.flatMap((row) => {
    if (!row || typeof row !== 'object') return []
    return fieldNames.flatMap((fieldName) => {
      const entries = parsePfpEntries(row[fieldName])
      return fieldName === 'pfp_valided' ? normalizeProfileStageEntries(entries) : entries
    })
  })
}

export const resolveLegacyPfpType = (entry, fallbackIndex = 0) => {
  const explicitType = entry?.pfp_type || entry?.type_pfp || entry?.PfpType || ''
  if (explicitType) return explicitType

  const numericStage = Number(entry?.pfp_number || entry?.fp_number || entry?.formation_number)
  if (Number.isFinite(numericStage) && numericStage >= 1 && numericStage <= 4) {
    return `PFP${numericStage}`
  }

  return PFP_TYPE_BY_INDEX[fallbackIndex] || ''
}

export const resolveStageNumber = (pfpType, entry, fallbackIndex = 0) => {
  const normalizedType = normalizePfpType(pfpType)
  const byType = FP_NUMBER_MAP[normalizedType]
  if (byType) return byType

  const numericStage = Number(entry?.pfp_number || entry?.fp_number || entry?.formation_number)
  if (Number.isFinite(numericStage) && numericStage >= 1 && numericStage <= 4) return numericStage

  return fallbackIndex + 1
}

export const resolvePlaceId = (entry) => {
  if (!entry || typeof entry !== 'object') return null
  return entry.assigned_place_id || entry.PlaceId || entry.ID_PFP || entry.id_pfp || null
}

const getMapCandidateKeys = (id) => {
  if (id === null || id === undefined || id === '') return []
  const value = String(id)
  const num = Number(value)
  if (Number.isFinite(num)) return [id, value, num]
  return [id, value]
}

export const getPlaceByIdFromMap = (placesById, placeId) => {
  if (!placesById || typeof placesById.get !== 'function') return null
  const keys = getMapCandidateKeys(placeId)
  for (const key of keys) {
    const place = placesById.get(key)
    if (place) return place
  }
  return null
}

export const buildStageDedupKey = (placeId, pfpType, year, fallback = 'fallback') => {
  const normalizedType = normalizePfpType(pfpType)
  const yearKey = year ? String(year) : 'no-year'
  if (!placeId && !normalizedType) return `${fallback}_${yearKey}`
  return `${String(placeId || 'no-place')}__${String(normalizedType || 'no-type')}__${yearKey}`
}

const buildCriteriaFromPlace = (placeData) => {
  const result = {}
  PROFILE_CRITERIA_KEYS.forEach((key) => {
    result[key] = parseBooleanFlag(placeData?.[key])
  })
  return result
}

const buildCriteriaFromLegacyEntry = (entry) => {
  const result = {}
  PROFILE_CRITERIA_KEYS.forEach((key) => {
    const legacyKey = LEGACY_CRITERIA_KEY_MAP[key]
    result[key] = parseBooleanFlag(entry?.[key]) || parseBooleanFlag(entry?.[legacyKey])
  })
  return result
}

export const mergeProfileStages = ({
  studentResultVotes = [],
  physioStages = [],
  placesById = new Map(),
  resolveInstitutionName = () => ''
}) => {
  const merged = []
  const seen = new Set()

  ;(studentResultVotes || []).forEach((vote, idx) => {
    const placeId = resolvePlaceId(vote)
    const normalizedType = normalizePfpType(vote?.pfp_type)
    const dedupKey = buildStageDedupKey(placeId, normalizedType, vote?.year, `vote_${idx}`)
    if (seen.has(dedupKey)) return
    seen.add(dedupKey)

    let status = 'en_attente'
    if (parseBooleanFlag(vote?.pfp_validee)) status = 'validee'
    else if (parseBooleanFlag(vote?.pfp_echec)) status = 'echec'
    else if (parseBooleanFlag(vote?.pfp_arret)) status = 'arret'

    const placeData = getPlaceByIdFromMap(placesById, placeId)
    merged.push({
      _source: 'student_result_vote',
      _key: `rv_${idx}`,
      IDPlace: placeId,
      InstitutionId: vote?.InstitutionId || null,
      NomPlace: vote?.assigned_place_name || placeData?.NomPlace || placeData?.name || '',
      Institutionname: vote?.assigned_institution_name || resolveInstitutionName(placeId) || '',
      pfp_type: normalizedType || null,
      _fpNumber: resolveStageNumber(normalizedType, vote, idx),
      status,
      commentaire_arret: vote?.commentaire_arret || null,
      assigned_rank: vote?.assigned_rank || null,
      year: vote?.year || null,
      ...buildCriteriaFromPlace(placeData)
    })
  })

  ;(physioStages || []).forEach((entry, idx) => {
    const placeId = resolvePlaceId(entry)
    const rawType = resolveLegacyPfpType(entry, idx)
    const normalizedType = normalizePfpType(rawType)
    const dedupKey = buildStageDedupKey(placeId, normalizedType, entry?.year, `physio_${idx}`)
    if (seen.has(dedupKey)) return
    seen.add(dedupKey)

    merged.push({
      _source: 'students_physio',
      _key: `pfp_${idx}`,
      IDPlace: placeId,
      InstitutionId: entry?.InstitutionId || entry?.Institution_id || entry?.institution_id || null,
      NomPlace: entry?.NomPlace || entry?.nom_pfp || entry?.Nom_PFP || entry?.domaine || entry?.Domaine || '',
      Institutionname: entry?.InstitutionName || entry?.Institution || resolveInstitutionName(placeId) || '',
      pfp_type: normalizedType || null,
      _fpNumber: resolveStageNumber(normalizedType, entry, idx),
      status: entry?.status || 'validee',
      commentaire_arret: entry?.commentaire_arret || entry?.commentaireArret || entry?.CommentaireArret || null,
      assigned_rank: entry?.assigned_rank || null,
      year: entry?.year || null,
      ...buildCriteriaFromLegacyEntry(entry)
    })
  })

  merged.sort((a, b) => {
    const fpA = a._fpNumber || 99
    const fpB = b._fpNumber || 99
    if (fpA !== fpB) return fpA - fpB

    const yearA = getYearSortValue(a.year)
    const yearB = getYearSortValue(b.year)
    if (yearA !== yearB) return yearA - yearB

    return String(a._key || '').localeCompare(String(b._key || ''))
  })

  return merged
}

export const computeAggregatedCriteriaFromSources = ({
  studentResultVotes = [],
  userProfile = null,
  studentPfpList = [],
  resolvePlaceFromStage = () => null,
  criteriaKeys = PROFILE_CRITERIA_KEYS
}) => {
  const result = Object.fromEntries((criteriaKeys || PROFILE_CRITERIA_KEYS).map((key) => [key, false]))

  const isValidatedStage = (stage) => {
    if (!stage || typeof stage !== 'object') return false
    const rawStatus = String(stage.status || stage.Status || '').trim().toLowerCase()
    if (rawStatus) return rawStatus === 'validee' || rawStatus === 'validée'
    return true
  }

  const applyCriteriaFromSource = (source) => {
    if (!source) return
    ;(criteriaKeys || PROFILE_CRITERIA_KEYS).forEach((key) => {
      const rawValue =
        source[key] !== undefined && source[key] !== null ? source[key] : source[key.toLowerCase()]
      if (parseBooleanFlag(rawValue)) {
        result[key] = true
      }
    })
  }

  ;(studentResultVotes || []).forEach((vote) => {
    if (!parseBooleanFlag(vote?.pfp_validee) || !vote?.assigned_place_id) return
    const placeData = resolvePlaceFromStage(vote)
    applyCriteriaFromSource(vote)
    if (placeData) {
      applyCriteriaFromSource(placeData)
    }
  })

  if (userProfile && (userProfile.pfp_valided || userProfile.pfp2_data)) {
    let pfpArray = normalizeProfileStageEntries(parsePfpEntries(userProfile.pfp_valided))
    const pfp2Val = userProfile.pfp2_data
    if (pfp2Val) {
      if (Array.isArray(pfp2Val)) {
        pfpArray = [...pfpArray, ...pfp2Val]
      } else if (typeof pfp2Val === 'object') {
        pfpArray.push(pfp2Val)
      }
    }

    pfpArray.forEach((stage) => {
      if (!isValidatedStage(stage)) return
      const placeData = resolvePlaceFromStage(stage)
      applyCriteriaFromSource(stage)
      applyCriteriaFromSource(placeData)
    })
  }

  ;(studentPfpList || []).forEach((stage) => {
    if (!isValidatedStage(stage)) return
    const placeData = resolvePlaceFromStage(stage)
    applyCriteriaFromSource(stage)
    applyCriteriaFromSource(placeData)
  })

  return result
}
