<template>
  <div class="page-wrapper">
    <Navbar />
    <div class="quests-page" :style="{ '--house-color': houseColor }">
      
      <!-- Loading State -->
      <div v-if="loading" class="loading-container">
        <div class="loading-spinner">
          <i class="pi pi-spin pi-spinner"></i>
          <p>Chargement des quêtes...</p>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else class="quests-content">
        
        <!-- Page Header -->
        <div class="page-header">
          <div class="header-content">
            <div class="title-section">
              <h1><i class="pi pi-flag"></i> Quêtes & Aventures</h1>
              <p>Embarquez dans des aventures épiques et progressez à travers des quêtes narratives</p>
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
              <div class="stat-number">{{ questStats.completedQuests }}/{{ questStats.totalQuests }}</div>
              <div class="stat-label">Quêtes Complétées</div>
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: completionRate + '%' }"></div>
              </div>
            </div>
          </div>
          
          <div class="stat-card xp">
            <div class="stat-icon">⭐</div>
            <div class="stat-content">
              <div class="stat-number">{{ formatNumber(questStats.totalXPFromQuests) }}</div>
              <div class="stat-label">XP des Quêtes</div>
            </div>
          </div>
          
          <div class="stat-card progress">
            <div class="stat-icon">📊</div>
            <div class="stat-content">
              <div class="stat-number">{{ questStats.averageProgress }}%</div>
              <div class="stat-label">Progression Moyenne</div>
            </div>
          </div>
        </div>
    </div>

    <!-- Filtres et recherche -->
    <div class="filters-section">
      <div class="filters-row">
        <!-- Recherche -->
        <div class="search-container">
          <i class="pi pi-search search-icon"></i>
          <InputText 
            v-model="searchQuery" 
            placeholder="Rechercher une quête..."
            class="search-input"
          />
        </div>
        
        <!-- Filtres -->
        <div class="filters-container">
          <Dropdown 
            v-model="selectedStatus" 
            :options="statusOptions" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Statut"
            class="filter-dropdown"
          />
          
          <Dropdown 
            v-model="selectedDifficulty" 
            :options="difficultyOptions" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Difficulté"
            class="filter-dropdown"
          />
          
          <Dropdown 
            v-model="selectedType" 
            :options="typeOptions" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Type"
            class="filter-dropdown"
          />
        </div>
        
        <!-- Tri -->
        <div class="sort-container">
          <Dropdown 
            v-model="sortBy" 
            :options="sortOptions" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Trier par"
            class="sort-dropdown"
          />
        </div>
      </div>
    </div>

    <!-- Statistiques détaillées -->
    <div class="detailed-stats" v-if="questStats.totalQuests > 0">
      <div class="stats-grid">
        <div class="stat-item">
          <i class="pi pi-trophy"></i>
          <div class="stat-content">
            <span class="stat-number">{{ formatNumber(questStats.totalXPFromQuests) }}</span>
            <span class="stat-text">XP des quêtes</span>
          </div>
        </div>
        <div class="stat-item">
          <i class="pi pi-percentage"></i>
          <div class="stat-content">
            <span class="stat-number">{{ questStats.averageProgress }}%</span>
            <span class="stat-text">Progression moyenne</span>
          </div>
        </div>
        <div class="stat-item">
          <i class="pi pi-chart-line"></i>
          <div class="stat-content">
            <span class="stat-number">{{ completionRate }}%</span>
            <span class="stat-text">Taux de complétion</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Contenu principal -->
    <div class="main-content">
      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <ProgressSpinner />
        <p>Chargement des quêtes...</p>
      </div>

      <!-- Quêtes -->
      <div v-else-if="filteredQuests.length > 0" class="quests-container">
        <div class="quests-grid">
          <QuestCard
            v-for="quest in paginatedQuests"
            :key="quest.id"
            :quest="quest"
            :house-color="houseColor"
            @click="showQuestDetails"
            @start-quest="startQuest"
            @view-details="showQuestDetails"
          />
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="pagination-container">
          <Paginator
            :rows="questsPerPage"
            :totalRecords="filteredQuests.length"
            v-model:first="currentPage"
            @page="onPageChange"
          />
        </div>
      </div>

      <!-- État vide -->
      <div v-else class="empty-state">
        <div class="empty-icon">🗺️</div>
        <h3>{{ getEmptyStateTitle() }}</h3>
        <p>{{ getEmptyStateMessage() }}</p>
        <Button 
          v-if="hasFilters"
          @click="clearFilters"
          class="clear-filters-btn"
        >
          <i class="pi pi-filter-slash"></i>
          Effacer les filtres
        </Button>
      </div>
    </div>

    <!-- Modal détails de quête -->
    <Dialog 
      v-model:visible="showModal" 
      :style="{ width: '90vw', maxWidth: '800px' }"
      :modal="true"
      :closable="true"
      :draggable="false"
      class="quest-modal"
    >
      <template #header>
        <div class="modal-header">
          <h2>{{ selectedQuest?.title }}</h2>
          <div class="quest-difficulty-badge" v-if="selectedQuest">
            <span :style="{ color: getDifficultyColor(selectedQuest.difficulty) }">
              {{ getDifficultyName(selectedQuest.difficulty) }}
            </span>
          </div>
        </div>
      </template>
      
      <div v-if="selectedQuest" class="modal-content">
        <QuestCard 
          :quest="selectedQuest" 
          :show-steps="true"
          :house-color="houseColor"
          @start-quest="startQuestFromModal"
        />
      </div>
    </Dialog>

    <!-- Notification de quête démarrée -->
    <Toast ref="toast" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Navbar from '../common/utils/Navbar.vue'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import Paginator from 'primevue/paginator'
