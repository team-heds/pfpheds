<template>
  <div 
    class="quest-card" 
    :class="[
      `quest-${quest.difficulty?.toLowerCase()}`,
      `quest-${quest.status}`,
      { 'quest-completed': isCompleted, 'quest-expired': isExpired }
    ]"
    :style="{ '--house-color': houseColor }"
    @click="$emit('click', quest)"
  >
    <!-- Header de la quête -->
    <div class="quest-header">
      <div class="quest-icon">
        <i :class="getQuestIcon(quest.type)" :style="{ color: getDifficultyColor() }"></i>
      </div>
      <div class="quest-info">
        <h3 class="quest-title">{{ quest.title }}</h3>
        <p class="quest-description">{{ quest.description }}</p>
      </div>
      <div class="quest-status-badge">
        <span class="status-indicator" :class="quest.status">
          {{ getStatusText() }}
        </span>
      </div>
    </div>

    <!-- Informations de la quête -->
    <div class="quest-meta">
      <div class="quest-difficulty">
        <i class="pi pi-star-fill"></i>
        <span>{{ getDifficultyName() }}</span>
      </div>
      <div class="quest-type">
        <i class="pi pi-tag"></i>
        <span>{{ getTypeText() }}</span>
      </div>
      <div v-if="quest.duration" class="quest-duration">
        <i class="pi pi-clock"></i>
        <span>{{ formatDuration() }}</span>
      </div>
    </div>

    <!-- Progression globale -->
    <div class="quest-progress-section">
      <div class="progress-header">
        <span class="progress-text">Progression</span>
        <span class="progress-percentage">{{ quest.progress || 0 }}%</span>
      </div>
      <div class="progress-bar-container">
        <div 
          class="progress-bar" 
          :style="{ 
            width: `${quest.progress || 0}%`,
            backgroundColor: getDifficultyColor()
          }"
        >
          <div class="progress-shimmer" v-if="quest.progress > 0 && quest.progress < 100"></div>
        </div>
      </div>
    </div>

    <!-- Étapes de la quête -->
    <div class="quest-steps" v-if="showSteps && quest.steps">
      <h4 class="steps-title">
        <i class="pi pi-list"></i>
        Étapes ({{ completedStepsCount }}/{{ quest.steps.length }})
      </h4>
      
      <div class="steps-list">
        <div 
          v-for="(step, index) in quest.steps" 
          :key="step.id"
          class="quest-step"
          :class="{ 
            'step-completed': isStepCompleted(step),
            'step-current': isCurrentStep(step, index)
          }"
        >
          <div class="step-icon">
            <i 
              :class="isStepCompleted(step) ? 'pi pi-check-circle' : 'pi pi-circle'"
              :style="{ color: isStepCompleted(step) ? getDifficultyColor() : '#ccc' }"
            ></i>
          </div>
          
          <div class="step-content">
            <h5 class="step-title">{{ step.title }}</h5>
            <p class="step-description">{{ step.description }}</p>
            
            <!-- Progression de l'étape -->
            <div class="step-progress" v-if="step.target > 1">
              <div class="step-progress-bar">
                <div 
                  class="step-progress-fill"
                  :style="{ 
                    width: `${Math.min((step.current / step.target) * 100, 100)}%`,
                    backgroundColor: getDifficultyColor()
                  }"
                ></div>
              </div>
              <span class="step-progress-text">
                {{ step.current }}/{{ step.target }}
              </span>
            </div>
          </div>
          
          <div class="step-reward">
            <span class="step-xp">+{{ step.xp }} XP</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Récompenses -->
    <div class="quest-rewards">
      <h4 class="rewards-title">
        <i class="pi pi-gift"></i>
        Récompenses
      </h4>
      <div class="rewards-list">
        <div class="reward-item" v-if="totalRewards.totalXP">
          <i class="pi pi-star-fill"></i>
          <span>{{ formatNumber(totalRewards.totalXP) }} XP</span>
        </div>
        <div class="reward-item" v-if="quest.rewards.badge">
          <i class="pi pi-trophy"></i>
          <span>Badge: {{ quest.rewards.badge }}</span>
        </div>
        <div class="reward-item" v-if="quest.rewards.title">
          <i class="pi pi-crown"></i>
          <span>Titre: {{ quest.rewards.title }}</span>
        </div>
        <div class="reward-item special" v-if="quest.rewards.special">
          <i class="pi pi-sparkles"></i>
          <span>{{ quest.rewards.special }}</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="quest-actions" v-if="!isCompleted && !isExpired">
      <Button 
        v-if="quest.status === 'available'"
        @click.stop="$emit('start-quest', quest.id)"
        class="start-quest-btn"
        :style="{ backgroundColor: getDifficultyColor() }"
      >
        <i class="pi pi-play"></i>
        Commencer la quête
      </Button>
      
      <Button 
        v-else-if="quest.status === 'in_progress'"
        @click.stop="$emit('view-details', quest.id)"
        class="continue-quest-btn"
        outlined
        :style="{ borderColor: getDifficultyColor(), color: getDifficultyColor() }"
      >
        <i class="pi pi-eye"></i>
        Voir les détails
      </Button>
    </div>

    <!-- Indicateur de complétion -->
    <div v-if="isCompleted" class="completion-overlay">
      <div class="completion-badge">
        <i class="pi pi-check-circle"></i>
        <span>Quête Terminée!</span>
      </div>
    </div>

    <!-- Indicateur d'expiration -->
    <div v-if="isExpired" class="expiration-overlay">
      <div class="expiration-badge">
        <i class="pi pi-times-circle"></i>
        <span>Quête Expirée</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { QUEST_DIFFICULTIES, QUEST_STATUS, calculateQuestRewards } from '../../service/questsService'
