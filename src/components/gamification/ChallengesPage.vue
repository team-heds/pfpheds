<template>
  <div class="page-wrapper">
    <Navbar />
    <div class="challenges-page" :style="{ '--house-color': houseColor }">
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Chargement des défis...</p>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else class="challenges-content">
        
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-content">
            <div class="title-section">
              <h1><i class="pi pi-flag"></i> Défis Hebdomadaires</h1>
              <p>Relevez les défis de cette semaine et gagnez des récompenses exclusives</p>
            </div>
            <Button @click="goBack" class="back-btn">
              <i class="pi pi-arrow-left"></i>
              Retour
            </Button>
          </div>
        </div>

        <!-- Week Info -->
        <div class="week-info">
          <div class="week-card">
            <div class="week-header">
              <h3>Semaine {{ currentWeek }}</h3>
              <div class="week-dates">{{ weekDates }}</div>
            </div>
            <div class="week-progress">
              <div class="progress-stats">
                <span>{{ completedChallenges }}/{{ totalChallenges }} défis complétés</span>
                <span class="completion-rate">{{ completionRate }}%</span>
              </div>
              <div class="week-progress-bar">
                <div class="week-progress-fill" :style="{ width: completionRate + '%' }"></div>
              </div>
            </div>
          </div>
          
          <div class="time-remaining-card">
            <div class="time-icon">⏰</div>
            <div class="time-info">
              <div class="time-label">Temps restant</div>
              <div class="time-value">{{ timeUntilReset }}</div>
            </div>
          </div>
        </div>

        <!-- Statistics Overview -->
        <div class="stats-overview">
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
              <div class="stat-number">{{ challengeStats.totalCompleted }}</div>
              <div class="stat-label">Défis Complétés</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">⭐</div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(challengeStats.totalXPFromChallenges) }}</div>
              <div class="stat-label">XP des Défis</div>
            </div>
          </div>
          
          <div class="stat-card">
            <div class="stat-icon">📈</div>
            <div class="stat-content">
              <div class="stat-number">{{ challengeStats.streakWeeks }}</div>
              <div class="stat-label">Semaines Consécutives</div>
            </div>
          </div>
        </div>

        <!-- Active Challenges -->
        <div class="challenges-section">
          <h2>Défis Actifs</h2>
          <div class="challenges-grid">
            <ChallengeCard
              v-for="challenge in activeChallenges"
              :key="challenge.id"
              :challenge="challenge"
              :house-color="houseColor"
              @click="showChallengeModal(challenge)"
              class="active-challenge"
            />
          </div>
        </div>

        <!-- Challenge History -->
        <div class="history-section" v-if="challengeHistory.length > 0">
          <div class="section-header">
            <h2>Historique des Défis</h2>
            <Button @click="showAllHistory = !showAllHistory" class="toggle-history-btn">
              {{ showAllHistory ? 'Voir moins' : 'Voir plus' }}
            </Button>
          </div>
          
          <div class="history-grid">
            <div 
              v-for="historyItem in displayedHistory" 
              :key="historyItem.challengeId + historyItem.completedAt"
              class="history-item"
            >
              <div class="history-icon">✅</div>
              <div class="history-content">
                <div class="history-name">{{ historyItem.challengeName }}</div>
                <div class="history-date">{{ formatHistoryDate(historyItem.completedAt) }}</div>
                <div class="history-reward">+{{ historyItem.reward.xp }} XP</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Challenge Detail Modal -->
      <Dialog 
        v-model:visible="showModal" 
        :header="selectedChallenge?.name"
        modal
        class="challenge-modal"
      >
        <div v-if="selectedChallenge" class="challenge-details">
          <div class="challenge-header">
            <div class="challenge-icon-large">
              {{ selectedChallenge.icon }}
            </div>
            <div class="challenge-info">
              <h3>{{ selectedChallenge.name }}</h3>
              <p class="challenge-description">{{ selectedChallenge.description }}</p>
              <div class="challenge-meta">
                <span class="difficulty-chip" :class="`difficulty-${selectedChallenge.difficulty.toLowerCase()}`">
                  {{ getDifficultyName(selectedChallenge.difficulty) }}
                </span>
                <span class="category-chip">{{ getCategoryName(selectedChallenge.category) }}</span>
              </div>
            </div>
          </div>
          
          <div class="progress-details">
            <h4>Progression</h4>
            <div class="progress-info">
              <div class="progress-numbers">
                {{ selectedChallenge.progress || 0 }}/{{ selectedChallenge.target }}
              </div>
              <div class="progress-bar-large">
                <div 
                  class="progress-fill-large" 
                  :style="{ width: getProgressPercentage(selectedChallenge) + '%' }"
                ></div>
              </div>
            </div>
          </div>
          
          <div class="reward-details">
            <h4>Récompenses</h4>
            <div class="reward-list">
              <div class="reward-item" v-if="selectedChallenge.reward.xp > 0">
                <i class="pi pi-star-fill"></i>
                <span>{{ selectedChallenge.reward.xp }} XP</span>
              </div>
              <div class="reward-item" v-if="selectedChallenge.reward.badge">
                <i class="pi pi-trophy"></i>
                <span>Badge Spécial</span>
              </div>
              <div class="reward-item" v-if="selectedChallenge.reward.title">
                <i class="pi pi-crown"></i>
                <span>{{ selectedChallenge.reward.title }}</span>
              </div>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth } from 'firebase/auth'
