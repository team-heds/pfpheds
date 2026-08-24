import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

const { responses, supabaseMock } = vi.hoisted(() => {
  const responses = {
    posts: [],
    post_media: [],
    user_profiles: []
  }

  const makeBuilder = (table) => {
    const builder = {}
    ;['select', 'order', 'limit', 'eq', 'is', 'contains', 'lt'].forEach((method) => {
      builder[method] = vi.fn(() => builder)
    })
    builder.in = vi.fn(() => Promise.resolve(responses[table].shift() || { data: [], error: null }))
    builder.then = (resolve, reject) =>
      Promise.resolve(responses[table].shift() || { data: [], error: null }).then(resolve, reject)
    return builder
  }

  return {
    responses,
    supabaseMock: {
      from: vi.fn((table) => makeBuilder(table))
    }
  }
})

vi.mock('@/supabase.js', () => ({ supabase: supabaseMock }))

import {
  buildFeedScopeKey,
  postMatchesFeedScope,
  useSocialFeedStore
} from '@/stores/socialFeedStore'

const rootScope = { communityId: null, filter: { type: null, value: null } }

function makeRow(id, createdAt = '2026-08-24T10:00:00Z') {
  return {
    id,
    user_id: 'user-1',
    author_name: 'Antoine',
    content: id,
    created_at: createdAt,
    hashtags: {},
    mentions: {},
    community_id: null
  }
}

function queueSuccessfulPage(rows, media = [], profiles = []) {
  responses.posts.push({ data: rows, error: null })
  if (rows.length) {
    responses.post_media.push({ data: media, error: null })
    responses.user_profiles.push({ data: profiles, error: null })
  }
}

