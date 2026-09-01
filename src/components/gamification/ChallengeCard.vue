<template>
  <div 
    class="challenge-card" 
    role="button"
    tabindex="0"
    :aria-label="`Voir le défi ${challenge.name}`"
    :class="[
      `difficulty-${challenge.difficulty.toLowerCase()}`,
      { 'completed': challenge.completed, 'near-completion': isNearCompletion }
    ]"
    :style="{ '--house-color': houseColor }"
    @click="$emit('click', challenge)"
    @keydown.enter="$emit('click', challenge)"
    @keydown.space.prevent="$emit('click', challenge)"
  >
    <!-- Difficulty Indicator -->
    <div class="difficulty-indicator" :style="{ backgroundColor: houseColor }">
      <span class="difficulty-icon">{{ difficultyConfig.icon }}</span>
      <span class="difficulty-text">{{ difficultyConfig.name }}</span>
    </div>
    
    <!-- Challenge Icon -->
    <div class="challenge-icon-container">
      <div class="challenge-icon" :class="{ 'completed-icon': challenge.completed }">
        {{ challenge.icon }}
      </div>
      
      <!-- Completion Checkmark -->
      <div v-if="challenge.completed" class="completion-checkmark">
        <i class="pi pi-check"></i>
      </div>
      
      <!-- Glow Effect for Near Completion -->
      <div v-if="isNearCompletion && !challenge.completed" class="near-completion-glow"></div>
    </div>
    
    <!-- Challenge Info -->
    <div class="challenge-info">
      <h4 class="challenge-name" :class="{ 'completed-text': challenge.completed }">
        {{ challenge.name }}
      </h4>
      
      <p class="challenge-description" :class="{ 'completed-text': challenge.completed }">
        {{ challenge.description }}
      </p>
      
      <!-- Progress Section -->
      <div class="progress-section">
        <div class="progress-header">
          <span class="progress-text">
            {{ challenge.progress || 0 }}/{{ challenge.target }}
          </span>
          <span class="progress-percentage">
            {{ progressPercentage }}%
          </span>
        </div>
        
        <div
          class="progress-bar-container"
          role="progressbar"
          aria-label="Progression du défi"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="progressPercentage"
        >
          <div class="progress-bar">
            <div 
              class="progress-fill" 
              :style="{ 
                width: progressPercentage + '%',
                backgroundColor: challenge.completed ? '#22C55E' : houseColor
              }"
            >
              <!-- Animated shimmer effect -->
              <div class="progress-shimmer" v-if="!challenge.completed"></div>
            </div>
          </div>
          
          <!-- Pulse effect for near completion -->
          <div 
            v-if="isNearCompletion && !challenge.completed" 
            class="progress-pulse"
            :style="{ backgroundColor: houseColor }"
          ></div>
        </div>
      </div>
      
      <!-- Reward Section -->
      <div class="reward-section">
        <div class="reward-item" v-if="challenge.reward.xp > 0">
          <i class="pi pi-star-fill reward-icon"></i>
          <span>+{{ challenge.reward.xp }} XP</span>
        </div>
        
        <div class="reward-item" v-if="challenge.reward.badge">
          <i class="pi pi-trophy reward-icon"></i>
          <span>Badge</span>
        </div>
        
        <div class="reward-item" v-if="challenge.reward.title">
          <i class="pi pi-crown reward-icon"></i>
          <span>{{ challenge.reward.title }}</span>
        </div>
      </div>
      
      <!-- Time Remaining -->
      <div class="time-remaining" v-if="!challenge.completed">
        <i class="pi pi-clock"></i>
        <span>{{ timeRemaining }}</span>
      </div>
      
      <!-- Completion Date -->
      <div class="completion-date" v-if="challenge.completed && challenge.completedAt">
        <i class="pi pi-check-circle"></i>
        <span>Complété {{ formatCompletionDate(challenge.completedAt) }}</span>
      </div>
    </div>
    
    <!-- Category Badge -->
    <div class="category-badge" :style="{ backgroundColor: categoryColor }">
      {{ categoryName }}
    </div>
    
    <!-- Completion Celebration -->
    <div v-if="challenge.completed" class="completion-celebration">
      <div class="celebration-particles">
        <div class="particle" v-for="i in 6" :key="i"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { CHALLENGE_DIFFICULTY } from '@/service/challengesService'

