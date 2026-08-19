import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockGetSession = vi.fn()
const mockRefreshSession = vi.fn()

vi.mock('@/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args) => mockGetSession(...args),
      refreshSession: (...args) => mockRefreshSession(...args),
    },
  },
}))

const {
  API_REQUEST_TIMEOUT_MS,
  AUTH_SESSION_TIMEOUT_MS,
  apiClient,
  authFetch,
  getAuthHeaders,
  normalizeApiError,
  resolveApiBaseUrl,
} = await import('@/service/apiClient')

afterEach(() => {
  vi.useRealTimers()
})

beforeEach(() => {
  vi.restoreAllMocks()
  mockGetSession.mockReset()
  mockRefreshSession.mockReset()
  mockGetSession.mockResolvedValue({
    data: { session: { access_token: 'token', expires_at: 4_102_444_800 } },
    error: null,
  })
})

describe('resolveApiBaseUrl', () => {
  it('routes production traffic to the dedicated API host when env points to localhost', () => {
    expect(resolveApiBaseUrl('http://localhost/api', {
      origin: 'https://hedsvs.ch',
      protocol: 'https:',
      hostname: 'hedsvs.ch'
    })).toBe('https://api2.hedsvs.ch/api')
  })

  it('does not send a relative production API path to the static frontend host', () => {
    expect(resolveApiBaseUrl('/api', {
      origin: 'https://hedsvs.ch',
      protocol: 'https:',
      hostname: 'hedsvs.ch'
    })).toBe('https://api2.hedsvs.ch/api')
  })

  it('keeps an explicit remote API URL', () => {
    expect(resolveApiBaseUrl('https://api2.hedsvs.ch/api/', {
      origin: 'https://hedsvs.ch',
      protocol: 'https:',
      hostname: 'hedsvs.ch'
    })).toBe('https://api2.hedsvs.ch/api')
  })

  it('keeps the local API URL during local development', () => {
    expect(resolveApiBaseUrl('/api', {
      origin: 'http://localhost:5174',
      protocol: 'http:',
      hostname: 'localhost'
    })).toBe('/api')
  })

  it('configures a bounded axios request timeout', () => {
    expect(apiClient.defaults.timeout).toBe(API_REQUEST_TIMEOUT_MS)
  })

  it('bounds a stalled Supabase session lookup before sending a request', async () => {
    vi.useFakeTimers()
    mockGetSession.mockReturnValue(new Promise(() => {}))

    const assertion = expect(getAuthHeaders()).rejects.toMatchObject({
      code: 'AUTH_SESSION_TIMEOUT',
      retryable: true,
    })
    await vi.advanceTimersByTimeAsync(AUTH_SESSION_TIMEOUT_MS)

    await assertion
  })

  it('stops waiting for Supabase auth when the caller aborts', async () => {
    mockGetSession.mockReturnValue(new Promise(() => {}))
    const controller = new AbortController()

    const assertion = expect(getAuthHeaders({}, { signal: controller.signal })).rejects.toMatchObject({
      code: 'REQUEST_ABORTED',
    })
    controller.abort()

    await assertion
  })

  it('deduplicates concurrent session refreshes', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'old', expires_at: 1 } },
      error: null,
    })
    mockRefreshSession.mockResolvedValue({
      data: { session: { access_token: 'new', expires_at: 4_102_444_800 } },
      error: null,
    })

    const [first, second] = await Promise.all([getAuthHeaders(), getAuthHeaders()])

    expect(mockRefreshSession).toHaveBeenCalledOnce()
    expect(first.Authorization).toBe('Bearer new')
    expect(second.Authorization).toBe('Bearer new')
  })

  it('retries one transient GET response and keeps the refreshed result', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 503, headers: { 'Retry-After': '0' } }))
      .mockResolvedValueOnce(new Response('{"ok":true}', { status: 200 }))

    const response = await authFetch('/api/test')

    expect(response.status).toBe(200)
    expect(globalThis.fetch).toHaveBeenCalledTimes(2)
  })

  it('does not retry a failed mutation', async () => {
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('{"error":"unavailable"}', {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }))

    await expect(authFetch('/api/test', { method: 'POST' })).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      status: 503,
      retryable: true,
    })
    expect(globalThis.fetch).toHaveBeenCalledOnce()
  })

  it('retries one transient axios GET through the shared client', async () => {
    const adapter = vi.fn()
      .mockImplementationOnce((config) => Promise.reject({
        config,
        response: { status: 503, headers: { 'retry-after': '0' } },
      }))
      .mockImplementationOnce((config) => Promise.resolve({
        config,
        data: { ok: true },
        headers: {},
        status: 200,
        statusText: 'OK',
      }))

    const response = await apiClient.get('/reliable', { adapter })

    expect(response.data).toEqual({ ok: true })
    expect(adapter).toHaveBeenCalledTimes(2)
  })

  it('refreshes a 401 GET once before replaying it', async () => {
    mockRefreshSession.mockResolvedValue({
      data: { session: { access_token: 'refreshed-token', expires_at: 4_102_444_800 } },
      error: null,
    })
    const adapter = vi.fn()
      .mockImplementationOnce((config) => Promise.reject({
        config,
        response: { status: 401, headers: {} },
      }))
      .mockImplementationOnce((config) => Promise.reject({
        config,
        response: { status: 503, headers: { 'retry-after': '0' } },
      }))
      .mockImplementationOnce((config) => Promise.resolve({
        config,
        data: { ok: true },
        headers: {},
        status: 200,
        statusText: 'OK',
      }))

    await apiClient.get('/authenticated', { adapter })

    expect(mockRefreshSession).toHaveBeenCalledOnce()
    expect(adapter).toHaveBeenCalledTimes(3)
  })

  it('does not retry an axios POST mutation', async () => {
    const adapter = vi.fn().mockImplementation((config) => Promise.reject({
      config,
      response: { status: 503, headers: {} },
    }))

    await expect(apiClient.post('/mutation', { value: 1 }, { adapter })).rejects.toMatchObject({
      code: 'SERVICE_UNAVAILABLE',
      status: 503,
    })
    expect(adapter).toHaveBeenCalledOnce()
  })

  it('normalizes rate limits and keeps the request identifier', () => {
    expect(normalizeApiError({
      response: {
        status: 429,
        headers: { 'x-request-id': 'request-123' },
      },
    })).toMatchObject({
      code: 'RATE_LIMITED',
      status: 429,
      retryable: true,
      requestId: 'request-123',
    })
  })
})
