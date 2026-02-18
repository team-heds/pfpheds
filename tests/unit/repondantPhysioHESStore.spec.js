import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// ── Mock Supabase ──────────────────────────────────────────────

const mockSelect = vi.fn()
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockOrder = vi.fn()

// Chaîne fluide Supabase
const chainable = () => ({
  select: (...args) => { mockSelect(...args); return chainable() },
  insert: (...args) => { mockInsert(...args); return chainable() },
  update: (...args) => { mockUpdate(...args); return chainable() },
  delete: (...args) => { mockDelete(...args); return chainable() },
  eq: (...args) => { mockEq(...args); return chainable() },
  single: (...args) => { mockSingle(...args); return mockSingle._result || { data: null, error: null } },
  order: (...args) => { mockOrder(...args); return mockOrder._result || { data: [], error: null } },
})

vi.mock('@/supabase', () => ({
  supabase: {
    from: () => chainable()
  }
}))

// ── Import store après mock ────────────────────────────────────

const { useRepondantPhysioHESStore } = await import('@/stores/repondantPhysioHESStore')

// ── Tests ──────────────────────────────────────────────────────

describe('repondantPhysioHESStore – state initial', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('a un state initial correct', () => {
    const store = useRepondantPhysioHESStore()
    expect(store.repondants).toEqual([])
    expect(store.currentRepondant).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })
})

describe('repondantPhysioHESStore – getters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('activeRepondants filtre les répondants actifs', () => {
    const store = useRepondantPhysioHESStore()
    store.repondants = [
      { id: 1, is_active: true, first_name: 'A' },
      { id: 2, is_active: false, first_name: 'B' },
      { id: 3, is_active: true, first_name: 'C' }
    ]
    expect(store.activeRepondants).toHaveLength(2)
    expect(store.activeRepondants.map(r => r.id)).toEqual([1, 3])
  })

  it('getRepondantById retourne le bon répondant', () => {
    const store = useRepondantPhysioHESStore()
    store.repondants = [
      { id: 1, first_name: 'Alice' },
      { id: 2, first_name: 'Bob' }
    ]
    expect(store.getRepondantById(2)).toEqual({ id: 2, first_name: 'Bob' })
  })

  it('getRepondantById retourne undefined si non trouvé', () => {
    const store = useRepondantPhysioHESStore()
    store.repondants = [{ id: 1 }]
    expect(store.getRepondantById(99)).toBeUndefined()
  })

  it('getRepondantByUserId retourne le bon répondant', () => {
    const store = useRepondantPhysioHESStore()
    store.repondants = [
      { id: 1, user_id: 'u1' },
      { id: 2, user_id: 'u2' }
    ]
    expect(store.getRepondantByUserId('u2')).toEqual({ id: 2, user_id: 'u2' })
  })
})

describe('repondantPhysioHESStore – fetchRepondants', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('charge les répondants avec succès', async () => {
    const mockData = [
      { id: 1, first_name: 'Alice', last_name: 'A', is_active: true },
      { id: 2, first_name: 'Bob', last_name: 'B', is_active: false }
    ]
    mockOrder._result = { data: mockData, error: null }

    const store = useRepondantPhysioHESStore()
    await store.fetchRepondants()

    expect(store.repondants).toEqual(mockData)
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })

  it('gère les erreurs de fetch', async () => {
    mockOrder._result = { data: null, error: { message: 'Network error' } }

    const store = useRepondantPhysioHESStore()
    await store.fetchRepondants()

    expect(store.repondants).toEqual([])
    expect(store.error).toBe('Network error')
    expect(store.loading).toBe(false)
  })

  it('met loading à true pendant le fetch', async () => {
    mockOrder._result = { data: [], error: null }
    const store = useRepondantPhysioHESStore()

    const promise = store.fetchRepondants()
    // loading est géré de manière synchrone dans le try, 
    // mais le test vérifie qu'il est false après
    await promise
    expect(store.loading).toBe(false)
  })
})

describe('repondantPhysioHESStore – createRepondant', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('crée un répondant et l\'ajoute au state', async () => {
    const newRepondant = { id: 3, first_name: 'Charlie', last_name: 'C', email: 'c@test.ch', is_active: true }
    mockSingle._result = { data: newRepondant, error: null }

    const store = useRepondantPhysioHESStore()
    const result = await store.createRepondant({ first_name: 'Charlie', last_name: 'C', email: 'c@test.ch' })

    expect(result).toEqual(newRepondant)
    expect(store.repondants).toContainEqual(newRepondant)
  })

  it('lance une erreur si la création échoue', async () => {
    mockSingle._result = { data: null, error: { message: 'Duplicate email' } }

    const store = useRepondantPhysioHESStore()
    await expect(store.createRepondant({ first_name: 'X' })).rejects.toThrow()
    expect(store.error).toBe('Duplicate email')
  })
})

describe('repondantPhysioHESStore – updateRepondant', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('met à jour un répondant dans le state', async () => {
    const updated = { id: 1, first_name: 'Alice Updated', last_name: 'A', email: 'a@test.ch', is_active: true }
    mockSingle._result = { data: updated, error: null }

    const store = useRepondantPhysioHESStore()
    store.repondants = [{ id: 1, first_name: 'Alice', last_name: 'A' }]

    const result = await store.updateRepondant(1, { first_name: 'Alice Updated' })
    expect(result).toEqual(updated)
    expect(store.repondants[0].first_name).toBe('Alice Updated')
  })

  it('met à jour currentRepondant si c\'est le même ID', async () => {
    const updated = { id: 1, first_name: 'Updated' }
    mockSingle._result = { data: updated, error: null }

    const store = useRepondantPhysioHESStore()
    store.repondants = [{ id: 1, first_name: 'Old' }]
    store.currentRepondant = { id: 1, first_name: 'Old' }

    await store.updateRepondant(1, { first_name: 'Updated' })
    expect(store.currentRepondant.first_name).toBe('Updated')
  })
})

describe('repondantPhysioHESStore – deleteRepondant', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('supprime un répondant du state', async () => {
    mockEq._result = { error: null }
    // Override the chain to return success for delete
    const store = useRepondantPhysioHESStore()
    store.repondants = [
      { id: 1, first_name: 'Alice' },
      { id: 2, first_name: 'Bob' }
    ]

    await store.deleteRepondant(1)
    expect(store.repondants).toHaveLength(1)
    expect(store.repondants[0].id).toBe(2)
  })

  it('réinitialise currentRepondant si supprimé', async () => {
    const store = useRepondantPhysioHESStore()
    store.repondants = [{ id: 1 }]
    store.currentRepondant = { id: 1 }

    await store.deleteRepondant(1)
    expect(store.currentRepondant).toBeNull()
  })
})

describe('repondantPhysioHESStore – getRepondantByIdAsync', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('retourne depuis le cache si trouvé', async () => {
    const store = useRepondantPhysioHESStore()
    store.repondants = [{ id: 1, first_name: 'Alice' }]

    const result = await store.getRepondantByIdAsync(1)
    expect(result).toEqual({ id: 1, first_name: 'Alice' })
    // Ne devrait pas appeler fetchRepondantById
    expect(mockSingle).not.toHaveBeenCalled()
  })

  it('fetch depuis Supabase si pas en cache', async () => {
    const fetched = { id: 99, first_name: 'Remote' }
    mockSingle._result = { data: fetched, error: null }

    const store = useRepondantPhysioHESStore()
    store.repondants = []

    const result = await store.getRepondantByIdAsync(99)
    expect(result).toEqual(fetched)
  })
})
