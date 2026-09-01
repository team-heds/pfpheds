import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()

vi.mock('@/supabase', () => ({
  supabase: { rpc },
}))

const { default: userQuestsService } = await import('@/service/userQuestsService.js')

describe('userQuestsService secure writes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts the authenticated user quest without sending a browser user id', async () => {
    rpc.mockResolvedValue({
      data: { quest_id: 'quest-1', status: 'in_progress' },
      error: null,
    })

    const result = await userQuestsService.startQuest('untrusted-browser-user', 'quest-1')

    expect(rpc).toHaveBeenCalledWith('start_my_quest', { p_quest_id: 'quest-1' })
    expect(rpc.mock.calls[0][1]).not.toHaveProperty('p_user_id')
    expect(result).toMatchObject({ quest_id: 'quest-1', status: 'in_progress' })
  })

  it('does not let the browser choose quest progress or completion', async () => {
    await expect(
      userQuestsService.updateQuestProgress('user-1', 'quest-1', 100, 5)
    ).rejects.toThrow('action serveur')

    await expect(
      userQuestsService.completeQuest('user-1', 'quest-1')
    ).rejects.toThrow('action serveur')

    expect(rpc).not.toHaveBeenCalled()
  })
})
