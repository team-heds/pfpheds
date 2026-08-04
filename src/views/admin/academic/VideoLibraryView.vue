<template>
  <AdminLayout>
  <div class="video-library-view">
    <div class="library-container">
      <!-- Header -->
      <div class="library-header">
        <div class="header-content">
          <div class="title-section">
            <h1>
              <i class="pi pi-video"></i>
              Bibliothèque Vidéo
            </h1>
            <p class="subtitle">
              {{ displayedVideos.length }} vidéos disponibles
              <span v-if="cacheAge" class="cache-info"> • Cache: {{ cacheAge }}</span>
            </p>
          </div>
          
          <div class="header-actions">
            <Button 
              label="Re-matcher" 
              icon="pi pi-bolt" 
              outlined
              severity="warning"
              @click="rematchVideos"
              v-tooltip="'Re-matcher les vidéos avec les modules via les tags Vimeo'"
            />
            <Button 
              :label="loadingVimeo ? loadingProgress : 'Recharger Vimeo'" 
              icon="pi pi-refresh" 
              outlined
              :loading="loadingVimeo"
              @click="loadVimeoVideos(true)"
              v-tooltip="'Forcer le rechargement depuis Vimeo'"
            />
            <Button 
              label="Statistiques" 
              icon="pi pi-chart-bar" 
              outlined
              @click="showStatsDialog = true"
            />
          </div>
        </div>

        <!-- Toggle vue -->
        <div class="tabs-section">
          <h3 style="margin: 0; color: var(--primary-color); font-size: 1.1rem;">
            <i class="pi pi-cloud"></i> Catalogue Vimeo
          </h3>
          
          <div class="view-toggle">
            <Button 
              icon="pi pi-th-large" 
              :class="{ 'active': libraryView === 'grid' }"
              @click="libraryView = 'grid'"
              text
              rounded
              v-tooltip.top="'Vue grille'"
            />
            <Button 
              icon="pi pi-list" 
              :class="{ 'active': libraryView === 'modules' }"
              @click="libraryView = 'modules'"
              text
              rounded
              v-tooltip.top="'Vue par modules'"
            />
          </div>
        </div>

        <!-- Stats rapides -->
        <br>
        <div class="quick-stats">
          <div class="stat-card">
            <i class="pi pi-video"></i>
            <div>
              <span class="stat-value">{{ vimeoVideos.length }}</span>
              <span class="stat-label">Vidéos Vimeo</span>
            </div>
          </div>
          <div class="stat-card">
            <i class="pi pi-clock"></i>
            <div>
              <span class="stat-value">{{ totalDuration }}h</span>
              <span class="stat-label">Durée totale</span>
            </div>
          </div>
          <div class="stat-card">
            <i class="pi pi-book"></i>
            <div>
              <span class="stat-value">{{ uniqueModules }}</span>
              <span class="stat-label">Modules</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filters-section">
        <div class="search-bar">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search"></i>
            <InputText 
              v-model="searchQuery" 
              placeholder="Rechercher une vidéo..." 
              class="w-full"
            />
          </span>
        </div>

        <div class="filters-row">
          <Dropdown 
            v-model="filterModule" 
            :options="moduleOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Filtrer par module"
            class="filter-item"
            showClear
          />

          <Dropdown 
            v-model="sortBy" 
            :options="sortOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Trier par"
            class="filter-item"
          />
        </div>
      </div>

      <LoadingState v-if="loadingVimeo && vimeoVideos.length === 0" label="Chargement de la bibliothèque vidéo…" />

      <!-- Vue par modules -->
      <div v-if="libraryView === 'modules'" class="modules-view">
        <!-- Header modules -->
        <div v-if="videosByModule.length > 0" class="modules-header">
          <div>
            <h3>
              <i class="pi pi-folder"></i>
              {{ videosByModule.length }} module{{ videosByModule.length > 1 ? 's' : '' }}
            </h3>
            <p class="modules-subtitle">
              {{ filteredVimeoVideos.length }} vidéo{{ filteredVimeoVideos.length > 1 ? 's' : '' }} au total
            </p>
          </div>
          <Button 
            :label="allModulesExpanded ? 'Tout replier' : 'Tout déplier'" 
            :icon="allModulesExpanded ? 'pi pi-minus' : 'pi pi-plus'"
            outlined
            severity="secondary"
            @click="toggleAllModules"
          />
        </div>
        
        <ModuleSection
          v-for="moduleGroup in videosByModule"
          :key="moduleGroup.module_id"
          :module-group="moduleGroup"
          :get-vimeo-thumbnail="getVimeoThumbnail"
          :initial-expanded="allModulesExpanded"
          @play="playVideo"
          @copy-link="copyLink"
          @show-menu="showVideoMenu"
        />
        
        <!-- Empty state pour vue modules -->
        <div v-if="videosByModule.length === 0" class="empty-state">
          <i class="pi pi-folder-open"></i>
          <h3>Aucun module avec vidéos</h3>
          <p>Assignez des vidéos à vos modules pour les voir ici</p>
        </div>
      </div>

      <!-- Grille de vidéos (Vue grille) -->
      <transition-group 
        v-if="libraryView === 'grid' && filteredVimeoVideos.length > 0" 
        name="video-list"
        tag="div"
        class="videos-grid"
      >
        <VideoCard
          v-for="video in filteredVimeoVideos" 
          :key="video.vimeo_id"
          :video="video"
          :get-vimeo-thumbnail="getVimeoThumbnail"
          @play="playVideo"
          @copy-link="copyLink"
          @show-menu="showVideoMenu"
        />
      </transition-group>

      <!-- Empty state -->
      <div v-if="!loadingVimeo && filteredVimeoVideos.length === 0" class="empty-state">
        <i class="pi pi-video"></i>
        <h3>Aucune vidéo trouvée</h3>
        <p v-if="loadingVimeo">Chargement des vidéos Vimeo en cours...</p>
        <p v-else>Aucune vidéo Vimeo disponible. Vérifiez votre token d'accès.</p>
      </div>
    </div>

    <!-- Dialog Player -->
    <Dialog 
      v-model:visible="showPlayer" 
      :header="selectedVideo?.title"
      :style="{ width: '90vw', maxWidth: '1200px' }" 
      modal
      maximizable
    >
      <div class="player-container">
        <iframe 
          v-if="selectedVideo"
          :src="getVimeoEmbedUrl(selectedVideo.vimeo_id)"
          width="100%"
          height="600"
          frameborder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowfullscreen
        ></iframe>

        <div class="player-info">
          <div class="info-row">
            <div>
              <h4>{{ selectedVideo?.title }}</h4>
              <p class="text-secondary">{{ selectedVideo?.description }}</p>
            </div>
            <Button 
              label="Copier le lien" 
              icon="pi pi-copy" 
              @click="copyLink(selectedVideo?.vimeo_url)"
            />
          </div>

          <div class="player-meta">
            <span v-if="selectedVideo?.modules" class="meta-item">
              <i class="pi pi-book"></i>
              Module : {{ selectedVideo.modules.title }}
            </span>
            <span v-if="selectedVideo?.years" class="meta-item">
              <i class="pi pi-calendar"></i>
              Année : {{ selectedVideo.years.name }}
            </span>
            <span v-if="selectedVideo?.duration" class="meta-item">
              <i class="pi pi-clock"></i>
              Durée : {{ selectedVideo.duration }} min
            </span>
            <span v-if="selectedVideo?.person_filmed" class="meta-item">
              <i class="pi pi-user"></i>
              Intervenant : {{ selectedVideo.person_filmed }}
            </span>
          </div>

          <Divider />

          <div class="player-actions">
            <Button 
              label="Ouvrir dans Vimeo" 
              icon="pi pi-external-link" 
              outlined
              @click="openInVimeo(selectedVideo?.vimeo_url)"
            />
            <Button 
              label="Voir le ticket" 
              icon="pi pi-ticket" 
              outlined
              @click="goToTicket(selectedVideo?.ticket_id)"
              v-if="selectedVideo?.ticket_id"
            />
          </div>
        </div>
      </div>
    </Dialog>

    <!-- Menu contextuel -->
    <Menu ref="videoMenu" :model="menuItems" popup />

    <!-- Dialog Stats -->
    <Dialog 
      v-model:visible="showStatsDialog" 
      header="Statistiques de la bibliothèque" 
      :style="{ width: '600px' }" 
      modal
    >
      <div class="stats-content">
        <div class="stat-item">
          <span class="stat-label">Vidéos Vimeo</span>
          <span class="stat-value-large">{{ vimeoVideos.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Durée totale</span>
          <span class="stat-value-large">{{ totalDuration }}h</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">Modules couverts</span>
          <span class="stat-value-large">{{ uniqueModules }}</span>
        </div>
      </div>
    </Dialog>

    <!-- Dialog Ajouter vidéo à un module -->
    <Dialog 
      v-model:visible="showAddToModuleDialog" 
      header="Ajouter une vidéo Vimeo au module" 
      :style="{ width: '900px' }" 
      modal
    >
      <div class="add-to-module-content">
        <p class="mb-3">Sélectionnez les vidéos Vimeo à ajouter à ce module :</p>
        
        <div v-if="vimeoVideos.length === 0" class="no-vimeo-message">
          <i class="pi pi-info-circle"></i>
          <p>Chargez d'abord les vidéos Vimeo depuis l'onglet Vimeo</p>
          <Button 
            label="Aller à l'onglet Vimeo" 
            icon="pi pi-cloud" 
            @click="activeTab = 'vimeo'; showAddToModuleDialog = false"
          />
        </div>
        
        <div v-else class="vimeo-selection-grid">
          <div 
            v-for="video in vimeoVideos.filter(v => !v.in_library)" 
            :key="video.vimeo_id"
            class="vimeo-selection-card"
          >
            <img 
              :src="video.thumbnail_url || getVimeoThumbnail(video.vimeo_id)" 
              :alt="video.title"
              class="vimeo-thumb"
            />
            <div class="vimeo-info">
              <h4>{{ video.title }}</h4>
              <span v-if="video.duration">{{ formatDuration(video.duration) }}</span>
            </div>
            <Button 
              label="Ajouter" 
              icon="pi pi-plus" 
              size="small"
              @click="addVimeoToLibraryAndModule(video, selectedModule)"
            />
          </div>
        </div>
      </div>
    </Dialog>

    <Toast />
  </div>
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import VideoCard from '@/components/video/VideoCard.vue'
import ModuleSection from '@/components/video/ModuleSection.vue'
import LoadingState from '@/components/common/states/LoadingState.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Menu from 'primevue/menu'
import Divider from 'primevue/divider'
import Toast from 'primevue/toast'
import { getVimeoThumbnailUrl, getVimeoEmbedUrl, getVimeoVideos, checkVimeoVideosInLibrary } from '@/service/videoLibraryService'

const router = useRouter()
const toast = useToast()

const vimeoVideos = ref([])
const modules = ref([])
const selectedVideo = ref(null)
const showPlayer = ref(false)
const showStatsDialog = ref(false)
const videoMenu = ref(null)
const loadingVimeo = ref(false)
const loadingProgress = ref('')
const libraryView = ref('grid') // 'grid' ou 'modules'
const showAddToModuleDialog = ref(false)
const selectedModule = ref(null)
const cacheAge = ref('')
const allModulesExpanded = ref(true)

// Filtres
const searchQuery = ref('')
const debouncedSearchQuery = ref('')
const filterModule = ref(null)
const sortBy = ref('date_desc')

// Debounce pour la recherche (500ms)
let searchTimeout = null
watch(searchQuery, (newValue) => {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    debouncedSearchQuery.value = newValue
  }, 300)
})