describe('socialFeedStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    responses.posts.length = 0
    responses.post_media.length = 0
    responses.user_profiles.length = 0
    vi.clearAllMocks()
  })

  it('conserve les publications visibles lorsqu’une actualisation échoue', async () => {
    const store = useSocialFeedStore()
    queueSuccessfulPage([
      {
        id: 'post-1',
        user_id: 'user-1',
        author_name: 'Antoine',
        content: 'Bonjour',
        created_at: '2026-08-24T10:00:00Z',
        hashtags: {},
        mentions: {},
        community_id: null
      }
    ])

    await store.loadScope(rootScope)
    responses.posts.push({ data: null, error: new Error('offline') })
    const result = await store.loadScope(rootScope)

    expect(result.ok).toBe(false)
    expect(store.getEntry(rootScope).posts.map((post) => post.id)).toEqual(['post-1'])
    expect(store.getEntry(rootScope).warning).toContain('restent disponibles')
  })

  it('garde un cache indépendant par communauté et le retrouve avec son scroll', async () => {
    const store = useSocialFeedStore()
    const communityScope = { communityId: 'community-1', filter: {} }
    store.upsertPost(rootScope, { id: 'root-post', Timestamp: 1 })
    store.upsertPost(communityScope, { id: 'community-post', Timestamp: 2 })
    store.saveScroll(rootScope, 420)

    expect(buildFeedScopeKey(rootScope)).not.toBe(buildFeedScopeKey(communityScope))
    expect(store.getEntry(rootScope).posts[0].id).toBe('root-post')
    expect(store.getEntry(communityScope).posts[0].id).toBe('community-post')
    expect(store.getEntry(rootScope).scrollTop).toBe(420)
  })

  it('revalide la première page sans supprimer les publications déjà paginées', async () => {
    const store = useSocialFeedStore()
    queueSuccessfulPage([makeRow('first-page', '2026-08-23T10:00:00Z')])
    await store.loadScope(rootScope, { pageSize: 1 })
    queueSuccessfulPage([makeRow('older-post', '2026-08-20T10:00:00Z')])
    await store.loadScope(rootScope, { mode: 'paginate', pageSize: 1 })
    const entry = store.getEntry(rootScope)
    queueSuccessfulPage([
      makeRow('new-post'),
      makeRow('first-page', '2026-08-23T10:00:00Z'),
      makeRow('older-post', '2026-08-20T10:00:00Z')
    ])

    await store.loadScope(rootScope, { pageSize: 1 })

    expect(entry.posts.map((post) => post.id)).toEqual(['new-post', 'first-page', 'older-post'])
    expect(entry.oldestCreatedAt).toBe('2026-08-20T10:00:00Z')
    expect(entry.hasMore).toBe(true)
  })

  it('recalcule le curseur et hasMore après un upsert sans pagination', async () => {
    const store = useSocialFeedStore()
    store.upsertPost(rootScope, { id: 'optimistic', Timestamp: 1 })
    queueSuccessfulPage([makeRow('post-1'), makeRow('post-2', '2026-08-23T10:00:00Z')])

    await store.loadScope(rootScope, { pageSize: 2 })

    const entry = store.getEntry(rootScope)
    expect(entry.oldestCreatedAt).toBe('2026-08-23T10:00:00Z')
    expect(entry.hasMore).toBe(true)
    expect(entry.posts.map((post) => post.id)).toEqual(['post-1', 'post-2'])
  })

  it('retire de la fenêtre les posts supprimés lors de la revalidation', async () => {
    const store = useSocialFeedStore()
    queueSuccessfulPage([makeRow('post-1'), makeRow('post-2')])
    await store.loadScope(rootScope, { pageSize: 2 })
    queueSuccessfulPage([makeRow('post-2')])

    await store.loadScope(rootScope, { pageSize: 2 })

    expect(store.getEntry(rootScope).posts.map((post) => post.id)).toEqual(['post-2'])
  })

  it('affiche le texte même si les médias et avatars sont indisponibles', async () => {
    const store = useSocialFeedStore()
    responses.posts.push({ data: [makeRow('post-1')], error: null })
    responses.post_media.push({ data: null, error: new Error('media unavailable') })
    responses.user_profiles.push({ data: null, error: new Error('profiles unavailable') })

    const result = await store.loadScope(rootScope)

    expect(result.ok).toBe(true)
    expect(store.getEntry(rootScope).posts[0]).toMatchObject({ id: 'post-1', media: [] })
  })

  it('rattache un média Realtime même s’il arrive avant le post', async () => {
    const store = useSocialFeedStore()
    store.ensureScope(rootScope)
    store.attachRealtimeMedia({ post_id: 'post-1', url: 'photo.jpg', type: 'image/jpeg' })
    responses.post_media.push({ data: [], error: null })
    responses.user_profiles.push({ data: [], error: null })

    await store.addRealtimePost(makeRow('post-1'))
    store.attachRealtimeMedia({ post_id: 'post-1', url: 'photo.jpg', type: 'image/jpeg' })

    expect(store.getEntry(rootScope).posts[0].media).toEqual(['photo.jpg'])
    expect(store.pendingMedia['post-1']).toBeUndefined()
  })

  it('réconcilie un événement Realtime avec une écriture locale sans doublon', async () => {
    const store = useSocialFeedStore()
    store.ensureScope(rootScope)
    store.upsertPost(rootScope, {
      id: 'post-1',
      Content: 'optimiste',
      media: ['photo.jpg'],
      Timestamp: 1
    })
    responses.post_media.push({ data: [], error: null })
    responses.user_profiles.push({ data: [], error: null })

    await store.addRealtimePost({
      id: 'post-1',
      user_id: 'user-1',
      author_name: 'Antoine',
      content: 'persisté',
      created_at: '2026-08-24T10:00:00Z',
      hashtags: {},
      mentions: {},
      community_id: null
    })

    expect(store.getEntry(rootScope).posts).toHaveLength(1)
    expect(store.getEntry(rootScope).posts[0].Content).toBe('persisté')
    store.upsertPost(rootScope, { id: 'post-1', media: ['photo.jpg'] })
    expect(store.getEntry(rootScope).posts[0].media).toEqual(['photo.jpg'])
  })

  it('n’ajoute un post Realtime qu’aux portées correspondantes', () => {
    expect(postMatchesFeedScope({ community_id: null, hashtags: { HEdS: true } }, rootScope)).toBe(
      true
    )
    expect(
      postMatchesFeedScope(
        { community_id: 'community-1', hashtags: {} },
        { communityId: 'community-1', filter: {} }
      )
    ).toBe(true)
    expect(
      postMatchesFeedScope(
        { community_id: null, hashtags: {} },
        { communityId: null, filter: { type: 'hashtag', value: 'HEdS' } }
      )
    ).toBe(false)
  })
})
