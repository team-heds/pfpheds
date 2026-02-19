import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia, defineStore } from 'pinia'

// Mock Supabase
vi.mock('@/supabase', () => ({
  supabase: {
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
  },
}))

// Mock votationSessionService
const { mockGetAllActiveSessions, mockGetActiveSession, mockGetOpenSessionForClass } = vi.hoisted(() => ({
  mockGetAllActiveSessions: vi.fn(),
  mockGetActiveSession: vi.fn(),
  mockGetOpenSessionForClass: vi.fn(),
}))

vi.mock('@/service/votationSessionService', () => ({
  default: {
    getAllActiveSessions: (...args) => mockGetAllActiveSessions(...args),
    getActiveSession: (...args) => mockGetActiveSession(...args),
    getOpenSessionForClass: (...args) => mockGetOpenSessionForClass(...args),
  },
}))

// Mock votesBackendService
vi.mock('@/stores/votesBackendService', () => ({
  default: {
    getVotePlaceAggregation: vi.fn().mockResolvedValue([]),
    upsertStudentVote: vi.fn().mockResolvedValue({}),
  },
}))

// Mock Pinia stores — must use defineStore so mapStores works
vi.mock('@/stores/institutionsStore', () => ({
  useInstitutionsStore: defineStore('institutions', {
    state: () => ({ institutions: [] }),
    actions: { fetchInstitutions: vi.fn().mockResolvedValue([]) },
  }),
}))

vi.mock('@/stores/placesStore', () => ({
  usePlacesStore: defineStore('places', {
    state: () => ({ places: [] }),
    actions: { fetchPlaces: vi.fn().mockResolvedValue([]) },
  }),
}))

vi.mock('@/stores/userStore', () => ({
  useUserStore: defineStore('user', {
    state: () => ({ user: { id: 'user-123' }, profile: { Classe: 'BA25' } }),
    actions: { fetchProfile: vi.fn() },
  }),
}))

vi.mock('@/stores/votesStore', () => ({
  useVotesStore: defineStore('votes', {
    state: () => ({ votes: [], currentVote: null, loading: false, error: null }),
    actions: {
      fetchVote: vi.fn().mockResolvedValue(null),
      saveVote: vi.fn().mockResolvedValue({}),
    },
  }),
}))

import VotationGenericView from '@/views/admin/votations/VotationGenericView.vue'

function createWrapper(routeOverrides = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)

  return mount(VotationGenericView, {
    global: {
      plugins: [pinia],
      mocks: {
        $route: {
          params: {},
          name: 'VotationGeneric',
          ...routeOverrides,
        },
        $router: {
          back: vi.fn(),
          push: vi.fn(),
        },
      },
    },
  })
}