import Button from 'primevue/button'

// Props
const props = defineProps({
  quest: {
    type: Object,
    required: true
  },
  showSteps: {
    type: Boolean,
    default: true
  },
  houseColor: {
    type: String,
    default: '#2E8B57'
  }
})

// Emits
const emit = defineEmits(['click', 'start-quest', 'view-details'])

// Computed properties
const isCompleted = computed(() => props.quest.status === QUEST_STATUS.COMPLETED)
const isExpired = computed(() => props.quest.status === QUEST_STATUS.EXPIRED)

const completedStepsCount = computed(() => {
  if (!props.quest.steps) return 0
  return props.quest.steps.filter(step => step.current >= step.target).length
})

const totalRewards = computed(() => {
  return calculateQuestRewards(props.quest)
})

// Methods
const getDifficultyColor = () => {
  // Utiliser la couleur de la maison au lieu des couleurs de difficulté
  return props.houseColor
}

const getDifficultyName = () => {
  const difficulty = QUEST_DIFFICULTIES[props.quest.difficulty]
  return difficulty ? difficulty.name : 'Inconnu'
}

const getStatusText = () => {
  const statusMap = {
    [QUEST_STATUS.AVAILABLE]: 'Disponible',
    [QUEST_STATUS.IN_PROGRESS]: 'En cours',
    [QUEST_STATUS.COMPLETED]: 'Terminée',
    [QUEST_STATUS.EXPIRED]: 'Expirée',
    [QUEST_STATUS.LOCKED]: 'Verrouillée'
  }
  return statusMap[props.quest.status] || 'Inconnu'
}

const getTypeText = () => {
  const typeMap = {
    story: 'Histoire',
    progression: 'Progression',
    exploration: 'Exploration',
    social: 'Social',
    challenge: 'Défi'
  }
  return typeMap[props.quest.type] || 'Autre'
}

const getQuestIcon = (type) => {
  const iconMap = {
    story: 'pi pi-book',
    progression: 'pi pi-chart-line',
    exploration: 'pi pi-compass',
    social: 'pi pi-users',
    challenge: 'pi pi-bolt'
  }
  return iconMap[type] || 'pi pi-flag'
}

const formatDuration = () => {
  if (!props.quest.duration) return ''
  
  const days = Math.floor(props.quest.duration / (24 * 60 * 60 * 1000))
  if (days > 0) {
    return `${days} jour${days > 1 ? 's' : ''}`
  }
  
  const hours = Math.floor(props.quest.duration / (60 * 60 * 1000))
  return `${hours} heure${hours > 1 ? 's' : ''}`
}

const isStepCompleted = (step) => {
  return step.current >= step.target
}

const isCurrentStep = (step, index) => {
  if (isStepCompleted(step)) return false
  
  // C'est l'étape courante si toutes les étapes précédentes sont complétées
  const previousSteps = props.quest.steps.slice(0, index)
  return previousSteps.every(prevStep => isStepCompleted(prevStep))
}

