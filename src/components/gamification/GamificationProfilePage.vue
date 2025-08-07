<template>
  <Navbar />
  <div class="gamification-profile-page">
    
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner">
        <i class="pi pi-spin pi-spinner"></i>
        <p>Chargement de votre profil...</p>
      </div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <div class="error-message">
        <i class="pi pi-exclamation-triangle"></i>
        <h3>Erreur de chargement</h3>
        <p>{{ error }}</p>
        <button @click="loadUserStats" class="retry-btn">
          <i class="pi pi-refresh"></i>
          Réessayer
        </button>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else-if="userStats" class="profile-content">
      
      <!-- Profile Header -->
      <div class="profile-header">
        <div class="profile-banner" :style="{ backgroundColor: houseColor }">
          <div class="profile-info">
            
            <!-- User Avatar -->
            <div class="user-avatar">
              <img v-if="userStats.photoURL" :src="userStats.photoURL" :alt="userStats.displayName" />
              <div v-else class="avatar-placeholder">
                <i class="pi pi-user"></i>
              </div>
            </div>
            
            <!-- User Details -->
            <div class="user-details">
              <h1 class="user-name">{{ userStats.displayName || 'Utilisateur' }}</h1>
              
              <div class="user-house" v-if="userStats.maison">
                <i class="pi pi-home"></i>
                <span>Maison {{ userStats.maison }}</span>
              </div>
              
              <div class="user-level">
                <span class="level-badge">Niveau {{ userStats.niveau || 1 }}</span>
              </div>
            </div>
            
            <!-- Quick Stats -->
            <div class="quick-stats">
              <div class="stat-item">
                <div class="stat-value">{{ formatNumber(userStats.xp || 0) }}</div>
                <div class="stat-label">XP Total</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ userStats.streak || 0 }}</div>
                <div class="stat-label">Série Actuelle</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ userStats.streakMax || 0 }}</div>
                <div class="stat-label">Meilleure Série</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Progression Section -->
      <div class="section-content">
        <h2><i class="pi pi-chart-line"></i> Ma Progression</h2>
        
        <!-- XP Progress -->
        <div class="progress-card">
          <h3>Progression vers le niveau {{ (userStats.niveau || 1) + 1 }}</h3>
          <div class="xp-progress">
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ 
                  width: `${xpProgress}%`,
                  backgroundColor: houseColor
                }"
              ></div>
            </div>
            <div class="progress-text">
              {{ formatNumber(userStats.xp || 0) }} / {{ formatNumber(getNextLevelXP(userStats.niveau || 1)) }} XP
            </div>
          </div>
        </div>
        
        <!-- Detailed Stats -->
        <div class="detailed-stats">
          <div class="stat-card">
            <i class="pi pi-calendar"></i>
            <div class="stat-info">
              <div class="stat-number">{{ getDaysSinceJoined() }}</div>
              <div class="stat-desc">Jours depuis l'inscription</div>
            </div>
          </div>
          
          <div class="stat-card">
            <i class="pi pi-trophy"></i>
            <div class="stat-info">
              <div class="stat-number">{{ userStats.defisCompletes || 0 }}</div>
              <div class="stat-desc">Défis complétés</div>
            </div>
          </div>
          
          <div class="stat-card">
            <i class="pi pi-star"></i>
            <div class="stat-info">
              <div class="stat-number">{{ userStats.pointsBonus || 0 }}</div>
              <div class="stat-desc">Points bonus</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Back Button -->
      <div class="back-button-container">
        <button @click="goBack" class="back-btn">
          <i class="pi pi-arrow-left"></i>
          Retour
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth } from 'firebase/auth'
import { getUserGamificationStats } from '@/service/hesHousesService'
import Navbar from '@/components/common/utils/Navbar.vue'

// Router and auth
const router = useRouter()
const auth = getAuth()

// Reactive state
const loading = ref(true)
const error = ref(null)
const userStats = ref(null)

