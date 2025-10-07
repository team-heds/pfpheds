<template>
  <div 
    class="surface-card border-round-xl p-4 shadow-2 hover:shadow-4 transition-all transition-duration-300 cursor-pointer"
    :class="[
      { 'opacity-80': isExpired }
    ]"
    :style="{ 
      '--house-color': houseColor,
      'border': `2px solid ${isCompleted ? '#4CAF50' : isExpired ? '#f44336' : houseColor}`
    }"
    @click="$emit('click', quest)"
  >
    <!-- Header de la quête -->
    <div class="flex align-items-start gap-3 mb-3">
      <div class="flex-shrink-0 flex align-items-center justify-content-center border-round-xl" 
           style="width: 48px; height: 48px; background: rgba(0, 0, 0, 0.05);">
        <i :class="getQuestIcon(quest.type)" class="text-2xl" :style="{ color: getDifficultyColor() }"></i>
      </div>
      <div class="flex-1">
        <h3 class="text-xl font-semibold m-0 mb-2">{{ quest.title }}</h3>
        <p class="text-sm text-600 m-0 line-height-3">{{ quest.description }}</p>
      </div>
      <div class="flex-shrink-0">
        <span class="px-3 py-1 border-round-2xl text-xs font-semibold uppercase" :style="getStatusStyle()">
          {{ getStatusText() }}
        </span>
      </div>
    </div>

    <!-- Informations de la quête -->
    <div class="flex flex-wrap gap-3 mb-3">
      <div class="flex align-items-center gap-1 text-xs text-600">
        <i class="pi pi-star-fill" style="font-size: 0.7rem;"></i>
        <span>{{ getDifficultyName() }}</span>
      </div>
      <div class="flex align-items-center gap-1 text-xs text-600">
        <i class="pi pi-tag" style="font-size: 0.7rem;"></i>
        <span>{{ getTypeText() }}</span>
      </div>
      <div v-if="quest.duration" class="flex align-items-center gap-1 text-xs text-600">
        <i class="pi pi-clock" style="font-size: 0.7rem;"></i>
        <span>{{ formatDuration() }}</span>
      </div>
    </div>

    <!-- Progression globale -->
    <div class="mb-4">
      <div class="flex justify-content-between align-items-center mb-2">
        <span class="text-sm font-semibold">Progression</span>
        <span class="text-sm font-bold" :style="{ color: houseColor }">{{ quest.progress || 0 }}%</span>
      </div>
      <div style="height: 8px; background: #f0f0f0; border-radius: 4px; overflow: hidden; position: relative;">
        <div 
          style="height: 100%; border-radius: 4px; transition: width 0.3s ease; position: relative;"
          :style="{ 
            width: `${quest.progress || 0}%`,
            backgroundColor: getDifficultyColor()
          }"
        >
          <div v-if="quest.progress > 0 && quest.progress < 100" 
               style="position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent); animation: shimmer 2s infinite;"></div>
        </div>
      </div>
    </div>

    <!-- Étapes de la quête -->
    <div class="mb-4" v-if="showSteps && quest.steps">
      <h4 class="flex align-items-center gap-2 text-base font-semibold m-0 mb-3">
        <i class="pi pi-list"></i>
        Étapes ({{ completedStepsCount }}/{{ quest.steps.length }})
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
              <div class="flex-1" style="height: 4px; background: #f0f0f0; border-radius: 2px; overflow: hidden;">
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

    <!-- Récompenses -->
    <div class="mb-4">
      <h4 class="flex align-items-center gap-2 text-base font-semibold m-0 mb-3">
        <i class="pi pi-gift"></i>
        Récompenses
      </h4>
      <div class="flex flex-wrap gap-2">
        <div class="flex align-items-center gap-1 px-3 py-2 border-round-2xl text-xs font-medium" 
             style="background: rgba(0, 0, 0, 0.05);" 
             v-if="totalRewards.totalXP">
          <i class="pi pi-star-fill" style="font-size: 0.7rem;"></i>
          <span>{{ formatNumber(totalRewards.totalXP) }} XP</span>
        </div>
        <div class="flex align-items-center gap-1 px-3 py-2 border-round-2xl text-xs font-medium" 
             style="background: rgba(0, 0, 0, 0.05);" 
             v-if="quest.rewards.badge">
          <i class="pi pi-trophy" style="font-size: 0.7rem;"></i>
          <span>Badge: {{ quest.rewards.badge }}</span>
        </div>
        <div class="flex align-items-center gap-1 px-3 py-2 border-round-2xl text-xs font-medium" 
             style="background: rgba(0, 0, 0, 0.05);" 
             v-if="quest.rewards.title">
          <i class="pi pi-crown" style="font-size: 0.7rem;"></i>
          <span>Titre: {{ quest.rewards.title }}</span>
        </div>
        <div class="flex align-items-center gap-1 px-3 py-2 border-round-2xl text-xs font-semibold" 
             style="background: linear-gradient(135deg, #ffd700, #ffed4e); color: #8b5a00;"
             v-if="quest.rewards.special">
          <i class="pi pi-sparkles" style="font-size: 0.7rem;"></i>
          <span>{{ quest.rewards.special }}</span>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex gap-2" v-if="!isCompleted && !isExpired">
      <Button 
        v-if="quest.status === 'available'"
        @click.stop="$emit('start-quest', quest.id)"
        class="flex-1 font-semibold border-round-lg"
        icon="pi pi-play"
        label="Commencer la quête"
        :style="{ backgroundColor: getDifficultyColor(), borderColor: getDifficultyColor() }"
      />
      
      <Button 
        v-else-if="quest.status === 'in_progress'"
        @click.stop="$emit('view-details', quest.id)"
        class="flex-1 font-semibold border-round-lg"
        icon="pi pi-eye"
        label="Voir les détails"
        outlined
        :style="{ borderColor: getDifficultyColor(), color: getDifficultyColor() }"
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
</script>

<style>
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
</style>
