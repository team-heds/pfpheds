import { db } from '../../firebase.js'
import { ref as dbRef, get, set, update, push, remove, query, orderByChild, equalTo } from 'firebase/database'
import { getAuth } from 'firebase/auth'
import rolesService, { PERMISSIONS } from './rolesService'

// Service d'administration pour la gamification
class AdminService {
  
  // ==================== GESTION DES DÉFIS ====================
  
  // Créer un nouveau défi
  async createChallenge(challengeData) {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié')
      }
      
      // Vérifier les permissions
      const hasPermission = await rolesService.hasPermission(currentUser.uid, PERMISSIONS.CREATE_CHALLENGES)
      if (!hasPermission) {
        throw new Error('Permissions insuffisantes pour créer des défis')
      }
      
      // Valider les données
      this.validateChallengeData(challengeData)
      
      // Préparer les données du défi
      const challenge = {
        ...challengeData,
        id: push(dbRef(db, 'challenges')).key,
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active',
        participants: 0,
        completions: 0
      }
      
      // Sauvegarder dans Firebase
      const challengeRef = dbRef(db, `challenges/${challenge.id}`)
      await set(challengeRef, challenge)
      
      // Logger l'action
      await this.logAdminAction('create_challenge', challenge.id, currentUser.uid)
      
