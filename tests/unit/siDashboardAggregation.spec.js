import { describe, expect, it } from 'vitest'
import {
  calculatePlanningHours,
  countPlanningTeacherConflicts,
  filterPlanningSlotsByModules
} from '@/service/siDashboardAggregationService'

describe('HEDS25-634 agrégations des dashboards SI', () => {
  it('limite les créneaux aux modules du responsable sans tenir compte de la casse', () => {
    const slots = [
      { id: 1, module_code: 'SI-A' },
      { id: 2, module_code: 'si-b' },
      { id: 3, module_code: 'SI-C' }
    ]

    expect(filterPlanningSlotsByModules(slots, ['si-a', 'SI-B']).map(slot => slot.id)).toEqual([1, 2])
  })

  it('additionne uniquement les durées valides et positives', () => {
    expect(calculatePlanningHours([
      { start_time: '08:00', end_time: '09:30' },
      { start_time: '10:15', end_time: '11:00' },
      { start_time: '12:00', end_time: '11:00' },
      { start_time: null, end_time: '14:00' }
    ])).toBe(2.25)
  })

  it('compte un conflit seulement si horaire et enseignant se chevauchent', () => {
    const slots = [
      {
        id: 1,
        week_number: 41,
        day: 'lundi',
        start_time: '08:00',
        end_time: '10:00',
        teachers: [{ id: 'teacher-1', name: 'Mme Exemple' }]
      },
      {
        id: 2,
        week_number: 41,
        day: 'LUNDI',
        start_time: '09:30',
        end_time: '11:00',
        teachers: [{ id: 'teacher-1', name: 'Nom différent ignoré grâce à l’identifiant' }]
      },
      {
        id: 3,
        week_number: 41,
        day: 'lundi',
        start_time: '09:30',
        end_time: '11:00',
        teachers: ['autre.enseignant']
      },
      {
        id: 4,
        week_number: 42,
        day: 'lundi',
        start_time: '09:30',
        end_time: '11:00',
        teachers: [{ id: 'teacher-1' }]
      }
    ]

    expect(countPlanningTeacherConflicts(slots)).toBe(1)
  })
})
