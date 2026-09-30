import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  buildPlanningRemediationFindings,
  summarizePlanningRemediation
} from '../../src/domain/si/planningRemediation'

const baseSlot = overrides => ({
  id: 1,
  module_code: 'M101',
  course_id: 'course-1',
  course_title: 'Relation de soin',
  class_code: 'BAC26',
  week_number: 38,
  day: 'Lundi',
  start_time: '08:15',
  end_time: '10:00',
  room: 'A101',
  teachers: ['Anne Exemple'],
  ...overrides
})

const catalog = {
  modules: [{ id: 'module-1', code: 'M101' }],
  courses: [{ id: 'course-1', name: 'Relation de soin', module_id: 'module-1' }]
}

describe('SI planning remediation', () => {
  it('proposes a unique official course with exact optimistic values', () => {
    const findings = buildPlanningRemediationFindings({
      ...catalog,
      slots: [baseSlot({ id: 7, course_id: null })]
    })

    expect(findings).toHaveLength(1)
    expect(findings[0]).toMatchObject({
      id: 'course-7',
      category: 'course',
      confidence: 'high',
      expectedValue: { id: null },
      proposedValue: { id: 'course-1', label: 'Relation de soin' },
      replacementValue: { id: 'course-1' }
    })
  })

  it('uses an exact duplicate slot as a teacher proposal', () => {
    const findings = buildPlanningRemediationFindings({
      ...catalog,
      slots: [
        baseSlot({ id: 10, teachers: ['Anne Exemple'] }),
        baseSlot({ id: 11, teachers: ['À définir'] })
      ]
    })

    expect(findings.find(finding => finding.id === 'teacher-11')).toMatchObject({
      confidence: 'high',
      proposedValue: { value: ['Anne Exemple'], label: 'Anne Exemple' }
    })
  })

  it('does not invent a proposal when evidence is missing', () => {
    const findings = buildPlanningRemediationFindings({
      ...catalog,
      slots: [baseSlot({ id: 12, room: '', teachers: [] })]
    })
    const room = findings.find(finding => finding.category === 'room')
    const teacher = findings.find(finding => finding.category === 'teacher')

    expect(room).toMatchObject({ confidence: 'manual', proposedValue: null })
    expect(teacher).toMatchObject({ confidence: 'manual', proposedValue: null })
  })

  it('accepts the readable human time format used by the workload parser', () => {
    const findings = buildPlanningRemediationFindings({
      ...catalog,
      slots: [baseSlot({ id: 13, start_time: '8h15', end_time: '10h00' })]
    })

    expect(findings.find(finding => finding.category === 'time')).toBeUndefined()
  })

  it('summarizes proposals and manual decisions by category', () => {
    const findings = buildPlanningRemediationFindings({
      ...catalog,
      slots: [baseSlot({ id: 14, course_id: null, room: '', teachers: [] })]
    })
    const summary = summarizePlanningRemediation(findings)

    expect(summary).toMatchObject({ total: 3, proposals: 1, decisionsRequired: 2 })
    expect(summary.byCategory.course).toMatchObject({ total: 1, proposals: 1 })
    expect(summary.byCategory.room).toMatchObject({ total: 1, manual: 1 })
  })

  it('keeps direct database writes out of the browser and requires explicit validation', () => {
    const service = readFileSync('src/service/siPlanningRemediationService.js', 'utf8')
    const view = readFileSync('src/views/admin/soins-infirmiers/PlanningRemediationView.vue', 'utf8')
    const source = `${service}\n${view}`

    expect(source).not.toMatch(/\.(insert|update|upsert|delete|rpc)\s*\(/)
    expect(service).toContain('/si/planning-remediations')
    expect(view).toContain('Correction contrôlée, une anomalie à la fois')
    expect(view).toContain('J’ai vérifié le créneau et la valeur proposée.')
    expect(view).toContain('Appliquer la correction')
  })
})
