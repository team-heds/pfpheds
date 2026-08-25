import { beforeEach, describe, expect, it, vi } from 'vitest'

const canViewUserProfile = vi.fn()
vi.mock('@/service/globalSearchService', () => ({ canViewUserProfile }))

const { profileAccessGuard } = await import('@/router/guards/profileAccessGuard')

describe('profileAccessGuard', () => {
  beforeEach(() => canViewUserProfile.mockReset())

  it('autorise le profil validé par Supabase', async () => {
    canViewUserProfile.mockResolvedValue(true)
    await expect(profileAccessGuard({ params: { id: 'allowed-user' } })).resolves.toBe(true)
  })

  it('redirige un accès direct hors périmètre', async () => {
    canViewUserProfile.mockResolvedValue(false)
    await expect(profileAccessGuard({ params: { id: 'private-user' } })).resolves.toEqual({
      path: '/access',
      query: { reason: 'profile-scope' },
    })
  })
})
