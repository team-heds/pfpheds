const STUDENT_TOKENS = new Set(['student', 'etudiant', 'etudiantphysio', 'studentphysio'])
const SI_TEACHER_TOKENS = new Set(['enseignantsoins'])
const ARCHIVED_TOKENS = new Set(['archivedstudent', 'studentarchived', 'archiveetudiant'])

export function normalizeAudienceToken(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function normalizePermissions(permissions) {
  if (Array.isArray(permissions)) return permissions
  if (!permissions) return []

  if (typeof permissions === 'string') {
    try {
      const parsed = JSON.parse(permissions)
      return Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      return permissions.split(',').map(value => value.trim()).filter(Boolean)
    }
  }

  if (typeof permissions === 'object') {
    return Object.entries(permissions)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([permission]) => permission)
  }

  return []
}

function audienceTokens(profile) {
  return [profile?.role, ...normalizePermissions(profile?.permissions)]
    .map(normalizeAudienceToken)
    .filter(Boolean)
}

export function isActiveProfile(profile) {
  if (!profile || profile.is_active === false) return false
  return !audienceTokens(profile).some(token => ARCHIVED_TOKENS.has(token))
}

export function isStudentProfile(profile) {
  return isActiveProfile(profile) && audienceTokens(profile).some(token => STUDENT_TOKENS.has(token))
}

export function isSITeacherProfile(profile) {
  return isActiveProfile(profile) && audienceTokens(profile).some(token => SI_TEACHER_TOKENS.has(token))
}

export const filterStudentProfiles = profiles => (profiles || []).filter(isStudentProfile)
export const filterSITeacherProfiles = profiles => (profiles || []).filter(isSITeacherProfile)
