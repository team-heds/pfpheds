import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))

vi.mock('../../src/supabase.js', () => ({
  supabase: { rpc }
}))

import badgesService, { formatBadgeProgress } from '../../src/service/badgesService.js'

describe('progression personnelle des badges', () => {
  beforeEach(() => rpc.mockReset())

  it('lit uniquement l’agrégat calculé par Supabase', async () => {
    rpc.mockResolvedValue({
      data: [{
        id: 'badge-1',
        name: 'Contributeur',
        description: 'Publier dix fois',
        rarity: 'rare',
        xp_bonus: 50,
        conditions: { action_count: true, action_type: 'POST', count: 10 },
        condition_kind: 'action_count',
        action_type: 'POST',
        current_value: 4,
        target_value: 10,
        earned_at: null
      }],
      error: null
    })

    const [badge] = await badgesService.getMyBadgeProgress()

    expect(rpc).toHaveBeenCalledWith('get_my_badge_progress')
    expect(badge).toMatchObject({
      id: 'badge-1',
      currentValue: 4,
      targetValue: 10,
      isUnlocked: false,
      progressHint: 'Publications créées : 4/10'
    })
  })

  it('borne le texte de progression à la cible', () => {
    expect(formatBadgeProgress({
      conditionKind: 'level',
      currentValue: 7,
      targetValue: 5
    })).toBe('Niveau atteint : 5/5')
  })
})
