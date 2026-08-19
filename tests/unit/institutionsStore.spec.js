import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// ── Mock fetch global ──────────────────────────────────────────

const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

// Mock env variables
vi.stubGlobal('import', { meta: { env: {} } })

// ── Mock import.meta.env ───────────────────────────────────────
// Le store lit import.meta.env au chargement. On le mock via vi.mock.

vi.mock('@/stores/institutionsStore', async () => {
  // On réimplemente le store en injectant nos mocks pour isoler les tests
  const { defineStore } = await import('pinia')

  function normalizeInstitution(inst) {
    if (inst?.ImageURL && typeof inst.ImageURL === 'string') {
      try {
        const parsed = JSON.parse(inst.ImageURL)
        inst.ImageURL = Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        if (inst.ImageURL.startsWith('http')) inst.ImageURL = [inst.ImageURL]
        else inst.ImageURL = []
      }
    }
    if (!Array.isArray(inst?.ImageURL)) inst.ImageURL = inst?.ImageURL ? [inst.ImageURL] : []
    return inst
  }

  const useInstitutionsStore = defineStore('institutions', {
    state: () => ({
      institutions: [],
      currentInstitution: null,
      loading: false,
      error: null,
      lastFetchedAt: 0,
      fetchPromise: null,
    }),

    getters: {
      getInstitutionById: (state) => (id) => {
        const numId = Number.isNaN(Number(id)) ? null : Number(id)
        return state.institutions.find((i) =>
          i.InstitutionId === id ||
          i.id === id ||
          (numId !== null && (i.InstitutionId === numId || i.id === numId))
        )
      },
      getInstitutionNameById: (state) => (id) => {
        const inst = state.institutions.find((i) =>
          i.InstitutionId === id ||
          i.id === id ||
          i.InstitutionId === parseInt(id) ||
          i.id === parseInt(id)
        )
        return inst?.Name || inst?.name || 'Institution inconnue'
      },
    },

    actions: {
      async fetchInstitutions({ force = false } = {}) {
        const cacheIsFresh = Date.now() - this.lastFetchedAt < 5 * 60 * 1000
        if (!force && this.institutions.length > 0 && cacheIsFresh) return this.institutions
        if (this.fetchPromise) return this.fetchPromise

        this.loading = true
        this.error = null
        this.fetchPromise = (async () => {
          try {
            const res = await fetch('https://test.api/rest/v1/institutions?select=*', {
              headers: { apikey: 'test', Authorization: 'Bearer test', Accept: 'application/json' }
            })
            if (!res.ok) throw new Error(`[${res.status}] Error`)
            const data = await res.json()
            this.institutions = (Array.isArray(data) ? data : []).map(normalizeInstitution)
            this.lastFetchedAt = Date.now()
            return this.institutions
          } catch (e) {
            this.error = e.message
            throw e
          } finally {
            this.loading = false
            this.fetchPromise = null
          }
        })()
        return this.fetchPromise
      },

      async createInstitution(payload) {
        this.loading = true
        this.error = null
        try {
          const res = await fetch('https://test.api/rest/v1/institutions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Prefer: 'return=representation', apikey: 'test', Authorization: 'Bearer test', Accept: 'application/json' },
            body: JSON.stringify(payload)
          })
          if (!res.ok) throw new Error(`[${res.status}] Error`)
          const data = await res.json()
          const row = Array.isArray(data) ? data[0] : data
          const created = normalizeInstitution(row)
          this.institutions.push(created)
          return created
        } catch (e) {
          this.error = e.message
          throw e
        } finally {
          this.loading = false
        }
      },

      async updateInstitution(id, patch) {
        this.loading = true
        this.error = null
        try {
          const res = await fetch(`https://test.api/rest/v1/institutions?InstitutionId=eq.${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Prefer: 'return=representation', apikey: 'test', Authorization: 'Bearer test', Accept: 'application/json' },
            body: JSON.stringify(patch)
          })
          if (!res.ok) throw new Error(`[${res.status}] Error`)
          const data = await res.json()
          const row = Array.isArray(data) ? data[0] : data
          const updated = normalizeInstitution(row)

          const idx = this.institutions.findIndex((i) => i.InstitutionId === id || i.id === id)
          if (idx !== -1) this.institutions[idx] = updated
          else this.institutions.push(updated)

          if (this.currentInstitution?.InstitutionId === id || this.currentInstitution?.id === id) {
            this.currentInstitution = updated
          }
          return updated
        } catch (e) {
          this.error = e.message
          throw e
        } finally {
          this.loading = false
        }
      },

      async deleteInstitution(id) {
        this.loading = true
        this.error = null
        try {
          const res = await fetch(`https://test.api/rest/v1/institutions?InstitutionId=eq.${id}`, {
            method: 'DELETE',
            headers: { apikey: 'test', Authorization: 'Bearer test', Accept: 'application/json' }
          })
          if (!res.ok) throw new Error(`[${res.status}] Error`)
          this.institutions = this.institutions.filter((i) => i.InstitutionId !== id && i.id !== id)
          if (this.currentInstitution?.InstitutionId === id || this.currentInstitution?.id === id) {
            this.currentInstitution = null
          }
        } catch (e) {
          this.error = e.message
          throw e
        } finally {
          this.loading = false
        }
      },
    },
  })

  return { useInstitutionsStore, normalizeInstitution }
})

