import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { supabase } from '@/supabase'

/**
 * Store pour la gestion des filières (SI/PHY) et rôles multi-casquettes
 * Permet de:
 * - Charger les filières accessibles à l'utilisateur
 * - Changer de filière active
 * - Vérifier les permissions par filière
 */
export const useTrackStore = defineStore('track', () => {
  // ============================================
  // STATE
  // ============================================
  const tracks = ref([])                    // Toutes les filières disponibles
  const userTrackRoles = ref([])            // Rôles de l'utilisateur par filière
  const activeTrackId = ref(null)           // Filière actuellement sélectionnée
  const loading = ref(false)
  const error = ref(null)
  const initialized = ref(false)

  // ============================================
  // GETTERS
  // ============================================
  
  // Vérifie si l'utilisateur est SuperAdmin (accès à tout)
  const isSuperAdmin = computed(() => {
    return userTrackRoles.value.some(r => r.role === 'SUPER_ADMIN')
  })

  // Vérifie si l'utilisateur est Secrétariat
  const isSecretariat = computed(() => {
    return userTrackRoles.value.some(r => r.role === 'SECRETARIAT')
  })

  // Vérifie si l'utilisateur est RF (Responsable Filière)
  const isRF = computed(() => {
    return userTrackRoles.value.some(r => r.role === 'RF')
  })

  // Filières accessibles à l'utilisateur
  const accessibleTracks = computed(() => {
    if (isSuperAdmin.value) {
      return tracks.value.filter(t => t.is_active)
    }
    const userTrackIds = [...new Set(userTrackRoles.value.map(r => r.track_id))]
    return tracks.value.filter(t => t.is_active && userTrackIds.includes(t.id))
  })

  // Vérifie si l'utilisateur a accès aux deux filières
  const hasAccessBoth = computed(() => {
    return accessibleTracks.value.length >= 2
  })

  // Filière active (objet complet)
  const activeTrack = computed(() => {
    return tracks.value.find(t => t.id === activeTrackId.value) || null
  })

  // Rôles de l'utilisateur pour la filière active
  const activeTrackRoles = computed(() => {
    if (!activeTrackId.value) return []
    return userTrackRoles.value
      .filter(r => r.track_id === activeTrackId.value || r.role === 'SUPER_ADMIN')
      .map(r => r.role)
  })

  // Rôles groupés par filière
  const rolesByTrack = computed(() => {
    const result = {}
    userTrackRoles.value.forEach(role => {
      const trackId = role.track_id || 'GLOBAL'
      if (!result[trackId]) {
        result[trackId] = []
      }
      result[trackId].push(role.role)
    })
    return result
  })

  // ============================================
  // ACTIONS
  // ============================================

  /**
   * Initialise le store (charger tracks + rôles utilisateur)
   */
  async function init() {
    if (initialized.value) return
    
    loading.value = true
    error.value = null
    
    try {
      // 1. Charger toutes les filières
      await loadTracks()
      
      // 2. Charger les rôles de l'utilisateur
      await loadUserRoles()
      
      // 3. Définir la filière active par défaut
      if (!activeTrackId.value && accessibleTracks.value.length > 0) {
        activeTrackId.value = accessibleTracks.value[0].id
      }
      
      initialized.value = true
    } catch (e) {
      error.value = e.message
      console.error('❌ [trackStore] Erreur init:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Charge toutes les filières depuis Supabase
   */
  async function loadTracks() {
    const { data, error: err } = await supabase
      .from('tracks')
      .select('*')
      .eq('is_active', true)
      .order('display_order')
    
    if (err) throw err
    tracks.value = data || []
  }

  /**
   * Charge les rôles de l'utilisateur via RPC
   */
  async function loadUserRoles() {
    // Essayer d'abord via RPC
    const { data: rpcData, error: rpcError } = await supabase.rpc('api_my_track_roles')
    
    if (!rpcError && rpcData) {
      userTrackRoles.value = rpcData
      return
    }
    
    // Fallback: charger directement depuis la table
    console.warn('⚠️ [trackStore] RPC échouée, fallback direct:', rpcError?.message)
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      userTrackRoles.value = []
      return
    }

    const { data, error: err } = await supabase
      .from('user_track_roles')
      .select(`
        track_id,
        role,
        granted_at,
        tracks(label, color)
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (err) {
      console.error('❌ [trackStore] Erreur chargement rôles:', err)
      // Essayer de charger les rôles legacy
      await loadLegacyRoles(user.id)
      return
    }

    userTrackRoles.value = (data || []).map(r => ({
      track_id: r.track_id,
      track_label: r.tracks?.label,
      track_color: r.tracks?.color,
      role: r.role,
      granted_at: r.granted_at
    }))
    
  }

  /**
   * Fallback: charger les rôles depuis user_profiles (ancien système)
   */
  async function loadLegacyRoles(userId) {
    const { data: profile, error: err } = await supabase
      .from('user_profiles')
      .select('role, permissions')
      .eq('user_id', userId)
      .maybeSingle()

    if (err || !profile) {
      console.warn('⚠️ [trackStore] Pas de profil legacy trouvé')
      userTrackRoles.value = []
      return
    }

    const roles = []
    const perms = profile.permissions || []
    const role = profile.role

    // Mapper les anciens rôles vers le nouveau format
    const legacyMap = {
      'super.all': { track: 'SI', role: 'SUPER_ADMIN' },
      'admin': { track: 'SI', role: 'SUPER_ADMIN' },
      'AdminSoins': { track: 'SI', role: 'ADMIN' },
      'AdminPhysio': { track: 'PHY', role: 'ADMIN' },
      'RMSoins': { track: 'SI', role: 'RM' },
      'RMPhysio': { track: 'PHY', role: 'RM' },
      'EnseignantSoins': { track: 'SI', role: 'TEACHER' },
      'EnseignantPhysio': { track: 'PHY', role: 'TEACHER' },
      'EtudiantSoins': { track: 'SI', role: 'STUDENT' },
      'EtudiantPhysio': { track: 'PHY', role: 'STUDENT' }
    }

    // Vérifier le rôle principal
    if (role && legacyMap[role]) {
      roles.push({
        track_id: legacyMap[role].track,
        role: legacyMap[role].role,
        track_label: legacyMap[role].track === 'SI' ? 'Soins Infirmiers' : 'Physiothérapie'
      })
    }

    // Vérifier les permissions
    if (Array.isArray(perms)) {
      perms.forEach(p => {
        if (legacyMap[p]) {
          roles.push({
            track_id: legacyMap[p].track,
            role: legacyMap[p].role,
            track_label: legacyMap[p].track === 'SI' ? 'Soins Infirmiers' : 'Physiothérapie'
          })
        }
      })
    }

    userTrackRoles.value = roles
  }

  /**
   * Change la filière active
   */
  function setActiveTrack(trackId) {
    if (canAccessTrack(trackId)) {
      activeTrackId.value = trackId
    } else {
      console.warn('⚠️ [trackStore] Accès refusé à la filière:', trackId)
    }
  }

  /**
   * Vérifie si l'utilisateur peut accéder à une filière
   */
  function canAccessTrack(trackId) {
    if (isSuperAdmin.value) return true
    return userTrackRoles.value.some(r => r.track_id === trackId)
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique pour une filière
   */
  function hasTrackRole(trackId, role) {
    if (isSuperAdmin.value) return true
    return userTrackRoles.value.some(r => 
      r.track_id === trackId && r.role === role
    )
  }

  /**
   * Vérifie si l'utilisateur a l'un des rôles spécifiés pour une filière
   */
  function hasAnyTrackRole(trackId, roles) {
    if (isSuperAdmin.value) return true
    return userTrackRoles.value.some(r => 
      r.track_id === trackId && roles.includes(r.role)
    )
  }

  /**
   * Vérifie si l'utilisateur a au moins un certain niveau d'accès
   * Ordre: SUPER_ADMIN > SECRETARIAT > RF > ADMIN > RM > TEACHER > STUDENT
   */
  function hasMinRole(trackId, minRole) {
    const roleOrder = {
      'SUPER_ADMIN': 1,
      'SECRETARIAT': 2,
      'RF': 3,
      'ADMIN': 4,
      'RM': 5,
      'TEACHER': 6,
      'STUDENT': 7
    }
    
    const minLevel = roleOrder[minRole] || 99
    
    if (isSuperAdmin.value) return true
    
    return userTrackRoles.value.some(r => {
      if (r.track_id !== trackId) return false
      const userLevel = roleOrder[r.role] || 99
      return userLevel <= minLevel
    })
  }

  /**
   * Reset le store (déconnexion)
   */
  function reset() {
    tracks.value = []
    userTrackRoles.value = []
    activeTrackId.value = null
    loading.value = false
    error.value = null
    initialized.value = false
  }

  // ============================================
  // RETURN
  // ============================================
  return {
    // State
    tracks,
    userTrackRoles,
    activeTrackId,
    loading,
    error,
    initialized,
    
    // Getters
    isSuperAdmin,
    isSecretariat,
    isRF,
    accessibleTracks,
    hasAccessBoth,
    activeTrack,
    activeTrackRoles,
    rolesByTrack,
    
    // Actions
    init,
    loadTracks,
    loadUserRoles,
    setActiveTrack,
    canAccessTrack,
    hasTrackRole,
    hasAnyTrackRole,
    hasMinRole,
    reset
  }
})
