<template>
  <Navbar />
  <div class="page-wrapper">
    <div class="media-content-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>
              <i class="pi pi-video text-primary"></i>
              Gestion du Contenu Multimédia
            </h1>
            <p class="text-600">Vidéos Vimeo organisées par modules</p>
          </div>
        </div>

        <!-- Filtres -->
        <div class="filters-section mt-4">
          <div class="grid">
            <div class="col-12 md:col-4">
              <Dropdown
                v-model="filterModule"
                :options="moduleOptions"
                optionLabel="title"
                optionValue="id"
                placeholder="Tous les modules"
                class="w-full"
                showClear
                filter
              />
            </div>
            <div class="col-12 md:col-4">
              <Dropdown
                v-model="filterYear"
                :options="yearOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Toutes les années"
                class="w-full"
                showClear
              />
            </div>
            <div class="col-12 md:col-4">
              <InputText
                v-model="searchQuery"
                placeholder="Rechercher une vidéo..."
                class="w-full"
              >
                <template #prepend>
                  <i class="pi pi-search"></i>
                </template>
              </InputText>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="stats-cards">
        <div class="stat-card">
          <div class="stat-icon video-icon">
            <i class="pi pi-video"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Total vidéos</span>
            <span class="stat-value">{{ publishedVideos.length }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon module-icon">
            <i class="pi pi-book"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Modules avec vidéos</span>
            <span class="stat-value">{{ modulesWithVideos }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon duration-icon">
            <i class="pi pi-clock"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Durée totale</span>
            <span class="stat-value">{{ totalDuration }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon recent-icon">
            <i class="pi pi-calendar"></i>
          </div>
          <div class="stat-content">
            <span class="stat-label">Ce mois-ci</span>
            <span class="stat-value">{{ videosThisMonth }}</span>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <ProgressSpinner />
        <p>Chargement des vidéos...</p>
      </div>

      <!-- Contenu groupé par modules -->
      <div v-else class="modules-grid">
        <div 
          v-for="module in filteredModules" 
          :key="module.id"
          class="module-card"
        >
          <div class="module-header">
            <div class="module-info">
              <h3>{{ module.title }}</h3>
              <div class="module-meta">
                <Tag :value="`${module.year}`" severity="info" class="mr-2" />
                <Tag :value="`${getModuleVideos(module.id).length} vidéo(s)`" severity="secondary" />
              </div>
            </div>
            <Button 
              icon="pi pi-plus" 
              label="Ajouter"
              @click="addVideoToModule(module)"
              outlined
              size="small"
            />
          </div>

          <Divider />

          <!-- Liste des vidéos du module -->
          <div class="videos-list">
            <div 
              v-for="video in getModuleVideos(module.id)" 
              :key="video.id"
              class="video-item"
              @click="openVideoDialog(video)"
            >
              <div class="video-thumbnail">
                <img v-if="video.metadata?.thumbnail" :src="video.metadata.thumbnail" alt="Thumbnail" />
                <div v-else class="thumbnail-placeholder">
                  <i class="pi pi-video"></i>
                </div>
                <div class="video-duration" v-if="video.metadata?.duration_minutes">
                  {{ video.metadata.duration_minutes }} min
                </div>
              </div>

              <div class="video-info">
                <h4>{{ video.title }}</h4>
                <p v-if="video.metadata?.person_filmed" class="video-meta">
                  <i class="pi pi-user"></i>
                  {{ video.metadata.person_filmed }}
                </p>
                <p class="video-meta">
                  <i class="pi pi-calendar"></i>
                  {{ formatDate(video.published_at) }}
                </p>
              </div>

              <div class="video-actions">
                <Button 
                  icon="pi pi-external-link" 
                  @click.stop="openVimeoUrl(video.vimeo_url)"
                  text
                  rounded
                  v-tooltip="'Voir sur Vimeo'"
                />
                <Button 
                  icon="pi pi-pencil" 
                  @click.stop="editVideo(video)"
                  text
                  rounded
                  v-tooltip="'Modifier'"
                />
              </div>
            </div>

            <!-- Message si aucune vidéo -->
            <div v-if="getModuleVideos(module.id).length === 0" class="empty-videos">
              <i class="pi pi-inbox text-400"></i>
              <p class="text-500">Aucune vidéo publiée pour ce module</p>
            </div>
          </div>
        </div>

        <!-- Message si aucun module -->
        <div v-if="filteredModules.length === 0" class="empty-state">
          <i class="pi pi-inbox text-6xl text-400"></i>
          <p class="text-xl text-500">Aucun module trouvé</p>
        </div>
      </div>

      <!-- Dialog de détails vidéo -->
      <Dialog
        v-model:visible="showVideoDialog"
        modal
        header="Détails de la vidéo"
        :style="{ width: '700px' }"
      >
        <div v-if="selectedVideo" class="video-details">
          <!-- Player Vimeo intégré -->
          <div v-if="selectedVideo.vimeo_id" class="vimeo-player mb-4">
            <iframe 
              :src="`https://player.vimeo.com/video/${selectedVideo.vimeo_id}`"
              width="100%"
              height="400"
              frameborder="0"
              allow="autoplay; fullscreen; picture-in-picture"
              allowfullscreen
            ></iframe>
          </div>

          <h3>{{ selectedVideo.title }}</h3>
          <p v-if="selectedVideo.description">{{ selectedVideo.description }}</p>

          <Divider />

          <div class="detail-grid">
            <div class="detail-item">
              <span class="detail-label">Module</span>
              <span class="detail-value">{{ selectedVideo.module?.title }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Date de publication</span>
              <span class="detail-value">{{ formatDate(selectedVideo.published_at) }}</span>
            </div>
            <div v-if="selectedVideo.metadata?.person_filmed" class="detail-item">
              <span class="detail-label">Personne filmée</span>
              <span class="detail-value">{{ selectedVideo.metadata.person_filmed }}</span>
            </div>
            <div v-if="selectedVideo.metadata?.modality" class="detail-item">
              <span class="detail-label">Modalité</span>
              <span class="detail-value">{{ selectedVideo.metadata.modality }}</span>
            </div>
          </div>

          <div class="mt-4 flex gap-2">
            <Button 
              label="Voir sur Vimeo" 
              icon="pi pi-external-link"
              @click="openVimeoUrl(selectedVideo.vimeo_url)"
              outlined
            />
            <Button 
              label="Modifier" 
              icon="pi pi-pencil"
              @click="editVideo(selectedVideo)"
              outlined
            />
          </div>
        </div>
      </Dialog>

      <Toast />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Navbar from '@/components/common/utils/Navbar.vue'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import ProgressSpinner from 'primevue/progressspinner'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import ticketService from '@/service/ticketService'
import { useModules } from '@/composables/useModules'

const router = useRouter()
const toast = useToast()

// State
const loading = ref(true)
const publishedVideos = ref([])
const selectedVideo = ref(null)
const showVideoDialog = ref(false)

// Filtres
const filterModule = ref(null)
const filterYear = ref(null)
const searchQuery = ref('')

// Modules
const { modules: supabaseModules, loadModules } = useModules()
const moduleOptions = computed(() => supabaseModules.value || [])

// Options d'années
const yearOptions = [
  { label: 'Toutes les années', value: null },
  { label: '1ère année', value: 1 },
  { label: '2ème année', value: 2 },
  { label: '3ème année', value: 3 }
]

// Charger les vidéos publiées
async function loadPublishedVideos() {
  loading.value = true
  try {
    const allTickets = await ticketService.getAllTickets()
    
    // Filtrer seulement les tickets vidéo avec vimeo_id
    publishedVideos.value = allTickets.filter(ticket => 
      ticket.type === 'video' && 
      ticket.vimeo_id && 
      ticket.status === 'done'
    )
    
    console.log('[MediaContent] ✅ Vidéos publiées:', publishedVideos.value.length)
  } catch (error) {
    console.error('[MediaContent] ❌ Erreur:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les vidéos',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Modules filtrés
const filteredModules = computed(() => {
  let modules = moduleOptions.value

  // Filtre par année
  if (filterYear.value !== null) {
    modules = modules.filter(m => m.year === filterYear.value)
  }

  // Filtre par module spécifique
  if (filterModule.value) {
    modules = modules.filter(m => m.id === filterModule.value)
  }

  // Filtre par recherche
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    modules = modules.filter(m => {
      const hasMatchingVideo = getModuleVideos(m.id).some(v =>
        v.title?.toLowerCase().includes(query)
      )
      return m.title?.toLowerCase().includes(query) || hasMatchingVideo
    })
  }

  return modules
})

// Vidéos d'un module
function getModuleVideos(moduleId) {
  return publishedVideos.value.filter(v => v.module_id === moduleId)
}

// Statistiques
const modulesWithVideos = computed(() => {
  const uniqueModules = new Set(publishedVideos.value.map(v => v.module_id))
  return uniqueModules.size
})

const totalDuration = computed(() => {
  const total = publishedVideos.value.reduce((sum, v) => {
    return sum + (v.metadata?.duration_minutes || 0)
  }, 0)
  
  const hours = Math.floor(total / 60)
  const minutes = total % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`
  }
  return `${minutes}min`
})

const videosThisMonth = computed(() => {
  const now = new Date()
  const thisMonth = now.getMonth()
  const thisYear = now.getFullYear()
  
  return publishedVideos.value.filter(v => {
    if (!v.published_at) return false
    const publishDate = new Date(v.published_at)
    return publishDate.getMonth() === thisMonth && publishDate.getFullYear() === thisYear
  }).length
})

// Actions
function openVideoDialog(video) {
  selectedVideo.value = video
  showVideoDialog.value = true
}

function openVimeoUrl(url) {
  if (url) {
    window.open(url, '_blank')
  }
}

function editVideo(video) {
  // Rediriger vers le Kanban avec le ticket sélectionné
  router.push({ 
    path: '/admin/academic/kanban',
    query: { ticketId: video.id }
  })
}

function addVideoToModule(module) {
  // Rediriger vers le Kanban pour créer un nouveau ticket vidéo
  router.push({ 
    path: '/admin/academic/kanban',
    query: { 
      type: 'video',
      moduleId: module.id
    }
  })
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

// Lifecycle
onMounted(async () => {
  await loadModules()
  await loadPublishedVideos()
})
</script>

<style scoped>
.page-wrapper {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
}

.page-wrapper::-webkit-scrollbar {
  display: none;
}

.media-content-page {
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border-left: 4px solid var(--primary-color);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.title-section h1 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
}

.filters-section {
  background: var(--surface-50);
  padding: 1.5rem;
  border-radius: 12px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  display: flex;
  gap: 1rem;
  align-items: center;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
}

.video-icon { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
.module-icon { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; }
.duration-icon { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; }
.recent-icon { background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); color: white; }

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.stat-value {
  font-size: 1.75rem;
  font-weight: bold;
  color: var(--text-color);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.modules-grid {
  display: grid;
  gap: 1.5rem;
}

.module-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.module-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.module-info h3 {
  margin: 0 0 0.5rem 0;
  color: var(--text-color);
}

.module-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.videos-list {
  display: grid;
  gap: 1rem;
}

.video-item {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.video-item:hover {
  background: var(--surface-100);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.video-thumbnail {
  width: 120px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
  flex-shrink: 0;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-placeholder {
  width: 100%;
  height: 100%;
  background: var(--surface-200);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: var(--text-color-secondary);
}

.video-duration {
  position: absolute;
  bottom: 4px;
  right: 4px;
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.video-info {
  flex: 1;
}

.video-info h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
}

.video-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: var(--text-color-secondary);
  margin: 0.25rem 0;
}

.video-meta i {
  color: var(--primary-color);
}

.video-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.empty-videos {
  text-align: center;
  padding: 2rem;
  color: var(--text-color-secondary);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.vimeo-player {
  border-radius: 8px;
  overflow: hidden;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.detail-label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.detail-value {
  font-weight: 600;
  color: var(--text-color);
}

@media (max-width: 768px) {
  .video-item {
    flex-direction: column;
  }

  .video-thumbnail {
    width: 100%;
    height: 180px;
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