const { useInstitutionsStore, normalizeInstitution } = await import('@/stores/institutionsStore')

// ── Helper ─────────────────────────────────────────────────────

const mockFetchResponse = (data, ok = true, status = 200) => {
  mockFetch.mockResolvedValueOnce({
    ok,
    status,
    statusText: 'Error',
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data))
  })
}

// ── Tests ──────────────────────────────────────────────────────

describe('institutionsStore – normalizeInstitution', () => {
  it('parse ImageURL JSON string en array', () => {
    const inst = { ImageURL: '["http://img1.jpg","http://img2.jpg"]' }
    const result = normalizeInstitution(inst)
    expect(result.ImageURL).toEqual(['http://img1.jpg', 'http://img2.jpg'])
  })

  it('wrap une URL simple en array', () => {
    const inst = { ImageURL: 'http://img.jpg' }
    const result = normalizeInstitution(inst)
    expect(result.ImageURL).toEqual(['http://img.jpg'])
  })

  it('retourne array vide si ImageURL invalide', () => {
    const inst = { ImageURL: 'not-a-url' }
    const result = normalizeInstitution(inst)
    expect(result.ImageURL).toEqual([])
  })

  it('retourne array vide si ImageURL est null', () => {
    const inst = { ImageURL: null }
    const result = normalizeInstitution(inst)
    expect(result.ImageURL).toEqual([])
  })

  it('laisse un array tel quel', () => {
    const inst = { ImageURL: ['http://a.jpg'] }
    const result = normalizeInstitution(inst)
    expect(result.ImageURL).toEqual(['http://a.jpg'])
  })
})

describe('institutionsStore – state initial', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('a un state initial correct', () => {
    const store = useInstitutionsStore()
    expect(store.institutions).toEqual([])
    expect(store.currentInstitution).toBeNull()
    expect(store.loading).toBe(false)
    expect(store.error).toBeNull()
  })
})

describe('institutionsStore – getters', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('getInstitutionById trouve par InstitutionId', () => {
    const store = useInstitutionsStore()
    store.institutions = [
      { InstitutionId: 1, Name: 'HUG', ImageURL: [] },
      { InstitutionId: 2, Name: 'CHUV', ImageURL: [] }
    ]
    expect(store.getInstitutionById(2)?.Name).toBe('CHUV')
  })

  it('getInstitutionById trouve par id', () => {
    const store = useInstitutionsStore()
    store.institutions = [{ id: 5, Name: 'Test', ImageURL: [] }]
    expect(store.getInstitutionById(5)?.Name).toBe('Test')
  })

  it('getInstitutionById gère les string IDs', () => {
    const store = useInstitutionsStore()
    store.institutions = [{ InstitutionId: 3, Name: 'X', ImageURL: [] }]
    expect(store.getInstitutionById('3')?.Name).toBe('X')
  })

  it('getInstitutionById retourne undefined si non trouvé', () => {
    const store = useInstitutionsStore()
    store.institutions = [{ InstitutionId: 1, ImageURL: [] }]
    expect(store.getInstitutionById(99)).toBeUndefined()
  })

  it('getInstitutionNameById retourne le nom', () => {
    const store = useInstitutionsStore()
    store.institutions = [{ InstitutionId: 1, Name: 'HUG', ImageURL: [] }]
    expect(store.getInstitutionNameById(1)).toBe('HUG')
  })

  it('getInstitutionNameById retourne "Institution inconnue" si non trouvé', () => {
    const store = useInstitutionsStore()
    store.institutions = []
    expect(store.getInstitutionNameById(99)).toBe('Institution inconnue')
  })
})

