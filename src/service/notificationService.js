import { ref, reactive } from 'vue'
import gamificationService from './gamificationService'

/**
 * Service de notifications gamification unifié
 * Gère les notifications temps réel pour les événements gamification
 */
class NotificationService {
  constructor() {
    this.notifications = ref([])
    this.subscribers = new Map()
    this.settings = reactive({
      enabled: true,
      autoHide: true,
      hideDelay: 5000,
      maxVisible: 3,
      soundEnabled: false
    })
    this.listeners = new Map()
  }

  // ==================== GESTION DES NOTIFICATIONS ====================

  /**
   * Crée une nouvelle notification
   */
  createNotification(data) {
    const notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.type || 'info',
      title: data.title || 'Notification',
      message: data.message || '',
      userId: data.userId || null,
      xpGain: data.xpGain || null,
      timestamp: Date.now(),
      read: false,
      persistent: data.persistent || false,
      actions: data.actions || [],
      metadata: data.metadata || {},
      ...data
    }

    return notification
  }

  /**
   * Ajoute une notification
   */
  addNotification(data) {
    if (!this.settings.enabled) return null

    const notification = this.createNotification(data)
    this.notifications.value.unshift(notification)

    // Limiter le nombre de notifications stockées
    if (this.notifications.value.length > 100) {
      this.notifications.value = this.notifications.value.slice(0, 100)
    }

    // Notifier les abonnés
    this.notifySubscribers('notification-added', notification)

    // Auto-hide si configuré et non persistant
    if (this.settings.autoHide && !notification.persistent) {
      setTimeout(() => {
        this.removeNotification(notification.id)
      }, this.settings.hideDelay)
    }

    return notification.id
  }

  /**
   * Supprime une notification
   */
  removeNotification(notificationId) {
    const index = this.notifications.value.findIndex(n => n.id === notificationId)
    if (index > -1) {
      const notification = this.notifications.value[index]
      this.notifications.value.splice(index, 1)
      this.notifySubscribers('notification-removed', notification)
      return true
    }
    return false
  }

  /**
   * Marque une notification comme lue
   */
  markAsRead(notificationId) {
    const notification = this.notifications.value.find(n => n.id === notificationId)
    if (notification && !notification.read) {
      notification.read = true
      this.notifySubscribers('notification-read', notification)
      return true
    }
    return false
  }

  /**
   * Marque toutes les notifications comme lues
   */
  markAllAsRead(userId = null) {
    let count = 0
    this.notifications.value.forEach(notification => {
      if (!notification.read && (!userId || notification.userId === userId)) {
        notification.read = true
        count++
      }
    })
    
    if (count > 0) {
      this.notifySubscribers('notifications-read-all', { count, userId })
    }
    
    return count
  }

  /**
   * Efface toutes les notifications
   */
  clearAll(userId = null) {
    if (userId) {
      const initialLength = this.notifications.value.length
      this.notifications.value = this.notifications.value.filter(n => n.userId !== userId)
      const removedCount = initialLength - this.notifications.value.length
      
      if (removedCount > 0) {
        this.notifySubscribers('notifications-cleared', { count: removedCount, userId })
      }
      
      return removedCount
    } else {
      const count = this.notifications.value.length
      this.notifications.value = []
      this.notifySubscribers('notifications-cleared', { count })
      return count
    }
  }

  // ==================== NOTIFICATIONS GAMIFICATION ====================

  /**
   * Notification de gain d'XP
   */
  notifyXPGained(userId, amount, reason = 'Action gamification') {
    return this.addNotification({
      type: 'xp',
      title: 'Points d\'expérience gagnés!',
      message: reason,
      userId,
      xpGain: amount,
      metadata: { amount, reason }
    })
  }

  /**
   * Notification de montée de niveau
   */
  notifyLevelUp(userId, newLevel, oldLevel) {
    return this.addNotification({
      type: 'level',
      title: 'Niveau supérieur atteint!',
      message: `Vous êtes maintenant niveau ${newLevel}`,
      userId,
      persistent: true,
      metadata: { newLevel, oldLevel }
    })
  }

  /**
   * Notification de badge obtenu
   */
  notifyBadgeEarned(userId, badgeName, badgeDescription = '') {
    return this.addNotification({
      type: 'badge',
      title: 'Nouveau badge obtenu!',
      message: badgeName,
      userId,
      persistent: true,
      metadata: { badgeName, badgeDescription }
    })
  }

  /**
   * Notification de quête terminée
   */
  notifyQuestCompleted(userId, questName, xpReward = 0) {
    return this.addNotification({
      type: 'quest',
      title: 'Quête terminée!',
      message: questName,
      userId,
      xpGain: xpReward,
      metadata: { questName, xpReward }
    })
  }

  /**
   * Notification de défi relevé
   */
  notifyChallengeCompleted(userId, challengeName, xpReward = 0) {
    return this.addNotification({
      type: 'challenge',
      title: 'Défi relevé!',
      message: challengeName,
      userId,
      xpGain: xpReward,
      metadata: { challengeName, xpReward }
    })
  }

  /**
   * Notification de maison rejointe
   */
  notifyHouseJoined(userId, houseName) {
    return this.addNotification({
      type: 'house',
      title: 'Maison rejointe!',
      message: `Bienvenue dans la maison ${houseName}`,
      userId,
      persistent: true,
      metadata: { houseName }
    })
  }

  // ==================== ABONNEMENTS ====================

  /**
   * S'abonne aux notifications
   */
  subscribe(callback, filter = null) {
    const subscriberId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.subscribers.set(subscriberId, { callback, filter })
    return subscriberId
  }

  /**
   * Se désabonne des notifications
   */
  unsubscribe(subscriberId) {
    return this.subscribers.delete(subscriberId)
  }

  /**
   * Notifie tous les abonnés
   */
  notifySubscribers(event, data) {
    this.subscribers.forEach(({ callback, filter }) => {
      if (!filter || filter(event, data)) {
        try {
          callback(event, data)
        } catch (error) {
          console.error('Erreur dans le callback de notification:', error)
        }
      }
    })
  }

  // ==================== INTÉGRATION GAMIFICATION ====================

  /**
   * S'abonne aux événements gamification
   */
  subscribeToGamificationEvents(userId = null) {
    const listenerId = gamificationService.subscribeToActivity((recentLogs) => {
      this.processGamificationLogs(recentLogs, userId)
    })
    
    this.listeners.set('gamification', listenerId)
    return listenerId
  }

  /**
   * Traite les logs gamification en notifications
   */
  processGamificationLogs(logs, userId = null) {
    const processedIds = new Set()
    
    logs.forEach(log => {
      // Éviter les doublons
      if (processedIds.has(log.id)) return
      processedIds.add(log.id)
      
      // Filtrer par utilisateur si spécifié
      if (userId && log.userId !== userId) return
      
      // Traiter selon le type d'action
      switch (log.action) {
        case 'xp_gained':
          this.notifyXPGained(log.userId, log.amount, log.reason)
          break
          
        case 'level_up':
          this.notifyLevelUp(log.userId, log.newLevel, log.oldLevel)
          break
          
        case 'badge_earned':
          this.notifyBadgeEarned(log.userId, log.badgeName, log.badgeDescription)
          break
          
        case 'quest_completed':
          this.notifyQuestCompleted(log.userId, log.questName, log.xpReward)
          break
          
        case 'challenge_completed':
          this.notifyChallengeCompleted(log.userId, log.challengeName, log.xpReward)
          break
          
        case 'house_joined':
          this.notifyHouseJoined(log.userId, log.houseName)
          break
      }
    })
  }

  // ==================== UTILITAIRES ====================

  /**
   * Obtient les notifications pour un utilisateur
   */
  getUserNotifications(userId, limit = 50) {
    return this.notifications.value
      .filter(n => n.userId === userId)
      .slice(0, limit)
  }

  /**
   * Obtient les notifications non lues pour un utilisateur
   */
  getUnreadNotifications(userId) {
    return this.notifications.value.filter(n => n.userId === userId && !n.read)
  }

  /**
   * Compte les notifications non lues pour un utilisateur
   */
  getUnreadCount(userId) {
    return this.getUnreadNotifications(userId).length
  }

  /**
   * Met à jour les paramètres
   */
  updateSettings(newSettings) {
    Object.assign(this.settings, newSettings)
  }

  /**
   * Obtient les paramètres actuels
   */
  getSettings() {
    return { ...this.settings }
  }

  // ==================== NETTOYAGE ====================

  /**
   * Nettoie les ressources
   */
  cleanup() {
    // Nettoyer les listeners gamification
    this.listeners.forEach((listenerId) => {
      gamificationService.unsubscribe(listenerId)
    })
    this.listeners.clear()
    
    // Nettoyer les abonnés
    this.subscribers.clear()
    
    // Vider les notifications
    this.notifications.value = []
  }
}

// Instance singleton
const notificationService = new NotificationService()

export default notificationService
