<template>
  <div class="video-library-view">
    <Navbar />
    
    <div class="library-container">
      <!-- Header -->
      <div class="library-header">
        <div class="header-content">
          <div class="title-section">
            <h1>
              <i class="pi pi-video"></i>
              Bibliothèque Vidéo
            </h1>
            <p class="subtitle">{{ displayedVideos.length }} vidéos disponibles</p>
          </div>
          
          <div class="header-actions">
            <Button 
              label="Charger Vimeo" 
              icon="pi pi-cloud-download" 
              outlined
              :loading="loadingVimeo"
              @click="loadVimeoVideos"
              v-if="activeTab === 'vimeo'"
            />
            <Button 
              label="Statistiques" 
              icon="pi pi-chart-bar" 
              outlined
              @click="showStatsDialog = true"
            />
            <Button 
              label="Actualiser" 
              icon="pi pi-refresh" 
              outlined
              :loading="loading"
              @click="loadVideos"
            />
          </div>
        </div>

        <!-- Onglets -->
        <div class="tabs-section">
          <Button 
            label="Bibliothèque" 
            icon="pi pi-database"
            :class="{ 'active-tab': activeTab === 'library' }"
            @click="activeTab = 'library'"
            text
          />
          <Button 
            label="Vimeo" 
            icon="pi pi-cloud"
            :class="{ 'active-tab': activeTab === 'vimeo' }"
            @click="activeTab = 'vimeo'"
            text
          />
        </div>

        <!-- Stats rapides -->
        <div class="quick-stats">
          <div class="stat-card">
            <i class="pi pi-video"></i>
            <div>
              <span class="stat-value">{{ videos.length }}</span>
              <span class="stat-label">Vidéos totales</span>
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
            v-if="activeTab === 'library'"
            v-model="filterYear" 
            :options="yearOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Toutes les années"
            class="filter-item"
            showClear
          />
          
          <Dropdown 
            v-if="activeTab === 'library'"
            v-model="filterModule" 
            :options="moduleOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Tous les modules"
            class="filter-item"
            showClear
          />

          <Dropdown 
            v-model="filterType" 
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            :placeholder="activeTab === 'library' ? 'Tous les types' : 'Toutes les vidéos'"
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

      <!-- Grille de vidéos - Bibliothèque -->
      <div v-if="activeTab === 'library' && filteredVideos.length > 0" class="videos-grid">
        <div 
          v-for="video in filteredVideos" 
          :key="video.id"
          class="video-card"
        >
          <!-- Thumbnail -->
          <div class="video-thumbnail" @click="playVideo(video)">
            <img 
              :src="getVimeoThumbnail(video.vimeo_id)" 
              :alt="video.title"
              @error="handleThumbnailError"
            />
            <div class="play-overlay">
              <i class="pi pi-play"></i>
            </div>
            <div v-if="video.duration" class="duration-badge">
              {{ formatDuration(video.duration) }}
            </div>
          </div>

          <!-- Infos -->
          <div class="video-info">
            <h3 class="video-title" v-tooltip.top="video.title">{{ video.title }}</h3>
            
            <div class="video-meta">
              <Tag v-if="video.modules" :value="video.modules.title" severity="info" class="module-tag" />
              <Tag v-if="video.years" :value="video.years.name" severity="secondary" class="year-tag" />
            </div>

            <p v-if="video.description" class="video-description">
              {{ truncateText(video.description, 100) }}
            </p>

            <div class="video-details">
              <span v-if="video.person_filmed" class="detail-item">
                <i class="pi pi-user"></i>
                {{ video.person_filmed }}
              </span>
              <span class="detail-item">
                <i class="pi pi-calendar"></i>
                {{ formatDate(video.published_date) }}
              </span>
            </div>

            <!-- Actions -->
            <div class="video-actions">
              <Button 
                label="Visionner" 
                icon="pi pi-play" 
                @click="playVideo(video)"
                class="action-btn"
              />
              <Button 
                label="Copier lien" 
                icon="pi pi-copy" 
                outlined
                @click="copyLink(video.vimeo_url)"
                class="action-btn"
              />
              <Button 
                icon="pi pi-ellipsis-v" 
                text
                @click="showVideoMenu($event, video)"
                class="action-btn"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Grille de vidéos - Vimeo -->
      <div v-if="activeTab === 'vimeo' && filteredVimeoVideos.length > 0" class="videos-grid">
        <div 
          v-for="video in filteredVimeoVideos" 
          :key="video.vimeo_id"
          class="video-card"
        >
          <!-- Thumbnail -->
          <div class="video-thumbnail" @click="playVideo(video)">
            <img 
              :src="video.thumbnail_url || getVimeoThumbnail(video.vimeo_id)" 
              :alt="video.title"
              @error="handleThumbnailError"
            />
            <div class="play-overlay">
              <i class="pi pi-play"></i>
            </div>
            <div v-if="video.duration" class="duration-badge">
              {{ formatDuration(video.duration) }}
            </div>
            <Tag v-if="video.in_library" value="Dans bibliothèque" severity="success" class="library-badge" />
          </div>

          <!-- Infos -->
          <div class="video-info">
            <h3 class="video-title" v-tooltip.top="video.title">{{ video.title }}</h3>
            
            <p v-if="video.description" class="video-description">
              {{ truncateText(video.description, 100) }}
            </p>

            <!-- Actions -->
            <div class="video-actions">
              <Button 
                label="Visionner" 
                icon="pi pi-play" 
                @click="playVideo(video)"
                class="action-btn"
              />
              <Button 
                label="Copier lien" 
                icon="pi pi-copy" 
                outlined
                @click="copyLink(video.vimeo_url)"
                class="action-btn"
              />
              <Button 
                v-if="!video.in_library"
                label="Ajouter à la bibliothèque" 
                icon="pi pi-plus" 
                outlined
                severity="success"
                @click="addToLibrary(video)"
                class="action-btn"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="(activeTab === 'library' && filteredVideos.length === 0) || (activeTab === 'vimeo' && filteredVimeoVideos.length === 0)" class="empty-state">
        <i class="pi pi-video"></i>
        <h3>Aucune vidéo trouvée</h3>
        <p v-if="activeTab === 'library'">Les vidéos des tickets terminés apparaîtront automatiquement ici</p>
        <p v-else>Cliquez sur "Charger Vimeo" pour afficher vos vidéos</p>
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
          <span class="stat-label">Vidéos totales</span>
          <span class="stat-value-large">{{ videos.length }}</span>
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

    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/common/utils/Navbar.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'
