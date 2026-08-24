import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  from: vi.fn(),
  storageFrom: vi.fn(),
  list: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  getPublicUrl: vi.fn()
}))

vi.mock('@/supabase.js', () => ({
  supabase: {
    auth: { getUser: (...args) => mocks.getUser(...args) },
    from: (...args) => mocks.from(...args),
    storage: { from: (...args) => mocks.storageFrom(...args) }
  }
}))

import { SupabaseStorageService } from '@/service/supabaseStorageService'

function profileUpdateResult(result) {
  const chain = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result)
  }
  mocks.from.mockReturnValue(chain)
  return chain
}

describe('SupabaseStorageService', () => {
  let service
  let storageBucket

  beforeEach(() => {
    vi.clearAllMocks()
    service = new SupabaseStorageService()
    storageBucket = {
      list: (...args) => mocks.list(...args),
      upload: (...args) => mocks.upload(...args),
      remove: (...args) => mocks.remove(...args),
      getPublicUrl: (...args) => mocks.getPublicUrl(...args)
    }
    mocks.storageFrom.mockReturnValue(storageBucket)
    mocks.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null })
    mocks.list.mockResolvedValue({ data: [{ name: 'old-avatar.jpg' }], error: null })
    mocks.upload.mockResolvedValue({ data: { path: 'uploaded' }, error: null })
    mocks.remove.mockResolvedValue({ data: [], error: null })
    mocks.getPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.test/new-avatar.jpg' } })
  })

  it('refuse les formats et tailles non autorisés', () => {
    expect(() => service.validateAvatarFile({ type: 'image/svg+xml', size: 100 })).toThrow('Format non supporte')
    expect(() => service.validateAvatarFile({ type: 'image/png', size: 5 * 1024 * 1024 + 1 })).toThrow('5 MB')
  })

  it("refuse de modifier l'avatar d'un autre utilisateur", async () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    await expect(service.replaceUserAvatar('user-2', file)).rejects.toThrow('propre avatar')

    expect(mocks.upload).not.toHaveBeenCalled()
    expect(mocks.from).not.toHaveBeenCalled()
  })

  it("persiste le nouvel avatar avant de supprimer l'ancien", async () => {
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    const chain = profileUpdateResult({
      data: { user_id: 'user-1', avatar_url: 'https://cdn.test/new-avatar.jpg' },
      error: null
    })

    const result = await service.replaceUserAvatar('user-1', file, { city: 'Sion' })

    const uploadedPath = mocks.upload.mock.calls[0][0]
    expect(uploadedPath).toMatch(/^user-1\/avatar-.+\.png$/)
    expect(mocks.upload.mock.calls[0][2]).toMatchObject({ upsert: false, contentType: 'image/png' })
    expect(chain.update).toHaveBeenCalledWith(expect.objectContaining({ city: 'Sion', avatar_url: result.url }))
    expect(chain.select).toHaveBeenCalledWith('user_id, avatar_url, updated_at')
    expect(mocks.remove).toHaveBeenCalledWith(['user-1/old-avatar.jpg'])
    expect(chain.single.mock.invocationCallOrder[0]).toBeLessThan(mocks.remove.mock.invocationCallOrder[0])
  })

  it("supprime le nouveau fichier et conserve l'ancien si la base refuse la mise à jour", async () => {
    const file = new File(['avatar'], 'avatar.webp', { type: 'image/webp' })
    profileUpdateResult({ data: null, error: { message: 'RLS denied' } })

    await expect(service.replaceUserAvatar('user-1', file)).rejects.toThrow('RLS denied')

    const uploadedPath = mocks.upload.mock.calls[0][0]
    expect(mocks.remove).toHaveBeenCalledTimes(1)
    expect(mocks.remove).toHaveBeenCalledWith([uploadedPath])
    expect(mocks.remove).not.toHaveBeenCalledWith(['user-1/old-avatar.jpg'])
  })

  it("signale un fichier orphelin si la compensation échoue", async () => {
    const file = new File(['avatar'], 'avatar.webp', { type: 'image/webp' })
    profileUpdateResult({ data: null, error: { message: 'RLS denied' } })
    mocks.remove.mockResolvedValue({ data: null, error: { message: 'storage unavailable' } })

    await expect(service.replaceUserAvatar('user-1', file)).rejects.toThrow(
      'Le nettoyage du nouvel avatar a aussi echoue: storage unavailable'
    )

    expect(mocks.remove).toHaveBeenCalledTimes(1)
  })

  it("ne supprime pas l'ancien fichier si le nouvel upload échoue", async () => {
    const file = new File(['avatar'], 'avatar.jpg', { type: 'image/jpeg' })
    mocks.upload.mockResolvedValue({ data: null, error: { message: 'network down' } })

    await expect(service.replaceUserAvatar('user-1', file)).rejects.toThrow('network down')

    expect(mocks.from).not.toHaveBeenCalled()
    expect(mocks.remove).not.toHaveBeenCalled()
  })
})
