import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const addUserXP = vi.fn()

vi.mock('@/service/gamificationServiceSupabase', () => ({
  default: { addUserXP },
}))

const { default: gamificationIntegration } = await import('@/service/gamificationIntegration.js')

describe('gamificationIntegration Supabase contract', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  afterEach(() => vi.restoreAllMocks())

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

  it('scopes a fresh badge notification to the account whose action completed', async () => {
    const dispatch = vi.spyOn(window, 'dispatchEvent')
    addUserXP.mockResolvedValue({ xp_gained: 25, duplicate: false, badges_unlocked: [{ id: 'new-badge', name: 'Première réussite' }] })
    await gamificationIntegration.processUserAction('student-a', 'POST')
    expect(dispatch).toHaveBeenCalledTimes(1)
    expect(dispatch.mock.calls[0][0].type).toBe('gamification:notification')
    expect(dispatch.mock.calls[0][0].detail).toMatchObject({ userId: 'student-a', type: 'badge', badgeId: 'new-badge', dedupeKey: 'badge:new-badge' })
  })

  it('does not replay badge celebrations when an idempotent response repeats old badges', async () => {
    const dispatch = vi.spyOn(window, 'dispatchEvent')
    addUserXP.mockResolvedValue({ xp_gained: 0, duplicate: true, badges_unlocked: [{ id: 'old-badge' }] })
    const result = await gamificationIntegration.processUserAction('student-a', 'LOGIN')
    expect(result).toMatchObject({ success: true, duplicate: true, xpGained: 0, badgesUnlocked: [] })
    expect(dispatch).not.toHaveBeenCalled()
  })

  it('does not import a Firebase gamification service', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/service/gamificationIntegration.js'), 'utf8')

    expect(source).not.toMatch(/badgesService|challengesService|hesHousesService|gamificationService['"]/)
    expect(source).toContain('gamificationServiceSupabase')
  })
})
