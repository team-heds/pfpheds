<template>
  <div class="kanban-board">
    <div 
      v-for="column in columns" 
      :key="column.status"
      class="kanban-column"
      :class="`column-${column.status}`"
    >
      <!-- En-tête de colonne -->
      <div class="column-header">
        <div class="column-title">
          <i :class="column.icon"></i>
          <span>{{ column.label }}</span>
          <Tag :value="getColumnCount(column.status)" severity="secondary" class="ml-2"></Tag>
        </div>
      </div>

      <!-- Zone de drop -->
      <div 
        class="column-content"
        @drop="onDrop($event, column.status)"
        @dragover.prevent
        @dragenter.prevent="onDragEnter($event, column.status)"
        @dragleave="onDragLeave"
      >
        <!-- Cartes de tickets -->
        <div
          v-for="ticket in getTicketsByStatus(column.status)"
          :key="ticket.id"
          class="ticket-card"
          :class="`ticket-${ticket.type}`"
          draggable="true"
          @dragstart="onDragStart($event, ticket)"
          @dragend="onDragEnd"
          @click="$emit('ticket-click', ticket)"
        >
          <!-- Barre de priorité -->
          <div v-if="ticket.priority === 'urgent' || ticket.priority === 'high'" class="priority-bar" :class="`priority-${ticket.priority}`"></div>

          <!-- Header -->
          <div class="ticket-header">
            <div class="ticket-type-icon" :class="`type-${ticket.type}`">
              <i :class="getTypeIcon(ticket.type)"></i>
            </div>
            <Tag 
              :value="getTypeLabel(ticket.type)" 
              :severity="getTypeSeverity(ticket.type)"
              class="ticket-type-badge"
            ></Tag>
            <Button 
              icon="pi pi-ellipsis-v" 
              text 
              rounded 
              severity="secondary"
              size="small"
              class="ml-auto"
              @click.stop="showTicketMenu($event, ticket)"
            />
          </div>

          <!-- Titre -->
          <h4 class="ticket-title">{{ ticket.title }}</h4>

          <!-- Description -->
          <div 
            v-if="ticket.description" 
            class="ticket-description markdown-content" 
            v-html="renderMarkdown(ticket.description, 100)"
          ></div>

          <!-- Infos principales -->
          <div class="ticket-info">
            <div v-if="ticket.module_id" class="info-item">
              <i class="pi pi-book"></i>
              <span class="info-text">Module {{ ticket.module_id }}</span>
            </div>
            
            <div v-if="ticket.due_date" class="info-item" :class="{ 'overdue': isOverdue(ticket.due_date) }">
              <i class="pi pi-calendar"></i>
              <span class="info-text">{{ formatDate(ticket.due_date) }}</span>
            </div>

            <div class="info-item">
              <i class="pi pi-clock"></i>
              <span class="info-text text-500">{{ getTimeAgo(ticket.created_at) }}</span>
            </div>
          </div>

          <!-- Métadonnées spécifiques -->
          <div v-if="ticket.type === 'video' && ticket.metadata" class="ticket-metadata">
            <div v-if="ticket.metadata.person_filmed" class="metadata-item">
              <i class="pi pi-video"></i>
              <span>{{ ticket.metadata.person_filmed }}</span>
            </div>
            <div v-if="ticket.metadata.duration_minutes" class="metadata-item">
              <i class="pi pi-stopwatch"></i>
              <span>{{ ticket.metadata.duration_minutes }} min</span>
            </div>
          </div>

          <div v-if="ticket.type === 'development' && ticket.metadata" class="ticket-metadata">
            <div v-if="ticket.metadata.technologies" class="metadata-item">
              <i class="pi pi-code"></i>
              <span>{{ ticket.metadata.technologies }}</span>
            </div>
          </div>

          <div v-if="ticket.type === 'simulation' && ticket.metadata" class="ticket-metadata">
            <div v-if="ticket.metadata.participants_count" class="metadata-item">
              <i class="pi pi-users"></i>
              <span>{{ ticket.metadata.participants_count }} participants</span>
            </div>
          </div>

          <!-- Footer -->
          <div class="ticket-footer">
            <div class="ticket-tags">
              <Tag v-if="ticket.priority === 'urgent'" severity="danger" class="text-xs">
                <i class="pi pi-exclamation-circle mr-1"></i>
                Urgent
              </Tag>
              <Tag v-else-if="ticket.priority === 'high'" severity="warning" class="text-xs">
                <i class="pi pi-arrow-up mr-1"></i>
                Prioritaire
              </Tag>
              <Tag v-if="ticket.has_assets" severity="success" class="text-xs">
                <i class="pi pi-paperclip"></i>
              </Tag>
            </div>
            
            <!-- Créateur -->
            <div v-if="ticket.created_by" class="ticket-creator">
              <div class="creator-avatar">{{ getInitials(ticket.created_by) }}</div>
            </div>
          </div>
        </div>

        <!-- Message si vide -->
        <div v-if="getTicketsByStatus(column.status).length === 0" class="column-empty">
          <i class="pi pi-inbox text-4xl text-400"></i>
          <p class="text-500">Aucun ticket</p>
        </div>
      </div>
    </div>

    <!-- Menu contextuel -->
    <Menu ref="ticketMenu" :model="menuItems" popup />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Menu from 'primevue/menu'
