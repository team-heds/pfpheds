import { describe, expect, it, vi } from 'vitest'

vi.mock('@/supabase', () => ({ supabase: {} }))

import {
  collectPlanningSlotIssues,
  expandPlanningClassCodeAliases,
  summarizePlanningDataQuality
} from '../../src/service/dataQualityService'

const completeSlot = {
  id: 'slot-1',
  start_time: '08:00',
  end_time: '08:45',
  course_id: 'course-1',
  activity_type: 'Cours',
  room: 'A101',
  teachers: ['line.martin']
}

describe('SI planning data quality indicators', () => {
  it('expands the B/BA/BAC aliases used by historical planning rows', () => {
    expect(expandPlanningClassCodeAliases(['B25', 'bac26-pa'])).toEqual(expect.arrayContaining([
      'B25',
      'BA25',
      'BAC25',
      'B26-PA',
      'BA26-PA',
      'BAC26-PA'
    ]))
  })

  it('reports a physical slot with missing operational data', () => {
    const result = collectPlanningSlotIssues({
      ...completeSlot,
      start_time: ' ',
      end_time: null,
      course_id: null,
      course_code: ' ',
      activity_type: '',
      activity: null,
      room: ' ',
      teachers: ['postulation']
    })

    expect(result.issues).toEqual(expect.arrayContaining([
      'missing_time',
      'missing_course_link',
      'missing_activity',
      'missing_room',
      'no_valid_teacher'
    ]))
    expect(result.issues).not.toContain('no_teachers_declared')
  })

  it('does not require a room or times for an explicitly asynchronous activity', () => {
    const result = collectPlanningSlotIssues({
      ...completeSlot,
      day: 'Distance',
      activity_type: 'Asynchrone',
      start_time: null,
      end_time: null,
      room: null
    })

    expect(result.issues).not.toContain('missing_room')
    expect(result.issues).not.toContain('missing_time')
  })

  it('distinguishes an invalid interval from a missing interval', () => {
    const result = collectPlanningSlotIssues({
      ...completeSlot,
      start_time: '10:00',
      end_time: '09:00'
    })

    expect(result.issues).toContain('invalid_time')
    expect(result.issues).not.toContain('missing_time')
  })

  it('accepts the historical Swiss time notation with h as a separator', () => {
    const result = collectPlanningSlotIssues({
      ...completeSlot,
      start_time: '08h30',
      end_time: '15h30'
    })

    expect(result.issues).not.toContain('invalid_time')
    expect(result.issues).not.toContain('missing_time')
  })

  it('counts one affected slot once even when no teacher is declared or valid', () => {
    const rows = [
      { issues: [] },
      { issues: ['no_teachers_declared', 'no_valid_teacher', 'missing_room'] }
    ]

    expect(summarizePlanningDataQuality(rows)).toMatchObject({
      totalSlots: 2,
      completeSlots: 1,
      slotsWithAnyIssue: 1,
      qualityScore: 50,
      noTeachersDeclared: 1,
      noValidTeacher: 1,
      teacherIssueSlots: 1,
      missingRoom: 1
    })
  })

  it('does not report a perfect score when there are no slots to assess', () => {
    expect(summarizePlanningDataQuality([])).toMatchObject({
      totalSlots: 0,
      completeSlots: 0,
      qualityScore: null
    })
  })

  it('keeps a fully documented slot issue-free', () => {
    expect(collectPlanningSlotIssues(completeSlot).issues).toEqual([])
  })
})
