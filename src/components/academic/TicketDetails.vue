<template>
  <div class="ticket-details-jira">
    <!-- Header compact -->
    <div class="ticket-header-bar">
      <div class="header-left">
        <div class="ticket-type-chip" :class="`type-${ticket.type}`">
          <i :class="getTypeIcon(ticket.type)"></i>
          <span>{{ getTypeLabel(ticket.type) }}</span>
        </div>
        <span class="ticket-id">#{{ ticket.id?.substring(0, 8) }}</span>
      </div>
      
      <div class="header-actions">
        <Button 
          label="Modifier" 
          icon="pi pi-pencil"
          @click="$emit('edit', ticket)"
          text
          size="small"
        />
        <Button 
          icon="pi pi-ellipsis-v"
          @click="toggleMenu"
          text
          size="small"
        />
      </div>
    </div>

    <!-- Layout 2 colonnes -->
    <div class="jira-layout">
      <!-- Colonne principale (gauche) -->
      <div class="main-column">
        <!-- Titre -->
        <h1 class="ticket-title-main">{{ ticket.title }}</h1>

        <!-- Description -->
        <div class="description-section">
          <h3 class="section-label">Description</h3>
          <div v-if="ticket.description" class="description-content">
            <p>{{ ticket.description }}</p>
          </div>
          <div v-else class="empty-description">
            <span class="text-500">Aucune description</span>
          </div>
        </div>

        <!-- Détails spécifiques au type -->
        <div v-if="ticket.type === 'video' && ticket.metadata" class="details-section video-section">
          <div class="section-header">
            <div class="section-icon video-icon">
              <i class="pi pi-video"></i>
            </div>
            <h3 class="section-label">Détails Vidéo</h3>
          </div>
          <div class="metadata-grid">
            <div v-if="ticket.metadata.person_filmed" class="metadata-card">
              <i class="pi pi-user metadata-card-icon"></i>
              <div>
                <span class="meta-label">Personne filmée</span>
                <span class="meta-value">{{ ticket.metadata.person_filmed }}</span>
              </div>
            </div>
            <div v-if="ticket.metadata.filming_date" class="metadata-card">
              <i class="pi pi-calendar metadata-card-icon"></i>
              <div>
                <span class="meta-label">Date de tournage</span>
                <span class="meta-value">{{ formatDate(ticket.metadata.filming_date) }}</span>
              </div>
            </div>
            <div v-if="ticket.metadata.modality" class="metadata-card">
              <i class="pi pi-th-large metadata-card-icon"></i>
              <div>
                <span class="meta-label">Modalité</span>
                <Tag :value="ticket.metadata.modality" severity="info" />
              </div>
            </div>
            <div v-if="ticket.metadata.duration_minutes" class="metadata-card">
              <i class="pi pi-clock metadata-card-icon"></i>
              <div>
                <span class="meta-label">Durée</span>
                <span class="meta-value">{{ ticket.metadata.duration_minutes }} min</span>
              </div>
            </div>
          </div>

          <!-- Liens Vidéo -->
          <div class="video-links-section">
            <div class="links-header">
              <h4>Liens Vidéo</h4>
              <Button 
                label="Ajouter un lien"
                icon="pi pi-plus"
                @click="showAddVideoLink = true"
                size="small"
                text
              />
            </div>
            <div v-if="videoLinks.length" class="links-list">
              <div v-for="(link, index) in videoLinks" :key="index" class="link-item">
                <div class="link-info">
                  <i class="pi pi-link"></i>
                  <div class="link-details">
                    <span class="link-title">{{ link.title }}</span>
                    <a :href="link.url" target="_blank" class="link-url">{{ link.url }}</a>
                  </div>
                </div>
                <Button 
                  icon="pi pi-trash"
                  @click="removeVideoLink(index)"
                  text
                  severity="danger"
                  size="small"
                />
              </div>
            </div>
            <div v-else class="empty-links">
              <i class="pi pi-link"></i>
              <span>Aucun lien vidéo ajouté</span>
            </div>
          </div>
        </div>

        <div v-if="ticket.type === 'development' && ticket.metadata" class="details-section dev-section">
          <div class="section-header">
            <div class="section-icon dev-icon">
              <i class="pi pi-code"></i>
            </div>
            <h3 class="section-label">Détails Développement</h3>
          </div>
          <div class="metadata-grid">
            <div v-if="ticket.metadata.dev_type" class="metadata-card">
              <i class="pi pi-cog metadata-card-icon"></i>
              <div>
                <span class="meta-label">Type</span>
                <span class="meta-value">{{ ticket.metadata.dev_type }}</span>
              </div>
            </div>
            <div v-if="ticket.metadata.technologies" class="metadata-card">
              <i class="pi pi-wrench metadata-card-icon"></i>
              <div>
                <span class="meta-label">Technologies</span>
                <span class="meta-value">{{ ticket.metadata.technologies }}</span>
              </div>
            </div>
            <div v-if="ticket.metadata.repository_url" class="metadata-card full-width">
              <i class="pi pi-github metadata-card-icon"></i>
              <div>
                <span class="meta-label">Repository</span>
                <a :href="ticket.metadata.repository_url" target="_blank" class="repo-link">
                  <span>{{ ticket.metadata.repository_url }}</span>
                  <i class="pi pi-external-link"></i>
                </a>
              </div>
            </div>
          </div>

          <!-- Actions GitHub -->
          <div class="github-actions-section">
            <div class="actions-header">
              <i class="pi pi-github"></i>
              <h4>Actions GitHub</h4>
            </div>
            <div class="action-cards">
              <div class="action-card" @click="showCreateBranch = true">
                <div class="action-icon">
                  <i class="pi pi-sitemap"></i>
                </div>
                <div class="action-content">
                  <span class="action-title">Créer une branche</span>
                  <span class="action-description">Nouvelle branche pour ce ticket</span>
                </div>
                <i class="pi pi-chevron-right"></i>
              </div>
              <div class="action-card" @click="openRepository">
                <div class="action-icon">
                  <i class="pi pi-external-link"></i>
                </div>
                <div class="action-content">
                  <span class="action-title">Ouvrir le repo</span>
                  <span class="action-description">Voir sur GitHub</span>
                </div>
                <i class="pi pi-chevron-right"></i>
              </div>
            </div>
            <div v-if="currentBranch" class="current-branch">
              <i class="pi pi-code-branch"></i>
              <div>
                <span class="branch-label">Branche actuelle</span>
                <span class="branch-name">{{ currentBranch }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-if="ticket.type === 'simulation' && ticket.metadata" class="details-section sim-section">
          <div class="section-header">
            <div class="section-icon sim-icon">
              <i class="pi pi-desktop"></i>
            </div>
            <h3 class="section-label">Détails Simulation</h3>
          </div>
          <div class="metadata-grid">
            <div v-if="ticket.metadata.sim_type" class="metadata-card">
              <i class="pi pi-th-large metadata-card-icon"></i>
              <div>
                <span class="meta-label">Type</span>
                <span class="meta-value">{{ ticket.metadata.sim_type }}</span>
              </div>
            </div>
            <div v-if="ticket.metadata.participants_count" class="metadata-card">
              <i class="pi pi-users metadata-card-icon"></i>
              <div>
                <span class="meta-label">Participants</span>
                <span class="meta-value">{{ ticket.metadata.participants_count }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div v-if="ticket.notes" class="details-section">
          <h3 class="section-label">Notes</h3>
          <div class="notes-content">{{ ticket.notes }}</div>
        </div>
      </div>

      <!-- Sidebar droite (Détails) -->
      <div class="sidebar-column">
        <div class="sidebar-header">
          <h3>Détails</h3>
        </div>

        <!-- Status -->
        <div class="detail-item">
          <span class="detail-label">Statut</span>
          <Tag :value="getStatusLabel(ticket.status)" :severity="getStatusSeverity(ticket.status)" class="w-full" />
        </div>

        <!-- Priorité -->
        <div class="detail-item">
          <span class="detail-label">Priorité</span>
          <div class="priority-badge" :class="`priority-${ticket.priority}`">
            <i :class="getPriorityIcon(ticket.priority)"></i>
            <span>{{ getPriorityLabel(ticket.priority) }}</span>
          </div>
        </div>

        <!-- Module -->
        <div v-if="ticket.module_id" class="detail-item">
          <span class="detail-label">Module</span>
          <span class="detail-value">{{ ticket.module_id }}</span>
        </div>

        <!-- Date de rendu -->
        <div v-if="ticket.due_date" class="detail-item">
          <span class="detail-label">Date de rendu</span>
          <div class="date-value" :class="{ 'overdue': isOverdue(ticket.due_date) }">
            <i class="pi pi-calendar"></i>
            <span>{{ formatDate(ticket.due_date) }}</span>
          </div>
          <span v-if="isOverdue(ticket.due_date)" class="overdue-badge">
            <i class="pi pi-exclamation-triangle"></i> En retard
          </span>
          <span v-else class="time-left">{{ getDaysUntil(ticket.due_date) }}</span>
        </div>

        <!-- Créateur -->
        <div v-if="ticket.created_by" class="detail-item">
          <span class="detail-label">Créé par</span>
          <div class="user-info">
            <div class="user-avatar">{{ getInitials(ticket.created_by) }}</div>
            <span class="user-name">{{ ticket.created_by_user?.full_name || ticket.created_by }}</span>
          </div>
        </div>

        <!-- Dates -->
        <div class="detail-item">
          <span class="detail-label">Créé le</span>
          <span class="detail-value text-sm">{{ formatDateTime(ticket.created_at) }}</span>
        </div>

        <div v-if="ticket.updated_at" class="detail-item">
          <span class="detail-label">Modifié le</span>
          <span class="detail-value text-sm">{{ getTimeAgo(ticket.updated_at) }}</span>
        </div>

        <!-- Assets -->
        <div v-if="ticket.has_assets" class="detail-item">
          <span class="detail-label">Assets</span>
          <div class="assets-badge">
            <i class="pi pi-paperclip"></i>
            <span>Disponibles</span>
          </div>
        </div>

        <!-- Actions rapides -->
        <div class="sidebar-actions">
          <Button 
            label="Supprimer" 
            icon="pi pi-trash"
            @click="$emit('delete', ticket)"
            outlined
            severity="danger"
            class="w-full"
            size="small"
          />
        </div>
      </div>
    </div>

    <!-- Dialog: Ajouter un lien vidéo -->
    <Dialog v-model:visible="showAddVideoLink" header="Ajouter un lien vidéo" :modal="true" :style="{ width: '450px' }">
      <div class="dialog-content">
        <div class="field">
          <label for="link-title">Titre du lien</label>
          <InputText 
            id="link-title"
            v-model="newVideoLink.title" 
            placeholder="Ex: Vidéo brute, Montage final..."
            class="w-full"
          />
        </div>
        <div class="field">
          <label for="link-url">URL</label>
          <InputText 
            id="link-url"
            v-model="newVideoLink.url" 
            placeholder="https://..."
            class="w-full"
          />
        </div>
      </div>
      <template #footer>
        <Button label="Annuler" @click="showAddVideoLink = false" text />
        <Button label="Ajouter" @click="addVideoLink" :disabled="!newVideoLink.title || !newVideoLink.url" />
      </template>
    </Dialog>

    <!-- Dialog: Créer une branche GitHub -->
    <Dialog v-model:visible="showCreateBranch" header="Créer une branche GitHub" :modal="true" :style="{ width: '500px' }">
      <div class="dialog-content">
        <div class="field">
          <label for="branch-name">Nom de la branche</label>
          <InputText 
            id="branch-name"
            v-model="newBranchName" 
            :placeholder="suggestedBranchName"
            class="w-full"
          />
          <small class="text-muted">Suggestion : {{ suggestedBranchName }}</small>
        </div>
        <div class="field">
          <label for="base-branch">Branche de base</label>
          <Dropdown 
            id="base-branch"
            v-model="baseBranch" 
            :options="['prod', 'develop', 'main']"
            placeholder="Sélectionner..."
            class="w-full"
          />
        </div>
        <Message severity="info" :closable="false">
          Cette action créera une nouvelle branche pour ce ticket dans votre repository GitHub.
        </Message>
      </div>
      <template #footer>
        <Button label="Annuler" @click="showCreateBranch = false" text />
        <Button 
          label="Créer la branche" 
          icon="pi pi-github"
          @click="createGitHubBranch" 
          :disabled="!newBranchName"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Message from 'primevue/message'
import { TICKET_STATUS, TICKET_TYPES } from '@/service/ticketService'
import { useToast } from 'primevue/usetoast'

const toast = useToast()

const props = defineProps({
  ticket: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['edit', 'delete', 'publish', 'close'])

const showMenu = ref(false)
const showAddVideoLink = ref(false)
const showCreateBranch = ref(false)

// Video links
const videoLinks = ref([
  // Example: { title: 'Vidéo brute', url: 'https://...' }
])
const newVideoLink = reactive({
  title: '',
  url: ''
})

// GitHub branch
const currentBranch = ref('')
const newBranchName = ref('')
const baseBranch = ref('prod')

const suggestedBranchName = computed(() => {
  const ticketId = props.ticket.id?.substring(0, 8) || 'ticket'
  const title = props.ticket.title?.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .substring(0, 30) || 'feature'
  return `feature/${ticketId}-${title}`
})

function toggleMenu() {
  showMenu.value = !showMenu.value
}

function addVideoLink() {
  if (newVideoLink.title && newVideoLink.url) {
    videoLinks.value.push({
      title: newVideoLink.title,
      url: newVideoLink.url
    })
    toast.add({ 
      severity: 'success', 
      summary: 'Lien ajouté', 
      detail: 'Le lien vidéo a été ajouté avec succès',
      life: 3000 
    })
    newVideoLink.title = ''
    newVideoLink.url = ''
    showAddVideoLink.value = false
  }
}

function removeVideoLink(index) {
  videoLinks.value.splice(index, 1)
  toast.add({ 
    severity: 'info', 
    summary: 'Lien supprimé', 
    detail: 'Le lien vidéo a été supprimé',
    life: 3000 
  })
}

function createGitHubBranch() {
  const branchName = newBranchName.value || suggestedBranchName.value
  
  // Simuler la création de la branche (à remplacer par un vrai appel API GitHub)
  currentBranch.value = branchName
  
  toast.add({ 
    severity: 'success', 
    summary: 'Branche créée', 
    detail: `La branche "${branchName}" a été créée avec succès`,
    life: 4000 
  })
  
  showCreateBranch.value = false
  newBranchName.value = ''
}

function openRepository() {
  if (props.ticket.metadata?.repository_url) {
    window.open(props.ticket.metadata.repository_url, '_blank')
  }
}

function getTypeLabel(type) {
  const labels = {
    [TICKET_TYPES.VIDEO]: 'Vidéo',
    [TICKET_TYPES.DEVELOPMENT]: 'Développement',
    [TICKET_TYPES.SIMULATION]: 'Simulation',
    [TICKET_TYPES.OTHER]: 'Autre'
  }
  return labels[type] || type
}

function getTypeIcon(type) {
  const icons = {
    [TICKET_TYPES.VIDEO]: 'pi pi-video',
    [TICKET_TYPES.DEVELOPMENT]: 'pi pi-code',
    [TICKET_TYPES.SIMULATION]: 'pi pi-desktop',
    [TICKET_TYPES.OTHER]: 'pi pi-file'
  }
  return icons[type] || 'pi pi-file'
}

function getStatusLabel(status) {
  const labels = {
    [TICKET_STATUS.BACKLOG]: 'Backlog',
    [TICKET_STATUS.TODO]: 'À faire',
    [TICKET_STATUS.IN_PROGRESS]: 'En cours',
    [TICKET_STATUS.VALIDATION]: 'Validation',
    [TICKET_STATUS.PROBLEMS]: 'Problèmes',
    [TICKET_STATUS.DONE]: 'Terminé'
  }
  return labels[status] || status
}

function getStatusSeverity(status) {
  const severities = {
    [TICKET_STATUS.BACKLOG]: 'secondary',
    [TICKET_STATUS.TODO]: 'info',
    [TICKET_STATUS.IN_PROGRESS]: 'warning',
    [TICKET_STATUS.VALIDATION]: null,
    [TICKET_STATUS.PROBLEMS]: 'danger',
    [TICKET_STATUS.DONE]: 'success'
  }
  return severities[status]
}

function getPriorityLabel(priority) {
  const labels = {
    low: 'Basse',
    normal: 'Normale',
    high: 'Haute',
    urgent: 'Urgente'
  }
  return labels[priority] || priority
}

function getPriorityIcon(priority) {
  const icons = {
    low: 'pi pi-arrow-down',
    normal: 'pi pi-minus',
    high: 'pi pi-arrow-up',
    urgent: 'pi pi-exclamation-triangle'
  }
  return icons[priority] || 'pi pi-minus'
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function formatDateTime(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { 
    day: '2-digit', 
    month: 'long', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function isOverdue(dueDate) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

function getTimeAgo(date) {
  if (!date) return ''
  const now = new Date()
  const created = new Date(date)
  const diffMs = now - created
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "aujourd'hui"
  if (diffDays === 1) return 'hier'
  if (diffDays < 7) return `il y a ${diffDays}j`
  if (diffDays < 30) return `il y a ${Math.floor(diffDays / 7)}sem`
  return `il y a ${Math.floor(diffDays / 30)}mois`
}

function getDaysUntil(date) {
  if (!date) return ''
  const now = new Date()
  const target = new Date(date)
  const diffMs = target - now
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Demain'
  if (diffDays < 7) return `Dans ${diffDays}j`
  if (diffDays < 30) return `Dans ${Math.floor(diffDays / 7)}sem`
  return `Dans ${Math.floor(diffDays / 30)}mois`
}

function getInitials(userId) {
  if (!userId) return 'U'
  if (typeof userId === 'string') {
    return userId.substring(0, 2).toUpperCase()
  }
  return 'U'
}
</script>

<style scoped>
/* Container principal */
.ticket-details-jira {
  background: var(--surface-ground);
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* Header Bar */
.ticket-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--surface-border);
  background: var(--surface-card);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.ticket-type-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
}

.ticket-type-chip.type-video {
  background: #ef4444;
}

.ticket-type-chip.type-development {
  background: #3b82f6;
}

.ticket-type-chip.type-simulation {
  background: #f59e0b;
}

.ticket-type-chip.type-other {
  background: #6b7280;
}

.ticket-id {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-family: monospace;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

/* Layout 2 colonnes */
.jira-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 0;
  flex: 1;
  overflow: hidden;
}

/* Colonne principale */
.main-column {
  padding: 2rem;
  overflow-y: auto;
  border-right: 1px solid var(--surface-border);
}

.ticket-title-main {
  margin: 0 0 2rem 0;
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.3;
}

/* Sections */
.description-section {
  margin-bottom: 2rem;
}

.details-section {
  margin-bottom: 2rem;
  padding: 0;
  background: transparent;
  border-radius: 0;
  border: none;
  box-shadow: none;
  transition: all 0.3s ease;
}

.video-section {
  /* Pas de style spécial */
}

.dev-section {
  /* Pas de style spécial */
}

.sim-section {
  /* Pas de style spécial */
}

.section-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.description-content {
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  line-height: 1.6;
}

.description-content p {
  margin: 0;
}

.empty-description {
  padding: 1rem;
  text-align: center;
  color: var(--text-color-secondary);
  font-style: italic;
}

/* Section Headers with Icons */
.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
  padding: 0;
  border: none;
}

.section-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  flex-shrink: 0;
}

.video-icon {
  background: #ef4444;
}

.dev-icon {
  background: #3b82f6;
}

.sim-icon {
  background: #f59e0b;
}

.section-label {
  font-size: 0.938rem !important;
  font-weight: 600 !important;
  color: var(--text-color) !important;
  margin: 0 !important;
  text-transform: none !important;
  letter-spacing: normal !important;
}

/* Metadata Grid & Cards */
.metadata-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metadata-card {
  display: flex;
  gap: 0.875rem;
  padding: 1rem 1.25rem;
  background: var(--surface-card);
  border-radius: 10px;
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
  position: relative;
  overflow: visible;
}

.metadata-card:hover {
  background: var(--surface-hover);
  border-color: var(--primary-color);
  transform: translateX(2px);
}

.video-section .metadata-card:hover {
  border-color: #ef4444;
}

.dev-section .metadata-card:hover {
  border-color: #3b82f6;
}

.sim-section .metadata-card:hover {
  border-color: #f59e0b;
}

.metadata-card.full-width {
  grid-column: 1 / -1;
}

.metadata-card-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
  transition: color 0.2s ease;
}

.video-section .metadata-card-icon {
  color: #ef4444;
}

.dev-section .metadata-card-icon {
  color: #3b82f6;
}

.sim-section .metadata-card-icon {
  color: #f59e0b;
}

.metadata-card > div {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  flex: 1;
}

.meta-label {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.meta-value {
  font-size: 0.938rem;
  color: var(--text-color);
  font-weight: 600;
  line-height: 1.4;
}

.repo-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #60a5fa;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.repo-link:hover {
  color: #93c5fd;
  gap: 0.75rem;
  text-decoration: underline;
}

.notes-content {
  padding: 1rem;
  background: var(--surface-50);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  white-space: pre-wrap;
  line-height: 1.6;
}

/* Video Links Section */
.video-links-section {
  margin-top: 1.5rem;
}

.links-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.875rem;
}

.links-header h4 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.links-list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.link-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.875rem 1rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  transition: all 0.2s ease;
}

