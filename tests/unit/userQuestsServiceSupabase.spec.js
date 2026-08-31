import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
const eq = vi.fn()
const select = vi.fn(() => ({ eq }))
const from = vi.fn(() => ({ select }))

vi.mock('@/supabase', () => ({
  supabase: { rpc, from },
}))

const { default: userQuestsService } = await import('@/service/userQuestsService.js')

describe('userQuestsService secure writes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    select.mockReturnValue({ eq })
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

  it('returns one canonical quest stats contract with temporary compatibility aliases', async () => {
    eq.mockResolvedValue({
      data: [
        { status: 'not_started', progress: null, quest: { xp_reward: 10 } },
        { status: 'in_progress', progress: 50, quest: { xp_reward: 20 } },
        { status: 'completed', progress: 100, quest: { xp_reward: 30 } },
        { status: 'failed', progress: 25, quest: { xp_reward: 40 } },
      ],
      error: null,
    })

    const stats = await userQuestsService.getQuestStats('user-1')

    expect(from).toHaveBeenCalledWith('user_quest_progress')
    expect(eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(stats).toMatchObject({
      totalQuests: 4,
      notStartedQuests: 1,
      activeQuests: 1,
      completedQuests: 1,
      failedQuests: 1,
      totalXPFromQuests: 30,
      averageProgress: 44,
      total: 4,
      completed: 1,
      totalCompleted: 1,
      totalXP: 30,
    })
  })

  it('returns a complete zeroed stats contract when Supabase fails', async () => {
    eq.mockResolvedValue({ data: null, error: new Error('offline') })

    await expect(userQuestsService.getQuestStats('user-1')).resolves.toEqual({
      totalQuests: 0,
      notStartedQuests: 0,
      activeQuests: 0,
      completedQuests: 0,
      failedQuests: 0,
      totalXPFromQuests: 0,
      averageProgress: 0,
      total: 0,
      notStarted: 0,
      inProgress: 0,
      completed: 0,
      failed: 0,
      totalXP: 0,
      totalCompleted: 0,
    })
  })
})