import Menu from 'primevue/menu'
import Divider from 'primevue/divider'
import Toast from 'primevue/toast'
import { getAllVideos, deleteVideo, getVimeoThumbnailUrl, getVimeoEmbedUrl, getVimeoVideos, checkVimeoVideosInLibrary } from '@/service/videoLibraryService'
import { getAllModules } from '@/service/mediaService'

const router = useRouter()
const toast = useToast()

const videos = ref([])
const vimeoVideos = ref([])
const modules = ref([])
const years = ref([])
const selectedVideo = ref(null)
const showPlayer = ref(false)
const showStatsDialog = ref(false)
const videoMenu = ref(null)
const loading = ref(false)
const loadingVimeo = ref(false)
const activeTab = ref('library')

// Filtres
const searchQuery = ref('')
const filterYear = ref(null)
const filterModule = ref(null)
const filterType = ref(null)
const sortBy = ref('date_desc')

const typeOptions = computed(() => {
  if (activeTab.value === 'library') {
    return [
      { label: 'Cours', value: 'cours' },
      { label: 'TP', value: 'tp' },
      { label: 'Démonstration', value: 'demo' },
      { label: 'Simulation', value: 'simulation' },
      { label: 'Autre', value: 'autre' }
    ]
  } else {
    return [
      { label: 'Toutes', value: null },
      { label: 'Dans la bibliothèque', value: 'in_library' },
      { label: 'Pas dans la bibliothèque', value: 'not_in_library' }
    ]
  }
})

const sortOptions = [
  { label: 'Plus récent', value: 'date_desc' },
  { label: 'Plus ancien', value: 'date_asc' },
  { label: 'Titre A-Z', value: 'title_asc' },
  { label: 'Titre Z-A', value: 'title_desc' },
  { label: 'Durée croissante', value: 'duration_asc' },
  { label: 'Durée décroissante', value: 'duration_desc' }
]

// Options dynamiques
const yearOptions = computed(() => {
  const uniqueYears = [...new Set(videos.value.map(v => v.years?.id).filter(Boolean))]
  return [
    { label: 'Toutes les années', value: null },
    ...uniqueYears.map(id => {
      const year = videos.value.find(v => v.years?.id === id)?.years
      return { label: year?.name || 'Année inconnue', value: id }
    })
  ]
})