const sortOptions = [
  { label: 'Plus récent', value: 'date_desc' },
  { label: 'Plus ancien', value: 'date_asc' },
  { label: 'Titre A-Z', value: 'title_asc' },
  { label: 'Titre Z-A', value: 'title_desc' },
  { label: 'Durée croissante', value: 'duration_asc' },
  { label: 'Durée décroissante', value: 'duration_desc' }
]

// Options modules
const moduleOptions = computed(() => {
  return [
    { label: 'Tous les modules', value: null },
    ...modules.value.map(m => ({ label: m.title || 'Module inconnu', value: m.id }))
  ]
})

// Vidéos filtrées - Vimeo
const filteredVimeoVideos = computed(() => {
  let filtered = [...vimeoVideos.value]
  
  // Recherche avec debounce
  if (debouncedSearchQuery.value) {
    const query = debouncedSearchQuery.value.toLowerCase()
    filtered = filtered.filter(v => 
      v.title.toLowerCase().includes(query) ||
      v.description?.toLowerCase().includes(query) ||
      v.vimeo_tags?.some(tag => tag.toLowerCase().includes(query))
    )
  }
  
  // Filtre par module
  if (filterModule.value) {
    filtered = filtered.filter(v => v.module_id === filterModule.value)
  }
  
  // Tri
  switch (sortBy.value) {
    case 'date_desc':
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      break
    case 'date_asc':
      filtered.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
      break
    case 'title_asc':
      filtered.sort((a, b) => a.title.localeCompare(b.title))
      break
    case 'title_desc':
      filtered.sort((a, b) => b.title.localeCompare(a.title))
      break
    case 'duration_asc':
      filtered.sort((a, b) => (a.duration || 0) - (b.duration || 0))
      break
    case 'duration_desc':
      filtered.sort((a, b) => (b.duration || 0) - (a.duration || 0))
      break
  }
  
  return filtered
})