const props = defineProps({
  challenge: {
    type: Object,
    required: true
  },
  houseColor: {
    type: String,
    default: '#2E8B57'
  }
})

defineEmits(['click'])

// Computed properties
const difficultyConfig = computed(() => 
  CHALLENGE_DIFFICULTY[props.challenge.difficulty] || CHALLENGE_DIFFICULTY.EASY
)


const progressPercentage = computed(() => {
  if (!props.challenge.target) return 0
  const progress = props.challenge.progress || 0
  return Math.min(Math.round((progress / props.challenge.target) * 100), 100)
})

const isNearCompletion = computed(() => progressPercentage.value >= 80)

const categoryColors = {
  progression: props.houseColor,
  engagement: props.houseColor,
  apprentissage: props.houseColor,
  collection: props.houseColor,
  social: props.houseColor,
  exploration: props.houseColor
}

const categoryNames = {
  progression: 'Progression',
  engagement: 'Engagement',
  apprentissage: 'Apprentissage',
  collection: 'Collection',
  social: 'Social',
  exploration: 'Exploration'
}

const categoryColor = computed(() => 
  categoryColors[props.challenge.category] || '#6B7280'
)

const categoryName = computed(() => 
  categoryNames[props.challenge.category] || 'Général'
)

const timeRemaining = computed(() => {
  if (!props.challenge.endDate) return 'Temps illimité'
  
  const now = new Date()
  const end = new Date(props.challenge.endDate)
  const diff = end - now
  
  if (diff <= 0) return 'Expiré'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `${days}j ${hours}h restantes`
  if (hours > 0) return `${hours}h restantes`
  
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `${minutes}min restantes`
})

// Format completion date
const formatCompletionDate = (dateString) => {
  const date = new Date(dateString)
  const now = new Date()
  const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return 'aujourd\'hui'
  if (diffDays === 1) return 'hier'
  if (diffDays < 7) return `il y a ${diffDays} jours`
  
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short' 
  })
}
</script>

<style scoped>
.challenge-card {
  position: relative;
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.95) 0%, 
    color-mix(in srgb, var(--house-color) 15%, white) 100%
  );
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s ease;
  border: 2px solid var(--house-color);
  overflow: hidden;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.challenge-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.challenge-card:focus-visible {
  outline: 3px solid var(--primary-color);
  outline-offset: 3px;
}

.challenge-card:active {
  transform: translateY(-2px) scale(1.01);
  transition-duration: 0.1s;
}

/* Difficulty Styles */
.difficulty-easy {
  border-color: #22C55E;
}

.difficulty-medium {
  border-color: #F59E0B;
}

.difficulty-hard {
  border-color: #EF4444;
}

.difficulty-legendary {
  border-color: #8B5CF6;
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
}

/* Completed State */
.completed {
  background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);
  border-color: #22C55E;
}

.completed .challenge-icon {
  filter: grayscale(0) brightness(1.1);
}

/* Near Completion State */
.near-completion {
  animation: near-completion-pulse 2s ease-in-out infinite;
}

@keyframes near-completion-pulse {
  0%, 100% {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  50% {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1), 0 0 20px rgba(245, 158, 11, 0.4);
  }
}

/* Difficulty Indicator */
.difficulty-indicator {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.5rem 1rem;
  border-radius: 0 16px 0 12px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  z-index: 2;
}

.difficulty-icon {
  font-size: 0.875rem;
}

