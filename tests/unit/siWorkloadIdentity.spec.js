import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/supabase', () => ({ supabase: {} }))

import workloadService from '../../src/service/workloadService'

const baseSlot = {
  id: 'slot-1',
  week_number: 40,
  day: 'Lundi',
  date: '2026-09-28',
  start_time: '08:00',
  end_time: '08:45',
  class_code: 'BAC25',
  module_code: 'SI-101',
  course_title: 'Cours test',
  activity_type: 'Cours',
  activity: 'Cours',
  room: 'A1'
}

afterEach(() => vi.restoreAllMocks())

describe('SI workload canonical teacher identities', () => {
  it('counts several legacy representations of one teacher only once per slot', async () => {
    vi.spyOn(workloadService, 'getTeachers').mockResolvedValue([
      { id: 'teacher-elodie', name: 'Elodie Perruchoud', email: 'elodie.perruchoud@hevs.ch' }
    ])
    vi.spyOn(workloadService, 'getClassesWithStudentCount').mockResolvedValue([
      { id: 'class-1', code: 'BAC25', academic_year_id: 'year-1' }
    ])
    vi.spyOn(workloadService, '_getAllSlots').mockResolvedValue([
      {
        ...baseSlot,
        teachers: [
          '{"user_id":"teacher-elodie"}',
          'elodie.perruchoud',
          'Élodie Perruchoud'
        ]
      }
    ])
    vi.spyOn(workloadService, 'getModuleNames').mockResolvedValue({ 'SI-101': 'Soins 101' })

    const result = await workloadService.computeWorkload('all', 'year-1')

    expect(result.teachers).toHaveLength(1)
    expect(result.teachers[0].teacher).toMatchObject({ id: 'teacher-elodie', name: 'Elodie Perruchoud' })
    expect(result.teachers[0].slots).toHaveLength(1)
    expect(result.teachers[0].totalPresencePeriods).toBe(1)
    expect(result.teachers[0].totalWeightedPeriods).toBe(4)
    expect(result.diagnostics).toMatchObject({
      resolvedTeacherEntries: 3,
      resolvedById: 1,
      resolvedByName: 2,
      unresolvedTeacherEntries: 0,
      ambiguousTeacherEntries: 0
    })
  })

  it('keeps an unknown external teacher in the calculation and reports it', async () => {
    vi.spyOn(workloadService, 'getTeachers').mockResolvedValue([])
    vi.spyOn(workloadService, 'getClassesWithStudentCount').mockResolvedValue([
      { id: 'class-1', code: 'BAC25', academic_year_id: 'year-1' }
    ])
    vi.spyOn(workloadService, '_getAllSlots').mockResolvedValue([
      { ...baseSlot, teachers: ['Intervenante Externe'] }
    ])
    vi.spyOn(workloadService, 'getModuleNames').mockResolvedValue({})

    const result = await workloadService.computeWorkload('all', 'year-1')

    expect(result.teachers).toHaveLength(1)
    expect(result.teachers[0].teacher).toMatchObject({
      id: null,
      name: 'Intervenante Externe',
      identityStatus: 'unresolved'
    })
    expect(result.diagnostics.unresolvedTeacherEntries).toBe(1)
    expect(result.diagnostics.unresolvedTeachers).toEqual(['Intervenante Externe'])
    expect(result.diagnostics.rows[0]).toMatchObject({
      issue: 'teacher_identity_issue',
      identityIssues: 'non résolu: Intervenante Externe'
    })
  })

  it('never merges an ambiguous display name into an arbitrary canonical teacher', async () => {
    vi.spyOn(workloadService, 'getTeachers').mockResolvedValue([
      { id: 'teacher-line-1', name: 'Line Martin', email: 'line.one@hevs.ch' },
      { id: 'teacher-line-2', name: 'Line Martin', email: 'line.two@hevs.ch' }
    ])
    vi.spyOn(workloadService, 'getClassesWithStudentCount').mockResolvedValue([
      { id: 'class-1', code: 'BAC25', academic_year_id: 'year-1' }
    ])
    vi.spyOn(workloadService, '_getAllSlots').mockResolvedValue([
      { ...baseSlot, teachers: ['Line Martin'] }
    ])
    vi.spyOn(workloadService, 'getModuleNames').mockResolvedValue({})

    const result = await workloadService.computeWorkload('all', 'year-1')
    const canonicalRows = result.teachers.filter(row => row.teacher.id)
    const ambiguousRow = result.teachers.find(row => row.teacher.identityStatus === 'ambiguous')

    expect(canonicalRows.every(row => row.slots.length === 0)).toBe(true)
    expect(ambiguousRow).toBeDefined()
    expect(ambiguousRow.slots).toHaveLength(1)
    expect(result.diagnostics).toMatchObject({
      ambiguousTeacherEntries: 1,
      ambiguousTeachers: ['Line Martin']
    })
  })
})
