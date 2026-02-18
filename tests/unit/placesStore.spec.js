import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// ── Mock Supabase ──────────────────────────────────────────────

const mockFrom = vi.fn()

vi.mock('@/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args)
  }
}))

// ── Helpers pour chaîner les appels Supabase ───────────────────

function mockChain(finalResult) {
  const chain = {
    select: vi.fn(() => chain),
    insert: vi.fn(() => chain),
    update: vi.fn(() => chain),
    delete: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    single: vi.fn(() => finalResult),
    order: vi.fn(() => chain),
    maybeSingle: vi.fn(() => finalResult),
  }
  // select() sans .single() retourne directement
  chain.select = vi.fn(() => ({ ...chain, ...finalResult }))
  return chain
}

import { usePlacesStore } from '@/stores/placesStore'

// ── Tests ──────────────────────────────────────────────────────

describe('placesStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = usePlacesStore()
    vi.clearAllMocks()
  })

  // ── État initial ─────────────────────────────────────────────

  describe('état initial', () => {
    it('places est un tableau vide', () => {
      expect(store.places).toEqual([])
    })

    it('loading est false', () => {
      expect(store.loading).toBe(false)
    })

    it('error est null', () => {
      expect(store.error).toBeNull()
    })

    it('lastFetchedAt est 0', () => {
      expect(store.lastFetchedAt).toBe(0)
    })
  })

  // ── Getters ──────────────────────────────────────────────────

  describe('getters', () => {
    beforeEach(() => {
      store.places = [
        { PlaceId: 'p1', NomPlace: 'Place A', InstitutionId: 'i1', fileURL: 'http://file.pdf', Cardio: true, Neuro: false, FR: true, DE: false },
        { PlaceId: 'p2', NomPlace: 'Place B', InstitutionId: 'i1', fileURL: null, Cardio: false, Neuro: true, FR: false, DE: true },
        { PlaceId: 'p3', NomPlace: 'Place C', InstitutionId: 'i2', fileURL: '', Cardio: true, Neuro: true, FR: true, DE: true },
      ]
    })

    it('getPlaceById retourne la bonne place', () => {
      expect(store.getPlaceById('p2').NomPlace).toBe('Place B')
    })

    it('getPlaceById retourne undefined pour un ID inconnu', () => {
      expect(store.getPlaceById('unknown')).toBeUndefined()
    })

    it('getPlacesByInstitution filtre par institution', () => {
      const result = store.getPlacesByInstitution('i1')
      expect(result).toHaveLength(2)
    })

    it('getPlacesBySpecialties filtre par spécialités', () => {
      const result = store.getPlacesBySpecialties(['Cardio'])
      expect(result).toHaveLength(2) // p1 et p3
    })

    it('getPlacesBySpecialties avec plusieurs spécialités', () => {
      const result = store.getPlacesBySpecialties(['Neuro'])
      expect(result).toHaveLength(2) // p2 et p3
    })

    it('getPlacesByLanguage filtre par langue', () => {
      const result = store.getPlacesByLanguage(['DE'])
      expect(result).toHaveLength(2) // p2 et p3
    })

    it('getPlacesWithFiles retourne les places avec fichier', () => {
      const result = store.getPlacesWithFiles
      expect(result).toHaveLength(1) // seulement p1
      expect(result[0].PlaceId).toBe('p1')
    })
  })

  // ── searchPlaces ─────────────────────────────────────────────

  describe('searchPlaces', () => {
    beforeEach(() => {
      store.places = [
        { PlaceId: 'p1', NomPlace: 'Hôpital du Valais', Remarques: { text: 'Cardio' } },
        { PlaceId: 'p2', NomPlace: 'Clinique Genève', Remarques: { text: 'Neuro' } },
        { PlaceId: 'p3', NomPlace: 'Centre Vaud', Remarques: { text: 'Ortho' } },
      ]
    })

    it('filtre par nom de place', async () => {
      const result = await store.searchPlaces('hôpital')
      expect(result).toHaveLength(1)
      expect(result[0].PlaceId).toBe('p1')
    })

    it('filtre par remarques', async () => {
      const result = await store.searchPlaces('neuro')
      expect(result).toHaveLength(1)
      expect(result[0].PlaceId).toBe('p2')
    })

    it('retourne toutes les places si recherche vide', async () => {
      const result = await store.searchPlaces('')
      expect(result).toHaveLength(3)
    })

    it('retourne toutes les places si recherche null', async () => {
      const result = await store.searchPlaces(null)
      expect(result).toHaveLength(3)
    })

    it('retourne vide si aucun match', async () => {
      const result = await store.searchPlaces('xyz123')
      expect(result).toHaveLength(0)
    })
  })

  // ── Actions CRUD (logique locale) ────────────────────────────

  describe('createPlace – mise à jour locale', () => {
    it('ajoute la place au store après création', async () => {
      const newPlace = { PlaceId: 'new1', NomPlace: 'Nouvelle Place' }

      const chain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: newPlace, error: null })
      }
      mockFrom.mockReturnValue({
        insert: vi.fn(() => chain)
      })

      await store.createPlace({ NomPlace: 'Nouvelle Place' })
      expect(store.places).toHaveLength(1)
      expect(store.places[0].NomPlace).toBe('Nouvelle Place')
    })

    it('propage l\'erreur Supabase', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } })
      }
      mockFrom.mockReturnValue({
        insert: vi.fn(() => chain)
      })

      await expect(store.createPlace({})).rejects.toEqual({ message: 'DB error' })
      expect(store.error).toBe('DB error')
    })
  })

  describe('deletePlace – mise à jour locale', () => {
    it('retire la place du store après suppression', async () => {
      store.places = [
        { PlaceId: 'p1', NomPlace: 'A' },
        { PlaceId: 'p2', NomPlace: 'B' }
      ]

      const chain = {
        eq: vi.fn().mockResolvedValue({ error: null })
      }
      mockFrom.mockReturnValue({
        delete: vi.fn(() => chain)
      })

      await store.deletePlace('p1')
      expect(store.places).toHaveLength(1)
      expect(store.places[0].PlaceId).toBe('p2')
    })
  })

  describe('updatePlace – mise à jour locale', () => {
    it('met à jour la place dans le store', async () => {
      store.places = [{ PlaceId: 'p1', NomPlace: 'Ancien' }]

      const updatedPlace = { PlaceId: 'p1', NomPlace: 'Nouveau' }
      const chain = {
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedPlace, error: null })
      }
      mockFrom.mockReturnValue({
        update: vi.fn(() => chain)
      })

      await store.updatePlace('p1', { NomPlace: 'Nouveau' })
      expect(store.places[0].NomPlace).toBe('Nouveau')
    })
  })

  // ── Loading state ────────────────────────────────────────────

  describe('loading state', () => {
    it('loading passe à false après createPlace (succès)', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { PlaceId: 'x' }, error: null })
      }
      mockFrom.mockReturnValue({ insert: vi.fn(() => chain) })

      await store.createPlace({})
      expect(store.loading).toBe(false)
    })

    it('loading passe à false après createPlace (erreur)', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { message: 'err' } })
      }
      mockFrom.mockReturnValue({ insert: vi.fn(() => chain) })

      try { await store.createPlace({}) } catch {}
      expect(store.loading).toBe(false)
    })
  })

  // ── Cache et loading dans fetchPlaces ──────────────────────

  describe('fetchPlaces – cache et loading', () => {
    it('loading passe à false quand le cache est utilisé', async () => {
      // Simuler un cache valide
      store.places = [{ PlaceId: 'p1', NomPlace: 'Cached' }]
      store.lastFetchedAt = Date.now() // Juste maintenant = cache valide

      await store.fetchPlaces()
      expect(store.loading).toBe(false)
      expect(store.places).toHaveLength(1)
    })

    it('force: true ignore le cache', async () => {
      store.places = [{ PlaceId: 'p1', NomPlace: 'Old' }]
      store.lastFetchedAt = Date.now()

      const newPlaces = [{ PlaceId: 'p2', NomPlace: 'New', InstitutionId: null }]
      const institutions = []

      // Premier appel = places, deuxième = institutions
      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount === 1) {
          return { select: vi.fn(() => ({ data: newPlaces, error: null })) }
        }
        return { select: vi.fn(() => ({ data: institutions, error: null })) }
      })

      await store.fetchPlaces({ force: true })
      expect(store.loading).toBe(false)
      expect(store.places).toHaveLength(1)
      expect(store.places[0].PlaceId).toBe('p2')
    })

    it('loading passe à false après une erreur dans fetchPlaces', async () => {
      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({ data: null, error: { message: 'Network error' } }))
      }))

      try { await store.fetchPlaces({ force: true }) } catch {}
      expect(store.loading).toBe(false)
      expect(store.error).toBe('Network error')
    })

    it('fetchPromise est nettoyé après fetchPlaces', async () => {
      store.places = [{ PlaceId: 'p1' }]
      store.lastFetchedAt = Date.now()

      await store.fetchPlaces()
      expect(store.fetchPromise).toBeNull()
    })

    it('lastFetchedAt est mis à jour après un fetch réussi', async () => {
      const before = Date.now()

      mockFrom.mockImplementation(() => ({
        select: vi.fn(() => ({ data: [], error: null }))
      }))

      await store.fetchPlaces({ force: true })
      expect(store.lastFetchedAt).toBeGreaterThanOrEqual(before)
    })
  })
})
