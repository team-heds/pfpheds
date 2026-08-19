const PASSWORD_RECOVERY_PATHS = new Set(['/reset-password', '/new-password'])
export const DEFAULT_BOOTSTRAP_TIMEOUT_MS = 15_000

export class BootstrapTimeoutError extends Error {
  constructor(timeoutMs) {
    super(`Application initialization timed out after ${timeoutMs}ms`)
    this.name = 'BootstrapTimeoutError'
    this.code = 'BOOTSTRAP_TIMEOUT'
    this.retryable = true
  }
}

export function withTimeout(promise, timeoutMs, createError = () => new BootstrapTimeoutError(timeoutMs)) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) return Promise.resolve(promise)

  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(createError()), timeoutMs)
  })

  return Promise.race([Promise.resolve(promise), timeout]).finally(() => clearTimeout(timeoutId))
}

export function isPasswordRecoveryPath(pathname) {
  return PASSWORD_RECOVERY_PATHS.has(pathname)
}

export async function bootstrapApplication(options) {
  const {
    pathname,
    initializeAuth,
    initializeUser,
    waitForRouter,
    mount,
    onError = () => {},
    timeoutMs = DEFAULT_BOOTSTRAP_TIMEOUT_MS,
  } = options

  const initialize = () => withTimeout((async () => {
    if (!isPasswordRecoveryPath(pathname)) {
      await initializeAuth()
      await initializeUser()
    }
    await waitForRouter()
  })(), timeoutMs)

  let retryPromise = null
  const retry = () => {
    if (retryPromise) return retryPromise

    retryPromise = initialize()
      .then(() => ({ ok: true, error: null, retry }))
      .catch((error) => {
        onError(error, { retry })
        return { ok: false, error, retry }
      })
      .finally(() => {
        retryPromise = null
      })

    return retryPromise
  }

  let result
  try {
    await initialize()
    result = { ok: true, error: null, retry }
  } catch (error) {
    onError(error, { retry })
    result = { ok: false, error, retry }
  } finally {
    mount()
  }

  return result
}
