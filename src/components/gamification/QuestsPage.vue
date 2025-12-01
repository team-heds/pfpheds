<template>
  <div class="page-wrapper">
    <Navbar />
    <div :style="{ '--house-color': houseColor, 'max-width': '1400px', 'margin': '0 auto', 'padding': '2rem' }">
      
      <!-- Loading State avec Skeleton -->
      <div v-if="loading">
        <!-- Header Skeleton -->
        <div class="surface-card border-round-3xl p-5 mb-5 shadow-3">
          <div class="flex justify-content-between align-items-center">
            <div class="flex align-items-center gap-4 flex-1">
              <Skeleton shape="circle" size="4rem" />
              <div class="flex-1">
                <Skeleton width="300px" height="2rem" class="mb-2" />
                <Skeleton width="400px" height="1rem" />
              </div>
            </div>
            <Skeleton width="100px" height="2.5rem" borderRadius="12px" />
          </div>
        </div>
        
        <!-- Stats Skeletons -->
        <div class="grid mb-5">
          <div v-for="i in 3" :key="i" class="col-12 md:col-4">
            <div class="surface-card border-round-xl p-4 shadow-2">
              <div class="flex align-items-center gap-3">
                <Skeleton shape="circle" size="4rem" />
                <div class="flex-1">
                  <Skeleton width="100px" height="2rem" class="mb-2" />
                  <Skeleton width="150px" height="1rem" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Cards Skeletons -->
        <div class="grid">
          <div v-for="i in 6" :key="i" class="col-12 md:col-6 lg:col-4">
            <Skeleton height="350px" borderRadius="16px" />
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div v-else>
        
        <!-- Page Header -->
        <div class="surface-card border-round-3xl p-5 mb-5 shadow-3" :style="{ borderLeft: `6px solid ${houseColor}` }">
          <div class="flex justify-content-between align-items-center flex-wrap gap-4">
            <div class="flex align-items-center gap-4 flex-1">
              <div class="flex align-items-center justify-content-center border-round-2xl p-3" 
                   :style="{ background: `${houseColor}15` }">
                <i class="pi pi-flag text-3xl" :style="{ color: houseColor }"></i>
              </div>
              <div>
                <h1 class="m-0 text-4xl font-bold text-900">Journal de Quêtes</h1>
                <p class="m-0 mt-2 text-600 font-medium">
                  Progressez dans votre aventure et débloquez des récompenses
                </p>
              </div>
            </div>
            <Button 
              @click="goBack" 
              icon="pi pi-arrow-left"
              label="Retour"
              outlined
              class="font-semibold border-round-xl"
              :style="{ borderColor: houseColor, color: houseColor }"
            />
          </div>
        </div>

        <!-- Statistics Overview -->
        <div class="grid mb-5">
          <div class="col-12 md:col-4">
            <div class="surface-card border-round-xl p-4 shadow-2 hover:shadow-4 transition-all transition-duration-300 cursor-pointer" 
                 :style="{ borderTop: `4px solid ${houseColor}` }">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center border-round-xl" 
                     :style="{ width: '64px', height: '64px', background: `${houseColor}10` }">
                  <span class="text-4xl">🏆</span>
                </div>
                <div class="flex-1">
                  <div class="text-3xl font-bold mb-1" :style="{ color: houseColor }">
                    {{ questStats.completedQuests }}/{{ questStats.totalQuests }}
                  </div>
                  <div class="text-xs text-600 font-semibold uppercase letter-spacing-1">Quêtes Complétées</div>
                  <ProgressBar :value="completionRate" :showValue="false" class="mt-2" 
                               :style="{ height: '8px', background: '#e5e7eb' }" 
                               :pt="{ value: { style: { background: houseColor } } }" />
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-12 md:col-4">
            <div class="surface-card border-round-xl p-4 shadow-2 hover:shadow-4 transition-all transition-duration-300 cursor-pointer" 
                 :style="{ borderTop: `4px solid #f59e0b` }">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center border-round-xl" 
                     style="width: 64px; height: 64px; background: rgba(245, 158, 11, 0.1);">
                  <span class="text-4xl">⭐</span>
                </div>
                <div class="flex-1">
                  <div class="text-3xl font-bold text-900 mb-1">
                    {{ formatNumber(questStats.totalXPFromQuests) }}
                  </div>
                  <div class="text-xs text-600 font-semibold uppercase letter-spacing-1">XP des Quêtes</div>
                  <div class="mt-2 text-sm" style="color: #f59e0b;">
                    <i class="pi pi-arrow-up text-xs"></i> Points accumulés
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="col-12 md:col-4">
            <div class="surface-card border-round-xl p-4 shadow-2 hover:shadow-4 transition-all transition-duration-300 cursor-pointer" 
                 :style="{ borderTop: `4px solid #3b82f6` }">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center border-round-xl" 
                     style="width: 64px; height: 64px; background: rgba(59, 130, 246, 0.1);">
                  <span class="text-4xl">📊</span>
                </div>
                <div class="flex-1">
                  <div class="text-3xl font-bold text-900 mb-1">{{ questStats.averageProgress }}%</div>
                  <div class="text-xs text-600 font-semibold uppercase letter-spacing-1">Progression Moyenne</div>
                  <div class="mt-2 text-sm" style="color: #3b82f6;">
                    <i class="pi pi-chart-line text-xs"></i> Performance globale
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>

    <!-- Onglets Navigation -->
    <div class="mb-4">
      <TabView v-model:activeIndex="activeTabIndex" @tab-change="onTabChange">
        <TabPanel>
          <template #header>
            <div class="flex align-items-center gap-3 font-semibold">
              <i class="pi pi-compass"></i>
              <span>Mes Quêtes</span>
              <span class="px-3 py-1 border-round-xl text-xs font-bold text-center" 
                    style="background: rgba(0, 0, 0, 0.15); min-width: 28px;">
                {{ activeQuestsCount }}
              </span>
            </div>
          </template>
        </TabPanel>
        
        <TabPanel>
          <template #header>
            <div class="flex align-items-center gap-3 font-semibold">
              <i class="pi pi-check-circle"></i>
              <span>Historique</span>
              <span class="px-3 py-1 border-round-xl text-xs font-bold text-center" 
                    style="background: rgba(16, 185, 129, 0.15); color: #10b981; min-width: 28px;">
                {{ completedQuestsCount }}
              </span>
            </div>
          </template>
        </TabPanel>
        
        <TabPanel>
          <template #header>
            <div class="flex align-items-center gap-3 font-semibold">
              <i class="pi pi-list"></i>
              <span>Toutes</span>
              <span class="px-3 py-1 border-round-xl text-xs font-bold text-center" 
                    style="background: rgba(0, 0, 0, 0.15); min-width: 28px;">
                {{ questStats.totalQuests || 0 }}
              </span>
            </div>
          </template>
        </TabPanel>
      </TabView>
    </div>

    <!-- Filtres et recherche -->
    <div class="surface-card border-round-xl p-4 mb-5 shadow-2">
      <div class="mb-3">
        <h3 class="text-lg font-bold text-900 m-0 mb-1">
          <i class="pi pi-filter-fill mr-2" :style="{ color: houseColor }"></i>
          Recherche et Filtres
        </h3>
        <p class="text-sm text-600 m-0">Affinez vos résultats pour trouver les quêtes parfaites</p>
      </div>
      
      <div class="grid">
        <!-- Recherche -->
        <div class="col-12 md:col-6">
          <label class="block text-sm font-semibold text-900 mb-2">
            <i class="pi pi-search mr-1"></i> Rechercher
          </label>
          <span class="p-input-icon-left w-full" :class="{ 'p-input-icon-right': searchQuery }">
            <i class="pi pi-search"></i>
            <InputText 
              v-model="searchQuery" 
              placeholder="Rechercher une quête..."
              class="w-full"
            />
            <i 
              v-if="searchQuery" 
              class="pi pi-times cursor-pointer text-400 hover:text-900 transition-colors transition-duration-200"
              @click="searchQuery = ''"
              style="right: 0.75rem;"
            ></i>
          </span>
        </div>
        
        <!-- Difficulté -->
        <div class="col-12 md:col-2">
          <label class="block text-sm font-semibold text-900 mb-2">
            <i class="pi pi-star-fill mr-1"></i> Difficulté
          </label>
          <Dropdown 
            v-model="selectedDifficulty" 
            :options="difficultyOptions" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Toutes"
            class="w-full"
          />
        </div>
        
        <!-- Type -->
        <div class="col-12 md:col-2">
          <label class="block text-sm font-semibold text-900 mb-2">
            <i class="pi pi-tag mr-1"></i> Type
          </label>
          <Dropdown 
            v-model="selectedType" 
            :options="typeOptions" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Tous"
            class="w-full"
          />
        </div>
        
        <!-- Tri -->
        <div class="col-12 md:col-2">
          <label class="block text-sm font-semibold text-900 mb-2">
            <i class="pi pi-sort-alt mr-1"></i> Tri
          </label>
          <Dropdown 
            v-model="sortBy" 
            :options="sortOptions" 
            optionLabel="label" 
            optionValue="value"
            placeholder="Défaut"
            class="w-full"
          />
        </div>
      </div>
      
      <!-- Résumé des filtres actifs -->
      <div v-if="hasFilters" class="mt-3 flex align-items-center gap-2 flex-wrap">
        <span class="text-sm font-semibold text-600">Filtres actifs:</span>
        <Chip v-if="selectedDifficulty" :label="`Difficulté: ${selectedDifficulty}`" removable @remove="selectedDifficulty = null" />
        <Chip v-if="selectedType" :label="`Type: ${selectedType}`" removable @remove="selectedType = null" />
        <Button label="Tout effacer" size="small" text @click="clearFilters" class="p-0 text-sm" :style="{ color: houseColor }" />
      </div>
    </div>


    <!-- Quêtes -->
    <div v-if="filteredQuests.length > 0" class="quests-container">
      <!-- Barre d'actions -->
      <div class="surface-card border-round-xl p-3 mb-4 shadow-1 flex justify-content-between align-items-center flex-wrap gap-3">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-list" :style="{ color: houseColor }"></i>
          <span class="text-lg font-bold text-900">{{ filteredQuests.length }}</span>
          <span class="text-sm text-600">quête{{ filteredQuests.length > 1 ? 's' : '' }} {{ activeTab === 'active' ? 'actives' : activeTab === 'completed' ? 'complétées' : 'au total' }}</span>
        </div>
        
        <div class="flex align-items-center gap-2">
          <span class="text-sm text-600 mr-2 hidden md:inline">Affichage:</span>
          <Button 
            icon="pi pi-th-large" 
            :outlined="viewMode !== 'grid'"
            @click="viewMode = 'grid'" 
            size="small"
            :style="viewMode === 'grid' ? { backgroundColor: houseColor, borderColor: houseColor } : { color: houseColor, borderColor: houseColor }"
            class="view-toggle-btn"
          />
          <Button 
            icon="pi pi-list" 
            :outlined="viewMode !== 'list'"
            @click="viewMode = 'list'" 
            size="small"
            :style="viewMode === 'list' ? { backgroundColor: houseColor, borderColor: houseColor } : { color: houseColor, borderColor: houseColor }"
            class="view-toggle-btn"
          />
          <Divider layout="vertical" class="hidden md:inline-flex" />
          <span class="text-sm text-600 hidden md:inline">
            Page {{ Math.floor(currentPage / questsPerPage) + 1 }}/{{ totalPages }}
          </span>
        </div>
      </div>

      <!-- Grille ou Liste avec transition -->
      <div :class="viewMode === 'grid' ? 'grid' : 'flex flex-column gap-3'">
        <div 
          v-for="quest in paginatedQuests" 
          :key="quest.id" 
          :class="viewMode === 'grid' ? 'col-12 md:col-6 lg:col-4 quest-card-wrapper' : 'quest-card-wrapper'"
        >
          <QuestCard
            :quest="quest"
            :house-color="houseColor"
            @click="showQuestDetails"
            @start-quest="startQuest"
            @view-details="showQuestDetails"
          />
        </div>
      </div>
      
      <!-- Pagination -->
      <Paginator
        v-if="totalPages > 1"
        :rows="questsPerPage"
        :totalRecords="filteredQuests.length"
        v-model:first="currentPage"
        @page="onPageChange"
        class="mt-4"
      />
    </div>

    <!-- État vide amélioré -->
    <div v-else class="surface-card border-round-xl p-6 text-center shadow-2 empty-state-card">
      <div class="empty-state-icon inline-flex align-items-center justify-content-center border-round-circle mb-4" 
           :style="{ width: '140px', height: '140px', background: `${houseColor}15` }">
        <span class="text-7xl">{{ getEmptyStateIcon() }}</span>
      </div>
      <h3 class="text-3xl font-bold text-900 mb-3">{{ getEmptyStateTitle() }}</h3>
      <p class="text-600 text-lg mb-4 mx-auto line-height-3" style="max-width: 550px;">
        {{ getEmptyStateMessage() }}
      </p>
      <div class="flex gap-3 justify-content-center flex-wrap">
        <Button 
          v-if="hasFilters"
          @click="clearFilters"
          icon="pi pi-filter-slash"
          label="Effacer les filtres"
          size="large"
          :style="{ backgroundColor: houseColor, borderColor: houseColor }"
        />
        <Button 
          v-else-if="activeTab !== 'active'"
          @click="() => activeTabIndex = 0"
          icon="pi pi-compass"
          label="Voir mes quêtes actives"
          size="large"
          :style="{ backgroundColor: houseColor, borderColor: houseColor }"
        />
        <Button 
          v-else
          @click="() => activeTabIndex = 2"
          icon="pi pi-list"
          label="Parcourir toutes les quêtes"
          size="large"
          outlined
          :style="{ borderColor: houseColor, color: houseColor }"
        />
      </div>
    </div>

    <!-- Modal détails de quête -->
    <Dialog 
      v-model:visible="showModal" 
      :style="{ width: '90vw', maxWidth: '800px' }"
      :modal="true"
      :closable="true"
      :draggable="false"
    >
      <template #header>
        <div class="flex justify-content-between align-items-center w-full">
          <h2 class="text-2xl font-bold m-0">{{ selectedQuest?.title }}</h2>
          <div v-if="selectedQuest" 
               class="px-4 py-2 border-round-2xl font-bold text-sm uppercase" 
               style="background: linear-gradient(135deg, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.08));"
               :style="{ color: getDifficultyColor(selectedQuest.difficulty) }">
            {{ getDifficultyName(selectedQuest.difficulty) }}
          </div>
        </div>
      </template>
      
      <div v-if="selectedQuest">
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
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Navbar from '../common/utils/Navbar.vue'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ProgressBar from 'primevue/progressbar'
import Paginator from 'primevue/paginator'
import Toast from 'primevue/toast'
import Chip from 'primevue/chip'
import Skeleton from 'primevue/skeleton'
import Divider from 'primevue/divider'
import QuestCard from './QuestCard.vue'
import userQuestsService from '../../service/userQuestsService'
import { useAuthStore } from '@/stores/authStore'