/* Challenge Icon */
.challenge-icon-container {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.challenge-icon {
  font-size: 3rem;
  transition: all 0.3s ease;
  position: relative;
  z-index: 2;
}

.completed-icon {
  filter: grayscale(0.3) brightness(0.8);
}

.completion-checkmark {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--house-color, #2E8B57);
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  z-index: 3;
  animation: checkmark-appear 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes checkmark-appear {
  0% {
    transform: scale(0) rotate(-180deg);
    opacity: 0;
  }
  100% {
    transform: scale(1) rotate(0deg);
    opacity: 1;
  }
}

.near-completion-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245, 158, 11, 0.3) 0%, transparent 70%);
  animation: glow-pulse 2s ease-in-out infinite;
  z-index: 1;
}

@keyframes glow-pulse {
  0%, 100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.3;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2);
    opacity: 0.6;
  }
}

/* Challenge Info */
.challenge-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.challenge-name {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-color);
  line-height: 1.3;
}

.challenge-description {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin: 0;
  line-height: 1.4;
}

.completed-text {
  opacity: 0.8;
}

/* Progress Section */
.progress-section {
  margin: 0.5rem 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.progress-text {
  font-weight: 600;
  color: var(--text-color);
}

.progress-percentage {
  color: var(--text-color-secondary);
  font-weight: 500;
}

.progress-bar-container {
  position: relative;
}

.progress-bar {
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

.progress-shimmer {
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
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

.progress-pulse {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 4px;
  opacity: 0.3;
  animation: progress-pulse 1.5s ease-in-out infinite;
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

/* Reward Section */
.reward-section {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.5rem 0;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-color-secondary);
}

.reward-icon {
  font-size: 0.75rem;
  color: #F59E0B;
}

/* Time and Completion Info */
.time-remaining,
.completion-date {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-top: auto;
}

.time-remaining i,
.completion-date i {
  font-size: 0.75rem;
}

.completion-date {
  color: #22C55E;
}

/* Category Badge */
.category-badge {
  position: absolute;
  bottom: 0;
  left: 0;
  padding: 0.25rem 0.75rem;
  font-size: 0.7rem;
  font-weight: 600;
  color: white;
  border-radius: 0 8px 0 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* Completion Celebration */
.completion-celebration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 1;
}

.celebration-particles {
  position: relative;
  width: 100%;
  height: 100%;
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  background: #FFD700;
  border-radius: 50%;
  animation: particle-float 3s ease-out infinite;
}

.particle:nth-child(1) { top: 20%; left: 20%; animation-delay: 0s; }
.particle:nth-child(2) { top: 30%; right: 20%; animation-delay: 0.5s; }
.particle:nth-child(3) { top: 50%; left: 10%; animation-delay: 1s; }
.particle:nth-child(4) { top: 60%; right: 15%; animation-delay: 1.5s; }
.particle:nth-child(5) { top: 80%; left: 30%; animation-delay: 2s; }
.particle:nth-child(6) { top: 70%; right: 30%; animation-delay: 2.5s; }

@keyframes particle-float {
  0% {
    transform: translateY(0) scale(0);
    opacity: 1;
  }
  50% {
    transform: translateY(-20px) scale(1);
    opacity: 0.8;
  }
  100% {
    transform: translateY(-40px) scale(0);
    opacity: 0;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .challenge-card {
    padding: 1rem;
    min-height: 260px;
  }
  
  .challenge-icon {
    font-size: 2.5rem;
  }
  
  .challenge-name {
    font-size: 1rem;
  }
  
  .challenge-description {
    font-size: 0.8rem;
  }
}

/* Hover Effects */
.challenge-card:hover .challenge-icon {
  transform: scale(1.1);
}

.challenge-card:hover .progress-shimmer {
  animation-duration: 1s;
}

/* Legendary Challenge Special Effects */
.difficulty-legendary::before {
  content: '';
  position: absolute;
  top: -2px;
  left: -2px;
  right: -2px;
  bottom: -2px;
  background: linear-gradient(45deg, #8B5CF6, #EC4899, #F59E0B, #8B5CF6);
  border-radius: 18px;
  z-index: -1;
  animation: legendary-border 3s linear infinite;
}

@keyframes legendary-border {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>
