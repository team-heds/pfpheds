// PFP keys identify the academic END year, never the date of a vote.
export const PFP_TYPES = Object.freeze(['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4'])

export function normalizeAcademicYear(value) {
  if (typeof value !== 'string' && typeof value !== 'number') return null
  const text = String(value).trim()
  if (/^[1-9]\d{3}$/.test(text)) return text
  const range = text.match(/^([1-9]\d{3})\s*[-–]\s*([1-9]\d{3})$/)
  return range && Number(range[2]) === Number(range[1]) + 1 ? range[2] : null
}

export function requireAcademicYear(value) {
  const year = normalizeAcademicYear(value)
  if (!year) throw new Error('Année académique invalide : utilisez 2027 ou 2026-2027.')
  return year
}

// Unknown historical labels remain readable; new writes use requireAcademicYear.
export function getAcademicYearKeys(value) {
  const year = normalizeAcademicYear(value)
  if (year) return [year, `${Number(year) - 1}-${year}`]
  return typeof value === 'string' && value.trim() ? [value.trim()] : []
}

export function formatAcademicYear(value) {
  const year = requireAcademicYear(value)
  return `${Number(year) - 1}-${year}`
}

export function currentAcademicYear(date = new Date()) {
  return String(date.getFullYear() + (date.getMonth() >= 8 ? 1 : 0))
}

export function getTargetClass(year, pfp) {
  const canonical = normalizeAcademicYear(year)
  if (!canonical || !PFP_TYPES.includes(pfp)) return ''
  const offset = pfp === 'PFP1A' || pfp === 'PFP1B' ? 1 : pfp === 'PFP2' ? 2 : 3
  return `BA${String((Number(canonical) - offset + 100) % 100).padStart(2, '0')}`
}

// PFP1A/PFP1B remain distinct campaigns; the profile ordinal stays 1.
export function getPfpOrdinal(type) {
  return ({ PFP1: 1, PFP1A: 1, PFP1B: 1, PFP2: 2, PFP3: 3, PFP4: 4 })[type] ?? null
}

export function readAcademicCapacity(source, year) {
  if (!source || typeof source !== 'object' || Array.isArray(source)) return { value: 0, error: null }
  const values = getAcademicYearKeys(year)
    .filter(key => Object.hasOwn(source, key) && source[key] !== null && source[key] !== '')
    .map(key => source[key])
  if (!values.length) return { value: 0, error: null }
  if (values.some(value => !['string', 'number'].includes(typeof value) || !String(value).trim() || !Number.isInteger(Number(value)) || Number(value) < 0)) {
    return { value: 0, error: 'invalid_capacity' }
  }
  if (new Set(values.map(Number)).size > 1) return { value: 0, error: 'conflicting_year_values' }
  return { value: Number(values[0]), error: null }
}
