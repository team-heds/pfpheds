import { beforeEach, describe, expect, it, vi } from 'vitest'

const { calls, supabaseMock, gamification, control } = vi.hoisted(() => {
  const calls = []
  const control = { uploadError: null, insertError: null, mediaError: null }
  const supabaseMock = {
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn(async (path) => {
          calls.push(['upload', path])
          return { error: control.uploadError }
        }),
        getPublicUrl: (path) => ({ data: { publicUrl: `https://cdn.test/${path}` } }),
        remove: vi.fn(async (paths) => {
          calls.push(['remove-files', paths.length])
          return { error: null }
        })
      }))
    },
    from: vi.fn((table) => ({
      insert: vi.fn((rows) => {
        calls.push(['insert', table, rows])
        if (table === 'posts') {
          return {
            select: () => ({
              single: async () =>
                control.insertError
                  ? { data: null, error: control.insertError }
                  : { data: { id: 'post-1', created_at: '2026-11-10T12:00:00Z' }, error: null }
            })
          }
        }
        return Promise.resolve({ error: control.mediaError })
      }),
      delete: vi.fn(() => ({
        eq: vi.fn(async (col, value) => {
          calls.push(['delete', table, value])
          return { error: null }
        })
      }))
    }))
  }
  const gamification = { onSocialInteraction: vi.fn(async () => ({ ok: true })) }
  return { calls, supabaseMock, gamification, control }
})

vi.mock('@/supabase.js', () => ({ supabase: supabaseMock }))
vi.mock('@/service/gamificationIntegration', () => ({ default: gamification }))

import { publishPost } from '@/service/postPublishService'

const user = { id: 'user-1', email: 'lea@example.invalid', user_metadata: { full_name: 'Léa Martin' } }
const photo = { name: 'Stage été.jpg', type: 'image/jpeg', size: 1000 }

beforeEach(() => {
  calls.length = 0
  Object.assign(control, { uploadError: null, insertError: null, mediaError: null })
  gamification.onSocialInteraction.mockClear()
})

describe('publishPost', () => {
  it('envoie les médias, crée la publication puis appelle la gamification POST', async () => {
    const result = await publishPost({ user, content: '<p>Bravo #santé @tom</p>', files: [photo] })

    expect(calls.map((c) => c.slice(0, 2))).toEqual([
      ['upload', expect.stringMatching(/^posts\/user-1\/\d+_0_Stage-ete\.jpg$/)],
      ['insert', 'posts'],
      ['insert', 'post_media']
    ])
    expect(calls[1][2][0]).toMatchObject({
      user_id: 'user-1',
      author_name: 'Léa Martin',
      hashtags: { santé: true },
      mentions: { tom: true },
      community_id: null
    })
    expect(gamification.onSocialInteraction).toHaveBeenCalledWith(
      'user-1',
      expect.objectContaining({ action: 'post', targetType: 'post', targetId: 'post-1', hasMedia: true })
    )
    expect(result).toMatchObject({ id: 'post-1', authorName: 'Léa Martin', media: [{ type: 'image/jpeg' }] })
  })

  it('ne crée rien si l’envoi d’un média échoue', async () => {
    control.uploadError = new Error('Payload too large')
    await expect(publishPost({ user, content: '<p>Salut</p>', files: [photo] })).rejects.toThrow('Payload too large')
    expect(calls.some((c) => c[0] === 'insert')).toBe(false)
    expect(gamification.onSocialInteraction).not.toHaveBeenCalled()
  })

  it('retire la publication si ses médias ne peuvent pas être enregistrés', async () => {
    control.mediaError = new Error('denied')
    await expect(publishPost({ user, content: '<p>Salut</p>', files: [photo] })).rejects.toThrow('denied')
    expect(calls).toContainEqual(['delete', 'posts', 'post-1'])
    expect(calls).toContainEqual(['remove-files', 1])
    expect(gamification.onSocialInteraction).not.toHaveBeenCalled()
  })

  it('garde la publication si la gamification échoue', async () => {
    gamification.onSocialInteraction.mockRejectedValueOnce(new Error('rpc down'))
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    await expect(publishPost({ user, content: '<p>Salut</p>' })).resolves.toMatchObject({ id: 'post-1' })
    warn.mockRestore()
  })

  it('refuse sans utilisateur connecté', async () => {
    await expect(publishPost({ user: null, content: 'x' })).rejects.toThrow(/non connecté/)
  })
})
