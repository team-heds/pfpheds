import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
vi.mock('@/supabase', () => ({ supabase: { rpc } }))

const {
  fetchGamificationAdminConsole,
  fetchGamificationRollout,
  normalizeGamificationAdminConsole,
  normalizeGamificationRollout,
} = await import(
  '@/service/adminGamificationConsoleService.js'
)

const payload = {
  version: '1', as_of: '2026-09-22T15:30:00Z', timezone: 'Europe/Zurich',
  contains_personal_data: false, write_performed: false,
  rules: [{ action_code: 'LOGIN', rule_version: 'v1', xp_amount: 5, window_kind: 'day', max_awards_per_window: 1, is_active: true }],
  content: {
    quests: { total: 4, draft: 1, scheduled: 1, active: 1, completed: 1, archived: 0 },
    challenges: { total: 2, draft: 0, scheduled: 0, active: 2, completed: 0, archived: 0 },
    badges: { total: 3, active: 2, inactive: 1 },
  },
  activity: {
    active_users_30d: 12, awards_30d: 30, xp_awarded_30d: 150,
    latest_award_at: '2026-09-22T15:00:00Z', lifecycle_transitions_30d: 2,
    rejected_events: 7, rejected_events_status: 'ok', rejected_events_reason: null,
    rejected_events_latest_at: '2026-09-22T15:20:00Z',
    rejected_events_by_reason: { cap_reached: 5, duplicate_event: 2 },
  },
  quality: { blocking_issue_count: 0, issues: {}, warnings: { quarantined_records: 28 } },
}

describe('adminGamificationConsoleService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('normalise le contrat agrégé sans données personnelles', () => {
    const result = normalizeGamificationAdminConsole(payload)
    expect(result.rules[0]).toMatchObject({ label: 'Connexion quotidienne', xpAmount: 5, maxAwards: 1 })
    expect(result.activity).toMatchObject({ activeUsers30d: 12, rejectedEventsStatus: 'ok', rejectedEvents: 7 })
    expect(result.activity.rejectionBreakdown[0]).toEqual({ reason: 'cap_reached', label: 'Plafond atteint', count: 5 })
    expect(result).not.toHaveProperty('users')
  })

  it('refuse une mesure incohérente des rejets', () => {
    expect(() => normalizeGamificationAdminConsole({
      ...payload,
      activity: { ...payload.activity, rejected_events: 0, rejected_events_status: 'unavailable' },
    })).toThrow('indisponible')
  })

  it('charge uniquement la RPC administrative en lecture seule', async () => {
    rpc.mockResolvedValue({ data: payload, error: null })
    const result = await fetchGamificationAdminConsole()
    expect(rpc).toHaveBeenCalledWith('preview_gamification_admin_console')
    expect(result.content.badges.active).toBe(2)
  })

  it('propage une erreur Supabase', async () => {
    rpc.mockResolvedValue({ data: null, error: new Error('forbidden') })
    await expect(fetchGamificationAdminConsole()).rejects.toThrow('forbidden')
  })

  it('normalise le coupe-circuit et son audience sans donnée personnelle', () => {
    expect(normalizeGamificationRollout({
      rewards_enabled: true,
      audience_mode: 'allowlist',
      allowlisted_users: 1,
      eligible_users: 1,
      updated_at: '2026-09-23T10:18:36Z',
      contains_personal_data: false,
      write_performed: false,
    })).toEqual({
      rewardsEnabled: true,
      audienceMode: 'allowlist',
      allowlistedUsers: 1,
      eligibleUsers: 1,
      updatedAt: '2026-09-23T10:18:36Z',
    })
  })

  it('charge séparément l’état de déploiement progressif', async () => {
    rpc.mockResolvedValue({
      data: {
        rewards_enabled: false,
        audience_mode: 'allowlist',
        allowlisted_users: 0,
        eligible_users: 0,
        updated_at: null,
        contains_personal_data: false,
        write_performed: false,
      },
      error: null,
    })
    const result = await fetchGamificationRollout()
    expect(rpc).toHaveBeenCalledWith('preview_gamification_rollout')
    expect(result).toMatchObject({ rewardsEnabled: false, audienceMode: 'allowlist' })
  })
})
