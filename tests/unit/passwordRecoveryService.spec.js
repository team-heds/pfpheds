import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildPasswordRecoveryRedirectUrl,
  createPasswordRecoveryService,
  getPasswordRecoveryCallbackTarget,
  PASSWORD_RECOVERY_ERROR_CODES
} from '@/service/passwordRecoveryService'

function createAuth(overrides = {}) {
  return {
    setSession: vi.fn().mockResolvedValue({ error: null }),
    exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
    verifyOtp: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    ...overrides
  }
}

function createNavigation(url = 'https://hedsvs.ch/reset-password') {
  const parsed = new URL(url)
  return {
    getLocation: vi.fn(() => parsed),
    clearSensitiveUrl: vi.fn()
  }
}

function createInitialAccessTracker(overrides = {}) {
  return {
    markUsed: vi.fn().mockResolvedValue({ tracked: true }),
    ...overrides
  }
}

describe('passwordRecoveryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('marque explicitement les nouveaux liens comme récupération', () => {
    expect(buildPasswordRecoveryRedirectUrl('https://hedsvs.ch')).toBe(
      'https://hedsvs.ch/reset-password?flow=recovery'
    )
  })

  it('récupère un ancien callback implicite arrivé sur la page d’accueil', () => {
    const location = new URL(
      'https://hedsvs.ch/home#access_token=access&refresh_token=refresh&type=recovery'
    )

    expect(getPasswordRecoveryCallbackTarget(location)).toBe(
      '/reset-password#access_token=access&refresh_token=refresh&type=recovery'
    )
  })

  it('récupère un callback PKCE marqué arrivé sur la mauvaise route', () => {
    const location = new URL('https://hedsvs.ch/home?flow=recovery&code=secret-code')

    expect(getPasswordRecoveryCallbackTarget(location)).toBe(
      '/reset-password?flow=recovery&code=secret-code'
    )
  })

  it('préserve le marqueur de premier accès arrivé sur la mauvaise route', () => {
    const location = new URL('https://hedsvs.ch/home?flow=initial-access&code=initial-access-code')

    expect(getPasswordRecoveryCallbackTarget(location)).toBe(
      '/reset-password?flow=initial-access&code=initial-access-code'
    )
  })

  it('ne détourne jamais une connexion ordinaire vers le changement de mot de passe', () => {
    expect(getPasswordRecoveryCallbackTarget(new URL('https://hedsvs.ch/home'))).toBeNull()
    expect(
      getPasswordRecoveryCallbackTarget(new URL('https://hedsvs.ch/home#type=signup'))
    ).toBeNull()
  })

  it('échange un code PKCE côté serveur et nettoie l’URL', async () => {
    const auth = createAuth()
    const navigation = createNavigation('https://hedsvs.ch/reset-password?code=secret-code')
    const recovery = createPasswordRecoveryService(auth, navigation)

    await expect(recovery.resolveFromLocation()).resolves.toEqual({ status: 'valid' })
    expect(auth.exchangeCodeForSession).toHaveBeenCalledOnce()
    expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('secret-code')
    expect(navigation.clearSensitiveUrl).toHaveBeenCalledOnce()
  })

  it('accepte uniquement un callback implicite marqué comme récupération', async () => {
    const auth = createAuth()
    const navigation = createNavigation(
      'https://hedsvs.ch/reset-password#access_token=access&refresh_token=refresh&type=recovery'
    )
    const recovery = createPasswordRecoveryService(auth, navigation)

    await expect(recovery.resolveFromLocation()).resolves.toEqual({ status: 'valid' })
    expect(auth.setSession).toHaveBeenCalledWith({
      access_token: 'access',
      refresh_token: 'refresh'
    })
  })

  it('refuse des tokens implicites qui ne sont pas marqués comme récupération', async () => {
    const auth = createAuth()
    const navigation = createNavigation(
      'https://hedsvs.ch/reset-password#access_token=access&refresh_token=refresh&type=signup'
    )
    const recovery = createPasswordRecoveryService(auth, navigation)

    await expect(recovery.resolveFromLocation()).resolves.toEqual({
      status: 'invalid',
      reason: 'error'
    })
    expect(auth.setSession).not.toHaveBeenCalled()
    expect(navigation.clearSensitiveUrl).toHaveBeenCalledOnce()
  })

  it('refuse un lien expiré avec un résultat contrôlé', async () => {
    const navigation = createNavigation(
      'https://hedsvs.ch/reset-password?error=access_denied&error_code=otp_expired'
    )
    const recovery = createPasswordRecoveryService(createAuth(), navigation)

    await expect(recovery.resolveFromLocation()).resolves.toEqual({
      status: 'invalid',
      reason: 'expired'
    })
    expect(navigation.clearSensitiveUrl).toHaveBeenCalledOnce()
  })

  it('refuse une session ordinaire sans preuve de récupération', async () => {
    const auth = createAuth({ getSession: vi.fn() })
    const recovery = createPasswordRecoveryService(auth, createNavigation())

    await expect(recovery.resolveFromLocation()).resolves.toEqual({
      status: 'invalid',
      reason: 'missing'
    })
    expect(auth.getSession).not.toHaveBeenCalled()
  })

  it('refuse un code déjà consommé retourné comme invalide par Supabase', async () => {
    const auth = createAuth({
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        error: { code: 'otp_expired', message: 'Token has expired or is invalid' }
      })
    })
    const recovery = createPasswordRecoveryService(
      auth,
      createNavigation('https://hedsvs.ch/reset-password?code=consumed-code')
    )

    await expect(recovery.resolveFromLocation()).resolves.toEqual({
      status: 'invalid',
      reason: 'expired'
    })
  })

  it('autorise la récupération par OTP côté serveur', async () => {
    const auth = createAuth()
    const recovery = createPasswordRecoveryService(auth, createNavigation())

    await recovery.authorizeWithOtp('student@example.ch', '123456')

    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: 'student@example.ch',
      token: '123456',
      type: 'recovery'
    })
  })

  it('refuse un changement sans preuve de récupération', async () => {
    const auth = createAuth()
    const recovery = createPasswordRecoveryService(auth, createNavigation())

    await expect(recovery.updatePassword('Nouveau!2026')).rejects.toMatchObject({
      code: PASSWORD_RECOVERY_ERROR_CODES.INVALID_CONTEXT
    })
    expect(auth.updateUser).not.toHaveBeenCalled()
  })

  it('consomme le contexte après un changement et ferme la session globale', async () => {
    const auth = createAuth()
    const tracker = createInitialAccessTracker()
    const recovery = createPasswordRecoveryService(auth, createNavigation(), tracker)
    await recovery.authorizeWithOtp('student@example.ch', '123456')

    await recovery.updatePassword('Nouveau!2026')

    expect(auth.updateUser).toHaveBeenCalledOnce()
    expect(tracker.markUsed).not.toHaveBeenCalled()
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'global' })
    await expect(recovery.updatePassword('Encore!2027')).rejects.toMatchObject({
      code: PASSWORD_RECOVERY_ERROR_CODES.ALREADY_CONSUMED
    })
    expect(auth.updateUser).toHaveBeenCalledOnce()
  })

  it('marque utilisé uniquement un lien explicitement émis comme premier accès', async () => {
    const auth = createAuth()
    const tracker = createInitialAccessTracker()
    const recovery = createPasswordRecoveryService(
      auth,
      createNavigation(
        'https://hedsvs.ch/reset-password?flow=initial-access&code=initial-access-code'
      ),
      tracker
    )
    await recovery.resolveFromLocation()

    await recovery.updatePassword('Nouveau!2026')

    expect(tracker.markUsed).toHaveBeenCalledOnce()
    expect(tracker.markUsed.mock.invocationCallOrder[0]).toBeLessThan(
      auth.signOut.mock.invocationCallOrder[0]
    )
  })

  it('ne bloque pas le nouveau mot de passe si le suivi du premier accès échoue', async () => {
    const auth = createAuth()
    const tracker = createInitialAccessTracker({
      markUsed: vi.fn().mockRejectedValue(new Error('tracking unavailable'))
    })
    const recovery = createPasswordRecoveryService(
      auth,
      createNavigation(
        'https://hedsvs.ch/reset-password?flow=initial-access&code=initial-access-code'
      ),
      tracker
    )
    await recovery.resolveFromLocation()

    await expect(recovery.updatePassword('Nouveau!2026')).resolves.toBeUndefined()
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'global' })
  })

  it('supprime au moins la session locale si la révocation globale échoue', async () => {
    const auth = createAuth({
      signOut: vi
        .fn()
        .mockResolvedValueOnce({ error: { message: 'network error' } })
        .mockResolvedValueOnce({ error: null })
    })
    const recovery = createPasswordRecoveryService(auth, createNavigation())
    await recovery.authorizeWithOtp('student@example.ch', '123456')

    await recovery.updatePassword('Nouveau!2026')

    expect(auth.signOut).toHaveBeenNthCalledWith(1, { scope: 'global' })
    expect(auth.signOut).toHaveBeenNthCalledWith(2, { scope: 'local' })
  })

  it('reste consommé si les deux déconnexions échouent après le changement', async () => {
    const auth = createAuth({
      signOut: vi.fn().mockRejectedValue(new Error('storage unavailable'))
    })
    const recovery = createPasswordRecoveryService(auth, createNavigation())
    await recovery.authorizeWithOtp('student@example.ch', '123456')

    await expect(recovery.updatePassword('Nouveau!2026')).resolves.toBeUndefined()
    await expect(recovery.updatePassword('Encore!2027')).rejects.toMatchObject({
      code: PASSWORD_RECOVERY_ERROR_CODES.ALREADY_CONSUMED
    })
  })

  it('ne consomme pas le contexte quand la mise à jour serveur échoue', async () => {
    const auth = createAuth({
      updateUser: vi
        .fn()
        .mockResolvedValueOnce({ error: { message: 'temporary failure' } })
        .mockResolvedValueOnce({ error: null })
    })
    const recovery = createPasswordRecoveryService(auth, createNavigation())
    await recovery.authorizeWithOtp('student@example.ch', '123456')

    await expect(recovery.updatePassword('Nouveau!2026')).rejects.toMatchObject({
      message: 'temporary failure'
    })
    await expect(recovery.updatePassword('Nouveau!2026')).resolves.toBeUndefined()
    expect(auth.updateUser).toHaveBeenCalledTimes(2)
  })
})