import Toast from 'primevue/toast'
import QuestCard from './QuestCard.vue'
import questsService, { QUEST_DIFFICULTIES, QUEST_STATUS } from '../../service/questsService'
import { getAuth } from 'firebase/auth'

// Services
const router = useRouter()
const toast = useToast()
const auth = getAuth()

// État réactif
const loading = ref(true)

// House configuration (identique à GamificationProfilePage)
const houseConfig = {
  'Harmonis': { name: 'Harmonis', color: '#2E8B57' }, // Vert - "L'équilibre soigne"
  'Elaris': { name: 'Elaris', color: '#DC143C' }, // Rouge - "Clarifier, guider, apaiser"
  'Doloris': { name: 'Doloris', color: '#FFD700' }, // Jaune/Or - "Comprendre la douleur, c'est soigner"
  'Solencia': { name: 'Solencia', color: '#4169E1' } // Bleu - "Apaiser pour mieux guérir"
}

// Normalisation des noms de maisons (identique à GamificationProfilePage)
const normalizeHouse = (val) => {
  if (!val) return null
  const s = String(val).trim().toLowerCase()
  if (s.startsWith('harm')) return 'Harmonis'
  if (s.startsWith('ela')) return 'Elaris'
  if (s.startsWith('dol')) return 'Doloris'
  if (s.startsWith('sol')) return 'Solencia'
  return null
}

// Computed properties pour le design
const houseColor = computed(() => {
  const h = normalizeHouse(auth.currentUser?.maison)
  if (!h) return '#6B7280'
  return houseConfig[h]?.color || '#6B7280'
})
const userQuests = ref({})
const questStats = ref({})
const searchQuery = ref('')
const selectedStatus = ref('all')
const selectedDifficulty = ref('all')
const selectedType = ref('all')
const sortBy = ref('progress_desc')
const currentPage = ref(0)
const questsPerPage = 12
const showModal = ref(false)
const selectedQuest = ref(null)

// Options pour les filtres
const statusOptions = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Disponibles', value: 'available' },
  { label: 'En cours', value: 'in_progress' },
  { label: 'Complétées', value: 'completed' },
  { label: 'Expirées', value: 'expired' }
]

const difficultyOptions = [
  { label: 'Toutes difficultés', value: 'all' },
  { label: 'Facile', value: 'EASY' },
  { label: 'Moyen', value: 'MEDIUM' },
  { label: 'Difficile', value: 'HARD' },
  { label: 'Épique', value: 'EPIC' },
  { label: 'Légendaire', value: 'LEGENDARY' }
]