import challengesService from '@/service/challengesService'
import Navbar from '@/components/common/utils/Navbar.vue'
import ChallengeCard from '@/components/gamification/ChallengeCard.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

// Router and auth
const router = useRouter()
const auth = getAuth()

// Reactive state
const loading = ref(true)
const activeChallenges = ref([])
const challengeHistory = ref([])
const challengeStats = ref({})
const showModal = ref(false)
const selectedChallenge = ref(null)
const showAllHistory = ref(false)
const currentWeek = ref(0)

// House configuration (identique aux autres pages)
const houseConfig = {
  'Harmonis': { name: 'Harmonis', color: '#2E8B57' }, // Vert - "L'équilibre soigne"
  'Elaris': { name: 'Elaris', color: '#DC143C' }, // Rouge - "Clarifier, guider, apaiser"
  'Doloris': { name: 'Doloris', color: '#FFD700' }, // Jaune/Or - "Comprendre la douleur, c'est soigner"
  'Solencia': { name: 'Solencia', color: '#4169E1' } // Bleu - "Apaiser pour mieux guérir"
}

// Normalisation des noms de maisons
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
  const h = normalizeHouse(auth.currentUser?.maison)
  if (!h) return '#6B7280'
  return houseConfig[h]?.color || '#6B7280'
})

// Computed properties
const completedChallenges = computed(() => 
  activeChallenges.value.filter(c => c.completed).length
)

const totalChallenges = computed(() => activeChallenges.value.length)

const completionRate = computed(() => {
  if (totalChallenges.value === 0) return 0
  return Math.round((completedChallenges.value / totalChallenges.value) * 100)
})

