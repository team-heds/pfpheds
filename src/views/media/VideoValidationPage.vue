<template>
  <div class="video-validation-page">
    <!-- Header -->
    <div class="page-header">
      <Button 
        icon="pi pi-arrow-left" 
        @click="goBack"
        class="back-btn"
        text
      />
      
      <div class="header-info">
        <h1>{{ video?.title }}</h1>
        <div class="breadcrumb">
          <span>{{ module?.name }}</span>
          <i class="pi pi-chevron-right"></i>
          <span>Validation vidéo</span>
        </div>
      </div>

      <div class="header-actions">
        <Button 
          icon="pi pi-link" 
          @click="copyVideoLink"
          v-tooltip="'Copier le lien'"
          outlined
        />
        <Button 
          icon="pi pi-download" 
          @click="downloadVideo"
          v-tooltip="'Télécharger'"
          outlined
        />
      </div>
    </div>

    <div class="content-layout">
      <!-- Lecteur vidéo -->
      <div class="video-section">
        <div class="video-player">
          <VideoPlayerVimeo 
            v-if="video?.vimeoId"
            :vimeo-id="video.vimeoId"
            :title="video.title"
            class="player"
          />
          <div v-else class="video-placeholder">
            <i class="pi pi-video"></i>
            <p>Lecteur vidéo non disponible</p>
          </div>
        </div>

        <!-- Informations vidéo -->
        <div class="video-details">
          <div class="detail-row">
            <span class="label">Durée :</span>
            <span class="value">{{ video?.duration }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Taille :</span>
            <span class="value">{{ video?.fileSize }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Upload :</span>
            <span class="value">{{ formatDate(video?.uploadDate) }}</span>
          </div>
          <div class="detail-row">
            <span class="label">Format :</span>
            <span class="value">{{ video?.format || 'MP4' }}</span>
          </div>
        </div>
      </div>

      <!-- Panel de validation -->
      <div class="validation-section">
        <!-- Statut actuel -->
        <div class="current-status">
          <h3>Statut actuel</h3>
          <div class="status-display" :class="video?.status">
            <i :class="getStatusIcon(video?.status)"></i>
            <span>{{ getStatusLabel(video?.status) }}</span>
          </div>
        </div>

        <!-- Actions de validation -->
        <div class="validation-actions">
          <h3>Actions de validation</h3>
          
          <div class="action-buttons">
            <Button 
              label="Valider" 
              icon="pi pi-check"
              @click="validateVideo"
              :disabled="video?.status === 'validated'"
              class="validate-btn"
            />
            <Button 
              label="Rejeter" 
              icon="pi pi-times"
              @click="rejectVideo"
              :disabled="video?.status === 'rejected'"
              class="reject-btn"
              outlined
            />
            <Button 
              label="En attente" 
              icon="pi pi-clock"
              @click="setPending"
              :disabled="video?.status === 'pending'"
              outlined
            />
          </div>
        </div>

        <!-- Formulaire de commentaire -->
        <div class="comment-form">
          <h3>Ajouter un commentaire</h3>
          
          <div class="form-group">
            <label>Type de commentaire</label>
            <Dropdown 
              v-model="newComment.type"
              :options="commentTypes"
              option-label="label"
              option-value="value"
              placeholder="Sélectionner un type"
              class="w-full"
            />
          </div>

          <div class="form-group">
            <label>Commentaire</label>
            <Textarea 
              v-model="newComment.text"
              placeholder="Votre commentaire..."
              rows="4"
              class="w-full"
            />
          </div>

          <div class="form-group">
            <label>Timecode (optionnel)</label>
            <InputText 
              v-model="newComment.timecode"
              placeholder="ex: 02:35"
              class="w-full"
            />
          </div>

          <Button 
            label="Ajouter le commentaire" 
            icon="pi pi-plus"
            @click="addComment"
            :disabled="!newComment.text.trim()"
          />
        </div>

        <!-- Liste des commentaires -->
        <div class="comments-list">
          <h3>Commentaires ({{ comments.length }})</h3>
          
          <div v-if="comments.length === 0" class="no-comments">
            <i class="pi pi-comment"></i>
            <p>Aucun commentaire pour cette vidéo</p>
          </div>

          <div 
            v-for="comment in comments" 
            :key="comment.id"
            class="comment-item"
          >
            <div class="comment-header">
              <div class="comment-author">
                <Avatar 
                  :label="comment.author.charAt(0)" 
                  class="author-avatar"
                  size="small"
                />
                <div class="author-info">
                  <span class="author-name">{{ comment.author }}</span>
                  <span class="comment-date">{{ formatDate(comment.date) }}</span>
                </div>
              </div>
              
              <div class="comment-meta">
                <Tag 
                  :value="comment.type" 
                  :class="getCommentTypeClass(comment.type)"
                />
                <span v-if="comment.timecode" class="timecode">
                  {{ comment.timecode }}
                </span>
              </div>
            </div>
            
            <div class="comment-content">
              {{ comment.text }}
            </div>

            <div class="comment-actions">
              <Button 
                icon="pi pi-reply" 
                @click="replyToComment(comment)"
                text
                size="small"
              />
              <Button 
                icon="pi pi-trash" 
                @click="deleteComment(comment.id)"
                text
                size="small"
                class="delete-btn"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast pour notifications -->
    <Toast />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Textarea from 'primevue/textarea'
import InputText from 'primevue/inputtext'
import Avatar from 'primevue/avatar'
import Tag from 'primevue/tag'
import Toast from 'primevue/toast'
import VideoPlayerVimeo from '@/components/media/VideoPlayerVimeo.vue'
import { getModuleById, getVideoById, updateVideo, getVideoComments, addVideoComment, deleteVideoComment } from '@/service/moduleService'

const router = useRouter()
const route = useRoute()
const toast = useToast()

// État réactif
const module = ref(null)
const video = ref(null)
const comments = ref([])
const newComment = ref({
  type: 'general',
  text: '',
  timecode: ''
})

// Types de commentaires
const commentTypes = [
  { label: 'Général', value: 'general' },
  { label: 'Technique', value: 'technical' },
  { label: 'Contenu', value: 'content' },
  { label: 'Audio', value: 'audio' },
  { label: 'Montage', value: 'editing' },
  { label: 'Correction', value: 'correction' }
]

// Lifecycle
onMounted(async () => {
  try {
    const moduleId = route.params.moduleId
    const videoId = route.params.videoId
    
    // Charger le module et la vidéo
    module.value = await getModuleById(moduleId)
    video.value = await getVideoById(moduleId, videoId)
    
    // Charger les commentaires
    comments.value = await getVideoComments(moduleId, videoId)
  } catch (error) {
    console.error('Error loading video data:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données de la vidéo',
      life: 3000
    })
  }
})

// Méthodes
const goBack = () => {
  router.push(`/modules/${route.params.moduleId}/videos`)
}

const copyVideoLink = async () => {
  const url = window.location.href
  try {
    await navigator.clipboard.writeText(url)
    toast.add({
      severity: 'success',
      summary: 'Lien copié',
      detail: 'Lien de la vidéo copié dans le presse-papiers',
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

const downloadVideo = () => {
  toast.add({
    severity: 'info',
    summary: 'Téléchargement',
    detail: 'Téléchargement en cours...',
    life: 3000
  })
}

const validateVideo = async () => {
  try {
    await updateVideo(route.params.moduleId, route.params.videoId, { status: 'validated' })
    video.value.status = 'validated'
    toast.add({
      severity: 'success',
      summary: 'Vidéo validée',
      detail: `"${video.value.title}" a été validée avec succès`,
      life: 3000
    })
  } catch (error) {
    console.error('Error validating video:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de valider la vidéo',
      life: 3000
    })
  }
}

const rejectVideo = async () => {
  try {
    await updateVideo(route.params.moduleId, route.params.videoId, { status: 'rejected' })
    video.value.status = 'rejected'
    toast.add({
      severity: 'warn',
      summary: 'Vidéo rejetée',
      detail: `"${video.value.title}" a été rejetée`,
      life: 3000
    })
  } catch (error) {
    console.error('Error rejecting video:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de rejeter la vidéo',
      life: 3000
    })
  }
}

const setPending = async () => {
  try {
    await updateVideo(route.params.moduleId, route.params.videoId, { status: 'pending' })
    video.value.status = 'pending'
    toast.add({
      severity: 'info',
      summary: 'Statut modifié',
      detail: `"${video.value.title}" est maintenant en attente`,
      life: 3000
    })
  } catch (error) {
    console.error('Error setting video to pending:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de modifier le statut de la vidéo',
      life: 3000
    })
  }
}

const addComment = async () => {
  if (!newComment.value.text.trim()) return

  try {
    const commentData = {
      author: 'Utilisateur actuel', // À remplacer par l'utilisateur connecté
      type: newComment.value.type,
      text: newComment.value.text,
      timecode: newComment.value.timecode
    }

    const comment = await addVideoComment(route.params.moduleId, route.params.videoId, commentData)
    comments.value.unshift(comment)
    
    // Reset form
    newComment.value = {
      type: 'general',
      text: '',
      timecode: ''
    }

    toast.add({
      severity: 'success',
      summary: 'Commentaire ajouté',
      detail: 'Votre commentaire a été ajouté avec succès',
      life: 3000
    })
  } catch (error) {
    console.error('Error adding comment:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'ajouter le commentaire',
      life: 3000
    })
  }
}

const deleteComment = async (commentId) => {
  try {
    await deleteVideoComment(route.params.moduleId, route.params.videoId, commentId)
    const index = comments.value.findIndex(c => c.id === commentId)
    if (index > -1) {
      comments.value.splice(index, 1)
    }
    
    toast.add({
      severity: 'info',
      summary: 'Commentaire supprimé',
      detail: 'Le commentaire a été supprimé',
      life: 3000
    })
  } catch (error) {
    console.error('Error deleting comment:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer le commentaire',
      life: 3000
    })
  }
}

