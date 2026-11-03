import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/supabase', () => ({ supabase: {} }))
import gamificationService from '@/service/gamificationServiceSupabase'

// Thresholds retained in public.calculate_house_level(bigint), baseline SQL
// lines 654–678, and HEDS25-616. They are independent of personal XP levels.
const thresholds = [0, 2375, 5938, 10688, 17813, 27313, 40375, 57000, 78375, 106875, 142500, 187625, 244625, 315875, 406125, 520125, 662625, 843125, 1068750, 1353750]
const boundaries = thresholds.slice(1).flatMap(threshold => [-1, 0, 1].map(offset => threshold + offset))

describe('progression du classement des maisons', () => {
  let client
  let house
  beforeEach(() => {
    house = { id: 'house-elaris', name: 'elaris', total_xp: 1000, member_count: 4, color: '#DC143C', motto: 'Clarifier, guider, apaiser' }
    client = { from: vi.fn(table => {
      if (table === 'houses') return { select: () => ({ order: async () => ({ data: [house], error: null }) }) }
      if (table === 'gamification_data') return { select: async () => ({ data: [], error: null }) }
      throw new Error(`Unexpected table ${table}`)
    }) }
    gamificationService.supabase = client
  })

  it.each(boundaries)('conserve le niveau, le seuil et la progression canoniques à %i XP', async totalXP => {
    house.total_xp = totalXP
    const result = await gamificationService.getHousesRanking()
    const entry = result.ranking[0]
    const levelIndex = thresholds.findLastIndex(threshold => totalXP >= threshold)
    const nextThreshold = thresholds[levelIndex + 1]
    const remaining = nextThreshold === undefined ? 0 : nextThreshold - totalXP
    const expectedProgress = nextThreshold === undefined ? 100
      : ((totalXP - thresholds[levelIndex]) / (nextThreshold - thresholds[levelIndex])) * 100
    expect(entry.level).toBe(levelIndex + 1)
    expect(entry.xpToNext).toBe(remaining)
    expect(entry.progressPercent).toBeCloseTo(expectedProgress, 8)
    expect(entry.totalXP).toBe(totalXP)
    expect(entry.totalMembers).toBe(4)
    expect(result.totalUsers).toBe(4)
    expect(client.from.mock.calls.map(call => call[0])).toEqual(['houses', 'gamification_data'])
  })

  it('utilise le nom et le seuil existants de la maison plutôt qu’une seconde courbe', async () => {
    house.total_xp = 2375
    const { ranking } = await gamificationService.getHousesRanking()
    expect(ranking[0]).toMatchObject({
      level: 2, levelName: 'Maison Émergente', xpToNext: 3563, progressPercent: 0,
      totalXP: 2375, color: '#DC143C',
    })
  })

  it('présente une progression de maison partielle sans modifier ses points', async () => {
    const { ranking } = await gamificationService.getHousesRanking()
    expect(ranking[0]).toMatchObject({ level: 1, xpToNext: 1375, totalXP: 1000 })
    expect(ranking[0].progressPercent).toBeCloseTo(1000 / 2375 * 100, 8)
  })

  it('accepte les totaux numériques sérialisés sans concaténer le prochain seuil', async () => {
    house.total_xp = '1000'
    house.member_count = '0'
    const { ranking } = await gamificationService.getHousesRanking()
    expect(ranking[0]).toMatchObject({ totalXP: 1000, totalMembers: 0, xpToNext: 1375 })
    expect(ranking[0].progressPercent).toBeCloseTo(1000 / 2375 * 100, 8)
  })
})
