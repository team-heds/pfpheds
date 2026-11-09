<template>
  <div
    class="gamification-notifications"
    role="status"
    aria-live="polite"
    aria-atomic="false"
  >
    <!-- Notification Toast -->
    <article
      v-for="notification in visibleNotifications" 
      :key="notification.id"
      :class="[
        'notification-toast',
        `notification-${notification.type}`,
        { 'notification-entering': notification.entering },
        { 'notification-leaving': notification.leaving }
      ]"
    >
      <div class="notification-icon">
        <i :class="getNotificationIcon(notification.type)"></i>
      </div>
      
      <div class="notification-content">
        <div class="notification-title">{{ notification.title }}</div>
        <div class="notification-message">{{ notification.message }}</div>
        <div v-if="notification.xpGain" class="notification-xp-gain">
          +{{ notification.xpGain }} XP
        </div>
      </div>
      
      <div class="notification-actions">
        <Button 
          icon="pi pi-times" 
          class="p-button-text p-button-sm notification-close"
          :aria-label="`Fermer la notification : ${notification.title}`"
          @click.stop="dismissNotification(notification.id)"
        />
      </div>
    </article>

    <!-- Notification Center (optionnel) -->
    <div v-if="centerVisible" class="notification-center">
      <div class="notification-center-header">
        <h3>Notifications Gamification</h3>
        <Button 
          icon="pi pi-times" 
          class="p-button-text"
          aria-label="Fermer le centre de notifications"
          @click="centerVisible = false"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import Button from 'primevue/button'
import { supabase } from '@/supabase'

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
  },
  realtimeEnabled: {
    type: Boolean,
    default: true
  }
})

// État des notifications
const notifications = ref([])
const allNotifications = ref([])
const listenerId = ref(null)
const centerVisible = ref(props.showCenter)
const scheduledTimers = new Set()
const MAX_NOTIFICATION_HISTORY = 50
let subscriptionGeneration = 0
let disposed = false

// Notifications visibles (limitées)
const visibleNotifications = computed(() => {
  return notifications.value.slice(0, props.maxVisible)
})

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

const schedule = (callback, delay) => {
  const timerId = window.setTimeout(() => {
    scheduledTimers.delete(timerId)
    callback()
  }, delay)
  scheduledTimers.add(timerId)
  return timerId
}

const clearScheduledTimers = () => {
  scheduledTimers.forEach((timerId) => window.clearTimeout(timerId))
  scheduledTimers.clear()
}