// Vidéos affichées
const displayedVideos = computed(() => filteredVimeoVideos.value)

// Vidéos groupées par module
const videosByModule = computed(() => {
  const grouped = {}
  
  // Créer un groupe pour chaque module_id unique
  filteredVimeoVideos.value.forEach(video => {
    const moduleId = video.module_id || 'non_assignees'
    if (!grouped[moduleId]) {
      // Trouver le nom du module dans modules.value
      const module = modules.value.find(m => m.id === moduleId)
      grouped[moduleId] = {
        module_id: moduleId,
        module_name: moduleId === 'non_assignees' ? 'Vidéos non assignées' : (module?.title || 'Module inconnu'),
        module_description: module?.description || '',
        videos: []
      }
    }
    grouped[moduleId].videos.push(video)
  })
  
  return Object.values(grouped).sort((a, b) => {
    if (a.module_id === 'non_assignees') return 1
    if (b.module_id === 'non_assignees') return -1
    return a.module_name.localeCompare(b.module_name)
  })
})

// Stats
const totalDuration = computed(() => {
  const total = vimeoVideos.value.reduce((sum, v) => sum + (v.duration || 0), 0)
  return Math.round(total / 60) // Convertir en heures
})

const uniqueModules = computed(() => {
  return new Set(vimeoVideos.value.filter(v => v.in_library).map(v => v.module_id).filter(Boolean)).size
})

