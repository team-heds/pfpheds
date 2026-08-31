import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const addUserXP = vi.fn()

vi.mock('@/service/gamificationServiceSupabase', () => ({
  default: { addUserXP },
}))

const { default: gamificationIntegration } = await import('@/service/gamificationIntegration.js')

describe('gamificationIntegration Supabase contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('records a post through the Supabase engine once', async () => {
    addUserXP.mockResolvedValue({
      xp_gained: 25,
      duplicate: false,
      badges_unlocked: [{ id: 'badge-1' }],
    })

    const result = await gamificationIntegration.onSocialInteraction('browser-user-id', {
      action: 'post',
      targetId: '11111111-1111-1111-1111-111111111111',
    })

    expect(addUserXP).toHaveBeenCalledWith(
      'browser-user-id',
      'POST',
      expect.objectContaining({
        targetId: '11111111-1111-1111-1111-111111111111',
      })
    )
    expect(result).toMatchObject({
      success: true,
      xpGained: 25,
      duplicate: false,
      badgesUnlocked: [{ id: 'badge-1' }],
    })
  })

  it('does not call a legacy reward engine for unverifiable UI-only actions', async () => {
    const result = await gamificationIntegration.onSocialInteraction('browser-user-id', {
      action: 'like',
      targetId: '11111111-1111-1111-1111-111111111111',
    })

    expect(addUserXP).not.toHaveBeenCalled()
    expect(result).toMatchObject({ success: true, xpGained: 0 })
    expect(result.rewardSupported).toBe(false)
  })

  it('does not import a Firebase gamification service', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/service/gamificationIntegration.js'), 'utf8')

    expect(source).not.toMatch(/badgesService|challengesService|hesHousesService|gamificationService['"]/)
    expect(source).toContain('gamificationServiceSupabase')
  })
})
