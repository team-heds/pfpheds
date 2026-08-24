import { getAcademicYearKeys } from '@/service/offerProposalMatchingService'

export const STAGE_COVERAGE_PFP_TYPES = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']

const canonicalId = value => String(value ?? '').trim()

function readCapacity(place, pfp, year, context, anomalies) {
  const source = place?.[pfp]
  if (source == null || source === '') return 0
  if (typeof source !== 'object' || Array.isArray(source)) {
    anomalies.push({ type: 'invalid_capacity_container', ...context })
    return 0
  }

  const values = getAcademicYearKeys(year)
    .filter(key => Object.prototype.hasOwnProperty.call(source, key))
    .map(key => ({ key, value: source[key] }))
    .filter(entry => entry.value !== null && entry.value !== '')

  if (!values.length) return 0
  if (new Set(values.map(entry => String(entry.value))).size > 1) {
    anomalies.push({ type: 'conflicting_year_values', ...context, keys: values.map(entry => entry.key) })
    return 0
  }

  const value = Number(values[0].value)
  if (!Number.isFinite(value) || value < 0) {
    anomalies.push({ type: 'invalid_capacity_value', ...context })
    return 0
  }
  return value
}

export function buildStageCoverage({
  institutions = [],
  places = [],
  assignments = [],
  year,
  pfp,
  includeWithoutOffer = false
} = {}) {
  const normalizedYear = canonicalId(year)
  const normalizedPfp = canonicalId(pfp).toUpperCase()
  if (!normalizedYear || !STAGE_COVERAGE_PFP_TYPES.includes(normalizedPfp)) {
    throw new Error('Une année académique et un type PFP valides sont requis.')
  }

  const anomalies = []
  const institutionMap = new Map()
  for (const source of institutions) {
    const institutionId = canonicalId(source?.InstitutionId ?? source?.id)
    if (!institutionId) {
      anomalies.push({ type: 'missing_institution_id' })
      continue
    }
    if (institutionMap.has(institutionId)) {
      anomalies.push({ type: 'duplicate_institution_id', institutionId })
      continue
    }
    institutionMap.set(institutionId, {
      ...source,
      InstitutionId: institutionId,
      institutionId,
      institutionName: source.Name || source.name || 'Institution sans nom',
      eligiblePlaceCount: 0,
      offeredCapacity: 0,
      assignedStudentIds: new Set(),
      assignedStudentCount: 0,
      eligible: false
    })
  }

  const placeMap = new Map()
  for (const place of places) {
    const placeId = canonicalId(place?.PlaceId ?? place?.IDPlace ?? place?.id)
    const institutionId = canonicalId(place?.InstitutionId)
    if (!placeId) {
      anomalies.push({ type: 'missing_place_id', institutionId: institutionId || null })
      continue
    }
    if (placeMap.has(placeId)) {
      anomalies.push({ type: 'duplicate_place_id', placeId, institutionId: institutionId || null })
      continue
    }
    const institution = institutionMap.get(institutionId)
    if (!institution) {
      anomalies.push({ type: institutionId ? 'unknown_institution_id' : 'missing_place_institution_id', placeId, institutionId: institutionId || null })
      continue
    }

    placeMap.set(placeId, { place, institutionId })
    const capacity = readCapacity(place, normalizedPfp, normalizedYear, { placeId, institutionId, pfp: normalizedPfp, year: normalizedYear }, anomalies)
    if (capacity > 0) {
      institution.eligible = true
      institution.eligiblePlaceCount += 1
      institution.offeredCapacity += capacity
    }
  }

  const acceptedYears = new Set(getAcademicYearKeys(normalizedYear))
  const seenAssignmentIds = new Set()
  const assignmentGroups = new Map()
  for (const assignment of assignments) {
    if (assignment?.status !== 'published') continue
    if (canonicalId(assignment?.pfp_type).toUpperCase() !== normalizedPfp) continue
    if (!acceptedYears.has(canonicalId(assignment?.year))) continue

    const assignmentId = canonicalId(assignment?.id)
    const userId = canonicalId(assignment?.user_id)
    const placeId = canonicalId(assignment?.assigned_place_id)
    const stableId = assignmentId || `${userId}|${normalizedPfp}|${normalizedYear}|${placeId}`
    if (!assignmentId) anomalies.push({ type: 'missing_assignment_id', userId: userId || null, placeId: placeId || null })
    if (seenAssignmentIds.has(stableId)) {
      anomalies.push({ type: 'duplicate_assignment_id', assignmentId: stableId })
      continue
    }
    seenAssignmentIds.add(stableId)

    if (!placeId) {
      anomalies.push({ type: 'missing_assignment_place_id', assignmentId: assignmentId || null, userId: userId || null })
      continue
    }
    const placeMatch = placeMap.get(placeId)
    if (!placeMatch) {
      anomalies.push({ type: 'unknown_assignment_place_id', assignmentId: assignmentId || null, placeId, userId: userId || null })
      continue
    }
    if (!userId) {
      anomalies.push({ type: 'missing_assignment_user_id', assignmentId: assignmentId || null, placeId })
      continue
    }

    const studentKey = `${userId}|${normalizedPfp}|${normalizedYear}`
    const candidates = assignmentGroups.get(studentKey) || []
    candidates.push({ assignmentId: assignmentId || null, userId, placeId, institutionId: placeMatch.institutionId })
    assignmentGroups.set(studentKey, candidates)
  }

  for (const candidates of assignmentGroups.values()) {
    const institutionIds = [...new Set(candidates.map(candidate => candidate.institutionId))]
    const { userId } = candidates[0]
    if (candidates.length > 1) {
      anomalies.push({
        type: institutionIds.length > 1 ? 'conflicting_student_assignments' : 'duplicate_student_assignment',
        userId,
        assignmentIds: candidates.map(candidate => candidate.assignmentId).filter(Boolean),
        institutionIds
      })
    }
    if (institutionIds.length !== 1) continue
    institutionMap.get(institutionIds[0]).assignedStudentIds.add(userId)
  }

  for (const institution of institutionMap.values()) {
    institution.assignedStudentCount = institution.assignedStudentIds.size
    delete institution.assignedStudentIds
    institution.coverageStatus = !institution.eligible
      ? 'without_offer'
      : institution.assignedStudentCount > 0
        ? 'with_students'
        : 'without_students'
  }

  const eligibleInstitutions = [...institutionMap.values()].filter(item => item.eligible)
  const rows = [...institutionMap.values()]
    .filter(item => includeWithoutOffer || item.eligible)
    .sort((a, b) => a.institutionName.localeCompare(b.institutionName, 'fr'))

  return {
    year: normalizedYear,
    pfp: normalizedPfp,
    rows,
    anomalies,
    totals: {
      eligible: eligibleInstitutions.length,
      withStudents: eligibleInstitutions.filter(item => item.assignedStudentCount > 0).length,
      withoutStudents: eligibleInstitutions.filter(item => item.assignedStudentCount === 0).length,
      anomalies: anomalies.length
    }
  }
}
