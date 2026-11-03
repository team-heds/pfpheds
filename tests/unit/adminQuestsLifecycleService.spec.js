import { beforeEach, describe, expect, it, vi } from 'vitest'

const { rpc } = vi.hoisted(() => ({ rpc: vi.fn() }))

vi.mock('@/supabase', () => ({
  supabase: { rpc }
}))

import adminQuestsService from '@/service/adminQuestsService'

describe('adminQuestsService lifecycle', () => {
  beforeEach(() => rpc.mockReset())

  it('uses the audited lifecycle RPC instead of updating status directly', async () => {
    rpc.mockResolvedValue({
      data: { changed: true, status: 'active', assigned_count: 12 },
      error: null
    })

    const result = await adminQuestsService.changeQuestStatus(
      'quest-1',
      'active',
      'Publication pilote'
    )

    expect(rpc).toHaveBeenCalledWith('transition_gamification_lifecycle', {
      p_entity_kind: 'quest',
      p_entity_id: 'quest-1',
      p_next_status: 'active',
      p_reason: 'Publication pilote'
    })
    expect(result).toMatchObject({ status: 'active', assigned_count: 12 })
  })

  it('loads a read-only audience preview from the server', async () => {
    rpc.mockResolvedValue({
      data: {
        current_status: 'draft',
        audience_count: 64,
        assigned_count: 0,
        write_performed: false,
        validation: { valid: true, errors: [] }
      },
      error: null
    })

    const result = await adminQuestsService.previewQuestLifecycle('quest-2')

    expect(rpc).toHaveBeenCalledWith('preview_gamification_lifecycle', {
      p_entity_kind: 'quest',
      p_entity_id: 'quest-2'
    })
    expect(result.write_performed).toBe(false)
    expect(result.audience_count).toBe(64)
  })

  it('archives instead of deleting quest history', async () => {
    rpc.mockResolvedValue({ data: { changed: true, status: 'archived' }, error: null })

    await expect(adminQuestsService.deleteQuest('quest-3')).resolves.toBe(true)
    expect(rpc).toHaveBeenCalledWith('transition_gamification_lifecycle', {
      p_entity_kind: 'quest',
      p_entity_id: 'quest-3',
      p_next_status: 'archived',
      p_reason: 'Archivage depuis l’administration'
    })
  })
})
