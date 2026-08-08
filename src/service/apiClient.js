import axios from 'axios'
import { supabase } from '@/supabase'

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1'])

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

export async function getAuthHeaders(headers = {}) {
  const { data: { session }, error } = await supabase.auth.getSession()
  if (error || !session?.access_token) throw new Error('Authentication required')
  return { ...headers, Authorization: `Bearer ${session.access_token}` }
}

export async function authFetch(input, init = {}) {
  return fetch(input, { ...init, headers: await getAuthHeaders(init.headers) })
}

export const apiClient = axios.create({ baseURL: API_URL })
apiClient.interceptors.request.use(async (config) => {
  config.headers = await getAuthHeaders(config.headers)
  return config
})

export default apiClient
