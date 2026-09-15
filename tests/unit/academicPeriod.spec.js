import { describe, it, expect } from 'vitest'
import { normalizeAcademicYear, requireAcademicYear, getAcademicYearKeys, getTargetClass, getPfpOrdinal, currentAcademicYear, readAcademicCapacity } from '@/domain/pfp/academicPeriod'
import { buildPlaceAssignmentReview } from '@/service/placeAssignmentReviewService'

describe('academic PFP contract', () => {
  it.each([2027, '2027', '2026-2027', '2026–2027', ' 2026 - 2027 '])('resolves %s to the same campaign', value => {
    expect(normalizeAcademicYear(value)).toBe('2027')
    expect(getAcademicYearKeys(value)).toEqual(['2027', '2026-2027'])
    expect(getTargetClass(value, 'PFP2')).toBe('BA25')
  })
  it.each([null, undefined, '', true, [], {}, '2027.5', '2026-2028', '2e3', 'legacy'])('rejects invalid writes: %s', value => {
    expect(() => requireAcademicYear(value)).toThrow()
  })
  it('keeps a legacy label readable without treating it as a cohort year', () => {
    expect(getAcademicYearKeys('legacy')).toEqual(['legacy'])
    expect(getTargetClass('legacy', 'PFP2')).toBe('')
    expect(getTargetClass('2027', 'unknown')).toBe('')
  })
  it('keeps ordinal and campaign type distinct', () => {
    expect(['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4'].map(getPfpOrdinal)).toEqual([1, 1, 2, 3, 4])
    expect(getTargetClass('2027', 'PFP1B')).toBe('BA26')
    expect(getTargetClass('2027', 'PFP4')).toBe('BA24')
  })
  it('changes default academic year at September, not January', () => {
    expect(currentAcademicYear(new Date(2026, 7, 31))).toBe('2026')
    expect(currentAcademicYear(new Date(2026, 8, 1))).toBe('2027')
    expect(currentAcademicYear(new Date(2027, 0, 1))).toBe('2027')
  })
  it('detects contradictory capacities including zero versus positive', () => {
    expect(readAcademicCapacity({ 2027: 0, '2026-2027': 4 }, '2027').error).toBe('conflicting_year_values')
    expect(readAcademicCapacity({ 2027: 4, '2026-2027': '4' }, '2027').value).toBe(4)
    expect(readAcademicCapacity({ 2027: 1.5 }, '2027').error).toBe('invalid_capacity')
  })
  it('blocks conflicting assignments split across two spellings of the same year', () => {
    const result = buildPlaceAssignmentReview({ assignments: [
      { id: 'a', user_id: 'u', pfp_type: 'PFP2', year: '2027', assigned_place_id: 'p1' },
      { id: 'b', user_id: 'u', pfp_type: 'PFP2', year: '2026-2027', assigned_place_id: 'p2' }
    ] })
    expect(result.every(row => row.review_issues.some(issue => issue.code === 'conflicting_assignment'))).toBe(true)
  })
  it('blocks publication when academic aliases have contradictory capacities', () => {
    const [row] = buildPlaceAssignmentReview({
      students: [{ id: 'u', Nom: 'Test' }],
      places: [{ PlaceId: 'p', InstitutionName: 'Test', PFP2: { 2027: 2, '2026-2027': 0 } }],
      assignments: [{ id: 'a', user_id: 'u', pfp_type: 'PFP2', year: '2027', assigned_place_id: 'p' }]
    })
    expect(row.review_status).toBe('blocked')
    expect(row.review_issues).toContainEqual(expect.objectContaining({ code: 'conflicting_capacity' }))
  })
})
