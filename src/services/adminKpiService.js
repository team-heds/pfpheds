/**
 * Service pour récupérer les KPI administratifs depuis Supabase
 * TABLES RÉELLES: user_profiles, roles, permissions, institutions, places, etc.
 */
import { supabase } from '@/supabase'

/**
 * Récupère le nombre total d'utilisateurs
 */
export async function getTotalUsers() {
  try {
    console.log('📊 [getTotalUsers] Requête vers user_profiles...')
    const { count, error } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ [getTotalUsers] Erreur Supabase:', error)
      throw error
    }
    
    console.log('✅ [getTotalUsers] Nombre d\'utilisateurs:', count)
    return count || 0
  } catch (error) {
    console.error('❌ [getTotalUsers] Erreur:', error)
    return 0
  }
}

/**
 * Récupère les utilisateurs par rôle (étudiants, profs, etc.)
 */
export async function getUsersByRole() {
  try {
    console.log('👥 [getUsersByRole] Requête utilisateurs par rôle...')
    
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('role')
    
    if (error) {
      console.error('❌ [getUsersByRole] Erreur:', error)
      return {}
    }
    
    // Compter par rôle
    const roleCount = {}
    profiles?.forEach(profile => {
      const role = profile.role || 'unknown'
      roleCount[role] = (roleCount[role] || 0) + 1
    })
    
    console.log('✅ [getUsersByRole] Répartition:', roleCount)
    return roleCount
  } catch (error) {
    console.error('❌ [getUsersByRole] Erreur:', error)
    return {}
  }
}

/**
 * Récupère le nombre de rôles configurés (depuis la table roles)
 */
export async function getTotalRoles() {
  try {
    console.log('🎭 [getTotalRoles] Requête vers roles...')
    
    const { count, error } = await supabase
      .from('roles')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ [getTotalRoles] Erreur:', error)
      return 0
    }
    
    console.log('✅ [getTotalRoles] Nombre de rôles:', count)
    return count || 0
  } catch (error) {
    console.error('❌ [getTotalRoles] Erreur:', error)
    return 0
  }
}

/**
 * Récupère le nombre de permissions actives (depuis la table permissions)
 */
export async function getActivePermissions() {
  try {
    console.log('🔑 [getActivePermissions] Requête vers permissions...')
    
    const { count, error } = await supabase
      .from('permissions')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ [getActivePermissions] Erreur:', error)
      return 0
    }
    
    console.log('✅ [getActivePermissions] Nombre de permissions:', count)
    return count || 0
  } catch (error) {
    console.error('❌ [getActivePermissions] Erreur:', error)
    return 0
  }
}

/**
 * Récupère le nombre total de routes (depuis router Vue)
 */
export function getTotalRoutes(router) {
  try {
    const routes = router.getRoutes()
    return routes.length
  } catch (error) {
    console.error('Erreur getTotalRoutes:', error)
    return 0
  }
}

/**
 * Récupère le nombre d'institutions
 */
export async function getTotalInstitutions() {
  try {
    console.log('🏥 [getTotalInstitutions] Requête vers institutions...')
    const { count, error } = await supabase
      .from('institutions')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ [getTotalInstitutions] Erreur:', error)
      throw error
    }
    console.log('✅ [getTotalInstitutions] Nombre:', count)
    return count || 0
  } catch (error) {
    console.error('❌ [getTotalInstitutions] Erreur catch:', error)
    return 0
  }
}

/**
 * Récupère le nombre de places de stage
 */
export async function getTotalPlaces() {
  try {
    console.log('📍 [getTotalPlaces] Requête vers places...')
    const { count, error } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ [getTotalPlaces] Erreur:', error)
      throw error
    }
    console.log('✅ [getTotalPlaces] Nombre:', count)
    return count || 0
  } catch (error) {
    console.error('❌ [getTotalPlaces] Erreur catch:', error)
    return 0
  }
}

/**
 * Récupère le nombre de places disponibles
 */
export async function getAvailablePlaces() {
  try {
    console.log('📍 [getAvailablePlaces] Requête places disponibles...')
    
    const { count, error } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .eq('active', true)
    
    if (error) {
      console.error('❌ [getAvailablePlaces] Erreur:', error)
      return 0
    }
    
    console.log('✅ [getAvailablePlaces] Places disponibles:', count)
    return count || 0
  } catch (error) {
    console.error('❌ [getAvailablePlaces] Erreur:', error)
    return 0
  }
}

/**
 * Récupère le nombre de modules académiques
 */
export async function getTotalModules() {
  try {
    console.log('📚 [getTotalModules] Requête vers modules...')
    
    const { count, error } = await supabase
      .from('modules')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ [getTotalModules] Erreur:', error)
      return 0
    }
    
    console.log('✅ [getTotalModules] Nombre de modules:', count)
    return count || 0
  } catch (error) {
    console.error('❌ [getTotalModules] Erreur:', error)
    return 0
  }
}

/**
 * Récupère le nombre de capsules pédagogiques
 */
export async function getTotalCapsules() {
  try {
    console.log('💊 [getTotalCapsules] Requête vers capsules...')
    
    const { count, error } = await supabase
      .from('capsules')
      .select('*', { count: 'exact', head: true })
    
    if (error) {
      console.error('❌ [getTotalCapsules] Erreur:', error)
      return 0
    }
    
    console.log('✅ [getTotalCapsules] Nombre de capsules:', count)
    return count || 0
  } catch (error) {
    console.error('❌ [getTotalCapsules] Erreur:', error)
    return 0
  }
}

/**
 * Récupère toutes les statistiques d'un coup (optimisé)
 */
export async function getAllAdminKpis(router) {
  try {
    console.log('🚀 [getAllAdminKpis] Démarrage récupération KPIs...')
    
    const [
      totalUsers,
      totalRoles,
      activePermissions,
      totalInstitutions,
      totalPlaces,
      availablePlaces,
      totalModules,
      totalCapsules,
      usersByRole
    ] = await Promise.all([
      getTotalUsers(),
      getTotalRoles(),
      getActivePermissions(),
      getTotalInstitutions(),
      getTotalPlaces(),
      getAvailablePlaces(),
      getTotalModules(),
      getTotalCapsules(),
      getUsersByRole()
    ])
    
    const totalRoutes = getTotalRoutes(router)
    
    const result = {
      totalUsers,
      totalRoles,
      activePermissions,
      totalRoutes,
      totalInstitutions,
      totalPlaces,
      availablePlaces,
      totalModules,
      totalCapsules,
      usersByRole
    }
    
    console.log('✅ [getAllAdminKpis] Résultat final:', result)
    return result
  } catch (error) {
    console.error('❌ [getAllAdminKpis] Erreur:', error)
    return {
      totalUsers: 0,
      totalRoles: 0,
      activePermissions: 0,
      totalRoutes: 0,
      totalInstitutions: 0,
      totalPlaces: 0,
      availablePlaces: 0,
      totalModules: 0,
      totalCapsules: 0,
      usersByRole: {}
    }
  }
}
