/**
 * Service Gamification Unifié
 * Centralise toutes les données gamification pour l'écosystème complet
 * Utilisé par : Admin Dashboard, Composants User, Profile, Gestion
 */

import { ref as dbRef, get, set, push, remove, onValue, off } from 'firebase/database'
import { db, auth } from '../../firebase.js'
import notificationService from './notificationService.js'

class GamificationService {
  constructor() {
    this.listeners = new Map() // Pour gérer les listeners temps réel
    this.cache = new Map() // Cache pour optimiser les performances
  }

  // ==================== DONNÉES UNIFIÉES ====================

  /**
   * Obtient toutes les statistiques gamification en temps réel
   */
  async getUnifiedStats() {
    try {
      const [users, challenges, quests, badges, houses, logs] = await Promise.all([
        this.getAllUsers(),
        this.getAllChallenges(),
        this.getAllQuests(),
        this.getAllBadges(),
        this.getAllHouses(),
        this.getRecentLogs()
      ])

      const stats = {
        // Statistiques générales
        totalUsers: Object.keys(users).length,
        gamificationUsers: Object.values(users).filter(user => 
          user.gamification && user.gamification.maison
        ).length,
        
        // Contenu gamification
        totalChallenges: Object.keys(challenges).length,
        activeChallenges: Object.values(challenges).filter(c => c.status === 'active').length,
        totalQuests: Object.keys(quests).length,
        completedQuests: Object.values(quests).filter(q => q.status === 'completed').length,
        totalBadges: Object.keys(badges).length,
        
        // Maisons
        totalHouses: Object.keys(houses).length,
        houses: this.processHousesStats(houses, users),
        
        // Activité récente
        recentLogs: logs.slice(0, 10),
        
        // Données brutes pour composants
        rawData: {
          users,
          challenges,
          quests,
          badges,
          houses
        },
        
        lastUpdated: new Date().toISOString()
      }

      // Mettre en cache
      this.cache.set('unifiedStats', stats)
      return stats

    } catch (error) {
      console.error('[GamificationService] Erreur lors du chargement des statistiques:', error)
      return this.getDefaultStats()
    }
  }

  /**
   * Obtient les données d'un utilisateur spécifique avec gamification
   */
  async getUserGamificationData(userId) {
    try {
      const userRef = dbRef(db, `Users/${userId}`)
      const snapshot = await get(userRef)
      const userData = snapshot.val()

      if (!userData) return null

      // Enrichir avec données gamification
      const [userChallenges, userQuests, userBadges, houseData] = await Promise.all([
        this.getUserChallenges(userId),
        this.getUserQuests(userId),
        this.getUserBadges(userId),
        userData.gamification?.maison ? this.getHouseData(userData.gamification.maison) : null
      ])

      return {
        ...userData,
        gamification: {
          ...userData.gamification,
          challenges: userChallenges,
          quests: userQuests,
          badges: userBadges,
          house: houseData,
          stats: {
            totalXP: userData.gamification?.xp || 0,
            level: this.calculateLevel(userData.gamification?.xp || 0),
            challengesCompleted: userChallenges.filter(c => c.completed).length,
            questsCompleted: userQuests.filter(q => q.completed).length,
            badgesEarned: userBadges.length
          }
        }
      }

    } catch (error) {
      console.error('[GamificationService] Erreur lors du chargement des données utilisateur:', error)
      return null
    }
  }

  // ==================== GESTION DES DONNÉES ====================

  /**
   * Obtient tous les utilisateurs
   */
  async getAllUsers() {
    const snapshot = await get(dbRef(db, 'users'))
    return snapshot.val() || {}
  }

  /**
   * Obtient tous les défis
   */
  async getAllChallenges() {
    const snapshot = await get(dbRef(db, 'challenges'))
    return snapshot.val() || {}
  }

  /**
   * Obtient toutes les quêtes
   */
  async getAllQuests() {
    const snapshot = await get(dbRef(db, 'quests'))
    return snapshot.val() || {}
  }

  /**
   * Obtient tous les badges
   */
  async getAllBadges() {
    const snapshot = await get(dbRef(db, 'gamification/badges'))
    return snapshot.val() || {}
  }

  /**
   * Obtient toutes les maisons
   */
  async getAllHouses() {
    const snapshot = await get(dbRef(db, 'gamification/houses'))
    return snapshot.val() || {}
  }

  /**
   * Obtient les logs récents
   */
  async getRecentLogs() {
    const snapshot = await get(dbRef(db, 'gamification/logs'))
    const logs = snapshot.val() || {}
    
    return Object.entries(logs)
      .map(([id, log]) => ({ id, ...log }))
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      .slice(0, 20)
  }

  // ==================== DONNÉES UTILISATEUR SPÉCIFIQUES ====================

