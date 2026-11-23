import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const state = vi.hoisted(() => ({ trackRoles: { data: [], error: null } }))

vi.mock('@/supabase', () => {
  const query = (result) => {
    const chain = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: async () => result,
      then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
    }
    return chain
  }
  return {
    supabase: {
      rpc: async () => ({ data: [{ perm: 'EnseignantSoins' }], error: null }),
      from: (table) => (table === 'user_track_roles'
        ? query(state.trackRoles)
        : query({ data: { role: 'EnseignantSoins', permissions: ['RMSoins'] }, error: null })),
    },
  }
})

import { useRoleStore } from '@/stores/role'

const session = { user: { id: 'user-test' } }

describe('rôles de filière dans le store des rôles', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('ajoute seulement les rôles actifs et non expirés', async () => {
    state.trackRoles = {
      data: [
        { track_id: 'SI', role: 'ADMIN', expires_at: null },
        { track_id: 'PHY', role: 'ADMIN', expires_at: '2000-01-01T00:00:00Z' },
      ],
      error: null,
    }
    const store = useRoleStore()
    store.session = session

    await store.loadPermissions(session)

    expect(store.perms).toContain('SI.ADMIN')
    expect(store.perms).not.toContain('PHY.ADMIN')
    expect(store.perms).not.toContain('admin')
  })

  it('garde les permissions du profil si la lecture échoue', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    state.trackRoles = { data: null, error: { message: 'indisponible' } }
    const store = useRoleStore()
    store.session = session

    await store.loadPermissions(session)

    expect(store.perms).toEqual(expect.arrayContaining(['EnseignantSoins', 'RMSoins']))
  })
})