// Menu contextuel
const menuItems = computed(() => [
  {
    label: 'Visionner',
    icon: 'pi pi-play',
    command: () => playVideo(selectedVideo.value)
  },
  {
    label: 'Copier le lien',
    icon: 'pi pi-copy',
    command: () => copyLink(selectedVideo.value.vimeo_url)
  },
  {
    label: 'Ouvrir dans Vimeo',
    icon: 'pi pi-external-link',
    command: () => openInVimeo(selectedVideo.value.vimeo_url)
  }
])

// Fonctions
function getVimeoThumbnail(vimeoId) {
  return getVimeoThumbnailUrl(vimeoId)
}

function handleThumbnailError(event) {
  event.target.src = '/placeholder-video.jpg'
}

function formatDuration(minutes) {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h${mins > 0 ? mins : ''}`
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })
}

function truncateText(text, length) {
  if (!text || text.length <= length) return text
  return text.substring(0, length) + '...'
}

function playVideo(video) {
  selectedVideo.value = video
  showPlayer.value = true
}

function showVideoMenu(event, video) {
  selectedVideo.value = video
  videoMenu.value.toggle(event)
}

async function copyLink(url) {
  try {
    await navigator.clipboard.writeText(url)
    toast.add({ 
      severity: 'success', 
      summary: 'Lien copié', 
      detail: 'Le lien a été copié dans le presse-papier',
      life: 2000 
    })
  } catch (error) {
    console.error('[VideoLibrary] Erreur copie:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur', 
      detail: 'Impossible de copier le lien',
      life: 3000 
    })
  }
}

function openInVimeo(url) {
  window.open(url, '_blank')
}

function goToTicket(ticketId) {
  router.push(`/admin/academic/tickets?ticket=${ticketId}`)
}



async function loadVimeoVideos(forceRefresh = false) {
  loadingVimeo.value = true
  loadingProgress.value = 'Chargement...'
  
  try {
    // Clé du cache
    const CACHE_KEY = 'vimeo_videos_cache'
    const CACHE_TIMESTAMP_KEY = 'vimeo_videos_timestamp'
    const CACHE_DURATION = 60 * 60 * 1000 // 1 heure en millisecondes
    
    // Vérifier si on a un cache valide
    if (!forceRefresh) {
      const cachedData = localStorage.getItem(CACHE_KEY)
      const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
      
      if (cachedData && cachedTimestamp) {
        const timestamp = parseInt(cachedTimestamp)
        const now = Date.now()
        
        // Si le cache a moins d'1 heure
        if (now - timestamp < CACHE_DURATION) {
          console.log('[VideoLibrary] 📦 Chargement depuis le cache')
          vimeoVideos.value = JSON.parse(cachedData)
          
          // Refaire le matching avec les modules (au cas où ils ont changé)
          matchVimeoTagsWithModules()
          
          loadingProgress.value = ''
          loadingVimeo.value = false
          
          // Calculer l'âge du cache
          const ageMinutes = Math.floor((now - timestamp) / 60000)
          cacheAge.value = ageMinutes < 1 ? 'à l\'instant' : `il y a ${ageMinutes}min`
          
          toast.add({ 
            severity: 'info', 
            summary: 'Cache utilisé', 
            detail: `${vimeoVideos.value.length} vidéos chargées depuis le cache`,
            life: 2000 
          })
          return
        }
      }
    }
    
    // Réinitialiser l'âge du cache si on recharge
    cacheAge.value = ''
    
    // Sinon, charger depuis Vimeo
    console.log('[VideoLibrary] 🌐 Chargement depuis Vimeo...')
    loadingProgress.value = 'Connexion à Vimeo...'
    
    const vimeoList = await getVimeoVideos((count, page) => {
      loadingProgress.value = `${count} vidéos (page ${page})`
    })
    
    loadingProgress.value = 'Vérification dans la bibliothèque...'
    vimeoVideos.value = await checkVimeoVideosInLibrary(vimeoList)
    
    // Matching automatique des tags Vimeo avec les modules
    loadingProgress.value = 'Matching avec les modules...'
    matchVimeoTagsWithModules()
    
    // Sauvegarder dans le cache
    localStorage.setItem(CACHE_KEY, JSON.stringify(vimeoVideos.value))
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
    console.log('[VideoLibrary] 💾 Cache mis à jour')
    
    toast.add({ 
      severity: 'success', 
      summary: 'Succès', 
      detail: `${vimeoVideos.value.length} vidéos Vimeo chargées`,
      life: 3000 
    })
  } catch (error) {
    console.error('[VideoLibrary] Erreur chargement Vimeo:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur', 
      detail: 'Impossible de charger les vidéos Vimeo. Vérifiez votre token.',
      life: 4000 
    })
  } finally {
    loadingVimeo.value = false
    loadingProgress.value = ''
  }
}


async function loadModules() {
  try {
    const { supabase } = await import('@/supabase')
    const { data, error } = await supabase
      .from('modules')
      .select('*')
      .order('title')
    
    if (error) throw error
    
    modules.value = data || []
    console.log('[VideoLibrary] Modules Supabase chargés:', modules.value.length)
  } catch (error) {
    console.error('[VideoLibrary] Erreur chargement modules:', error)
  }
}

function toggleAllModules() {
  allModulesExpanded.value = !allModulesExpanded.value
}

// Forcer le re-matching des vidéos
function rematchVideos() {
  // Réinitialiser les assignations automatiques
  vimeoVideos.value.forEach(video => {
    if (video.matched_by_tag) {
      video.module_id = null
      video.in_library = false
      video.matched_by_tag = false
    }
  })
  
  // Refaire le matching
  matchVimeoTagsWithModules()
  
  // Mettre à jour le cache
  const CACHE_KEY = 'vimeo_videos_cache'
  localStorage.setItem(CACHE_KEY, JSON.stringify(vimeoVideos.value))
}

// Normaliser une chaîne pour le matching (enlever accents, caractères spéciaux, espaces, etc.)
function normalizeString(str) {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD') // Décomposer les caractères accentués
    .replace(/[\u0300-\u036f]/g, '') // Supprimer les diacritiques
    .replace(/[-_\s]+/g, '') // Supprimer TOUS les tirets, underscores et espaces
}

// Matching automatique des tags Vimeo avec les modules
function matchVimeoTagsWithModules() {
  if (!modules.value || modules.value.length === 0) {
    console.log('[VideoLibrary] Aucun module chargé pour le matching')
    return
  }

  let matchCount = 0
  
  vimeoVideos.value.forEach(video => {
    // Skip si déjà assigné
    if (video.in_library && video.module_id) {
      return
    }
    
    // Si la vidéo a des tags Vimeo
    if (video.vimeo_tags && Array.isArray(video.vimeo_tags)) {
      // Chercher un match avec les modules
      for (const tag of video.vimeo_tags) {
        const normalizedTag = normalizeString(tag)
        
        // Skip les tags trop courts (moins de 3 caractères après normalisation)
        if (normalizedTag.length < 3) {
          continue
        }
        
        // Chercher un module correspondant
        const matchedModule = modules.value.find(module => {
          const normalizedModuleName = normalizeString(module.title)
          
          // Match exact
          if (normalizedModuleName === normalizedTag) {
            return true
          }
          
          // Inclusion mutuelle (seulement si les deux font au moins 5 caractères)
          if (normalizedTag.length >= 5 && normalizedModuleName.length >= 5) {
            return normalizedModuleName.includes(normalizedTag) ||
                   normalizedTag.includes(normalizedModuleName)
          }
          
          return false
        })
        
        if (matchedModule) {
          video.module_id = matchedModule.id
          video.in_library = true
          video.matched_by_tag = true // Indicateur pour savoir que c'est un match auto
          matchCount++
          console.log(`[VideoLibrary] ✅ Match: "${video.title}" → Module "${matchedModule.title}" (tag: "${tag}")`)
          break // Sortir de la boucle une fois qu'un match est trouvé
        }
      }
    }
  })
  
  if (matchCount > 0) {
    console.log(`[VideoLibrary] 🎯 ${matchCount} vidéo(s) matchée(s) automatiquement avec les modules`)
    toast.add({ 
      severity: 'info', 
      summary: 'Matching automatique', 
      detail: `${matchCount} vidéo(s) assignée(s) automatiquement via les tags`,
      life: 4000 
    })
  }
}

function addVideoToModule(moduleId) {
  selectedModule.value = moduleId
  showAddToModuleDialog.value = true
}

async function assignVideoToModule(video, moduleId) {
  try {
    const { updateVideo } = await import('@/service/videoLibraryService')
    await updateVideo(video.id, { module_id: moduleId })
    
    toast.add({ 
      severity: 'success', 
      summary: 'Vidéo assignée', 
      detail: 'La vidéo a été assignée au module',
      life: 3000 
    })
    
    await loadVimeoVideos()
    showAddToModuleDialog.value = false
  } catch (error) {
    console.error('[VideoLibrary] Erreur assignation:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur', 
      detail: 'Impossible d\'assigner la vidéo',
      life: 4000 
    })
  }
}

async function addVimeoToLibraryAndModule(video, moduleId) {
  try {
    const { addVideoToLibrary } = await import('@/service/videoLibraryService')
    await addVideoToLibrary({
      vimeo_url: video.vimeo_url,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnail_url,
      duration: video.duration,
      module_id: moduleId, // Assigner directement au module
      type: 'cours',
      tags: video.vimeo_tags || [] // Sauvegarder les tags Vimeo
    })
    
    video.in_library = true
    toast.add({ 
      severity: 'success', 
      summary: 'Vidéo ajoutée', 
      detail: 'La vidéo a été ajoutée au module',
      life: 3000 
    })
    
    await loadVimeoVideos()
    showAddToModuleDialog.value = false
  } catch (error) {
    console.error('[VideoLibrary] Erreur ajout:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur', 
      detail: 'Impossible d\'ajouter la vidéo',
      life: 4000 
    })
  }
}

onMounted(async () => {
  // Charger les modules
  await loadModules()
  
  // Charger automatiquement les vidéos Vimeo
  await loadVimeoVideos()
})
</script>

<style scoped>
.video-library-view {
  min-height: 100vh;
}

.library-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

.library-header {
  background: var(--surface-card);
  border-radius: 16px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border: 1px solid var(--surface-border);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.title-section h1 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  color: var(--text-color);
}

.title-section h1 i {
  color: var(--primary-color);
}

.subtitle {
  margin: 0.5rem 0 0 0;
  color: var(--text-color-secondary);
  font-size: 0.938rem;
}

.cache-info {
  color: var(--primary-color);
  font-weight: 600;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

/* Onglets */
.tabs-section {
  display: flex;
  gap: 0.5rem;
  margin-top: 1.5rem;
  border-bottom: 2px solid var(--surface-border);
  padding-bottom: 0.5rem;
}

.tabs-section .p-button {
  border-bottom: 3px solid transparent;
  border-radius: 0;
  transition: all 0.3s;
}

.tabs-section .p-button.active-tab {
  border-bottom-color: var(--primary-color);
  color: var(--primary-color);
  font-weight: 600;
}

.view-toggle {
  margin-left: auto;
  display: flex;
  gap: 0.25rem;
  align-items: center;
  padding: 0.5rem;
  background: var(--surface-100);
  border-radius: 8px;
}

.view-toggle .p-button.active {
  background: var(--primary-color);
  color: white;
}

/* Vue par modules */
.modules-view {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.modules-header {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-600));
  color: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.modules-header h3 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.modules-header h3 i {
  font-size: 1.75rem;
}

.modules-subtitle {
  margin: 0.5rem 0 0 0;
  opacity: 0.9;
  font-size: 0.938rem;
}

.modules-header :deep(.p-button) {
  background: white;
  color: var(--primary-color);
  border-color: white;
}

.modules-header :deep(.p-button:hover) {
  background: rgba(255, 255, 255, 0.9);
  border-color: white;
}

@media (max-width: 768px) {
  .modules-header {
    flex-direction: column;
    align-items: flex-start;
  }
}

/* Dialog ajouter vidéo */
.add-to-module-content {
  max-height: 60vh;
  overflow-y: auto;
}

.no-vimeo-message {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
}

.no-vimeo-message i {
  font-size: 3rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.vimeo-selection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.vimeo-selection-card {
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  overflow: hidden;
  transition: border-color 0.2s;
}

.vimeo-selection-card:hover {
  border-color: var(--primary-color);
}

.vimeo-thumb {
  width: 100%;
  aspect-ratio: 16/9;
  object-fit: cover;
}

.vimeo-info {
  padding: 1rem;
}

.vimeo-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.938rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.vimeo-info span {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.vimeo-selection-card .p-button {
  width: 100%;
  margin-top: 0.5rem;
}

/* Stats rapides */
.quick-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
}

.stat-card i {
  font-size: 2rem;
  color: var(--primary-color);
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color);
}

.stat-label {
  display: block;
  font-size: 0.813rem;
  color: var(--text-color-secondary);
}

/* Filtres */
.filters-section {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid var(--surface-border);
}

.search-bar {
  margin-bottom: 1rem;
}

.filters-row {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.filter-item {
  min-width: 200px;
  flex: 1;
}

/* Grille vidéos */
.videos-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* Transitions pour les vidéos */
.video-list-enter-active,
.video-list-leave-active {
  transition: all 0.3s ease;
}

.video-list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.video-list-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

.video-list-move {
  transition: transform 0.3s ease;
}

.video-card {
  background: var(--surface-card);
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid var(--surface-border);
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
}

.video-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.video-thumbnail {
  position: relative;
  padding-top: 56.25%; /* 16:9 */
  background: var(--surface-100);
  cursor: pointer;
  overflow: hidden;
}

.video-thumbnail img {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.4);
  opacity: 0;
  transition: opacity 0.3s;
}

.video-thumbnail:hover .play-overlay {
  opacity: 1;
}

.play-overlay i {
  font-size: 3rem;
  color: white;
}

.duration-badge {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.library-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  font-size: 0.7rem;
}

.video-info {
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  flex: 1;
}

.video-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.video-meta {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.module-tag, .year-tag {
  font-size: 0.75rem;
}

.video-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

.video-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 0.75rem 0;
  align-items: center;
}

.tag-small {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.more-tags {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
  font-weight: 600;
}

.video-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.813rem;
  color: var(--text-color-secondary);
}

.video-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.75rem;
  border-top: 1px solid var(--surface-border);
}

.action-btn {
  flex: 1;
  font-size: 0.875rem;
}

/* Player */
.player-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.player-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
}

.info-row h4 {
  margin: 0 0 0.5rem 0;
}

.player-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

.player-actions {
  display: flex;
  gap: 1rem;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
  background: var(--surface-card);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
}

.empty-state i {
  font-size: 4rem;
  color: var(--text-color-secondary);
  margin-bottom: 1rem;
}

.empty-state h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.empty-state p {
  margin: 0;
  color: var(--text-color-secondary);
}

/* Stats dialog */
.stats-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
}

.stat-value-large {
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary-color);
}

/* Responsive */
@media (max-width: 768px) {
  .videos-grid {
    grid-template-columns: 1fr;
  }
  
  .filters-row {
    flex-direction: column;
  }
  
  .filter-item {
    width: 100%;
  }
}
</style>
