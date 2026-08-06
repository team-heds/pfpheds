import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createPasswordRecoveryService,
  PASSWORD_RECOVERY_ERROR_CODES,
} from '@/service/passwordRecoveryService'

function createAuth(overrides = {}) {
  return {
    setSession: vi.fn().mockResolvedValue({ error: null }),
    exchangeCodeForSession: vi.fn().mockResolvedValue({ error: null }),
    verifyOtp: vi.fn().mockResolvedValue({ error: null }),
    updateUser: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    ...overrides,
  }
}

function createNavigation(url = 'https://hedsvs.ch/reset-password') {
  const parsed = new URL(url)
  return {
    getLocation: vi.fn(() => parsed),
    clearSensitiveUrl: vi.fn(),
  }
}

describe('passwordRecoveryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
      'https://hedsvs.ch/reset-password#access_token=access&refresh_token=refresh&type=recovery',
    )
    const recovery = createPasswordRecoveryService(auth, navigation)

    await expect(recovery.resolveFromLocation()).resolves.toEqual({ status: 'valid' })
    expect(auth.setSession).toHaveBeenCalledWith({
      access_token: 'access',
      refresh_token: 'refresh',
    })
  })

  it('refuse des tokens implicites qui ne sont pas marqués comme récupération', async () => {
    const auth = createAuth()
    const navigation = createNavigation(
      'https://hedsvs.ch/reset-password#access_token=access&refresh_token=refresh&type=signup',
    )
    const recovery = createPasswordRecoveryService(auth, navigation)

    await expect(recovery.resolveFromLocation()).resolves.toEqual({
      status: 'invalid',
      reason: 'error',
    })
    expect(auth.setSession).not.toHaveBeenCalled()
    expect(navigation.clearSensitiveUrl).toHaveBeenCalledOnce()
  })

  it('refuse un lien expiré avec un résultat contrôlé', async () => {
    const navigation = createNavigation(
      'https://hedsvs.ch/reset-password?error=access_denied&error_code=otp_expired',
    )
    const recovery = createPasswordRecoveryService(createAuth(), navigation)

    await expect(recovery.resolveFromLocation()).resolves.toEqual({
      status: 'invalid',
      reason: 'expired',
    })
    expect(navigation.clearSensitiveUrl).toHaveBeenCalledOnce()
  })

  it('refuse une session ordinaire sans preuve de récupération', async () => {
    const auth = createAuth({ getSession: vi.fn() })
    const recovery = createPasswordRecoveryService(auth, createNavigation())

    await expect(recovery.resolveFromLocation()).resolves.toEqual({
      status: 'invalid',
      reason: 'missing',
    })
    expect(auth.getSession).not.toHaveBeenCalled()
  })

  it('refuse un code déjà consommé retourné comme invalide par Supabase', async () => {
    const auth = createAuth({
      exchangeCodeForSession: vi.fn().mockResolvedValue({
        error: { code: 'otp_expired', message: 'Token has expired or is invalid' },
      }),
    })
    const recovery = createPasswordRecoveryService(
      auth,
      createNavigation('https://hedsvs.ch/reset-password?code=consumed-code'),
    )

    await expect(recovery.resolveFromLocation()).resolves.toEqual({
      status: 'invalid',
      reason: 'expired',
    })
  })

  it('autorise la récupération par OTP côté serveur', async () => {
    const auth = createAuth()
    const recovery = createPasswordRecoveryService(auth, createNavigation())

    await recovery.authorizeWithOtp('student@example.ch', '123456')

    expect(auth.verifyOtp).toHaveBeenCalledWith({
      email: 'student@example.ch',
      token: '123456',
      type: 'recovery',
    })
  })

  it('refuse un changement sans preuve de récupération', async () => {
    const auth = createAuth()
    const recovery = createPasswordRecoveryService(auth, createNavigation())

    await expect(recovery.updatePassword('Nouveau!2026')).rejects.toMatchObject({
      code: PASSWORD_RECOVERY_ERROR_CODES.INVALID_CONTEXT,
    })
    expect(auth.updateUser).not.toHaveBeenCalled()
  })

  it('consomme le contexte après un changement et ferme la session globale', async () => {
    const auth = createAuth()
    const recovery = createPasswordRecoveryService(auth, createNavigation())
    await recovery.authorizeWithOtp('student@example.ch', '123456')

    await recovery.updatePassword('Nouveau!2026')

    expect(auth.updateUser).toHaveBeenCalledOnce()
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'global' })
    await expect(recovery.updatePassword('Encore!2027')).rejects.toMatchObject({
      code: PASSWORD_RECOVERY_ERROR_CODES.ALREADY_CONSUMED,
    })
    expect(auth.updateUser).toHaveBeenCalledOnce()
  })

  it('supprime au moins la session locale si la révocation globale échoue', async () => {
    const auth = createAuth({
      signOut: vi
        .fn()
        .mockResolvedValueOnce({ error: { message: 'network error' } })
        .mockResolvedValueOnce({ error: null }),
    })
    const recovery = createPasswordRecoveryService(auth, createNavigation())
    await recovery.authorizeWithOtp('student@example.ch', '123456')

    await recovery.updatePassword('Nouveau!2026')

    expect(auth.signOut).toHaveBeenNthCalledWith(1, { scope: 'global' })
    expect(auth.signOut).toHaveBeenNthCalledWith(2, { scope: 'local' })
  })

  it('reste consommé si les deux déconnexions échouent après le changement', async () => {
    const auth = createAuth({
      signOut: vi.fn().mockRejectedValue(new Error('storage unavailable')),
    })
    const recovery = createPasswordRecoveryService(auth, createNavigation())
    await recovery.authorizeWithOtp('student@example.ch', '123456')

    await expect(recovery.updatePassword('Nouveau!2026')).resolves.toBeUndefined()
    await expect(recovery.updatePassword('Encore!2027')).rejects.toMatchObject({
      code: PASSWORD_RECOVERY_ERROR_CODES.ALREADY_CONSUMED,
    })
  })

  it('ne consomme pas le contexte quand la mise à jour serveur échoue', async () => {
    const auth = createAuth({
      updateUser: vi
        .fn()
        .mockResolvedValueOnce({ error: { message: 'temporary failure' } })
        .mockResolvedValueOnce({ error: null }),
    })
    const recovery = createPasswordRecoveryService(auth, createNavigation())
    await recovery.authorizeWithOtp('student@example.ch', '123456')

    await expect(recovery.updatePassword('Nouveau!2026')).rejects.toMatchObject({
      message: 'temporary failure',
    })
    await expect(recovery.updatePassword('Nouveau!2026')).resolves.toBeUndefined()
    expect(auth.updateUser).toHaveBeenCalledTimes(2)
  })
})
