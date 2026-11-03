import { describe, expect, it } from 'vitest'
import { findExistingCampaignAssignment } from '@/service/votationEligibilityService'

const assignment = {
  id: 'assignment-1',
  user_id: 'student-1',
  pfp_type: 'PFP2',
  year: '2027',
  assigned_place_id: 'place-1'
}

describe('votationEligibilityService', () => {
  it('bloque une affectation de la meme campagne en annee civile', () => {
    expect(findExistingCampaignAssignment([assignment], {
      userId: 'student-1',
      pfpType: 'PFP2',
      year: '2027'
    })).toEqual(assignment)
  })

  it('reconnait le libelle d annee academique equivalent', () => {
    expect(findExistingCampaignAssignment([{ ...assignment, year: '2026-2027' }], {
      userId: 'student-1',
      pfpType: 'PFP2',
      year: '2027'
    })).toBeTruthy()
  })

  it('ne bloque pas une autre PFP, une autre annee ou une ligne sans place', () => {
    const rows = [
      { ...assignment, pfp_type: 'PFP3' },
      { ...assignment, year: '2028' },
      { ...assignment, assigned_place_id: null }
    ]
    expect(findExistingCampaignAssignment(rows, {
      userId: 'student-1',
      pfpType: 'PFP2',
      year: '2027'
    })).toBeNull()
  })
})
