import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { enablePush, disablePush } from '@/push'
import { createClient } from '@supabase/supabase-js'
const SB_URL = import.meta.env.VITE_SUPABASE_URL
const SB_ANON = import.meta.env.VITE_SUPABASE_KEY
const sb = createClient(SB_URL, SB_ANON)
const REST    = import.meta.env.VITE_SUPABASE_REST_URL      // ex: https://api2.hedsvs.ch/rest/v1
  || 'https://api2.hedsvs.ch/rest/v1'  
 
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
 
 

async function getAdminCount() {
  try {
    console.log('🔍 [PushStore] Début getAdminCount...')
    
    // Test 1: Essai de récupérer TOUS les profils (sans filtre)
    const { data: allData, error: allError } = await sb
      .from('user_profiles')
      .select('user_id, email, role, is_active')
    
    console.log('🔍 [PushStore] Test 1 - TOUS les profils:', allData?.length || 0, 'profils')
    if (allError) console.error('❌ Test 1 Error:', allError)
    
    // Test 2: Compter uniquement les admins
    const { data: adminData, error: adminError, count: adminCount } = await sb
      .from('user_profiles')
      .select('user_id, email, role, is_active', { count: 'exact' })
      .eq('role', 'admin')
    
    console.log('🔍 [PushStore] Test 2 - Admins (avec données):', {
      count: adminCount,
      data: adminData,
      error: adminError
    })
    
    // Test 3: Compter les admins actifs
    const { count, error } = await sb
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('is_active', true)

    console.log('🔍 [PushStore] Test 3 - Admins actifs (count only):', {
      count,
      error
    })

    if (error) {
      console.error('❌ [PushStore] Erreur getAdminCount:', error)
      console.error('❌ [PushStore] Error code:', error.code)
      console.error('❌ [PushStore] Error message:', error.message)
      console.error('❌ [PushStore] Error details:', error.details)
      // Fallback: utiliser les données du test 2
      if (adminData && !adminError) {
        const activeAdmins = adminData.filter(a => a.is_active === true)
        console.log(`⚠️ [PushStore] Fallback count: ${activeAdmins.length} admin(s) actif(s)`)
        return activeAdmins.length
      }
      return 0
    }

    console.log(`✅ [PushStore] ${count} administrateur(s) actif(s) dans la DB`)
    return count || 0
  } catch (e) {
    console.error('❌ [PushStore] Exception getAdminCount:', e)
    console.error('❌ [PushStore] Exception details:', e.message)
    return 0
  }
}

/**
 * Envoie une notification push à tous les utilisateurs avec le rôle 'admin'
 */
async function sendToAllAdmins(payload = {}) {
  const {
    title = 'Notification Admin ',
    body  = 'Message pour tous les administrateurs',
    url   = '/'
  } = payload
 
  loading.value = true
  error.value = null
 
  try {
    // 1. Récupère la session actuelle
    const { data: { session } } = await sb.auth.getSession()
    if (!session) {
      throw new Error('Vous devez être connecté pour envoyer des notifications aux admins')
    }
 
    // 2. Récupère tous les user_id avec role = 'admin'

    // 2. Récupère tous les user_id avec role = 'admin' (y compris l'utilisateur actuel)
    const { data: admins, error: fetchError } = await sb
      .from('user_profiles')
      .select('user_id, email, forname, family_name')
      .eq('role', 'admin')
      .eq('is_active', true)
 
    if (fetchError) {
      throw new Error(`Erreur lors de la récupération des admins: ${fetchError.message}`)
    }
 
    if (!admins || admins.length === 0) {
      throw new Error('Aucun administrateur trouvé')
    }
 
    console.log(` [PushStore] Envoi de notifications à ${admins.length} admin(s)`)
 

    // Vérifie si l'utilisateur actuel est dans la liste
    const currentUserInList = admins.find(a => a.user_id === session.user.id)
    const currentUserEmail = currentUserInList?.email || session.user.email

    console.log(`📢 [PushStore] Envoi de notifications à ${admins.length} admin(s)`)
    console.log(`📧 [PushStore] Liste des admins:`, admins.map(a => a.email || a.user_id))
    
    if (currentUserInList) {
      console.log(`✅ [PushStore] Vous (${currentUserEmail}) recevrez aussi la notification`)
    } else {
      console.warn(`⚠️ [PushStore] Attention: Vous (${currentUserEmail}) n'êtes pas dans la liste des admins`)
    }

    // 3. Headers avec authentification
    const headers = {
      apikey: SB_ANON,
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      Accept: 'application/json'
    }
 
    // 4. Envoie une notification pour chaque admin
    const promises = admins.map(admin => {
      const bodyObj = {
        user_id: admin.user_id,
        title,
        body,
        url
      }
 
      console.log(` Envoi à ${admin.email || admin.user_id}`)
 
      return fetch(`${REST}/push_outbox`, {
        method: 'POST',
        headers,
        body: JSON.stringify(bodyObj)
      }).then(async res => {
        const text = await res.text()
        const json = text ? JSON.parse(text) : null
        
        if (!res.ok) {
          const detail = json?.message || json?.error || res.statusText
          console.error(` Erreur pour ${admin.email}: ${detail}`)
          return { success: false, admin, error: detail }
        }
        
        console.log(` Notification envoyée à ${admin.email || admin.user_id}`)
        return { success: true, admin, data: Array.isArray(json) ? json[0] : json }
      })
    })
 
    // 5. Attend toutes les réponses
    const results = await Promise.all(promises)
    const successCount = results.filter(r => r.success).length
    const failCount = results.filter(r => !r.success).length
 
    console.log(` [PushStore] ${successCount} notification(s) envoyée(s), ${failCount} échec(s)`)
 
    return {
      total: admins.length,
      success: successCount,
      failed: failCount,
      results
    }
  } catch (e) {
    error.value = e?.message || String(e)
    console.error(' [PushStore] Erreur sendToAllAdmins:', e)
    throw e
  } finally {
    loading.value = false
  }
}
 
  return {
    // state
    isSupported, permission, isSubscribed, endpoint, loading, error,
    // getters
    statusText,
    // actions
    refreshStatus, enable, disable, sendTest, sendToAllAdmins, getAdminCount,
  }
})