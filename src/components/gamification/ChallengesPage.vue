<template>
  <div class="page-wrapper">
    <Navbar />
    <div class="challenges-page" :style="{ '--house-color': houseColor, '--house-foreground': houseTextColor }">
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Chargement des défis...</p>
        </div>
      </div>

      <div v-else-if="loadError" class="loading-container" role="alert">
        <div class="loading-spinner">
          <i class="pi pi-exclamation-triangle"></i>
          <p>{{ loadError }}</p>
          <Button label="Réessayer" icon="pi pi-refresh" @click="loadData" />
        </div>
      </div>

      <!-- Main Content -->
      <div v-else class="challenges-content">
        
        <!-- Page Header -->
        <GamificationPageHeader
          title="Défis du moment"
          description="Avancez à votre rythme et gagnez de l’XP pour vous et votre maison."
          eyebrow="Progression des défis"
          icon="pi pi-bolt"
          @back="goBack"
        />

        <!-- Week Info -->
        <div class="week-info">
          <div class="week-card">
            <div class="week-header">
              <h2>Défis en cours</h2>
              <div class="week-dates">{{ periodLabel }}</div>
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
            <div class="time-icon" aria-hidden="true"><i class="pi pi-clock"></i></div>
            <div class="time-info">
              <div class="time-label">Temps restant</div>
              <div class="time-value">{{ timeUntilReset }}</div>
            </div>
          </div>
        </div>

        <!-- Statistics Overview -->
        <div class="stats-overview">
          <GamificationStatCard icon="pi pi-check-circle" :value="challengeStats.totalCompleted" label="Défis complétés" />
          <GamificationStatCard icon="pi pi-star-fill" :value="formatNumber(challengeStats.totalXPFromChallenges)" label="XP gagnés avec les défis" />
          <GamificationStatCard icon="pi pi-flag" :value="totalChallenges" label="Défis disponibles" />
        </div>

        <!-- Active Challenges -->
        <div class="challenges-section">
          <h2>Défis actifs</h2>
          <p v-if="activeChallenges.length === 0" class="challenges-empty">
            Aucun défi en cours pour le moment. Les prochains défis apparaîtront ici.
          </p>
          <div v-else class="challenges-grid">
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
              <div class="history-icon" aria-hidden="true"><i class="pi pi-check"></i></div>
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
                <span>{{ selectedChallenge.reward.badgeName || 'Badge associé' }}</span>
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
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import challengesService from '@/service/challengesService'
import Navbar from '@/components/common/utils/Navbar.vue'
import ChallengeCard from '@/components/gamification/ChallengeCard.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import GamificationStatCard from '@/components/gamification/GamificationStatCard.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import { getReadableTextColor } from '@/utils/colorContrast'
import { challengePeriod, formatChallengePeriod, formatTimeLeft } from '@/utils/challengePeriod'

// Router and auth
const router = useRouter()
const authStore = useAuthStore()

// Reactive state
const loading = ref(true)
const loadError = ref('')
const activeChallenges = ref([])
const challengeHistory = ref([])
const challengeStats = ref({ totalCompleted: 0, totalXPFromChallenges: 0, streakWeeks: 0 })
const showModal = ref(false)
const selectedChallenge = ref(null)
const showAllHistory = ref(false)
let loadGeneration = 0
let disposed = false

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
  const h = normalizeHouse(authStore.user?.user_metadata?.maison || authStore.user?.maison)
  if (!h) return '#6B7280'
  return houseConfig[h]?.color || '#6B7280'
})
const houseTextColor = computed(() => getReadableTextColor(houseColor.value))

// Computed properties
const completedChallenges = computed(() => 
  activeChallenges.value.filter(c => c.completed).length
)

const totalChallenges = computed(() => activeChallenges.value.length)

const completionRate = computed(() => {
  if (totalChallenges.value === 0) return 0
  return Math.round((completedChallenges.value / totalChallenges.value) * 100)
})

