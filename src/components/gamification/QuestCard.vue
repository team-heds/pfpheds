<template>
  <div 
    class="modern-quest-card cursor-pointer"
    :class="[
      { 'quest-expired': isExpired },
      { 'quest-completed': isCompleted },
      { 'quest-expiring-soon': isExpiringSoon && !isExpired }
    ]"
    :style="{ '--house-color': houseColor }"
    @click="toggleExpand"
  >
    <!-- BADGE STATUT EN HAUT À DROITE -->
    <div class="status-corner" :class="getStatusCornerClass()">
      <i :class="getStatusIcon()" class="mr-1"></i>
      <span>{{ getStatusText() }}</span>
    </div>
    
    <!-- HEADER AVEC GROSSE ICÔNE -->
    <div class="quest-header">
      <div class="quest-icon-large">
        <span v-if="quest.icon" class="icon-emoji">{{ quest.icon }}</span>
        <i v-else :class="getQuestIcon(quest.type)" class="icon-fallback"></i>
      </div>
      
      <div class="quest-title-section">
        <h2 class="quest-title">{{ quest.title }}</h2>
        <div class="quest-badges">
          <span v-if="quest.minLevel && quest.minLevel > 1" class="badge badge-level">
            <i class="pi pi-shield"></i> Niveau {{ quest.minLevel }}+
          </span>
          <span class="badge badge-difficulty" :class="'difficulty-' + quest.difficulty">
            <i class="pi pi-star-fill"></i> {{ getDifficultyName() }}
          </span>
          <span class="badge badge-type">
            <i class="pi pi-tag"></i> {{ getTypeText() }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- DESCRIPTION -->
    <p class="quest-description" :class="{ 'collapsed': !isExpanded }">
      {{ quest.description }}
    </p>

    <!-- DATE DE FIN ULTRA VISIBLE -->
    <div v-if="quest.endDate" class="end-date-banner" :class="getEndDateBannerClass()">
      <div class="end-date-content">
        <div class="end-date-icon">
          <i :class="isQuestExpired ? 'pi pi-times-circle' : isExpiringSoon ? 'pi pi-exclamation-triangle' : 'pi pi-calendar'"></i>
        </div>
        <div class="end-date-info">
          <div class="end-date-label">{{ getEndDateLabel() }}</div>
          <div class="end-date-value">{{ formatEndDate() }}</div>
        </div>
        <div v-if="!isQuestExpired" class="countdown-box">
          <div class="countdown-label">⏱️ Temps restant</div>
          <div class="countdown-value">{{ getTimeRemaining() }}</div>
        </div>
        <div v-else class="expired-stamp">
          <i class="pi pi-ban"></i>
          <span>EXPIRÉ</span>
        </div>
      </div>
    </div>
    
    <!-- INFOS SUPPLÉMENTAIRES -->
    <div class="quest-meta">
      <div v-if="quest.duration" class="meta-item">
        <i class="pi pi-clock"></i>
        <span>{{ formatDuration() }}</span>
      </div>
      <div v-if="quest.isRecurring" class="meta-item recurring">
        <i class="pi pi-refresh"></i>
        <span>{{ getRecurringText() }}</span>
      </div>
      <div v-if="quest.targetHouses && quest.targetHouses.length > 0" class="meta-item">
        <i class="pi pi-users"></i>
        <span>{{ quest.targetHouses.length }} maison(s)</span>
      </div>
    </div>

    <!-- Progression globale (uniquement si en cours ou complétée) -->
    <div v-if="hasProgress" class="mb-4">
      <div class="flex justify-content-between align-items-center mb-2">
        <span class="text-sm font-semibold text-600">📊 Progression</span>
        <span class="text-sm font-bold" :style="{ color: houseColor }">{{ quest.progress || 0 }}%</span>
      </div>
      <div class="progress-bar-container">
        <div 
          class="progress-bar-fill"
          :style="{ 
            width: `${quest.progress || 0}%`,
            backgroundColor: houseColor
          }"
        >
          <div v-if="quest.progress > 0 && quest.progress < 100" class="progress-shimmer"></div>
        </div>
      </div>
    </div>

    <!-- Étapes de la quête (seulement si expanded et qu'il y a des étapes) -->
    <div class="mb-4" v-if="isExpanded && hasSteps">
      <h4 class="flex align-items-center gap-2 text-base font-semibold m-0 mb-3">
        <i class="pi pi-list" :style="{ color: houseColor }"></i>
        <span>Étapes</span>
        <span class="text-xs font-normal text-600">({{ completedStepsCount }}/{{ quest.steps.length }})</span>
      </h4>
      
      <div class="flex flex-column gap-2">
        <div 
          v-for="(step, index) in quest.steps" 
          :key="step.id"
          class="flex align-items-start gap-3 p-3 border-round-lg transition-all transition-duration-200"
          :style="getStepStyle(step, index)"
        >
          <div class="flex-shrink-0" style="margin-top: 0.1rem;">
            <i 
              :class="isStepCompleted(step) ? 'pi pi-check-circle' : 'pi pi-circle'"
              :style="{ color: isStepCompleted(step) ? getDifficultyColor() : '#ccc' }"
            ></i>
          </div>
          
          <div class="flex-1">
            <h5 class="text-sm font-semibold m-0 mb-1">{{ step.title }}</h5>
            <p class="text-xs text-600 m-0 mb-2 line-height-3">{{ step.description }}</p>
            
            <!-- Progression de l'étape -->
            <div class="flex align-items-center gap-2" v-if="step.target > 1">
              <div class="flex-1" style="height: 4px; background: var(--surface-card); border-radius: 2px; overflow: hidden;">
                <div 
                  style="height: 100%; border-radius: 2px; transition: width 0.3s ease;"
                  :style="{ 
                    width: `${Math.min((step.current / step.target) * 100, 100)}%`,
                    backgroundColor: getDifficultyColor()
                  }"
                ></div>
              </div>
              <span class="text-xs text-600 font-semibold">
                {{ step.current }}/{{ step.target }}
              </span>
            </div>
          </div>
          
          <div class="flex-shrink-0">
            <span class="px-2 py-1 border-round-xl text-xs font-semibold text-white" 
                  :style="{ backgroundColor: houseColor }">
              +{{ step.xp }} XP
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Récompenses enrichies -->
    <div class="mb-3" v-if="isExpanded">
      <div class="flex align-items-center gap-2 mb-2">
        <i class="pi pi-gift" :style="{ color: houseColor }"></i>
        <span class="text-sm font-semibold text-900">Récompenses</span>
      </div>
      <div class="flex flex-wrap gap-2">
        <!-- Points -->
        <div class="reward-chip flex align-items-center gap-1">
          <i class="pi pi-flag" style="font-size: 0.7rem; color: #f97316;"></i>
          <span class="text-xs font-bold">{{ quest.points }} Points</span>
        </div>
        <!-- XP -->
        <div class="reward-chip flex align-items-center gap-1" v-if="quest.xp_reward">
          <i class="pi pi-star-fill" style="font-size: 0.7rem; color: #fbbf24;"></i>
          <span class="text-xs font-bold">{{ quest.xp_reward }} XP</span>
        </div>
        <!-- Badges -->
        <div v-if="quest.rewardBadges && quest.rewardBadges.length > 0" 
             class="reward-chip flex align-items-center gap-1"
             style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(139, 92, 246, 0.05));">
          <i class="pi pi-trophy" style="font-size: 0.7rem; color: #8b5cf6;"></i>
          <span class="text-xs font-bold text-purple-600">{{ quest.rewardBadges.length }} badge{{ quest.rewardBadges.length > 1 ? 's' : '' }}</span>
        </div>
      </div>
    </div>
    
    <!-- Récompenses compactes (non expanded) -->
    <div class="rewards-section flex align-items-center gap-2 mb-3" v-else>
      <div class="flex align-items-center gap-1 reward-chip">
        <i class="pi pi-flag" style="font-size: 0.7rem; color: #f97316;"></i>
        <span class="text-xs font-bold">{{ quest.points }}</span>
      </div>
      <div class="flex align-items-center gap-1 reward-chip" v-if="quest.xp_reward">
        <i class="pi pi-star-fill" style="font-size: 0.7rem; color: #fbbf24;"></i>
        <span class="text-xs font-bold">{{ quest.xp_reward }}</span>
      </div>
    </div>

    <!-- Actions (seulement si expanded) -->
    <div v-if="isExpanded" class="flex gap-2 mt-3">
      <Button 
        v-if="quest.status === 'not_started' && !isCompleted && !isExpired"
        @click.stop="$emit('start-quest', quest.id)"
        class="flex-1 font-semibold border-round-lg action-button"
        icon="pi pi-play"
        label="Commencer"
        :style="{ backgroundColor: houseColor, borderColor: houseColor }"
      />
      
      <Button 
        v-else-if="quest.status === 'in_progress' && !isCompleted"
        @click.stop="$emit('view-details', quest.id)"
        class="flex-1 font-semibold border-round-lg action-button"
        icon="pi pi-arrow-right"
        label="Continuer"
        :style="{ backgroundColor: houseColor, borderColor: houseColor }"
      />
    </div>

    <!-- Indicateur de complétion -->
    <div v-if="isCompleted" class="absolute top-0 right-0 p-2">
      <div class="flex align-items-center gap-1 px-3 py-2 border-round-2xl text-xs font-semibold text-white" 
           style="background: #4CAF50;">
        <i class="pi pi-check-circle"></i>
        <span>Quête Terminée!</span>
      </div>
    </div>

    <!-- Indicateur d'expiration -->
    <div v-if="isExpired" class="absolute top-0 right-0 p-2">
      <div class="flex align-items-center gap-1 px-3 py-2 border-round-2xl text-xs font-semibold text-white" 
           style="background: #f44336;">
        <i class="pi pi-times-circle"></i>
        <span>Quête Expirée</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'

