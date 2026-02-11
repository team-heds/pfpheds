import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock Supabase — use vi.hoisted to avoid hoisting issues
const { mockFrom, mockChannel, mockRemoveChannel, mockStorageFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockChannel: vi.fn(),
  mockRemoveChannel: vi.fn(),
  mockStorageFrom: vi.fn(),
}))

vi.mock('@/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    channel: (...args) => mockChannel(...args),
    removeChannel: (...args) => mockRemoveChannel(...args),
    storage: {
      from: (...args) => mockStorageFrom(...args),
    },
  },
}))

import { useEventStore } from '@/stores/eventStore'

describe('eventStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useEventStore()
    vi.clearAllMocks()
  })

  // ==================== INITIAL STATE ====================
  describe('initial state', () => {
    it('events is an empty array', () => {
      expect(store.events).toEqual([])
    })

    it('loading is false', () => {
      expect(store.loading).toBe(false)
    })

    it('error is null', () => {
      expect(store.error).toBeNull()
    })
  })

  // ==================== FETCH EVENTS ====================
  describe('fetchEvents', () => {
    it('fetches events from events_with_counts view', async () => {
      const mockEvents = [
        { id: '1', title: 'Event A', start_date: '2024-01-01' },
        { id: '2', title: 'Event B', start_date: '2024-02-01' },
      ]

      const chain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockEvents, error: null }),
      }
      mockFrom.mockReturnValue(chain)

      const result = await store.fetchEvents()

      expect(mockFrom).toHaveBeenCalledWith('events_with_counts')
      expect(store.events).toHaveLength(2)
      expect(store.loading).toBe(false)
      expect(result).toEqual(mockEvents)
    })

    it('falls back to events table if view does not exist', async () => {
      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        const chain = {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue(
            callCount === 1
              ? { data: null, error: { message: 'relation "events_with_counts" does not exist' } }
              : { data: [{ id: '1', title: 'Fallback' }], error: null }
          ),
        }
        return chain
      })

      const result = await store.fetchEvents()

      expect(mockFrom).toHaveBeenCalledTimes(2)
      expect(mockFrom).toHaveBeenNthCalledWith(2, 'events')
      expect(store.events).toHaveLength(1)
    })

    it('sets error on fetch failure', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Server error' } }),
      }
      mockFrom.mockReturnValue(chain)

      const result = await store.fetchEvents()

      expect(store.error).toBe('Server error')
      expect(store.loading).toBe(false)
      expect(result).toEqual([])
    })

    it('handles null data gracefully', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      mockFrom.mockReturnValue(chain)

      await store.fetchEvents()
      expect(store.events).toEqual([])
    })
  })

  // ==================== DELETE EVENT ====================
  describe('deleteEvent', () => {
    it('deletes event and its image from storage', async () => {
      // Mock: fetch event to get image_url
      let fromCallCount = 0
      mockFrom.mockImplementation((table) => {
        fromCallCount++
        if (fromCallCount === 1) {
          // Select image_url
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: { image_url: 'https://storage.com/events/events/img.jpg' },
              error: null,
            }),
          }
        }
        if (fromCallCount === 2) {
          // Delete event
          return {
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        // fetchEvents after delete
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      })

      mockStorageFrom.mockReturnValue({
        remove: vi.fn().mockResolvedValue({ error: null }),
      })

      await store.deleteEvent('evt1')

      expect(mockStorageFrom).toHaveBeenCalledWith('events')
      expect(store.loading).toBe(false)
    })

    it('throws on delete error', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
        delete: vi.fn().mockReturnThis(),
      }))

      // Second call for delete
      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          }
        }
        return {
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
        }
      })

      await expect(store.deleteEvent('evt1')).rejects.toThrow()
      expect(store.error).toBe('Delete failed')
    })
  })

  // ==================== IS USER REGISTERED ====================
  describe('isUserRegistered', () => {
    it('returns true when user is registered', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'reg1' }, error: null }),
      })

      const result = await store.isUserRegistered('evt1', 'user1')
      expect(result).toBe(true)
    })

    it('returns false when user is not registered', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      const result = await store.isUserRegistered('evt1', 'user1')
      expect(result).toBe(false)
    })

    it('returns false on error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockRejectedValue(new Error('fail')),
      })

      const result = await store.isUserRegistered('evt1', 'user1')
      expect(result).toBe(false)
    })
  })

  // ==================== HAS USER LIKED ====================
  describe('hasUserLiked', () => {
    it('returns true when user has liked', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'like1' }, error: null }),
      })

      const result = await store.hasUserLiked('evt1', 'user1')
      expect(result).toBe(true)
    })

    it('returns false when user has not liked', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      const result = await store.hasUserLiked('evt1', 'user1')
      expect(result).toBe(false)
    })
  })

  // ==================== GET EVENT REGISTRATIONS ====================
  describe('getEventRegistrations', () => {
    it('returns registrations for an event', async () => {
      const mockRegs = [
        { id: 'r1', user_uid: 'u1', user_nom: 'Dupont' },
        { id: 'r2', user_uid: 'u2', user_nom: 'Martin' },
      ]

      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockRegs, error: null }),
      })

      const result = await store.getEventRegistrations('evt1')
      expect(result).toHaveLength(2)
    })

    it('returns empty array on error', async () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
      })

      const result = await store.getEventRegistrations('evt1')
      expect(result).toEqual([])
    })
  })

  // ==================== LISTEN EVENTS ====================
  describe('listenEvents', () => {
    it('sets up realtime subscription and returns unsubscribe fn', () => {
      // Mock fetchEvents via from
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })

      const mockSubscription = { id: 'sub1' }
      const mockSubscribe = vi.fn().mockReturnValue(mockSubscription)
      const mockOn = vi.fn().mockReturnValue({ subscribe: mockSubscribe })
      mockChannel.mockReturnValue({ on: mockOn })

      const unsubscribe = store.listenEvents()

      expect(mockChannel).toHaveBeenCalledWith('events-channel')
      expect(typeof unsubscribe).toBe('function')
    })

    it('returns noop function if realtime fails', () => {
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      })

      mockChannel.mockImplementation(() => {
        throw new Error('Realtime not available')
      })

      const unsubscribe = store.listenEvents()
      expect(typeof unsubscribe).toBe('function')
      // Should not throw
      unsubscribe()
    })
  })

  // ==================== FIX EVENT ADMIN ====================
  describe('fixEventAdmin', () => {
    it('updates admin_uid and reloads events', async () => {
      let fromCallCount = 0
      mockFrom.mockImplementation(() => {
        fromCallCount++
        if (fromCallCount === 1) {
          // update call
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null }),
          }
        }
        // fetchEvents call
        return {
          select: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
      })

      const result = await store.fixEventAdmin('evt1', 'admin-uuid')
      expect(result).toBe(true)
    })

    it('throws on error', async () => {
      mockFrom.mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Forbidden' } }),
      })

      await expect(store.fixEventAdmin('evt1', 'admin')).rejects.toThrow()
    })
  })
})
