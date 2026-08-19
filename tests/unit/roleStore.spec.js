import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const mockGetSession = vi.fn()
const mockRpc = vi.fn()
const mockFrom = vi.fn()
let authStateCallback = null

vi.mock('@/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args) => mockGetSession(...args),
      onAuthStateChange: vi.fn((callback) => {
        authStateCallback = callback
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
    },
    rpc: (...args) => mockRpc(...args),
    from: (...args) => mockFrom(...args),
  },
}))

const { useRoleStore } = await import('@/stores/role')

describe('roleStore reliability', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useRoleStore()
    vi.clearAllMocks()
    authStateCallback = null
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockRpc.mockResolvedValue({ data: [], error: null })
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })
  })

  it('reuses the session already resolved by the auth bootstrap', async () => {
    const session = { user: { id: 'u1' } }
    mockRpc.mockResolvedValue({ data: [{ perm: 'admin' }], error: null })

    await store.init({ session, sessionResolved: true })

    expect(mockGetSession).not.toHaveBeenCalled()
    expect(store.perms).toContain('admin')
  })

  it('keeps the auth callback synchronous and defers permission queries', async () => {
    await store.init({ session: null, sessionResolved: true })
    mockRpc.mockClear()

    const result = authStateCallback('SIGNED_IN', { user: { id: 'u2' } })

    expect(result).toBeUndefined()
    expect(mockRpc).not.toHaveBeenCalled()
    await new Promise((resolve) => queueMicrotask(resolve))
    await Promise.resolve()
    expect(mockRpc).toHaveBeenCalledOnce()
  })

  it('deduplicates concurrent initialization', async () => {
    const session = { user: { id: 'u3' } }

    await Promise.all([
      store.init({ session, sessionResolved: true }),
      store.init({ session, sessionResolved: true }),
    ])

    expect(mockRpc).toHaveBeenCalledOnce()
  })

  it('never applies permissions resolved for a previous authenticated user', async () => {
    await store.init({
      session: { user: { id: 'old-user' } },
      sessionResolved: true,
    })

    let resolveOldPermissions
    mockRpc.mockReset()
    mockRpc
      .mockReturnValueOnce(new Promise((resolve) => {
        resolveOldPermissions = resolve
      }))
      .mockResolvedValueOnce({ data: [{ perm: 'new-user' }], error: null })

    const oldRequest = store.loadPermissions({ user: { id: 'old-user' } })
    await Promise.resolve()

    authStateCallback('SIGNED_IN', { user: { id: 'new-user' } })
    await new Promise((resolve) => queueMicrotask(resolve))
    await vi.waitFor(() => expect(mockRpc).toHaveBeenCalledTimes(2))

    resolveOldPermissions({ data: [{ perm: 'old-user' }], error: null })
    await oldRequest
    await vi.waitFor(() => expect(store.perms).toEqual(['new-user']))

    expect(store.perms).not.toContain('old-user')
  })
})