// State local
const isExpanded = ref(false)
const currentTime = ref(Date.now())
let timeUpdateInterval = null

// Constantes Supabase (alignées avec la DB)
const QUEST_STATUS = {
  AVAILABLE: 'not_started',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  EXPIRED: 'failed',
  LOCKED: 'locked'
}

const QUEST_DIFFICULTIES = {
  easy: { name: 'Facile', color: '#4CAF50', multiplier: 1 },
  medium: { name: 'Moyen', color: '#FF9800', multiplier: 1.5 },
  hard: { name: 'Difficile', color: '#F44336', multiplier: 2 },
  expert: { name: 'Expert', color: '#9C27B0', multiplier: 2.5 }
}

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
const emit = defineEmits(['click', 'start-quest', 'view-details', 'quest-expired'])

// Computed properties
const isCompleted = computed(() => props.quest.status === QUEST_STATUS.COMPLETED)

// Vérification expiration basée sur endDate
const isQuestExpired = computed(() => {
  if (props.quest.status === QUEST_STATUS.EXPIRED || props.quest.status === QUEST_STATUS.COMPLETED) {
    return true
  }
  if (props.quest.endDate) {
    const endTime = new Date(props.quest.endDate).getTime()
    return currentTime.value >= endTime
  }
  return false
})

