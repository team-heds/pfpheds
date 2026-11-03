import { describe, expect, it } from 'vitest'
import {
  filterModulesManagedByEmail,
  filterPostulationRowsForRole,
  isModuleManagedByEmail,
  splitCoordinatorEmails
} from '@/domain/si/moduleOwnership'

const modules = [
  { code: 'SI-A', responsable_email: 'rm.a@hevs.ch' },
  { code: 'SI-B', coordinateur: 'rm.b@hevs.ch; RM.A@HEVS.CH' },
  { code: 'SI-C', responsable_email: 'rm.c@hevs.ch' }
]

describe('périmètre des modules RM Soins infirmiers', () => {
  it('normalise les séparateurs et la casse des coordinateurs', () => {
    expect(splitCoordinatorEmails('A@hevs.ch; b@hevs.ch\nC@hevs.ch'))
      .toEqual(['a@hevs.ch', 'b@hevs.ch', 'c@hevs.ch'])
  })

  it('reconnaît le responsable et le coordinateur sans correspondance partielle', () => {
    expect(isModuleManagedByEmail(modules[0], 'RM.A@hevs.ch')).toBe(true)
    expect(isModuleManagedByEmail(modules[1], 'rm.a@hevs.ch')).toBe(true)
    expect(isModuleManagedByEmail(modules[0], 'a@hevs.ch')).toBe(false)
  })

  it('filtre les modules et les créneaux pour un RM uniquement', () => {
    expect(filterModulesManagedByEmail(modules, 'rm.a@hevs.ch').map(module => module.code))
      .toEqual(['SI-A', 'SI-B'])

    const rows = [
      { id: 1, moduleCode: 'SI-A' },
      { id: 2, moduleCode: 'si-b' },
      { id: 3, moduleCode: 'SI-C' }
    ]

    expect(filterPostulationRowsForRole({ rows, modules, userEmail: 'rm.a@hevs.ch', isRmOnly: true }))
      .toEqual(rows.slice(0, 2))
    expect(filterPostulationRowsForRole({ rows, modules, userEmail: 'rm.a@hevs.ch', isRmOnly: false }))
      .toEqual(rows)
  })
})

