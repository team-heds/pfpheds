import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { mount } from '@vue/test-utils'

const { service, feedStore, toast } = vi.hoisted(() => ({
  service: {
    createPostComment: vi.fn(),
    deletePostComment: vi.fn(),
    fetchCommentCounts: vi.fn(async () => ({})),
    fetchOwnCommentAuthor: vi.fn(async () => ({ display_name: 'Léa Martin', avatar_url: null })),
    fetchPostComments: vi.fn(async () => [])
  },
  feedStore: { avatarCache: {}, setPostCommentCount: vi.fn() },
  toast: { add: vi.fn() }
}))

vi.mock('@/service/postCommentsService', () => service)
vi.mock('@/stores/socialFeedStore', () => ({ useSocialFeedStore: () => feedStore }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ user: { id: 'me', email: 'me@example.invalid' } }) }))
vi.mock('primevue/usetoast', () => ({ useToast: () => toast }))

import { usePostComments } from '@/composables/usePostComments'

function setup(post = { id: 'post-1', comments_count: 1 }) {
  let api
  mount(
    defineComponent({
      setup() {
        api = usePostComments(() => post)
        return () => h('div')
      }
    })
  )
  return api
}

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const existing = {
  id: 'c1',
  post_id: 'post-1',
  parent_id: null,
  user_id: 'other',
  content: 'Bravo',
  created_at: '2026-11-10T10:00:00Z',
  display_name: 'Tom'
}

beforeEach(() => {
  vi.clearAllMocks()
  service.fetchPostComments.mockResolvedValue([existing])
})

describe('usePostComments', () => {
  it('reste replié et charge la liste à la première ouverture', async () => {
    const api = setup()
    expect(api.state.expanded).toBe(false)
    expect(service.fetchPostComments).not.toHaveBeenCalled()
    await api.expand()
    expect(service.fetchPostComments).toHaveBeenCalledWith('post-1')
    expect(api.threads.value.map((t) => t.id)).toEqual(['c1'])
  })

  it('affiche le commentaire tout de suite puis le confirme', async () => {
    const api = setup()
    await api.expand()
    const request = deferred()
    service.createPostComment.mockReturnValueOnce(request.promise)

    const done = api.add('  Merci !  ')
    await vi.waitFor(() => expect(service.createPostComment).toHaveBeenCalled())
    const sent = service.createPostComment.mock.calls[0][0]
    expect(sent).toMatchObject({ postId: 'post-1', parentId: null, content: 'Merci !' })
    const pending = api.state.comments.find((c) => c.id === sent.id)
    expect(pending).toMatchObject({ pending: true, display_name: 'Léa Martin', user_id: 'me' })
    expect(api.state.count).toBe(2)

    request.resolve({ id: sent.id, post_id: 'post-1', parent_id: null, user_id: 'me', content: 'Merci !', created_at: '2026-11-10T12:00:00Z' })
    await expect(done).resolves.toBe(true)
    expect(api.state.comments.find((c) => c.id === sent.id).pending).toBe(false)
    expect(feedStore.setPostCommentCount).toHaveBeenLastCalledWith('post-1', 2)
  })

  it('retire le commentaire refusé et prévient', async () => {
    const api = setup()
    await api.expand()
    service.createPostComment.mockRejectedValueOnce(new Error('rls'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    await expect(api.add('Salut')).resolves.toBe(false)
    expect(api.state.comments.map((c) => c.id)).toEqual(['c1'])
    expect(api.state.count).toBe(1)
    expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error', summary: 'Commentaire non publié' }))
  })

  it('n’envoie pas un commentaire vide', async () => {
    const api = setup()
    await expect(api.add('   ')).resolves.toBe(false)
    expect(service.createPostComment).not.toHaveBeenCalled()
  })

  it('supprime son commentaire et ses réponses, et les remet si le serveur refuse', async () => {
    service.fetchPostComments.mockResolvedValueOnce([
      { ...existing, id: 'mine', user_id: 'me' },
      { ...existing, id: 'reply', parent_id: 'mine', created_at: '2026-11-10T11:00:00Z' }
    ])
    const api = setup({ id: 'post-1', comments_count: 2 })
    await api.expand()
    const request = deferred()
    service.deletePostComment.mockReturnValueOnce(request.promise)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const done = api.remove(api.state.comments[0])
    expect(api.state.comments).toEqual([])
    expect(api.state.count).toBe(0)

    request.reject(new Error('refusé'))
    await expect(done).resolves.toBe(false)
    expect(api.state.comments.map((c) => c.id)).toEqual(['mine', 'reply'])
    expect(api.state.count).toBe(2)
  })

  it('ne supprime jamais le commentaire de quelqu’un d’autre', async () => {
    const api = setup()
    await api.expand()
    await expect(api.remove(api.state.comments[0])).resolves.toBe(false)
    expect(service.deletePostComment).not.toHaveBeenCalled()
    expect(api.state.comments).toHaveLength(1)
  })
})
