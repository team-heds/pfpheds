// src/stores/pushStore.js
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { enablePush, disablePush } from '@/push'

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

/**
 * Wrapper fetch → PostgREST
 */
async function sbFetch(path, options = {}) {
  const url = `${REST_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options.headers || {}),
    },
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
  async function sendTest() {
    try {
      // Exemple avec table `push_outbox` (id, title, body, url, created_at)
      const data = await sbFetch('/push_outbox', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          title: 'Hello 👋',
          body: 'Test push depuis la PWA',
          url: '/',
        }),
      })
      return data
    } catch (e) {
      error.value = e?.message || String(e)
      throw e
    }
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
