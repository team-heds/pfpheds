import { describe, expect, it, vi } from 'vitest'

vi.mock('@/service/apiClient', () => ({ API_URL: 'https://api2.hedsvs.ch/api' }))

const {
  PASSWORD_RECOVERY_REQUEST_ERROR_CODES,
  requestPasswordRecovery,
} = await import('@/service/passwordRecoveryRequestService')

describe('passwordRecoveryRequestService', () => {
  it('calls the public backend without an authorization header', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 202 })

    await requestPasswordRecovery('student@hevs.ch', { fetchImpl })

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://api2.hedsvs.ch/api/auth/password-recovery',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student@hevs.ch' }),
      },
    )
    expect(fetchImpl.mock.calls[0][1].headers).not.toHaveProperty('Authorization')
  })

  it('normalizes a custom API base URL', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true, status: 202 })

    await requestPasswordRecovery('student@hevs.ch', {
      fetchImpl,
      apiBaseUrl: 'http://localhost:3000/api/',
    })

    expect(fetchImpl.mock.calls[0][0]).toBe(
      'http://localhost:3000/api/auth/password-recovery',
    )
  })

  it('maps rate limiting to a stable non-sensitive code', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 429 })

    await expect(requestPasswordRecovery('student@hevs.ch', { fetchImpl })).rejects.toMatchObject({
      code: PASSWORD_RECOVERY_REQUEST_ERROR_CODES.RATE_LIMITED,
    })
  })

  it.each([
    ['network failure', () => Promise.reject(new Error('secret transport details'))],
    ['server failure', () => Promise.resolve({ ok: false, status: 503 })],
  ])('maps %s to the same public failure code', async (_name, responseFactory) => {
    const fetchImpl = vi.fn().mockImplementation(responseFactory)

    await expect(requestPasswordRecovery('student@hevs.ch', { fetchImpl })).rejects.toMatchObject({
      code: PASSWORD_RECOVERY_REQUEST_ERROR_CODES.UNAVAILABLE,
    })
  })
})
