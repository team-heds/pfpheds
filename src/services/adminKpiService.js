/**
 * Service pour récupérer les KPI administratifs depuis Supabase
 */
import { supabase } from '@/supabase'
import { getDatabase, ref as dbRef, get } from 'firebase/database'

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
 * Récupère le nombre de rôles configurés
 */
export async function getTotalRoles() {
  try {
    // Option 1: Si table rbac_roles existe
    const { data, error } = await supabase
      .from('rbac_roles')
      .select('id')
    
    if (error) {
      // Option 2: Compter les rôles distincts dans user_profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('role')
      
      if (profiles) {
        const uniqueRoles = [...new Set(profiles.map(p => p.role).filter(Boolean))]
        return uniqueRoles.length
      }
      return 0
    }
    
    return data?.length || 0
  } catch (error) {
    console.error('Erreur getTotalRoles:', error)
    return 0
  }
}

/**
 * Récupère le nombre de permissions actives
 */
export async function getActivePermissions() {
  try {
    const { count, error } = await supabase
      .from('rbac_permissions')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    if (error) {
      // Fallback: compter toutes les permissions si pas de colonne is_active
      const { count: totalCount } = await supabase
        .from('rbac_permissions')
        .select('*', { count: 'exact', head: true })
      
      return totalCount || 0
    }
    
    return count || 0
  } catch (error) {
    console.error('Erreur getActivePermissions:', error)
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
    const { count, error } = await supabase
      .from('places')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'available')
    
    if (error) {
      // Fallback: essayer avec is_available
      const { count: availCount } = await supabase
        .from('places')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', true)
      
      return availCount || 0
    }
    
    return count || 0
  } catch (error) {
    console.error('Erreur getAvailablePlaces:', error)
    return 0
  }
}

/**
 * Récupère le nombre de votations actives
 */
export async function getActiveVotations() {
  try {
    const { count, error } = await supabase
      .from('votations')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active')
    
    if (error) throw error
    return count || 0
  } catch (error) {
    console.error('Erreur getActiveVotations:', error)
    return 0
  }
}

/**
 * Récupère le nombre de modules académiques (Firebase)
 */
export async function getTotalModules() {
  try {
    const db = getDatabase()
    const snapshot = await get(dbRef(db, 'Media/Modules'))
    const modules = snapshot.val()
    
    if (!modules) return 0
    return Object.keys(modules).length
  } catch (error) {
    console.error('Erreur getTotalModules:', error)
    return 0
  }
}

/**
 * Récupère le nombre d'utilisateurs par rôle
 */
export async function getUsersByRole() {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('role')
    
    if (error) throw error
    
    const counts = {}
    data?.forEach(profile => {
      const role = profile.role || 'unknown'
      counts[role] = (counts[role] || 0) + 1
    })
    
    return counts
  } catch (error) {
    console.error('Erreur getUsersByRole:', error)
    return {}
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
      activeVotations,
      totalModules,
      usersByRole
    ] = await Promise.all([
      getTotalUsers(),
      getTotalRoles(),
      getActivePermissions(),
      getTotalInstitutions(),
      getTotalPlaces(),
      getAvailablePlaces(),
      getActiveVotations(),
      getTotalModules(),
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
      activeVotations,
      totalModules,
      usersByRole
    }
    
    console.log('✅ [getAllAdminKpis] Résultat final:', result)
    return result
  } catch (error) {
    console.error('Erreur getAllAdminKpis:', error)
    return {
      totalUsers: 0,
      totalRoles: 0,
      activePermissions: 0,
      totalRoutes: 0,
      totalInstitutions: 0,
      totalPlaces: 0,
      availablePlaces: 0,
      activeVotations: 0,
      totalModules: 0,
      usersByRole: {}
    }
  }
}
