import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock Supabase
const { mockFrom, mockAuthGetUser } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
  mockAuthGetUser: vi.fn(),
}))

vi.mock('@/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
    auth: {
      getUser: () => mockAuthGetUser(),
    },
  },
}))

// Mock votesBackendService
const { mockUpsertStudentVote } = vi.hoisted(() => ({
  mockUpsertStudentVote: vi.fn(),
}))

vi.mock('@/stores/votesBackendService', () => ({
  default: {
    upsertStudentVote: (...args) => mockUpsertStudentVote(...args),
  },
}))

import { useVotesStore } from '@/stores/votesStore'

describe('votesStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useVotesStore()
    vi.clearAllMocks()
  })

  // ==================== INITIAL STATE ====================
  describe('initial state', () => {
    it('votes is empty array', () => {
      expect(store.votes).toEqual([])
    })

    it('currentVote is null', () => {
      expect(store.currentVote).toBeNull()
    })

    it('loading is false', () => {
      expect(store.loading).toBe(false)
    })

    it('error is null', () => {
      expect(store.error).toBeNull()
    })

    it('useBackendFunctions is true by default', () => {
      expect(store.useBackendFunctions).toBe(true)
    })
  })

  // ==================== GETTERS ====================
  describe('getters', () => {
    it('getVoteByTypeAndYear finds matching vote', () => {
      store.votes = [
        { pfp_type: 'PFP1A', year: '2025' },
        { pfp_type: 'PFP1B', year: '2025' },
      ]
      const vote = store.getVoteByTypeAndYear('PFP1A', '2025')
      expect(vote).toEqual({ pfp_type: 'PFP1A', year: '2025' })
    })

    it('getVoteByTypeAndYear returns undefined if not found', () => {
      store.votes = [{ pfp_type: 'PFP1A', year: '2025' }]
      expect(store.getVoteByTypeAndYear('PFP1B', '2025')).toBeUndefined()
    })

    it('hasVoted returns true when vote exists', () => {
      store.votes = [{ pfp_type: 'PFP1A', year: '2025' }]
      expect(store.hasVoted('PFP1A', '2025')).toBe(true)
    })

    it('hasVoted returns false when no vote', () => {
      store.votes = []
      expect(store.hasVoted('PFP1A', '2025')).toBe(false)
    })
  })

  // ==================== FETCH USER VOTES ====================
  describe('fetchUserVotes', () => {
    it('fetches votes for current user', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

      const mockVotes = [
        { id: 'v1', user_id: 'u1', pfp_type: 'PFP1A', year: '2025', choices: [1, 2] },
      ]
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockVotes, error: null }),
      })

      const result = await store.fetchUserVotes()

      expect(store.votes).toHaveLength(1)
      expect(store.loading).toBe(false)
      expect(result).toEqual(mockVotes)
    })

    it('throws if user not logged in', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } })

      await expect(store.fetchUserVotes()).rejects.toThrow('Utilisateur non connecté')
      expect(store.error).toBe('Utilisateur non connecté')
    })

    it('handles Supabase error', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      })

      await expect(store.fetchUserVotes()).rejects.toThrow()
      expect(store.loading).toBe(false)
    })
  })

  // ==================== FETCH VOTE ====================
  describe('fetchVote', () => {
    it('fetches a specific vote', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

      const mockVote = { id: 'v1', pfp_type: 'PFP1A', year: '2025', choices: [1] }
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: mockVote, error: null }),
      })

      const result = await store.fetchVote('PFP1A', '2025')

      expect(store.currentVote).toEqual(mockVote)
      expect(result).toEqual(mockVote)
    })

    it('returns null when no vote found', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      mockFrom.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      })

      const result = await store.fetchVote('PFP1A', '2025')
      expect(result).toBeNull()
      expect(store.currentVote).toBeNull()
    })
  })

  // ==================== SAVE VOTE (RPC) ====================
  describe('saveVote (RPC mode)', () => {
    it('saves vote via RPC backend', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

      const savedVote = { id: 'v1', pfp_type: 'PFP1A', year: '2025', choices: [3, 1, 2] }
      mockUpsertStudentVote.mockResolvedValue(savedVote)

      const result = await store.saveVote('PFP1A', '2025', [3, 1, 2])

      expect(mockUpsertStudentVote).toHaveBeenCalledWith('u1', 'PFP1A', '2025', [3, 1, 2])
      expect(store.currentVote).toEqual(savedVote)
      expect(store.votes).toContainEqual(savedVote)
      expect(store.loading).toBe(false)
    })

    it('updates existing vote in state array', async () => {
      store.votes = [{ pfp_type: 'PFP1A', year: '2025', choices: [1] }]
      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })

      const updated = { pfp_type: 'PFP1A', year: '2025', choices: [3, 1, 2] }
      mockUpsertStudentVote.mockResolvedValue(updated)

      await store.saveVote('PFP1A', '2025', [3, 1, 2])

      expect(store.votes).toHaveLength(1)
      expect(store.votes[0].choices).toEqual([3, 1, 2])
    })

    it('throws if user not logged in', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } })

      await expect(store.saveVote('PFP1A', '2025', [1])).rejects.toThrow('Utilisateur non connecté')
    })
  })

  // ==================== DELETE VOTE ====================
  describe('deleteVote', () => {
    it('deletes vote and updates state', async () => {
      store.votes = [
        { pfp_type: 'PFP1A', year: '2025' },
        { pfp_type: 'PFP1B', year: '2025' },
      ]
      store.currentVote = { pfp_type: 'PFP1A', year: '2025' }

      mockAuthGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } })
      mockFrom.mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
      })
      // The last .eq() in the chain resolves
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        }),
      }
      mockFrom.mockReturnValue(chain)

      const result = await store.deleteVote('PFP1A', '2025')

      expect(result).toBe(true)
      expect(store.votes).toHaveLength(1)
      expect(store.votes[0].pfp_type).toBe('PFP1B')
      expect(store.currentVote).toBeNull()
    })

    it('throws if user not logged in', async () => {
      mockAuthGetUser.mockResolvedValue({ data: { user: null } })

      await expect(store.deleteVote('PFP1A', '2025')).rejects.toThrow('Utilisateur non connecté')
    })
  })

  // ==================== RESET ====================
  describe('reset', () => {
    it('resets all state', () => {
      store.votes = [{ id: 'v1' }]
      store.currentVote = { id: 'v1' }
      store.loading = true
      store.error = 'some error'

      store.reset()

      expect(store.votes).toEqual([])
      expect(store.currentVote).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })
  })
})
