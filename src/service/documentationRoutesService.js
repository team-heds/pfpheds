/**
 * Documentation Routes Service
 * Gère les routes de documentation avec Supabase et contrôle d'accès
 */

import { supabase } from '@/lib/supabase'

/**
 * Récupère toutes les routes de documentation actives
 * @returns {Promise<Array>} Liste des routes de documentation
 */
export const getActiveDocumentationRoutes = async () => {
  try {
    const { data, error } = await supabase
      .from('active_documentation_routes')
      .select('*')
      .order('category', { ascending: true })
      .order('title', { ascending: true })

    if (error) throw error

    console.log('[DocumentationRoutes] Routes actives récupérées:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('[DocumentationRoutes] Erreur lors de la récupération des routes:', error)
    throw error
  }
}

/**
 * Récupère les routes de documentation accessibles pour l'utilisateur connecté
 * @returns {Promise<Array>} Liste des routes accessibles
 */
export const getUserDocumentationRoutes = async () => {
  try {
    const { data: userData } = await supabase.auth.getUser()
    
    if (!userData?.user) {
      console.warn('[DocumentationRoutes] Utilisateur non connecté')
      return []
    }

    const { data, error } = await supabase
      .rpc('get_user_documentation_routes', {
        p_user_id: userData.user.id
      })

    if (error) throw error

    console.log('[DocumentationRoutes] Routes accessibles pour l\'utilisateur:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('[DocumentationRoutes] Erreur lors de la récupération des routes utilisateur:', error)
    throw error
  }
}

/**
 * Vérifie si l'utilisateur peut accéder à une route spécifique
 * @param {string} routePath - Chemin de la route (ex: '/docs/primevue')
 * @returns {Promise<boolean>} True si l'utilisateur a accès
 */
export const canAccessDocumentationRoute = async (routePath) => {
  try {
    const { data: userData } = await supabase.auth.getUser()
    
    if (!userData?.user) {
      console.warn('[DocumentationRoutes] Utilisateur non connecté')
      return false
    }

    const { data, error } = await supabase
      .rpc('user_can_access_documentation_route', {
        p_route_path: routePath,
        p_user_id: userData.user.id
      })

    if (error) throw error

    console.log(`[DocumentationRoutes] Accès à ${routePath}:`, data)
    return data === true
  } catch (error) {
    console.error('[DocumentationRoutes] Erreur lors de la vérification d\'accès:', error)
    return false
  }
}

/**
 * Récupère une route de documentation par son chemin
 * @param {string} routePath - Chemin de la route
 * @returns {Promise<Object|null>} Route de documentation ou null
 */
export const getDocumentationRouteByPath = async (routePath) => {
  try {
    const { data, error } = await supabase
      .from('documentation_routes')
      .select('*')
      .eq('route_path', routePath)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn('[DocumentationRoutes] Route non trouvée:', routePath)
        return null
      }
      throw error
    }

    console.log('[DocumentationRoutes] Route récupérée:', data?.title)
    return data
  } catch (error) {
    console.error('[DocumentationRoutes] Erreur lors de la récupération de la route:', error)
    throw error
  }
}

/**
 * Récupère les routes de documentation par catégorie
 * @param {string} category - Catégorie (development, api, user-help, etc.)
 * @returns {Promise<Array>} Liste des routes de la catégorie
 */
export const getDocumentationRoutesByCategory = async (category) => {
  try {
    const { data, error } = await supabase
      .from('active_documentation_routes')
      .select('*')
      .eq('category', category)
      .order('title', { ascending: true })

    if (error) throw error

    console.log(`[DocumentationRoutes] Routes de la catégorie ${category}:`, data?.length || 0)
    return data || []
  } catch (error) {
    console.error('[DocumentationRoutes] Erreur lors de la récupération par catégorie:', error)
    throw error
  }
}

/**
 * Crée une nouvelle route de documentation (Admin uniquement)
 * @param {Object} routeData - Données de la route
 * @returns {Promise<Object>} Route créée
 */
