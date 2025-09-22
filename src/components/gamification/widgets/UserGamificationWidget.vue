<template>
  <div class="user-gamification-widget">
    <!-- En-tête utilisateur -->
    <div class="user-header">
      <div class="user-avatar">
        <img v-if="userData?.photoURL" :src="userData.photoURL" :alt="userData.displayName" />
        <i v-else class="pi pi-user text-2xl"></i>
      </div>
      <div class="user-info">
        <h3 class="user-name">{{ userData?.displayName || 'Utilisateur' }}</h3>
        <div class="user-level">
          <i class="pi pi-star-fill mr-1"></i>
          Niveau {{ userLevel }}
        </div>
      </div>
      <div class="user-xp">
        <div class="xp-value">{{ userXP }} XP</div>
        <div class="xp-progress">
          <div class="xp-bar" :style="{ width: xpProgress + '%' }"></div>
        </div>
        <div class="xp-next">{{ xpToNext }} XP jusqu'au niveau {{ userLevel + 1 }}</div>
      </div>
    </div>

    <!-- Maison de l'utilisateur -->
    <div v-if="userHouse" class="user-house">
      <div class="house-banner" :style="{ backgroundColor: userHouse.color }">
        <i class="pi pi-home mr-2"></i>
        <span class="house-name">{{ userHouse.name }}</span>
        <div class="house-rank">
          #{{ houseRank }} • {{ userHouse.totalXP }} XP
        </div>
      </div>
    </div>

    <!-- Statistiques utilisateur -->
    <div class="user-stats">
      <div class="stat-grid">
        <div class="user-stat">
          <div class="stat-icon challenges-stat">
            <i class="pi pi-trophy"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ userStats.challengesCompleted || 0 }}</div>
            <div class="stat-label">Défis Relevés</div>
          </div>
        </div>
        
        <div class="user-stat">
          <div class="stat-icon quests-stat">
            <i class="pi pi-flag"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ userStats.questsCompleted || 0 }}</div>
            <div class="stat-label">Quêtes Terminées</div>
          </div>
        </div>
        
        <div class="user-stat">
          <div class="stat-icon badges-stat">
            <i class="pi pi-star"></i>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ userStats.badgesEarned || 0 }}</div>
            <div class="stat-label">Badges Obtenus</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Badges récents -->
    <div v-if="recentBadges.length > 0" class="recent-badges">
      <h4 class="section-title">
        <i class="pi pi-star mr-2"></i>
        Badges Récents
      </h4>
      <div class="badges-grid">
        <div 
          v-for="badge in recentBadges.slice(0, 4)" 
          :key="badge.id"
          class="badge-item"
          :title="badge.description"
        >
          <div class="badge-icon" :style="{ backgroundColor: badge.color }">
            <i :class="badge.icon || 'pi pi-star'"></i>
          </div>
          <div class="badge-name">{{ badge.name }}</div>
        </div>
      </div>
    </div>

    <!-- Activité récente -->
    <div v-if="recentActivity.length > 0" class="recent-activity">
      <h4 class="section-title">
        <i class="pi pi-clock mr-2"></i>
        Activité Récente
      </h4>
      <div class="activity-list">
        <div 
          v-for="activity in recentActivity.slice(0, 3)" 
          :key="activity.id"
          class="activity-item"
        >
          <div class="activity-icon" :class="getActivityClass(activity.type)">
            <i :class="getActivityIcon(activity.type)"></i>
          </div>
          <div class="activity-content">
            <div class="activity-text">{{ activity.description }}</div>
            <div class="activity-time">{{ formatTime(activity.timestamp) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Actions rapides -->
    <div class="quick-actions">
      <Button 
        label="Voir Profil Complet" 
        icon="pi pi-user" 
        class="p-button-outlined w-full mb-2"
        @click="viewFullProfile"
      />
      <div class="action-buttons">
        <Button 
          label="Quêtes" 
          icon="pi pi-flag" 
          class="p-button-text p-button-sm"
          @click="$router.push('/gamification/quests')"
        />
        <Button 
          label="Défis" 
          icon="pi pi-trophy" 
          class="p-button-text p-button-sm"
          @click="$router.push('/gamification/challenges')"
        />
        <Button 
          label="Badges" 
          icon="pi pi-star" 
          class="p-button-text p-button-sm"
          @click="$router.push('/gamification/achievements')"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth } from 'firebase/auth'
import Button from 'primevue/button'
import gamificationService from '@/service/gamificationService'

const props = defineProps({
  userId: {
    type: String,
    default: null
  },
  showActions: {
    type: Boolean,
    default: true
  },
  compact: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()
const auth = getAuth()
const userData = ref(null)
const userStats = ref({})
const userHouse = ref(null)
const recentBadges = ref([])
const recentActivity = ref([])
const allHouses = ref({})
const listenerId = ref(null)

// Utilisateur cible (props.userId ou utilisateur connecté)
const targetUserId = computed(() => {
  return props.userId || auth.currentUser?.uid
})

// Calculs XP et niveau
const userXP = computed(() => {
  return userData.value?.gamification?.xp || 0
})

const userLevel = computed(() => {
  return gamificationService.calculateLevel(userXP.value)
})

const xpForCurrentLevel = computed(() => {
  return (userLevel.value - 1) * 100
})

const xpForNextLevel = computed(() => {
  return userLevel.value * 100
})

const xpProgress = computed(() => {
  const currentLevelXP = userXP.value - xpForCurrentLevel.value
  const neededForNext = xpForNextLevel.value - xpForCurrentLevel.value
  return Math.min((currentLevelXP / neededForNext) * 100, 100)
})

const xpToNext = computed(() => {
  return Math.max(0, xpForNextLevel.value - userXP.value)
})

// Rang de la maison
const houseRank = computed(() => {
  if (!userHouse.value || !allHouses.value) return 0
  
  const sortedHouses = Object.entries(allHouses.value)
    .sort(([,a], [,b]) => (b.totalXP || 0) - (a.totalXP || 0))
  
  const rank = sortedHouses.findIndex(([id]) => id === userData.value?.gamification?.maison)
  return rank >= 0 ? rank + 1 : 0
})

// Méthodes utilitaires
const getActivityIcon = (type) => {
  const icons = {
    'quest_completed': 'pi pi-flag',
    'challenge_completed': 'pi pi-trophy',
    'badge_earned': 'pi pi-star',
    'xp_gained': 'pi pi-arrow-up',
    'level_up': 'pi pi-arrow-circle-up'
  }
  return icons[type] || 'pi pi-circle'
}

const getActivityClass = (type) => {
  const classes = {
    'quest_completed': 'activity-quest',
    'challenge_completed': 'activity-challenge',
    'badge_earned': 'activity-badge',
    'xp_gained': 'activity-xp',
    'level_up': 'activity-level'
  }
  return classes[type] || 'activity-default'
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
  if (minutes < 60) return `${minutes}min`
  if (hours < 24) return `${hours}h`
  if (days < 7) return `${days}j`
  
  return date.toLocaleDateString()
}

// Actions
const viewFullProfile = () => {
  if (props.userId && props.userId !== auth.currentUser?.uid) {
    router.push(`/profile/${props.userId}`)
  } else {
    router.push('/gamification/profile')
  }
}

// Charger les données utilisateur
const loadUserData = async () => {
  if (!targetUserId.value) return
  
  try {
    const [userGamificationData, unifiedStats] = await Promise.all([
      gamificationService.getUserGamificationData(targetUserId.value),
      gamificationService.getUnifiedStats()
    ])
    
    userData.value = userGamificationData
    userStats.value = userGamificationData?.gamification?.stats || {}
    allHouses.value = unifiedStats.houses || {}
    
    // Charger les données de la maison
    if (userGamificationData?.gamification?.maison) {
      userHouse.value = await gamificationService.getHouseData(userGamificationData.gamification.maison)
    }
    
    // Simuler des badges et activités récents (à remplacer par de vraies données)
    recentBadges.value = userGamificationData?.gamification?.badges?.slice(-4) || []
    recentActivity.value = [
      {
        id: 1,
        type: 'quest_completed',
        description: 'Quête "Première Mission" terminée',
        timestamp: Date.now() - 3600000
      },
      {
        id: 2,
        type: 'xp_gained',
        description: '+50 XP gagnés',
        timestamp: Date.now() - 7200000
      }
    ]
    
  } catch (error) {
    console.error('[UserGamificationWidget] Erreur lors du chargement:', error)
  }
}

// S'abonner aux mises à jour
const subscribeToUpdates = () => {
  if (!targetUserId.value) return
  
  listenerId.value = gamificationService.subscribeToUser(targetUserId.value, (updatedUserData) => {
    userData.value = updatedUserData
    userStats.value = updatedUserData?.gamification?.stats || {}
  })
}

// Watchers
watch(targetUserId, (newUserId) => {
  if (newUserId) {
    loadUserData()
    subscribeToUpdates()
  }
}, { immediate: true })

// Lifecycle
onMounted(() => {
  if (targetUserId.value) {
    loadUserData()
    subscribeToUpdates()
  }
})

onUnmounted(() => {
  if (listenerId.value) {
    gamificationService.unsubscribe(listenerId.value)
  }
})
</script>

<style scoped>
.user-gamification-widget {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.user-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--surface-border);
}

.user-avatar {
  width: 4rem;
  height: 4rem;
  border-radius: 50%;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 1.25rem;
  font-weight: bold;
  color: var(--text-color);
  margin: 0 0 0.25rem 0;
}

.user-level {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
  color: var(--primary-color);
  font-weight: 600;
}

.user-xp {
  text-align: right;
  min-width: 120px;
}

.xp-value {
  font-size: 1.125rem;
  font-weight: bold;
  color: var(--text-color);
}

.xp-progress {
  width: 100%;
  height: 6px;
  background: var(--surface-border);
  border-radius: 3px;
  margin: 0.5rem 0;
  overflow: hidden;
}

.xp-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-color-text));
  border-radius: 3px;
  transition: width 0.3s ease;
}

