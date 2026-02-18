import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock Supabase
const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockOr = vi.fn()
const mockOrder = vi.fn()
const mockRange = vi.fn()
const mockSingle = vi.fn()

function createChain(resolveValue) {
  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    or: vi.fn(() => chain),
    order: vi.fn(() => chain),
    range: vi.fn(() => chain),
    single: vi.fn(() => Promise.resolve(resolveValue)),
    then: (cb) => Promise.resolve(resolveValue).then(cb),
  }
  // Make chain itself thenable for queries without .single()
  return chain
}

let mockChain
let mockFromResult

vi.mock('@/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockChain),
  },
}))

import { usePraticiensStore } from '@/stores/praticiensStore'

describe('praticiensStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePraticiensStore()
    vi.clearAllMocks()
  })

  // ==================== INITIAL STATE ====================
  describe('initial state', () => {
    it('has empty items array', () => {
      expect(store.items).toEqual([])
    })

    it('has total = 0', () => {
      expect(store.total).toBe(0)
    })

    it('has loading = false', () => {
      expect(store.loading).toBe(false)
    })

    it('has error = null', () => {
      expect(store.error).toBeNull()
    })
  })

  // ==================== FETCH PRATICIENS ====================
  describe('fetchPraticiens', () => {
    it('fetches praticiens and normalizes data', async () => {
      const mockData = [
        { id: '1', nom: 'Dupont', prenom: 'Jean', mail: 'j@test.ch', institution: 'HES', localite: 'Sion', created_at: '2024-01-01', updated_at: '2024-01-02' },
        { id: '2', nom: 'Martin', prenom: 'Marie', mail: 'm@test.ch', institution: 'UNIL', localite: 'Lausanne', created_at: '2024-01-01', updated_at: '2024-01-02' },
      ]

      mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: mockData, error: null, count: 2 }),
      }

      const result = await store.fetchPraticiens()

      expect(store.items).toHaveLength(2)
      expect(store.total).toBe(2)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()

      // Check normalization (both lowercase and uppercase keys)
      expect(store.items[0].nom).toBe('Dupont')
      expect(store.items[0].Nom).toBe('Dupont')
      expect(store.items[0].prenom).toBe('Jean')
      expect(store.items[0].Prenom).toBe('Jean')
      expect(store.items[1].mail).toBe('m@test.ch')
      expect(store.items[1].Mail).toBe('m@test.ch')
    })

    it('applies search filter when searchQuery is provided', async () => {
      mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      }

      await store.fetchPraticiens('Dupont')

      expect(mockChain.or).toHaveBeenCalled()
      const orArg = mockChain.or.mock.calls[0][0]
      expect(orArg).toContain('Dupont')
    })

    it('does not apply search filter when searchQuery is empty', async () => {
      mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      }

      await store.fetchPraticiens('')

      expect(mockChain.or).not.toHaveBeenCalled()
    })

    it('sets loading during fetch', async () => {
      let loadingDuringFetch = false

      mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn(() => {
          loadingDuringFetch = store.loading
          return Promise.resolve({ data: [], error: null, count: 0 })
        }),
      }

      await store.fetchPraticiens()

      expect(loadingDuringFetch).toBe(true)
      expect(store.loading).toBe(false)
    })

    it('handles fetch error', async () => {
      mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: { message: 'Network error' }, count: 0 }),
      }

      await expect(store.fetchPraticiens()).rejects.toThrow()
      expect(store.error).toBe('Network error')
      expect(store.loading).toBe(false)
    })

    it('handles null data gracefully', async () => {
      mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: null, error: null, count: 0 }),
      }

      await store.fetchPraticiens()

      expect(store.items).toEqual([])
      expect(store.total).toBe(0)
    })

    it('applies pagination with limit and offset', async () => {
      mockChain = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
      }

      await store.fetchPraticiens('', { limit: 50, offset: 100 })

      expect(mockChain.range).toHaveBeenCalledWith(100, 149)
    })
  })

  // ==================== CREATE PRATICIEN ====================
  describe('createPraticien', () => {
    it('creates a praticien and adds to items', async () => {
      const newData = { id: '3', nom: 'Blanc', prenom: 'Pierre', mail: 'p@test.ch', institution: 'HES', localite: 'Sion', created_at: '2024-01-01', updated_at: '2024-01-02' }

      mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: newData, error: null }),
      }

      const result = await store.createPraticien({ nom: 'Blanc', prenom: 'Pierre', mail: 'p@test.ch' })

      expect(result.nom).toBe('Blanc')
      expect(result.Nom).toBe('Blanc')
      expect(store.items).toHaveLength(1)
      expect(store.total).toBe(1)
      expect(store.loading).toBe(false)
    })

    it('accepts uppercase field names', async () => {
      const newData = { id: '4', nom: 'Test', prenom: 'User', mail: null, institution: null, localite: null, created_at: '2024-01-01', updated_at: '2024-01-02' }

      mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: newData, error: null }),
      }

      await store.createPraticien({ Nom: 'Test', Prenom: 'User' })

      // Verify insert was called with lowercase keys
      const insertArg = mockChain.insert.mock.calls[0][0][0]
      expect(insertArg.nom).toBe('Test')
      expect(insertArg.prenom).toBe('User')
    })

    it('handles table not found error (42P01)', async () => {
      mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: '42P01', message: 'relation does not exist' } }),
      }

      await expect(store.createPraticien({ nom: 'Test' })).rejects.toThrow('table praticiens_formateurs')
    })

    it('handles permission error (42501)', async () => {
      mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: '42501', message: 'permission denied' } }),
      }

      await expect(store.createPraticien({ nom: 'Test' })).rejects.toThrow('Permissions insuffisantes')
    })

    it('handles generic supabase error', async () => {
      mockChain = {
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: '23505', message: 'duplicate key' } }),
      }

      await expect(store.createPraticien({ nom: 'Test' })).rejects.toThrow('duplicate key')
      expect(store.error).toBeTruthy()
    })
  })

  // ==================== UPDATE PRATICIEN ====================
  describe('updatePraticien', () => {
    it('updates a praticien in the list', async () => {
      // Pre-populate store
      store.items = [
        { id: '1', nom: 'Dupont', prenom: 'Jean', mail: 'j@test.ch', institution: 'HES', localite: 'Sion', Nom: 'Dupont', Prenom: 'Jean', Mail: 'j@test.ch', Institution: 'HES', Localite: 'Sion' },
      ]

      const updatedData = { id: '1', nom: 'Dupont-Martin', prenom: 'Jean', mail: 'jm@test.ch', institution: 'HES', localite: 'Sion', created_at: '2024-01-01', updated_at: '2024-02-01' }

      mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedData, error: null }),
      }

      const result = await store.updatePraticien('1', { nom: 'Dupont-Martin', mail: 'jm@test.ch' })

      expect(store.items[0].nom).toBe('Dupont-Martin')
      expect(store.items[0].Nom).toBe('Dupont-Martin')
      expect(store.items[0].mail).toBe('jm@test.ch')
    })

    it('handles update error', async () => {
      store.items = [{ id: '1', nom: 'Test' }]

      mockChain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Update failed' } }),
      }

      await expect(store.updatePraticien('1', { nom: 'New' })).rejects.toThrow()
      expect(store.error).toBe('Update failed')
    })
  })

  // ==================== DELETE PRATICIEN ====================
  describe('deletePraticien', () => {
    it('deletes a praticien from the list', async () => {
      store.items = [
        { id: '1', nom: 'Dupont' },
        { id: '2', nom: 'Martin' },
      ]
      store.total = 2

      mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }

      await store.deletePraticien('1')

      expect(store.items).toHaveLength(1)
      expect(store.items[0].id).toBe('2')
      expect(store.total).toBe(1)
      expect(store.loading).toBe(false)
    })

    it('does not go below 0 for total', async () => {
      store.items = []
      store.total = 0

      mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }

      await store.deletePraticien('nonexistent')

      expect(store.total).toBe(0)
    })

    it('handles delete error', async () => {
      store.items = [{ id: '1', nom: 'Test' }]
      store.total = 1

      mockChain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      }

      await expect(store.deletePraticien('1')).rejects.toThrow()
      expect(store.error).toBe('Delete failed')
      expect(store.loading).toBe(false)
    })
  })

  // ==================== GET PRATICIEN BY ID ====================
  describe('getPraticienById', () => {
    it('returns a normalized praticien', async () => {
      const mockData = { id: '1', nom: 'Dupont', prenom: 'Jean', mail: 'j@test.ch', institution: 'HES', localite: 'Sion', created_at: '2024-01-01', updated_at: '2024-01-02' }

      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      }

      const result = await store.getPraticienById('1')

      expect(result.nom).toBe('Dupont')
      expect(result.Nom).toBe('Dupont')
      expect(result.prenom).toBe('Jean')
      expect(result.Prenom).toBe('Jean')
    })

    it('returns null when not found (PGRST116)', async () => {
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'not found' } }),
      }

      const result = await store.getPraticienById('nonexistent')

      expect(result).toBeNull()
    })

    it('throws on other errors', async () => {
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: '500', message: 'Server error' } }),
      }

      await expect(store.getPraticienById('1')).rejects.toThrow()
    })

    it('returns null when data is null without error', async () => {
      mockChain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: null }),
      }

      const result = await store.getPraticienById('1')

      expect(result).toBeNull()
    })
  })
})
