import { describe, expect, it } from 'vitest'
import { applyPfpDetailFilters, placeCapacity, pfpYearFromAcademicYear } from '@/utils/pfpDashboardDetails'

describe('détails du dashboard PFP', () => {
  const places = [
    { InstitutionName: 'A', PFP2: { 2027: '2', 2026: '9' }, PFP3: { 2027: '0' } },
    { InstitutionName: 'B', PFP2: { 2027: '' }, PFP3: { 2027: '1' } },
  ]
  const students = [{ user_id: 'u1', classe: 'BA25', role: 'EtudiantPhysio' }, { user_id: 'u2', classe: 'BA26', role: 'EtudiantPhysio' }]
  const votes = [
    { user_id: 'u1', pfp_type: 'PFP2', status: 'published', assigned_institution_name: 'A' },
    { user_id: 'u2', pfp_type: 'PFP3', status: 'draft', assigned_institution_name: 'B' },
  ]

  it('lit l’année de fin de l’année académique', () => {
    expect(pfpYearFromAcademicYear({ end_date: '2027-08-31' })).toBe('2027')
    expect(pfpYearFromAcademicYear(null)).toBeNull()
  })

  it('additionne la capacité de la seule année demandée', () => {
    expect(placeCapacity(places[0], '2027')).toBe(2)
    expect(placeCapacity(places[1], '2027', ['PFP2'])).toBe(0)
  })

  it('applique les filtres aux étudiants, places et affectations', () => {
    const byClass = applyPfpDetailFilters({ students, places, votes }, { class: ['BA25'] }, '2027')
    expect(byClass.students).toHaveLength(1)
    expect(byClass.votes.map((vote) => vote.user_id)).toEqual(['u1'])
    const byPfp = applyPfpDetailFilters({ students, places, votes }, { pfp: ['PFP3'] }, '2027')
    expect(byPfp.places.map((place) => place.InstitutionName)).toEqual(['B'])
    expect(byPfp.votes).toHaveLength(1)
  })
})
