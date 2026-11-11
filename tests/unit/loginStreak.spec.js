import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  formatStreakDays,
  loginStreakNotificationFromLog,
  nextMilestoneLabel,
  nextMilestoneProgress,
  normalizeLoginStreak,
  streakLabel,
  todaysStreakNotifications,
} from '@/utils/loginStreak'

const addUserXP = vi.fn()
const getMyLoginStreak = vi.fn()
vi.mock('@/service/gamificationServiceSupabase', () => ({
  default: { addUserXP, getMyLoginStreak },
}))
const { default: gamificationIntegration } = await import('@/service/gamificationIntegration.js')

const serverStreak = (overrides = {}) => ({
  is_player: true,
  current_streak: 12,
  best_streak: 15,
  logged_in_today: true,
  academic_year: '2026-2027',
  next_milestone: { days: 30, xp_amount: 100, days_remaining: 18 },
  milestones: [
    { days: 30, xp_amount: 100, badge_id: 'b30', badge_name: 'Flamme de 30 jours', reached: false, reached_today: false, event_key: 'login-streak:2026-2027:30' },
    { days: 7, xp_amount: 20, badge_id: 'b7', badge_name: 'Flamme de 7 jours', reached: true, reached_today: false, event_key: 'login-streak:2026-2027:7' },
    { days: 100, xp_amount: 300, badge_id: 'b100', badge_name: 'Flamme de 100 jours', reached: false, reached_today: false, event_key: 'login-streak:2026-2027:100' },
  ],
  ...overrides,
})

describe('série de connexions — affichage', () => {
  it('met en forme la série renvoyée par le serveur', () => {
    const streak = normalizeLoginStreak(serverStreak())
    expect(streak.current).toBe(12)
    expect(streak.best).toBe(15)
    expect(streak.milestones.map((m) => m.days)).toEqual([7, 30, 100])
    expect(streakLabel(streak.current)).toBe('12 jours de suite')
    expect(nextMilestoneLabel(streak)).toBe('Encore 18 jours avant le palier des 30 jours (+100 XP)')
    expect(nextMilestoneProgress(streak)).toBe(40)
  })

  it('gère le singulier, la série vide et les paliers tous atteints', () => {
    expect(streakLabel(1)).toBe('1 jour de suite')
    expect(streakLabel(0)).toBe('Aucune série en cours')
    expect(formatStreakDays(1)).toBe('1 jour')
    const done = normalizeLoginStreak(serverStreak({ current_streak: 120, next_milestone: null }))
    expect(nextMilestoneLabel(done)).toBe('Tous les paliers de cette année sont atteints.')
    expect(nextMilestoneProgress(done)).toBe(100)
  })

  it('ne montre rien aux comptes non joueurs ou sans réponse', () => {
    expect(normalizeLoginStreak({ is_player: false, current_streak: 0 })).toBeNull()
    expect(normalizeLoginStreak(null)).toBeNull()
  })

  it('annonce un palier une seule fois, avec la même clé que le journal temps réel', () => {
    const streak = normalizeLoginStreak(serverStreak({
      current_streak: 7,
      milestones: [{ days: 7, xp_amount: 20, reached: true, reached_today: true, event_key: 'login-streak:2026-2027:7' }],
    }))
    const [immediate] = todaysStreakNotifications(streak, 'user-1')
    const fromLog = loginStreakNotificationFromLog({ action: 'LOGIN_STREAK', amount: 20, event_key: 'login-streak:2026-2027:7' })
    expect(immediate).toMatchObject({ userId: 'user-1', type: 'streak', title: 'Série de 7 jours !', xpGain: 20 })
    expect(fromLog.dedupeKey).toBe(immediate.dedupeKey)
    expect(fromLog).not.toHaveProperty('userId')
    expect(loginStreakNotificationFromLog({ action: 'LOGIN_STREAK', amount: 20 })).toBeNull()
  })
})

describe('série de connexions — connexion du jour', () => {
  beforeEach(() => vi.clearAllMocks())
  afterEach(() => vi.restoreAllMocks())

  it('annonce le palier après une nouvelle connexion quotidienne', async () => {
    const dispatchEvent = vi.spyOn(window, 'dispatchEvent')
    addUserXP.mockResolvedValue({ xp_gained: 5, duplicate: false, badges_unlocked: [] })
    getMyLoginStreak.mockResolvedValue(normalizeLoginStreak(serverStreak({
      current_streak: 7,
      milestones: [{ days: 7, xp_amount: 20, reached: true, reached_today: true, event_key: 'login-streak:2026-2027:7' }],
    })))

    await gamificationIntegration.onLogin('user-1')

    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({
      type: 'gamification:notification',
      detail: expect.objectContaining({ type: 'streak', xpGain: 20, dedupeKey: 'streak:login-streak:2026-2027:7' }),
    }))
    expect(dispatchEvent).toHaveBeenCalledWith(expect.objectContaining({ type: 'gamification:login-streak' }))
  })

  it('ne relit pas la série pour une connexion déjà comptée', async () => {
    addUserXP.mockResolvedValue({ xp_gained: 0, duplicate: true, badges_unlocked: [] })
    await gamificationIntegration.onLogin('user-1')
    expect(getMyLoginStreak).not.toHaveBeenCalled()
  })

  it('ne casse pas la connexion du jour si la série est indisponible', async () => {
    addUserXP.mockResolvedValue({ xp_gained: 5, duplicate: false, badges_unlocked: [] })
    getMyLoginStreak.mockRejectedValue(new Error('function not found'))
    const result = await gamificationIntegration.onLogin('user-1')
    expect(result).toMatchObject({ success: true, xpGained: 5 })
  })
})

describe('série de connexions — contrat de la migration', () => {
  const sql = readFileSync(resolve(process.cwd(), 'supabase/migrations/20261111100000_gamification_login_streak.sql'), 'utf8')

  it('paie les paliers 7, 30 et 100 jours par le moteur serveur, une fois par année académique', () => {
    expect(sql).toMatch(/\(7, 20, '[0-9a-f-]{36}'\)/)
    expect(sql).toMatch(/\(30, 100, '[0-9a-f-]{36}'\)/)
    expect(sql).toMatch(/\(100, 300, '[0-9a-f-]{36}'\)/)
    expect(sql).toContain('primary key (user_id, academic_year, milestone_days)')
    expect(sql).toContain('public.gamification_award_xp_internal(')
    expect(sql).toContain("'login-streak:' || v_year || ':' || v_tier.milestone_days::text")
    expect(sql).toContain("at time zone 'Europe/Zurich'")
  })

  it('réserve la série aux joueurs et ferme les tables privées', () => {
    expect(sql).toContain('gamification_private.is_rollout_member(p_user_id)')
    expect(sql).toContain("lower(h.name) = 'gamemaster'")
    for (const table of ['login_streak_tiers', 'login_streak_milestones']) {
      expect(sql).toContain(`alter table gamification_private.${table} enable row level security`)
      expect(sql).toContain(`revoke all on gamification_private.${table} from public, anon, authenticated`)
    }
    expect(sql).toContain('revoke all on function public.get_my_login_streak() from public, anon')
    expect(sql).toContain('grant execute on function public.get_my_login_streak() to authenticated')
  })

  it('diffère le bonus à la fin de la transaction et reste rejouable', () => {
    expect(sql).toContain('deferrable initially deferred')
    expect(sql).toContain('create table if not exists gamification_private.login_streak_milestones')
    expect(sql).toContain('on conflict (id) do nothing')
    expect(sql).not.toMatch(/\bdrop\s+(table|trigger|function|policy)\b/i)
  })
})
