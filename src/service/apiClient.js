import axios from 'axios'
import { supabase } from '@/supabase'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504])
export const API_REQUEST_TIMEOUT_MS = 12_000
const MAX_RETRY_DELAY_MS = 2_000

let sessionRefreshPromise = null

export class ApiClientError extends Error {
  constructor(message, options = {}) {
    super(message, options.cause ? { cause: options.cause } : undefined)
    this.name = 'ApiClientError'
    this.code = options.code || 'API_ERROR'
    this.status = options.status || null
    this.retryable = Boolean(options.retryable)
    this.requestId = options.requestId || null
  }
}

export function resolveApiBaseUrl(configuredUrl, runtimeLocation = globalThis.location) {
  const runtimeHostname = runtimeLocation?.hostname || ''
  const runtimeProtocol = runtimeLocation?.protocol || 'https:'
  const runtimeIsLocal = LOCAL_HOSTS.has(runtimeHostname)
  const normalizedConfiguredUrl = String(configuredUrl || '').replace(/\/+$/, '')

  if (runtimeIsLocal && normalizedConfiguredUrl) return normalizedConfiguredUrl

  if (normalizedConfiguredUrl) {
    try {
      const configured = new URL(normalizedConfiguredUrl)
      const configuredIsLocal = LOCAL_HOSTS.has(configured.hostname)
      if (!configuredIsLocal) return normalizedConfiguredUrl
    } catch (_) {
      // Relative production URLs are handled by the dedicated API host below.
    }
  }

  if (runtimeHostname && !runtimeIsLocal) {
    const applicationHost = runtimeHostname.replace(/^www\./i, '')
    return `${runtimeProtocol}//api2.${applicationHost}/api`
  }

  return normalizedConfiguredUrl || '/api'
}

export const API_URL = resolveApiBaseUrl(
  import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL
)

function createAuthError(message, cause) {
  return new ApiClientError(message, {
    code: 'AUTHENTICATION_REQUIRED',
    status: 401,
    retryable: false,
    cause,
  })
}

export function refreshSessionSingleFlight() {
  if (sessionRefreshPromise) return sessionRefreshPromise

  sessionRefreshPromise = (async () => {
    const { data, error } = await supabase.auth.refreshSession()
    if (error || !data?.session?.access_token) {
      throw createAuthError('Unable to refresh the authenticated session', error)
    }
    return data.session
  })().finally(() => {
    sessionRefreshPromise = null
  })

  return sessionRefreshPromise
}

async function getSession({ forceRefresh = false } = {}) {
  if (forceRefresh) return refreshSessionSingleFlight()

  const { data, error } = await supabase.auth.getSession()
  if (error || !data?.session?.access_token) {
    throw createAuthError('Authentication required', error)
  }

  const session = data.session
  const expiresAt = Number(session.expires_at || 0)
  if (expiresAt && expiresAt - Math.floor(Date.now() / 1000) < 60) {
    return refreshSessionSingleFlight()
  }

  return session
}

export async function getAuthHeaders(headers = {}, options = {}) {
  const session = await getSession(options)
  const normalizedHeaders = headers?.toJSON?.() || headers || {}
  return { ...normalizedHeaders, Authorization: `Bearer ${session.access_token}` }
}

function isIdempotentGet(method) {
  return String(method || 'GET').toUpperCase() === 'GET'
}

function isRetryableAxiosError(error) {
  if (!error?.response) return true
  return RETRYABLE_STATUSES.has(error.response.status)
}

