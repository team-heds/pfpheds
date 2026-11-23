import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { supabase } from '@/supabase'
import {
  PUSH_STATES,
  disablePushOnThisDevice,
  enablePushForCurrentUser,
  getPushState,
  isPushSupported,
} from '@/service/pushSubscriptionService'

async function requireSession() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) throw new Error('Connectez-vous pour envoyer une notification.')
  return session
}

export const usePushStore = defineStore('push', () => {
  const isSupported = ref(isPushSupported())
  const permission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'unsupported')
  const isSubscribed = ref(false)
  const loading = ref(false)
  const error = ref(null)

  const statusText = computed(() => {
    if (!isSupported.value) return 'non supporté'
    if (permission.value === 'denied') return 'refusé'
    return isSubscribed.value ? 'activé' : 'désactivé'
  })

  async function refreshStatus() {
    try {
      error.value = null
      permission.value = typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
      isSubscribed.value = (await getPushState()) === PUSH_STATES.ENABLED
    } catch (e) {
      error.value = e?.message || String(e)
      isSubscribed.value = false
    }
  }

  async function runSubscriptionChange(change) {
    loading.value = true
    error.value = null
    try {
      await change()
      await refreshStatus()
      return true
    } catch (e) {
      error.value = e?.message || String(e)
      await refreshStatus().catch(() => {})
      error.value = e?.message || String(e)
      return false
    } finally {
      loading.value = false
    }
  }

  const enable = () => runSubscriptionChange(enablePushForCurrentUser)
  const disable = () => runSubscriptionChange(disablePushOnThisDevice)

  /** Envoie une notification de test au compte connecté. */
  async function sendTest({ title = 'Notification de test', body = 'Les notifications fonctionnent.', url = '/' } = {}) {
    const session = await requireSession()
    const { data, error: insertError } = await supabase
      .from('push_outbox')
      .insert({ user_id: session.user.id, title, body, url })
      .select('id, status')
      .single()
    if (insertError) throw new Error(insertError.message)
    return data
  }

  async function getAdminCount() {
    const { count, error: countError } = await supabase
      .from('user_profiles')
      .select('user_id', { count: 'exact', head: true })
      .eq('role', 'admin')
      .eq('is_active', true)
    if (countError) {
      console.error('[PushStore] Comptage des administrateurs impossible:', countError.message)
      return 0
    }
    return count || 0
  }

  /** Envoie une notification à chaque administrateur actif. */
  async function sendToAllAdmins({
    title = 'Notification administration',
    body = 'Message pour tous les administrateurs',
    url = '/',
  } = {}) {
    loading.value = true
    error.value = null
    try {
      await requireSession()
      const { data: admins, error: fetchError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('role', 'admin')
        .eq('is_active', true)
      if (fetchError) throw new Error(`Administrateurs introuvables : ${fetchError.message}`)
      if (!admins?.length) throw new Error('Aucun administrateur trouvé.')

      const results = await Promise.all(admins.map(async ({ user_id: userId }) => {
        const { error: insertError } = await supabase
          .from('push_outbox')
          .insert({ user_id: userId, title, body, url })
        return { success: !insertError, userId, error: insertError?.message }
      }))
      const success = results.filter((result) => result.success).length
      return { total: admins.length, success, failed: admins.length - success, results }
    } catch (e) {
      error.value = e?.message || String(e)
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    error,
    statusText,
    refreshStatus,
    enable,
    disable,
    sendTest,
    sendToAllAdmins,
    getAdminCount,
  }
})