const replyToComment = (comment) => {
  newComment.value.text = `@${comment.author} `
  // Focus sur le textarea
}

const getStatusIcon = (status) => {
  switch (status) {
    case 'validated': return 'pi pi-check-circle'
    case 'rejected': return 'pi pi-times-circle'
    case 'pending': return 'pi pi-clock'
    default: return 'pi pi-circle'
  }
}

const getStatusLabel = (status) => {
  switch (status) {
    case 'validated': return 'Validé'
    case 'rejected': return 'Rejeté'
    case 'pending': return 'En attente'
    default: return 'Inconnu'
  }
}

const getCommentTypeClass = (type) => {
  switch (type) {
    case 'technical': return 'technical-tag'
    case 'content': return 'content-tag'
    case 'audio': return 'audio-tag'
    case 'editing': return 'editing-tag'
    case 'correction': return 'correction-tag'
    default: return 'general-tag'
  }
}

const formatDate = (date) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<style scoped>
.video-validation-page {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.header-info {
  flex: 1;
}

.header-info h1 {
  font-size: 1.75rem;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.content-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
}

.video-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.video-player {
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  aspect-ratio: 16/9;
}

.player {
  width: 100%;
  height: 100%;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}

.video-placeholder i {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.video-details {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  font-weight: 500;
  color: #6b7280;
}

.value {
  color: #1f2937;
}

.validation-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.current-status,
.validation-actions,
.comment-form,
.comments-list {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.current-status h3,
.validation-actions h3,
.comment-form h3,
.comments-list h3 {
  margin-bottom: 1rem;
  color: #1f2937;
  font-size: 1.125rem;
}

.status-display {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  font-weight: 500;
}

.status-display.validated {
  background: #d1fae5;
  color: #065f46;
}

.status-display.rejected {
  background: #fee2e2;
  color: #991b1b;
}

.status-display.pending {
  background: #fef3c7;
  color: #92400e;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.validate-btn {
  background: #10b981;
  border-color: #10b981;
}

.reject-btn {
  color: #ef4444;
  border-color: #ef4444;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.no-comments {
  text-align: center;
  padding: 2rem;
  color: #6b7280;
}

.no-comments i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #d1d5db;
}

.comment-item {
  border-bottom: 1px solid #f3f4f6;
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}

.comment-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.comment-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.comment-author {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.author-info {
  display: flex;
  flex-direction: column;
}

.author-name {
  font-weight: 500;
  color: #1f2937;
}

.comment-date {
  font-size: 0.875rem;
  color: #6b7280;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.timecode {
  font-size: 0.875rem;
  color: #6b7280;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
}

.comment-content {
  color: #374151;
  line-height: 1.5;
  margin-bottom: 0.75rem;
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
}

.delete-btn {
  color: #ef4444;
}

/* Tags de type de commentaire */
.technical-tag { background: #dbeafe; color: #1e40af; }
.content-tag { background: #d1fae5; color: #065f46; }
.audio-tag { background: #fef3c7; color: #92400e; }
.editing-tag { background: #e0e7ff; color: #3730a3; }
.correction-tag { background: #fee2e2; color: #991b1b; }
.general-tag { background: #f3f4f6; color: #374151; }

@media (max-width: 1024px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
  
  .video-validation-page {
    padding: 1rem;
  }
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  
  .header-actions {
    justify-content: center;
  }
  
  .comment-header {
    flex-direction: column;
    gap: 0.5rem;
  }
  
  .comment-meta {
    justify-content: flex-start;
  }
}
</style>