const isExpired = computed(() => isQuestExpired.value)

// Expire dans moins de 24h
const isExpiringSoon = computed(() => {
  if (!props.quest.endDate || isQuestExpired.value) return false
  const endTime = new Date(props.quest.endDate).getTime()
  const timeLeft = endTime - currentTime.value
  return timeLeft <= 24 * 60 * 60 * 1000 // 24 heures
})

const hasProgress = computed(() => {
  return props.quest.status === 'in_progress' || props.quest.status === 'completed' || (props.quest.progress && props.quest.progress > 0)
})

const hasSteps = computed(() => {
  return props.quest.steps && Array.isArray(props.quest.steps) && props.quest.steps.length > 0
})

const completedStepsCount = computed(() => {
  if (!props.quest.steps || !Array.isArray(props.quest.steps)) return 0
  
  // Si on a un pourcentage de progression, calculer les steps complétées
  if (props.quest.progress !== undefined) {
    const totalSteps = props.quest.steps.length || 1
    return Math.floor((props.quest.progress / 100) * totalSteps)
  }
  
  // Sinon, compter les steps avec completed=true
  return props.quest.steps.filter(step => step.completed === true).length
})

const totalRewards = computed(() => {
  // Adaptation pour Supabase : structure simple
  return {
    xp: props.quest.xp_reward || props.quest.points || 0,
    badges: [],
    items: []
  }
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
  
  // Si la durée est en heures (nombre simple)
  if (typeof props.quest.duration === 'number') {
    const hours = props.quest.duration
    if (hours >= 24) {
      const days = Math.floor(hours / 24)
      return `${days}j`
    }
    return `${hours}h`
  }
  
  // Ancienne logique pour timestamps
  const days = Math.floor(props.quest.duration / (24 * 60 * 60 * 1000))
  if (days > 0) {
    return `${days} jour${days > 1 ? 's' : ''}`
  }
  
  const hours = Math.floor(props.quest.duration / (60 * 60 * 1000))
  return `${hours} heure${hours > 1 ? 's' : ''}`
}

const getRecurringText = () => {
  const recurringMap = {
    daily: 'Quotidienne',
    weekly: 'Hebdo',
    monthly: 'Mensuelle'
  }
  return recurringMap[props.quest.recurringType] || 'Récurrente'
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

const getStatusStyle = () => {
  const styles = {
    available: { background: '#e3f2fd', color: '#1976d2' },
    in_progress: { background: '#fff3e0', color: '#f57c00' },
    completed: { background: '#e8f5e8', color: '#2e7d32' },
    expired: { background: '#ffebee', color: '#c62828' }
  }
  return styles[props.quest.status] || {}
}

const getStepStyle = (step, index) => {
  if (isStepCompleted(step)) {
    return { background: 'rgba(76, 175, 80, 0.1)' }
  }
  if (isCurrentStep(step, index)) {
    return { background: 'rgba(33, 150, 243, 0.1)', border: '1px solid rgba(33, 150, 243, 0.2)' }
  }
  return { background: 'rgba(0, 0, 0, 0.02)' }
}

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value
  emit('click', props.quest)
}

// Méthodes pour la gestion des dates
const formatEndDate = () => {
  if (!props.quest.endDate) return ''
  const date = new Date(props.quest.endDate)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTimeRemaining = () => {
  if (!props.quest.endDate || isQuestExpired.value) return 'Expiré'
  
  const endTime = new Date(props.quest.endDate).getTime()
  const diff = endTime - currentTime.value
  
  if (diff <= 0) return 'Expiré'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    return `${days}j ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`
  } else {
    return `${minutes}m`
  }
}

const getEndDateLabel = () => {
  if (isQuestExpired.value) return 'Quête expirée le'
  if (isExpiringSoon.value) return '⚠️ Expire bientôt'
  return 'Date de fin'
}

const getEndDateColor = () => {
  if (isQuestExpired.value) return '#ef4444'
  if (isExpiringSoon.value) return '#f97316'
  return '#3b82f6'
}

const getEndDateClass = () => {
  if (isQuestExpired.value) return 'end-date-expired'
  if (isExpiringSoon.value) return 'end-date-soon'
  return 'end-date-normal'
}

const getEndDateBannerClass = () => {
  if (isQuestExpired.value) return 'banner-expired'
  if (isExpiringSoon.value) return 'banner-warning'
  return 'banner-normal'
}

const getStatusCornerClass = () => {
  if (isCompleted.value) return 'status-completed'
  if (isQuestExpired.value) return 'status-expired'
  if (props.quest.status === 'in_progress') return 'status-progress'
  return 'status-available'
}

const getStatusIcon = () => {
  if (isCompleted.value) return 'pi pi-check-circle'
  if (isQuestExpired.value) return 'pi pi-times-circle'
  if (props.quest.status === 'in_progress') return 'pi pi-play-circle'
  return 'pi pi-circle'
}

// Lifecycle hooks
onMounted(() => {
  // Mettre à jour le temps toutes les minutes
  timeUpdateInterval = setInterval(() => {
    currentTime.value = Date.now()
    
    // Émettre un événement si la quête vient d'expirer
    if (isQuestExpired.value && props.quest.status !== QUEST_STATUS.EXPIRED) {
      emit('quest-expired', props.quest.id)
    }
  }, 60000) // 60 secondes
})

onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
  }
})
</script>

