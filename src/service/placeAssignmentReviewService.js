export const ASSIGNMENT_REVIEW_STATUS = Object.freeze({
  READY: 'ready',
  WARNING: 'warning',
  BLOCKED: 'blocked'
})

const normalizeText = (value) => String(value ?? '').trim()
const normalizeUpper = (value) => normalizeText(value).toUpperCase()

export function getAssignmentAcademicYearKeys(year) {
  const normalized = normalizeText(year)
  if (!normalized) return []
  const numericYear = Number(normalized)
  if (!Number.isFinite(numericYear)) return normalized ? [normalized] : []
  return [String(numericYear), `${numericYear - 1}-${numericYear}`]
}

function getStudentId(student) {
  return normalizeText(student?.user_id || student?.id)
}

function getStudentName(student) {
  if (!student) return ''
  const displayName = normalizeText(student.display_name)
  if (displayName) return displayName
  const familyName = normalizeText(student.family_name || student.Nom || student.nom)
  const forname = normalizeText(student.forname || student.Prenom || student.prenom)
  return `${familyName} ${forname}`.trim()
}

function getStudentClass(student) {
  return normalizeUpper(student?.Classe || student?.classe || student?.class || student?.pfp_cohort)
}

export function getPlaceAssignmentCapacity(place, pfp, year) {
  const source = place?.[normalizeUpper(pfp)]
  if (!source || typeof source !== 'object' || Array.isArray(source)) return 0

  for (const yearKey of getAssignmentAcademicYearKeys(year)) {
    if (!Object.prototype.hasOwnProperty.call(source, yearKey)) continue
    const capacity = Number(source[yearKey])
    return Number.isFinite(capacity) && capacity > 0 ? capacity : 0
  }

  return 0
}

function buildConflictKeys(assignments) {
  const byStudentStage = new Map()

  for (const assignment of assignments) {
    const userId = normalizeText(assignment?.user_id)
    const pfp = normalizeUpper(assignment?.pfp_type)
    const year = normalizeText(assignment?.year)
    if (!userId || !pfp || !year) continue

    const key = `${userId}|${pfp}|${year}`
    const placeIds = byStudentStage.get(key) || new Set()
    const placeId = normalizeText(assignment?.assigned_place_id)
    if (placeId) placeIds.add(placeId)
    byStudentStage.set(key, placeIds)
  }

  return new Set(
    [...byStudentStage.entries()]
      .filter(([, placeIds]) => placeIds.size > 1)
      .map(([key]) => key)
  )
}

export function buildPlaceAssignmentReview({ assignments = [], places = [], students = [] } = {}) {
  const placeById = new Map(places.map(place => [normalizeText(place?.PlaceId), place]))
  const studentById = new Map(students.map(student => [getStudentId(student), student]).filter(([id]) => id))
  const conflictKeys = buildConflictKeys(assignments)

  return assignments.map((assignment) => {
    const assignmentId = normalizeText(assignment?.id)
    const userId = normalizeText(assignment?.user_id)
    const placeId = normalizeText(assignment?.assigned_place_id)
    const pfp = normalizeUpper(assignment?.pfp_type)
    const year = normalizeText(assignment?.year)
    const place = placeById.get(placeId)
    const student = studentById.get(userId)
    const issues = []

    if (!assignmentId) issues.push({ code: 'missing_assignment_id', severity: 'blocked', label: 'Identifiant d’affectation manquant' })
    if (!student) issues.push({ code: 'missing_student', severity: 'blocked', label: 'Étudiant introuvable' })
    if (!placeId) issues.push({ code: 'missing_place', severity: 'blocked', label: 'Aucune place attribuée' })
    else if (!place) issues.push({ code: 'unknown_place', severity: 'blocked', label: 'Place introuvable' })

    const conflictKey = `${userId}|${pfp}|${year}`
    if (conflictKeys.has(conflictKey)) {
      issues.push({ code: 'conflicting_assignment', severity: 'blocked', label: 'Plusieurs places pour le même stage' })
    }

    const capacity = place ? getPlaceAssignmentCapacity(place, pfp, year) : 0
    if (place && capacity === 0) {
      issues.push({ code: 'missing_capacity', severity: 'warning', label: `Aucune offre ${pfp} pour ${year}` })
    }
    if (!normalizeText(assignment?.assigned_institution_name || place?.InstitutionName)) {
      issues.push({ code: 'missing_institution', severity: 'warning', label: 'Institution non renseignée' })
    }

    const reviewStatus = issues.some(issue => issue.severity === 'blocked')
      ? ASSIGNMENT_REVIEW_STATUS.BLOCKED
      : issues.length > 0
        ? ASSIGNMENT_REVIEW_STATUS.WARNING
        : ASSIGNMENT_REVIEW_STATUS.READY

    const studentName = getStudentName(student) || normalizeText(assignment?.student_name) || 'Étudiant inconnu'
    const studentClass = getStudentClass(student) || normalizeUpper(assignment?.student_class)
    const placeName = normalizeText(place?.NomPlace || assignment?.assigned_place_name) || 'Place inconnue'
    const institutionName = normalizeText(
      assignment?.assigned_institution_name || place?.InstitutionName || place?.Institution_name
    ) || 'Institution inconnue'

    return {
      ...assignment,
      assignment_id: assignmentId,
      student_name: studentName,
      student_class: studentClass,
      place_name: placeName,
      institution_name: institutionName,
      place_capacity: capacity,
      review_status: reviewStatus,
      review_issues: issues,
      searchable_text: normalizeUpper([
        studentName,
        studentClass,
        placeId,
        placeName,
        institutionName,
        pfp,
        year,
        assignment?.assigned_praticien_name
      ].join(' '))
    }
  })
}

export function filterPlaceAssignmentReview(rows = [], filters = {}) {
  const query = normalizeUpper(filters.query)
  const reviewStatus = normalizeText(filters.reviewStatus)
  const publicationStatus = normalizeText(filters.publicationStatus)
  const normalizedPfpFilter = normalizeUpper(filters.pfp)
  const pfp = normalizedPfpFilter === 'ALL' ? '' : normalizedPfpFilter
  const yearKeys = new Set(getAssignmentAcademicYearKeys(filters.year))
  const studentClass = normalizeUpper(filters.studentClass)

  return rows.filter(row => {
    if (query && !normalizeUpper(row.searchable_text).includes(query)) return false
    if (reviewStatus && row.review_status !== reviewStatus) return false
    if (publicationStatus && row.status !== publicationStatus) return false
    if (pfp && normalizeUpper(row.pfp_type) !== pfp) return false
    if (yearKeys.size > 0 && !yearKeys.has(normalizeText(row.year))) return false
    if (studentClass && normalizeUpper(row.student_class) !== studentClass) return false
    return true
  })
}

export function getPublishableAssignmentIds(rows = []) {
  return [...new Set(
    rows
      .filter(row => row.review_status !== ASSIGNMENT_REVIEW_STATUS.BLOCKED && row.status !== 'published')
      .map(row => normalizeText(row.id || row.assignment_id))
      .filter(Boolean)
  )]
}
