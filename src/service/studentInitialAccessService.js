import apiClient from '@/service/apiClient'

const ELIGIBLE_CLASSES = new Set(['BA26', 'BAC26'])
const STUDENT_ROLES = new Set(['student', 'etudiant', 'etudiantphysio', 'studentphysio'])

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

export function canRequestInitialAccess(user) {
  const role = normalize(user?.role)
  const roleTokens = (user?.rolesList || []).map(normalize)
  const studentRole = STUDENT_ROLES.has(role)
  const legacyStudentRole =
    ['', 'user', 'authenticated', 'member'].includes(role) &&
    roleTokens.some((token) => STUDENT_ROLES.has(token))
  const classe = String(user?.classe || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
  return (
    user?.is_active !== false && (studentRole || legacyStudentRole) && ELIGIBLE_CLASSES.has(classe)
  )
}

export function initialAccessPresentation(state = {}) {
  const presentations = {
    pending: { label: 'À envoyer', severity: 'secondary', action: 'Envoyer l’accès' },
    sent: { label: 'Envoyé', severity: 'info', action: 'Renvoyer' },
    used: { label: 'Utilisé', severity: 'success', action: null },
    expired: { label: 'Expiré', severity: 'warning', action: 'Renvoyer' },
    error: { label: 'Erreur', severity: 'danger', action: 'Réessayer' }
  }
  return presentations[state.status] || presentations.pending
}

export async function loadInitialAccessStates() {
  const { data } = await apiClient.get('/admin/users/initial-access')
  return data?.items || []
}

export async function sendInitialAccess(userId) {
  const { data } = await apiClient.post(`/admin/users/${encodeURIComponent(userId)}/initial-access`)
  return data
}

export async function markInitialAccessUsed() {
  const { data } = await apiClient.post('/auth/initial-access/used')
  return data
}