.link-item:hover {
  background: var(--surface-hover);
  border-color: #ef4444;
  transform: translateX(2px);
}

.link-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.link-info > i {
  font-size: 1.125rem;
  color: #ef4444;
}

.link-details {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.link-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
}

.link-url {
  font-size: 0.75rem;
  color: #60a5fa;
  text-decoration: none;
  transition: color 0.2s;
}

.link-url:hover {
  color: #93c5fd;
  text-decoration: underline;
}

.empty-links {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  padding: 2rem 1rem;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  font-style: italic;
}

.empty-links i {
  font-size: 1.25rem;
  opacity: 0.4;
}

/* GitHub Actions Section */
.github-actions-section {
  margin-top: 1.5rem;
}

.actions-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.875rem;
}

.actions-header i {
  font-size: 1.125rem;
  color: var(--text-color-secondary);
}

.actions-header h4 {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.action-cards {
  display: grid;
  gap: 0.625rem;
}

.action-card {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 0.875rem 1rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.action-card:hover {
  background: var(--surface-hover);
  border-color: #3b82f6;
  transform: translateX(2px);
}

.action-icon {
  width: 36px;
  height: 36px;
  background: #3b82f6;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.action-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
}

.action-description {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

.action-card > i {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  transition: transform 0.2s ease;
}

.action-card:hover > i {
  transform: translateX(2px);
}

.current-branch {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.875rem;
  padding: 0.75rem 1rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--green-200);
}

.current-branch > i {
  font-size: 1.125rem;
  color: var(--green-600);
}

.current-branch > div {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.branch-label {
  font-size: 0.688rem;
  color: var(--text-color-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.branch-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--green-700);
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

/* Dialog Styles */
.dialog-content {
  padding: 1rem 0;
}

.field {
  margin-bottom: 1.25rem;
}

.field label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
  font-size: 0.875rem;
}

.text-muted {
  color: var(--text-color-secondary);
  font-size: 0.813rem;
  margin-top: 0.375rem;
  display: block;
}

/* Sidebar */
.sidebar-column {
  background: var(--surface-section);
  padding: 1.5rem;
  overflow-y: auto;
}

.sidebar-header {
  margin-bottom: 1.5rem;
}

.sidebar-header h3 {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.025em;
}

.detail-item {
  margin-bottom: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.detail-label {
  font-size: 0.813rem;
  color: var(--text-color-secondary);
  font-weight: 500;
}

.detail-value {
  font-size: 0.938rem;
  color: var(--text-color);
  font-weight: 500;
}

/* Priority Badge */
.priority-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

.priority-badge.priority-urgent {
  background: rgba(239, 68, 68, 0.1);
  color: var(--red-700);
}

.priority-badge.priority-high {
  background: rgba(245, 158, 11, 0.1);
  color: var(--orange-700);
}

.priority-badge.priority-normal {
  background: rgba(59, 130, 246, 0.1);
  color: var(--blue-700);
}

.priority-badge.priority-low {
  background: rgba(107, 114, 128, 0.1);
  color: var(--gray-700);
}

/* Date Value */
.date-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.938rem;
  color: var(--text-color);
}

.date-value.overdue {
  color: var(--red-600);
}

.time-left {
  font-size: 0.813rem;
  color: var(--text-color-secondary);
}

.overdue-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: var(--red-600);
  font-weight: 600;
}

/* User Info */
.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--primary-color);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.user-name {
  font-size: 0.938rem;
  color: var(--text-color);
  font-weight: 500;
}

/* Assets Badge */
.assets-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: rgba(16, 185, 129, 0.1);
  color: var(--green-700);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Sidebar Actions */
.sidebar-actions {
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--surface-border);
}

/* Responsive */
@media (max-width: 992px) {
  .jira-layout {
    grid-template-columns: 1fr;
  }

  .main-column {
    border-right: none;
    border-bottom: 1px solid var(--surface-border);
  }
}

@media (max-width: 768px) {
  .ticket-header-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-end;
  }

  .main-column,
  .sidebar-column {
    padding: 1rem;
  }

  .ticket-title-main {
    font-size: 1.5rem;
  }

  .metadata-grid {
    grid-template-columns: 1fr;
  }

  .action-card {
    flex-direction: column;
    align-items: flex-start;
    text-align: left;
  }

  .action-card > i {
    display: none;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .links-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}

/* Animations */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.details-section {
  animation: slideIn 0.3s ease-out;
}

.link-item,
.action-card {
  animation: slideIn 0.2s ease-out;
}
</style>