const moduleOptions = computed(() => {
  const uniqueModules = [...new Set(videos.value.map(v => v.modules?.id).filter(Boolean))]
  return [
    { label: 'Tous les modules', value: null },
    ...uniqueModules.map(id => {
      const module = videos.value.find(v => v.modules?.id === id)?.modules
      return { label: module?.title || 'Module inconnu', value: id }
    })
  ]
})

// Vidéos filtrées - Bibliothèque
const filteredVideos = computed(() => {
  let filtered = [...videos.value]
  
  // Recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(v => 
      v.title.toLowerCase().includes(query) ||
      v.description?.toLowerCase().includes(query) ||
      v.person_filmed?.toLowerCase().includes(query)
    )
  }
  
  // Filtres
  if (filterYear.value) {
    filtered = filtered.filter(v => v.year_id === filterYear.value)
  }
  
  if (filterModule.value) {
    filtered = filtered.filter(v => v.module_id === filterModule.value)
  }
  
  if (filterType.value) {
    filtered = filtered.filter(v => v.type === filterType.value)
  }
  
  // Tri
  switch (sortBy.value) {
    case 'date_desc':
      filtered.sort((a, b) => new Date(b.published_date || b.created_at) - new Date(a.published_date || a.created_at))
      break
    case 'date_asc':
      filtered.sort((a, b) => new Date(a.published_date || a.created_at) - new Date(b.published_date || b.created_at))
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

// Vidéos filtrées - Vimeo
const filteredVimeoVideos = computed(() => {
  let filtered = [...vimeoVideos.value]
  
  // Recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(v => 
      v.title.toLowerCase().includes(query) ||
      v.description?.toLowerCase().includes(query)
    )
  }
  
  // Filtre par statut dans bibliothèque
  if (filterType.value === 'in_library') {
    filtered = filtered.filter(v => v.in_library)
  } else if (filterType.value === 'not_in_library') {
    filtered = filtered.filter(v => !v.in_library)
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

// Vidéos affichées selon l'onglet actif
const displayedVideos = computed(() => {
  return activeTab.value === 'library' ? filteredVideos.value : filteredVimeoVideos.value
})

// Stats
const totalDuration = computed(() => {
  const total = videos.value.reduce((sum, v) => sum + (v.duration || 0), 0)
  return Math.round(total / 60) // Convertir en heures
})

const uniqueModules = computed(() => {
  return new Set(videos.value.map(v => v.module_id).filter(Boolean)).size
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
  },
  {
    separator: true
  },
  {
    label: 'Supprimer',
    icon: 'pi pi-trash',
    command: () => deleteVideoConfirm(selectedVideo.value.id)
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

async function deleteVideoConfirm(videoId) {
  // TODO: Ajouter confirmation
  try {
    await deleteVideo(videoId)
    toast.add({ 
      severity: 'success', 
      summary: 'Vidéo supprimée', 
      detail: 'La vidéo a été retirée de la bibliothèque',
      life: 3000 
    })
    await loadVideos()
  } catch (error) {
    console.error('[VideoLibrary] Erreur suppression:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur', 
      detail: 'Impossible de supprimer la vidéo',
      life: 3000 
    })
  }
}

async function loadVideos() {
  loading.value = true
  try {
    videos.value = await getAllVideos()
  } catch (error) {
    console.error('[VideoLibrary] Erreur chargement:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur', 
      detail: 'Impossible de charger les vidéos',
      life: 4000 
    })
  } finally {
    loading.value = false
  }
}

async function loadVimeoVideos() {
  loadingVimeo.value = true
  try {
    const vimeoList = await getVimeoVideos()
    vimeoVideos.value = await checkVimeoVideosInLibrary(vimeoList)
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
  }
}

async function addToLibrary(video) {
  try {
    const { addVideoToLibrary } = await import('@/service/videoLibraryService')
    await addVideoToLibrary({
      vimeo_url: video.vimeo_url,
      title: video.title,
      description: video.description,
      thumbnail_url: video.thumbnail_url,
      duration: video.duration,
      type: 'cours'
    })
    
    video.in_library = true
    toast.add({ 
      severity: 'success', 
      summary: 'Vidéo ajoutée', 
      detail: 'La vidéo a été ajoutée à la bibliothèque',
      life: 3000 
    })
    
    await loadVideos() // Recharger la bibliothèque
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
  await loadVideos()
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
