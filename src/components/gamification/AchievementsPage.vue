<template>
  <div class="page-wrapper">
    <Navbar />
    <div class="achievements-page" :style="{ '--house-color': houseColor, '--house-foreground': houseTextColor }">
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Chargement des badges...</p>
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
      <div v-else class="achievements-content">
        
        <!-- Page Header -->
        <GamificationPageHeader
          title="Mes badges"
          description="Visualisez les badges obtenus, les prochains objectifs et votre progression globale."
          eyebrow="Collection et progression"
          icon="pi pi-verified"
          @back="goBack"
        />

        <!-- Statistics Overview -->
        <div class="stats-overview">
          <GamificationStatCard icon="pi pi-verified" :value="`${userBadges.length}/${totalBadges}`" label="Badges débloqués" :progress="completionPercentage" />
          <GamificationStatCard icon="pi pi-star-fill" :value="formatNumber(totalXPFromBadges)" label="XP gagnés avec les badges" />
          <GamificationStatCard icon="pi pi-star" :value="rareBadgesCount" label="Badges rares ou supérieurs" />
        </div>

        <!-- Filters and Search -->
        <div class="filters-section">
          <div class="search-bar">
            <i class="pi pi-search"></i>
            <label class="sr-only" for="badge-search">Rechercher un badge</label>
            <input 
              id="badge-search"
              v-model="searchQuery" 
              type="text" 
              placeholder="Rechercher un badge..."
              class="search-input"
            />
          </div>
          
          <div class="filter-buttons" role="group" aria-label="Filtrer les badges">
            <Button 
              v-for="filter in filters" 
              :key="filter.key"
              @click="activeFilter = filter.key"
              :class="['filter-btn', { active: activeFilter === filter.key }]"
              :aria-pressed="activeFilter === filter.key"
            >
              {{ filter.label }}
            </Button>
          </div>
          
          <div class="sort-dropdown">
            <label class="sr-only" for="badge-sort">Trier les badges</label>
            <Dropdown 
              inputId="badge-sort"
              v-model="sortBy" 
              :options="sortOptions" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Trier par..."
            />
          </div>
        </div>

        <!-- Badges Grid -->
        <h2 class="sr-only">Badges disponibles</h2>
        <div class="badges-grid">
          <BadgeCard
            v-for="badge in filteredAndSortedBadges"
            :key="badge.id"
            :badge="badge"
            :is-unlocked="isUnlocked(badge.id)"
            :progress-hint="getProgressHint(badge)"
            :show-progress="true"
            :progress-value="badge.currentValue"
            :progress-max="badge.targetValue"
            @click="showBadgeModal(badge)"
            class="achievement-badge"
          />
        </div>

        <!-- Empty State -->
        <div v-if="filteredAndSortedBadges.length === 0" class="empty-state">
          <div class="empty-icon" aria-hidden="true"><i class="pi pi-search"></i></div>
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

    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/authStore'
import badgesService from '@/service/badgesService'
import Navbar from '@/components/common/utils/Navbar.vue'
import BadgeCard from '@/components/gamification/BadgeCard.vue'
import GamificationPageHeader from '@/components/gamification/GamificationPageHeader.vue'
import GamificationStatCard from '@/components/gamification/GamificationStatCard.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import { getReadableTextColor } from '@/utils/colorContrast'

// Router and auth
const router = useRouter()
const authStore = useAuthStore()

// Reactive state
const loading = ref(true)
const loadError = ref('')
const userBadges = ref([])
const allBadges = ref([])
const searchQuery = ref('')
const activeFilter = ref('all')
const sortBy = ref('rarity')
const showModal = ref(false)
const selectedBadge = ref(null)
let loadGeneration = 0
let disposed = false

// House configuration
const houseConfig = {
  'Harmonis': { name: 'Harmonis', color: '#2E8B57' },
  'Elaris': { name: 'Elaris', color: '#DC143C' },
  'Doloris': { name: 'Doloris', color: '#FFD700' },
  'Solencia': { name: 'Solencia', color: '#4169E1' }
}

const normalizeHouse = (value) => {
  const normalized = String(value || '').trim().toLowerCase()
  if (normalized.startsWith('harm')) return 'Harmonis'
  if (normalized.startsWith('ela')) return 'Elaris'
  if (normalized.startsWith('dol')) return 'Doloris'
  if (normalized.startsWith('sol')) return 'Solencia'
  return null
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
  const house = normalizeHouse(authStore.user?.maison || authStore.user?.user_metadata?.maison || authStore.user?.user_metadata?.house)
  return houseConfig[house]?.color || '#2E8B57'
})
const houseTextColor = computed(() => getReadableTextColor(houseColor.value))

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
  return badge.progressHint || null
}

const showBadgeModal = (badge) => {
  selectedBadge.value = badge
  showModal.value = true
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
    loadError.value = 'Connectez-vous pour retrouver vos badges.'
    return
  }
  try {
    const badges = await badgesService.getMyBadgeProgress()
    if (!isCurrent()) return
    const unlocked = badges.filter((badge) => badge.isUnlocked)
    allBadges.value = badges
    userBadges.value = unlocked
    
  } catch (error) {
    if (!isCurrent()) return
    console.error('Erreur lors du chargement des données:', error)
    loadError.value = 'Les badges ne peuvent pas être chargés pour le moment.'
  } finally {
    if (isCurrent()) loading.value = false
  }
}

// Lifecycle
watch(() => authStore.user?.id || null, () => {
  allBadges.value = []
  userBadges.value = []
  showModal.value = false
  selectedBadge.value = null
  searchQuery.value = ''
  activeFilter.value = 'all'
  sortBy.value = 'rarity'
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

.achievements-page {
  min-height: 100vh;
  background: var(--surface-ground);
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
  background: var(--surface-card);
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
  color: var(--text-color);
  margin-bottom: 0.25rem;
}

.stat-label {
  color: var(--text-color-secondary);
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
}

/* Filters Section */
.filters-section {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
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
  color: var(--text-color-secondary);
}

.search-input {
  width: 100%;
  min-height: 44px;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid var(--surface-border);
  border-radius: 10px;
  font-size: 0.875rem;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  min-height: 44px;
  padding: 0.5rem 1rem;
  border: 1px solid var(--surface-border);
  background: var(--surface-section);
  color: var(--text-color);
  border-radius: 10px;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s ease;
}

.filter-btn.active {
  background: var(--house-color);
  color: var(--house-foreground);
  border-color: var(--house-color);
}

@media (prefers-reduced-motion: reduce) {
  .progress-fill,
  .filter-btn,
  .achievement-badge {
    animation: none !important;
    transition: none !important;
  }
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
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  margin: 0 auto 1rem;
  place-items: center;
  color: var(--house-foreground);
  background: var(--house-color);
  border-radius: 1rem;
}

.empty-state h3 {
  color: var(--text-color);
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: var(--text-color-secondary);
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
  color: var(--text-color);
}

.badge-description {
  color: var(--text-color-secondary);
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
  color: var(--text-color);
}

.progress-details {
  color: var(--text-color-secondary);
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
