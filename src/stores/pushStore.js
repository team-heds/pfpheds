// src/stores/pushStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { enablePush, disablePush } from '@/push'
import { createClient } from '@supabase/supabase-js'
const SB_URL = import.meta.env.VITE_SUPABASE_URL
const SB_ANON = import.meta.env.VITE_SUPABASE_KEY
const sb = createClient(SB_URL, SB_ANON)
const REST    = import.meta.env.VITE_SUPABASE_REST_URL      // ex: https://api2.hedsvs.ch/rest/v1
  || 'https://api2.hedsvs.ch/rest/v1'  
/**
 * ===========================
 *  Config & helpers Supabase
 * ===========================
 */

const REST_BASE =
  import.meta.env.VITE_SUPABASE_REST_URL ||
  'https://api2.hedsvs.ch/rest/v1'

const ANON_KEY = import.meta.env.VITE_SUPABASE_KEY

if (!ANON_KEY) {
  console.error('[PushStore] VITE_SUPABASE_KEY manquant dans .env')
}
if (!REST_BASE) {
  console.error('[PushStore] VITE_SUPABASE_REST_URL manquant (fallback utilisé)')
}

const baseHeaders = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  Accept: 'application/json',
}

async function authHeaders () {
  const { data: { session } } = await sb.auth.getSession()
  const token = session?.access_token ?? import.meta.env.VITE_SUPABASE_KEY
  return {
    apikey: import.meta.env.VITE_SUPABASE_KEY,
    Authorization: `Bearer ${token}`,
    Accept: 'application/json'
  }
}


/**
 * Wrapper fetch → PostgREST
 */
async function sbFetch(path, options = {}) {
  const headers = await authHeaders()
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_REST_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers||{}) }
  })  
  if (!res.ok) {
    let detail = ''
    try {
      const err = await res.json()
      detail = err?.message || err?.error || JSON.stringify(err)
    } catch {
      detail = res.statusText
    }
    throw new Error(`[${res.status}] ${detail}`)
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

/**
 * ===========================
 *  Pinia Store
 * ===========================
 */
export const usePushStore = defineStore('push', () => {
  // state
  const isSupported = ref(
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    typeof Notification !== 'undefined'
  )
  const permission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  const isSubscribed = ref(false)
  const endpoint = ref(null)

  const loading = ref(false)
  const error = ref(null)

  // getters
  const statusText = computed(() => {
    if (!isSupported.value) return 'non supporté'
    if (permission.value === 'denied') return 'refusé'
    if (!isSubscribed.value) return 'désactivé'
    return 'activé'
  })

  // actions
  async function refreshStatus() {
    try {
      error.value = null
      permission.value = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
      if (!isSupported.value) {
        isSubscribed.value = false
        endpoint.value = null
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      isSubscribed.value = !!sub
      endpoint.value = sub?.endpoint || null
    } catch (e) {
      error.value = e?.message || String(e)
      isSubscribed.value = false
      endpoint.value = null
    }
  }

  async function enable() {
    loading.value = true
    error.value = null
    try {
      await enablePush()
      await refreshStatus()
      return true
    } catch (e) {
      error.value = e?.message || String(e)
      return false
    } finally {
      loading.value = false
    }
  }

  async function disable() {
    loading.value = true
    error.value = null
    try {
      await disablePush()
      await refreshStatus()
      return true
    } catch (e) {
      error.value = e?.message || String(e)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * Envoi d’un test via PostgREST
   * On insère une ligne dans une table `push_outbox` (à créer côté Supabase)
   * ou on appelle une RPC exposée
   */
// pushStore.js (remplace ta fonction sendTest)
 async function sendTest(payload = {}) {
  const {
    title = 'Hello 👋',
    body  = 'Test push depuis la PWA',
    url   = '/',
    user_id // facultatif : ignoré si non connecté
  } = payload

  // Récupère la session (si l'utilisateur est loggé)
  const { data: { session } } = await sb.auth.getSession()

  // Headers: session si dispo, sinon anon
  const headers = {
    apikey: SB_ANON,
    Authorization: `Bearer ${session?.access_token ?? SB_ANON}`,
    'Content-Type': 'application/json',
    Prefer: 'return=representation',
    Accept: 'application/json'
  }

  // IMPORTANT :
  // - si pas de session => n'envoie PAS user_id (la policy anon exige user_id IS NULL)
  // - si session => envoie user_id (id de l'utilisateur courant si fourni)
  const bodyObj = session?.user?.id
    ? { user_id: user_id ?? session.user.id, title, body, url }
    : { title, body, url }

  const res = await fetch(`${REST}/push_outbox`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyObj)
  })

  const text = await res.text()
  const json = text ? JSON.parse(text) : null

  if (!res.ok) {
    const detail = json?.message || json?.error || res.statusText
    throw new Error(`[${res.status}] ${detail}`)
  }

  // Supabase peut renvoyer [row] ou row → normaliser
  return Array.isArray(json) ? json[0] : json
}


  return {
    // state
    isSupported, permission, isSubscribed, endpoint, loading, error,
    // getters
    statusText,
    // actions
    refreshStatus, enable, disable, sendTest,
  }
})
