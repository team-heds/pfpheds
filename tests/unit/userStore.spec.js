import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// ── Mock Supabase ──────────────────────────────────────────────

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()
const mockSignUp = vi.fn()
const mockSignInWithPassword = vi.fn()
const mockSignOut = vi.fn()
const mockFrom = vi.fn()
const mockRemoveChannel = vi.fn()

vi.mock('@/supabase.js', () => ({
  supabase: {
    auth: {
      getSession: (...args) => mockGetSession(...args),
      onAuthStateChange: (...args) => mockOnAuthStateChange(...args),
      signUp: (...args) => mockSignUp(...args),
      signInWithPassword: (...args) => mockSignInWithPassword(...args),
      signOut: (...args) => mockSignOut(...args),
    },
    from: (...args) => mockFrom(...args),
    removeChannel: (...args) => mockRemoveChannel(...args),
  }
}))

import { useUserStore } from '@/stores/userStore'

// ── Tests ──────────────────────────────────────────────────────

describe('userStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useUserStore()
    vi.clearAllMocks()
  })

  // ── État initial ─────────────────────────────────────────────

  describe('état initial', () => {
    it('session est null', () => {
      expect(store.session).toBeNull()
    })

    it('user est null', () => {
      expect(store.user).toBeNull()
    })

    it('profile est null', () => {
      expect(store.profile).toBeNull()
    })

    it('authLoading est false', () => {
      expect(store.authLoading).toBe(false)
    })

    it('profileLoading est false', () => {
      expect(store.profileLoading).toBe(false)
    })
  })

  // ── Getters ──────────────────────────────────────────────────

  describe('getters', () => {
    it('isAuthenticated retourne false si user est null', () => {
      expect(store.isAuthenticated).toBe(false)
    })

    it('isAuthenticated retourne true si user existe', () => {
      store.user = { id: 'u1', email: 'test@test.ch' }
      expect(store.isAuthenticated).toBe(true)
    })
  })

  // ── init ─────────────────────────────────────────────────────

  describe('init', () => {
    it('charge la session existante', async () => {
      const session = { user: { id: 'u1', email: 'test@test.ch' } }
      mockGetSession.mockResolvedValue({ data: { session } })
      mockOnAuthStateChange.mockReturnValue({ data: { unsubscribe: vi.fn() } })

      // Mock fetchProfile
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: 'u1', display_name: 'Test' }, error: null })
      }
      mockFrom.mockReturnValue(chain)

      await store.init()

      expect(store.session).toEqual(session)
      expect(store.user).toEqual(session.user)
    })

    it('gère l\'absence de session', async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } })
      mockOnAuthStateChange.mockReturnValue({ data: { unsubscribe: vi.fn() } })

      await store.init()

      expect(store.session).toBeNull()
      expect(store.user).toBeNull()
    })
  })

  // ── signIn ───────────────────────────────────────────────────

  describe('signIn', () => {
    it('met à jour session et user après connexion', async () => {
      const session = { access_token: 'tok' }
      const user = { id: 'u1', email: 'test@test.ch' }

      mockSignInWithPassword.mockResolvedValue({
        data: { session, user },
        error: null
      })

      // Mock fetchProfile
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: { user_id: 'u1' }, error: null })
      }
      mockFrom.mockReturnValue(chain)

      await store.signIn('test@test.ch', 'password')

      expect(store.session).toEqual(session)
      expect(store.user).toEqual(user)
      expect(store.authLoading).toBe(false)
    })

    it('propage l\'erreur d\'authentification', async () => {
      mockSignInWithPassword.mockResolvedValue({
        data: {},
        error: { message: 'Invalid credentials' }
      })

      await expect(store.signIn('bad@test.ch', 'wrong')).rejects.toEqual({ message: 'Invalid credentials' })
      expect(store.authLoading).toBe(false)
    })
  })

  // ── signOut ──────────────────────────────────────────────────

  describe('signOut', () => {
    it('réinitialise session, user et profile', async () => {
      store.session = { access_token: 'tok' }
      store.user = { id: 'u1' }
      store.profile = { display_name: 'Test' }

      mockSignOut.mockResolvedValue({ error: null })

      await store.signOut()

      expect(store.session).toBeNull()
      expect(store.user).toBeNull()
      expect(store.profile).toBeNull()
      expect(store.authLoading).toBe(false)
    })

    it('propage l\'erreur de déconnexion', async () => {
      mockSignOut.mockResolvedValue({ error: { message: 'Signout failed' } })

      await expect(store.signOut()).rejects.toEqual({ message: 'Signout failed' })
      expect(store.authLoading).toBe(false)
    })
  })

  // ── signUp ───────────────────────────────────────────────────

  describe('signUp', () => {
    it('appelle supabase.auth.signUp', async () => {
      mockSignUp.mockResolvedValue({ error: null })

      await store.signUp('new@test.ch', 'password123')

      expect(mockSignUp).toHaveBeenCalledWith({ email: 'new@test.ch', password: 'password123' })
      expect(store.authLoading).toBe(false)
    })

    it('propage l\'erreur d\'inscription', async () => {
      mockSignUp.mockResolvedValue({ error: { message: 'Email taken' } })

      await expect(store.signUp('taken@test.ch', 'pass')).rejects.toEqual({ message: 'Email taken' })
      expect(store.authLoading).toBe(false)
    })
  })

  // ── fetchProfile ─────────────────────────────────────────────

  describe('fetchProfile', () => {
    it('charge le profil si user connecté', async () => {
      store.user = { id: 'u1' }

      const profileData = { user_id: 'u1', display_name: 'Jean', roles: ['admin'] }
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: profileData, error: null })
      }
      mockFrom.mockReturnValue(chain)

      await store.fetchProfile()

      expect(store.profile).toEqual(profileData)
      expect(store.profileLoading).toBe(false)
    })

    it('met profile à null si user non connecté', async () => {
      store.user = null
      store.profile = { old: 'data' }

      await store.fetchProfile()

      expect(store.profile).toBeNull()
    })

    it('met profile à null si aucun profil trouvé', async () => {
      store.user = { id: 'u1' }

      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null })
      }
      mockFrom.mockReturnValue(chain)

      await store.fetchProfile()

      expect(store.profile).toBeNull()
    })
  })

  // ── upsertProfile ───────────────────────────────────────────

  describe('upsertProfile', () => {
    it('met à jour le profil dans le store', async () => {
      store.user = { id: 'u1' }

      const updatedProfile = { user_id: 'u1', display_name: 'Nouveau Nom' }
      const chain = {
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: updatedProfile, error: null })
      }
      mockFrom.mockReturnValue({
        upsert: vi.fn(() => chain)
      })

      const result = await store.upsertProfile({ display_name: 'Nouveau Nom' })

      expect(store.profile).toEqual(updatedProfile)
      expect(result).toEqual(updatedProfile)
    })

    it('lance une erreur si non connecté', async () => {
      store.user = null

      await expect(store.upsertProfile({ display_name: 'Test' }))
        .rejects.toThrow('Non connecté')
    })
  })

  // ── dispose ──────────────────────────────────────────────────

  describe('dispose', () => {
    it('appelle unsubscribe sur authSub', () => {
      const unsubscribe = vi.fn()
      store.authSub = { unsubscribe }

      store.dispose()

      expect(unsubscribe).toHaveBeenCalled()
    })

    it('ne plante pas si authSub est null', () => {
      store.authSub = null
      expect(() => store.dispose()).not.toThrow()
    })
  })

  // ── unsubscribeProfile ───────────────────────────────────────

  describe('unsubscribeProfile', () => {
    it('appelle removeChannel et reset profileChannel', () => {
      const channel = { id: 'ch1' }
      store.profileChannel = channel

      store.unsubscribeProfile()

      expect(mockRemoveChannel).toHaveBeenCalledWith(channel)
      expect(store.profileChannel).toBeNull()
    })

    it('ne fait rien si profileChannel est null', () => {
      store.profileChannel = null
      store.unsubscribeProfile()
      expect(mockRemoveChannel).not.toHaveBeenCalled()
    })
  })
})
