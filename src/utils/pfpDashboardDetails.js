import { normalizeAudienceToken } from '@/utils/userAudience'

export const PFP_PLACE_TYPES = Object.freeze(['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4'])

// student_result_vote.year porte l'année de fin : 2027 = année académique 2026-2027.
export function pfpYearFromAcademicYear(academicYear) {
  const match = /^(\d{4})/.exec(String(academicYear?.end_date || ''))
  return match ? match[1] : null
}

export function placeCapacity(place, year, pfpTypes = PFP_PLACE_TYPES) {
  return pfpTypes.reduce((total, pfp) => {
    const value = Number(place?.[pfp]?.[year])
    return total + (Number.isFinite(value) && value > 0 ? value : 0)
  }, 0)
}

function studentTrack(student) {
  const explicit = String(student?.primary_track_id || '').trim()
  if (explicit) return explicit
  const role = normalizeAudienceToken(student?.role)
  if (role.includes('soins')) return 'SI'
  return role.includes('physio') ? 'PHY' : ''
}

function matchesPeople(student, filters) {
  const classCode = String(student?.classe || student?.Classe || '').trim().toUpperCase()
  if (filters.class?.length && !filters.class.includes(classCode)) return false
  if (filters.cohort?.length && !filters.cohort.includes(String(student?.pfp_cohort || ''))) return false
  if (filters.track?.length && !filters.track.includes(studentTrack(student))) return false
  if (filters.role?.length) {
    const roles = filters.role.map(normalizeAudienceToken)
    if (!roles.includes(normalizeAudienceToken(student?.role))) return false
  }
  return true
}

export function applyPfpDetailFilters({ students = [], places = [], votes = [] }, filters = {}, year = null) {
  const hasPeopleFilter = ['class', 'cohort', 'track', 'role'].some((key) => filters[key]?.length)
  const filteredStudents = students.filter((student) => matchesPeople(student, filters))
  const studentIds = new Set(filteredStudents.map((student) => String(student.user_id || student.id)))

  const filteredVotes = votes.filter((vote) => {
    if (hasPeopleFilter && !studentIds.has(String(vote.user_id))) return false
    if (filters.pfp?.length && !filters.pfp.includes(vote.pfp_type)) return false
    if (filters.status?.length && !filters.status.includes(vote.status)) return false
    if (filters.institution?.length && !filters.institution.includes(vote.assigned_institution_name)) return false
    return true
  })
  const filteredPlaces = places.filter((place) => {
    if (filters.institution?.length && !filters.institution.includes(place.InstitutionName)) return false
    if (filters.pfp?.length && year) return placeCapacity(place, year, filters.pfp) > 0
    return true
  })
  return { students: filteredStudents, places: filteredPlaces, votes: filteredVotes }
}
