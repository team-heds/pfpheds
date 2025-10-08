<template>
  <!-- CARTE COMPACTE -->
  <div 
    class="quest-card-compact"
    :class="[
      { 'quest-expired': isExpired },
      { 'quest-completed': isCompleted },
      { 'quest-expiring-soon': isExpiringSoon && !isExpired }
    ]"
    :style="{ '--house-color': houseColor }"
    @click="showModal = true"
  >
    <!-- Icône -->
    <div class="quest-icon-small" :style="{ backgroundColor: `${houseColor}15`, borderColor: houseColor }">
      <span v-if="quest.icon" class="icon-emoji">{{ quest.icon }}</span>
      <i v-else :class="getQuestIcon(quest.type)" :style="{ color: houseColor }"></i>
    </div>

    <!-- Contenu -->
    <div class="quest-content-compact">
      <div class="quest-title-compact">{{ quest.title }}</div>
      <div class="quest-meta-compact">
        <span class="badge-mini" :class="'diff-' + quest.difficulty">
          {{ getDifficultyEmoji() }}
        </span>
        <span class="badge-mini type">{{ getTypeEmoji() }}</span>
        <span class="separator">•</span>
        <span class="xp-value">{{ quest.xp_reward || quest.points || 0 }} XP</span>
      </div>
      
      <!-- Date de fin si existe -->
      <div v-if="quest.end_date || quest.endDate" class="quest-deadline-compact" 
           :class="{ 'deadline-urgent': isExpiringSoon, 'deadline-expired': isExpired }">
        <i :class="isExpired ? 'pi pi-times-circle' : 'pi pi-calendar-times'"></i>
        <span v-if="isExpired" class="deadline-text">
          Expirée le {{ formatEndDateShort() }}
        </span>
        <span v-else class="deadline-text">
          Fin: {{ formatEndDateShort() }} ({{ getTimeRemainingShort() }})
        </span>
      </div>
      
      <!-- Progress si en cours -->
      <div v-if="hasProgress" class="progress-mini">
        <div class="progress-bar-tiny">
          <div class="progress-fill-tiny" :style="{ width: `${quest.progress || 0}%`, backgroundColor: houseColor }"></div>
        </div>
        <span class="progress-text-tiny">{{ quest.progress || 0 }}%</span>
      </div>
    </div>

    <!-- Status badge -->
    <div class="status-badge-compact" :class="getStatusClass()">
      <i :class="getStatusIcon()"></i>
    </div>

    <!-- Deadline warning si urgent -->
    <div v-if="(quest.end_date || quest.endDate) && isExpiringSoon && !isExpired" class="deadline-warning-compact">
      <i class="pi pi-clock"></i>
      <span>{{ getTimeRemainingCompact() }}</span>
    </div>
  </div>

  <!-- MODAL DÉTAILLÉE -->
  <Dialog 
    v-model:visible="showModal" 
    :header="quest.title"
    :modal="true"
    :style="{ width: '90vw', maxWidth: '700px' }"
    :dismissableMask="true"
    class="quest-detail-modal"
  >
    <template #header>
      <div class="modal-header-custom">
        <div class="modal-icon" :style="{ backgroundColor: `${houseColor}20`, borderColor: houseColor }">
          <span v-if="quest.icon" class="icon-emoji-large">{{ quest.icon }}</span>
          <i v-else :class="getQuestIcon(quest.type)" :style="{ color: houseColor }"></i>
        </div>
        <div class="modal-title-zone">
          <h3>{{ quest.title }}</h3>
          <div class="modal-badges">
            <span class="modal-badge difficulty" :class="'diff-' + quest.difficulty">
              {{ getDifficultyEmoji() }} {{ getDifficultyName() }}
            </span>
            <span class="modal-badge type">{{ getTypeEmoji() }} {{ getTypeText() }}</span>
            <span class="modal-badge status" :class="getStatusClass()">
              <i :class="getStatusIcon()"></i> {{ getStatusText() }}
            </span>
          </div>
        </div>
      </div>
    </template>

    <!-- Deadline banner si existe -->
    <div v-if="quest.end_date || quest.endDate" class="modal-deadline" :class="{ 'urgent': isExpiringSoon, 'expired': isExpired }">
      <i :class="isExpired ? 'pi pi-times-circle' : isExpiringSoon ? 'pi pi-exclamation-triangle' : 'pi pi-clock'"></i>
      <span>{{ isExpired ? 'Expirée le ' + formatEndDate() : 'Se termine dans ' + getTimeRemaining() }}</span>
    </div>

    <!-- Description -->
    <div class="modal-description">
      <h4><i class="pi pi-align-left"></i> Description</h4>
      <p>{{ quest.description }}</p>
    </div>

    <!-- Progress -->
    <div v-if="hasProgress" class="modal-progress">
      <h4><i class="pi pi-chart-line"></i> Progression</h4>
      <div class="progress-section-modal">
        <div class="progress-bar-modal">
          <div class="progress-fill-modal" :style="{ width: `${quest.progress || 0}%`, backgroundColor: houseColor }">
            <span class="progress-text-modal">{{ quest.progress || 0 }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Dates et Timing -->
    <div v-if="quest.start_date || quest.end_date" class="modal-infos mb-3">
      <h4><i class="pi pi-calendar"></i> Période de la Quête</h4>
      <div class="info-grid-modal">
        <!-- Date de début -->
        <div v-if="quest.start_date" class="info-item-modal">
          <i class="pi pi-calendar-plus" :style="{ color: houseColor }"></i>
          <div>
            <div class="info-label">Début</div>
            <div class="info-value">{{ formatStartDate() }}</div>
          </div>
        </div>
        
        <!-- Date de fin -->
        <div v-if="quest.end_date" class="info-item-modal">
          <i class="pi pi-calendar-times" :style="{ color: isExpired ? '#ef4444' : isExpiringSoon ? '#f97316' : houseColor }"></i>
          <div>
            <div class="info-label">Fin</div>
            <div class="info-value" :style="{ color: isExpired ? '#ef4444' : isExpiringSoon ? '#f97316' : 'inherit' }">
              {{ formatEndDate() }}
            </div>
          </div>
        </div>
        
        <!-- Temps restant (si pas expiré) -->
        <div v-if="quest.end_date && !isExpired" class="info-item-modal" style="grid-column: 1 / -1;">
          <i class="pi pi-hourglass" :style="{ color: isExpiringSoon ? '#f97316' : '#10b981' }"></i>
          <div>
            <div class="info-label">Temps restant</div>
            <div class="info-value" :style="{ color: isExpiringSoon ? '#f97316' : '#10b981', fontWeight: '700' }">
              ⏱️ {{ getTimeRemaining() }}
            </div>
          </div>
        </div>

        <!-- Quête expirée -->
        <div v-if="quest.end_date && isExpired" class="info-item-modal expired-notice" style="grid-column: 1 / -1;">
          <i class="pi pi-times-circle" style="color: #ef4444;"></i>
          <div>
            <div class="info-label">Statut</div>
            <div class="info-value" style="color: #ef4444; font-weight: 700;">
              ❌ Quête expirée depuis {{ getExpiredSince() }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Informations -->
    <div class="modal-infos">
      <h4><i class="pi pi-info-circle"></i> Informations</h4>
      <div class="info-grid-modal">
        <div class="info-item-modal">
          <i class="pi pi-star-fill"></i>
          <div>
            <div class="info-label">Récompense XP</div>
            <div class="info-value">{{ quest.xp_reward || quest.points || 0 }} points</div>
          </div>
        </div>
        <div v-if="quest.duration" class="info-item-modal">
          <i class="pi pi-clock"></i>
          <div>
            <div class="info-label">Durée estimée</div>
            <div class="info-value">{{ formatDuration() }}</div>
          </div>
        </div>
        <div v-if="quest.rewardBadges && quest.rewardBadges.length > 0" class="info-item-modal">
          <i class="pi pi-trophy"></i>
          <div>
            <div class="info-label">Badges</div>
            <div class="info-value">{{ quest.rewardBadges.length }} badge{{ quest.rewardBadges.length > 1 ? 's' : '' }}</div>
          </div>
        </div>
        <div v-if="quest.isRecurring" class="info-item-modal">
          <i class="pi pi-refresh"></i>
          <div>
            <div class="info-label">Récurrence</div>
            <div class="info-value">{{ getRecurringText() }}</div>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="modal-footer-custom">
        <Button 
          v-if="!isCompleted && !isExpired && quest.status === 'not_started'"
          @click="handleQuickAction"
          :style="{ backgroundColor: houseColor, borderColor: houseColor }"
          icon="pi pi-play-circle"
          label="Commencer la quête"
          class="w-full"
        />
        <Button 
          v-else-if="!isCompleted && !isExpired && quest.status === 'in_progress'"
          @click="handleQuickAction"
          :style="{ backgroundColor: houseColor, borderColor: houseColor }"
          icon="pi pi-arrow-right"
          label="Continuer la quête"
          class="w-full"
        />
        <Button 
          v-else-if="isCompleted"
          icon="pi pi-check-circle"
          label="Quête terminée"
          severity="success"
          disabled
          class="w-full"
        />
        <Button 
          v-else-if="isExpired"
          icon="pi pi-times-circle"
          label="Quête expirée"
          severity="danger"
          disabled
          class="w-full"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

// State local
const showModal = ref(false)
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

// Vérification expiration basée sur end_date
const isQuestExpired = computed(() => {
  if (props.quest.status === QUEST_STATUS.EXPIRED || props.quest.status === QUEST_STATUS.COMPLETED) {
    return true
  }
  const dateField = props.quest.end_date || props.quest.endDate
  if (dateField) {
    const endTime = new Date(dateField).getTime()
    return currentTime.value >= endTime
  }
  return false
})

const isExpired = computed(() => isQuestExpired.value)

// Expire dans moins de 24h
const isExpiringSoon = computed(() => {
  const dateField = props.quest.end_date || props.quest.endDate
  if (!dateField || isQuestExpired.value) return false
  const endTime = new Date(dateField).getTime()
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
const formatStartDate = () => {
  const dateField = props.quest.start_date || props.quest.startDate
  if (!dateField) return ''
  const date = new Date(dateField)
  return date.toLocaleString('fr-CH', {
    timeZone: 'Europe/Zurich',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatEndDate = () => {
  const dateField = props.quest.end_date || props.quest.endDate
  if (!dateField) return ''
  const date = new Date(dateField)
  return date.toLocaleString('fr-CH', {
    timeZone: 'Europe/Zurich',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTimeRemaining = () => {
  const dateField = props.quest.end_date || props.quest.endDate
  if (!dateField || isQuestExpired.value) return 'Expiré'
  
  const endTime = new Date(dateField).getTime()
  const diff = endTime - currentTime.value
  
  if (diff <= 0) return 'Expiré'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    return `${days} jour${days > 1 ? 's' : ''} ${hours}h`
  } else if (hours > 0) {
    return `${hours}h ${minutes}min`
  } else {
    return `${minutes} minute${minutes > 1 ? 's' : ''}`
  }
}

const getExpiredSince = () => {
  const dateField = props.quest.end_date || props.quest.endDate
  if (!dateField) return ''
  
  const endTime = new Date(dateField).getTime()
  const diff = currentTime.value - endTime
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) {
    return `${days} jour${days > 1 ? 's' : ''}`
  } else if (hours > 0) {
    return `${hours} heure${hours > 1 ? 's' : ''}`
  } else {
    return 'moins d\'une heure'
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

// NOUVELLES MÉTHODES POUR LE DESIGN COMPACT
const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const getDifficultyEmoji = () => {
  const emojiMap = {
    EASY: '⭐',
    MEDIUM: '⭐⭐',
    HARD: '⭐⭐⭐',
    EPIC: '🔥',
    LEGENDARY: '👑'
  }
  return emojiMap[props.quest.difficulty] || '⭐'
}

const getTypeEmoji = () => {
  const emojiMap = {
    daily: '📅',
    weekly: '📆',
    multi_step: '📋',
    achievement: '🏆',
    recurring: '🔄'
  }
  return emojiMap[props.quest.type] || '🎯'
}

const formatDurationCompact = () => {
  if (!props.quest.duration) return ''
  const hours = Math.floor(props.quest.duration / 60)
  const minutes = props.quest.duration % 60
  return hours > 0 ? `${hours}h${minutes > 0 ? minutes + 'm' : ''}` : `${minutes}m`
}

const getRecurringTextCompact = () => {
  const map = {
    daily: 'Quotidien',
    weekly: 'Hebdo',
    monthly: 'Mensuel'
  }
  return map[props.quest.recurring] || 'Récurrent'
}

const getTimeRemainingCompact = () => {
  const dateField = props.quest.end_date || props.quest.endDate
  if (!dateField || isQuestExpired.value) return 'Expiré'
  
  const endTime = new Date(dateField).getTime()
  const diff = endTime - currentTime.value
  
  if (diff <= 0) return 'Expiré'
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `${days}j`
  if (hours > 0) return `${hours}h`
  return '<1h'
}

// Formatage date de fin compact pour la carte
const formatEndDateShort = () => {
  const dateField = props.quest.end_date || props.quest.endDate
  if (!dateField) return ''
  const date = new Date(dateField)
  return date.toLocaleString('fr-CH', {
    timeZone: 'Europe/Zurich',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Temps restant très court pour la carte
const getTimeRemainingShort = () => {
  const dateField = props.quest.end_date || props.quest.endDate
  if (!dateField || isQuestExpired.value) return ''
  
  const endTime = new Date(dateField).getTime()
  const diff = endTime - currentTime.value
  
  if (diff <= 0) return ''
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  
  if (days > 0) {
    return `${days}j`
  } else if (hours > 0) {
    return `${hours}h`
  } else {
    return `${minutes}m`
  }
}

const getStatusClass = () => {
  if (isCompleted.value) return 'status-completed'
  if (isQuestExpired.value) return 'status-expired'
  if (props.quest.status === 'in_progress') return 'status-progress'
  return 'status-available'
}

const getActionIcon = () => {
  if (isCompleted.value) return 'pi pi-check'
  if (isQuestExpired.value) return 'pi pi-times'
  if (props.quest.status === 'in_progress') return 'pi pi-arrow-right'
  return 'pi pi-play'
}

const handleQuickAction = () => {
  if (isExpired.value) return
  
  if (props.quest.status === 'not_started') {
    emit('start-quest', props.quest.id)
  } else if (props.quest.status === 'in_progress') {
    emit('view-details', props.quest.id)
  }
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
/* 🎯 CARTE COMPACTE - Design minimaliste et moderne */

.quest-card-compact {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--surface-border);
  border-left: 4px solid var(--house-color);
  transition: all 0.25s ease;
  cursor: pointer;
  position: relative;
  min-height: 80px;
  max-height: 90px;
}

.quest-card-compact:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
  border-color: var(--house-color);
}

/* Icône carte compacte */
.quest-icon-small {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  border: 2px solid;
  flex-shrink: 0;
  transition: transform 0.2s ease;
}

.quest-card-compact:hover .quest-icon-small {
  transform: scale(1.05);
}

.quest-icon-small .icon-emoji {
  font-size: 28px;
}

/* Contenu carte compacte */
.quest-content-compact {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.quest-title-compact {
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.quest-meta-compact {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
}

/* Deadline compact dans la carte */
.quest-deadline-compact {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-top: 4px;
  padding: 4px 8px;
  background: var(--surface-100);
  border-radius: 6px;
  border-left: 3px solid var(--blue-500);
}

.quest-deadline-compact.deadline-urgent {
  background: rgba(249, 115, 22, 0.1);
  border-left-color: var(--orange-500);
  color: var(--orange-700);
  font-weight: 600;
}

.quest-deadline-compact.deadline-expired {
  background: rgba(239, 68, 68, 0.1);
  border-left-color: var(--red-500);
  color: var(--red-700);
  font-weight: 600;
}

.quest-deadline-compact i {
  font-size: 0.9rem;
}

.deadline-text {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.badge-mini {
  font-size: 1rem;
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
}

.badge-mini.diff-EASY { background: var(--green-100); }
.badge-mini.diff-MEDIUM { background: var(--blue-100); }
.badge-mini.diff-HARD { background: var(--orange-100); }
.badge-mini.diff-EPIC { background: var(--purple-100); }
.badge-mini.diff-LEGENDARY { background: var(--pink-100); }
.badge-mini.type { background: var(--cyan-100); }

.separator {
  color: var(--text-color-secondary);
  font-weight: 400;
}

.xp-value {
  color: var(--yellow-700);
  font-weight: 700;
}

/* Progress mini */
.progress-mini {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.progress-bar-tiny {
  flex: 1;
  height: 5px;
  background: var(--surface-border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill-tiny {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-text-tiny {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-color-secondary);
  min-width: 35px;
}

/* Status badge compact */
.status-badge-compact {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
  border: 2px solid;
}

.status-badge-compact.status-available {
  background: var(--blue-50);
  border-color: var(--blue-500);
  color: var(--blue-600);
}

.status-badge-compact.status-progress {
  background: var(--yellow-50);
  border-color: var(--yellow-500);
  color: var(--yellow-700);
}

.status-badge-compact.status-completed {
  background: var(--green-50);
  border-color: var(--green-500);
  color: var(--green-600);
}

.status-badge-compact.status-expired {
  background: var(--red-50);
  border-color: var(--red-500);
  color: var(--red-600);
}

/* Deadline warning compact */
.deadline-warning-compact {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--orange-500);
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  animation: pulse-warning 1.5s infinite;
}

@keyframes pulse-warning {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.quest-expired {
  border-left-color: var(--red-500) !important;
  opacity: 0.7;
}

.quest-completed {
  border-left-color: var(--green-500) !important;
}

.quest-expiring-soon {
  border-left-color: var(--orange-500) !important;
}

/* 🎨 MODAL DÉTAILLÉE - Styles */

.modal-header-custom {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  width: 100%;
}

.modal-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  border: 3px solid;
  flex-shrink: 0;
}

.modal-icon .icon-emoji-large {
  font-size: 36px;
}

.modal-title-zone {
  flex: 1;
}

.modal-title-zone h3 {
  margin: 0 0 10px 0;
  font-size: 1.4rem;
  font-weight: 700;
  color: var(--text-color);
}

.modal-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.modal-badge {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.modal-badge.difficulty { background: var(--yellow-100); color: var(--yellow-900); }
.modal-badge.diff-EASY { background: var(--green-100); color: var(--green-900); }
.modal-badge.diff-MEDIUM { background: var(--blue-100); color: var(--blue-900); }
.modal-badge.diff-HARD { background: var(--orange-100); color: var(--orange-900); }
.modal-badge.diff-EPIC { background: var(--purple-100); color: var(--purple-900); }
.modal-badge.diff-LEGENDARY { background: var(--pink-100); color: var(--pink-900); }
.modal-badge.type { background: var(--cyan-100); color: var(--cyan-900); }
.modal-badge.status { background: var(--surface-section); }

.modal-deadline {
  background: var(--blue-100);
  color: var(--blue-900);
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 700;
  margin-bottom: 20px;
}

.modal-deadline.urgent {
  background: var(--orange-100);
  color: var(--orange-900);
  animation: pulse-modal 2s infinite;
}

.modal-deadline.expired {
  background: var(--red-100);
  color: var(--red-900);
}

@keyframes pulse-modal {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

.modal-description h4,
.modal-progress h4,
.modal-infos h4 {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.modal-description p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-color-secondary);
}

.modal-description {
  margin-bottom: 20px;
}

.progress-section-modal {
  margin-top: 12px;
}

.progress-bar-modal {
  height: 14px;
  background: var(--surface-border);
  border-radius: 7px;
  overflow: hidden;
  position: relative;
}

.progress-fill-modal {
  height: 100%;
  border-radius: 7px;
  transition: width 0.6s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.progress-text-modal {
  font-size: 0.75rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
  z-index: 1;
}

.modal-progress {
  margin-bottom: 20px;
}

.info-grid-modal {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.info-item-modal {
  background: var(--surface-section);
  padding: 14px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--surface-border);
}

.info-item-modal i {
  font-size: 1.3rem;
  color: var(--house-color);
}

.info-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  margin-bottom: 4px;
}

.info-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

.modal-footer-custom {
  padding: 0;
}

/* 🚨 NOTICE QUÊTE EXPIRÉE */
.info-item-modal.expired-notice {
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  border: 2px solid #fee2e2;
  border-left: 4px solid #ef4444;
  animation: pulse-expired 2s infinite;
}

@keyframes pulse-expired {
  0%, 100% { 
    opacity: 1; 
    transform: scale(1);
  }
  50% { 
    opacity: 0.9; 
    transform: scale(1.01);
  }
}

/* MAIN CONTENT */
.quest-main-content {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* HEADER CLAIR */
.quest-header-clear {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.quest-icon-visual {
  width: 72px;
  height: 72px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  border: 3px solid;
  flex-shrink: 0;
  background: linear-gradient(135deg, var(--surface-ground), var(--surface-section));
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  transition: transform 0.3s ease;
}

.user-friendly-quest-card:hover .quest-icon-visual {
  transform: scale(1.05) rotate(-3deg);
}

.quest-icon-visual .icon-emoji {
  font-size: 40px;
}

.quest-icon-visual .pi {
  font-size: 32px;
}

.quest-title-zone {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quest-title-main {
  font-size: 1.3rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1.3;
  margin: 0;
}

.quest-meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.meta-badge {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.08);
}

.meta-badge.difficulty {
  background: linear-gradient(135deg, var(--yellow-50), var(--yellow-100));
  color: var(--yellow-900);
  border: 1px solid var(--yellow-200);
}

.meta-badge.diff-EASY {
  background: linear-gradient(135deg, var(--green-50), var(--green-100));
  color: var(--green-900);
  border: 1px solid var(--green-200);
}

.meta-badge.diff-MEDIUM {
  background: linear-gradient(135deg, var(--blue-50), var(--blue-100));
  color: var(--blue-900);
  border: 1px solid var(--blue-200);
}

.meta-badge.diff-HARD {
  background: linear-gradient(135deg, var(--orange-50), var(--orange-100));
  color: var(--orange-900);
  border: 1px solid var(--orange-200);
}

.meta-badge.diff-EPIC {
  background: linear-gradient(135deg, var(--purple-50), var(--purple-100));
  color: var(--purple-900);
  border: 1px solid var(--purple-200);
}

.meta-badge.diff-LEGENDARY {
  background: linear-gradient(135deg, var(--pink-50), var(--pink-100));
  color: var(--pink-900);
  border: 1px solid var(--pink-200);
  animation: shimmer-legendary 2s infinite;
}

@keyframes shimmer-legendary {
  0%, 100% { box-shadow: 0 2px 4px rgba(0,0,0,0.08); }
  50% { box-shadow: 0 4px 12px var(--pink-300); }
}

.meta-badge.type {
  background: linear-gradient(135deg, var(--cyan-50), var(--cyan-100));
  color: var(--cyan-900);
  border: 1px solid var(--cyan-200);
}

.meta-badge.level {
  background: linear-gradient(135deg, var(--indigo-50), var(--indigo-100));
  color: var(--indigo-900);
  border: 1px solid var(--indigo-200);
}

/* STATUS INDICATOR CLAIR */
.status-indicator {
  flex-shrink: 0;
  padding: 8px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 0.9rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border: 2px solid;
}

.status-indicator.status-available {
  background: var(--blue-50);
  color: var(--blue-700);
  border-color: var(--blue-300);
}

.status-indicator.status-progress {
  background: var(--yellow-50);
  color: var(--yellow-800);
  border-color: var(--yellow-300);
  animation: pulse-status 2s infinite;
}

.status-indicator.status-completed {
  background: var(--green-50);
  color: var(--green-700);
  border-color: var(--green-300);
}

.status-indicator.status-expired {
  background: var(--red-50);
  color: var(--red-700);
  border-color: var(--red-300);
}

@keyframes pulse-status {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.03); }
}

/* DESCRIPTION CLAIRE */
.quest-description-clear {
  background: var(--surface-section);
  padding: 16px;
  border-radius: 12px;
  border-left: 4px solid var(--house-color);
}

.quest-description-clear p {
  margin: 0;
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-color);
}

/* PROGRESS SECTION */
.quest-progress-section {
  background: var(--surface-ground);
  padding: 16px;
  border-radius: 12px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  font-weight: 600;
  color: var(--text-color);
}

.progress-percentage {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--house-color);
}

.progress-bar-visual {
  height: 12px;
  background: var(--surface-border);
  border-radius: 6px;
  overflow: hidden;
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.1);
}

.progress-fill-visual {
  height: 100%;
  border-radius: 6px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(90deg, var(--house-color), color-mix(in srgb, var(--house-color) 80%, white));
  box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  position: relative;
}

.progress-fill-visual::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent);
  animation: progress-shine 2s infinite;
}

@keyframes progress-shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

/* DETAILS GRID */
.quest-details-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
}

.detail-item {
  background: var(--surface-section);
  padding: 12px 16px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 12px;
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
}

.detail-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.detail-item.reward-item-detail {
  background: linear-gradient(135deg, var(--yellow-50), var(--yellow-100));
  border-color: var(--yellow-200);
}

.detail-icon {
  font-size: 1.5rem;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
}

.detail-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-color-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.detail-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-color);
}

/* CALL TO ACTION */
.quest-action-zone {
  padding-top: 8px;
  border-top: 2px dashed var(--surface-border);
}

.quest-cta-button {
  width: 100%;
  font-size: 1.05rem !important;
  font-weight: 700 !important;
  padding: 16px !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
}

.quest-cta-button.start,
.quest-cta-button.continue {
  position: relative;
  overflow: hidden;
}

.quest-cta-button.start::before,
.quest-cta-button.continue::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  transform: translate(-50%, -50%);
  transition: width 0.4s ease, height 0.4s ease;
}

.quest-cta-button.start:hover::before,
.quest-cta-button.continue:hover::before {
  width: 300%;
  height: 300%;
}

.quest-cta-button:hover:not(:disabled) {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0,0,0,0.25) !important;
}

.quest-cta-button:active:not(:disabled) {
  transform: translateY(-1px);
}

.quest-icon-compact {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  border: 2px solid;
  background: linear-gradient(135deg, var(--surface-ground), var(--surface-section));
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

/* Effet de shine au hover */
.quest-icon-compact::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
  transform: rotate(45deg);
  transition: all 0.5s ease;
}

.compact-quest-card:hover .quest-icon-compact {
  transform: scale(1.08) rotate(3deg);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

.compact-quest-card:hover .quest-icon-compact::after {
  left: 100%;
}

.quest-icon-compact .icon-emoji {
  font-size: 36px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
}

.quest-icon-compact .pi {
  font-size: 28px;
}

.status-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  border: 2px solid;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  transition: all 0.2s ease;
}

.status-badge:hover {
  transform: scale(1.1);
}

.status-badge.status-available {
  background: var(--blue-50);
  border-color: var(--blue-500);
  color: var(--blue-600);
}

.status-badge.status-progress {
  background: var(--yellow-50);
  border-color: var(--yellow-500);
  color: var(--yellow-700);
  animation: pulse-status 2s infinite;
}

.status-badge.status-completed {
  background: var(--green-50);
  border-color: var(--green-500);
  color: var(--green-600);
}

.status-badge.status-expired {
  background: var(--red-50);
  border-color: var(--red-500);
  color: var(--red-600);
}

@keyframes pulse-status {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.9; }
}

/* CENTER - Contenu Principal */
.quest-center {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
  justify-content: center;
}

.quest-header-compact {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.quest-title-compact {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--text-color);
  margin: 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  letter-spacing: -0.01em;
  text-shadow: 0 1px 2px rgba(0,0,0,0.05);
}

.quest-meta-badges {
  display: flex;
  gap: 6px;
  flex-shrink: 0;
  flex-wrap: wrap;
}

.mini-badge {
  font-size: 0.75rem;
  padding: 4px 10px;
  border-radius: 8px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.mini-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0,0,0,0.12);
}

.mini-badge.difficulty {
  background: linear-gradient(135deg, var(--yellow-50), var(--yellow-100));
  color: var(--yellow-800);
  border-color: var(--yellow-200);
}

.mini-badge.diff-EASY {
  background: linear-gradient(135deg, var(--green-50), var(--green-100));
  color: var(--green-800);
}

.mini-badge.diff-MEDIUM {
  background: linear-gradient(135deg, var(--blue-50), var(--blue-100));
  color: var(--blue-800);
}

.mini-badge.diff-HARD {
  background: linear-gradient(135deg, var(--orange-50), var(--orange-100));
  color: var(--orange-800);
}

.mini-badge.diff-EPIC {
  background: linear-gradient(135deg, var(--purple-50), var(--purple-100));
  color: var(--purple-800);
}

.mini-badge.diff-LEGENDARY {
  background: linear-gradient(135deg, var(--pink-50), var(--pink-100));
  color: var(--pink-800);
  animation: shimmer-badge 3s infinite;
}

@keyframes shimmer-badge {
  0%, 100% { box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  50% { box-shadow: 0 2px 8px var(--pink-200), 0 0 12px var(--pink-100); }
}

.mini-badge.type {
  background: linear-gradient(135deg, var(--cyan-50), var(--cyan-100));
  color: var(--cyan-800);
  border-color: var(--cyan-200);
}

.mini-badge.level {
  background: linear-gradient(135deg, var(--indigo-50), var(--indigo-100));
  color: var(--indigo-800);
  font-size: 0.7rem;
  border-color: var(--indigo-200);
}

.quest-description-compact {
  font-size: 0.88rem;
  color: var(--text-color-secondary);
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.quest-description-full {
  font-size: 0.92rem;
  color: var(--text-color);
  line-height: 1.6;
  margin: 0;
}

.quest-progress-compact {
  margin-top: 4px;
}

.progress-bar-mini {
  height: 8px;
  background: var(--surface-border);
  border-radius: 4px;
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 8px;
  background: linear-gradient(90deg, var(--house-color), color-mix(in srgb, var(--house-color) 80%, white));
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.progress-fill::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  animation: progress-shine 2s infinite;
}

@keyframes progress-shine {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}

.progress-text {
  font-size: 0.7rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
  z-index: 1;
}

.quest-info-line {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 0.78rem;
  color: var(--text-color-secondary);
  margin-top: 4px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border-radius: 6px;
  background: var(--surface-section);
  transition: all 0.2s ease;
}

.info-item:hover {
  background: var(--surface-hover);
  transform: translateY(-1px);
}

.info-item i {
  font-size: 0.75rem;
}

.info-item.recurring {
  color: var(--purple-600);
  background: var(--purple-50);
}

.info-item.expiring {
  color: var(--orange-700);
  font-weight: 700;
  background: var(--orange-50);
  animation: pulse-warning 1.5s infinite;
}

.info-item.expired {
  color: var(--red-700);
  font-weight: 700;
  background: var(--red-50);
}

@keyframes pulse-warning {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.8; }
}

/* RIGHT SIDE - Récompenses et Actions */
.quest-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
  gap: 8px;
  flex-shrink: 0;
}

.rewards-compact {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-end;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border-radius: 10px;
  font-size: 0.85rem;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 2px 6px rgba(0,0,0,0.08);
  transition: all 0.2s ease;
  border: 1px solid;
}

.reward-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.reward-item.xp {
  background: linear-gradient(135deg, var(--yellow-50), var(--yellow-100));
  color: var(--yellow-900);
  border-color: var(--yellow-200);
}

.reward-item.xp i {
  color: var(--yellow-600);
  font-size: 0.8rem;
  animation: sparkle 3s infinite;
}

@keyframes sparkle {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.2); opacity: 0.8; }
}

.reward-item.badges {
  background: linear-gradient(135deg, var(--purple-50), var(--purple-100));
  color: var(--purple-900);
  border-color: var(--purple-200);
}

.reward-item.badges i {
  color: var(--purple-600);
  font-size: 0.8rem;
}

.quest-action-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  border: 2px solid var(--house-color);
  color: white;
  background: var(--house-color);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  font-size: 1rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  position: relative;
  overflow: hidden;
}

.quest-action-btn::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(255,255,255,0.3);
  transform: translate(-50%, -50%);
  transition: width 0.3s ease, height 0.3s ease;
}

.quest-action-btn:hover:not(:disabled)::before {
  width: 100%;
  height: 100%;
}

.quest-action-btn:hover:not(:disabled) {
  transform: scale(1.15) rotate(5deg);
  box-shadow: 0 6px 16px rgba(0,0,0,0.25);
}

.quest-action-btn:active:not(:disabled) {
  transform: scale(1.05);
}

.quest-action-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  filter: grayscale(1);
}

/* RESPONSIVE MOBILE */
@media (max-width: 768px) {
  .quest-main-content {
    padding: 16px;
    gap: 16px;
  }

  .quest-header-clear {
    flex-direction: column;
    gap: 12px;
  }

  .quest-icon-visual {
    width: 60px;
    height: 60px;
  }

  .quest-icon-visual .icon-emoji {
    font-size: 32px;
  }

  .quest-title-main {
    font-size: 1.1rem;
  }

  .meta-badge {
    font-size: 0.8rem;
    padding: 4px 10px;
  }

  .status-indicator {
    padding: 6px 12px;
    font-size: 0.85rem;
  }

  .quest-details-grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .detail-item {
    padding: 10px 14px;
  }

  .detail-icon {
    width: 36px;
    height: 36px;
    font-size: 1.3rem;
  }

  .quest-cta-button {
    font-size: 1rem !important;
    padding: 14px !important;
  }

  .deadline-banner {
    padding: 10px 16px;
  }

  .deadline-icon {
    width: 36px;
    height: 36px;
    font-size: 1rem;
  }

  .deadline-label {
    font-size: 0.8rem;
  }

  .deadline-value {
    font-size: 1rem;
  }
}

@media (max-width: 480px) {
  .quest-main-content {
    padding: 12px;
    gap: 12px;
  }

  .quest-icon-visual {
    width: 52px;
    height: 52px;
  }

  .quest-title-main {
    font-size: 1rem;
  }

  .quest-details-grid {
    gap: 6px;
  }

  .detail-value {
    font-size: 0.9rem;
  }
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
