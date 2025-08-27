<template>
  <Navbar />
  <div class="module-videos-page">
    <!-- Header du module -->
    <div class="module-header">
      <Button 
        icon="pi pi-arrow-left" 
        @click="goBack"
        class="back-btn"
        text
      />
      
      <div class="module-info">
        <h1>{{ module?.name }}</h1>
        <p>{{ module?.description }}</p>
        
        <div class="module-stats">
          <div class="stat">
            <i class="pi pi-video"></i>
            <span>{{ videos.length }} vidéos</span>
          </div>
          <div class="stat">
            <i class="pi pi-check-circle"></i>
            <span>{{ validatedVideos.length }} validées</span>
          </div>
          <div class="stat">
            <i class="pi pi-clock"></i>
            <span>{{ pendingVideos.length }} en attente</span>
          </div>
          <div class="stat">
            <i class="pi pi-times-circle"></i>
            <span>{{ rejectedVideos.length }} à revoir</span>
          </div>
        </div>
      </div>

      <div class="module-actions">
        <Button 
          label="Tout valider" 
          icon="pi pi-check" 
          @click="validateAllVideos"
          :disabled="pendingVideos.length === 0"
        />
        <Button 
          label="Exporter rapport" 
          icon="pi pi-download" 
          @click="exportReport"
          outlined
        />
      </div>
    </div>

    <!-- Filtres -->
    <div class="filters-section">
      <div class="search-bar">
        <InputText 
          v-model="searchQuery" 
          placeholder="Rechercher une vidéo..." 
          class="search-input"
        />
      </div>
      
      <div class="filter-buttons">
        <Button 
          :class="{ 'active': selectedStatus === 'all' }"
          @click="selectedStatus = 'all'"
          label="Toutes" 
          outlined 
        />
        <Button 
          :class="{ 'active': selectedStatus === 'pending' }"
          @click="selectedStatus = 'pending'"
          label="En attente" 
          outlined 
        />
        <Button 
          :class="{ 'active': selectedStatus === 'validated' }"
          @click="selectedStatus = 'validated'"
          label="Validées" 
          outlined 
        />
        <Button 
          :class="{ 'active': selectedStatus === 'rejected' }"
          @click="selectedStatus = 'rejected'"
          label="À revoir" 
          outlined 
        />
      </div>

      <div class="view-toggle">
        <Button 
          :class="{ 'active': viewMode === 'grid' }"
          @click="viewMode = 'grid'"
          icon="pi pi-th-large"
          outlined
        />
        <Button 
          :class="{ 'active': viewMode === 'list' }"
          @click="viewMode = 'list'"
          icon="pi pi-list"
          outlined
        />
      </div>
    </div>

    <!-- Liste des vidéos -->
    <div class="videos-container" :class="viewMode">
      <div 
        v-for="video in filteredVideos" 
        :key="video.id"
        class="video-card"
        @click="navigateToVideoValidation(video.id)"
      >
        <!-- Thumbnail -->
        <div class="video-thumbnail">
          <img 
            :src="video.thumbnail" 
            :alt="video.title"
            class="thumbnail-image"
          />
          <div class="video-duration">{{ video.duration }}</div>
          <div class="status-badge" :class="video.status">
            <i :class="getStatusIcon(video.status)"></i>
          </div>
          <div class="play-overlay">
            <i class="pi pi-play"></i>
          </div>
        </div>

        <!-- Informations vidéo -->
        <div class="video-info">
          <h3 class="video-title">{{ video.title }}</h3>
          <p class="video-description">{{ video.description }}</p>
          
          <div class="video-meta">
            <span class="upload-date">
              <i class="pi pi-calendar"></i>
              {{ formatDate(video.uploadDate) }}
            </span>
            <span class="file-size">
              <i class="pi pi-file"></i>
              {{ video.fileSize }}
            </span>
          </div>

          <!-- Commentaires récents -->
          <div v-if="video.comments?.length > 0" class="recent-comments">
            <div class="comment-preview">
              <i class="pi pi-comment"></i>
              <span>{{ video.comments.length }} commentaire(s)</span>
            </div>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="video-actions">
          <Button 
            icon="pi pi-eye" 
            class="action-btn"
            @click.stop="navigateToVideoValidation(video.id)"
            v-tooltip="'Valider/Commenter'"
          />
          <Button 
            icon="pi pi-link" 
            class="action-btn"
            @click.stop="copyVideoLink(video)"
            v-tooltip="'Copier le lien'"
          />
          <Button 
            icon="pi pi-download" 
            class="action-btn"
            @click.stop="downloadVideo(video)"
            v-tooltip="'Télécharger'"
          />
          
          <!-- Actions de validation rapide -->
          <div class="quick-validation">
            <Button 
              icon="pi pi-check" 
              class="validate-btn"
              @click.stop="quickValidate(video, 'validated')"
              v-tooltip="'Valider rapidement'"
              :disabled="video.status === 'validated'"
            />
            <Button 
              icon="pi pi-times" 
              class="reject-btn"
              @click.stop="quickValidate(video, 'rejected')"
              v-tooltip="'Rejeter rapidement'"
              :disabled="video.status === 'rejected'"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Message si aucune vidéo -->
    <div v-if="filteredVideos.length === 0" class="no-videos">
      <i class="pi pi-video"></i>
      <h3>Aucune vidéo trouvée</h3>
      <p>Aucune vidéo ne correspond à vos critères de recherche.</p>
    </div>

    <!-- Toast pour notifications -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { getModuleById, getModuleVideos, updateVideo } from '@/service/moduleService'
