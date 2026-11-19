import { beforeEach, describe, expect, it, vi } from 'vitest'

const { calls, control, supabaseMock } = vi.hoisted(() => {
  const calls = []
  const control = { mediaRows: [], mediaError: null, deleted: [{ id: 'post-1' }], deleteError: null, storageError: null }
  const supabaseMock = {
    from: vi.fn((table) => ({
      select: vi.fn(() => ({
        eq: vi.fn(async (column, value) => {
          calls.push(['select', table, value])
          return { data: control.mediaRows, error: control.mediaError }
        })
      })),
      delete: vi.fn(() => ({
        eq: vi.fn((column, value) => ({
          select: vi.fn(async () => {
            calls.push(['delete', table, value])
            return { data: control.deleted, error: control.deleteError }
          })
        }))
      }))
    })),
    storage: {
      from: vi.fn((bucket) => ({
        remove: vi.fn(async (paths) => {
          calls.push(['remove-files', bucket, paths])
          return { error: control.storageError }
        })
      }))
    }
  }
  return { calls, control, supabaseMock }
})

vi.mock('@/supabase.js', () => ({ supabase: supabaseMock }))

import { deletePost, mediaStoragePaths } from '@/service/postDeleteService'

const base = 'https://api2.example.invalid/storage/v1/object/public/post-media'
const post = { id: 'post-1', IdUser: 'author', media: [`${base}/posts/author/1_0_photo.jpg`] }

beforeEach(() => {
  calls.length = 0
  Object.assign(control, { mediaRows: [], mediaError: null, deleted: [{ id: 'post-1' }], deleteError: null, storageError: null })
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})

describe('mediaStoragePaths', () => {
  it('garde seulement les fichiers du dossier de l’auteur, sans doublon', () => {
    expect(
      mediaStoragePaths(
        [
          `${base}/posts/author/1_0_photo.jpg?t=1`,
          `${base}/posts/author/1_0_photo.jpg`,
          `${base}/posts/author/2_0_photo%20ete.jpg`,
          `${base}/posts/other/3_0_photo.jpg`,
          `${base}/posts/author/../other/x.jpg`,
          'https://youtube.com/watch?v=abc',
          null
        ],
        'author'
      )
    ).toEqual(['posts/author/1_0_photo.jpg', 'posts/author/2_0_photo ete.jpg'])
  })

  it('ne retient rien sans auteur connu', () => {
    expect(mediaStoragePaths([`${base}/posts/author/1.jpg`], null)).toEqual([])
  })
})

describe('deletePost', () => {
  it('relit les médias, retire la publication puis ses fichiers', async () => {
    control.mediaRows = [{ url: `${base}/posts/author/2_0_video.mp4` }]
    await expect(deletePost(post)).resolves.toEqual({ id: 'post-1', files: 2, filesRemoved: true })
    expect(calls).toEqual([
      ['select', 'post_media', 'post-1'],
      ['delete', 'posts', 'post-1'],
      ['remove-files', 'post-media', ['posts/author/1_0_photo.jpg', 'posts/author/2_0_video.mp4']]
    ])
  })

  it('échoue et garde les fichiers si la base refuse (publication d’une autre personne)', async () => {
    control.deleted = []
    await expect(deletePost(post)).rejects.toThrow(/appartenant à quelqu’un d’autre/)
    expect(calls.some(([kind]) => kind === 'remove-files')).toBe(false)
  })

  it('remonte l’erreur du serveur sans toucher au stockage', async () => {
    control.deleteError = new Error('réseau')
    await expect(deletePost(post)).rejects.toThrow('réseau')
    expect(calls.some(([kind]) => kind === 'remove-files')).toBe(false)
  })

  it('reste réussi si seuls les fichiers n’ont pas pu être retirés', async () => {
    control.storageError = new Error('stockage indisponible')
    await expect(deletePost(post)).resolves.toMatchObject({ id: 'post-1', filesRemoved: false })
  })

  it('utilise la liste affichée si les médias ne peuvent pas être relus', async () => {
    control.mediaError = new Error('lecture impossible')
    await deletePost(post)
    expect(calls.at(-1)).toEqual(['remove-files', 'post-media', ['posts/author/1_0_photo.jpg']])
  })

  it('refuse une publication sans identifiant', async () => {
    await expect(deletePost({ IdUser: 'author' })).rejects.toThrow('Publication inconnue.')
    expect(calls).toEqual([])
  })
})