export const createDocumentationRoute = async (routeData) => {
  try {
    const { data: userData } = await supabase.auth.getUser()

    const { data, error } = await supabase
      .from('documentation_routes')
      .insert({
        ...routeData,
        created_by: userData?.user?.id
      })
      .select()
      .single()

    if (error) throw error

    console.log('[DocumentationRoutes] Route créée:', data?.title)
    return data
  } catch (error) {
    console.error('[DocumentationRoutes] Erreur lors de la création de la route:', error)
    throw error
  }
}

/**
 * Met à jour une route de documentation (Admin uniquement)
 * @param {string} routeId - ID de la route
 * @param {Object} updates - Modifications à apporter
 * @returns {Promise<Object>} Route mise à jour
 */
export const updateDocumentationRoute = async (routeId, updates) => {
  try {
    const { data, error } = await supabase
      .from('documentation_routes')
      .update(updates)
      .eq('id', routeId)
      .select()
      .single()

    if (error) throw error

    console.log('[DocumentationRoutes] Route mise à jour:', data?.title)
    return data
  } catch (error) {
    console.error('[DocumentationRoutes] Erreur lors de la mise à jour de la route:', error)
    throw error
  }
}

/**
 * Supprime une route de documentation (Admin uniquement)
 * @param {string} routeId - ID de la route
 * @returns {Promise<boolean>} True si supprimée avec succès
 */
export const deleteDocumentationRoute = async (routeId) => {
  try {
    const { error } = await supabase
      .from('documentation_routes')
      .delete()
      .eq('id', routeId)

    if (error) throw error

    console.log('[DocumentationRoutes] Route supprimée:', routeId)
    return true
  } catch (error) {
    console.error('[DocumentationRoutes] Erreur lors de la suppression de la route:', error)
    throw error
  }
}

/**
 * Active ou désactive une route de documentation (Admin uniquement)
 * @param {string} routeId - ID de la route
 * @param {boolean} isActive - Nouvel état actif/inactif
 * @returns {Promise<Object>} Route mise à jour
 */
export const toggleDocumentationRouteActive = async (routeId, isActive) => {
  try {
    const { data, error } = await supabase
      .from('documentation_routes')
      .update({ is_active: isActive })
      .eq('id', routeId)
      .select()
      .single()

    if (error) throw error

    console.log(`[DocumentationRoutes] Route ${isActive ? 'activée' : 'désactivée'}:`, data?.title)
    return data
  } catch (error) {
    console.error('[DocumentationRoutes] Erreur lors du changement d\'état de la route:', error)
    throw error
  }
}

/**
 * Récupère les statistiques des routes de documentation
 * @returns {Promise<Object>} Statistiques
 */
export const getDocumentationRoutesStats = async () => {
  try {
    const { data, error } = await supabase
      .from('documentation_routes')
      .select('category, is_active')

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      active: data?.filter(r => r.is_active).length || 0,
      inactive: data?.filter(r => !r.is_active).length || 0,
      byCategory: {}
    }

    // Compter par catégorie
    data?.forEach(route => {
      if (!stats.byCategory[route.category]) {
        stats.byCategory[route.category] = { total: 0, active: 0, inactive: 0 }
      }
      stats.byCategory[route.category].total++
      if (route.is_active) {
        stats.byCategory[route.category].active++
      } else {
        stats.byCategory[route.category].inactive++
      }
    })

    console.log('[DocumentationRoutes] Statistiques:', stats)
    return stats
  } catch (error) {
    console.error('[DocumentationRoutes] Erreur lors de la récupération des statistiques:', error)
    throw error
  }
}

export default {
  getActiveDocumentationRoutes,
  getUserDocumentationRoutes,
  canAccessDocumentationRoute,
  getDocumentationRouteByPath,
  getDocumentationRoutesByCategory,
  createDocumentationRoute,
  updateDocumentationRoute,
  deleteDocumentationRoute,
  toggleDocumentationRouteActive,
  getDocumentationRoutesStats
}