function retryDelayFromHeaders(headers = {}) {
  const value = headers?.['retry-after'] ?? headers?.get?.('retry-after')
  if (!value) return 250

  const seconds = Number(value)
  if (Number.isFinite(seconds)) return Math.min(Math.max(seconds * 1000, 0), MAX_RETRY_DELAY_MS)

  const dateDelay = Date.parse(value) - Date.now()
  return Math.min(Math.max(dateDelay || 0, 0), MAX_RETRY_DELAY_MS)
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export function normalizeApiError(error) {
  if (error instanceof ApiClientError) return error

  const status = error?.response?.status || error?.status || null
  const timedOut = error?.code === 'ECONNABORTED' || error?.name === 'TimeoutError'
  const aborted = error?.code === 'ERR_CANCELED' || error?.name === 'AbortError'
  const networkFailure = !status && !aborted
  const requestId = error?.response?.headers?.['x-request-id'] || error?.requestId || null

  let code = 'API_ERROR'
  let message = 'The request could not be completed'
  if (timedOut) {
    code = 'REQUEST_TIMEOUT'
    message = 'The request timed out'
  } else if (aborted) {
    code = 'REQUEST_ABORTED'
    message = 'The request was cancelled'
  } else if (networkFailure) {
    code = 'NETWORK_ERROR'
    message = 'The service is unreachable'
  } else if (status === 401) {
    code = 'AUTHENTICATION_REQUIRED'
    message = 'Authentication required'
  } else if (status === 403) {
    code = 'FORBIDDEN'
    message = 'Access denied'
  } else if (status === 429) {
    code = 'RATE_LIMITED'
    message = 'Too many requests'
  } else if (status >= 500) {
    code = 'SERVICE_UNAVAILABLE'
    message = 'The service is temporarily unavailable'
  } else if (status >= 400) {
    code = 'REQUEST_REJECTED'
    message = error?.response?.data?.error || error?.response?.data?.message || message
  }

  return new ApiClientError(message, {
    code,
    status,
    retryable: timedOut || networkFailure || RETRYABLE_STATUSES.has(status),
    requestId,
    cause: error,
  })
}

function requestSignal(parentSignal, timeoutMs) {
  const controller = new AbortController()
  const abort = () => controller.abort(parentSignal?.reason)
  if (parentSignal?.aborted) abort()
  else parentSignal?.addEventListener('abort', abort, { once: true })
  const timeoutId = setTimeout(() => controller.abort(new DOMException('Request timed out', 'TimeoutError')), timeoutMs)

  return {
    signal: controller.signal,
    cleanup() {
      clearTimeout(timeoutId)
      parentSignal?.removeEventListener('abort', abort)
    },
  }
}

async function fetchError(response) {
  let message
  try {
    const payload = await response.clone().json()
    message = payload?.error || payload?.message
  } catch (_) {
    // The normalized status message is sufficient when the body is not JSON.
  }
  const error = new Error(message || `HTTP ${response.status}`)
  error.status = response.status
  error.requestId = response.headers.get('x-request-id')
  return error
}

export async function authFetch(input, init = {}) {
  const method = String(init.method || 'GET').toUpperCase()
  let authRetried = false
  let refreshBeforeRequest = false
  let transientRetried = false

  while (true) {
    const request = requestSignal(init.signal, init.timeout ?? API_REQUEST_TIMEOUT_MS)
    try {
      const headers = await getAuthHeaders(init.headers, { forceRefresh: refreshBeforeRequest })
      refreshBeforeRequest = false
      const response = await fetch(input, {
        ...init,
        signal: request.signal,
        headers,
      })

      if (response.ok) return response
      if (method === 'GET' && response.status === 401 && !authRetried) {
        authRetried = true
        refreshBeforeRequest = true
        continue
      }
      if (method === 'GET' && RETRYABLE_STATUSES.has(response.status) && !transientRetried) {
        transientRetried = true
        await delay(retryDelayFromHeaders(response.headers))
        continue
      }
      throw await fetchError(response)
    } catch (error) {
      if (method === 'GET' && !transientRetried && !init.signal?.aborted &&
          (error?.name === 'TypeError' || error?.name === 'TimeoutError')) {
        transientRetried = true
        continue
      }
      throw normalizeApiError(error)
    } finally {
      request.cleanup()
    }
  }
}

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: API_REQUEST_TIMEOUT_MS,
})

apiClient.interceptors.request.use(async (config) => {
  config.headers = await getAuthHeaders(config.headers)
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config
    const isGet = isIdempotentGet(config?.method)

    if (config && isGet && error?.response?.status === 401 && !config.__authRetried) {
      config.__authRetried = true
      const refreshedSession = await refreshSessionSingleFlight()
      config.headers = {
        ...(config.headers?.toJSON?.() || config.headers || {}),
        Authorization: `Bearer ${refreshedSession.access_token}`,
      }
      return apiClient.request(config)
    }

    if (config && isGet && isRetryableAxiosError(error) && !config.__transientRetried) {
      config.__transientRetried = true
      await delay(retryDelayFromHeaders(error?.response?.headers))
      return apiClient.request(config)
    }

    throw normalizeApiError(error)
  },
)

export default apiClient