  /**
   * Obtient les défis d'un utilisateur
   */
  async getUserChallenges(userId) {
    const snapshot = await get(dbRef(db, `Users/${userId}/gamification/challenges`))
    return Object.values(snapshot.val() || {})
  }

  /**
   * Obtient les quêtes d'un utilisateur
   */
  async getUserQuests(userId) {
    const snapshot = await get(dbRef(db, `Users/${userId}/gamification/quests`))
    return Object.values(snapshot.val() || {})
  }

  /**
   * Obtient les badges d'un utilisateur
   */
  async getUserBadges(userId) {
    const snapshot = await get(dbRef(db, `Users/${userId}/gamification/badges`))
    return Object.values(snapshot.val() || {})
  }

  /**
   * Obtient les données d'une maison
   */
  async getHouseData(houseId) {
    const snapshot = await get(dbRef(db, `gamification/houses/${houseId}`))
    return snapshot.val()
  }

  // ==================== TEMPS RÉEL ====================

  /**
   * S'abonne aux mises à jour temps réel des statistiques
   */
  subscribeToStats(callback) {
    const statsRef = dbRef(db, 'gamification')
    const listenerId = `stats_${Date.now()}`
    
    const unsubscribe = onValue(statsRef, async () => {
      try {
        const stats = await this.getUnifiedStats()
        callback(stats)
      } catch (error) {
        console.error('Erreur lors de la mise à jour des stats temps réel:', error)
        callback(this.getDefaultStats())
      }
    })

    this.listeners.set(listenerId, unsubscribe)
    return listenerId
  }

  /**
   * S'abonne aux mises à jour temps réel des logs d'activité
   */
  subscribeToActivity(callback, limit = 20) {
    const logsRef = dbRef(db, 'gamification/logs')
    const listenerId = `activity_${Date.now()}`
    
    const unsubscribe = onValue(logsRef, async (snapshot) => {
      try {
        const logs = snapshot.val() || {}
        const recentLogs = Object.entries(logs)
          .map(([id, log]) => ({ id, ...log }))
          .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
          .slice(0, limit)
        
        callback(recentLogs)
      } catch (error) {
        console.error('Erreur lors de la mise à jour des logs temps réel:', error)
        callback([])
      }
    })

    this.listeners.set(listenerId, unsubscribe)
    return listenerId
  }

  /**
   * S'abonne aux mises à jour temps réel des maisons
   */
  subscribeToHouses(callback) {
    const housesRef = dbRef(db, 'gamification/houses')
    const usersRef = dbRef(db, 'users')
    const listenerId = `houses_${Date.now()}`
    
    const updateHousesStats = async () => {
      try {
        const [housesSnapshot, usersSnapshot] = await Promise.all([
          get(housesRef),
          get(usersRef)
        ])
        
        const houses = housesSnapshot.val() || {}
        const users = usersSnapshot.val() || {}
        const housesStats = this.processHousesStats(houses, users)
        
        callback(housesStats)
      } catch (error) {
        console.error('Erreur lors de la mise à jour des maisons temps réel:', error)
        callback({})
      }
    }
    
    const unsubscribeHouses = onValue(housesRef, updateHousesStats)
    const unsubscribeUsers = onValue(usersRef, updateHousesStats)
    
    const combinedUnsubscribe = () => {
      unsubscribeHouses()
      unsubscribeUsers()
    }

    this.listeners.set(listenerId, combinedUnsubscribe)
    return listenerId
  }

  /**
   * S'abonne aux mises à jour d'un utilisateur
   */
  subscribeToUser(userId, callback) {
    const userRef = dbRef(db, `Users/${userId}`)
    const listenerId = `user_${userId}_${Date.now()}`
    
    const unsubscribe = onValue(userRef, async () => {
      const userData = await this.getUserGamificationData(userId)
      callback(userData)
    })

    this.listeners.set(listenerId, unsubscribe)
    return listenerId
  }

  /**
   * Se désabonne d'un listener
   */
  unsubscribe(listenerId) {
    const unsubscribe = this.listeners.get(listenerId)
    if (unsubscribe) {
      unsubscribe()
      this.listeners.delete(listenerId)
    }
  }

  // ==================== UTILITAIRES ====================

  /**
   * Traite les statistiques des maisons
   */
  processHousesStats(houses, users) {
    const housesStats = {}
    
    Object.keys(houses).forEach(houseId => {
      const house = houses[houseId]
      const houseUsers = Object.values(users).filter(user => 
        user.gamification?.maison === houseId
      )
      
      housesStats[houseId] = {
        name: house.name || houseId,
        memberCount: houseUsers.length,
        totalXP: houseUsers.reduce((sum, user) => sum + (user.gamification?.xp || 0), 0),
        averageLevel: houseUsers.length > 0 
          ? houseUsers.reduce((sum, user) => sum + this.calculateLevel(user.gamification?.xp || 0), 0) / houseUsers.length
          : 0,
        color: house.color || '#3498db'
      }
    })
    
    return housesStats
  }

