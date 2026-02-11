/**
 * Guard de navigation pour vérifier les permissions sur les modules
 * Empêche l'accès aux modules dont l'utilisateur n'est pas responsable
 */

import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/supabase'

/**
 * Vérifie si l'utilisateur peut accéder à un module
 * @param {Object} to - Route de destination
 * @param {Object} from - Route d'origine
 * @param {Function} next - Fonction de navigation
 */
export async function modulePermissionGuard(to, from, next) {
  const authStore = useAuthStore()
  const userEmail = authStore.user?.email
  
  // Si pas d'email, rediriger vers login
  if (!userEmail) {
    console.warn('❌ [ModuleGuard] Pas d\'utilisateur connecté')
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  // Vérifier si la route nécessite une vérification de propriété du module
  if (to.meta.requiresModuleOwnership && to.params.id) {
    const moduleId = to.params.id
    
    try {
      if (import.meta.env.DEV) console.log(`🔍 [ModuleGuard] Vérification accès module ${moduleId} pour ${userEmail}`)
      
      // Récupérer le module depuis Supabase
      const { data: module, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', moduleId)
        .single()
      
      if (error || !module) {
        console.error('❌ [ModuleGuard] Module non trouvé:', error)
        next({
          path: '/admin/dashboard-rm',
          query: { error: 'Module non trouvé' }
        })
        return
      }
      
      // Vérifier si l'utilisateur est admin
      const { data: roles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_email', userEmail)
      
      const isAdmin = roles?.some(r => r.role === 'admin')
      
      // Vérifier si l'utilisateur est le responsable du module
      const isOwner = module.responsable_email === userEmail
      
      // Vérifier si l'utilisateur est le coordinateur du module (peut être une liste séparée par des virgules)
      let isCoordinateur = false
      if (module.coordinateur && typeof module.coordinateur === 'string') {
        const coordinators = module.coordinateur.split(',').map(e => e.trim().toLowerCase())
        isCoordinateur = coordinators.includes(userEmail.toLowerCase())
      }
      
      // Fallback: vérifier par nom si responsable_email n'est pas défini
      let matchByName = false
      if (!module.responsable_email && module.responsable) {
        const emailName = userEmail.split('@')[0].toLowerCase()
        const responsableName = module.responsable.toLowerCase()
        matchByName = responsableName.includes(emailName)
      }
      
      if (isAdmin || isOwner || isCoordinateur || matchByName) {
        if (import.meta.env.DEV) console.log('✅ [ModuleGuard] Accès autorisé')
        next()
      } else {
        console.warn('❌ [ModuleGuard] Accès refusé - Pas le responsable')
        next({
          path: '/admin/dashboard-rm',
          query: { 
            error: 'Vous n\'êtes pas autorisé à accéder à ce module',
            moduleId: moduleId
          }
        })
      }
    } catch (error) {
      console.error('❌ [ModuleGuard] Erreur vérification:', error)
      next({
        path: '/admin/dashboard-rm',
        query: { error: 'Erreur de vérification des permissions' }
      })
    }
  } else {
    // Pas de vérification nécessaire, continuer
    next()
  }
}

/**
 * Vérifie si l'utilisateur a le rôle admin
 * @param {Object} to - Route de destination
 * @param {Object} from - Route d'origine  
 * @param {Function} next - Fonction de navigation
 */
export async function adminOnlyGuard(to, from, next) {
  const authStore = useAuthStore()
  const userEmail = authStore.user?.email
  
  if (!userEmail) {
    next({ path: '/login', query: { redirect: to.fullPath } })
    return
  }
  
  try {
    // Vérifier si l'utilisateur est admin
    const { data: roles, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_email', userEmail)
    
    if (error) {
      console.error('Erreur vérification rôle admin:', error)
      next({ path: '/admin/dashboard-rm', query: { error: 'Erreur de vérification' } })
      return
    }
    
    const isAdmin = roles?.some(r => r.role === 'admin')
    
    if (isAdmin) {
      next()
    } else {
      console.warn('Accès admin refusé pour:', userEmail)
      next({ path: '/admin/dashboard-rm', query: { error: 'Accès réservé aux administrateurs' } })
    }
  } catch (error) {
    console.error('Erreur guard admin:', error)
    next({ path: '/admin/dashboard-rm', query: { error: 'Erreur de vérification' } })
  }
}