describe('VotationGenericView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetAllActiveSessions.mockResolvedValue([])
    mockGetActiveSession.mockResolvedValue(null)
    mockGetOpenSessionForClass.mockResolvedValue([])
  })

  // ==================== CHARGEMENT SESSION ====================
  describe('chargement de la session', () => {
    it('affiche le spinner pendant le chargement', () => {
      mockGetAllActiveSessions.mockReturnValue(new Promise(() => {})) // never resolves
      const wrapper = createWrapper({ params: { pfpType: 'PFP1A' } })
      expect(wrapper.find('.pi-spinner').exists()).toBe(true)
    })

    it('affiche "Votation fermée" si aucune session active', async () => {
      mockGetAllActiveSessions.mockResolvedValue([])
      const wrapper = createWrapper({ params: { pfpType: 'PFP1A' } })
      await flushPromises()

      expect(wrapper.text()).toContain('Votation fermée')
    })

    it('charge la session depuis le paramètre de route :pfpType', async () => {
      const session = { id: '1', pfp_type: 'PFP1A', year: '2026', status: 'open', target_class: 'BA25' }
      mockGetAllActiveSessions.mockResolvedValue([session])

      const wrapper = createWrapper({ params: { pfpType: 'PFP1A' } })
      await flushPromises()

      expect(mockGetAllActiveSessions).toHaveBeenCalled()
      expect(wrapper.vm.targetPFP).toBe('PFP1A')
      expect(wrapper.vm.selectedYear).toBe('2026')
      expect(wrapper.vm.activeSession).toEqual(session)
    })

    it('détecte PFP1A pour la route legacy /votation', async () => {
      const session = { id: '1', pfp_type: 'PFP1A', year: '2026', status: 'open', target_class: 'BA25' }
      mockGetAllActiveSessions.mockResolvedValue([session])

      const wrapper = createWrapper({ params: {}, name: 'VotationView' })
      await flushPromises()

      expect(wrapper.vm.targetPFP).toBe('PFP1A')
    })

    it('détecte PFP1B pour la route legacy /votation_pfp1b', async () => {
      const session = { id: '2', pfp_type: 'PFP1B', year: '2026', status: 'open', target_class: 'BA25' }
      mockGetAllActiveSessions.mockResolvedValue([session])

      const wrapper = createWrapper({ params: {}, name: 'VotationViewPFP1B' })
      await flushPromises()

      expect(wrapper.vm.targetPFP).toBe('PFP1B')
    })

    it('gère les PFP en minuscules dans le paramètre de route', async () => {
      const session = { id: '1', pfp_type: 'PFP3', year: '2026', status: 'open', target_class: 'BA23' }
      mockGetAllActiveSessions.mockResolvedValue([session])

      const wrapper = createWrapper({ params: { pfpType: 'pfp3' } })
      await flushPromises()

      expect(wrapper.vm.targetPFP).toBe('PFP3')
    })
  })

  // ==================== AFFICHAGE ====================
  describe('affichage', () => {
    it('affiche le titre avec le bon PFP', async () => {
      const session = { id: '1', pfp_type: 'PFP2', year: '2026', status: 'open', target_class: 'BA24' }
      mockGetAllActiveSessions.mockResolvedValue([session])

      const wrapper = createWrapper({ params: { pfpType: 'PFP2' } })
      await flushPromises()

      expect(wrapper.text()).toContain('Votation PFP2')
      expect(wrapper.text()).toContain('2026')
    })

    it('affiche "Aucune place disponible" quand pas de places', async () => {
      const session = { id: '1', pfp_type: 'PFP1A', year: '2026', status: 'open', target_class: 'BA25' }
      mockGetAllActiveSessions.mockResolvedValue([session])

      const wrapper = createWrapper({ params: { pfpType: 'PFP1A' } })
      await flushPromises()

      expect(wrapper.text()).toContain('Aucune place disponible')
    })
  })

  // ==================== ÉTAT INTERNE ====================
  describe('état interne', () => {
    it('initialise selectedPlaces avec 5 null', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.selectedPlaces).toEqual([null, null, null, null, null])
    })

    it('initialise votedPlaces avec 5 null', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.votedPlaces).toEqual([null, null, null, null, null])
    })

    it('voteAlreadyCast est false au départ', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.voteAlreadyCast).toBe(false)
    })

    it('isSubmitting est false au départ', () => {
      const wrapper = createWrapper()
      expect(wrapper.vm.isSubmitting).toBe(false)
    })
  })

  // ==================== LOGIQUE MÉTIER ====================
  describe('logique métier', () => {
    it('isPlaceDisabled empêche de choisir la même place deux fois', async () => {
      const session = { id: '1', pfp_type: 'PFP1A', year: '2026', status: 'open', target_class: 'BA25' }
      mockGetAllActiveSessions.mockResolvedValue([session])

      const wrapper = createWrapper({ params: { pfpType: 'PFP1A' } })
      await flushPromises()

      const place = { PlaceId: 'p1', InstitutionId: 'i1', NomPlace: 'Place A' }
      wrapper.vm.selectedPlaces[0] = place

      expect(wrapper.vm.isPlaceDisabled(place, 1)).toBe(true)
      expect(wrapper.vm.isPlaceDisabled(place, 0)).toBe(false) // même index = pas disabled
    })

    it('isPlaceDisabled autorise des places différentes', async () => {
      const session = { id: '1', pfp_type: 'PFP1A', year: '2026', status: 'open', target_class: 'BA25' }
      mockGetAllActiveSessions.mockResolvedValue([session])

      const wrapper = createWrapper({ params: { pfpType: 'PFP1A' } })
      await flushPromises()

      const placeA = { PlaceId: 'p1', InstitutionId: 'i1', NomPlace: 'Place A' }
      const placeB = { PlaceId: 'p2', InstitutionId: 'i2', NomPlace: 'Place B' }
      wrapper.vm.selectedPlaces[0] = placeA

      expect(wrapper.vm.isPlaceDisabled(placeB, 1)).toBe(false)
    })

    it('getVoteCount retourne les valeurs par défaut si pas de stats', async () => {
      const session = { id: '1', pfp_type: 'PFP1A', year: '2026', status: 'open', target_class: 'BA25' }
      mockGetAllActiveSessions.mockResolvedValue([session])

      const wrapper = createWrapper({ params: { pfpType: 'PFP1A' } })
      await flushPromises()

      const result = wrapper.vm.getVoteCount({ PlaceId: 'unknown' })
      expect(result).toEqual({ top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 })
    })

    it('getVoteCount retourne les stats si elles existent', async () => {
      const session = { id: '1', pfp_type: 'PFP1A', year: '2026', status: 'open', target_class: 'BA25' }
      mockGetAllActiveSessions.mockResolvedValue([session])

      const wrapper = createWrapper({ params: { pfpType: 'PFP1A' } })
      await flushPromises()

      wrapper.vm.votesAggregation = {
        'p1': { top1: 3, top2: 1, top3: 0, top4: 0, top5: 0, total: 4 }
      }

      const result = wrapper.vm.getVoteCount({ PlaceId: 'p1' })
      expect(result.top1).toBe(3)
      expect(result.total).toBe(4)
    })

    it('selectedPlacesForRecap filtre les null et ajoute le rang', async () => {
      const wrapper = createWrapper()
      await flushPromises()

      const place = { PlaceId: 'p1', NomPlace: 'Place A', InstitutionName: 'Inst A' }
      wrapper.vm.selectedPlaces[0] = place
      wrapper.vm.selectedPlaces[2] = { PlaceId: 'p2', NomPlace: 'Place B', InstitutionName: 'Inst B' }

      const recap = wrapper.vm.selectedPlacesForRecap
      expect(recap).toHaveLength(2)
      expect(recap[0].rank).toBe(1)
      expect(recap[0].PlaceId).toBe('p1')
      expect(recap[1].rank).toBe(3)
      expect(recap[1].PlaceId).toBe('p2')
    })
  })

  // ==================== ENVOI DU VOTE ====================
  describe('envoi du vote', () => {
    it('refuse de voter si moins de 5 choix', async () => {
      const session = { id: '1', pfp_type: 'PFP1A', year: '2026', status: 'open', target_class: 'BA25' }
      mockGetAllActiveSessions.mockResolvedValue([session])

      const wrapper = createWrapper({ params: { pfpType: 'PFP1A' } })
      await flushPromises()

      wrapper.vm.selectedPlaces[0] = { PlaceId: 'p1', NomPlace: 'A', InstitutionName: 'I' }
      await wrapper.vm.sendVote()

      expect(wrapper.vm.dialogVisible).toBe(true)
      expect(wrapper.vm.dialogMessage).toContain('5 places')
    })

    it('refuse de voter si déjà en cours de soumission', async () => {
      const session = { id: '1', pfp_type: 'PFP1A', year: '2026', status: 'open', target_class: 'BA25' }
      mockGetAllActiveSessions.mockResolvedValue([session])

      const wrapper = createWrapper({ params: { pfpType: 'PFP1A' } })
      await flushPromises()

      wrapper.vm.isSubmitting = true
      await wrapper.vm.sendVote()

      // Pas de dialog car le return est immédiat
      expect(wrapper.vm.dialogVisible).toBe(false)
    })
  })

  // ==================== REMOVECHOICE ====================
  describe('removeChoice', () => {
    it('met à null le choix à l\'index donné', async () => {
      const wrapper = createWrapper()
      await flushPromises()

      wrapper.vm.selectedPlaces[2] = { PlaceId: 'p1', NomPlace: 'Test' }
      wrapper.vm.removeChoice(2)

      expect(wrapper.vm.selectedPlaces[2]).toBeNull()
    })
  })
})
