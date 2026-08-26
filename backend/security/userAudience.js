const STUDENT_TOKENS = new Set(['student', 'etudiant', 'etudiantphysio', 'studentphysio'])
const SI_TEACHER_TOKENS = new Set(['enseignantsoins'])
const TEACHER_TOKENS = new Set([
  'enseignantsoins',
  'enseignantphysio',
  'rmsoins',
  'rmphysio',
  'repondanthes'
])
const GENERIC_ROLE_TOKENS = new Set(['', 'user', 'authenticated', 'member'])
const ARCHIVED_TOKENS = new Set(['archivedstudent', 'studentarchived', 'archiveetudiant'])

function normalizeAudienceToken(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

function normalizePermissions(value) {
  if (Array.isArray(value)) return value.flatMap(normalizePermissions)
  if (!value) return []

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (parsed !== value) return normalizePermissions(parsed)
    } catch (_) {
      // Plain permission string.
    }
    return value
      .split(',')
      .map((permission) => permission.trim())
      .filter(Boolean)
  }

  if (typeof value === 'object') {
    return Object.entries(value)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([permission]) => permission)
  }

  return []
}

function permissionTokens(profile) {
  return normalizePermissions(profile?.permissions)
    .map(normalizeAudienceToken)
    .filter(Boolean)
}

function isActiveProfile(profile) {
  if (!profile || profile.is_active === false) return false
  const tokens = [normalizeAudienceToken(profile.role), ...permissionTokens(profile)]
  return !tokens.some((token) => ARCHIVED_TOKENS.has(token))
}

function belongsToAudience(profile, audienceTokens) {
  if (!isActiveProfile(profile)) return false

  const roleToken = normalizeAudienceToken(profile.role)
  if (audienceTokens.has(roleToken)) return true

  // A specific primary role is authoritative. Permissions only classify legacy
  // profiles whose primary role is still generic ("user", "member", ...).
  if (!GENERIC_ROLE_TOKENS.has(roleToken)) return false
  return permissionTokens(profile).some((token) => audienceTokens.has(token))
}

function isStudentProfile(profile) {
  return belongsToAudience(profile, STUDENT_TOKENS)
}

function isSITeacherProfile(profile) {
  return belongsToAudience(profile, SI_TEACHER_TOKENS)
}

function isTeacherProfile(profile) {
  return belongsToAudience(profile, TEACHER_TOKENS)
}

function filterStudentProfiles(profiles) {
  return (profiles || []).filter(isStudentProfile)
}

function filterSITeacherProfiles(profiles) {
  return (profiles || []).filter(isSITeacherProfile)
}

function filterTeacherProfiles(profiles) {
  return (profiles || []).filter(isTeacherProfile)
}

module.exports = {
  filterSITeacherProfiles,
  filterStudentProfiles,
  filterTeacherProfiles,
  isActiveProfile,
  isSITeacherProfile,
  isStudentProfile,
  isTeacherProfile,
  normalizeAudienceToken,
  normalizePermissions
}