<style scoped>
/* 🎨 NOUVEAU DESIGN ULTRA MODERNE ET VISIBLE */

.modern-quest-card {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 24px;
  position: relative;
  overflow: visible;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 5px solid var(--house-color);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeInScale 0.4s ease;
}

.modern-quest-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.quest-expired {
  border-left-color: #ef4444 !important;
  background: var(--surface-card);
  opacity: 0.75;
}

.quest-completed {
  border-left-color: #22c55e !important;
  background: var(--surface-card);
}

.quest-expiring-soon {
  border-left-color: #f97316 !important;
  animation: pulse-shadow 2s infinite;
}

@keyframes pulse-shadow {
  0%, 100% { 
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); 
  }
  50% { 
    box-shadow: 0 4px 16px rgba(249, 115, 22, 0.3); 
  }
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.quest-icon {
  width: 48px;
  height: 48px;
  transition: all 0.3s ease;
}

.quest-card:hover .quest-icon {
  transform: scale(1.1) rotate(5deg);
}

.truncated-text {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

.expand-icon {
  transition: transform 0.3s ease;
}

.status-badge {
  font-size: 0.65rem;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

.info-chip {
  background: rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
}

.quest-card:hover .info-chip {
  background: rgba(0, 0, 0, 0.06);
}

.reward-chip {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.02));
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.progress-bar-container {
  height: 8px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
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

.action-button {
  transition: all 0.2s ease;
}

.action-button:hover {
  transform: scale(1.02);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Animation d'entrée */
.quest-card {
  animation: fadeInScale 0.4s ease;
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

/* Level badge */
.level-badge {
  font-size: 0.7rem;
  white-space: nowrap;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}

/* Info chips améliorés avec couleurs */
.info-chip {
  background: rgba(0, 0, 0, 0.04);
  transition: all 0.2s ease;
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.quest-card:hover .info-chip {
  background: rgba(0, 0, 0, 0.06);
  border-color: rgba(0, 0, 0, 0.1);
}

/* Reward chips plus visuels */
.reward-chip {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.02));
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
}

.reward-chip:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* End date card styles */
.end-date-card {
  transition: all 0.3s ease;
  border: 2px solid;
}

.end-date-normal {
  background: rgba(59, 130, 246, 0.05);
  border-color: rgba(59, 130, 246, 0.2);
}

.end-date-soon {
  background: rgba(249, 115, 22, 0.08);
  border-color: rgba(249, 115, 22, 0.3);
  animation: pulse-warning 2s infinite;
}

.end-date-expired {
  background: rgba(239, 68, 68, 0.08);
  border-color: rgba(239, 68, 68, 0.3);
}

@keyframes pulse-warning {
  0%, 100% {
    border-color: rgba(249, 115, 22, 0.3);
    box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.4);
  }
  50% {
    border-color: rgba(249, 115, 22, 0.5);
    box-shadow: 0 0 0 4px rgba(249, 115, 22, 0);
  }
}

/* Badge statut coin supérieur droit */
.status-corner {
  position: absolute;
  top: 0;
  right: 0;
  padding: 8px 16px;
  border-radius: 0 17px 0 16px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 10;
  box-shadow: -2px 2px 10px rgba(0, 0, 0, 0.15);
}

.status-available { background: linear-gradient(135deg, #3b82f6, #2563eb); color: white; }
.status-progress { background: linear-gradient(135deg, #f59e0b, #d97706); color: white; animation: pulse-status 1.5s infinite; }
.status-completed { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; }
.status-expired { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }

@keyframes pulse-status {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
}

/* Header avec grosse icône */
.quest-header {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: flex-start;
}

.quest-icon-large {
  width: 80px;
  height: 80px;
  border-radius: 18px;
  background: linear-gradient(135deg, var(--house-color), var(--house-color)dd);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 6px 20px var(--house-color)40;
  position: relative;
}

.icon-emoji {
  font-size: 48px;
  z-index: 1;
}

.icon-fallback {
  font-size: 40px;
  color: white;
  z-index: 1;
}

.quest-title-section {
  flex: 1;
  padding-top: 8px;
}

.quest-title {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 12px 0;
  line-height: 1.3;
}

.quest-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.badge-level { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; }
.badge-difficulty { background: #fbbf24; color: #78350f; }
.difficulty-easy { background: #22c55e !important; color: white !important; }
.difficulty-medium { background: #f59e0b !important; color: white !important; }
.difficulty-hard { background: #ef4444 !important; color: white !important; }
.badge-type { background: var(--surface-ground); color: var(--text-color); }

/* Description */
.quest-description {
  font-size: 15px;
  line-height: 1.7;
  color: var(--text-color-secondary);
  margin: 0 0 20px 0;
  padding: 0;
  background: transparent;
}

.quest-description.collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* BANNIÈRE DATE DE FIN - ULTRA VISIBLE */
.end-date-banner {
  margin: 20px 0;
  padding: 20px;
  border-radius: 12px;
  border: 2px solid;
  position: relative;
  background: var(--surface-ground);
}

.banner-normal {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.banner-warning {
  border-color: #f97316;
  background: var(--surface-ground);
  animation: warning-pulse 2s infinite;
}

.banner-expired {
  border-color: #ef4444;
  background: var(--surface-ground);
}

@keyframes warning-pulse {
  0%, 100% { box-shadow: 0 2px 8px rgba(249, 115, 22, 0.2); }
  50% { box-shadow: 0 4px 16px rgba(249, 115, 22, 0.4); }
}

.end-date-content {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.end-date-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: var(--surface-card);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.end-date-icon i {
  font-size: 28px;
}

.banner-normal .end-date-icon i { color: #3b82f6; }
.banner-warning .end-date-icon i { color: #f97316; }
.banner-expired .end-date-icon i { color: #ef4444; }

.end-date-info {
  flex: 1;
  min-width: 150px;
}

.end-date-label {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: var(--text-color-secondary);
  margin-bottom: 4px;
}

.end-date-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color);
}

.countdown-box {
  background: var(--surface-card);
  padding: 12px 20px;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.countdown-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-color-secondary);
  margin-bottom: 4px;
}

.countdown-value {
  font-size: 24px;
  font-weight: 800;
  background: linear-gradient(135deg, var(--house-color), var(--house-color)dd);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.expired-stamp {
  background: #ef4444;
  color: white;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 8px;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

/* Métadonnées */
.quest-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: 16px 0;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--surface-ground);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  border: 1px solid var(--surface-border);
}

.meta-item i {
  font-size: 14px;
  color: var(--house-color);
}

.meta-item.recurring {
  background: #f0fdfa;
  color: #0891b2;
  border-color: #99f6e4;
}

.meta-item.recurring i {
  color: #06b6d4;
}

/* Responsive */
@media (max-width: 768px) {
  .modern-quest-card:hover {
    transform: translateY(-4px);
  }
  
  .quest-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .quest-icon-large {
    width: 70px;
    height: 70px;
  }
  
  .icon-emoji {
    font-size: 40px;
  }
  
  .quest-title {
    font-size: 20px;
  }
  
  .end-date-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .countdown-box {
    width: 100%;
  }
}
</style>