  /**
   * Calcule le niveau basé sur l'XP
   */
  calculateLevel(xp) {
    return Math.floor(xp / 100) + 1
  }

  /**
   * Calcule l'XP nécessaire pour le prochain niveau
   */
  calculateXPToNextLevel(level, currentXP) {
    const nextLevelXP = level * 100
    return Math.max(0, nextLevelXP - currentXP)
  }

  /**
   * Retourne des statistiques par défaut
   */
  getDefaultStats() {
    return {
      totalUsers: 0,
      gamificationUsers: 0,
      totalChallenges: 0,
      activeChallenges: 0,
      totalQuests: 0,
      completedQuests: 0,
      totalBadges: 0,
      totalHouses: 0,
      houses: {},
      recentLogs: [],
      rawData: {
        users: {},
        challenges: {},
        quests: {},
        badges: {},
        houses: {}
      },
      lastUpdated: new Date().toISOString()
    }
  }

  // ==================== ACTIONS ====================

  /**
   * Crée un nouveau défi
   */
  async createChallenge(challengeData) {
    const challengesRef = dbRef(db, 'challenges')
    const newChallengeRef = push(challengesRef)
    
    const challenge = {
      ...challengeData,
      id: newChallengeRef.key,
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser?.uid,
      status: 'active'
    }
    
    await set(newChallengeRef, challenge)
    await this.logAction('challenge_created', challenge.id)
    
    return challenge
  }

  /**
   * Crée une nouvelle quête
   */
  async createQuest(questData) {
    const questsRef = dbRef(db, 'quests')
    const newQuestRef = push(questsRef)
    
    const quest = {
      ...questData,
      id: newQuestRef.key,
      createdAt: new Date().toISOString(),
      createdBy: auth.currentUser?.uid,
      status: 'active'
    }
    
    await set(newQuestRef, quest)
    await this.logAction('quest_created', quest.id)
    
    return quest
  }

  /**
   * Log une action et déclenche une notification si approprié
   */
  async logAction(action, targetId, additionalData = {}) {
    const logsRef = dbRef(db, 'gamification/logs')
    const newLogRef = push(logsRef)
    
    const logEntry = {
      action,
      targetId,
      userId: auth.currentUser?.uid,
      timestamp: Date.now(),
      ...additionalData
    }
    
    await set(newLogRef, logEntry)
    
    // Déclencher une notification si approprié
    await this.triggerNotificationForAction(action, targetId, additionalData)
  }

  /**
   * Déclenche une notification basée sur l'action gamification
   */
  async triggerNotificationForAction(action, targetId, additionalData = {}) {
    try {
      const userId = auth.currentUser?.uid
      if (!userId) return

      let notificationData = null

      switch (action) {
        case 'xp_gained':
          notificationData = {
            type: 'xp',
            title: 'XP Gagné !',
            message: `+${additionalData.amount || 0} XP`,
            data: { xp: additionalData.amount, source: additionalData.source }
          }
          break

        case 'level_up':
          notificationData = {
            type: 'level_up',
            title: 'Niveau Supérieur !',
            message: `Félicitations ! Vous êtes maintenant niveau ${additionalData.newLevel}`,
            data: { level: additionalData.newLevel, previousLevel: additionalData.previousLevel }
          }
          break

        case 'badge_earned':
          notificationData = {
            type: 'badge',
            title: 'Nouveau Badge !',
            message: `Badge "${additionalData.badgeName}" débloqué !`,
            data: { badgeId: targetId, badgeName: additionalData.badgeName }
          }
          break

        case 'quest_completed':
          notificationData = {
            type: 'quest',
            title: 'Quête Terminée !',
            message: `Quête "${additionalData.questName}" complétée !`,
            data: { questId: targetId, questName: additionalData.questName }
          }
          break

        case 'challenge_completed':
          notificationData = {
            type: 'challenge',
            title: 'Défi Relevé !',
            message: `Défi "${additionalData.challengeName}" terminé !`,
            data: { challengeId: targetId, challengeName: additionalData.challengeName }
          }
          break

        case 'house_assigned':
          notificationData = {
            type: 'house',
            title: 'Maison Assignée !',
            message: `Bienvenue dans la maison ${additionalData.houseName} !`,
            data: { house: additionalData.houseName }
          }
          break
      }

      if (notificationData) {
        await notificationService.createNotification(userId, notificationData)
      }
    } catch (error) {
      console.error('Erreur lors du déclenchement de notification:', error)
    }
  }

  // ==================== NETTOYAGE ====================

  /**
   * Nettoie tous les listeners
   */
  cleanup() {
    this.listeners.forEach((unsubscribe) => {
      unsubscribe()
    })
    this.listeners.clear()
    this.cache.clear()
  }
}

// Instance singleton
const gamificationService = new GamificationService()

export default gamificationService
