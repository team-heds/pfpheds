/**
 * Composable pour gérer les permissions des modules
 * Permet de vérifier si un utilisateur peut voir/éditer un module
 */

import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/supabase'

export function useModulePermissions() {
  const authStore = useAuthStore()

  /**
   * Email de l'utilisateur connecté
   */
  const userEmail = computed(() => {
    return authStore.user?.email || null
  })

  /**
   * Vérifie si l'utilisateur est admin
   */
  const isAdmin = computed(() => {
    // Vérifier dans les rôles Supabase ou dans un store de rôles
    // Pour l'instant, on peut utiliser une liste simple
    const adminEmails = [
      'admin@hevs.ch',
      'antoine.quarroz@hevs.ch'
      // Ajoutez d'autres admins ici
    ]
    
    return adminEmails.includes(userEmail.value)
  })

  /**
   * Vérifie si l'utilisateur est responsable d'un module spécifique
   * @param {Object} module - Le module à vérifier
   * @returns {Boolean}
   */
  const isModuleOwner = (module) => {
    if (!module || !userEmail.value) return false
    
    // Admin a accès à tout
    if (isAdmin.value) return true
    
    // Vérifier si l'email correspond
    if (module.responsable_email === userEmail.value) return true
    
    // Fallback: vérifier par nom (moins fiable)
    if (module.responsable && userEmail.value) {
      const emailName = userEmail.value.split('@')[0].toLowerCase()
      const responsableName = module.responsable.toLowerCase()
      return responsableName.includes(emailName)
    }
    
    return false
  }

  /**
   * Vérifie si l'utilisateur peut voir un module
   * @param {Object} module
   * @returns {Boolean}
   */
  const canViewModule = (module) => {
    // Admin peut tout voir
    if (isAdmin.value) return true
    
    // Responsable peut voir ses modules
    return isModuleOwner(module)
  }

  /**
   * Vérifie si l'utilisateur peut éditer un module
   * @param {Object} module
   * @returns {Boolean}
   */
  const canEditModule = (module) => {
    // Admin peut tout éditer
    if (isAdmin.value) return true
    
    // Responsable peut éditer ses modules
    return isModuleOwner(module)
  }

  /**
   * Vérifie si l'utilisateur peut créer des modules
   * @returns {Boolean}
   */
  const canCreateModule = computed(() => {
    // Seuls les admins peuvent créer des modules
    return isAdmin.value
  })

  /**
   * Vérifie si l'utilisateur peut supprimer un module
   * @param {Object} module
   * @returns {Boolean}
   */
  const canDeleteModule = (module) => {
    // Seuls les admins peuvent supprimer
    return isAdmin.value
  }

  /**
   * Récupère les rôles de l'utilisateur depuis Supabase
   * @returns {Promise<Array>}
   */
  const getUserRoles = async () => {
    if (!userEmail.value) return []
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_email', userEmail.value)
      
      if (error) {
        console.error('Erreur récupération rôles:', error)
        return []
      }
      
      return data.map(r => r.role)
    } catch (error) {
      console.error('Erreur getUserRoles:', error)
      return []
    }
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   * @param {String} role - Le rôle à vérifier
   * @returns {Promise<Boolean>}
   */
  const hasRole = async (role) => {
    const roles = await getUserRoles()
    return roles.includes(role)
  }

  /**
   * Filtrer les modules accessibles par l'utilisateur
   * @param {Array} modules - Liste de tous les modules
   * @returns {Array} - Modules accessibles
   */
  const filterAccessibleModules = (modules) => {
    if (!modules || !Array.isArray(modules)) return []
    
    // Admin voit tout
    if (isAdmin.value) return modules
    
    // Filtrer par responsable
    return modules.filter(module => isModuleOwner(module))
  }

  /**
   * Obtenir un message d'erreur de permission
   * @param {String} action - L'action tentée (view, edit, delete, create)
   * @returns {String}
   */
  const getPermissionErrorMessage = (action) => {
    const messages = {
      view: "Vous n'avez pas la permission de voir ce module",
      edit: "Vous n'avez pas la permission de modifier ce module",
      delete: "Seuls les administrateurs peuvent supprimer des modules",
      create: "Seuls les administrateurs peuvent créer des modules"
    }
    
    return messages[action] || "Permission refusée"
  }

  return {
    // Computed
    userEmail,
    isAdmin,
    canCreateModule,
    
    // Methods
    isModuleOwner,
    canViewModule,
    canEditModule,
    canDeleteModule,
    getUserRoles,
    hasRole,
    filterAccessibleModules,
    getPermissionErrorMessage
  }
}
