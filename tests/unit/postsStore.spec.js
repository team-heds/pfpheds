import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock axios
const { mockAxios } = vi.hoisted(() => ({
  mockAxios: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

vi.mock('axios', () => ({ default: mockAxios }))

import { usePostsStore } from '@/stores/postsStore'

describe('postsStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePostsStore()
    vi.clearAllMocks()
  })

  // ==================== INITIAL STATE ====================
  describe('initial state', () => {
    it('posts is empty array', () => {
      expect(store.posts).toEqual([])
    })

    it('loading is false', () => {
      expect(store.loading).toBe(false)
    })

    it('error is null', () => {
      expect(store.error).toBeNull()
    })
  })

  // ==================== FETCH POSTS ====================
  describe('fetchPosts', () => {
    it('fetches posts and updates state', async () => {
      const mockPosts = [
        { id: 'p1', Content: 'Hello', IdUser: 'u1' },
        { id: 'p2', Content: 'World', IdUser: 'u2' },
      ]
      mockAxios.get.mockResolvedValue({ data: mockPosts })

      await store.fetchPosts()

      expect(store.posts).toEqual(mockPosts)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('sets loading during fetch', async () => {
      let resolvePromise
      mockAxios.get.mockReturnValue(new Promise(resolve => { resolvePromise = resolve }))

      const promise = store.fetchPosts()
      expect(store.loading).toBe(true)

      resolvePromise({ data: [] })
      await promise

      expect(store.loading).toBe(false)
    })

    it('handles fetch error', async () => {
      mockAxios.get.mockRejectedValue(new Error('Network error'))

      await store.fetchPosts()

      expect(store.error).toBe('Failed to fetch posts.')
      expect(store.loading).toBe(false)
    })
  })

  // ==================== CREATE POST ====================
  describe('createPost', () => {
    it('creates a top-level post and prepends to list', async () => {
      const newPost = { id: 'p3', Content: 'New post', IdUser: 'u1' }
      mockAxios.post.mockResolvedValue({ data: [newPost] })

      const result = await store.createPost({ author_id: 'u1', content: 'New post' })

      expect(result).toEqual(newPost)
      expect(store.posts[0]).toEqual(newPost)
      expect(store.loading).toBe(false)
    })

    it('creates a reply without prepending to list', async () => {
      store.posts = [{ id: 'p1', Content: 'Parent' }]
      const reply = { id: 'p4', Content: 'Reply', parent_id: 'p1' }
      mockAxios.post.mockResolvedValue({ data: [reply] })

      const result = await store.createPost({ author_id: 'u1', content: 'Reply', parent_id: 'p1' })

      expect(result).toEqual(reply)
      // Should not prepend replies to top-level list
      expect(store.posts).toHaveLength(1)
    })

    it('handles create error', async () => {
      mockAxios.post.mockRejectedValue(new Error('Server error'))

      const result = await store.createPost({ author_id: 'u1', content: 'Test' })

      expect(result).toBeNull()
      expect(store.error).toBe('Failed to create post.')
    })
  })

  // ==================== UPDATE POST ====================
  describe('updatePost', () => {
    it('updates post in state', async () => {
      store.posts = [
        { id: 'p1', Content: 'Old content' },
        { id: 'p2', Content: 'Other' },
      ]
      mockAxios.put.mockResolvedValue({ data: { id: 'p1', Content: 'Updated content' } })

      const result = await store.updatePost('p1', { content: 'Updated content' })

      expect(result).toEqual({ id: 'p1', Content: 'Updated content' })
      expect(store.posts[0].Content).toBe('Updated content')
      expect(store.loading).toBe(false)
    })

    it('handles update when post not in state', async () => {
      store.posts = [{ id: 'p2', Content: 'Other' }]
      mockAxios.put.mockResolvedValue({ data: { id: 'p1', Content: 'Updated' } })

      const result = await store.updatePost('p1', { content: 'Updated' })

      expect(result).toEqual({ id: 'p1', Content: 'Updated' })
      // p2 should remain unchanged
      expect(store.posts).toHaveLength(1)
    })

    it('handles update error', async () => {
      mockAxios.put.mockRejectedValue(new Error('Not found'))

      const result = await store.updatePost('p1', { content: 'Test' })

      expect(result).toBeNull()
      expect(store.error).toBe('Failed to update post.')
    })
  })

  // ==================== DELETE POST ====================
  describe('deletePost', () => {
    it('deletes post and removes from state', async () => {
      store.posts = [
        { id: 'p1', Content: 'Post 1' },
        { id: 'p2', Content: 'Post 2' },
      ]
      mockAxios.delete.mockResolvedValue({})

      await store.deletePost('p1')

      expect(store.posts).toHaveLength(1)
      expect(store.posts[0].id).toBe('p2')
      expect(store.loading).toBe(false)
    })

    it('handles delete error', async () => {
      store.posts = [{ id: 'p1', Content: 'Post 1' }]
      mockAxios.delete.mockRejectedValue(new Error('Forbidden'))

      await store.deletePost('p1')

      expect(store.error).toBe('Failed to delete post.')
      // Posts should remain unchanged on error
      expect(store.posts).toHaveLength(1)
    })
  })
})