// House configuration
const houseConfig = {
  'Harmonis': { name: 'Harmonis', color: '#10B981' },
  'Elaris': { name: 'Elaris', color: '#3B82F6' },
  'Doloris': { name: 'Doloris', color: '#EF4444' },
  'Solencia': { name: 'Solencia', color: '#F59E0B' }
}

// Computed properties
const houseColor = computed(() => {
  if (!userStats.value?.maison) return '#6B7280'
  return houseConfig[userStats.value.maison]?.color || '#6B7280'
})

const xpProgress = computed(() => {
  if (!userStats.value) return 0
  const currentXP = userStats.value.xp || 0
  const nextLevelXP = getNextLevelXP(userStats.value.niveau || 1)
  const currentLevelXP = getCurrentLevelXP(userStats.value.niveau || 1)
  return Math.min(100, ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)
})

// Utility functions
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

const getCurrentLevelXP = (level) => {
  if (level <= 1) return 0
  return Math.floor(50 * Math.pow(1.5, level - 2))
}

const getNextLevelXP = (level) => {
  return Math.floor(50 * Math.pow(1.5, level - 1))
}

const getDaysSinceJoined = () => {
  if (!userStats.value?.joinedAt) return 0
  const joinDate = new Date(userStats.value.joinedAt)
  const today = new Date()
  const diffTime = Math.abs(today - joinDate)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

// Data loading
const loadUserStats = async () => {
  try {
    loading.value = true
    error.value = null
    
    if (!auth.currentUser?.uid) {
      throw new Error('Utilisateur non connecté')
    }
    
    const stats = await getUserGamificationStats(auth.currentUser.uid)
    
    if (!stats) {
      throw new Error('Aucune donnée trouvée pour cet utilisateur')
    }
    
    userStats.value = stats
  } catch (err) {
    console.error('Erreur lors du chargement des stats:', err)
    error.value = err.message || 'Erreur lors du chargement des données'
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.go(-1)
}

// Initialization
onMounted(() => {
  loadUserStats()
})
</script>

<style scoped>
.gamification-profile-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding-bottom: 2rem;
}

/* Loading and Error States */
.loading-container, .error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.loading-spinner, .error-message {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.loading-spinner i {
  font-size: 2rem;
  color: #3B82F6;
  margin-bottom: 1rem;
}

.error-message i {
  font-size: 2rem;
  color: #EF4444;
  margin-bottom: 1rem;
}

.retry-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #3B82F6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Profile Header */
.profile-header {
  margin-bottom: 2rem;
}

.profile-banner {
  background: linear-gradient(135deg, var(--house-color, #6B7280) 0%, rgba(0,0,0,0.1) 100%);
  color: white;
  padding: 2rem;
  border-radius: 0 0 20px 20px;
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.user-avatar {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.3);
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
}

.user-details {
  flex: 1;
}

.user-name {
  font-size: 2rem;
  font-weight: bold;
  margin: 0 0 0.5rem 0;
}

.user-house {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  opacity: 0.9;
}

.user-level {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.level-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: bold;
}

.quick-stats {
  display: flex;
  gap: 2rem;
}

.stat-item {
  text-align: center;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.8;
}

/* Section Content */
.section-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.section-content h2 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  color: #1f2937;
}

/* Progress Card */
.progress-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.progress-card h3 {
  margin-bottom: 1rem;
  color: #1f2937;
}

.xp-progress {
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  height: 12px;
  background: #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-fill {
  height: 100%;
  background: #3B82F6;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.progress-text {
  text-align: center;
  font-weight: 500;
  color: #6b7280;
}

/* Detailed Stats */
.detailed-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-card i {
  font-size: 2rem;
  color: #3B82F6;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: #1f2937;
}

.stat-desc {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Back Button */
.back-button-container {
  text-align: center;
  margin-top: 3rem;
}

.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.back-btn:hover {
  background: #4b5563;
}

/* Responsive */
@media (max-width: 768px) {
  .profile-info {
    flex-direction: column;
    text-align: center;
    gap: 1rem;
  }

  .quick-stats {
    justify-content: center;
  }

  .detailed-stats {
    grid-template-columns: 1fr;
  }
}
</style>