const formatNumber = (num) => {
  return new Intl.NumberFormat('fr-FR').format(num)
}
</script>

<style scoped>
.quest-card {
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.95) 0%, 
    color-mix(in srgb, var(--house-color) 15%, white) 100%
  );
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid var(--house-color);
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.quest-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.quest-card.quest-completed {
  border-color: #4CAF50;
  background: linear-gradient(135deg, #f8fff8 0%, #ffffff 100%);
}

.quest-card.quest-expired {
  border-color: #f44336;
  background: linear-gradient(135deg, #fff8f8 0%, #ffffff 100%);
  opacity: 0.8;
}

.quest-card.quest-in_progress {
  border-color: #2196F3;
  background: linear-gradient(135deg, #f8fbff 0%, #ffffff 100%);
}

/* Header */
.quest-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.quest-icon {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.quest-info {
  flex: 1;
}

.quest-title {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
}

.quest-description {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
}

.quest-status-badge {
  flex-shrink: 0;
}

.status-indicator {
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-indicator.available {
  background: #e3f2fd;
  color: #1976d2;
}

.status-indicator.in_progress {
  background: #fff3e0;
  color: #f57c00;
}

.status-indicator.completed {
  background: #e8f5e8;
  color: #2e7d32;
}

.status-indicator.expired {
  background: #ffebee;
  color: #c62828;
}

/* Meta informations */
.quest-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.quest-difficulty,
.quest-type,
.quest-duration {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
}

.quest-difficulty i,
.quest-type i,
.quest-duration i {
  font-size: 0.7rem;
}

/* Progression */
.quest-progress-section {
  margin-bottom: 1.5rem;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.progress-text {
  font-weight: 600;
  color: var(--text-color);
  font-size: 0.9rem;
}

.progress-percentage {
  font-weight: 700;
  color: var(--primary-color);
  font-size: 0.9rem;
}

.progress-bar-container {
  height: 8px;
  background: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
  position: relative;
}

.progress-shimmer {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* Étapes */
.quest-steps {
  margin-bottom: 1.5rem;
}

.steps-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.steps-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.quest-step {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease;
}

.quest-step.step-completed {
  background: rgba(76, 175, 80, 0.1);
}

.quest-step.step-current {
  background: rgba(33, 150, 243, 0.1);
  border: 1px solid rgba(33, 150, 243, 0.2);
}

.step-icon {
  flex-shrink: 0;
  margin-top: 0.1rem;
}

.step-content {
  flex: 1;
}

.step-title {
  margin: 0 0 0.25rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.step-description {
  margin: 0 0 0.5rem 0;
  font-size: 0.8rem;
  color: var(--text-color-secondary);
  line-height: 1.3;
}

.step-progress {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.step-progress-bar {
  flex: 1;
  height: 4px;
  background: #f0f0f0;
  border-radius: 2px;
  overflow: hidden;
}

.step-progress-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}

.step-progress-text {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-weight: 600;
}

.step-reward {
  flex-shrink: 0;
}

.step-xp {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
}

/* Récompenses */
.quest-rewards {
  margin-bottom: 1.5rem;
}

.rewards-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.75rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
}

.rewards-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--text-color);
}

.reward-item.special {
  background: linear-gradient(135deg, #ffd700, #ffed4e);
  color: #8b5a00;
  font-weight: 600;
}

.reward-item i {
  font-size: 0.7rem;
}

/* Actions */
.quest-actions {
  display: flex;
  gap: 0.75rem;
}

.start-quest-btn,
.continue-quest-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.start-quest-btn {
  color: white;
  border: none;
}

.start-quest-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Overlays */
.completion-overlay,
.expiration-overlay {
  position: absolute;
  top: 0;
  right: 0;
  padding: 0.5rem;
}

.completion-badge,
.expiration-badge {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
}

.completion-badge {
  background: #4CAF50;
  color: white;
}

.expiration-badge {
  background: #f44336;
  color: white;
}

/* Responsive */
@media (max-width: 768px) {
  .quest-card {
    padding: 1rem;
  }
  
  .quest-header {
    flex-direction: column;
    gap: 0.75rem;
  }
  
  .quest-meta {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .quest-step {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .step-progress {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
  
  .rewards-list {
    flex-direction: column;
  }
  
  .quest-actions {
    flex-direction: column;
  }
}
</style>
