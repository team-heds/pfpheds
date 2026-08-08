import { API_URL } from '@/service/apiClient'

export const PASSWORD_RECOVERY_REQUEST_ERROR_CODES = Object.freeze({
  RATE_LIMITED: 'password_recovery_rate_limited',
  UNAVAILABLE: 'password_recovery_unavailable',
})

export class PasswordRecoveryRequestError extends Error {
  constructor(code) {
    super(code)
    this.name = 'PasswordRecoveryRequestError'
    this.code = code
  }
}

export async function requestPasswordRecovery(email, options = {}) {
  const fetchImpl = options.fetchImpl || window.fetch
  const apiBaseUrl = String(options.apiBaseUrl || API_URL).replace(/\/+$/, '')

  let response
  try {
    response = await fetchImpl(`${apiBaseUrl}/auth/password-recovery`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })
  } catch {
    throw new PasswordRecoveryRequestError(PASSWORD_RECOVERY_REQUEST_ERROR_CODES.UNAVAILABLE)
  }

  if (response.status === 429) {
    throw new PasswordRecoveryRequestError(PASSWORD_RECOVERY_REQUEST_ERROR_CODES.RATE_LIMITED)
  }
  if (!response.ok) {
    throw new PasswordRecoveryRequestError(PASSWORD_RECOVERY_REQUEST_ERROR_CODES.UNAVAILABLE)
  }
}
