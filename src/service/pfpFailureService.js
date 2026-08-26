export const FAILED_PFP_GRADE_FIELDS = Object.freeze([
  { field: 'pfp1a', pfpType: 'PFP1A' },
  { field: 'pfp1b', pfpType: 'PFP1B' },
  { field: 'pfp2', pfpType: 'PFP2' },
  { field: 'pfp3', pfpType: 'PFP3' },
  { field: 'pfp4', pfpType: 'PFP4' }
])

export function isFailedPfpGrade(grade) {
  return String(grade ?? '').trim().toUpperCase() === 'F'
}
