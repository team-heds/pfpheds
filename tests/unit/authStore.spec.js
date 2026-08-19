import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// ── Mock Firebase ──────────────────────────────────────────────
const mockFirebaseSignIn = vi.fn()
const mockFirebaseSignUp = vi.fn()
const mockFirebaseSendReset = vi.fn()
const mockFirebaseSignOut = vi.fn()
let firebaseAuthCallback = null

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, cb) => {
    firebaseAuthCallback = cb
    return vi.fn() // unsubscribe
  }),
  signInWithEmailAndPassword: (...args) => mockFirebaseSignIn(...args),
  createUserWithEmailAndPassword: (...args) => mockFirebaseSignUp(...args),
  sendPasswordResetEmail: (...args) => mockFirebaseSendReset(...args),
}))

vi.mock('@/firebase', () => ({
  isFirebaseEnabled: true,
  auth: {
    signOut: () => mockFirebaseSignOut(),
  }
}))

// ── Mock Supabase ──────────────────────────────────────────────
const mockSupabaseSignUp = vi.fn()
const mockSupabaseSignIn = vi.fn()
const mockSupabaseSignOut = vi.fn()
const mockSupabaseGetUser = vi.fn()
const mockSupabaseGetSession = vi.fn()
const mockSupabaseRefreshSession = vi.fn()
let supabaseAuthCallback = null

