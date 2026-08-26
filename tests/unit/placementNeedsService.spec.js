import { describe, expect, it } from 'vitest'
import { buildPlacementNeeds, getTargetClass } from '@/service/placementNeedsService'

const students = [
  { id: 's1', Classe: 'BA26' },
  { id: 's2', Classe: 'BA26' },
  { id: 's3', Classe: 'BA25' }
]

describe('placementNeedsService', () => {
  it('associe la classe attendue au PFP et à l’année académique', () => {
    expect(getTargetClass('2027', 'PFP1A')).toBe('BA26')
    expect(getTargetClass('2027', 'PFP1B')).toBe('BA26')
    expect(getTargetClass('2027', 'PFP2')).toBe('BA25')
    expect(getTargetClass('2027', 'PFP3')).toBe('BA24')
    expect(getTargetClass('2027', 'PFP4')).toBe('BA24')
  })

  it('calcule le besoin, les offres et la couverture sans additionner les critères', () => {
    const result = buildPlacementNeeds({
      year: '2027', pfp: 'PFP1A', students,
      places: [
        { PlaceId: 'p1', PFP1A: { 2027: '1' }, MSQ: true, AIGU: true },
        { PlaceId: 'p2', PFP1A: { '2026-2027': 2 }, REHAB: true }
      ],
      physioRows: [{ user_id: 's1', pfp_valided: [{ MSQ: true }] }],
      resultRows: []
    })
    expect(result.studentsToPlace).toBe(2)
    expect(result.offered).toBe(3)
    expect(result.surplus).toBe(1)
    expect(result.criteria.find(row => row.criterion === 'MSQ')).toMatchObject({ need: 1, capacity: 1, missing: 0 })
    expect(result.criteria.find(row => row.criterion === 'AIGU')).toMatchObject({ need: 2, capacity: 1, missing: 1 })
  })

  it('exclut du besoin PFP un étudiant déjà validé', () => {
    const result = buildPlacementNeeds({
      year: '2027', pfp: 'PFP1A', students, places: [], physioRows: [],
      resultRows: [{ user_id: 's1', pfp_type: 'PFP1A', pfp_validee: true }]
    })
    expect(result.studentCount).toBe(2)
    expect(result.studentsToPlace).toBe(1)
    expect(result.missing).toBe(1)
  })

  it('ignore les capacités invalides', () => {
    const result = buildPlacementNeeds({ year: '2027', pfp: 'PFP1A', students, places: [{ PlaceId: 'p1', PFP1A: { 2027: '-2' }, MSQ: true }] })
    expect(result.offered).toBe(0)
    expect(result.criteria[0].capacity).toBe(0)
  })
})