// Services
const router = useRouter()
const toast = useToast()
const authStore = useAuthStore()

// État réactif
const loading = ref(true)
const viewMode = ref('grid') // 'grid' ou 'list'

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
  const user = authStore.user
  if (!user) return '#6B7280'
  const h = normalizeHouse(user.maison || user.user_metadata?.house)
  if (!h) return '#6B7280'
  return houseConfig[h]?.color || '#6B7280'
})
const userQuests = ref([])
const questStats = ref({})
const searchQuery = ref('')
const selectedDifficulty = ref('all')
const selectedType = ref('all')
const sortBy = ref('progress_desc')
const currentPage = ref(0)
const questsPerPage = 12
const showModal = ref(false)
const selectedQuest = ref(null)
const activeTab = ref('active') // 'active', 'completed', 'all'
const activeTabIndex = ref(0) // Index pour PrimeVue TabView

// Options pour les filtres
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
const questsArray = computed(() => userQuests.value || [])

const activeQuestsCount = computed(() => {
  return questsArray.value.filter(q => 
    q.userProgress?.status === 'not_started' || q.userProgress?.status === 'in_progress'
  ).length
})

const completedQuestsCount = computed(() => {
  return questsArray.value.filter(q => q.userProgress?.status === 'completed').length
})

const tabFilteredQuests = computed(() => {
  if (activeTab.value === 'active') {
    return questsArray.value.filter(q => 
      q.userProgress?.status === 'not_started' || q.userProgress?.status === 'in_progress'
    )
  } else if (activeTab.value === 'completed') {
    return questsArray.value.filter(q => q.userProgress?.status === 'completed')
  }
  return questsArray.value // 'all'
})