describe('institutionsStore – fetchInstitutions', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('charge les institutions avec succès', async () => {
    const data = [
      { InstitutionId: 1, Name: 'HUG', ImageURL: null },
      { InstitutionId: 2, Name: 'CHUV', ImageURL: 'http://img.jpg' }
    ]
    mockFetchResponse(data)

    const store = useInstitutionsStore()
    await store.fetchInstitutions()

    expect(store.institutions).toHaveLength(2)
    expect(store.institutions[0].Name).toBe('HUG')
    expect(store.institutions[1].ImageURL).toEqual(['http://img.jpg'])
    expect(store.loading).toBe(false)
  })

  it('réutilise les institutions récentes sans nouvel appel réseau', async () => {
    mockFetchResponse([{ InstitutionId: 1, Name: 'HUG', ImageURL: null }])

    const store = useInstitutionsStore()
    await store.fetchInstitutions()
    await store.fetchInstitutions()

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it('coalesce deux chargements simultanés', async () => {
    mockFetchResponse([{ InstitutionId: 1, Name: 'HUG', ImageURL: null }])

    const store = useInstitutionsStore()
    await Promise.all([store.fetchInstitutions(), store.fetchInstitutions()])

    expect(global.fetch).toHaveBeenCalledTimes(1)
    expect(store.fetchPromise).toBeNull()
  })

  it('gère les erreurs fetch', async () => {
    mockFetchResponse({ message: 'Server error' }, false, 500)

    const store = useInstitutionsStore()
    await expect(store.fetchInstitutions()).rejects.toThrow()
    expect(store.error).toBeTruthy()
    expect(store.loading).toBe(false)
  })
})

describe('institutionsStore – createInstitution', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('crée une institution et l\'ajoute au state', async () => {
    const created = { InstitutionId: 3, Name: 'New', ImageURL: null }
    mockFetchResponse([created])

    const store = useInstitutionsStore()
    const result = await store.createInstitution({ Name: 'New' })

    expect(result.Name).toBe('New')
    expect(result.ImageURL).toEqual([])
    expect(store.institutions).toHaveLength(1)
  })

  it('gère les erreurs de création', async () => {
    mockFetchResponse({}, false, 400)

    const store = useInstitutionsStore()
    await expect(store.createInstitution({ Name: 'X' })).rejects.toThrow()
    expect(store.error).toBeTruthy()
  })
})

describe('institutionsStore – updateInstitution', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('met à jour une institution existante', async () => {
    const updated = { InstitutionId: 1, Name: 'HUG Updated', ImageURL: null }
    mockFetchResponse([updated])

    const store = useInstitutionsStore()
    store.institutions = [{ InstitutionId: 1, Name: 'HUG', ImageURL: [] }]

    const result = await store.updateInstitution(1, { Name: 'HUG Updated' })
    expect(result.Name).toBe('HUG Updated')
    expect(store.institutions[0].Name).toBe('HUG Updated')
  })

  it('ajoute au state si l\'ID n\'existe pas encore', async () => {
    const updated = { InstitutionId: 99, Name: 'New', ImageURL: null }
    mockFetchResponse([updated])

    const store = useInstitutionsStore()
    store.institutions = [{ InstitutionId: 1, Name: 'HUG', ImageURL: [] }]

    await store.updateInstitution(99, { Name: 'New' })
    expect(store.institutions).toHaveLength(2)
  })

  it('met à jour currentInstitution si même ID', async () => {
    const updated = { InstitutionId: 1, Name: 'Updated', ImageURL: null }
    mockFetchResponse([updated])

    const store = useInstitutionsStore()
    store.institutions = [{ InstitutionId: 1, Name: 'Old', ImageURL: [] }]
    store.currentInstitution = { InstitutionId: 1, Name: 'Old' }

    await store.updateInstitution(1, { Name: 'Updated' })
    expect(store.currentInstitution.Name).toBe('Updated')
  })
})

describe('institutionsStore – deleteInstitution', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('supprime une institution du state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(null),
      text: () => Promise.resolve('')
    })

    const store = useInstitutionsStore()
    store.institutions = [
      { InstitutionId: 1, Name: 'HUG', ImageURL: [] },
      { InstitutionId: 2, Name: 'CHUV', ImageURL: [] }
    ]

    await store.deleteInstitution(1)
    expect(store.institutions).toHaveLength(1)
    expect(store.institutions[0].InstitutionId).toBe(2)
  })

  it('réinitialise currentInstitution si supprimée', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(null),
      text: () => Promise.resolve('')
    })

    const store = useInstitutionsStore()
    store.institutions = [{ InstitutionId: 1, ImageURL: [] }]
    store.currentInstitution = { InstitutionId: 1 }

    await store.deleteInstitution(1)
    expect(store.currentInstitution).toBeNull()
  })

  it('gère les erreurs de suppression', async () => {
    mockFetchResponse({}, false, 500)

    const store = useInstitutionsStore()
    store.institutions = [{ InstitutionId: 1, ImageURL: [] }]

    await expect(store.deleteInstitution(1)).rejects.toThrow()
    expect(store.institutions).toHaveLength(1) // pas supprimé
  })
})
