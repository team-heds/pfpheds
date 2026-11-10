import { beforeEach, describe, expect, it, vi } from 'vitest'

const { calls, supabaseMock, control } = vi.hoisted(() => {
  const calls = []
  const control = {
    uploadError: null,
    insertError: null,
    viewError: null,
    rpcRows: [],
    signed: null,
    deletedRows: [{ id: 'story-1' }]
  }
  const supabaseMock = {
    rpc: vi.fn(async (fn, args) => {
      calls.push(['rpc', fn, args])
      return { data: control.rpcRows, error: null }
    }),
    storage: {
      from: vi.fn((bucket) => ({
        upload: vi.fn(async (path, file, opts) => {
          calls.push(['upload', bucket, path, opts])
          return { error: control.uploadError }
        }),
        remove: vi.fn(async (paths) => {
          calls.push(['remove', bucket, paths])
          return { error: null }
        }),
        createSignedUrls: vi.fn(async (paths, seconds) => {
          calls.push(['sign', bucket, paths, seconds])
          return {
            data: control.signed ?? paths.map((p) => ({ path: p, signedUrl: `https://signed.test/${p}`, error: null })),
            error: null
          }
        })
      }))
    },
    from: vi.fn((table) => ({
      insert: vi.fn((row) => {
        calls.push(['insert', table, row])
        if (table === 'story_views') return Promise.resolve({ error: control.viewError })
        return {
          select: () => ({
            single: async () =>
              control.insertError
                ? { data: null, error: control.insertError }
                : { data: { id: 'story-1', created_at: 'now', expires_at: 'later' }, error: null }
          })
        }
      }),
      delete: vi.fn(() => ({
        eq: vi.fn((col, value) => ({
          select: async () => {
            calls.push(['delete', table, value])
            return { data: control.deletedRows, error: null }
          }
        }))
      }))
    }))
  }
  return { calls, supabaseMock, control }
})

vi.mock('@/supabase.js', () => ({ supabase: supabaseMock }))

import {
  buildStoryPath,
  deleteStory,
  fetchActiveStories,
  firstUnseenIndex,
  formatStoryAge,
  groupStoriesByAuthor,
  markStoryViewed,
  publishStory,
  sanitizeStoryElements,
  validateStoryFile
} from '@/service/storiesService'

const photo = { name: 'stage.jpg', type: 'image/jpeg', size: 1000 }

beforeEach(() => {
  calls.length = 0
  Object.assign(control, {
    uploadError: null,
    insertError: null,
    viewError: null,
    rpcRows: [],
    signed: null,
    deletedRows: [{ id: 'story-1' }]
  })
})

describe('sanitizeStoryElements', () => {
  it('garde textes, emojis, quiz et sondages, et retire les fichiers embarqués', () => {
    const out = sanitizeStoryElements([
      { type: 'text', value: '  Bonjour ', x: 10.4, y: '20', color: '#fff', textSize: 'large' },
      { type: 'emoji', value: '🔥', x: 1, y: 2, font: '96px serif' },
      { type: 'quiz', question: 'Capitale ?', options: ['Sion', 'Berne', ''], answerIdx: 1 },
      { type: 'poll', question: 'Café ?', options: ['Oui', 'Non'] },
      { type: 'audio', src: 'data:audio/mp3;base64,AAAA' },
      { type: 'carousel', media: [{ preview: 'data:image/png;base64,AAAA', file: {} }] },
      { type: 'quiz', question: 'Une seule option', options: ['A'] },
      null
    ])
    expect(out).toEqual([
      { type: 'text', value: 'Bonjour', x: 10, y: 20, color: '#fff', textSize: 'large' },
      { type: 'emoji', value: '🔥', x: 1, y: 2 },
      { type: 'quiz', question: 'Capitale ?', options: ['Sion', 'Berne'], answerIdx: 1 },
      { type: 'poll', question: 'Café ?', options: ['Oui', 'Non'] }
    ])
  })

  it('ramène une bonne réponse hors limites à la première option et plafonne à 20 éléments', () => {
    expect(sanitizeStoryElements([{ type: 'quiz', question: 'Q', options: ['A', 'B'], answerIdx: 9 }])[0].answerIdx).toBe(0)
    const many = Array.from({ length: 30 }, (_, i) => ({ type: 'text', value: `t${i}`, x: 0, y: 0 }))
    expect(sanitizeStoryElements(many)).toHaveLength(20)
    expect(sanitizeStoryElements('nope')).toEqual([])
  })
})

