<template>
  <div class="gamification-notifications">
    <!-- Notification Toast -->
    <div 
      v-for="notification in visibleNotifications" 
      :key="notification.id"
      :class="[
        'notification-toast',
        `notification-${notification.type}`,
        { 'notification-entering': notification.entering },
        { 'notification-leaving': notification.leaving }
      ]"
      @click="handleNotificationClick(notification)"
    >
      <div class="notification-icon">
        <i :class="getNotificationIcon(notification.type)"></i>
      </div>
      
      <div class="notification-content">
        <div class="notification-title">{{ notification.title }}</div>
        <div class="notification-message">{{ notification.message }}</div>
        <div v-if="notification.xpGain" class="notification-xp">
          +{{ notification.xpGain }} XP
        </div>
      </div>
      
      <div class="notification-actions">
        <Button 
          icon="pi pi-times" 
          class="p-button-text p-button-sm notification-close"
          @click.stop="dismissNotification(notification.id)"
        />
      </div>
    </div>

    <!-- Notification Center (optionnel) -->
    <div v-if="showCenter" class="notification-center">
      <div class="notification-center-header">
        <h3>Notifications Gamification</h3>
        <Button 
          icon="pi pi-times" 
          class="p-button-text"
          @click="showCenter = false"
        />
      </div>
      
      <div class="notification-center-content">
        <div 
          v-for="notification in allNotifications" 
          :key="notification.id"
          class="notification-item"
          :class="{ 'notification-unread': !notification.read }"
        >
          <div class="notification-icon">
            <i :class="getNotificationIcon(notification.type)"></i>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ formatTime(notification.timestamp) }}</div>
          </div>
        </div>
        
        <div v-if="allNotifications.length === 0" class="empty-state">
          <i class="pi pi-bell text-4xl text-300 mb-3"></i>
          <p class="text-600">Aucune notification</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'
import gamificationService from '@/service/gamificationService'

const props = defineProps({
  userId: {
    type: String,
    default: null
  },
  showCenter: {
    type: Boolean,
    default: false
  },
  maxVisible: {
    type: Number,
    default: 3
  },
  autoHide: {
    type: Boolean,
    default: true
  },
  hideDelay: {
    type: Number,
    default: 5000
  }
})

const emit = defineEmits(['notification-click', 'center-toggle'])

// État des notifications
const notifications = ref([])
const allNotifications = ref([])
const listenerId = ref(null)
const notificationQueue = ref([])

// Notifications visibles (limitées)
const visibleNotifications = computed(() => {
  return notifications.value.slice(0, props.maxVisible)
})

// Types de notifications gamification
const notificationTypes = {
  XP_GAINED: 'xp',
  LEVEL_UP: 'level',
  BADGE_EARNED: 'badge',
  QUEST_COMPLETED: 'quest',
  CHALLENGE_COMPLETED: 'challenge',
  HOUSE_JOINED: 'house',
  ACHIEVEMENT_UNLOCKED: 'achievement'
}

// Icônes par type de notification
const getNotificationIcon = (type) => {
  const icons = {
    xp: 'pi pi-star-fill',
    level: 'pi pi-arrow-up',
    badge: 'pi pi-shield',
    quest: 'pi pi-flag',
    challenge: 'pi pi-trophy',
    house: 'pi pi-home',
    achievement: 'pi pi-crown',
    default: 'pi pi-info-circle'
  }
  return icons[type] || icons.default
}

// Créer une notification
const createNotification = (data) => {
  const notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: data.type || 'default',
    title: data.title || 'Notification',
    message: data.message || '',
    xpGain: data.xpGain || null,
    timestamp: Date.now(),
    read: false,
    entering: true,
    leaving: false,
    ...data
  }
  
  return notification
}

// Afficher une notification
const showNotification = (data) => {
  const notification = createNotification(data)
  
  // Ajouter à la liste des notifications visibles
  notifications.value.unshift(notification)
  
  // Ajouter à toutes les notifications
  allNotifications.value.unshift(notification)
  
  // Animation d'entrée
  setTimeout(() => {
    const notif = notifications.value.find(n => n.id === notification.id)
    if (notif) {
      notif.entering = false
    }
  }, 100)
  
  // Auto-hide si activé
  if (props.autoHide) {
    setTimeout(() => {
      dismissNotification(notification.id)
    }, props.hideDelay)
  }
  
  return notification.id
}

// Masquer une notification
const dismissNotification = (notificationId) => {
  const notification = notifications.value.find(n => n.id === notificationId)
  if (notification) {
    notification.leaving = true
    
    setTimeout(() => {
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index > -1) {
        notifications.value.splice(index, 1)
      }
    }, 300)
  }
}

// Gérer le clic sur une notification
const handleNotificationClick = (notification) => {
  // Marquer comme lue
  notification.read = true
  
  // Émettre l'événement
  emit('notification-click', notification)
  
  // Masquer la notification
  dismissNotification(notification.id)
}

// Formater le temps
const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  
  if (minutes < 1) return 'À l\'instant'
  if (minutes < 60) return `Il y a ${minutes}min`
  if (hours < 24) return `Il y a ${hours}h`
  if (days < 7) return `Il y a ${days}j`
  
  return date.toLocaleDateString()
}