vi.mock('@/supabase', () => ({
  supabase: {
    auth: {
      signUp: (...args) => mockSupabaseSignUp(...args),
      signInWithPassword: (...args) => mockSupabaseSignIn(...args),
      signOut: () => mockSupabaseSignOut(),
      getUser: () => mockSupabaseGetUser(),
      getSession: () => mockSupabaseGetSession(),
      refreshSession: () => mockSupabaseRefreshSession(),
      onAuthStateChange: vi.fn((cb) => {
        supabaseAuthCallback = cb
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
    }
  }
}))

const mockPasswordRecoveryRequest = vi.fn()
vi.mock('@/service/passwordRecoveryRequestService', () => ({
  requestPasswordRecovery: (...args) => mockPasswordRecoveryRequest(...args),
}))

const { useAuthStore } = await import('@/stores/authStore')

describe('authStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useAuthStore()
    vi.clearAllMocks()
    mockSupabaseGetSession.mockResolvedValue({ data: { session: null }, error: null })
    mockSupabaseGetUser.mockResolvedValue({ data: { user: null }, error: null })
    mockSupabaseRefreshSession.mockResolvedValue({ data: { session: null }, error: null })
  })

  // ─── État initial ───
  describe('état initial', () => {
    it('user est null', () => {
      expect(store.user).toBeNull()
    })

    it('session est null', () => {
      expect(store.session).toBeNull()
    })

    it('loading est false', () => {
      expect(store.loading).toBe(false)
    })

    it('error est null', () => {
      expect(store.error).toBeNull()
    })

    it('authProvider est null', () => {
      expect(store.authProvider).toBeNull()
    })
  })

  // ─── Getters ───
  describe('getters', () => {
    it('isLoggedIn retourne false quand pas d\'utilisateur', () => {
      expect(store.isLoggedIn).toBe(false)
    })

    it('isFirebaseUser retourne false par défaut', () => {
      expect(store.isFirebaseUser).toBe(false)
    })

    it('isSupabaseUser retourne false par défaut', () => {
      expect(store.isSupabaseUser).toBe(false)
    })

    it('ne considère jamais une session Firebase comme une session applicative', () => {
      store.user = { uid: 'legacy-firebase-user' }
      store.authProvider = 'firebase'

      expect(store.isFirebaseUser).toBe(false)
      expect(store.isSupabaseUser).toBe(false)
    })
  })

  describe('restauration de session', () => {
    it('restaure exclusivement la session Supabase', async () => {
      const user = { id: 'supabase-user', email: 'admin@hevs.ch' }
      const session = { user, access_token: 'supabase-token', expires_at: 4_102_444_800 }
      mockSupabaseGetUser.mockResolvedValue({ data: { user }, error: null })
      mockSupabaseGetSession.mockResolvedValue({ data: { session }, error: null })

      await store.checkAuthState()

      expect(store.user).toEqual(user)
      expect(store.session).toEqual(session)
      expect(store.authProvider).toBe('supabase')
    })

    it('déduplique les vérifications concurrentes', async () => {
      const user = { id: 'supabase-user' }
      const session = { user, access_token: 'token', expires_at: 4_102_444_800 }
      mockSupabaseGetSession.mockResolvedValue({ data: { session }, error: null })
      mockSupabaseGetUser.mockResolvedValue({ data: { user }, error: null })

      await Promise.all([store.checkAuthState(), store.checkAuthState()])

      expect(mockSupabaseGetSession).toHaveBeenCalledOnce()
      expect(mockSupabaseGetUser).toHaveBeenCalledOnce()
    })

    it('préserve la session connue lors d’une panne réseau transitoire', async () => {
      const previousSession = { user: { id: 'u1' }, access_token: 'known-token' }
      store.session = previousSession
      store.user = previousSession.user
      store.authProvider = 'supabase'
      mockSupabaseGetSession.mockResolvedValue({
        data: { session: null },
        error: new Error('Failed to fetch'),
      })

      await expect(store.checkAuthState()).rejects.toThrow('Failed to fetch')

      expect(store.session).toEqual(previousSession)
      expect(store.user).toEqual(previousSession.user)
    })

    it('sérialise les rafraîchissements de session', async () => {
      const refreshedSession = {
        user: { id: 'u1' },
        access_token: 'new-token',
        expires_at: 4_102_444_800,
      }
      mockSupabaseRefreshSession.mockResolvedValue({
        data: { session: refreshedSession },
        error: null,
      })

      const [first, second] = await Promise.all([
        store.refreshSessionSingleFlight(),
        store.refreshSessionSingleFlight(),
      ])

      expect(mockSupabaseRefreshSession).toHaveBeenCalledOnce()
      expect(first).toEqual(refreshedSession)
      expect(second).toEqual(refreshedSession)
    })

    it('garde le callback auth synchrone', () => {
      const nextSession = { user: { id: 'u1' }, access_token: 'token' }

      const callbackResult = supabaseAuthCallback('TOKEN_REFRESHED', nextSession)

      expect(callbackResult).toBeUndefined()
      expect(store.session).toEqual(nextSession)
    })
  })

  // ─── Supabase signUp ───
  describe('signUpSupabase', () => {
    it('crée un compte et met à jour le state', async () => {
      const mockUser = { id: 'u1', email: 'test@hevs.ch' }
      const mockSession = { access_token: 'tok' }
      mockSupabaseSignUp.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      const result = await store.signUpSupabase({ email: 'test@hevs.ch', password: 'pass' })

      expect(store.user).toEqual(mockUser)
      expect(store.session).toEqual(mockSession)
      expect(store.authProvider).toBe('supabase')
      expect(store.loading).toBe(false)
      expect(result.user).toEqual(mockUser)
    })

    it('gère les erreurs', async () => {
      mockSupabaseSignUp.mockResolvedValue({
        data: {},
        error: { message: 'Email already exists' }
      })

      await expect(store.signUpSupabase({ email: 'x', password: 'y' })).rejects.toThrow()
      expect(store.error).toBe('Email already exists')
      expect(store.loading).toBe(false)
    })
  })

  // ─── Supabase signIn ───
  describe('signInSupabase', () => {
    it('connecte et met à jour le state', async () => {
      const mockUser = { id: 'u1', email: 'test@hevs.ch' }
      const mockSession = { access_token: 'tok' }
      mockSupabaseSignIn.mockResolvedValue({
        data: { user: mockUser, session: mockSession },
        error: null
      })

      await store.signInSupabase({ email: 'test@hevs.ch', password: 'pass' })

      expect(store.user).toEqual(mockUser)
      expect(store.session).toEqual(mockSession)
      expect(store.authProvider).toBe('supabase')
    })

    it('gère les erreurs d\'authentification', async () => {
      mockSupabaseSignIn.mockResolvedValue({
        data: {},
        error: { message: 'Invalid login credentials' }
      })

      await expect(store.signInSupabase({ email: 'x', password: 'y' })).rejects.toThrow()
      expect(store.error).toBe('Invalid login credentials')
    })
  })

  // ─── Supabase resetPassword ───
  describe('resetPasswordSupabase', () => {
    it.each([
      'etudiant.connu@hevs.ch',
      'adresse.inconnue@example.invalid'
    ])('ne révèle pas côté client si %s existe', async (email) => {
      mockPasswordRecoveryRequest.mockResolvedValue(undefined)

      await store.resetPasswordSupabase(email)

      expect(mockPasswordRecoveryRequest).toHaveBeenCalledWith(email)
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('gère les erreurs', async () => {
      mockPasswordRecoveryRequest.mockRejectedValue(
        Object.assign(new Error('unavailable'), {
          code: 'password_recovery_unavailable'
        })
      )

      await expect(store.resetPasswordSupabase('x@y.z')).rejects.toThrow()
      expect(store.error).toBe('password_recovery_unavailable')
    })
  })

  // ─── Firebase signUp ───
  describe('signUpFirebase', () => {
    it('crée un compte Firebase', async () => {
      const mockUser = { uid: 'fb1', email: 'test@hevs.ch' }
      mockFirebaseSignUp.mockResolvedValue({ user: mockUser })

      const result = await store.signUpFirebase({ email: 'test@hevs.ch', password: 'pass' })

      expect(store.user).toEqual(mockUser)
      expect(store.authProvider).toBe('firebase')
      expect(store.session).toBeNull()
      expect(result.user).toEqual(mockUser)
    })

    it('gère les erreurs Firebase', async () => {
      mockFirebaseSignUp.mockRejectedValue(new Error('auth/email-already-in-use'))

      await expect(store.signUpFirebase({ email: 'x', password: 'y' })).rejects.toThrow()
      expect(store.error).toBe('auth/email-already-in-use')
    })
  })

  // ─── Firebase signIn ───
  describe('signInFirebase', () => {
    it('connecte via Firebase', async () => {
      const mockUser = { uid: 'fb1', email: 'test@hevs.ch' }
      mockFirebaseSignIn.mockResolvedValue({ user: mockUser })

      await store.signInFirebase({ email: 'test@hevs.ch', password: 'pass' })

      expect(store.user).toEqual(mockUser)
      expect(store.authProvider).toBe('firebase')
    })

    it('gère les erreurs', async () => {
      mockFirebaseSignIn.mockRejectedValue(new Error('auth/wrong-password'))

      await expect(store.signInFirebase({ email: 'x', password: 'y' })).rejects.toThrow()
      expect(store.error).toBe('auth/wrong-password')
    })
  })

  // ─── Firebase resetPassword ───
  describe('resetPasswordFirebase', () => {
    it('envoie un email de reset Firebase', async () => {
      mockFirebaseSendReset.mockResolvedValue()

      await store.resetPasswordFirebase('test@hevs.ch')

      expect(mockFirebaseSendReset).toHaveBeenCalled()
      expect(store.loading).toBe(false)
    })

    it('gère les erreurs', async () => {
      mockFirebaseSendReset.mockRejectedValue(new Error('auth/user-not-found'))

      await expect(store.resetPasswordFirebase('x@y.z')).rejects.toThrow()
      expect(store.error).toBe('auth/user-not-found')
    })
  })

  // ─── signOut ───
  describe('signOut', () => {
    it('déconnecte Supabase et nettoie le state', async () => {
      // Simuler un utilisateur connecté via Supabase
      store.user = { id: 'u1' }
      store.authProvider = 'supabase'
      store.session = { access_token: 'tok' }
      mockSupabaseSignOut.mockResolvedValue({ error: null })

      await store.signOut()

      expect(store.user).toBeNull()
      expect(store.session).toBeNull()
      expect(store.authProvider).toBeNull()
      expect(store.loading).toBe(false)
    })

    it('déconnecte Firebase et nettoie le state', async () => {
      store.user = { uid: 'fb1' }
      store.authProvider = 'firebase'
      mockFirebaseSignOut.mockResolvedValue()

      await store.signOut()

      expect(store.user).toBeNull()
      expect(store.authProvider).toBeNull()
    })

    it('gère les erreurs de déconnexion', async () => {
      store.user = { id: 'u1' }
      store.authProvider = 'supabase'
      mockSupabaseSignOut.mockResolvedValue({ error: { message: 'Network error' } })

      await store.signOut()

      // L'erreur est stockée mais le state est quand même nettoyé
      expect(store.loading).toBe(false)
    })
  })

  // ─── Loading state ───
  describe('loading state', () => {
    it('loading est true pendant signInSupabase', async () => {
      let resolvePromise
      mockSupabaseSignIn.mockReturnValue(
        new Promise(resolve => { resolvePromise = resolve })
      )

      const promise = store.signInSupabase({ email: 'a', password: 'b' })
      expect(store.loading).toBe(true)

      resolvePromise({ data: { user: {}, session: {} }, error: null })
      await promise

      expect(store.loading).toBe(false)
    })

    it('loading est false après une erreur', async () => {
      mockSupabaseSignIn.mockResolvedValue({
        data: {},
        error: { message: 'fail' }
      })

      try { await store.signInSupabase({ email: 'a', password: 'b' }) } catch {}

      expect(store.loading).toBe(false)
    })
  })

  // ─── Session monitoring ───
  describe('session monitoring', () => {
    it('startSessionMonitoring crée un interval', () => {
      vi.useFakeTimers()
      store.startSessionMonitoring()
      // L'interval est créé (pas d'erreur)
      store.stopSessionMonitoring()
      vi.useRealTimers()
    })

    it('stopSessionMonitoring nettoie l\'interval', () => {
      vi.useFakeTimers()
      store.startSessionMonitoring()
      store.stopSessionMonitoring()
      // Pas d'erreur, interval nettoyé
      vi.useRealTimers()
    })
  })
})
