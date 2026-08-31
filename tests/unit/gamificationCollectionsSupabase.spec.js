import { beforeEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const responses = new Map()
const calls = []

const makeQuery = (table) => {
  const state = { table, filters: [] }
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn((column, value) => { state.filters.push([column, value]); return query }),
    lte: vi.fn((column, value) => { state.filters.push([`${column}:lte`, value]); return query }),
    or: vi.fn((value) => { state.ors = [...(state.ors || []), value]; return query }),
    order: vi.fn(() => query),
    then: (resolvePromise) => {
      calls.push(state)
      const completed = state.filters.find(([column]) => column === 'completed')?.[1]
      return Promise.resolve(responses.get(`${table}:${completed}`) || responses.get(table) || { data: [], error: null }).then(resolvePromise)
    },
  }
  return query
}

vi.mock('../../src/supabase.js', () => ({
  supabase: { from: vi.fn((table) => makeQuery(table)) },
}))

import badgesService from '../../src/service/badgesService.js'
import challengesService from '../../src/service/challengesService.js'

describe('collections gamification Supabase', () => {
  beforeEach(() => { responses.clear(); calls.length = 0 })

  it('normalise les badges Supabase pour l’interface', async () => {
    responses.set('badges', { data: [{ id: 'b1', name: 'Badge', rarity: 'rare', xp_bonus: 25, conditions: { category: 'social' }, is_active: true }], error: null })
    responses.set('user_badges', { data: [{ earned_at: '2026-08-31T10:00:00Z', badge: { id: 'b1', name: 'Badge', rarity: 'rare', xp_bonus: 25, conditions: { category: 'social' } } }], error: null })

    const [available, earned] = await Promise.all([badgesService.getAllBadges(), badgesService.getUserBadges('user-1')])

    expect(available[0]).toMatchObject({ id: 'b1', xpBonus: 25, category: 'social' })
    expect(earned[0]).toMatchObject({ id: 'b1', unlockedAt: '2026-08-31T10:00:00Z' })
    expect(calls.find((call) => call.table === 'user_badges').filters).toContainEqual(['user_id', 'user-1'])
  })

  it('normalise target_value et current_value pour les défis', async () => {
    const challenge = { id: 'c1', name: 'Défi', target_value: 5, action_type: 'quiz_complete', xp_reward: 100, week_number: 35, year: 2026, is_active: true }
    responses.set('challenges', { data: [challenge], error: null })
    responses.set('user_challenge_progress', { data: [{ challenge_id: 'c1', current_value: 3, completed: false, challenge }], error: null })

    const result = await challengesService.getUserActiveChallenges('user-1')

    expect(result[0]).toMatchObject({ id: 'c1', challengeId: 'c1', challengeName: 'Défi', target: 5, progress: 3, completed: false, type: 'quiz_complete', reward: { xp: 100 } })
    expect(calls.find((call) => call.table === 'user_challenge_progress').filters).toContainEqual(['user_id', 'user-1'])
    expect(calls.find((call) => call.table === 'challenges').ors.some((filter) => filter.includes('start_date.is.null,start_date.lte.'))).toBe(true)
  })

  it('compte uniquement les semaines réellement consécutives, même sans start_date', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-31T12:00:00Z'))
    const challenge = (id, week, startDate) => ({ id, name: id, target_value: 1, action_type: 'login_streak', xp_reward: 10, week_number: week, year: 2026, start_date: startDate, is_active: true })
    responses.set('user_challenge_progress:true', { data: [
      { challenge_id: 'c35', current_value: 1, completed: true, completed_at: '2026-08-30T12:00:00Z', challenge: challenge('c35', 35, '2026-08-27') },
      { challenge_id: 'c34', current_value: 1, completed: true, completed_at: '2026-08-23T12:00:00Z', challenge: challenge('c34', 34, '2026-08-24') },
      { challenge_id: 'c30', current_value: 1, completed: true, completed_at: '2026-07-25T12:00:00Z', challenge: challenge('c30', 30) },
    ], error: null })

    await expect(challengesService.getUserChallengeStats('user-1')).resolves.toMatchObject({ totalCompleted: 3, streakWeeks: 2 })
    vi.useRealTimers()
  })

  it('conserve les mutations exclusivement côté serveur', () => {
    expect(() => badgesService.unlockBadge('user-1', {})).toThrow(/Supabase sécurisé/)
    expect(() => challengesService.updateChallengeProgress('user-1')).toThrow(/Supabase sécurisé/)
  })

  it('ne charge plus Firebase et garde la fonctionnalité désactivée en production', () => {
    const badgeSource = readFileSync(resolve(process.cwd(), 'src/service/badgesService.js'), 'utf8')
    const challengeSource = readFileSync(resolve(process.cwd(), 'src/service/challengesService.js'), 'utf8')
    const achievementsSource = readFileSync(resolve(process.cwd(), 'src/components/gamification/AchievementsPage.vue'), 'utf8')
    const challengesSource = readFileSync(resolve(process.cwd(), 'src/components/gamification/ChallengesPage.vue'), 'utf8')
    const productionEnvironment = readFileSync(resolve(process.cwd(), '.env.production.example'), 'utf8')

    expect(badgeSource + challengeSource + achievementsSource + challengesSource).not.toMatch(/firebase\/auth|firebase\/database|dbRef/)
    expect(achievementsSource).toContain('useAuthStore')
    expect(challengesSource).toContain('useAuthStore')
    expect(productionEnvironment).toContain('VITE_GAMIFICATION_BADGES_CHALLENGES=false')
    const profileSource = readFileSync(resolve(process.cwd(), 'src/components/gamification/GamificationProfilePage.vue'), 'utf8')
    expect(profileSource).toContain('v-if="collectionsEnabled"')
    expect(profileSource).toContain('if (!collectionsEnabled) return')
  })
})
