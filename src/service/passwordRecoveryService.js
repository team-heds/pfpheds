export const PASSWORD_RECOVERY_ERROR_CODES = Object.freeze({
  INVALID_CONTEXT: 'recovery_context_invalid',
  ALREADY_CONSUMED: 'recovery_context_consumed',
  UPDATE_IN_PROGRESS: 'recovery_update_in_progress',
})

const PASSWORD_RECOVERY_PATHS = new Set(['/reset-password', '/new-password'])

export function buildPasswordRecoveryRedirectUrl(origin) {
  const redirectUrl = new URL('/reset-password', origin)
  redirectUrl.searchParams.set('flow', 'recovery')
  return redirectUrl.toString()
}

export function getPasswordRecoveryCallbackTarget(location) {
  if (PASSWORD_RECOVERY_PATHS.has(location.pathname)) return null

  const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''))
  const searchParams = new URLSearchParams(location.search)
  const isRecoveryCallback =
    hashParams.get('type') === 'recovery' || searchParams.get('flow') === 'recovery'

  if (!isRecoveryCallback) return null

  return `/reset-password${location.search}${location.hash}`
}

export class PasswordRecoveryError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'PasswordRecoveryError'
    this.code = code
  }
}

function defaultNavigation() {
  return {
    getLocation: () => window.location,
    clearSensitiveUrl: () => {
      window.history.replaceState(window.history.state, '', window.location.pathname)
    },
  }
}

function classifyRecoveryError(error) {
  const normalized = String(error?.code || error?.message || '').toLowerCase()
  return normalized.includes('expired') || normalized.includes('otp_expired')
    ? 'expired'
    : 'error'
}

export function createPasswordRecoveryService(auth, navigation = defaultNavigation()) {
  let authorized = false
  let consumed = false
  let updateInProgress = false

  function authorize() {
    authorized = true
    consumed = false
  }

  async function resolveFromLocation() {
    const location = navigation.getLocation()
    const hashParams = new URLSearchParams(location.hash.replace(/^#/, ''))
    const searchParams = new URLSearchParams(location.search)

    const accessToken = hashParams.get('access_token')
    const refreshToken = hashParams.get('refresh_token')
    const hashType = hashParams.get('type')
    const code = searchParams.get('code')
    const linkError = hashParams.get('error') || searchParams.get('error')
    const linkErrorCode = hashParams.get('error_code') || searchParams.get('error_code')
    const containsSensitiveParameters = Boolean(
      accessToken || refreshToken || code || linkError || linkErrorCode,
    )

    try {
      if (linkError) {
        return {
          status: 'invalid',
          reason: linkErrorCode === 'otp_expired' ? 'expired' : 'error',
        }
      }

      if (accessToken && refreshToken && hashType === 'recovery') {
        const { error } = await auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })
        if (error) throw error
        authorize()
        return { status: 'valid' }
      }

      if (accessToken || refreshToken) {
        return { status: 'invalid', reason: 'error' }
      }

      if (code) {
        const { error } = await auth.exchangeCodeForSession(code)
        if (error) throw error
        authorize()
        return { status: 'valid' }
      }

      return { status: 'invalid', reason: 'missing' }
    } catch (error) {
      return { status: 'invalid', reason: classifyRecoveryError(error) }
    } finally {
      if (containsSensitiveParameters) navigation.clearSensitiveUrl()
    }
  }

  async function authorizeWithOtp(email, token) {
    const { error } = await auth.verifyOtp({
      email,
      token,
      type: 'recovery',
    })
    if (error) throw error
    authorize()
  }

  async function closeSession() {
    try {
      const { error } = await auth.signOut({ scope: 'global' })
      if (!error) return
    } catch {
      // A local sign-out below still removes the recovery session from this browser.
    }

    try {
      await auth.signOut({ scope: 'local' })
    } catch {
      // The in-memory context is consumed even if the auth client cannot reach storage.
    }
  }

  async function updatePassword(password) {
    if (consumed) {
      throw new PasswordRecoveryError(
        PASSWORD_RECOVERY_ERROR_CODES.ALREADY_CONSUMED,
        'Ce contexte de récupération a déjà été utilisé.',
      )
    }

    if (!authorized) {
      throw new PasswordRecoveryError(
        PASSWORD_RECOVERY_ERROR_CODES.INVALID_CONTEXT,
        'Aucun contexte de récupération valide.',
      )
    }

    if (updateInProgress) {
      throw new PasswordRecoveryError(
        PASSWORD_RECOVERY_ERROR_CODES.UPDATE_IN_PROGRESS,
        'Une modification est déjà en cours.',
      )
    }

    updateInProgress = true
    try {
      const { error } = await auth.updateUser({ password })
      if (error) throw error

      consumed = true
      authorized = false
      await closeSession()
    } finally {
      updateInProgress = false
    }
  }

  async function abandon() {
    if (!authorized || consumed) return
    authorized = false
    await closeSession()
  }

  return {
    resolveFromLocation,
    authorizeWithOtp,
    updatePassword,
    abandon,
  }
}
