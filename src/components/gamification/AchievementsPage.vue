<template>
  <div class="page-wrapper">
    <Navbar />
    <div class="achievements-page" :style="{ '--house-color': houseColor }">
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Chargement des achievements...</p>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else class="achievements-content">
        
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-content">
            <div class="title-section">
              <h1><i class="pi pi-trophy"></i> Mes Achievements</h1>
              <p>Découvrez tous les badges disponibles et votre progression</p>
            </div>
            <Button @click="goBack" class="back-btn">
              <i class="pi pi-arrow-left"></i>
              Retour
            </Button>
          </div>
        </div>

        <!-- Statistics Overview -->
        <div class="stats-overview">
          <div class="stat-card completion">
            <div class="stat-icon">🏆</div>
            <div class="stat-content">
              <div class="stat-number">{{ userBadges.length }}/{{ totalBadges }}</div>
              <div class="stat-label">Badges Débloqués</div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: completionPercentage + '%' }"></div>
              </div>
            </div>
          </div>
          
          <div class="stat-card xp">
            <div class="stat-icon">⭐</div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(totalXPFromBadges) }}</div>
              <div class="stat-label">XP des Badges</div>
            </div>
          </div>
          
          <div class="stat-card rarity">
            <div class="stat-icon">💎</div>
            <div class="stat-content">
              <div class="stat-number">{{ rareBadgesCount }}</div>
              <div class="stat-label">Badges Rares+</div>
            </div>
          </div>
        </div>

        <!-- Filters and Search -->
        <div class="filters-section">
          <div class="search-bar">
            <i class="pi pi-search"></i>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Rechercher un badge..."
              class="search-input"
            />
          </div>
          
          <div class="filter-buttons">
            <Button 
              v-for="filter in filters" 
              :key="filter.key"
              @click="activeFilter = filter.key"
              :class="['filter-btn', { active: activeFilter === filter.key }]"
            >
              {{ filter.label }}
            </Button>
          </div>
          
          <div class="sort-dropdown">
            <Dropdown 
              v-model="sortBy" 
              :options="sortOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Trier par..."
            />
          </div>
        </div>

        <!-- Badges Grid -->
        <div class="badges-grid">
          <BadgeCard
            v-for="badge in filteredAndSortedBadges"
            :key="badge.id"
            :badge="badge"
            :is-unlocked="isUnlocked(badge.id)"
            :progress-hint="getProgressHint(badge)"
            :show-progress="true"
            @click="showBadgeModal(badge)"
            class="achievement-badge"
          />
        </div>

        <!-- Empty State -->
        <div v-if="filteredAndSortedBadges.length === 0" class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Aucun badge trouvé</h3>
          <p>Essayez de modifier vos filtres ou votre recherche</p>
        </div>
      </div>

      <!-- Badge Detail Modal -->
      <Dialog 
        v-model:visible="showModal" 
        :header="selectedBadge?.name"
        modal
        class="badge-modal"
      >
        <div v-if="selectedBadge" class="badge-details">
          <div class="badge-header">
            <div class="badge-icon-large" :style="{ color: selectedBadge.color }">
              {{ selectedBadge.icon }}
            </div>
            <div class="badge-info">
              <h3>{{ selectedBadge.name }}</h3>
              <p class="badge-description">{{ selectedBadge.description }}</p>
              <div class="badge-meta">
                <span class="rarity-chip" :class="`rarity-${selectedBadge.rarity}`">
                  {{ getRarityName(selectedBadge.rarity) }}
                </span>
                <span class="xp-chip">+{{ selectedBadge.xpBonus }} XP</span>
              </div>
            </div>
          </div>
          
          <div v-if="getProgressHint(selectedBadge)" class="progress-section">
            <h4>Progression</h4>
            <div class="progress-details">
              {{ getProgressHint(selectedBadge) }}
            </div>
          </div>
        </div>
      </Dialog>

      <!-- Achievement Notification -->
      <AchievementNotification
        v-if="showNotification && currentNotification"
        :badge="currentNotification"
        @close="onNotificationClose"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAuth } from 'firebase/auth'
import badgesService from '@/service/badgesService'
import Navbar from '@/components/common/utils/Navbar.vue'
import BadgeCard from '@/components/gamification/BadgeCard.vue'
import AchievementNotification from '@/components/gamification/AchievementNotification.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'

// Router and auth
const router = useRouter()
const auth = getAuth()

// Reactive state
const loading = ref(true)
const userBadges = ref([])
const allBadges = ref([])
const searchQuery = ref('')
const activeFilter = ref('all')
const sortBy = ref('rarity')
const showModal = ref(false)
const selectedBadge = ref(null)
const showNotification = ref(false)
const currentNotification = ref(null)

// House configuration
const houseConfig = {
  'Harmonis': { name: 'Harmonis', color: '#2E8B57' },
  'Elaris': { name: 'Elaris', color: '#DC143C' },
  'Doloris': { name: 'Doloris', color: '#FFD700' },
  'Solencia': { name: 'Solencia', color: '#4169E1' }
}

