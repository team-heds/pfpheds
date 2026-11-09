import { describe, expect, it } from 'vitest'
import {
  createVentriglisseRace,
  normalizeVentriglisseParticipants,
  rankVentriglisseRace,
  scoreVentriglisseRound,
} from '@/domain/games/ventriglisseRace'

describe('moteur local du Ventriglisse 3D', () => {
  it('normalise les noms, limite la course à six personnes et évite les doublons visuels', () => {
    const participants = Array.from({ length: 8 }, () => ({ name: '  Alex  ' }))
    const normalized = normalizeVentriglisseParticipants(participants)

    expect(normalized).toHaveLength(6)
    expect(normalized.map(({ name }) => name)).toEqual([
      'Alex', 'Alex 2', 'Alex 3', 'Alex 4', 'Alex 5', 'Alex 6',
    ])
  })

  it('produit une manche déterministe mais différente à la manche suivante', () => {
    const participants = [{ name: 'Alice' }, { name: 'Bruno' }, { name: 'Chloé' }]

    expect(createVentriglisseRace(participants, 2)).toEqual(createVentriglisseRace(participants, 2))
    expect(createVentriglisseRace(participants, 3)).not.toEqual(createVentriglisseRace(participants, 2))
  })

  it('classe par distance puis par couloir pour garantir un résultat stable', () => {
    const ranking = rankVentriglisseRace([
      { name: 'B', lane: 2, distance: 80 },
      { name: 'A', lane: 1, distance: 80 },
      { name: 'C', lane: 3, distance: 65 },
    ])

    expect(ranking.map(({ name }) => name)).toEqual(['A', 'B', 'C'])
  })

  it('cumule le score de chaque manche sans modifier les données reçues', () => {
    const participants = [
      { id: 'a', name: 'A', lane: 1, distance: 80, score: 2 },
      { id: 'b', name: 'B', lane: 2, distance: 110, score: 0 },
      { id: 'c', name: 'C', lane: 3, distance: 95, score: 4 },
    ]

    const scored = scoreVentriglisseRound(participants)

    expect(scored.map(({ name, roundPoints, score }) => ({ name, roundPoints, score }))).toEqual([
      { name: 'B', roundPoints: 3, score: 3 },
      { name: 'C', roundPoints: 2, score: 6 },
      { name: 'A', roundPoints: 1, score: 3 },
    ])
    expect(participants.map(({ score }) => score)).toEqual([2, 0, 4])
  })
})