const typeOptions = [
  { label: 'Tous les types', value: 'all' },
  { label: 'Histoire', value: 'story' },
  { label: 'Progression', value: 'progression' },
  { label: 'Exploration', value: 'exploration' },
  { label: 'Social', value: 'social' },
  { label: 'Défi', value: 'challenge' }
]

const sortOptions = [
  { label: 'Progression (desc)', value: 'progress_desc' },
  { label: 'Progression (asc)', value: 'progress_asc' },
  { label: 'Difficulté (asc)', value: 'difficulty_asc' },
  { label: 'Difficulté (desc)', value: 'difficulty_desc' },
  { label: 'Nom (A-Z)', value: 'name_asc' },
  { label: 'Nom (Z-A)', value: 'name_desc' }
]

// Computed properties
const questsArray = computed(() => Object.values(userQuests.value))

const filteredQuests = computed(() => {
  let filtered = questsArray.value

  // Recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(quest => 
      quest.title.toLowerCase().includes(query) ||
      quest.description.toLowerCase().includes(query)
    )
  }

  // Filtres
  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter(quest => quest.status === selectedStatus.value)
  }

  if (selectedDifficulty.value !== 'all') {
    filtered = filtered.filter(quest => quest.difficulty === selectedDifficulty.value)
  }

  if (selectedType.value !== 'all') {
    filtered = filtered.filter(quest => quest.type === selectedType.value)
  }

  // Tri
  filtered.sort((a, b) => {
    switch (sortBy.value) {
      case 'progress_desc':
        return (b.progress || 0) - (a.progress || 0)
      case 'progress_asc':
        return (a.progress || 0) - (b.progress || 0)
      case 'difficulty_asc':
        return getDifficultyOrder(a.difficulty) - getDifficultyOrder(b.difficulty)
      case 'difficulty_desc':
        return getDifficultyOrder(b.difficulty) - getDifficultyOrder(a.difficulty)
      case 'name_asc':
        return a.title.localeCompare(b.title)
      case 'name_desc':
        return b.title.localeCompare(a.title)
      default:
        return 0
    }
  })

  return filtered
})

const paginatedQuests = computed(() => {
  const start = currentPage.value
  const end = start + questsPerPage
  return filteredQuests.value.slice(start, end)
})

const totalPages = computed(() => Math.ceil(filteredQuests.value.length / questsPerPage))

const completionRate = computed(() => {
  if (questStats.value.totalQuests === 0) return 0
  return Math.round((questStats.value.completedQuests / questStats.value.totalQuests) * 100)
})

const hasFilters = computed(() => {
  return searchQuery.value || 
         selectedStatus.value !== 'all' || 
         selectedDifficulty.value !== 'all' || 
         selectedType.value !== 'all'
})

