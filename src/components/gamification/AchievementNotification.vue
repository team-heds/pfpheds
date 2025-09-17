<template>
  <Teleport to="body">
    <div class="notification-container">
      <TransitionGroup name="notification" tag="div">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="achievement-notification"
          :class="`rarity-${notification.badge.rarity}`"
          @click="dismissNotification(notification.id)"
        >
          <!-- Background Pattern -->
          <div class="notification-bg"></div>
          
          <!-- Content -->
          <div class="notification-content">
            <!-- Badge Icon -->
            <div class="badge-icon-large" :style="{ color: notification.badge.color }">
              {{ notification.badge.icon }}
              
              <!-- Sparkle Effects -->
              <div class="sparkles">
                <div class="sparkle" v-for="i in 6" :key="i" :style="{ animationDelay: `${i * 0.1}s` }">✨</div>
              </div>
            </div>
            
            <!-- Text Content -->
            <div class="notification-text">
              <h3 class="achievement-title">🏆 Badge Débloqué !</h3>
              <h4 class="badge-name" :style="{ color: notification.badge.color }">
                {{ notification.badge.name }}
              </h4>
              <p class="badge-description">{{ notification.badge.description }}</p>
              
              <!-- XP Bonus -->
              <div class="xp-bonus">
                <i class="pi pi-star-fill"></i>
                <span>+{{ notification.badge.xpBonus }} XP</span>
              </div>
              
              <!-- Rarity Badge -->
              <div class="rarity-badge" :style="{ backgroundColor: rarityColors[notification.badge.rarity] }">
                {{ rarityNames[notification.badge.rarity] }}
              </div>
            </div>
            
            <!-- Close Button -->
            <button class="close-btn" @click.stop="dismissNotification(notification.id)">
              <i class="pi pi-times"></i>
            </button>
          </div>
          
          <!-- Progress Bar -->
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ 
                animationDuration: `${notification.duration}ms`,
                backgroundColor: notification.badge.color 
              }"
            ></div>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const notifications = ref([])
let notificationId = 0

// Rarity configuration
const rarityColors = {
  common: '#9E9E9E',
  uncommon: '#4CAF50',
  rare: '#FF9800',
  legendary: '#9C27B0'
}

const rarityNames = {
  common: 'Commun',
  uncommon: 'Peu Commun',
  rare: 'Rare',
  legendary: 'Légendaire'
}

/**
 * Affiche une notification de badge débloqué
 * @param {Object} badge - Configuration du badge
 * @param {number} duration - Durée d'affichage en ms (défaut: 5000)
 */
const showAchievementNotification = (badge, duration = 5000) => {
  const notification = {
    id: ++notificationId,
    badge,
    duration,
    timestamp: Date.now()
  }
  
  notifications.value.push(notification)
  
  // Auto-dismiss après la durée spécifiée
  setTimeout(() => {
    dismissNotification(notification.id)
  }, duration)
  
  // Jouer un son (optionnel)
  playNotificationSound(badge.rarity)
}

/**
 * Ferme une notification
 * @param {number} id - ID de la notification
 */
const dismissNotification = (id) => {
  const index = notifications.value.findIndex(n => n.id === id)
  if (index > -1) {
    notifications.value.splice(index, 1)
  }
}

/**
 * Joue un son basé sur la rareté du badge
 * @param {string} rarity - Niveau de rareté
 */
const playNotificationSound = (rarity) => {
  try {
    // Créer un contexte audio simple
    const audioContext = new (window.AudioContext || window.webkitAudioContext)()
    
    // Fréquences différentes selon la rareté
    const frequencies = {
      common: [523, 659], // Do, Mi
      uncommon: [523, 659, 784], // Do, Mi, Sol
      rare: [523, 659, 784, 1047], // Do, Mi, Sol, Do octave
      legendary: [523, 659, 784, 1047, 1319] // Do, Mi, Sol, Do, Mi octave
    }
    
    const notes = frequencies[rarity] || frequencies.common
    
    notes.forEach((freq, index) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()
        
        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)
        
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime)
        oscillator.type = 'sine'
        
        gainNode.gain.setValueAtTime(0, audioContext.currentTime)
        gainNode.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + 0.01)
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3)
        
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      }, index * 100)
    })
  } catch (error) {
    console.log('Audio non disponible:', error)
  }
}

/**
 * Ferme toutes les notifications
 */
const dismissAllNotifications = () => {
  notifications.value = []
}

// Exposer les méthodes pour utilisation externe
defineExpose({
  showAchievementNotification,
  dismissNotification,
  dismissAllNotifications
})