import { TICKET_STATUS, TICKET_TYPES } from '@/service/ticketService'

const props = defineProps({
  tickets: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['ticket-click', 'status-change', 'ticket-action'])

// Colonnes du Kanban
const columns = [
  { status: TICKET_STATUS.BACKLOG, label: 'Backlog', icon: 'pi pi-inbox' },
  { status: TICKET_STATUS.TODO, label: 'À faire', icon: 'pi pi-list' },
  { status: TICKET_STATUS.IN_PROGRESS, label: 'En cours', icon: 'pi pi-spinner' },
  { status: TICKET_STATUS.VALIDATION, label: 'Validation', icon: 'pi pi-check-circle' },
  { status: TICKET_STATUS.PROBLEMS, label: 'Problèmes', icon: 'pi pi-exclamation-triangle' },
  { status: TICKET_STATUS.DONE, label: 'Terminé', icon: 'pi pi-check' }
]

// Drag & Drop state
const draggedTicket = ref(null)
const draggedOverColumn = ref(null)

// Menu contextuel
const ticketMenu = ref()
const selectedTicket = ref(null)
const menuItems = computed(() => [
  {
    label: 'Modifier',
    icon: 'pi pi-pencil',
    command: () => emit('ticket-action', { action: 'edit', ticket: selectedTicket.value })
  },
  {
    label: 'Dupliquer',
    icon: 'pi pi-copy',
    command: () => emit('ticket-action', { action: 'duplicate', ticket: selectedTicket.value })
  },
  {
    separator: true
  },
  {
    label: 'Supprimer',
    icon: 'pi pi-trash',
    class: 'text-red-500',
    command: () => emit('ticket-action', { action: 'delete', ticket: selectedTicket.value })
  }
])

// Récupérer les tickets par statut
function getTicketsByStatus(status) {
  return props.tickets.filter(t => t.status === status)
}

// Compter les tickets d'une colonne
function getColumnCount(status) {
  return getTicketsByStatus(status).length
}

// Labels de types
function getTypeLabel(type) {
  const labels = {
    [TICKET_TYPES.VIDEO]: 'Vidéo',
    [TICKET_TYPES.DEVELOPMENT]: 'Développement',
    [TICKET_TYPES.SIMULATION]: 'Simulation',
    [TICKET_TYPES.OTHER]: 'Autre'
  }
  return labels[type] || type
}

// Icônes de types
function getTypeIcon(type) {
  const icons = {
    [TICKET_TYPES.VIDEO]: 'pi pi-video',
    [TICKET_TYPES.DEVELOPMENT]: 'pi pi-code',
    [TICKET_TYPES.SIMULATION]: 'pi pi-desktop',
    [TICKET_TYPES.OTHER]: 'pi pi-file'
  }
  return icons[type] || 'pi pi-file'
}

// Severity des types
function getTypeSeverity(type) {
  const severities = {
    [TICKET_TYPES.VIDEO]: 'danger',
    [TICKET_TYPES.DEVELOPMENT]: 'info',
    [TICKET_TYPES.SIMULATION]: 'warning',
    [TICKET_TYPES.OTHER]: 'secondary'
  }
  return severities[type] || 'secondary'
}

// Formater la date
function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
}

