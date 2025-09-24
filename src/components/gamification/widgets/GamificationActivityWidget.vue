<template>
  <div class="gamification-activity-widget">
    <!-- En-tête -->
    <div class="flex align-items-center justify-content-between mb-4">
      <div class="flex align-items-center gap-2">
        <i class="pi pi-clock text-xl" style="color: var(--primary-color)"></i>
        <h3 class="text-lg font-bold text-900 m-0">Activité Récente</h3>
      </div>
      <Button 
        icon="pi pi-external-link" 
        class="p-button-text p-button-sm" 
        @click="viewAllLogs"
        label="Voir tout"
      />
    </div>

    <!-- Liste des activités -->
    <div class="activity-list">
      <div 
        v-for="log in recentLogs" 
        :key="log.id"
        class="activity-item"
      >
        <div class="activity-icon" :class="getActivityIconClass(log.action)">
          <i :class="getActivityIcon(log.action)"></i>
        </div>
        <div class="activity-content">
          <div class="activity-text">{{ getActivityText(log) }}</div>
          <div class="activity-time">{{ formatTime(log.timestamp) }}</div>
        </div>
        <div class="activity-badge" :class="getActivityBadgeClass(log.action)">
          {{ getActivityLabel(log.action) }}
        </div>
      </div>
      
      <!-- État vide -->
      <div v-if="recentLogs.length === 0" class="empty-state">
        <i class="pi pi-info-circle text-4xl text-300 mb-3"></i>
        <p class="text-600 m-0">Aucune activité récente</p>
      </div>
    </div>

    <!-- Statistiques rapides -->
    <div class="activity-stats mt-4">
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">{{ todayActivities }}</div>
          <div class="stat-label">Aujourd'hui</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ weekActivities }}</div>
          <div class="stat-label">Cette semaine</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">{{ activeUsers }}</div>
          <div class="stat-label">Utilisateurs actifs</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Button from 'primevue/button'
import gamificationService from '@/service/gamificationService'

const props = defineProps({
  maxItems: {
    type: Number,
    default: 8
  },
  showStats: {
    type: Boolean,
    default: true
  }
})

const router = useRouter()
const allLogs = ref([])
const listenerId = ref(null)

// Logs récents limités
const recentLogs = computed(() => {
  return allLogs.value.slice(0, props.maxItems)
})

// Statistiques calculées
const todayActivities = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return allLogs.value.filter(log => 
    new Date(log.timestamp) >= today
  ).length
})

const weekActivities = computed(() => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  return allLogs.value.filter(log => 
    new Date(log.timestamp) >= weekAgo
  ).length
})

const activeUsers = computed(() => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const recentUserIds = new Set(
    allLogs.value
      .filter(log => new Date(log.timestamp) >= weekAgo)
      .map(log => log.userId)
      .filter(Boolean)
  )
  return recentUserIds.size
})

// Méthodes utilitaires
const getActivityIcon = (action) => {
  const icons = {
    'quest_created': 'pi pi-flag',
    'challenge_created': 'pi pi-trophy',
    'badge_earned': 'pi pi-star',
    'quest_completed': 'pi pi-check-circle',
    'challenge_completed': 'pi pi-check',
    'user_joined': 'pi pi-user-plus',
    'house_joined': 'pi pi-home',
    'xp_gained': 'pi pi-arrow-up'
  }
  return icons[action] || 'pi pi-circle'
}

const getActivityIconClass = (action) => {
  const classes = {
    'quest_created': 'icon-quest',
    'challenge_created': 'icon-challenge',
    'badge_earned': 'icon-badge',
    'quest_completed': 'icon-success',
    'challenge_completed': 'icon-success',
    'user_joined': 'icon-user',
    'house_joined': 'icon-house',
    'xp_gained': 'icon-xp'
  }
  return classes[action] || 'icon-default'
}

const getActivityBadgeClass = (action) => {
  const classes = {
    'quest_created': 'badge-quest',
    'challenge_created': 'badge-challenge',
    'badge_earned': 'badge-badge',
    'quest_completed': 'badge-success',
    'challenge_completed': 'badge-success',
    'user_joined': 'badge-user',
    'house_joined': 'badge-house',
    'xp_gained': 'badge-xp'
  }
  return classes[action] || 'badge-default'
}

