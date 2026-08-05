import axios from 'axios'
import { supabase } from '@/supabase'

const API_URL = import.meta.env.VITE_API_URL || '/api'

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
