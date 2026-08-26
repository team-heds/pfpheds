import { describe, expect, it } from 'vitest'

import { FAILED_PFP_GRADE_FIELDS, isFailedPfpGrade } from '@/service/pfpFailureService'

describe('pfpFailureService', () => {
  it('reconnaît une note F indépendamment de la casse et des espaces', () => {
    expect(isFailedPfpGrade('F')).toBe(true)
    expect(isFailedPfpGrade(' f ')).toBe(true)
  })

  it('ne classe pas les autres notes comme échec', () => {
    expect(isFailedPfpGrade('E')).toBe(false)
    expect(isFailedPfpGrade(null)).toBe(false)
  })

  it('couvre les cinq périodes PFP', () => {
    expect(FAILED_PFP_GRADE_FIELDS).toEqual([
      { field: 'pfp1a', pfpType: 'PFP1A' },
      { field: 'pfp1b', pfpType: 'PFP1B' },
      { field: 'pfp2', pfpType: 'PFP2' },
      { field: 'pfp3', pfpType: 'PFP3' },
      { field: 'pfp4', pfpType: 'PFP4' }
    ])
  })
})