describe('fichiers', () => {
  it('range le fichier dans le dossier de l’auteur avec la bonne extension', () => {
    expect(buildStoryPath('user-1', 'video/mp4', 1700000000000, () => 0.123456789)).toMatch(/^user-1\/1700000000000_[a-z0-9]+\.mp4$/)
    expect(buildStoryPath('user-1', 'image/jpeg', 1, () => 0.5)).toMatch(/\.jpg$/)
  })

  it('refuse les formats et tailles non pris en charge', () => {
    expect(validateStoryFile(null)).toMatch(/Choisissez/)
    expect(validateStoryFile({ type: 'image/gif', size: 10 })).toMatch(/Format/)
    expect(validateStoryFile({ type: 'video/mp4', size: 31 * 1024 * 1024 })).toMatch(/30 Mo/)
    expect(validateStoryFile(photo)).toBe('')
  })
})

describe('groupStoriesByAuthor', () => {
  const rows = [
    { id: 'a2', user_id: 'ana', display_name: 'Ana Rey', created_at: '2026-11-10T10:00:00Z', seen: true },
    { id: 'a1', user_id: 'ana', display_name: 'Ana Rey', created_at: '2026-11-10T09:00:00Z', seen: false },
    { id: 'b1', user_id: 'ben', display_name: 'Ben', created_at: '2026-11-10T11:00:00Z', seen: true },
    { id: 'm1', user_id: 'me', display_name: 'Moi', created_at: '2026-11-10T08:00:00Z', seen: true },
    { id: 'c1', user_id: 'cam', display_name: 'Cam', created_at: '2026-11-10T07:00:00Z', seen: false }
  ]

  it('met la personne connectée en premier, puis les non vues récentes, puis les vues', () => {
    const groups = groupStoriesByAuthor(rows, 'me')
    expect(groups.map((g) => g.userId)).toEqual(['me', 'ana', 'cam', 'ben'])
    expect(groups[0]).toMatchObject({ isOwn: true, hasUnseen: false })
    expect(groups[1].stories.map((s) => s.id)).toEqual(['a1', 'a2'])
    expect(groups[1].hasUnseen).toBe(true)
    expect(groups[3].hasUnseen).toBe(false)
  })

  it('reprend à la première story non vue', () => {
    const [, ana] = groupStoriesByAuthor(rows, 'me')
    expect(firstUnseenIndex(ana)).toBe(0)
    expect(firstUnseenIndex({ stories: [{ seen: true }, { seen: true }] })).toBe(0)
    expect(firstUnseenIndex({ stories: [{ seen: true }, { seen: false }] })).toBe(1)
  })
})

it('formate l’âge d’une story', () => {
  const now = Date.parse('2026-11-10T12:00:00Z')
  expect(formatStoryAge('2026-11-10T11:59:40Z', now)).toBe('à l’instant')
  expect(formatStoryAge('2026-11-10T11:35:00Z', now)).toBe('il y a 25 min')
  expect(formatStoryAge('2026-11-10T09:00:00Z', now)).toBe('il y a 3 h')
})