// Nettoyage au démontage
onUnmounted(() => {
  notifications.value = []
})
</script>

<style scoped>
.notification-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  pointer-events: none;
}

.achievement-notification {
  position: relative;
  width: 400px;
  background: var(--surface-card);
  border-radius: 16px;
  margin-bottom: 1rem;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  pointer-events: auto;
  cursor: pointer;
  border: 2px solid transparent;
}

/* Rarity Border Colors */
.rarity-common { border-color: #9E9E9E; }
.rarity-uncommon { border-color: #4CAF50; }
.rarity-rare { border-color: #FF9800; }
.rarity-legendary { border-color: #9C27B0; }

/* Background Pattern */
.notification-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.1) 0%, 
    rgba(255, 255, 255, 0.05) 50%, 
    rgba(0, 0, 0, 0.05) 100%
  );
  opacity: 0.8;
}

/* Content Layout */
.notification-content {
  position: relative;
  display: flex;
  align-items: center;
  padding: 1.5rem;
  gap: 1rem;
  z-index: 2;
}

/* Badge Icon */
.badge-icon-large {
  position: relative;
  font-size: 3rem;
  filter: drop-shadow(0 0 12px currentColor);
  animation: bounce-icon 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes bounce-icon {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  60% {
    transform: scale(1.2) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* Sparkles */
.sparkles {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.sparkle {
  position: absolute;
  font-size: 1rem;
  animation: sparkle-float 2s ease-in-out infinite;
  opacity: 0;
}

.sparkle:nth-child(1) { top: -30px; left: -20px; }
.sparkle:nth-child(2) { top: -25px; left: 15px; }
.sparkle:nth-child(3) { top: 5px; left: -35px; }
.sparkle:nth-child(4) { top: 10px; left: 25px; }
.sparkle:nth-child(5) { top: 30px; left: -15px; }
.sparkle:nth-child(6) { top: 25px; left: 10px; }

@keyframes sparkle-float {
  0%, 100% {
    opacity: 0;
    transform: translateY(0px) scale(0.5);
  }
  50% {
    opacity: 1;
    transform: translateY(-10px) scale(1);
  }
}

/* Text Content */
.notification-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.achievement-title {
  font-size: 1rem;
  font-weight: bold;
  margin: 0;
  color: var(--primary-color);
  animation: slide-in-right 0.4s ease-out;
}

.badge-name {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0;
  animation: slide-in-right 0.5s ease-out;
}

.badge-description {
  font-size: 0.9rem;
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.3;
  animation: slide-in-right 0.6s ease-out;
}

.xp-bonus {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #FFD700;
  font-weight: bold;
  font-size: 0.9rem;
  animation: slide-in-right 0.7s ease-out;
}

.rarity-badge {
  align-self: flex-start;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: bold;
  color: white;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  animation: slide-in-right 0.8s ease-out;
}

@keyframes slide-in-right {
  0% {
    opacity: 0;
    transform: translateX(20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Close Button */
.close-btn {
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-color-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: var(--text-color);
}

/* Progress Bar */
.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  width: 100%;
  transform-origin: left;
  animation: progress-countdown linear forwards;
}

@keyframes progress-countdown {
  0% {
    transform: scaleX(1);
  }
  100% {
    transform: scaleX(0);
  }
}

/* Transitions */
.notification-enter-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.notification-enter-from {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.notification-leave-to {
  opacity: 0;
  transform: translateX(100%) scale(0.8);
}

.notification-move {
  transition: transform 0.3s ease;
}

/* Hover Effects */
.achievement-notification:hover {
  transform: translateX(-5px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
}

.achievement-notification:hover .progress-fill {
  animation-play-state: paused;
}

/* Responsive */
@media (max-width: 768px) {
  .notification-container {
    top: 10px;
    right: 10px;
    left: 10px;
  }
  
  .achievement-notification {
    width: auto;
  }
  
  .notification-content {
    padding: 1rem;
  }
  
  .badge-icon-large {
    font-size: 2.5rem;
  }
  
  .achievement-title {
    font-size: 0.9rem;
  }
  
  .badge-name {
    font-size: 1.1rem;
  }
  
  .badge-description {
    font-size: 0.8rem;
  }
}

/* Special Effects for Legendary Badges */
.rarity-legendary {
  animation: legendary-glow 2s ease-in-out infinite;
}

@keyframes legendary-glow {
  0%, 100% {
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  50% {
    box-shadow: 0 8px 32px rgba(156, 39, 176, 0.4), 0 0 20px rgba(156, 39, 176, 0.2);
  }
}
</style>
