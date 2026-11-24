import { describe, expect, it, vi } from 'vitest'

vi.mock('@/stores/role', () => ({ useRoleStore: vi.fn() }))

import { ADMIN_PERMISSIONS, hasAdminAccess, resolveAdminAccess } from '@/utils/adminAccess'

const storeWith = (perms, init = vi.fn().mockResolvedValue()) => ({
  perms,
  init,
  can: (wanted) => perms.includes('super.all') || wanted.some((perm) => perms.includes(perm)),
})

describe('adminAccess', () => {
  it('reconnaît admin et super.all', () => {
    expect(ADMIN_PERMISSIONS).toEqual(['admin', 'super.all'])
    expect(hasAdminAccess(storeWith(['admin']))).toBe(true)
    expect(hasAdminAccess(storeWith(['super.all']))).toBe(true)
    expect(hasAdminAccess(storeWith(['EtudiantPhysio', 'SI.ADMIN']))).toBe(false)
  })

  it('attend les permissions avant de décider', async () => {
    const store = storeWith([])
    store.init = vi.fn(async () => { store.perms.push('admin') })
    await expect(resolveAdminAccess(store)).resolves.toBe(true)
    expect(store.init).toHaveBeenCalledOnce()
  })

  it('refuse si les permissions ne se chargent pas', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const store = storeWith([], vi.fn().mockRejectedValue(new Error('réseau')))
    await expect(resolveAdminAccess(store)).resolves.toBe(false)
    warn.mockRestore()
  })
})
