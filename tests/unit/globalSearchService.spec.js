import { beforeEach, describe, expect, it, vi } from 'vitest'

const rpc = vi.fn()
const selectModules = vi.fn()
const from = vi.fn(() => ({ select: selectModules }))

vi.mock('@/supabase', () => ({ supabase: { rpc, from } }))

const {
  canViewUserProfile,
  searchAccessibleProfiles,
  searchModules,
} = await import('@/service/globalSearchService')

describe('globalSearchService', () => {
  beforeEach(() => {
    rpc.mockReset()
    from.mockClear()
    selectModules.mockReset()
  })

  it('recherche les profils via le RPC Supabase avec un payload minimal', async () => {
    rpc.mockResolvedValue({
      data: [{ user_id: 'user-1', display_name: 'Antoine Test', avatar_url: null, role_label: 'Étudiant' }],
      error: null,
    })

    const results = await searchAccessibleProfiles('Antoine')

    expect(rpc).toHaveBeenCalledWith('search_accessible_user_profiles', {
      p_query: 'Antoine',
      p_limit: 10,
    })
    expect(results[0]).toMatchObject({
      id: 'user-1',
      name: 'Antoine Test',
      route: { name: 'Profile', params: { id: 'user-1' } },
    })
    expect(results[0]).not.toHaveProperty('email')
  })

  it('recherche les modules uniquement depuis le service Supabase', async () => {
    selectModules.mockResolvedValue({
      data: [
        { id: 1, title: 'Anatomie', code: 'ANA', description: 'Bases' },
        { id: 2, title: 'Physiologie', code: 'PHY', description: 'Systèmes' },
      ],
      error: null,
    })

    const results = await searchModules('anato')

    expect(results).toHaveLength(1)
    expect(from).toHaveBeenCalledWith('modules')
    expect(selectModules).toHaveBeenCalledWith('id, code, title, description')
    expect(results[0].route).toEqual({ name: 'ModulesPage', query: { module: 1 } })
  })

  it('refuse par défaut quand le RPC de profil répond faux', async () => {
    rpc.mockResolvedValue({ data: false, error: null })
    await expect(canViewUserProfile('student-2')).resolves.toBe(false)
  })
})