describe('publishStory', () => {
  it('envoie le fichier dans le bucket privé puis enregistre la story', async () => {
    await publishStory({
      userId: 'user-1',
      file: photo,
      caption: '  Premier jour  ',
      lifetimeHours: 1,
      elements: [{ type: 'audio', src: 'data:' }, { type: 'poll', question: 'Q', options: ['A', 'B'] }]
    })
    const upload = calls.find((c) => c[0] === 'upload')
    expect(upload[1]).toBe('stories')
    expect(upload[2]).toMatch(/^user-1\//)
    expect(upload[3]).toEqual({ upsert: false, contentType: 'image/jpeg' })
    const insert = calls.find((c) => c[0] === 'insert')
    expect(insert[1]).toBe('stories')
    expect(insert[2]).toEqual({
      user_id: 'user-1',
      media_path: upload[2],
      media_type: 'image',
      caption: 'Premier jour',
      elements: [{ type: 'poll', question: 'Q', options: ['A', 'B'] }],
      lifetime_hours: 1
    })
    expect(insert[2]).not.toHaveProperty('expires_at')
  })

  it('ramène une durée inconnue à 24 h et reconnaît les vidéos', async () => {
    await publishStory({ userId: 'user-1', file: { type: 'video/mp4', size: 10 }, lifetimeHours: 72 })
    const insert = calls.find((c) => c[0] === 'insert')[2]
    expect(insert).toMatchObject({ media_type: 'video', lifetime_hours: 24 })
  })

  it('retire le fichier si la story n’est pas enregistrée', async () => {
    control.insertError = new Error('rls')
    await expect(publishStory({ userId: 'user-1', file: photo })).rejects.toThrow('rls')
    const upload = calls.find((c) => c[0] === 'upload')
    expect(calls).toContainEqual(['remove', 'stories', [upload[2]]])
  })

  it('n’enregistre rien si l’envoi du fichier échoue ou sans session', async () => {
    control.uploadError = new Error('quota')
    await expect(publishStory({ userId: 'user-1', file: photo })).rejects.toThrow('quota')
    expect(calls.some((c) => c[0] === 'insert')).toBe(false)
    await expect(publishStory({ userId: 'guest-user', file: photo })).rejects.toThrow(/Session/)
  })
})

describe('lecture et vues', () => {
  it('charge les stories actives avec une URL signée et ignore celles sans fichier lisible', async () => {
    control.rpcRows = [
      { id: 's1', media_path: 'u/1.jpg' },
      { id: 's2', media_path: 'u/2.jpg' }
    ]
    control.signed = [
      { path: 'u/1.jpg', signedUrl: 'https://signed.test/1', error: null },
      { path: 'u/2.jpg', signedUrl: null, error: 'Object not found' }
    ]
    const stories = await fetchActiveStories()
    expect(calls[0]).toEqual(['rpc', 'get_active_stories', { p_limit: 200 }])
    expect(calls[1]).toEqual(['sign', 'stories', ['u/1.jpg', 'u/2.jpg'], 3600])
    expect(stories).toEqual([{ id: 's1', media_path: 'u/1.jpg', media_url: 'https://signed.test/1' }])
  })

  it('ne demande aucune URL quand il n’y a pas de story', async () => {
    expect(await fetchActiveStories()).toEqual([])
    expect(calls.some((c) => c[0] === 'sign')).toBe(false)
  })

  it('enregistre une vue et tolère une vue déjà enregistrée', async () => {
    await markStoryViewed('s1')
    expect(calls).toContainEqual(['insert', 'story_views', { story_id: 's1' }])
    control.viewError = { code: '23505' }
    await expect(markStoryViewed('s1')).resolves.toBeUndefined()
    control.viewError = { code: '42501', message: 'rls' }
    await expect(markStoryViewed('s1')).rejects.toMatchObject({ code: '42501' })
  })

  it('supprime sa story puis son fichier, et signale une story d’un autre', async () => {
    await deleteStory({ id: 'story-1', media_path: 'user-1/a.jpg' })
    expect(calls).toEqual([
      ['delete', 'stories', 'story-1'],
      ['remove', 'stories', ['user-1/a.jpg']]
    ])
    control.deletedRows = []
    calls.length = 0
    await expect(deleteStory({ id: 'x', media_path: 'other/a.jpg' })).rejects.toThrow(/introuvable/)
    expect(calls.some((c) => c[0] === 'remove')).toBe(false)
  })
})