const weekDates = computed(() => {
  const now = new Date()
  const startOfWeek = new Date(now)
  const day = now.getDay()
  const diff = now.getDate() - day + (day === 0 ? -6 : 1)
  startOfWeek.setDate(diff)
  
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  
  return `${startOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} - ${endOfWeek.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
})

const timeUntilReset = computed(() => {
  const now = new Date()
  const nextMonday = new Date(now)
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7
  nextMonday.setDate(now.getDate() + daysUntilMonday)
  nextMonday.setHours(0, 0, 0, 0)
  
  const diff = nextMonday - now
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  
  if (days > 0) return `${days}j ${hours}h`
  return `${hours}h`
})

const displayedHistory = computed(() => {
  return showAllHistory.value ? challengeHistory.value : challengeHistory.value.slice(0, 6)
})

// Methods
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

const getDifficultyName = (difficulty) => {
  const names = {
    EASY: 'Facile',
    MEDIUM: 'Moyen', 
    HARD: 'Difficile',
    LEGENDARY: 'Légendaire'
  }
  return names[difficulty] || difficulty
}

const getCategoryName = (category) => {
  const names = {
    progression: 'Progression',
    engagement: 'Engagement',
    apprentissage: 'Apprentissage',
    collection: 'Collection',
    social: 'Social',
    exploration: 'Exploration'
  }
  return names[category] || category
}

const getProgressPercentage = (challenge) => {
  if (!challenge.target) return 0
  return Math.min(Math.round(((challenge.progress || 0) / challenge.target) * 100), 100)
}

const showChallengeModal = (challenge) => {
  selectedChallenge.value = challenge
  showModal.value = true
}

const formatHistoryDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'short',
    year: 'numeric'
  })
}

const goBack = () => {
  router.go(-1)
}

const loadData = async () => {
  try {
    loading.value = true
    
    if (!auth.currentUser?.uid) {
      throw new Error('Utilisateur non connecté')
    }
    
    const userId = auth.currentUser.uid
    
    // Load active challenges
    activeChallenges.value = await challengesService.getUserActiveChallenges(userId)
    
    // Load challenge history
    challengeHistory.value = await challengesService.getUserChallengeHistory(userId, 20)
    
    // Load challenge stats
    challengeStats.value = await challengesService.getUserChallengeStats(userId)
    
    // Set current week
    currentWeek.value = getCurrentWeekNumber()
    
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
  } finally {
    loading.value = false
  }
}

const getCurrentWeekNumber = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const diff = now - start
  const oneWeek = 1000 * 60 * 60 * 24 * 7
  return Math.floor(diff / oneWeek)
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
}

.challenges-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  padding-bottom: 4rem;
}

/* Loading State */
.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.loading-spinner {
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.loading-spinner i {
  font-size: 2rem;
  color: var(--house-color);
  margin-bottom: 1rem;
}

/* Page Header */
.page-header {
  background: white;
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
  padding: 2rem 0;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title-section h1 {
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-section p {
  color: #6b7280;
  margin: 0;
}

.back-btn {
  background: var(--house-color);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Week Info */
.week-info {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.week-card, .time-remaining-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.week-header h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.week-dates {
  color: #6b7280;
  font-size: 0.875rem;
}

.week-progress {
  margin-top: 1rem;
}

.progress-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.completion-rate {
  font-weight: 600;
  color: var(--house-color);
}

.week-progress-bar {
  height: 8px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.week-progress-fill {
  height: 100%;
  background: var(--house-color);
  transition: width 0.6s ease;
}

.time-remaining-card {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.time-icon {
  font-size: 2rem;
}

.time-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.time-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

/* Statistics Overview */
.stats-overview {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  font-size: 2rem;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Challenges Section */
.challenges-section {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.challenges-section h2 {
  margin-bottom: 1.5rem;
  color: #1f2937;
}

.challenges-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* History Section */
.history-section {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h2 {
  margin: 0;
  color: #1f2937;
}

.toggle-history-btn {
  background: transparent;
  color: var(--house-color);
  border: 1px solid var(--house-color);
  padding: 0.5rem 1rem;
  border-radius: 6px;
}

.history-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.history-item {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.history-icon {
  font-size: 1.5rem;
}

.history-content {
  flex: 1;
}

.history-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.history-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.history-reward {
  font-size: 0.875rem;
  color: #22C55E;
  font-weight: 500;
}

/* Modal Styles */
.challenge-modal {
  max-width: 500px;
}

.challenge-details {
  padding: 1rem 0;
}

.challenge-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.challenge-icon-large {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.challenge-info h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.challenge-description {
  color: #6b7280;
  margin-bottom: 1rem;
}

.challenge-meta {
  display: flex;
  gap: 0.5rem;
}

.difficulty-chip, .category-chip {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.difficulty-easy { background: rgba(34, 197, 94, 0.2); color: #22C55E; }
.difficulty-medium { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }
.difficulty-hard { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
.difficulty-legendary { background: rgba(139, 92, 246, 0.2); color: #8B5CF6; }

.category-chip {
  background: rgba(107, 114, 128, 0.2);
  color: #6B7280;
}

.progress-details, .reward-details {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 1rem;
  margin-top: 1rem;
}

.progress-details h4, .reward-details h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-numbers {
  font-weight: 600;
  color: #1f2937;
}

.progress-bar-large {
  height: 12px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  overflow: hidden;
}

.progress-fill-large {
  height: 100%;
  background: var(--house-color);
  transition: width 0.6s ease;
}

.reward-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.reward-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #1f2937;
}

.reward-item i {
  color: #F59E0B;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .week-info {
    grid-template-columns: 1fr;
  }
  
  .challenges-grid {
    grid-template-columns: 1fr;
  }
  
  .history-grid {
    grid-template-columns: 1fr;
  }
}
</style>
