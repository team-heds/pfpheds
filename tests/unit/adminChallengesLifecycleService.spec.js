import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))

vi.mock('@/supabase', () => ({
  supabase: { rpc }
}))

import adminChallengesService from '@/service/adminChallengesService'

describe('adminChallengesService lifecycle', () => {
  beforeEach(() => rpc.mockReset())

  it('uses the audited challenge transition RPC', async () => {
    rpc.mockResolvedValue({ data: { changed: true, status: 'active' }, error: null })

    const result = await adminChallengesService.changeChallengeStatus(
      'challenge-1',
      'active',
      'Publication pilote'
    )

    expect(rpc).toHaveBeenCalledWith('transition_gamification_lifecycle', {
      p_entity_kind: 'challenge',
      p_entity_id: 'challenge-1',
      p_next_status: 'active',
      p_reason: 'Publication pilote'
    })
    expect(result.status).toBe('active')
  })

  it('loads the read-only lifecycle preview', async () => {
    rpc.mockResolvedValue({
      data: { effective_status: 'scheduled', write_performed: false, validation: { valid: true } },
      error: null
    })

    const result = await adminChallengesService.previewChallengeLifecycle('challenge-2')

    expect(rpc).toHaveBeenCalledWith('preview_gamification_lifecycle', {
      p_entity_kind: 'challenge',
      p_entity_id: 'challenge-2'
    })
    expect(result.write_performed).toBe(false)
  })

  it('archives instead of deleting challenge history', async () => {
    rpc.mockResolvedValue({ data: { changed: true, status: 'archived' }, error: null })

    await expect(adminChallengesService.archiveChallenge('challenge-3')).resolves.toBe(true)
    expect(rpc).toHaveBeenCalledWith('transition_gamification_lifecycle', {
      p_entity_kind: 'challenge',
      p_entity_id: 'challenge-3',
      p_next_status: 'archived',
      p_reason: 'Archivage depuis l’administration'
    })
  })
})
