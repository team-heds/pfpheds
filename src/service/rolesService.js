import { db } from '../../firebase.js'
import { ref as dbRef, get, set, update, push, remove } from 'firebase/database'
import { getAuth } from 'firebase/auth'
import { supabase } from '@/supabase'

// Définition des rôles et permissions
export const ROLES = {
  GAME_MASTER: 'game_master',
  HOUSE_COACH: 'house_coach', 
  PROFESSOR: 'professor',
  ADMIN: 'admin',
  STUDENT: 'student'
}

export const PERMISSIONS = {
  // Gestion complète du système
  MANAGE_ALL: 'manage_all',
  
  // Gestion des défis
  CREATE_CHALLENGES: 'create_challenges',
  EDIT_CHALLENGES: 'edit_challenges',
  DELETE_CHALLENGES: 'delete_challenges',
  VIEW_CHALLENGES: 'view_challenges',
  
  // Gestion des quêtes
  CREATE_QUESTS: 'create_quests',
  EDIT_QUESTS: 'edit_quests',
  DELETE_QUESTS: 'delete_quests',
  VIEW_QUESTS: 'view_quests',
  
  // Gestion des badges
  CREATE_BADGES: 'create_badges',
  EDIT_BADGES: 'edit_badges',
  DELETE_BADGES: 'delete_badges',
  VIEW_BADGES: 'view_badges',
  
  // Gestion des utilisateurs
  MANAGE_USERS: 'manage_users',
  ASSIGN_ROLES: 'assign_roles',
  VIEW_USER_STATS: 'view_user_stats',
  
  // Gestion des maisons
  MANAGE_HOUSES: 'manage_houses',
  MANAGE_HOUSE_POINTS: 'manage_house_points',
  VIEW_HOUSE_STATS: 'view_house_stats',
  
  // Analytics et statistiques
  VIEW_ANALYTICS: 'view_analytics',
  EXPORT_DATA: 'export_data'
}