const period = computed(() => challengePeriod(activeChallenges.value))
const periodLabel = computed(() => formatChallengePeriod(period.value))
const timeUntilReset = computed(() => formatTimeLeft(period.value))

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
  if (disposed) return
  const userId = authStore.user?.id || null
  const generation = ++loadGeneration
  const isCurrent = () => !disposed && generation === loadGeneration && authStore.user?.id === userId
  loading.value = Boolean(userId)
  loadError.value = ''
  if (!userId) {
    loadError.value = 'Connectez-vous pour retrouver vos défis.'
    return
  }
  try {
    const [active, history, stats] = await Promise.all([
      challengesService.getUserActiveChallenges(userId),
      challengesService.getUserChallengeHistory(userId, 20),
      challengesService.getUserChallengeStats(userId),
    ])
    if (!isCurrent()) return
    activeChallenges.value = active
    challengeHistory.value = history
    challengeStats.value = stats
    
  } catch (error) {
    if (!isCurrent()) return
    console.error('Erreur lors du chargement des données:', error)
    loadError.value = 'Les défis ne peuvent pas être chargés pour le moment.'
  } finally {
    if (isCurrent()) loading.value = false
  }
}

// Lifecycle
watch(() => authStore.user?.id || null, () => {
  activeChallenges.value = []
  challengeHistory.value = []
  challengeStats.value = { totalCompleted: 0, totalXPFromChallenges: 0, streakWeeks: 0 }
  showModal.value = false
  selectedChallenge.value = null
  showAllHistory.value = false
  void loadData()
}, { immediate: true, flush: 'sync' })

onBeforeUnmount(() => {
  disposed = true
  loadGeneration += 1
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
  background: transparent;
  padding-top: 2rem;
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
  background: var(--surface-card);
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
  background: var(--surface-card);
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
  color: var(--text-color);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.title-section p {
  color: var(--text-color-secondary);
  margin: 0;
}

.back-btn {
  background: var(--house-color);
  color: var(--house-foreground);
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

@media (prefers-reduced-motion: reduce) {
  .week-progress-fill,
  .progress-fill-large {
    transition: none;
  }
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
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
}

.week-header h2 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.week-dates {
  color: var(--text-color-secondary);
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
}

.time-remaining-card {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.time-icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  color: #071426;
  background: #f3c300;
  border-radius: 0.8rem;
}

.time-label {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.time-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color);
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
  background: var(--surface-card);
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
  color: var(--text-color);
}

.stat-label {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

/* Challenges Section */
.challenges-empty {
  color: var(--text-color-secondary);
  margin: 0;
}

.challenges-section {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
}

.challenges-section h2 {
  margin-bottom: 1.5rem;
  color: var(--text-color);
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
  color: var(--text-color);
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
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.history-icon {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  color: var(--house-foreground);
  background: var(--house-color);
  border-radius: 0.7rem;
}

.history-content {
  flex: 1;
}

.history-name {
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.history-date {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
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
  color: var(--text-color);
}

.challenge-description {
  color: var(--text-color-secondary);
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

.difficulty-chip.difficulty-easy { background: rgba(34, 197, 94, 0.2); color: #22C55E; }
.difficulty-chip.difficulty-medium { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }
.difficulty-chip.difficulty-hard { background: rgba(239, 68, 68, 0.2); color: #EF4444; }
.difficulty-chip.difficulty-legendary { background: rgba(139, 92, 246, 0.2); color: #8B5CF6; }

.category-chip {
  background: var(--surface-section);
  color: var(--text-color-secondary);
}

.progress-details, .reward-details {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 1rem;
  margin-top: 1rem;
}

.progress-details h4, .reward-details h4 {
  margin: 0 0 1rem 0;
  color: var(--text-color);
}

.progress-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.progress-numbers {
  font-weight: 600;
  color: var(--text-color);
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
  color: var(--text-color);
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