const filteredQuests = computed(() => {
  let filtered = tabFilteredQuests.value

  // Recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(quest => 
      quest.title.toLowerCase().includes(query) ||
      quest.description.toLowerCase().includes(query)
    )
  }

  // Filtres
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
         selectedDifficulty.value !== 'all' || 
         selectedType.value !== 'all'
})

// Méthodes
const loadQuestsData = async () => {
  try {
    loading.value = true
    
    // Utiliser authStore qui supporte Firebase ET Supabase
    const user = authStore.user
    if (!user) {
      router.push('/home')
      return
    }
    
    // ID utilisateur selon le provider
    const userId = authStore.isFirebaseUser ? user.uid : user.id

    // Charger les quêtes utilisateur depuis Supabase
    const quests = await userQuestsService.getUserQuests(userId)
    userQuests.value = quests
    
    console.log(`✅ ${quests.length} quêtes chargées depuis Supabase`)

    // Charger les statistiques
    questStats.value = await userQuestsService.getQuestStats(userId)
    
    console.log('📊 Stats quêtes:', questStats.value)
    
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
    const user = authStore.user
    if (!user) return
    const userId = authStore.isFirebaseUser ? user.uid : user.id
    if (!userId) return

    await userQuestsService.startQuest(userId, questId)
    
    // Recharger les données
    await loadQuestsData()
    
    toast.add({
      severity: 'success',
      summary: 'Quête démarrée!',
      detail: 'Votre aventure commence maintenant 🎯',
      life: 3000
    })
  } catch (error) {
    console.error('❌ Erreur lors du démarrage de la quête:', error)
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

const onTabChange = (event) => {
  const tabs = ['active', 'completed', 'all']
  activeTab.value = tabs[event.index]
  activeTabIndex.value = event.index
  currentPage.value = 0
}

const clearFilters = () => {
  searchQuery.value = ''
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

const getEmptyStateIcon = () => {
  if (hasFilters.value) {
    return '🔍'
  }
  
  if (activeTab.value === 'active') {
    return '🗺️'
  } else if (activeTab.value === 'completed') {
    return '🏆'
  }
  return '📋'
}

const getEmptyStateTitle = () => {
  if (hasFilters.value) {
    return 'Aucune quête trouvée'
  }
  
  if (activeTab.value === 'active') {
    return 'Aucune quête active'
  } else if (activeTab.value === 'completed') {
    return 'Aucune quête complétée'
  }
  return 'Aucune quête disponible'
}

const getEmptyStateMessage = () => {
  if (hasFilters.value) {
    return 'Essayez de modifier vos critères de recherche ou filtres.'
  }
  
  if (activeTab.value === 'active') {
    return 'Vous n\'avez pas de quêtes en cours. Explorez l\'onglet "Toutes" pour découvrir de nouvelles aventures !'
  } else if (activeTab.value === 'completed') {
    return 'Vous n\'avez pas encore terminé de quêtes. Lancez-vous dans une aventure pour commencer votre collection !'
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
watch([searchQuery, selectedDifficulty, selectedType], () => {
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
}

/* Animations entrée */
.quest-card-wrapper {
  animation: fadeInUp 0.4s ease forwards;
  opacity: 0;
}

.quest-card-wrapper:nth-child(1) { animation-delay: 0.05s; }
.quest-card-wrapper:nth-child(2) { animation-delay: 0.1s; }
.quest-card-wrapper:nth-child(3) { animation-delay: 0.15s; }
.quest-card-wrapper:nth-child(4) { animation-delay: 0.2s; }
.quest-card-wrapper:nth-child(5) { animation-delay: 0.25s; }
.quest-card-wrapper:nth-child(6) { animation-delay: 0.3s; }
.quest-card-wrapper:nth-child(7) { animation-delay: 0.35s; }
.quest-card-wrapper:nth-child(8) { animation-delay: 0.4s; }
.quest-card-wrapper:nth-child(9) { animation-delay: 0.45s; }

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Onglet actif avec couleur de maison */
:deep(.p-tabview .p-tabview-nav li.p-highlight .p-tabview-nav-link) {
  background: var(--house-color) !important;
  color: white !important;
}

/* Badge dans onglet actif */
:deep(.p-tabview .p-tabview-nav li.p-highlight span[style*="background"]) {
  background: rgba(255, 255, 255, 0.25) !important;
  color: white !important;
}

/* Quests container */
.quests-container {
  animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Letter spacing utility */
.letter-spacing-1 {
  letter-spacing: 0.05em;
}

/* Pagination style */
:deep(.p-paginator) {
  background: white;
  border-radius: 12px;
  border: none;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  padding: 1rem;
}

:deep(.p-paginator .p-paginator-page.p-highlight) {
  background: var(--house-color) !important;
  border-color: var(--house-color) !important;
  color: white;
}

/* Hover effects améliorés */
:deep(.surface-card) {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.surface-card:hover) {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12) !important;
}

/* View toggle buttons */
.view-toggle-btn {
  transition: all 0.2s ease;
}

.view-toggle-btn:hover {
  transform: scale(1.05);
}

/* Skeleton animations */
:deep(.p-skeleton) {
  animation: skeleton-pulse 1.5s ease-in-out infinite;
}

@keyframes skeleton-pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Empty state animations */
.empty-state-card {
  animation: fadeIn 0.5s ease;
}

.empty-state-icon {
  animation: bounce-in 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}

@keyframes bounce-in {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Responsive */
@media (max-width: 768px) {
  .quest-card-wrapper {
    animation-delay: 0s !important;
  }
}
</style>
