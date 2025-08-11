<template>
  <Navbar />
  <div class="gamification-profile-page" :style="{ '--house-color': houseColor }">
    
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
        <div class="profile-banner" :style="{ backgroundImage: `url(${houseBackgroundImage})` }">
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

      <!-- Page header aligned with HouseStatsPage -->
      <div class="page-header">
        <div class="header-content">
          <button class="back-btn" @click="goBack">
            <i class="pi pi-arrow-left"></i>
          </button>
          <div class="header-title-container">
            <h2 class="page-title">Mon Profil Gamification</h2>
          </div>
        </div>
      </div>

      <!-- Section principale, calquée sur HouseStatsPage -->
      <div class="stats-container">
        <!-- Carte niveau/progression (style house-level-card) -->
        <div class="house-level-card">
          <div class="level-info">
            <div class="level-badge" :style="{ backgroundColor: houseColor }">
              Niveau {{ userStats.niveau || 1 }}
            </div>
            <h2 class="level-name">Progression du Niveau</h2>
            <div class="xp-progress">
              <div class="xp-bar">
                <div 
                  class="xp-fill" 
                  :style="{ 
                    width: `${xpProgress}%`, 
                    backgroundColor: houseColor 
                  }"
                ></div>
              </div>
              <div class="xp-text">
                <span>{{ formatNumber(userStats.xp || 0) }} XP</span>
                <span>{{ formatNumber(getNextLevelXP(userStats.niveau || 1)) }} XP pour le niveau suivant</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Statistiques générales (grille 3 colonnes) -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon" :style="{ backgroundColor: houseColor }">
              <i class="pi pi-star"></i>
            </div>
            <div class="stat-content">
              <h3>{{ formatNumber(userStats.xp || 0) }}</h3>
              <p>XP Total</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" :style="{ backgroundColor: houseColor }">
              <i class="pi pi-bolt"></i>
            </div>
            <div class="stat-content">
              <h3>{{ userStats.streak || 0 }}</h3>
              <p>Série Actuelle</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon" :style="{ backgroundColor: houseColor }">
              <i class="pi pi-fire"></i>
            </div>
            <div class="stat-content">
              <h3>{{ userStats.streakMax || 0 }}</h3>
              <p>Meilleure Série</p>
            </div>
          </div>
        </div>
      </div>

        <!-- Prochaines quêtes / défis -->
        <div class="card-section">
          <div class="card-header">
            <h3><i class="pi pi-flag"></i> Prochaines Quêtes & Défis</h3>
            <span class="count-chip">{{ upcomingLimited.length }}</span>
          </div>
          <div class="table-container" v-if="upcomingLimited.length">
            <table class="data-table">
              <thead>
              <tr>
                <th>Défi</th>
                <th>Objectif</th>
                <th>Récompense</th>
                <th>Échéance</th>
                <th>Statut</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(q, i) in upcomingLimited" :key="q.id || i">
                <td>{{ q.title || q.name }}</td>
                <td>{{ q.goal || q.description || '-' }}</td>
                <td>{{ q.reward ? `${formatNumber(q.reward)} XP` : '-' }}</td>
                <td>{{ q.deadline ? new Date(q.deadline).toLocaleDateString() : '-' }}</td>
                <td>
                  <span class="status-pill"
                        :class="{
                          completed: challengeStatus(q) === 'validé',
                          missed: challengeStatus(q) === 'loupé',
                          inprogress: challengeStatus(q) === 'en cours'
                        }">
                    <i class="pi" :class="challengeStatus(q) === 'validé' ? 'pi-check-circle' : (challengeStatus(q) === 'loupé' ? 'pi-times-circle' : 'pi-clock')"></i>
                    {{ challengeStatus(q) }}
                  </span>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <i class="pi pi-info-circle"></i>
            <p>Aucun défi planifié pour le moment.</p>
          </div>
        </div>

        <!-- Badges -->
        <div class="card-section">
          <div class="card-header">
            <h3><i class="pi pi-shield"></i> Mes Badges</h3>
            <span class="count-chip">{{ badgesLimited.length }}</span>
          </div>
          <div v-if="badgesLimited.length" class="badge-grid">
            <div v-for="(badge, i) in badgesLimited" :key="badge.id || i" class="badge-item">
              <div class="badge-icon" :style="{ borderColor: houseColor }">
                <i :class="badge.icon || 'pi pi-star'" :style="{ color: houseColor }"></i>
              </div>
              <div class="badge-meta">
                <div class="badge-title">{{ badge.title || badge.name }}</div>
                <div class="badge-desc">{{ badge.description || 'Badge obtenu' }}</div>
              </div>
              <div class="badge-xp" v-if="badge.xp">+{{ formatNumber(badge.xp) }} XP</div>
            </div>
          </div>
          <div v-else class="empty-state">
            <i class="pi pi-info-circle"></i>
            <p>Aucun badge pour l’instant.</p>
          </div>
        </div>

        <!-- Achievements / Hauts faits -->
        <div class="card-section">
          <div class="card-header">
            <h3><i class="pi pi-trophy"></i> Mes Hauts Faits</h3>
            <span class="count-chip">{{ achievementsLimited.length }}</span>
          </div>
          <div class="table-container" v-if="achievementsLimited.length">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Haut fait</th>
                  <th>Statut</th>
                  <th>XP</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(a, i) in achievementsLimited" :key="a.id || i">
                  <td>{{ a.title || a.name }}</td>
                  <td>
                    <span class="status-pill" :class="a.completed ? 'completed' : 'inprogress'">
                      {{ a.completed ? 'Complété' : 'En cours' }}
                    </span>
                  </td>
                  <td>{{ a.xp ? formatNumber(a.xp) : '-' }}</td>
                  <td>{{ a.date ? new Date(a.date).toLocaleDateString() : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-else class="empty-state">
            <i class="pi pi-info-circle"></i>
            <p>Aucun haut fait enregistré.</p>
          </div>
        </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth } from 'firebase/auth'
import { getUserGamificationStats } from '@/service/hesHousesService'
import { getActiveDefis, subscribeActiveDefis } from '@/service/defisService'
import Navbar from '@/components/common/utils/Navbar.vue'
// Background images per house (align with HouseStatsPage)
import FondHarmonis from '@/assets/maisons/FondHarmonis.png'
import FondElaris from '@/assets/maisons/FondElaris.png'
import FondDoloris from '@/assets/maisons/FondDoloris.png'
import FondSolencia from '@/assets/maisons/FondSolencia.png'

// Router and auth
const router = useRouter()
const auth = getAuth()

// Reactive state
const loading = ref(true)
const error = ref(null)
const userStats = ref(null)
let unsubscribeDefis = null

// House configuration
const houseConfig = {
  'Harmonis': { name: 'Harmonis', color: '#10B981' },
  'Elaris': { name: 'Elaris', color: '#3B82F6' },
  'Doloris': { name: 'Doloris', color: '#EF4444' },
  'Solencia': { name: 'Solencia', color: '#F59E0B' }
}

// Computed properties
const normalizeHouse = (val) => {
  if (!val) return null
  const s = String(val).trim().toLowerCase()
  if (s.startsWith('harm')) return 'Harmonis'
  if (s.startsWith('ela')) return 'Elaris'
  if (s.startsWith('dol')) return 'Doloris'
  if (s.startsWith('sol')) return 'Solencia'
  return null
}

const houseColor = computed(() => {
  const h = normalizeHouse(userStats.value?.maison)
  if (!h) return '#6B7280'
  return houseConfig[h]?.color || '#6B7280'
})

// Map background image by normalized house
const houseImages = {
  harmonis: FondHarmonis,
  elaris: FondElaris,
  doloris: FondDoloris,
  solencia: FondSolencia
}

const houseBackgroundImage = computed(() => {
  const h = normalizeHouse(userStats.value?.maison)
  const key = (h || 'Harmonis').toLowerCase()
  return houseImages[key] || FondHarmonis
})

const xpProgress = computed(() => {
  if (!userStats.value) return 0
  const currentXP = userStats.value.xp || 0
  const nextLevelXP = getNextLevelXP(userStats.value.niveau || 1)
  const currentLevelXP = getCurrentLevelXP(userStats.value.niveau || 1)
  return Math.min(100, ((currentXP - currentLevelXP) / (nextLevelXP - currentLevelXP)) * 100)
})

// Collections (safe fallbacks)
const badges = computed(() => userStats.value?.badges || [])
const achievements = computed(() => userStats.value?.achievements || [])
const upcoming = computed(() => userStats.value?.upcomingChallenges || userStats.value?.upcoming || [])

// Limited views (10 max)
const badgesLimited = computed(() => {
  const arr = [...badges.value]
  arr.sort((a, b) => new Date(b.date || b.earnedAt || b.createdAt || 0) - new Date(a.date || a.earnedAt || a.createdAt || 0))
  return arr.slice(0, 10)
})

const achievementsLimited = computed(() => {
  const arr = [...achievements.value]
  arr.sort((a, b) => new Date(b.date || b.completedAt || b.createdAt || 0) - new Date(a.date || a.completedAt || a.createdAt || 0))
  return arr.slice(0, 10)
})

const upcomingLimited = computed(() => {
  const arr = [...upcoming.value]
  arr.sort((a, b) => new Date(a.deadline || Infinity) - new Date(b.deadline || Infinity))
  return arr.slice(0, 10)
})

// Helper: status for a challenge
const challengeStatus = (q) => {
  if (q?.completed || q?.status === 'completed') return 'validé'
  const now = new Date()
  const deadline = q?.deadline ? new Date(q.deadline) : null
  if (q?.failed || q?.status === 'failed' || (deadline && deadline < now)) return 'loupé'
  return 'en cours'
}

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
    
    // Fetch upcoming active challenges and also subscribe for real-time updates
    let house = stats?.maison || null
    let activeDefis = []
    try {
      activeDefis = await getActiveDefis(house)
    } catch (e) {
      console.warn('Impossible de charger les défis actifs:', e)
    }
    userStats.value = { ...stats, upcomingChallenges: activeDefis }

    // Setup realtime subscription
    if (unsubscribeDefis) {
      try { unsubscribeDefis() } catch {}
      unsubscribeDefis = null
    }
    try {
      unsubscribeDefis = subscribeActiveDefis(house, (list) => {
        if (userStats.value) {
          userStats.value = { ...userStats.value, upcomingChallenges: list }
        }
      })
    } catch (e) {
      console.warn('Subscription défis actifs échouée:', e)
    }
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

onBeforeUnmount(() => {
  if (unsubscribeDefis) {
    try { unsubscribeDefis() } catch {}
    unsubscribeDefis = null
  }
})
</script>

<style scoped>
.gamification-profile-page {
  min-height: 100vh;
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
  color: white;
  padding: 4rem 1rem;
  border-radius: 0 0 20px 20px;
  position: relative;
  overflow: hidden;
  background-size: cover;
  background-position: center;
  min-height: 280px;
  display: flex;
  align-items: center;
}

.profile-banner::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 100%);
  /* subtle tint from house color */
  box-shadow: inset 0 0 0 100vmax color-mix(in srgb, var(--house-color, #6B7280) 12%, transparent);
}

.profile-info {
  position: relative;
  z-index: 1;
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
  border: 4px solid rgba(255, 255, 255, 0.35);
  box-shadow: 0 12px 40px rgba(0,0,0,0.35);
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
  text-shadow: 2px 2px 4px rgba(0,0,0,0.35);
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
  background: rgba(255, 255, 255, 0.15);
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: bold;
  border: 2px solid rgba(255,255,255,0.3);
  backdrop-filter: blur(6px);
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
  text-shadow: 1px 1px 2px rgba(0,0,0,0.25);
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
  background: var(--surface-card);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  margin-bottom: 2rem;
}

.progress-card h3 {
  margin-bottom: 1rem;
  color: white;
}

.xp-progress {
  margin-bottom: 1rem;
}

.xp-bar {
  width: 100%;
  height: 12px;
  background: #e9ecef;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.xp-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.8s ease;
}

.xp-text {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: white;
}

/* Detailed Stats */
.detailed-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.stat-card {
  background: var(--surface-card);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-card i {
  font-size: 2rem;
  color: white;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: bold;
  color: white;
}

.stat-desc {
  color: white;
  opacity: 0.9;
  font-size: 0.875rem;
}

/* Page Header (harmonized with HouseStatsPage) */
.page-header {
  padding: 1.5rem 1rem;
}

.header-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  justify-content: flex-start;
}

.back-btn {
  background: var(--surface-card);
  border: none;
  color: var(--text-color);
  padding: 0.75rem;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-btn:hover {
  background: var(--surface-hover);
  transform: translateX(-2px);
}

.header-title-container {
  flex: 1;
  display: flex;
  justify-content: center;
  margin-right: 3rem;
}

.page-title {
  font-size: 2rem;
  margin: 0;
  font-weight: bold;
  color: var(--text-color);
  text-align: center;
}

/* Card sections */
.card-section {
  background: var(--surface-card);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  margin-top: 2rem;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 2px solid rgba(255,255,255,0.08);
  padding-bottom: 0.75rem;
  margin-bottom: 1rem;
}

.card-header h3 {
  margin: 0;
  color: white;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.count-chip {
  background: rgba(255,255,255,0.12);
  color: white;
  padding: 0.25rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.8rem;
}

/* Badges */
.badge-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
}

.badge-item {
  background: var(--surface-hover);
  border-radius: 10px;
  padding: 0.75rem 1rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: center;
}

.badge-icon {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  border: 2px solid var(--house-color, #6B7280);
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255,255,255,0.06);
}

.badge-title { color: white; font-weight: 600; }
.badge-desc { color: white; opacity: 0.8; font-size: 0.85rem; }
.badge-xp { color: white; font-weight: 600; }

/* Tables */
.table-container {
  width: 100%;
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead th {
  text-align: left;
  font-weight: 600;
  color: white;
  padding: 0.75rem 0.75rem;
  border-bottom: 2px solid rgba(255,255,255,0.08);
}

.data-table tbody td {
  padding: 0.75rem 0.75rem;
  color: white;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}

.data-table tbody tr:hover {
  background: var(--surface-hover);
}

.status-pill {
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  font-size: 0.8rem;
  font-weight: 600;
}
.status-pill.completed { background: #dcfce7; color: #14532d; }
.status-pill.inprogress { background: #dbeafe; color: #1e3a8a; }
.status-pill.missed { background: #fee2e2; color: #7f1d1d; }

.empty-state {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: white;
  opacity: 0.9;
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

  .badge-grid {
    grid-template-columns: 1fr;
  }
}
</style>