// Afficher une notification
const showNotification = (data) => {
  if (disposed || !props.userId || !data || typeof data !== 'object') return null
  if (Object.hasOwn(data, 'userId') && data.userId !== props.userId) return null
  const duplicate = data?.dedupeKey
    ? allNotifications.value.find((item) => item.dedupeKey === data.dedupeKey)
    : null
  if (duplicate) return duplicate.id

  const notification = createNotification(data)
  
  // Ajouter à la liste des notifications visibles
  notifications.value.unshift(notification)
  if (notifications.value.length > MAX_NOTIFICATION_HISTORY) {
    notifications.value.splice(MAX_NOTIFICATION_HISTORY)
  }
  
  // Ajouter à toutes les notifications
  allNotifications.value.unshift(notification)
  if (allNotifications.value.length > MAX_NOTIFICATION_HISTORY) {
    allNotifications.value.splice(MAX_NOTIFICATION_HISTORY)
  }
  
  // Animation d'entrée
  schedule(() => {
    const notif = notifications.value.find(n => n.id === notification.id)
    if (notif) {
      notif.entering = false
    }
  }, 100)
  
  // Auto-hide si activé
  if (props.autoHide) {
    schedule(() => {
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
    
    schedule(() => {
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index > -1) {
        notifications.value.splice(index, 1)
      }
    }, 300)
  }
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
  if (!log || !props.userId || log.user_id !== props.userId) return
  if ((Number(log.amount) || 0) <= 0) return
  
  const notificationData = {
    sourceLogId: log.id,
    type: 'xp',
    timestamp: log.created_at ? new Date(log.created_at).getTime() : Date.now()
  }

  const action = String(log.action || '').toUpperCase()
  
  switch (action) {
    case 'BADGE_UNLOCK':
    case 'BADGE_UNLOCKED':
      notificationData.title = 'Nouveau badge obtenu!'
      notificationData.message = log.description || 'Badge débloqué'
      notificationData.type = 'badge'
      notificationData.dedupeKey = log.source_id ? `badge:${log.source_id}` : null
      break

    case 'QUEST_COMPLETE':
    case 'QUEST_COMPLETED':
      notificationData.title = 'Quête terminée!'
      notificationData.message = log.description || 'Quête accomplie avec succès'
      notificationData.type = 'quest'
      break

    case 'CHALLENGE_COMPLETE':
    case 'CHALLENGE_COMPLETED':
      notificationData.title = 'Défi relevé!'
      notificationData.message = log.description || 'Défi accompli avec succès'
      notificationData.type = 'challenge'
      break

    default:
      notificationData.title = 'Points d\'expérience gagnés!'
      notificationData.message = log.description || 'Progression enregistrée'
      notificationData.xpGain = Number(log.amount) > 0 ? Number(log.amount) : null
  }
  
  showNotification(notificationData)
}

// S'abonner aux mises à jour d'activité
const subscribeToActivity = () => {
  unsubscribeFromActivity()
  if (disposed || !props.userId || !props.realtimeEnabled) return
  const subscribedUserId = props.userId
  const generation = subscriptionGeneration
  listenerId.value = supabase
    .channel(`gamification-notifications-${props.userId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'xp_history',
        filter: `user_id=eq.${props.userId}`
      },
      ({ new: activity }) => {
        if (disposed || generation !== subscriptionGeneration || subscribedUserId !== props.userId) return
        processActivityLog(activity)
      }
    )
    .subscribe()
}

const unsubscribeFromActivity = () => {
  subscriptionGeneration += 1
  if (!listenerId.value) return
  supabase.removeChannel(listenerId.value)
  listenerId.value = null
}

// API publique pour créer des notifications manuellement
const notify = (data) => {
  return showNotification(data)
}

const handleImmediateNotification = (event) => {
  const detail = event?.detail
  if (!detail || typeof detail !== 'object' || !props.userId) return
  if (Object.hasOwn(detail, 'userId') && detail.userId !== props.userId) return
  showNotification(detail)
}

// Exposer les méthodes publiques
defineExpose({
  notify,
  dismissNotification,
  showNotification
})

// Lifecycle
onMounted(() => {
  window.addEventListener('gamification:notification', handleImmediateNotification)
  if (props.userId && props.realtimeEnabled) {
    subscribeToActivity()
  }
})

watch(() => props.userId, (userId, previousUserId) => {
  if (userId === previousUserId) return
  clearScheduledTimers()
  notifications.value = []
  allNotifications.value = []
  centerVisible.value = props.showCenter
  subscribeToActivity()
}, { flush: 'sync' })

watch(() => props.realtimeEnabled, (enabled) => {
  subscribeToActivity()
})

watch(() => props.showCenter, (showCenter) => {
  centerVisible.value = showCenter
})

onUnmounted(() => {
  disposed = true
  window.removeEventListener('gamification:notification', handleImmediateNotification)
  unsubscribeFromActivity()
  clearScheduledTimers()
  notifications.value = []
  allNotifications.value = []
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
  --notification-accent: var(--primary-color);
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 0.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  border: 1px solid color-mix(in srgb, var(--notification-accent) 50%, var(--surface-border));
  width: min(25rem, calc(100vw - 2rem));
  pointer-events: auto;
  transition: opacity 0.3s ease, transform 0.3s ease;
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
  --notification-accent: var(--primary-color);
}

.notification-level {
  --notification-accent: #f093fb;
}

.notification-badge {
  --notification-accent: #43e97b;
}

.notification-quest {
  --notification-accent: #4facfe;
}

.notification-challenge {
  --notification-accent: #f093fb;
}

.notification-house {
  --notification-accent: #fcb69f;
}

.notification-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  font-size: 1.1rem;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--primary-color) 12%, var(--surface-card));
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
  overflow-wrap: anywhere;
}

.notification-xp-gain {
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
  width: 44px;
  height: 44px;
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
  background: color-mix(in srgb, var(--primary-color) 10%, var(--surface-card));
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
    bottom: calc(5.5rem + env(safe-area-inset-bottom, 0px));
  }
  
  .notification-toast {
    width: 100%;
  }
  
  .notification-center {
    width: 100%;
  }
}

@media (prefers-reduced-motion: reduce) {
  .notification-toast,
  .notification-item {
    transition: none;
  }
  .notification-toast {
    transform: none;
  }
  .notification-toast:not(.notification-leaving) {
    opacity: 1;
  }
}
</style>
