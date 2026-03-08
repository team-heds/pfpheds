import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
 
export const useRoleStore = defineStore('role', () => {
  // State
  const session = ref(null)
  const perms = ref([])
  const initialized = ref(false)
  const _unsubscribeAuth = ref(null)
 
  // Getters
  const isAuthenticated = computed(() => !!session.value)
  const isSuper = computed(() => perms.value.includes('super.all'))
 
  // Actions
  async function init() {
    if (initialized.value) return
 
    // 1) session initiale
    const { data, error } = await supabase.auth.getSession()
    if (error) console.warn('getSession error:', error)
    session.value = data?.session ?? null
 
    // 2) perms initiales
    await loadPermissions()
 
    // 3) listener unique (évite les doublons)
    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      session.value = newSession ?? null
      if (session.value) {
        await loadPermissions()
      } else {
        perms.value = []
      }
    })
 
    _unsubscribeAuth.value = () => sub?.subscription?.unsubscribe?.()
    initialized.value = true
  }
 
  async function loadPermissions() {
    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (!sessionData?.session) {
        perms.value = []
        return
      }

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
      const { data: userData, error: userErr } = await supabase.auth.getUser()
      if (userErr) console.warn('getUser error:', userErr)
 
      const user = userData?.user
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
 
      perms.value = Array.from(permsSet)
      
    } catch (e) {
      console.error('loadPermissions fatal:', e)
      perms.value = []
    }
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
 
 