// Vérifier si en retard
function isOverdue(dueDate) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

// Temps relatif
function getTimeAgo(date) {
  if (!date) return ''
  const now = new Date()
  const created = new Date(date)
  const diffMs = now - created
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) return "Aujourd'hui"
  if (diffDays === 1) return 'Hier'
  if (diffDays < 7) return `Il y a ${diffDays}j`
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)}sem`
  return `Il y a ${Math.floor(diffDays / 30)}mois`
}

// Tronquer le texte
function truncateText(text, length) {
  if (!text) return ''
  if (text.length <= length) return text
  return text.substring(0, length) + '...'
}

// Rendu Markdown sécurisé avec limitation de longueur
function renderMarkdown(text, maxLength = 100) {
  if (!text) return ''
  
  try {
    // Tronquer d'abord le texte brut (avant le rendu Markdown)
    const truncated = text.length > maxLength 
      ? text.substring(0, maxLength) + '...' 
      : text
    
    // Rendre le Markdown
    const rawHtml = marked(truncated, { breaks: true, gfm: true })
    
    // Nettoyer et sécuriser
    return DOMPurify.sanitize(rawHtml)
  } catch (error) {
    console.error('[KanbanBoard] Erreur Markdown:', error)
    return truncateText(text, maxLength)
  }
}

// Initiales pour avatar
function getInitials(userId) {
  if (!userId) return 'U'
  if (typeof userId === 'string') {
    return userId.substring(0, 2).toUpperCase()
  }
  return 'U'
}

// Drag & Drop handlers
function onDragStart(event, ticket) {
  draggedTicket.value = ticket
  event.dataTransfer.effectAllowed = 'move'
  event.target.classList.add('dragging')
}

function onDragEnd(event) {
  event.target.classList.remove('dragging')
  draggedTicket.value = null
  draggedOverColumn.value = null
}

function onDragEnter(event, status) {
  draggedOverColumn.value = status
  event.currentTarget.classList.add('drag-over')
}

function onDragLeave(event) {
  event.currentTarget.classList.remove('drag-over')
}

function onDrop(event, newStatus) {
  event.currentTarget.classList.remove('drag-over')
  
  if (draggedTicket.value && draggedTicket.value.status !== newStatus) {
    emit('status-change', {
      ticket: draggedTicket.value,
      oldStatus: draggedTicket.value.status,
      newStatus: newStatus
    })
  }
  
  draggedTicket.value = null
  draggedOverColumn.value = null
}

// Menu contextuel
function showTicketMenu(event, ticket) {
  selectedTicket.value = ticket
  ticketMenu.value.toggle(event)
}
</script>

<style scoped>
.kanban-board {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 1.5rem;
  padding: 1.5rem;
  height: calc(100vh - 200px);
  overflow-x: auto;
}

.kanban-column {
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  min-width: 300px;
  max-height: 100%;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.column-backlog { 
  background: linear-gradient(180deg, rgba(108, 117, 125, 0.15) 0%, rgba(73, 80, 87, 0.2) 100%);
  border: 1px solid rgba(108, 117, 125, 0.3);
}
.column-backlog .column-header {
  background: linear-gradient(135deg, #6c757d 0%, #495057 100%);
  color: white;
}

.column-todo { 
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.15) 0%, rgba(37, 99, 235, 0.2) 100%);
  border: 1px solid rgba(59, 130, 246, 0.3);
}
.column-todo .column-header {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.column-in_progress { 
  background: linear-gradient(180deg, rgba(245, 158, 11, 0.15) 0%, rgba(217, 119, 6, 0.2) 100%);
  border: 1px solid rgba(245, 158, 11, 0.3);
}
.column-in_progress .column-header {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.column-validation { 
  background: linear-gradient(180deg, rgba(139, 92, 246, 0.15) 0%, rgba(124, 58, 237, 0.2) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
}
.column-validation .column-header {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
  color: white;
}

.column-problems { 
  background: linear-gradient(180deg, rgba(239, 68, 68, 0.15) 0%, rgba(220, 38, 38, 0.2) 100%);
  border: 1px solid rgba(239, 68, 68, 0.3);
}
.column-problems .column-header {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.column-done { 
  background: linear-gradient(180deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.2) 100%);
  border: 1px solid rgba(16, 185, 129, 0.3);
}
.column-done .column-header {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.column-header {
  padding: 1rem 1.25rem;
  border-radius: 12px 12px 0 0;
  border: none;
}

.column-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1rem;
  color: white;
}

.column-title i {
  color: white;
  opacity: 0.9;
}

.column-header .p-tag {
  background: rgba(255, 255, 255, 0.25);
  color: white;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.column-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  scrollbar-width: thin;
  background: transparent;
}

.column-content::-webkit-scrollbar {
  width: 6px;
}

.column-content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.15);
  border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.25);
}

.column-content.drag-over {
  background: var(--primary-50);
  border: 2px dashed var(--primary-color);
  border-radius: 8px;
}

.ticket-card {
  position: relative;
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.25rem;
  cursor: grab;
  border: 1px solid var(--surface-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  flex-direction: column;
  gap: 0.875rem;
  overflow: hidden;
}

.ticket-card:hover {
  box-shadow: 0 12px 32px rgba(0,0,0,0.15), 0 6px 12px rgba(0,0,0,0.1);
  transform: translateY(-6px);
  border-color: var(--primary-200);
}

/* Barre de priorité */
.priority-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 12px 12px 0 0;
}

.priority-bar.priority-urgent {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
  box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
}

.priority-bar.priority-high {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
  box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
}

.ticket-card.dragging {
  opacity: 0.5;
  cursor: grabbing;
}

.ticket-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.ticket-type-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: white;
  flex-shrink: 0;
}

.ticket-type-icon.type-video {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.ticket-type-icon.type-development {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.ticket-type-icon.type-simulation {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.ticket-type-icon.type-other {
  background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
}

.ticket-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.ticket-description {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  max-height: 3rem;
}

/* Markdown dans les cards */
.ticket-description.markdown-content :deep(p) {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
  display: inline;
}

.ticket-description.markdown-content :deep(strong) {
  font-weight: 600;
  color: var(--text-color);
}

.ticket-description.markdown-content :deep(em) {
  font-style: italic;
}

.ticket-description.markdown-content :deep(code) {
  background: rgba(255, 193, 7, 0.15);
  padding: 0.1rem 0.3rem;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.813rem;
  color: #ffc107;
}

.ticket-description.markdown-content :deep(ul),
.ticket-description.markdown-content :deep(ol) {
  margin: 0.25rem 0;
  padding-left: 1.5rem;
  font-size: 0.875rem;
}

.ticket-description.markdown-content :deep(li) {
  margin: 0;
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.ticket-description.markdown-content :deep(h1),
.ticket-description.markdown-content :deep(h2),
.ticket-description.markdown-content :deep(h3) {
  margin: 0.25rem 0;
  font-size: 0.938rem;
  font-weight: 600;
  color: var(--text-color);
}

.ticket-description.markdown-content :deep(a) {
  color: var(--primary-color);
  text-decoration: none;
}

.ticket-info {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.813rem;
  color: var(--text-color-secondary);
}

.info-item i {
  color: var(--primary-color);
  font-size: 0.875rem;
  width: 16px;
  flex-shrink: 0;
}

.info-text {
  flex: 1;
}

.info-item.overdue {
  color: var(--red-500);
  font-weight: 600;
}

.info-item.overdue i {
  color: var(--red-500);
}

.ticket-metadata {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}

.metadata-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
}

.ticket-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  margin-top: auto;
  border-top: 1px solid var(--surface-border);
}

.ticket-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  align-items: center;
}

.ticket-creator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.creator-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-600) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  border: 2px solid var(--surface-card);
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: all 0.2s;
}

.creator-avatar:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.column-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

/* Responsive */
@media (max-width: 1400px) {
  .kanban-board {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 768px) {
  .kanban-board {
    grid-template-columns: 1fr;
  }
}
</style>