import Navbar from '@/components/common/utils/Navbar.vue'

const router = useRouter()
const route = useRoute()
const toast = useToast()

// État réactif
const module = ref(null)
const videos = ref([])
const searchQuery = ref('')
const selectedStatus = ref('all')
const viewMode = ref('grid')
const loading = ref(false)

// Computed
const filteredVideos = computed(() => {
  let filtered = videos.value

  // Filtrer par recherche
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(video => 
      video.title.toLowerCase().includes(query) ||
      video.description.toLowerCase().includes(query)
    )
  }

  // Filtrer par statut
  if (selectedStatus.value !== 'all') {
    filtered = filtered.filter(video => video.status === selectedStatus.value)
  }

  return filtered
})

const validatedVideos = computed(() => 
  videos.value.filter(v => v.status === 'validated')
)

const pendingVideos = computed(() => 
  videos.value.filter(v => v.status === 'pending')
)

const rejectedVideos = computed(() => 
  videos.value.filter(v => v.status === 'rejected')
)

// Méthodes
const goBack = () => {
  router.push('/modules')
}

const navigateToVideoValidation = (videoId) => {
  router.push(`/modules/${route.params.moduleId}/videos/${videoId}/validation`)
}

const copyVideoLink = async (video) => {
  const url = `${window.location.origin}/modules/${route.params.moduleId}/videos/${video.id}/validation`
  try {
    await navigator.clipboard.writeText(url)
    toast.add({
      severity: 'success',
      summary: 'Lien copié',
      detail: `Lien de la vidéo "${video.title}" copié dans le presse-papiers`,
      life: 3000
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de copier le lien',
      life: 3000
    })
  }
}

const downloadVideo = (video) => {
  // Simuler le téléchargement
  toast.add({
    severity: 'info',
    summary: 'Téléchargement',
    detail: `Téléchargement de "${video.title}" en cours...`,
    life: 3000
  })
}

const quickValidate = async (video, newStatus) => {
  try {
    await updateVideo(route.params.moduleId, video.id, { status: newStatus })
    video.status = newStatus
    const statusText = newStatus === 'validated' ? 'validée' : 'rejetée'
    toast.add({
      severity: newStatus === 'validated' ? 'success' : 'warn',
      summary: `Vidéo ${statusText}`,
      detail: `"${video.title}" a été ${statusText}`,
      life: 3000
    })
  } catch (error) {
    console.error('Error updating video status:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de mettre à jour le statut de la vidéo',
      life: 3000
    })
  }
}

const validateAllVideos = async () => {
  try {
    const pendingVideosList = pendingVideos.value
    const promises = pendingVideosList.map(video => 
      updateVideo(route.params.moduleId, video.id, { status: 'validated' })
    )
    
    await Promise.all(promises)
    
    // Mettre à jour le statut local
    pendingVideosList.forEach(video => {
      video.status = 'validated'
    })
    
    toast.add({
      severity: 'success',
      summary: 'Validation en masse',
      detail: `${pendingVideosList.length} vidéos validées`,
      life: 3000
    })
  } catch (error) {
    console.error('Error validating all videos:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de valider toutes les vidéos',
      life: 3000
    })
  }
}

