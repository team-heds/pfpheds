import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
 
export const useRoleStore = defineStore('role', () => {
  // State
  const session = ref(null)
  const perms = ref([])
  const initialized = ref(false)
  const _unsubscribeAuth = ref(null)
  let initPromise = null
  let permissionsPromise = null
  let permissionsUserId = null
 
  // Getters
  const isAuthenticated = computed(() => !!session.value)
  const isSuper = computed(() => perms.value.includes('super.all'))
 
  // Actions
  async function init({ session: resolvedSession = null, sessionResolved = false } = {}) {
    if (initialized.value) return
    if (initPromise) return initPromise

    initPromise = (async () => {
      if (sessionResolved) {
        session.value = resolvedSession
      } else {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        session.value = data?.session ?? null
      }

      await loadPermissions(session.value)

      const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
        session.value = newSession ?? null
        if (!session.value) {
          perms.value = []
          return
        }

        const expectedUserId = session.value.user?.id
        queueMicrotask(() => {
          if (session.value?.user?.id !== expectedUserId) return
          loadPermissions(session.value).catch((permissionError) => {
            console.error('loadPermissions after auth change:', permissionError)
          })
        })
      })

      _unsubscribeAuth.value = () => (sub?.subscription || sub)?.unsubscribe?.()
      initialized.value = true
    })().finally(() => {
      initPromise = null
    })

    return initPromise
  }
 
  async function loadPermissions(activeSession = session.value) {
    if (!activeSession) {
      perms.value = []
      return []
    }
    const requestedUserId = activeSession.user?.id || null
    if (!requestedUserId) {
      perms.value = []
      return []
    }
    if (permissionsPromise && permissionsUserId === requestedUserId) return permissionsPromise

    let currentPromise
    currentPromise = (async () => {
      try {

      const permsSet = new Set()
 
      // A) RPC (source principale)
      const { data: rows, error: rpcError } = await supabase.rpc('api_my_permissions')
      if (!rpcError && Array.isArray(rows)) {
        for (const r of rows) {
          if (r?.perm) permsSet.add(r.perm)
        }
      } else if (rpcError) {
        if (rpcError.code === 'PGRST202') {
          console.warn('⚠️ RPC api_my_permissions absente, fallback user_profiles uniquement.')
        } else {
          console.warn('RPC api_my_permissions error:', rpcError)
        }
      }
 
      // B) fallback user_profiles (si Admin Panel écrit ici)
      const user = activeSession.user
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('role, permissions')
          .eq('user_id', user.id)
          .maybeSingle()
 
        if (!profileError && profile) {
          if (profile.role) permsSet.add(profile.role)
 
          // permissions peut être array OU json (selon ta colonne)
          let p = profile.permissions
          if (typeof p === 'string') {
            try { p = JSON.parse(p) } catch { /* ignore */ }
          }
          if (Array.isArray(p)) {
            for (const perm of p) if (perm) permsSet.add(perm)
          }
        } else if (profileError) {
          // pas bloquant
          console.warn('user_profiles read error:', profileError)
        }
      }
 
      const resolvedPermissions = Array.from(permsSet)
      if (session.value?.user?.id === requestedUserId) {
        perms.value = resolvedPermissions
      }
      return resolvedPermissions
      
    } catch (e) {
      console.error('loadPermissions fatal:', e)
      if (session.value?.user?.id === requestedUserId) perms.value = []
      throw e
    }
    })().finally(() => {
      if (permissionsPromise === currentPromise) {
        permissionsPromise = null
        permissionsUserId = null
      }
    })

    permissionsPromise = currentPromise
    permissionsUserId = requestedUserId
    return currentPromise
  }
 
  function can(perm) {
    // arrays de permissions acceptées
    if (Array.isArray(perm)) {
      if (perm.includes('public') || perm.includes('anonymous')) return true
      if (perm.includes('authenticated')) return isAuthenticated.value
      return isSuper.value || perm.some(p => perms.value.includes(p))
    }
 
    // single permission
    if (perm === 'public' || perm === 'anonymous') return true
    if (perm === 'authenticated') return isAuthenticated.value
    return isSuper.value || perms.value.includes(perm)
  }
 
  function destroy() {
    // optionnel: si tu veux cleanup (tests, hot reload, etc.)
    if (_unsubscribeAuth.value) _unsubscribeAuth.value()
    _unsubscribeAuth.value = null
    initialized.value = false
    initPromise = null
    permissionsPromise = null
    permissionsUserId = null
    session.value = null
    perms.value = []
  }
 
  return {
    session,
    perms,
    initialized,
    isAuthenticated,
    isSuper,
    init,
    loadPermissions,
    can,
    destroy,
  }
})