const getActivityLabel = (action) => {
  const labels = {
    'quest_created': 'Quête',
    'challenge_created': 'Défi',
    'badge_earned': 'Badge',
    'quest_completed': 'Complété',
    'challenge_completed': 'Réussi',
    'user_joined': 'Nouveau',
    'house_joined': 'Maison',
    'xp_gained': 'XP'
  }
  return labels[action] || 'Action'
}

const getActivityText = (log) => {
  const texts = {
    'quest_created': `Nouvelle quête créée`,
    'challenge_created': `Nouveau défi créé`,
    'badge_earned': `Badge obtenu`,
    'quest_completed': `Quête terminée`,
    'challenge_completed': `Défi relevé`,
    'user_joined': `Nouvel utilisateur`,
    'house_joined': `Rejoint une maison`,
    'xp_gained': `Points d'expérience gagnés`
  }
  return texts[log.action] || `Action: ${log.action}`
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  
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

// Actions
const viewAllLogs = () => {
  router.push('/admin/gamification/analytics')
}

// Charger les données
const loadLogs = async () => {
  try {
    const stats = await gamificationService.getUnifiedStats()
    allLogs.value = stats.recentLogs || []
  } catch (error) {
    console.error('[GamificationActivityWidget] Erreur lors du chargement:', error)
    allLogs.value = []
  }
}

// S'abonner aux mises à jour temps réel des logs d'activité
const subscribeToUpdates = () => {
  // Utiliser le nouvel abonnement spécialisé pour les logs d'activité
  listenerId.value = gamificationService.subscribeToActivity((recentLogs) => {
    allLogs.value = recentLogs || []
  }, 50) // Charger plus de logs pour le filtrage
}

// Lifecycle
onMounted(() => {
  loadLogs()
  subscribeToUpdates()
})

onUnmounted(() => {
  if (listenerId.value) {
    gamificationService.unsubscribe(listenerId.value)
  }
})
</script>

<style scoped>
.gamification-activity-widget {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  height: 100%;
}

.activity-list {
  max-height: 400px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--surface-border);
  transition: all 0.3s ease;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-item:hover {
  background: var(--surface-hover);
  margin: 0 -0.5rem;
  padding-left: 0.5rem;
  padding-right: 0.5rem;
  border-radius: 8px;
}

.activity-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: white;
  flex-shrink: 0;
}

.icon-quest { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.icon-challenge { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.icon-badge { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }
.icon-success { background: linear-gradient(135deg, #84fab0 0%, #8fd3f4 100%); }
.icon-user { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
.icon-house { background: linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%); }
.icon-xp { background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); }
.icon-default { background: linear-gradient(135deg, #d299c2 0%, #fef9d7 100%); }

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.activity-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.badge-quest { background: rgba(79, 172, 254, 0.1); color: #4facfe; }
.badge-challenge { background: rgba(240, 147, 251, 0.1); color: #f093fb; }
.badge-badge { background: rgba(67, 233, 123, 0.1); color: #43e97b; }
.badge-success { background: rgba(132, 250, 176, 0.1); color: #84fab0; }
.badge-user { background: rgba(102, 126, 234, 0.1); color: #667eea; }
.badge-house { background: rgba(255, 236, 210, 0.1); color: #fcb69f; }
.badge-xp { background: rgba(168, 237, 234, 0.1); color: #a8edea; }
.badge-default { background: rgba(210, 153, 194, 0.1); color: #d299c2; }

.empty-state {
  text-align: center;
  padding: 2rem 0;
}

.activity-stats {
  border-top: 1px solid var(--surface-border);
  padding-top: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--primary-color);
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .gamification-activity-widget {
    padding: 1rem;
  }
  
  .activity-item {
    gap: 0.75rem;
  }
  
  .activity-icon {
    width: 2rem;
    height: 2rem;
    font-size: 0.875rem;
  }
  
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
</style>
