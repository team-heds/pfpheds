import { describe, expect, it } from 'vitest'
import { buildStageCoverage } from '@/service/stageCoverageService'

const institutions = [
  { InstitutionId: 10, Name: 'Alpha', Canton: 'FR' },
  { InstitutionId: 20, Name: 'Beta', Canton: 'VD' },
  { InstitutionId: 30, Name: 'Gamma', Canton: 'VS' }
]

const places = [
  { PlaceId: 'a', InstitutionId: 10, PFP1A: { 2026: 2 }, PFP1B: { 2026: 0 } },
  { PlaceId: 'b', InstitutionId: 20, PFP1A: { '2025-2026': 1 }, PFP1B: { 2026: 3 } },
  { PlaceId: 'c', InstitutionId: 30, PFP1A: { 2026: 0 }, PFP1B: { 2026: 0 } }
]

describe('stageCoverageService', () => {
  it('keeps PFP1A and PFP1B distinct and supports academic-year keys', () => {
    const pfp1a = buildStageCoverage({ institutions, places, year: '2026', pfp: 'PFP1A' })
    const pfp1b = buildStageCoverage({ institutions, places, year: '2026', pfp: 'PFP1B' })

    expect(pfp1a.rows.map(row => row.institutionName)).toEqual(['Alpha', 'Beta'])
    expect(pfp1a.totals.eligible).toBe(2)
    expect(pfp1b.rows.map(row => row.institutionName)).toEqual(['Beta'])
    expect(pfp1b.totals.eligible).toBe(1)
  })

  it('counts only published assignments for the exact year and PFP', () => {
    const result = buildStageCoverage({
      institutions,
      places,
      year: '2026',
      pfp: 'PFP1A',
      assignments: [
        { id: '1', user_id: 'u1', status: 'published', pfp_type: 'PFP1A', year: '2025-2026', assigned_place_id: 'a' },
        { id: '2', user_id: 'u2', status: 'draft', pfp_type: 'PFP1A', year: '2026', assigned_place_id: 'b' },
        { id: '3', user_id: 'u3', status: 'published', pfp_type: 'PFP1B', year: '2026', assigned_place_id: 'b' },
        { id: '4', user_id: 'u4', status: 'published', pfp_type: 'PFP1A', year: '2027', assigned_place_id: 'b' }
      ]
    })

    expect(result.totals).toMatchObject({ eligible: 2, withStudents: 1, withoutStudents: 1 })
    expect(result.rows.find(row => row.institutionId === '10').assignedStudentCount).toBe(1)
  })

  it('excludes a student whose published assignments conflict between institutions', () => {
    const result = buildStageCoverage({
      institutions,
      places,
      year: '2026',
      pfp: 'PFP1A',
      assignments: [
        { id: 'same', user_id: 'u1', status: 'published', pfp_type: 'PFP1A', year: '2026', assigned_place_id: 'a' },
        { id: 'same', user_id: 'u1', status: 'published', pfp_type: 'PFP1A', year: '2026', assigned_place_id: 'a' },
        { id: 'other', user_id: 'u1', status: 'published', pfp_type: 'PFP1A', year: '2026', assigned_place_id: 'b' }
      ]
    })

    expect(result.rows.reduce((sum, row) => sum + row.assignedStudentCount, 0)).toBe(0)
    expect(result.anomalies.map(item => item.type)).toEqual(expect.arrayContaining([
      'duplicate_assignment_id',
      'conflicting_student_assignments'
    ]))
  })

  it('counts duplicate assignments to the same institution only once', () => {
    const result = buildStageCoverage({
      institutions,
      places,
      year: '2026',
      pfp: 'PFP1A',
      assignments: [
        { id: '1', user_id: 'u1', status: 'published', pfp_type: 'PFP1A', year: '2026', assigned_place_id: 'a' },
        { id: '2', user_id: 'u1', status: 'published', pfp_type: 'PFP1A', year: '2026', assigned_place_id: 'a' }
      ]
    })

    expect(result.rows.find(row => row.institutionId === '10').assignedStudentCount).toBe(1)
    expect(result.anomalies.map(item => item.type)).toContain('duplicate_student_assignment')
  })

  it('reports orphans without assigning them or distorting totals', () => {
    const result = buildStageCoverage({
      institutions,
      places: [...places, { PlaceId: 'orphan', InstitutionId: 999, PFP1A: { 2026: 9 } }],
      year: '2026',
      pfp: 'PFP1A',
      assignments: [
        { id: 'missing-place', user_id: 'u1', status: 'published', pfp_type: 'PFP1A', year: '2026', assigned_place_id: null },
        { id: 'unknown-place', user_id: 'u2', status: 'published', pfp_type: 'PFP1A', year: '2026', assigned_place_id: 'nowhere' }
      ]
    })

    expect(result.totals).toMatchObject({ eligible: 2, withStudents: 0, withoutStudents: 2 })
    expect(result.anomalies.map(item => item.type)).toEqual(expect.arrayContaining([
      'unknown_institution_id',
      'missing_assignment_place_id',
      'unknown_assignment_place_id'
    ]))
  })

  it('can display institutions without offers without changing eligible totals', () => {
    const result = buildStageCoverage({ institutions, places, year: '2026', pfp: 'PFP1A', includeWithoutOffer: true })

    expect(result.rows).toHaveLength(3)
    expect(result.rows.find(row => row.institutionId === '30').eligible).toBe(false)
    expect(result.rows.find(row => row.institutionId === '30').coverageStatus).toBe('without_offer')
    expect(result.rows.filter(row => row.coverageStatus === 'without_students').map(row => row.institutionName)).toEqual(['Alpha', 'Beta'])
    expect(result.totals).toMatchObject({ eligible: 2, withStudents: 0, withoutStudents: 2 })
  })

  it('rejects an incomplete or invalid selection', () => {
    expect(() => buildStageCoverage({ institutions, places, year: '', pfp: 'PFP1A' })).toThrow()
    expect(() => buildStageCoverage({ institutions, places, year: '2026', pfp: 'PFP1' })).toThrow()
  })
})
