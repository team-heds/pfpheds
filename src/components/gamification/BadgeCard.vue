<template>
  <div 
    class="badge-card" 
    role="button"
    tabindex="0"
    :aria-label="`${isUnlocked ? 'Badge obtenu' : 'Badge verrouillé'} : ${badge.name}`"
    :class="[
      `rarity-${badge.rarity}`,
      { 'unlocked': isUnlocked, 'locked': !isUnlocked, 'glow': shouldGlow }
    ]"
    @click="$emit('click', badge)"
    @keydown.enter="$emit('click', badge)"
    @keydown.space.prevent="$emit('click', badge)"
    v-tooltip="tooltipContent"
  >
    <!-- Badge Icon -->
    <div class="badge-icon-container">
      <div class="badge-icon" :style="{ color: isUnlocked ? badge.color : '#666' }">
        {{ badge.icon }}
      </div>
      
      <!-- Rarity Glow Effect -->
      <div v-if="shouldGlow && isUnlocked" class="glow-effect" :style="{ backgroundColor: badge.color }"></div>
      
      <!-- Lock Overlay -->
      <div v-if="!isUnlocked" class="lock-overlay">
        <i class="pi pi-lock"></i>
      </div>
    </div>
    
    <!-- Badge Info -->
    <div class="badge-info">
      <h4 class="badge-name" :class="{ 'locked-text': !isUnlocked }">
        {{ badge.name }}
      </h4>
      
      <p class="badge-description" :class="{ 'locked-text': !isUnlocked }">
        {{ isUnlocked ? badge.description : '???' }}
      </p>
      
      <!-- XP Bonus -->
      <div class="badge-xp" v-if="isUnlocked">
        <i class="pi pi-star-fill"></i>
        <span>+{{ badge.xpBonus }} XP</span>
      </div>
      
      <!-- Unlock Date -->
      <div class="unlock-date" v-if="isUnlocked && badge.unlockedAt">
        <i class="pi pi-calendar"></i>
        <span>{{ formatUnlockDate(badge.unlockedAt) }}</span>
      </div>
      
      <!-- Progress Hint for Locked Badges -->
      <div class="progress-hint" v-if="!isUnlocked && progressHint">
        <i class="pi pi-info-circle"></i>
        <span>{{ progressHint }}</span>
      </div>
      
      <!-- Progress Bar for Badges in Progress -->
      <div class="progress-container" v-if="!isUnlocked && showProgress && progressValue > 0">
        <div class="progress-label">
          <span>{{ Math.round(progressPercentage) }}% complété</span>
          <span class="progress-numbers">{{ progressValue }}/{{ progressMax }}</span>
        </div>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ 
              width: progressPercentage + '%',
              backgroundColor: rarityColor 
            }"
          ></div>
          <div class="progress-glow" :style="{ backgroundColor: rarityColor }"></div>
        </div>
      </div>
    </div>
    
    <!-- Rarity Indicator -->
    <div class="rarity-indicator" :style="{ backgroundColor: rarityColor }">
      {{ rarityName }}
    </div>
    
    <!-- New Badge Animation -->
    <div v-if="isNewlyUnlocked" class="new-badge-indicator">
      <i class="pi pi-sparkles"></i>
      NOUVEAU !
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { BADGE_RARITY } from '@/service/badgesService'

const props = defineProps({
  badge: {
    type: Object,
    required: true
  },
  isUnlocked: {
    type: Boolean,
    default: false
  },
  isNewlyUnlocked: {
    type: Boolean,
    default: false
  },
  progressHint: {
    type: String,
    default: ''
  },
  showProgress: {
    type: Boolean,
    default: false
  },
  progressValue: {
    type: Number,
    default: 0
  },
  progressMax: {
    type: Number,
    default: 100
  }
})

defineEmits(['click'])

// Computed properties pour la rareté
const rarityConfig = computed(() => BADGE_RARITY[props.badge.rarity] || BADGE_RARITY.common)
const rarityColor = computed(() => rarityConfig.value.color)
const rarityName = computed(() => rarityConfig.value.name)
const shouldGlow = computed(() => rarityConfig.value.glow && props.isUnlocked)

// Progress calculations
const progressPercentage = computed(() => {
  if (props.progressMax === 0) return 0
  return Math.min((props.progressValue / props.progressMax) * 100, 100)
})

// Tooltip content
const tooltipContent = computed(() => {
  if (props.isUnlocked) {
    return `${props.badge.name}\n${props.badge.description}\n+${props.badge.xpBonus} XP`
  } else {
    return `Badge verrouillé\n${props.progressHint || 'Continuez à jouer pour le débloquer !'}`
  }
})

