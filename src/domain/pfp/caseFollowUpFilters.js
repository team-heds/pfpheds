const ACTIVE_FOLLOW_UP_COLORS = new Set(['vert', 'orange', 'rouge', 'noir'])

export const isActiveSaeFollowUp = (student) => ACTIVE_FOLLOW_UP_COLORS.has(student?.sae?.couleur)

export const getStudentCaseCategories = (
  student,
  { lesedStudentIds = new Set(), failedStudentIds = new Set() } = {}
) => {
  const categories = []
  if (isActiveSaeFollowUp(student)) categories.push('sae')
  if (lesedStudentIds.has(student?.user_id)) categories.push('lese')
  if (failedStudentIds.has(student?.user_id)) categories.push('echec')
  return categories
}

export const normalizeFollowUpFilterText = (value) => String(value ?? '')
  .normalize('NFD')
  .replace(/\p{Diacritic}/gu, '')
  .replace(/[’'\-‐‑‒–—]/g, ' ')
  .toLocaleLowerCase('fr')
  .replace(/\s+/g, ' ')
  .trim()

export const hasCaseFollowUp = (student, fields = []) => {
  const hasInfo = Boolean(student?.info_etudiant?.commentaire?.trim())

  return hasInfo || fields.some((field) => {
    const cell = student?.[field]
    return Boolean(cell?.commentaire?.trim()) || ACTIVE_FOLLOW_UP_COLORS.has(cell?.couleur)
  })
}

export const matchesStudentFilters = (student, { query = '', classe = null } = {}) => {
  const normalizedQuery = normalizeFollowUpFilterText(query)
  const normalizedName = normalizeFollowUpFilterText(student?.etudiant)
  const normalizedClass = normalizeFollowUpFilterText(student?.classe)

  if (normalizedQuery && !normalizedName.includes(normalizedQuery)) return false
  if (classe && normalizedClass !== normalizeFollowUpFilterText(classe)) return false

  return true
}

export const filterStudents = (students, filters = {}) => (
  (students || []).filter((student) => matchesStudentFilters(student, filters))
)
