import { normalizeAcademicYear, requireAcademicYear } from './academicPeriod.mjs'

export function directoryYear(value) {
  if (value === undefined) return null
  try { return requireAcademicYear(value) } catch {
    const error = new Error('Année académique invalide.')
    error.status = 400
    throw error
  }
}

// Never mix fields from different academic years or rely on database row order.
export function selectPhysioRows(rows, requestedYear = null) {
  const year = requestedYear === null ? null : directoryYear(requestedYear)
  const byUser = new Map()
  for (const row of rows || []) {
    const rowYear = normalizeAcademicYear(row.year)
    if (!row.user_id || !rowYear || (year && rowYear !== year)) continue
    const candidate = { ...row, year: rowYear }
    const years = byUser.get(row.user_id) || new Map()
    const matches = years.get(rowYear) || []
    matches.push(candidate)
    years.set(rowYear, matches)
    byUser.set(row.user_id, years)
  }
  const selected = new Map()
  for (const [userId, years] of byUser) {
    const selectedYear = year || [...years.keys()].sort().at(-1)
    const candidates = years.get(selectedYear)
    if (candidates.length > 1) {
      const error = new Error('Plusieurs dossiers étudiants pour une même année : réconciliation nécessaire.')
      error.status = 409
      throw error
    }
    selected.set(userId, candidates[0])
  }
  return selected
}