// Méthodes
const loadQuestsData = async () => {
  try {
    loading.value = true
    const userId = auth.currentUser?.uid
    
    if (!userId) {
      router.push('/login')
      return
    }

    // Charger les quêtes utilisateur
    userQuests.value = await questsService.getUserQuests(userId)
    
    // Initialiser si aucune quête
    if (Object.keys(userQuests.value).length === 0) {
      const userHouse = normalizeHouse(auth.currentUser?.maison) || 'Harmonis'
      userQuests.value = await questsService.initializeUserQuests(userId, userHouse)
    }

    // Charger les statistiques
    questStats.value = await questsService.getQuestStats(userId)
    
  } catch (error) {
    console.error('Erreur lors du chargement des quêtes:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les quêtes',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

const startQuest = async (questId) => {
  try {
    const userId = auth.currentUser?.uid
    if (!userId) return

    await questsService.startQuest(userId, questId)
    
    // Recharger les données
    await loadQuestsData()
    
    toast.add({
      severity: 'success',
      summary: 'Quête démarrée!',
      detail: 'Votre aventure commence maintenant',
      life: 3000
    })
  } catch (error) {
    console.error('Erreur lors du démarrage de la quête:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de démarrer la quête',
      life: 3000
    })
  }
}

const startQuestFromModal = async (questId) => {
  showModal.value = false
  await startQuest(questId)
}

const showQuestDetails = (quest) => {
  selectedQuest.value = quest
  showModal.value = true
}

const clearFilters = () => {
  searchQuery.value = ''
  selectedStatus.value = 'all'
  selectedDifficulty.value = 'all'
  selectedType.value = 'all'
  sortBy.value = 'progress_desc'
  currentPage.value = 0
}

const onPageChange = (event) => {
  currentPage.value = event.first
}

const getDifficultyColor = (difficulty) => {
  const diff = QUEST_DIFFICULTIES[difficulty]
  return diff ? diff.color : '#666'
}

const getDifficultyName = (difficulty) => {
  const diff = QUEST_DIFFICULTIES[difficulty]
  return diff ? diff.name : 'Inconnu'
}

const getDifficultyOrder = (difficulty) => {
  const order = { EASY: 1, MEDIUM: 2, HARD: 3, EPIC: 4, LEGENDARY: 5 }
  return order[difficulty] || 0
}

const getEmptyStateTitle = () => {
  if (hasFilters.value) {
    return 'Aucune quête trouvée'
  }
  return 'Aucune quête disponible'
}

const getEmptyStateMessage = () => {
  if (hasFilters.value) {
    return 'Essayez de modifier vos critères de recherche ou filtres.'
  }
  return 'Les quêtes seront bientôt disponibles. Revenez plus tard!'
}

const formatNumber = (num) => {
  return new Intl.NumberFormat('fr-FR').format(num)
}

const goBack = () => {
  router.push('/gamification-profile')
}

// Watchers
watch([searchQuery, selectedStatus, selectedDifficulty, selectedType], () => {
  currentPage.value = 0
})

// Lifecycle
onMounted(() => {
  loadQuestsData()
})
</script>

<style scoped>
.page-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.quests-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  --house-color: #740001;
}

.loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 60vh;
}

.loading-spinner {
  text-align: center;
  color: var(--house-color);
}

.loading-spinner i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

/* Header */
.page-header {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
  border-left: 4px solid var(--house-color);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 2rem;
}

.title-section h1 {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin: 0 0 0.5rem 0;
  color: var(--house-color);
  font-size: 2rem;
  font-weight: 700;
}

.title-section p {
  color: #6b7280;
  font-size: 1.1rem;
  margin: 0;
}

.back-btn {
  background: var(--house-color);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.back-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Statistics Overview */
.stats-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  transition: transform 0.2s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-card.completion {
  border-left: 4px solid #10b981;
}

.stat-card.xp {
  border-left: 4px solid #f59e0b;
}

.stat-card.progress {
  border-left: 4px solid #8b5cf6;
}

.stat-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.stat-label {
  color: #6b7280;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 600;
}

.progress-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  margin-top: 0.5rem;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--house-color);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* Filtres et recherche */
.filters-section {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.filters-row {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-container {
  position: relative;
  flex: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6b7280;
}

.search-input {
  width: 100%;
  padding-left: 2.5rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding-top: 0.75rem;
  padding-bottom: 0.75rem;
  transition: border-color 0.2s ease;
}

.search-input:focus {
  border-color: var(--house-color);
  outline: none;
}

.filters-container {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.filter-dropdown,
.sort-dropdown {
  min-width: 140px;
}

/* Contenu principal */
.quests-container {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.quests-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 2rem;
}

/* État vide */
.empty-state {
  background: white;
  border-radius: 16px;
  padding: 4rem 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.5rem;
}

.empty-state p {
  color: #6b7280;
  margin: 0 0 2rem 0;
  font-size: 1.1rem;
}

.clear-filters-btn {
  background: var(--house-color);
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s ease;
}

.clear-filters-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Modal */
.quest-modal .modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.quest-difficulty-badge {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.1);
  font-weight: 600;
  font-size: 0.9rem;
}

.modal-content {
  padding: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .quests-page {
    padding: 1rem;
  }
  
  .header-content {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
  
  .stats-overview {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  
  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }
  
  .search-container {
    min-width: auto;
  }
  
  .filters-container {
    justify-content: space-between;
  }
  
  .filter-dropdown,
  .sort-dropdown {
    flex: 1;
    min-width: auto;
  }
  
  .quests-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
}
</style>