// Traiter les logs d'activité en notifications
const processActivityLog = (log) => {
  if (!log || !props.userId || log.userId !== props.userId) return
  
  const notificationData = {
    type: log.action,
    timestamp: log.timestamp
  }
  
  switch (log.action) {
    case 'xp_gained':
      notificationData.title = 'Points d\'expérience gagnés!'
      notificationData.message = log.reason || 'Action gamification'
      notificationData.xpGain = log.amount
      notificationData.type = 'xp'
      break
      
    case 'level_up':
      notificationData.title = 'Niveau supérieur atteint!'
      notificationData.message = `Vous êtes maintenant niveau ${log.newLevel}`
      notificationData.type = 'level'
      break
      
    case 'badge_earned':
      notificationData.title = 'Nouveau badge obtenu!'
      notificationData.message = log.badgeName || 'Badge débloqué'
      notificationData.type = 'badge'
      break
      
    case 'quest_completed':
      notificationData.title = 'Quête terminée!'
      notificationData.message = log.questName || 'Quête accomplie avec succès'
      notificationData.type = 'quest'
      break
      
    case 'challenge_completed':
      notificationData.title = 'Défi relevé!'
      notificationData.message = log.challengeName || 'Défi accompli avec succès'
      notificationData.type = 'challenge'
      break
      
    case 'house_joined':
      notificationData.title = 'Maison rejointe!'
      notificationData.message = `Bienvenue dans la maison ${log.houseName}`
      notificationData.type = 'house'
      break
      
    default:
      return // Ne pas créer de notification pour les autres actions
  }
  
  showNotification(notificationData)
}

// S'abonner aux mises à jour d'activité
const subscribeToActivity = () => {
  if (!props.userId) return
  
  listenerId.value = gamificationService.subscribeToActivity((recentLogs) => {
    // Traiter seulement les nouveaux logs
    const existingIds = new Set(allNotifications.value.map(n => n.sourceLogId))
    
    recentLogs.forEach(log => {
      if (!existingIds.has(log.id)) {
        processActivityLog({ ...log, sourceLogId: log.id })
      }
    })
  })
}

// API publique pour créer des notifications manuellement
const notify = (data) => {
  return showNotification(data)
}

// Exposer les méthodes publiques
defineExpose({
  notify,
  dismissNotification,
  showNotification
})

// Lifecycle
onMounted(() => {
  if (props.userId) {
    subscribeToActivity()
  }
})

onUnmounted(() => {
  if (listenerId.value) {
    gamificationService.unsubscribe(listenerId.value)
  }
})
</script>

<style scoped>
.gamification-notifications {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 9999;
  pointer-events: none;
}

.notification-toast {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border-left: 4px solid var(--primary-color);
  min-width: 320px;
  max-width: 400px;
  pointer-events: auto;
  cursor: pointer;
  transition: all 0.3s ease;
  transform: translateX(100%);
  opacity: 0;
}

.notification-toast:not(.notification-entering):not(.notification-leaving) {
  transform: translateX(0);
  opacity: 1;
}

.notification-leaving {
  transform: translateX(100%);
  opacity: 0;
}

.notification-xp {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  border-radius: 12px;
}

.notification-level {
  border-left-color: #f093fb;
}

.notification-badge {
  border-left-color: #43e97b;
}

.notification-quest {
  border-left-color: #4facfe;
}

.notification-challenge {
  border-left-color: #f093fb;
}

.notification-house {
  border-left-color: #fcb69f;
}

.notification-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-color-text) 100%);
}

.notification-xp .notification-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.notification-level .notification-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.notification-badge .notification-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.notification-quest .notification-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.notification-challenge .notification-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.notification-house .notification-icon {
  background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-title {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
  font-size: 0.9rem;
}

.notification-message {
  color: var(--text-color-secondary);
  font-size: 0.8rem;
  line-height: 1.4;
}

.notification-xp {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  margin-top: 0.5rem;
}

.notification-actions {
  display: flex;
  align-items: center;
}

.notification-close {
  color: var(--text-color-secondary);
  width: 1.5rem;
  height: 1.5rem;
}

.notification-center {
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: var(--surface-card);
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.15);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
}

.notification-center-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--surface-border);
}

.notification-center-header h3 {
  margin: 0;
  color: var(--text-color);
}

.notification-center-content {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 0.5rem;
  transition: background-color 0.2s ease;
}

.notification-item:hover {
  background: var(--surface-hover);
}

.notification-unread {
  background: var(--primary-color-text);
  border-left: 3px solid var(--primary-color);
}

.notification-time {
  font-size: 0.7rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

.empty-state {
  text-align: center;
  padding: 2rem 0;
}

@media (max-width: 768px) {
  .gamification-notifications {
    left: 1rem;
    right: 1rem;
    top: auto;
    bottom: 1rem;
  }
  
  .notification-toast {
    min-width: auto;
    max-width: none;
  }
  
  .notification-center {
    width: 100%;
  }
}
</style>