.xp-next {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.user-house {
  margin-bottom: 1.5rem;
}

.house-banner {
  padding: 1rem;
  border-radius: 8px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.house-name {
  font-weight: 600;
  font-size: 1rem;
}

.house-rank {
  font-size: 0.875rem;
  opacity: 0.9;
}

.user-stats {
  margin-bottom: 1.5rem;
}

.stat-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.user-stat {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 8px;
  transition: all 0.3s ease;
}

.user-stat:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
}

.challenges-stat { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
.quests-stat { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); }
.badges-stat { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); }

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: var(--text-color);
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 1rem 0;
  display: flex;
  align-items: center;
}

.badges-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.badge-item {
  text-align: center;
}

.badge-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin: 0 auto 0.5rem;
}

.badge-name {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.activity-list {
  margin-bottom: 1.5rem;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid var(--surface-border);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.875rem;
}

.activity-quest { background: #4facfe; }
.activity-challenge { background: #f093fb; }
.activity-badge { background: #43e97b; }
.activity-xp { background: #a8edea; }
.activity-level { background: #667eea; }
.activity-default { background: #d299c2; }

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 0.875rem;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.activity-time {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.quick-actions {
  margin-top: 1.5rem;
}

.action-buttons {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .user-gamification-widget {
    padding: 1rem;
  }
  
  .user-header {
    flex-direction: column;
    text-align: center;
  }
  
  .stat-grid {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
  
  .badges-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .action-buttons {
    flex-direction: column;
  }
}
</style>