// Format unlock date
const formatUnlockDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'Aujourd\'hui'
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays} jours`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
}
</script>

<style scoped>
.badge-card {
  position: relative;
  background: var(--surface-card);
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease, opacity 0.3s ease;
  border: 2px solid transparent;
  overflow: hidden;
  min-height: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  backdrop-filter: blur(10px);
}

.badge-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.badge-card:focus-visible {
  outline: 3px solid var(--primary-color);
  outline-offset: 3px;
}

.badge-card:active {
  transform: translateY(-2px) scale(1.01);
  transition-duration: 0.1s;
}

/* Rarity Styles */
.rarity-common {
  border-color: #9E9E9E;
}

.rarity-uncommon {
  border-color: #4CAF50;
}

.rarity-rare {
  border-color: #FF9800;
}

.rarity-legendary {
  border-color: #9C27B0;
}

/* Unlocked vs Locked States */
.unlocked {
  background: var(--surface-card);
  color: var(--text-color);
}

.locked {
  background: var(--surface-ground);
  color: var(--text-color-secondary);
  opacity: 0.7;
}

.locked:hover {
  opacity: 0.9;
}

/* Badge Icon Container */
.badge-icon-container {
  position: relative;
  margin-bottom: 1rem;
}

.badge-icon {
  font-size: 3rem;
  margin-bottom: 0.5rem;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.unlocked .badge-icon {
  filter: drop-shadow(0 0 8px currentColor);
}

/* Glow Effect for Rare Badges */
.glow-effect {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  opacity: 0.3;
  animation: pulse-glow 2s ease-in-out infinite;
  z-index: 1;
}

@keyframes pulse-glow {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.1;
  }
}

/* Lock Overlay */
.lock-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0, 0, 0, 0.7);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  z-index: 3;
}

/* Badge Info */
.badge-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.badge-name {
  font-size: 1.1rem;
  font-weight: bold;
  margin: 0;
  color: var(--text-color);
}

.badge-description {
  font-size: 0.9rem;
  margin: 0;
  color: var(--text-color-secondary);
  line-height: 1.4;
}

.locked-text {
  color: var(--text-color-secondary) !important;
  opacity: 0.6;
}

/* XP Bonus */
.badge-xp {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #FFD700;
  font-weight: bold;
  font-size: 0.9rem;
}

.badge-xp i {
  font-size: 0.8rem;
}

/* Unlock Date */
.unlock-date {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-color-secondary);
  font-size: 0.8rem;
}

/* Progress Hint */
.progress-hint {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--primary-color);
  font-size: 0.8rem;
  font-style: italic;
}

/* Rarity Indicator */
.rarity-indicator {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.25rem 0.75rem;
  font-size: 0.7rem;
  font-weight: bold;
  color: white;
  border-radius: 0 16px 0 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* New Badge Indicator */
.new-badge-indicator {
  position: absolute;
  top: -5px;
  left: -5px;
  background: linear-gradient(45deg, #FF6B6B, #FF8E53);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  font-size: 0.7rem;
  font-weight: bold;
  animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  display: flex;
  align-items: center;
  gap: 0.25rem;
  z-index: 4;
}

@keyframes bounce-in {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* Glow Animation for Unlocked Rare Badges */
.glow:hover .badge-icon {
  animation: icon-glow 1s ease-in-out;
}

@keyframes icon-glow {
  0%, 100% {
    filter: drop-shadow(0 0 8px currentColor);
  }
  50% {
    filter: drop-shadow(0 0 16px currentColor) drop-shadow(0 0 24px currentColor);
  }
}

/* Responsive */
@media (max-width: 768px) {
  .badge-card {
    padding: 1rem;
    min-height: 180px;
  }
  
  .badge-icon {
    font-size: 2.5rem;
  }
  
  .badge-name {
    font-size: 1rem;
  }
  
  .badge-description {
    font-size: 0.8rem;
  }
}

/* Hover Effects */
.unlocked:hover .badge-icon {
  transform: scale(1.1);
}

.locked:hover .lock-overlay {
  background: rgba(0, 0, 0, 0.8);
}

/* Category-specific subtle background patterns */
.badge-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  opacity: 0.05;
  background-size: 20px 20px;
  pointer-events: none;
  z-index: 0;
}

.badge-card > * {
  position: relative;
  z-index: 1;
}

/* Progress Bar Styles */
.progress-container {
  width: 100%;
  margin-top: 0.75rem;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.progress-numbers {
  font-weight: 600;
  color: var(--text-color);
}

.progress-bar {
  position: relative;
  width: 100%;
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: progress-shimmer 2s infinite;
}

@keyframes progress-shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.progress-glow {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 100%;
  opacity: 0.3;
  border-radius: 4px;
  filter: blur(4px);
  animation: progress-pulse 2s ease-in-out infinite;
}

@keyframes progress-pulse {
  0%, 100% {
    opacity: 0.3;
    transform: scaleY(1);
  }
  50% {
    opacity: 0.6;
    transform: scaleY(1.2);
  }
}

/* Near completion effects */
.progress-container:has(.progress-fill[style*="width: 8"]) .progress-bar,
.progress-container:has(.progress-fill[style*="width: 9"]) .progress-bar {
  animation: near-completion-glow 1.5s ease-in-out infinite;
}

@keyframes near-completion-glow {
  0%, 100% {
    box-shadow: 0 0 5px rgba(255, 215, 0, 0.3);
  }
  50% {
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.6);
  }
}

/* Enhanced unlock animation */
.badge-card.unlocked {
  animation: unlock-celebration 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes unlock-celebration {
  0% {
    transform: scale(0.8) rotate(-5deg);
    opacity: 0;
  }
  50% {
    transform: scale(1.1) rotate(2deg);
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

/* Particle effect for legendary badges */
.rarity-legendary.unlocked::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(
    circle,
    rgba(156, 39, 176, 0.1) 0%,
    transparent 70%
  );
  animation: legendary-aura 3s ease-in-out infinite;
  pointer-events: none;
}

@keyframes legendary-aura {
  0%, 100% {
    transform: rotate(0deg) scale(1);
    opacity: 0.1;
  }
  50% {
    transform: rotate(180deg) scale(1.2);
    opacity: 0.3;
  }
}
</style>