const exportReport = () => {
  toast.add({
    severity: 'info',
    summary: 'Export en cours',
    detail: 'Génération du rapport en cours...',
    life: 3000
  })
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'validated': return 'pi pi-check-circle'
    case 'rejected': return 'pi pi-times-circle'
    case 'pending': return 'pi pi-clock'
    default: return 'pi pi-circle'
  }
}

const formatDate = (date) => {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

// Lifecycle
onMounted(async () => {
  const moduleId = route.params.moduleId
  module.value = await getModuleById(moduleId)
  videos.value = await getModuleVideos(moduleId)
})
</script>

<style scoped>
.module-videos-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.module-header {
  display: flex;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.back-btn {
  margin-top: 0.5rem;
}

.module-info {
  flex: 1;
}

.module-info h1 {
  font-size: 2rem;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.module-info p {
  color: #6b7280;
  margin-bottom: 1rem;
}

.module-stats {
  display: flex;
  gap: 2rem;
}

.stat {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
}

.stat i {
  color: var(--primary-color);
}

.module-actions {
  display: flex;
  gap: 1rem;
}

.filters-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.search-bar {
  flex: 1;
  max-width: 300px;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
}

.filter-buttons .p-button.active,
.view-toggle .p-button.active {
  background-color: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
}

.view-toggle {
  display: flex;
  gap: 0.25rem;
}

.videos-container {
  display: grid;
  gap: 1.5rem;
}

.videos-container.grid {
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
}

.videos-container.list {
  grid-template-columns: 1fr;
}

.video-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  position: relative;
}

.video-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
}

.videos-container.list .video-card {
  display: flex;
  align-items: center;
}

.video-thumbnail {
  position: relative;
  height: 180px;
  overflow: hidden;
}

.videos-container.list .video-thumbnail {
  width: 320px;
  height: 180px;
  flex-shrink: 0;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-duration {
  position: absolute;
  bottom: 0.5rem;
  right: 0.5rem;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
}

.status-badge {
  position: absolute;
  top: 0.5rem;
  left: 0.5rem;
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-badge.validated {
  background: rgba(16, 185, 129, 0.9);
  color: white;
}

.status-badge.rejected {
  background: rgba(239, 68, 68, 0.9);
  color: white;
}

.status-badge.pending {
  background: rgba(245, 158, 11, 0.9);
  color: white;
}

.play-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 3rem;
  height: 3rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-card:hover .play-overlay {
  opacity: 1;
}

.play-overlay i {
  font-size: 1.25rem;
  color: var(--primary-color);
  margin-left: 0.125rem;
}

.video-info {
  padding: 1.5rem;
  flex: 1;
}

.videos-container.list .video-info {
  padding: 1rem 1.5rem;
}

.video-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.video-description {
  color: #6b7280;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.video-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.video-meta span {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.recent-comments {
  margin-top: 0.5rem;
}

.comment-preview {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: var(--primary-color);
}

.video-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.video-card:hover .video-actions {
  opacity: 1;
}

.videos-container.list .video-actions {
  position: static;
  opacity: 1;
  flex-direction: row;
  margin-left: auto;
  padding: 1rem;
}

.action-btn,
.validate-btn,
.reject-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: white;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.validate-btn {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.reject-btn {
  background: #ef4444;
  border-color: #ef4444;
  color: white;
}

.quick-validation {
  display: flex;
  gap: 0.25rem;
}

.no-videos {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.no-videos i {
  font-size: 4rem;
  margin-bottom: 1rem;
  color: #d1d5db;
}

.no-videos h3 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .module-videos-page {
    padding: 1rem;
  }
  
  .module-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .module-actions {
    justify-content: stretch;
  }
  
  .filters-section {
    flex-direction: column;
    align-items: stretch;
  }
  
  .videos-container.grid {
    grid-template-columns: 1fr;
  }
  
  .videos-container.list .video-card {
    flex-direction: column;
  }
  
  .videos-container.list .video-thumbnail {
    width: 100%;
  }
}
</style>
