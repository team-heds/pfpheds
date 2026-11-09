function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function splitCoordinatorEmails(value) {
  return String(value || '')
    .split(/[;,|\n]+/)
    .map(normalizeEmail)
    .filter(Boolean)
}

export function isModuleManagedByEmail(module, userEmail) {
  const email = normalizeEmail(userEmail)
  if (!module || !email) return false

  if (normalizeEmail(module.responsable_email) === email) return true
  return splitCoordinatorEmails(module.coordinateur).includes(email)
}

export function filterModulesManagedByEmail(modules = [], userEmail) {
  if (!Array.isArray(modules)) return []
  return modules.filter(module => isModuleManagedByEmail(module, userEmail))
}

export function filterPostulationRowsForRole({
  rows = [],
  modules = [],
  userEmail,
  isRmOnly = false
} = {}) {
  if (!isRmOnly) return Array.isArray(rows) ? rows : []

  const managedCodes = new Set(
    filterModulesManagedByEmail(modules, userEmail)
      .map(module => String(module?.code || '').trim().toLowerCase())
      .filter(Boolean)
  )

  return (Array.isArray(rows) ? rows : []).filter(row =>
    managedCodes.has(String(row?.moduleCode || '').trim().toLowerCase())
  )
}