// Filters and sort options
const filters = [
  { key: 'all', label: 'Tous' },
  { key: 'unlocked', label: 'Débloqués' },
  { key: 'locked', label: 'Verrouillés' },
  { key: 'common', label: 'Communs' },
  { key: 'rare', label: 'Rares' },
  { key: 'epic', label: 'Épiques' },
  { key: 'legendary', label: 'Légendaires' }
]

const sortOptions = [
  { label: 'Par rareté', value: 'rarity' },
  { label: 'Par nom', value: 'name' },
  { label: 'Par XP', value: 'xp' },
  { label: 'Par catégorie', value: 'category' }
]

// Computed properties
const houseColor = computed(() => {
  // TODO: Get user house from auth/store
  return '#2E8B57' // Default Harmonis color
})

const totalBadges = computed(() => allBadges.value.length)

const completionPercentage = computed(() => {
  if (totalBadges.value === 0) return 0
  return Math.round((userBadges.value.length / totalBadges.value) * 100)
})

const totalXPFromBadges = computed(() => {
  return userBadges.value.reduce((total, badge) => total + (badge.xpBonus || 0), 0)
})

const rareBadgesCount = computed(() => {
  return userBadges.value.filter(badge => 
    ['rare', 'epic', 'legendary'].includes(badge.rarity)
  ).length
})

const filteredAndSortedBadges = computed(() => {
  let filtered = allBadges.value

  // Apply search filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(badge => 
      badge.name.toLowerCase().includes(query) ||
      badge.description.toLowerCase().includes(query)
    )
  }

  // Apply category filter
  if (activeFilter.value !== 'all') {
    if (activeFilter.value === 'unlocked') {
      filtered = filtered.filter(badge => isUnlocked(badge.id))
    } else if (activeFilter.value === 'locked') {
      filtered = filtered.filter(badge => !isUnlocked(badge.id))
    } else {
      filtered = filtered.filter(badge => badge.rarity === activeFilter.value)
    }
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'xp':
        return (b.xpBonus || 0) - (a.xpBonus || 0)
      case 'category':
        return a.category.localeCompare(b.category)
      case 'rarity':
      default:
        const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 }
        return (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0)
    }
  })

  return filtered
})

// Methods
const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'k'
  return num.toString()
}

const getRarityName = (rarity) => {
  const names = {
    common: 'Commun',
    rare: 'Rare',
    epic: 'Épique',
    legendary: 'Légendaire'
  }
  return names[rarity] || rarity
}

const isUnlocked = (badgeId) => {
  return userBadges.value.some(badge => badge.id === badgeId)
}

const getProgressHint = (badge) => {
  // TODO: Implement progress calculation based on badge conditions
  if (isUnlocked(badge.id)) return null
  return "Progression à implémenter"
}

const showBadgeModal = (badge) => {
  selectedBadge.value = badge
  showModal.value = true
}

const onNotificationClose = () => {
  showNotification.value = false
  currentNotification.value = null
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
    
    // Load all badges
    allBadges.value = Object.values(badgesService.BADGES_CONFIG)
    
    // Load user badges
    userBadges.value = await badgesService.getUserBadges(auth.currentUser.uid)
    
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
  } finally {
    loading.value = false
  }
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

.achievements-page {
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

/* Statistics Overview */
.stats-overview {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
  font-size: 2.5rem;
  width: 60px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.05);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--house-color);
  transition: width 0.3s ease;
}

/* Filters Section */
.filters-section {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-bar {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-bar i {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.875rem;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 1px solid #d1d5db;
  background: white;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.filter-btn.active {
  background: var(--house-color);
  color: white;
  border-color: var(--house-color);
}

/* Badges Grid */
.badges-grid {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.achievement-badge {
  transition: transform 0.2s ease;
}

.achievement-badge:hover {
  transform: translateY(-2px);
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  color: #374151;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #6b7280;
}

/* Badge Modal */
.badge-modal {
  max-width: 500px;
}

.badge-details {
  padding: 1rem 0;
}

.badge-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.badge-icon-large {
  font-size: 3rem;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.05);
}

.badge-info h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.badge-description {
  color: #6b7280;
  margin-bottom: 1rem;
}

.badge-meta {
  display: flex;
  gap: 0.5rem;
}

.rarity-chip, .xp-chip {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.rarity-chip.rarity-common { background: rgba(156, 163, 175, 0.2); color: #6B7280; }
.rarity-chip.rarity-rare { background: rgba(59, 130, 246, 0.2); color: #3B82F6; }
.rarity-chip.rarity-epic { background: rgba(147, 51, 234, 0.2); color: #9333EA; }
.rarity-chip.rarity-legendary { background: rgba(245, 158, 11, 0.2); color: #F59E0B; }

.xp-chip {
  background: rgba(34, 197, 94, 0.2);
  color: #22C55E;
}

.progress-section {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 1rem;
}

.progress-section h4 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.progress-details {
  color: #6b7280;
  font-size: 0.875rem;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .filter-buttons {
    justify-content: center;
  }
  
  .badges-grid {
    grid-template-columns: 1fr;
  }
}
</style>