      return challenge
    } catch (error) {
      console.error('Erreur lors de la création du défi:', error)
      throw error
    }
  }
  
  // Mettre à jour un défi
  async updateChallenge(challengeId, updateData) {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié')
      }
      
      // Vérifier les permissions
      const hasPermission = await rolesService.hasPermission(currentUser.uid, PERMISSIONS.EDIT_CHALLENGES)
      if (!hasPermission) {
        throw new Error('Permissions insuffisantes pour modifier des défis')
      }
      
      // Valider les données
      this.validateChallengeData(updateData, true)
      
      // Préparer les données de mise à jour
      const updates = {
        ...updateData,
        updatedAt: Date.now(),
        updatedBy: currentUser.uid
      }
      
      // Mettre à jour dans Firebase
      const challengeRef = dbRef(db, `challenges/${challengeId}`)
      await update(challengeRef, updates)
      
      // Logger l'action
      await this.logAdminAction('update_challenge', challengeId, currentUser.uid)
      
      return true
    } catch (error) {
      console.error('Erreur lors de la mise à jour du défi:', error)
      throw error
    }
  }
  
  // Supprimer un défi
  async deleteChallenge(challengeId) {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié')
      }
      
      // Vérifier les permissions
      const hasPermission = await rolesService.hasPermission(currentUser.uid, PERMISSIONS.DELETE_CHALLENGES)
      if (!hasPermission) {
        throw new Error('Permissions insuffisantes pour supprimer des défis')
      }
      
      // Marquer comme supprimé au lieu de supprimer définitivement
      const challengeRef = dbRef(db, `challenges/${challengeId}`)
      await update(challengeRef, {
        status: 'deleted',
        deletedAt: Date.now(),
        deletedBy: currentUser.uid
      })
      
      // Logger l'action
      await this.logAdminAction('delete_challenge', challengeId, currentUser.uid)
      
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression du défi:', error)
      throw error
    }
  }
  
  // Obtenir tous les défis pour l'administration
  async getAllChallenges() {
    try {
      const challengesRef = dbRef(db, 'challenges')
      const snapshot = await get(challengesRef)
      const challenges = snapshot.val() || {}
      
      return Object.entries(challenges).map(([id, challenge]) => ({
        id,
        ...challenge
      })).filter(challenge => challenge.status !== 'deleted')
    } catch (error) {
      console.error('Erreur lors de la récupération des défis:', error)
      return []
    }
  }
  
  // ==================== GESTION DES QUÊTES ====================
  
  // Créer une nouvelle quête
  async createQuest(questData) {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié')
      }
      
      // Vérifier les permissions
      const hasPermission = await rolesService.hasPermission(currentUser.uid, PERMISSIONS.CREATE_QUESTS)
      if (!hasPermission) {
        throw new Error('Permissions insuffisantes pour créer des quêtes')
      }
      
      // Valider les données
      this.validateQuestData(questData)
      
      // Préparer les données de la quête
      const quest = {
        ...questData,
        id: push(dbRef(db, 'quests')).key,
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active',
        participants: 0,
        completions: 0
      }
      
      // Sauvegarder dans Firebase
      const questRef = dbRef(db, `quests/${quest.id}`)
      await set(questRef, quest)
      
      // Logger l'action
      await this.logAdminAction('create_quest', quest.id, currentUser.uid)
      
      return quest
    } catch (error) {
      console.error('Erreur lors de la création de la quête:', error)
      throw error
    }
  }
  
  // Mettre à jour une quête
  async updateQuest(questId, updateData) {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié')
      }
      
      // Vérifier les permissions
      const hasPermission = await rolesService.hasPermission(currentUser.uid, PERMISSIONS.EDIT_QUESTS)
      if (!hasPermission) {
        throw new Error('Permissions insuffisantes pour modifier des quêtes')
      }
      
      // Valider les données
      this.validateQuestData(updateData, true)
      
      // Préparer les données de mise à jour
      const updates = {
        ...updateData,
        updatedAt: Date.now(),
        updatedBy: currentUser.uid
      }
      
      // Mettre à jour dans Firebase
      const questRef = dbRef(db, `quests/${questId}`)
      await update(questRef, updates)
      
      // Logger l'action
      await this.logAdminAction('update_quest', questId, currentUser.uid)
      
      return true
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la quête:', error)
      throw error
    }
  }
  
  // Supprimer une quête
  async deleteQuest(questId) {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié')
      }
      
      // Vérifier les permissions
      const hasPermission = await rolesService.hasPermission(currentUser.uid, PERMISSIONS.DELETE_QUESTS)
      if (!hasPermission) {
        throw new Error('Permissions insuffisantes pour supprimer des quêtes')
      }
      
      // Marquer comme supprimé
      const questRef = dbRef(db, `quests/${questId}`)
      await update(questRef, {
        status: 'deleted',
        deletedAt: Date.now(),
        deletedBy: currentUser.uid
      })
      
      // Logger l'action
      await this.logAdminAction('delete_quest', questId, currentUser.uid)
      
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression de la quête:', error)
      throw error
    }
  }
  
  // Obtenir toutes les quêtes pour l'administration
  async getAllQuests() {
    try {
      const questsRef = dbRef(db, 'quests')
      const snapshot = await get(questsRef)
      const quests = snapshot.val() || {}
      
      return Object.entries(quests).map(([id, quest]) => ({
        id,
        ...quest
      })).filter(quest => quest.status !== 'deleted')
    } catch (error) {
      console.error('Erreur lors de la récupération des quêtes:', error)
      return []
    }
  }
  
  // ==================== GESTION DES BADGES ====================
  
  // Créer un nouveau badge
  async createBadge(badgeData) {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié')
      }
      
      // Vérifier les permissions
      const hasPermission = await rolesService.hasPermission(currentUser.uid, PERMISSIONS.CREATE_BADGES)
      if (!hasPermission) {
        throw new Error('Permissions insuffisantes pour créer des badges')
      }
      
      // Valider les données
      this.validateBadgeData(badgeData)
      
      // Préparer les données du badge
      const badge = {
        ...badgeData,
        id: push(dbRef(db, 'badges')).key,
        createdBy: currentUser.uid,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        status: 'active',
        unlockedBy: 0
      }
      
      // Sauvegarder dans Firebase
      const badgeRef = dbRef(db, `badges/${badge.id}`)
      await set(badgeRef, badge)
      
      // Logger l'action
      await this.logAdminAction('create_badge', badge.id, currentUser.uid)
      
      return badge
    } catch (error) {
      console.error('Erreur lors de la création du badge:', error)
      throw error
    }
  }
  
  // Mettre à jour un badge
  async updateBadge(badgeId, updateData) {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié')
      }
      
      // Vérifier les permissions
      const hasPermission = await rolesService.hasPermission(currentUser.uid, PERMISSIONS.EDIT_BADGES)
      if (!hasPermission) {
        throw new Error('Permissions insuffisantes pour modifier des badges')
      }
      
      // Valider les données
      this.validateBadgeData(updateData, true)
      
      // Préparer les données de mise à jour
      const updates = {
        ...updateData,
        updatedAt: Date.now(),
        updatedBy: currentUser.uid
      }
      
      // Mettre à jour dans Firebase
      const badgeRef = dbRef(db, `badges/${badgeId}`)
      await update(badgeRef, updates)
      
      // Logger l'action
      await this.logAdminAction('update_badge', badgeId, currentUser.uid)
      
      return true
    } catch (error) {
      console.error('Erreur lors de la mise à jour du badge:', error)
      throw error
    }
  }
  
  // Supprimer un badge
  async deleteBadge(badgeId) {
    try {
      const auth = getAuth()
      const currentUser = auth.currentUser
      
      if (!currentUser) {
        throw new Error('Utilisateur non authentifié')
      }
      
      // Vérifier les permissions
      const hasPermission = await rolesService.hasPermission(currentUser.uid, PERMISSIONS.DELETE_BADGES)
      if (!hasPermission) {
        throw new Error('Permissions insuffisantes pour supprimer des badges')
      }
      
      // Marquer comme supprimé
      const badgeRef = dbRef(db, `badges/${badgeId}`)
      await update(badgeRef, {
        status: 'deleted',
        deletedAt: Date.now(),
        deletedBy: currentUser.uid
      })
      
      // Logger l'action
      await this.logAdminAction('delete_badge', badgeId, currentUser.uid)
      
      return true
    } catch (error) {
      console.error('Erreur lors de la suppression du badge:', error)
      throw error
    }
  }
  
  // Obtenir tous les badges pour l'administration
  async getAllBadges() {
    try {
      const badgesRef = dbRef(db, 'badges')
      const snapshot = await get(badgesRef)
      const badges = snapshot.val() || {}
      
      return Object.entries(badges).map(([id, badge]) => ({
        id,
        ...badge
      })).filter(badge => badge.status !== 'deleted')
    } catch (error) {
      console.error('Erreur lors de la récupération des badges:', error)
      return []
    }
  }
  
  // ==================== STATISTIQUES ET ANALYTICS ====================
  
  // Obtenir les statistiques générales
  async getGeneralStats() {
    try {
      const [challenges, quests, badges, users] = await Promise.all([
        this.getAllChallenges(),
        this.getAllQuests(),
        this.getAllBadges(),
        this.getAllUsers()
      ])
      
      return {
        challenges: {
          total: challenges.length,
          active: challenges.filter(c => c.status === 'active').length,
          completed: challenges.reduce((sum, c) => sum + (c.completions || 0), 0)
        },
        quests: {
          total: quests.length,
          active: quests.filter(q => q.status === 'active').length,
          completed: quests.reduce((sum, q) => sum + (q.completions || 0), 0)
        },
        badges: {
          total: badges.length,
          active: badges.filter(b => b.status === 'active').length,
          unlocked: badges.reduce((sum, b) => sum + (b.unlockedBy || 0), 0)
        },
        users: {
          total: users.length,
          active: users.filter(u => u.lastLogin && (Date.now() - u.lastLogin) < 7 * 24 * 60 * 60 * 1000).length
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error)
      return null
    }
  }
  
  // Obtenir tous les utilisateurs
  async getAllUsers() {
    try {
      const usersRef = dbRef(db, 'users')
      const snapshot = await get(usersRef)
      const users = snapshot.val() || {}
      
      return Object.entries(users).map(([id, user]) => ({
        id,
        ...user
      }))
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error)
      return []
    }
  }
  
  // ==================== VALIDATION ====================
  
  validateChallengeData(data, isUpdate = false) {
    const required = ['title', 'description', 'category', 'difficulty', 'target', 'reward']
    
    if (!isUpdate) {
      for (const field of required) {
        if (!data[field]) {
          throw new Error(`Le champ ${field} est requis`)
        }
      }
    }
    
    if (data.difficulty && !['easy', 'medium', 'hard', 'legendary'].includes(data.difficulty)) {
      throw new Error('Difficulté invalide')
    }
    
    if (data.target && (typeof data.target !== 'number' || data.target <= 0)) {
      throw new Error('L\'objectif doit être un nombre positif')
    }
    
    if (data.reward && (!data.reward.xp || data.reward.xp <= 0)) {
      throw new Error('La récompense XP doit être positive')
    }
  }
  
  validateQuestData(data, isUpdate = false) {
    const required = ['title', 'description', 'type', 'difficulty', 'steps', 'rewards']
    
    if (!isUpdate) {
      for (const field of required) {
        if (!data[field]) {
          throw new Error(`Le champ ${field} est requis`)
        }
      }
    }
    
    if (data.difficulty && !['easy', 'medium', 'hard', 'legendary'].includes(data.difficulty)) {
      throw new Error('Difficulté invalide')
    }
    
    if (data.steps && (!Array.isArray(data.steps) || data.steps.length === 0)) {
      throw new Error('Les étapes doivent être un tableau non vide')
    }
  }
  
  validateBadgeData(data, isUpdate = false) {
    const required = ['name', 'description', 'icon', 'rarity', 'conditions']
    
    if (!isUpdate) {
      for (const field of required) {
        if (!data[field]) {
          throw new Error(`Le champ ${field} est requis`)
        }
      }
    }
    
    if (data.rarity && !['common', 'rare', 'epic', 'legendary'].includes(data.rarity)) {
      throw new Error('Rareté invalide')
    }
  }
  
  // ==================== LOGGING ====================
  
  async logAdminAction(action, targetId, userId) {
    try {
      const logRef = push(dbRef(db, 'admin_logs/actions'))
      await set(logRef, {
        action,
        targetId,
        userId,
        timestamp: Date.now()
      })
    } catch (error) {
      console.error('Erreur lors du logging:', error)
    }
  }
}

// Instance singleton
const adminService = new AdminService()
export default adminService
