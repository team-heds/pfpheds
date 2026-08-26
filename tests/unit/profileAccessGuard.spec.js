import { beforeEach, describe, expect, it, vi } from 'vitest'

const resolveAccessibleUserProfileId = vi.fn()
vi.mock('@/service/globalSearchService', () => ({ resolveAccessibleUserProfileId }))

const { profileAccessGuard } = await import('@/router/guards/profileAccessGuard')

describe('profileAccessGuard', () => {
  beforeEach(() => resolveAccessibleUserProfileId.mockReset())

  it('autorise le profil validé par Supabase', async () => {
    resolveAccessibleUserProfileId.mockResolvedValue('00000000-0000-4000-8000-000000000001')
    await expect(
      profileAccessGuard({
        name: 'Profile',
        params: { id: '00000000-0000-4000-8000-000000000001' }
      })
    ).resolves.toBe(true)
  })

  it('redirige un accès direct hors périmètre', async () => {
    resolveAccessibleUserProfileId.mockResolvedValue(null)
    await expect(profileAccessGuard({ params: { id: 'private-user' } })).resolves.toEqual({
      path: '/access',
      query: { reason: 'profile-scope' }
    })
  })

  it('remplace un ancien identifiant Firebase par le UUID Supabase autorisé', async () => {
    resolveAccessibleUserProfileId.mockResolvedValue('00000000-0000-4000-8000-000000000002')

    await expect(
      profileAccessGuard({
        name: 'ProfileAdmin',
        params: { id: 'legacy-firebase-id' },
        query: { tab: 'stages' }
      })
    ).resolves.toEqual({
      name: 'ProfileAdmin',
      params: { id: '00000000-0000-4000-8000-000000000002' },
      query: { tab: 'stages' },
      replace: true
    })
  })
})