// Configuration des permissions par rôle
export const ROLE_PERMISSIONS = {
  [ROLES.GAME_MASTER]: [
    PERMISSIONS.MANAGE_ALL,
    PERMISSIONS.CREATE_CHALLENGES,
    PERMISSIONS.EDIT_CHALLENGES,
    PERMISSIONS.DELETE_CHALLENGES,
    PERMISSIONS.VIEW_CHALLENGES,
    PERMISSIONS.CREATE_QUESTS,
    PERMISSIONS.EDIT_QUESTS,
    PERMISSIONS.DELETE_QUESTS,
    PERMISSIONS.VIEW_QUESTS,
    PERMISSIONS.CREATE_BADGES,
    PERMISSIONS.EDIT_BADGES,
    PERMISSIONS.DELETE_BADGES,
    PERMISSIONS.VIEW_BADGES,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.ASSIGN_ROLES,
    PERMISSIONS.VIEW_USER_STATS,
    PERMISSIONS.MANAGE_HOUSES,
    PERMISSIONS.MANAGE_HOUSE_POINTS,
    PERMISSIONS.VIEW_HOUSE_STATS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA
  ],
  
  [ROLES.HOUSE_COACH]: [
    PERMISSIONS.CREATE_CHALLENGES,
    PERMISSIONS.EDIT_CHALLENGES,
    PERMISSIONS.VIEW_CHALLENGES,
    PERMISSIONS.CREATE_QUESTS,
    PERMISSIONS.EDIT_QUESTS,
    PERMISSIONS.VIEW_QUESTS,
    PERMISSIONS.VIEW_BADGES,
    PERMISSIONS.VIEW_USER_STATS,
    PERMISSIONS.MANAGE_HOUSE_POINTS,
    PERMISSIONS.VIEW_HOUSE_STATS,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  
  [ROLES.PROFESSOR]: [
    PERMISSIONS.CREATE_CHALLENGES,
    PERMISSIONS.EDIT_CHALLENGES,
    PERMISSIONS.VIEW_CHALLENGES,
    PERMISSIONS.VIEW_QUESTS,
    PERMISSIONS.VIEW_BADGES,
    PERMISSIONS.VIEW_USER_STATS,
    PERMISSIONS.VIEW_HOUSE_STATS,
    PERMISSIONS.VIEW_ANALYTICS
  ],
  
  [ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_ALL,
    PERMISSIONS.CREATE_CHALLENGES,
    PERMISSIONS.EDIT_CHALLENGES,
    PERMISSIONS.DELETE_CHALLENGES,
    PERMISSIONS.VIEW_CHALLENGES,
    PERMISSIONS.CREATE_QUESTS,
    PERMISSIONS.EDIT_QUESTS,
    PERMISSIONS.DELETE_QUESTS,
    PERMISSIONS.VIEW_QUESTS,
    PERMISSIONS.CREATE_BADGES,
    PERMISSIONS.EDIT_BADGES,
    PERMISSIONS.DELETE_BADGES,
    PERMISSIONS.VIEW_BADGES,
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.ASSIGN_ROLES,
    PERMISSIONS.VIEW_USER_STATS,
    PERMISSIONS.MANAGE_HOUSES,
    PERMISSIONS.MANAGE_HOUSE_POINTS,
    PERMISSIONS.VIEW_HOUSE_STATS,
    PERMISSIONS.VIEW_ANALYTICS,
    PERMISSIONS.EXPORT_DATA
  ],
  
  [ROLES.STUDENT]: []
}

// Service de gestion des rôles
class RolesService {
  
  /**
   * Obtenir les rôles depuis Firebase (format legacy { admin: true, editor: false })
   * @param {string} userId - ID utilisateur Firebase
   * @returns {Object} Objet avec les rôles actifs
   */
  async getUserRolesFirebase(userId) {
    try {
      const rolesRef = dbRef(db, `Users/${userId}/Roles`)
      const snapshot = await get(rolesRef)
      return snapshot.val() || {}
    } catch (error) {
      console.error('Erreur lors de la récupération des rôles Firebase:', error)
      return {}
    }
  }
  
  /**
   * Obtenir les rôles depuis Supabase
   * Option 1: user_metadata (stocké directement sur l'utilisateur)
   * Option 2: table user_roles (recommandé pour production)
   * @param {string} userId - ID utilisateur Supabase
   * @returns {Object} Objet avec les rôles actifs
   */
  async getUserRolesSupabase(userId) {
    try {
      // OPTION 1: Récupérer depuis user_metadata (rapide, stocké sur auth)
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError) throw userError
      
      // Si les rôles sont dans user_metadata
      if (user?.user_metadata?.roles) {
        console.log('✅ Rôles trouvés dans user_metadata:', user.user_metadata.roles)
        return user.user_metadata.roles
      }
      
      // OPTION 2: Récupérer depuis une table user_roles (recommandé)
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('role_name, is_active')
        .eq('user_id', userId)
        .eq('is_active', true)
      
      if (!rolesError && rolesData && rolesData.length > 0) {
        // Convertir en format { admin: true, editor: true, ... }
        const rolesObject = {}
        rolesData.forEach(role => {
          if (role.is_active) {
            rolesObject[role.role_name] = true
          }
        })
        
        console.log('✅ Rôles trouvés dans table user_roles:', rolesObject)
        return rolesObject
      }

      // OPTION 3: Récupérer depuis la table user_profiles (utilisée par l'admin panel)
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('role')
        .eq('user_id', userId)
        .single()
      
      if (!profileError && profileData?.role) {
        console.log('✅ Rôle trouvé dans user_profiles:', profileData.role)
        // Convertir le rôle unique en format objet compatible { [role]: true }
        return { [profileData.role]: true }
      }
      
      console.warn('Pas de rôles trouvés, utilisation rôle par défaut')
      return { user: true }
      
    } catch (error) {
      console.error('Erreur lors de la récupération des rôles Supabase:', error)
      return { user: true } // Rôle par défaut
    }
  }
  
  /**
   * Obtenir les rôles d'un utilisateur (Firebase ou Supabase)
   * @param {string} userId - ID utilisateur
   * @param {string} provider - 'firebase' ou 'supabase'
   * @returns {Object} Objet avec les rôles actifs { admin: true, editor: false, ... }
   */
  async getUserRoles(userId, provider = 'firebase') {
    if (provider === 'supabase') {
      return await this.getUserRolesSupabase(userId)
    }
    return await this.getUserRolesFirebase(userId)
  }
  
  // LEGACY: Maintien de la compatibilité avec l'ancien système
  async getUserRole(userId) {
    try {
      const roleRef = dbRef(db, `users/${userId}/role`)
      const snapshot = await get(roleRef)
      return snapshot.val() || ROLES.STUDENT
    } catch (error) {
      console.error('Erreur lors de la récupération du rôle:', error)
      return ROLES.STUDENT
    }
  }
  
  // Définir le rôle d'un utilisateur
  async setUserRole(userId, role) {
    try {
      if (!Object.values(ROLES).includes(role)) {
        throw new Error('Rôle invalide')
      }
      
      const roleRef = dbRef(db, `users/${userId}/role`)
      await set(roleRef, role)
      
      // Log de l'action
      await this.logRoleChange(userId, role)
      
      return true
    } catch (error) {
      console.error('Erreur lors de la définition du rôle:', error)
      throw error
    }
  }
  
  // Vérifier si un utilisateur a une permission
  async hasPermission(userId, permission) {
    try {
      const userRole = await this.getUserRole(userId)
      const rolePermissions = ROLE_PERMISSIONS[userRole] || []
      
      // Le Game Master et Admin ont toutes les permissions
      if (userRole === ROLES.GAME_MASTER || userRole === ROLES.ADMIN) {
        return true
      }
      
      return rolePermissions.includes(permission)
    } catch (error) {
      console.error('Erreur lors de la vérification des permissions:', error)
      return false
    }
  }
  
  // Vérifier si un utilisateur a un rôle spécifique
  async hasRole(userId, role) {
    try {
      const userRole = await this.getUserRole(userId)
      return userRole === role
    } catch (error) {
      console.error('Erreur lors de la vérification du rôle:', error)
      return false
    }
  }
  
  // Obtenir toutes les permissions d'un utilisateur
  async getUserPermissions(userId) {
    try {
      const userRole = await this.getUserRole(userId)
      return ROLE_PERMISSIONS[userRole] || []
    } catch (error) {
      console.error('Erreur lors de la récupération des permissions:', error)
      return []
    }
  }
  
  // Vérifier si l'utilisateur actuel est admin
  async isCurrentUserAdmin() {
    try {
      // 1. Vérifier Firebase
      const auth = getAuth()
      const firebaseUser = auth.currentUser
      
      if (firebaseUser) {
        const userRole = await this.getUserRole(firebaseUser.uid)
        return userRole === ROLES.GAME_MASTER || userRole === ROLES.ADMIN
      }

      // 2. Vérifier Supabase
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      if (supabaseUser) {
        const roles = await this.getUserRolesSupabase(supabaseUser.id)
        return roles[ROLES.ADMIN] === true || roles[ROLES.GAME_MASTER] === true
      }
      
      return false
    } catch (error) {
      console.error('Erreur lors de la vérification admin:', error)
      return false
    }
  }
  
  // Obtenir tous les utilisateurs avec leurs rôles
  async getAllUsersWithRoles() {
    try {
      const usersRef = dbRef(db, 'users')
      const snapshot = await get(usersRef)
      const users = snapshot.val() || {}
      
      const usersWithRoles = []
      
      for (const [userId, userData] of Object.entries(users)) {
        usersWithRoles.push({
          id: userId,
          email: userData.email,
          displayName: userData.displayName,
          house: userData.house,
          role: userData.role || ROLES.STUDENT,
          createdAt: userData.createdAt,
          lastLogin: userData.lastLogin
        })
      }
      
      return usersWithRoles
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error)
      return []
    }
  }
  
  // Logger les changements de rôles
  async logRoleChange(userId, newRole) {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) return
      
      const logRef = push(dbRef(db, 'admin_logs/role_changes'))
      await set(logRef, {
        targetUserId: userId,
        newRole: newRole,
        changedBy: currentUser.uid,
        timestamp: Date.now(),
        action: 'role_change'
      })
    } catch (error) {
      console.error('Erreur lors du logging:', error)
    }
  }
  
  // Obtenir les logs d'administration
  async getAdminLogs(limit = 50) {
    try {
      const logsRef = dbRef(db, 'admin_logs')
      const snapshot = await get(logsRef)
      const logs = snapshot.val() || {}
      
      // Convertir en array et trier par timestamp
      const logsArray = Object.entries(logs).map(([id, log]) => ({
        id,
        ...log
      })).sort((a, b) => b.timestamp - a.timestamp)
      
      return logsArray.slice(0, limit)
    } catch (error) {
      console.error('Erreur lors de la récupération des logs:', error)
      return []
    }
  }
}

// Instance singleton
const rolesService = new RolesService()
export default rolesService

// Utilitaires pour les composants Vue
export const useRoles = () => {
  return {
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    rolesService
  }
}

// Middleware pour vérifier les permissions dans les routes
export const requirePermission = (permission) => {
  return async (to, from, next) => {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        next('/home')
        return
      }
      
      const hasPermission = await rolesService.hasPermission(currentUser.uid, permission)
      
      if (hasPermission) {
        next()
      } else {
        next('/unauthorized')
      }
    } catch (error) {
      console.error('Erreur middleware permission:', error)
      next('/error')
    }
  }
}

// Middleware pour vérifier les rôles dans les routes
export const requireRole = (role) => {
  return async (to, from, next) => {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        next('/home')
        return
      }
      
      const hasRole = await rolesService.hasRole(currentUser.uid, role)
      
      if (hasRole) {
        next()
      } else {
        next('/unauthorized')
      }
    } catch (error) {
      console.error('Erreur middleware rôle:', error)
      next('/error')
    }
  }
}
