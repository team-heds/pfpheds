import { describe, expect, it, vi } from 'vitest'

vi.mock('@/supabase.js', () => ({ supabase: {} }))

import {
  buildHouseRanking,
  buildQuickTiles,
  formatXp,
  matchEntries,
  matchInstitutions,
  otherDestinations,
} from '@/mobile/search/searchHelpers'

const allFeatures = { userJourney: true, badgesChallenges: true, wordOfDay: true, quizzes: true, mentoring: true, eventCheckin: true }

describe('accès rapide de la recherche mobile', () => {
  it('propose les six tuiles quand tout est activé', () => {
    const tiles = buildQuickTiles({ features: allFeatures })
    expect(tiles.map((tile) => tile.label)).toEqual(['Défis et quêtes', 'Mot de la semaine', 'Quiz', 'Mentorat', 'Documents PFP', 'Scanner'])
    expect(tiles[0].to).toBe('/challenges')
    expect(tiles[4].action).toBe('documents')
  })

  it('masque les modules désactivés et garde les quêtes à défaut des défis', () => {
    const tiles = buildQuickTiles({ features: { quizzes: true } })
    expect(tiles.map((tile) => tile.key)).toEqual(['challenges', 'quiz', 'documents'])
    expect(tiles[0].to).toBe('/quests')
  })

  it('ne propose pas une page qui n’existe pas', () => {
    const tiles = buildQuickTiles({ features: allFeatures, hasPath: (path) => path !== '/scan' })
    expect(tiles.some((tile) => tile.key === 'scan')).toBe(false)
  })

  it('ne répète pas les accès déjà présents dans les onglets', () => {
    const list = [{ key: 'votation' }, { key: 'institutions' }, { key: 'map' }, { key: 'profile' }, { key: 'events' }, { key: 'quizzes' }, { key: 'admin' }]
    expect(otherDestinations(list).map((item) => item.key)).toEqual(['votation', 'events', 'admin'])
  })
})

describe('résultats de la recherche mobile', () => {
  it('trouve une page par son nom ou sa description, sans tenir compte des accents', () => {
    const entries = [{ label: 'Événements', description: 'Consulter les événements' }, { label: 'Quiz', detail: 'Réviser' }]
    expect(matchEntries(entries, 'evenem').map((entry) => entry.label)).toEqual(['Événements'])
    expect(matchEntries(entries, 'reviser').map((entry) => entry.label)).toEqual(['Quiz'])
    expect(matchEntries(entries, '')).toEqual([])
  })

  it('trouve les institutions visibles, celles dont le nom commence par la recherche d’abord', () => {
    const institutions = [
      { Name: 'Clinique de Sierre', Locality: 'Sierre', Canton: 'VS' },
      { Name: 'Sierre Physio', Locality: 'Sierre', Canton: 'VS' },
      { Name: 'Masquée Sierre', Locality: 'Sierre', is_hidden: true },
      { Name: 'Hôpital de Sion', Locality: 'Sion', Canton: 'VS' },
    ]
    expect(matchInstitutions(institutions, 'sierre').map((item) => item.Name)).toEqual(['Sierre Physio', 'Clinique de Sierre'])
    expect(matchInstitutions(institutions, 's')).toEqual([])
  })
})

describe('classement des maisons', () => {
  it('classe les maisons par points, sans le maître du jeu', () => {
    const ranking = buildHouseRanking([
      { name: 'harmonis', total_xp: 540 },
      { name: 'GameMaster', total_xp: 99999 },
      { name: 'solencia', total_xp: '2430', color: '#123456' },
      { name: 'doloris', total_xp: 1215 },
    ])
    expect(ranking.map((house) => `${house.rank}. ${house.name}`)).toEqual(['1. Solencia', '2. Doloris', '3. Harmonis'])
    expect(ranking[0]).toMatchObject({ xp: 2430, percent: 100, color: '#123456' })
    expect(ranking[1].percent).toBe(50)
    expect(ranking[2].color).toBe('#10b981')
  })

  it('reste lisible sans aucun point', () => {
    const ranking = buildHouseRanking([{ name: 'elaris', total_xp: 0 }, { name: 'doloris', total_xp: null }])
    expect(ranking.map((house) => house.percent)).toEqual([0, 0])
    expect(buildHouseRanking([])).toEqual([])
  })

  it('écrit les points', () => {
    expect(formatXp(0)).toBe('0 XP')
    expect(formatXp(540)).toBe('540 XP')
  })
})
