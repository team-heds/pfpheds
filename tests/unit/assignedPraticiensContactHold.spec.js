import { describe, expect, it } from 'vitest'
import { assignedPraticienIds, joinAssignedPraticiens } from '@/utils/assignedPraticiens'
import { firstUpcomingStageYear, stagesAwaitingRepondantGo } from '@/domain/pfp/contactHold'

describe('assignedPraticiens', () => {
  it('garde le principal puis le second sans doublon', () => {
    expect(assignedPraticienIds({ assigned_praticien_id: 4, assigned_praticien_2_id: 9 })).toEqual([4, 9])
    expect(assignedPraticienIds({ assigned_praticien_id: 4, assigned_praticien_2_id: '4' })).toEqual([4])
    expect(assignedPraticienIds({ assigned_praticien_id: null })).toEqual([])
  })

  it('joint uniquement les PF résolus', () => {
    const names = { 4: 'Ana Roy', 9: 'Léo Blanc' }
    expect(joinAssignedPraticiens({ assigned_praticien_id: 4, assigned_praticien_2_id: 9 }, (id) => names[id])).toBe('Ana Roy, Léo Blanc')
    expect(joinAssignedPraticiens({ assigned_praticien_id: 4, assigned_praticien_2_id: 7 }, (id) => names[id])).toBe('Ana Roy')
  })
})

describe('stagesAwaitingRepondantGo', () => {
  const now = new Date(2026, 10, 23)
  const stage = { id: 1, status: 'published', year: '2027', is_validated: false }

  it('retient un stage publié à venir sans go', () => {
    expect(stagesAwaitingRepondantGo([stage], now)).toEqual([stage])
  })

  it.each([
    ['validé par le répondant', { is_validated: true }],
    ['réussi', { pfp_validee: true }],
    ['échoué', { pfp_echec: true }],
    ['arrêté', { pfp_arret: true }],
    ['non publié', { status: 'draft' }],
    ['déjà engagé', { year: '2026' }],
  ])('ignore un stage %s', (_label, change) => {
    expect(stagesAwaitingRepondantGo([{ ...stage, ...change }], now)).toEqual([])
  })

  it('change d\'année de référence en août', () => {
    expect(firstUpcomingStageYear(new Date(2027, 6, 31))).toBe(2027)
    expect(firstUpcomingStageYear(new Date(2027, 7, 1))).toBe(2028)
  })
})
