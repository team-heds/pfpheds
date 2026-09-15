import { PFP_TYPES, getAcademicYearKeys, requireAcademicYear } from './academicPeriod.js'
import { computePriorityScore, CRITERIA_KEYS } from '../../composables/helpers/computePriorityScore.js'

const clean = value => String(value ?? '').trim()
const isTrue = value => value === true || value === 'true' || value === 1 || value === '1'
const isFalse = value => value === false || value === 'false' || value === 0 || value === '0' || value == null || value === ''

function parseStages(value) {
  if (!value) return { stages: [], valid: true }
  if (Array.isArray(value)) return { stages: value, valid: true }
  if (typeof value === 'object') return { stages: Object.values(value), valid: true }
  if (typeof value !== 'string') return { stages: [], valid: false }
  try {
    const parsed = JSON.parse(value)
    if (Array.isArray(parsed)) return { stages: parsed, valid: true }
    if (parsed && typeof parsed === 'object') return { stages: Object.values(parsed), valid: true }
  } catch {
    return { stages: [], valid: false }
  }
  return { stages: [], valid: false }
}

function addPlaceCriteria(criteria, place) {
  if (!place) return
  CRITERIA_KEYS.forEach(key => {
    if (isTrue(place[key]) || isTrue(place[key.toLowerCase()])) criteria[key] += 1
  })
}

// Audits existing eligibility inputs. It does not decide business exceptions or persist results.
export function inspectEligibility({
  year,
  pfpType,
  candidates,
  physioRows,
  resultRows,
  places,
  manualExclusions = [],
  sourcesComplete = false
}) {
  const canonicalYear = requireAcademicYear(year)
  if (!PFP_TYPES.includes(pfpType)) throw new Error('Type PFP invalide.')
  for (const source of [candidates, physioRows, resultRows, places, manualExclusions]) {
    if (!Array.isArray(source)) throw new Error('Les sources d’éligibilité sont requises.')
  }
  const yearKeys = new Set(getAcademicYearKeys(canonicalYear))
  const placeMap = new Map(places.map(place => [clean(place?.PlaceId ?? place?.id), place]).filter(([id]) => id))
  const issues = []
  const addIssue = (code, details = {}) => issues.push({ code, ...details })
  if (sourcesComplete !== true) addIssue('incomplete_sources')

  const candidateIds = []
  const seenCandidates = new Set()
  candidates.forEach((candidate, rowIndex) => {
    const userId = clean(candidate?.userId ?? candidate?.user_id ?? candidate?.id)
    if (!userId) return addIssue('missing_candidate_id', { rowIndex })
    if (seenCandidates.has(userId)) return addIssue('duplicate_candidate', { userId })
    seenCandidates.add(userId)
    candidateIds.push(userId)
  })
  const physioByUser = new Map()
  physioRows.forEach(row => {
    const userId = clean(row?.user_id)
    if (!userId) return addIssue('missing_physio_user_id')
    if (!physioByUser.has(userId)) physioByUser.set(userId, [])
    physioByUser.get(userId).push(row)
  })
  const resultsByUser = new Map()
  resultRows.forEach(row => {
    const userId = clean(row?.user_id)
    if (!userId) return addIssue('missing_result_user_id')
    if (!resultsByUser.has(userId)) resultsByUser.set(userId, [])
    resultsByUser.get(userId).push(row)
  })
  const exclusionMap = new Map()
  manualExclusions.forEach(entry => {
    const userId = clean(typeof entry === 'object' ? entry?.userId ?? entry?.user_id : entry)
    if (!userId) return addIssue('missing_exclusion_user_id')
    const reason = clean(typeof entry === 'object' ? entry?.reason : '')
    if (!reason) addIssue('missing_exclusion_reason', { userId })
    exclusionMap.set(userId, reason)
  })

  const eligible = []
  const excluded = []
  const unresolved = []
  for (const userId of candidateIds.sort()) {
    const studentIssues = []
    const flag = code => { studentIssues.push(code); addIssue(code, { userId }) }
    const physio = physioByUser.get(userId) || []
    const results = resultsByUser.get(userId) || []
    if (!physio.length) flag('missing_physio')
    if (physio.length > 1) flag('duplicate_physio')
    const source = physio[0] || {}
    for (const field of ['sae', 'cas_particulier', 'lese']) {
      if (!isTrue(source[field]) && !isFalse(source[field])) flag(`invalid_${field}`)
    }
    const parsed = parseStages(source.pfp_valided)
    if (!parsed.valid) flag('invalid_validated_stages')

    const criteria = Object.fromEntries(CRITERIA_KEYS.map(key => [key, 0]))
    const donePlaceIds = new Set()
    parsed.stages.forEach(stage => {
      addPlaceCriteria(criteria, stage)
      const placeId = clean(stage?.PlaceId ?? stage?.ID_PFP ?? stage?.id_pfp)
      if (placeId) {
        donePlaceIds.add(placeId)
        addPlaceCriteria(criteria, placeMap.get(placeId))
      }
    })
    let alreadyAssigned = false
    results.forEach(result => {
      const placeId = clean(result?.assigned_place_id)
      const sameCampaign = clean(result?.pfp_type).toUpperCase() === pfpType && yearKeys.has(clean(result?.year))
      if (sameCampaign && placeId) alreadyAssigned = true
      if (placeId) donePlaceIds.add(placeId)
      if (isTrue(result?.pfp_validee)) addPlaceCriteria(criteria, placeMap.get(placeId))
    })

    const sae = isTrue(source.sae)
    const specialCase = isTrue(source.cas_particulier)
    const legacyLese = isTrue(source.lese)
    const previousRandomAssignment = results.some(result => Number(result?.assigned_rank) === 99)
    const missingCriteria = CRITERIA_KEYS.filter(key => criteria[key] === 0)
    const audit = {
      userId,
      completedStageCount: donePlaceIds.size,
      donePlaceIds: [...donePlaceIds].sort(),
      missingCriteria,
      basePriorityScore: computePriorityScore({ criteria, sae, casParticulier: specialCase }, pfpType, () => 0),
      requiresPriorityReview: sae || specialCase || legacyLese || previousRandomAssignment,
      priorityReasons: [
        sae && 'sae',
        specialCase && 'special_case',
        legacyLese && 'legacy_lese',
        previousRandomAssignment && 'previous_random_assignment'
      ].filter(Boolean),
      issues: studentIssues
    }
    if (studentIssues.length) unresolved.push(audit)
    else if (alreadyAssigned) excluded.push({ ...audit, reason: 'existing_assignment' })
    else if (exclusionMap.has(userId)) excluded.push({ ...audit, reason: 'manual_exclusion', explanation: exclusionMap.get(userId) })
    else eligible.push(audit)
  }

  const issueCounts = {}
  issues.forEach(({ code }) => { issueCounts[code] = (issueCounts[code] || 0) + 1 })
  return {
    year: canonicalYear,
    pfpType,
    eligibilityReady: issues.length === 0,
    campaignReady: false,
    summary: {
      candidates: candidateIds.length,
      eligible: eligible.length,
      excluded: excluded.length,
      unresolved: unresolved.length,
      priorityReviews: [...eligible, ...excluded, ...unresolved].filter(row => row.requiresPriorityReview).length,
      issueCounts
    },
    eligible,
    excluded,
    unresolved,
    issues
  }
}
