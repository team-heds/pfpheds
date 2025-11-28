<template>
  <AdminLayout>
    <div class="ticket-list-view">
    
    <div class="list-container">
      <!-- Header -->
      <div class="list-header">
        <div class="header-content">
          <div class="title-section">
            <h1>
              <i class="pi pi-list"></i>
              Gestion des Tickets
            </h1>
            <p class="subtitle">{{ filteredTickets.length }} tickets</p>
          </div>
          
          <div class="header-actions">
            <Button 
              label="Vue Kanban" 
              icon="pi pi-th-large" 
              outlined
              @click="$router.push('/admin/academic/kanban')"
            />
            <Button 
              label="Vue Calendrier" 
              icon="pi pi-calendar" 
              outlined
              @click="$router.push('/admin/academic/calendar')"
            />
            <Button 
              label="Bibliothèque" 
              icon="pi pi-video" 
              outlined
              @click="$router.push('/admin/academic/video-library')"
            />
            <Button 
              label="Nouveau ticket" 
              icon="pi pi-plus" 
              @click="showCreateDialog = true"
            />
          </div>
        </div>
      </div>

      <!-- Filtres et recherche -->
      <div class="filters-section">
        <div class="search-bar">
          <span class="p-input-icon-left w-full">
            <i class="pi pi-search"></i>
            <InputText 
              v-model="searchQuery" 
              placeholder="Rechercher un ticket..." 
              class="w-full"
            />
          </span>
        </div>

        <div class="filters-row">
          <Dropdown 
            v-model="filterStatus" 
            :options="[{ label: 'Tous les statuts', value: null }, ...statusOptions]"
            optionLabel="label"
            optionValue="value"
            placeholder="Statut"
            class="filter-item"
            showClear
          />
          
          <Dropdown 
            v-model="filterType" 
            :options="[{ label: 'Tous les types', value: null }, ...typeOptions]"
            optionLabel="label"
            optionValue="value"
            placeholder="Type"
            class="filter-item"
            showClear
          />

          <Dropdown 
            v-model="filterPriority" 
            :options="[{ label: 'Toutes les priorités', value: null }, ...priorityOptions]"
            optionLabel="label"
            optionValue="value"
            placeholder="Priorité"
            class="filter-item"
            showClear
          />

          <Dropdown 
            v-model="filterAssignee" 
            :options="[{ label: 'Toutes les assignations', value: null }, ...users]"
            optionLabel="label"
            optionValue="value"
            placeholder="Assigné à"
            class="filter-item"
            showClear
          />
        </div>
      </div>

      <!-- Liste des tickets -->
      <div class="tickets-list">
        <div 
          v-for="ticket in paginatedTickets" 
          :key="ticket.id"
          class="ticket-row"
          :class="{ 'selected': selectedTicket?.id === ticket.id }"
          @click="selectTicket(ticket)"
        >
          <div class="ticket-checkbox">
            <Checkbox v-model="selectedTickets" :value="ticket.id" />
          </div>

          <div class="ticket-id">
            <i :class="getTypeIcon(ticket.type)" class="type-icon"></i>
            <span class="id-text">#{{ ticket.id.split('-')[0] }}</span>
          </div>

          <div class="ticket-content">
            <div class="ticket-title-row">
              <h3 class="ticket-title">{{ ticket.title }}</h3>
              <div class="ticket-badges">
                <Tag v-if="ticket.priority === 'urgent'" severity="danger" class="priority-tag">
                  <i class="pi pi-exclamation-circle"></i>
                  Urgent
                </Tag>
                <Tag v-else-if="ticket.priority === 'high'" severity="warning" class="priority-tag">
                  <i class="pi pi-arrow-up"></i>
                  Haute
                </Tag>
              </div>
            </div>
            <div class="ticket-meta">
              <span class="meta-item">
                <Tag :value="getTypeLabel(ticket.type)" :severity="getTypeSeverity(ticket.type)" />
              </span>
              <span class="meta-item">
                <i class="pi pi-clock"></i>
                {{ getTimeAgo(ticket.created_at) }}
              </span>
              <span v-if="ticket.module_id" class="meta-item">
                <i class="pi pi-book"></i>
                Module {{ ticket.module_id }}
              </span>
              <span v-if="ticket.due_date" class="meta-item" :class="{ 'overdue': isOverdue(ticket.due_date) }">
                <i class="pi pi-calendar"></i>
                {{ formatDate(ticket.due_date) }}
              </span>
            </div>
          </div>

          <div class="ticket-status">
            <Tag :value="getStatusLabel(ticket.status)" :severity="getStatusSeverity(ticket.status)" />
          </div>

          <div class="ticket-assignee">
            <div v-if="ticket.assigned_to" class="assignee-avatar" v-tooltip.top="getAssigneeName(ticket.assigned_to)">
              {{ getInitials(getAssigneeName(ticket.assigned_to)) }}
            </div>
            <div v-else class="no-assignee" v-tooltip.top="'Non assigné'">
              <i class="pi pi-user-plus"></i>
            </div>
          </div>

          <div class="ticket-actions">
            <Button 
              icon="pi pi-ellipsis-v" 
              text 
              rounded
              size="small"
              @click.stop="toggleMenu($event, ticket)"
            />
          </div>
        </div>

        <!-- Vide -->
        <div v-if="filteredTickets.length === 0" class="empty-state">
          <i class="pi pi-inbox"></i>
          <h3>Aucun ticket trouvé</h3>
          <p>Essayez de modifier vos filtres ou créez un nouveau ticket</p>
          <Button label="Créer un ticket" icon="pi pi-plus" @click="showCreateDialog = true" />
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredTickets.length > 0" class="pagination-bar">
        <span class="pagination-info">
          {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, filteredTickets.length) }} sur {{ filteredTickets.length }}
        </span>
        <Paginator 
          :rows="itemsPerPage" 
          :totalRecords="filteredTickets.length"
          v-model:first="first"
          @page="onPageChange"
        />
      </div>
    </div>

    <!-- Sidebar Détails Ticket -->
    <Sidebar 
      v-model:visible="showSidebar" 
      position="right" 
      class="ticket-sidebar"
      :style="{ width: '50vw' }"
    >
      <template #header>
        <div class="sidebar-header">
          <div>
            <h2>{{ selectedTicket?.title }}</h2>
            <span class="ticket-id-header">#{{ selectedTicket?.id.split('-')[0] }}</span>
          </div>
        </div>
      </template>

      <TicketDetails
        v-if="selectedTicket"
        :ticket="selectedTicket"
        @edit="editTicket"
        @delete="deleteTicketConfirm"
        @update="handleTicketUpdate"
      />
    </Sidebar>

    <!-- Menu contextuel -->
    <Menu ref="ticketMenu" :model="menuItems" popup />

    <!-- Dialog Création -->
    <Dialog 
      v-model:visible="showCreateDialog" 
      header="Nouveau ticket" 
      :style="{ width: '800px' }" 
      modal
    >
      <TicketForm 
        :modules="modules"
        @save="createTicket" 
        @cancel="showCreateDialog = false"
      />
    </Dialog>

    <!-- Dialog Édition -->
    <Dialog 
      v-model:visible="showEditDialog" 
      header="Modifier le ticket" 
      :style="{ width: '800px' }" 
      modal
    >
      <TicketForm 
        :ticket="selectedTicket"
        :modules="modules"
        @save="updateTicket" 
        @cancel="showEditDialog = false"
      />
    </Dialog>

    <Toast />
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import TicketDetails from '@/components/academic/TicketDetails.vue'
import TicketForm from '@/components/academic/TicketForm.vue'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Checkbox from 'primevue/checkbox'
import Sidebar from 'primevue/sidebar'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import Menu from 'primevue/menu'
import Paginator from 'primevue/paginator'
import { getAllTickets, createTicket as createTicketService, updateTicket as updateTicketService, deleteTicket } from '@/service/ticketService'
import { TICKET_STATUS, TICKET_TYPES } from '@/service/ticketService'

const router = useRouter()
const toast = useToast()

const tickets = ref([])
const modules = ref([])
const users = ref([])
const selectedTicket = ref(null)
const selectedTickets = ref([])
const showSidebar = ref(false)
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const ticketMenu = ref(null)

// Pagination
const first = ref(0)
const itemsPerPage = ref(50)
const currentPage = ref(1)

// Filtres
const searchQuery = ref('')
const filterStatus = ref(null)
const filterType = ref(null)
const filterPriority = ref(null)
const filterAssignee = ref(null)

const statusOptions = [
  { label: 'Backlog', value: TICKET_STATUS.BACKLOG },
  { label: 'À faire', value: TICKET_STATUS.TODO },
  { label: 'En cours', value: TICKET_STATUS.IN_PROGRESS },
  { label: 'Validation', value: TICKET_STATUS.VALIDATION },
  { label: 'Problèmes', value: TICKET_STATUS.PROBLEMS },
  { label: 'Terminé', value: TICKET_STATUS.DONE }
]

const typeOptions = [
  { label: 'Vidéo', value: TICKET_TYPES.VIDEO },
  { label: 'Développement', value: TICKET_TYPES.DEVELOPMENT },
  { label: 'Simulation', value: TICKET_TYPES.SIMULATION },
  { label: 'Autre', value: TICKET_TYPES.OTHER }
]

const priorityOptions = [
  { label: 'Basse', value: 'low' },
  { label: 'Normale', value: 'normal' },
  { label: 'Haute', value: 'high' },
  { label: 'Urgente', value: 'urgent' }
]

// Menu contextuel
const menuItems = computed(() => [
  {
    label: 'Ouvrir',
    icon: 'pi pi-external-link',
    command: () => selectTicket(selectedTicket.value)
  },
  {
    label: 'Modifier',
    icon: 'pi pi-pencil',
    command: () => editTicket(selectedTicket.value)
  },
  {
    separator: true
  },
  {
    label: 'Supprimer',
    icon: 'pi pi-trash',
    command: () => deleteTicketConfirm(selectedTicket.value.id)
  }
])

// Tickets filtrés
const filteredTickets = computed(() => {
  let filtered = [...tickets.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t => 
      t.title.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query) ||
      t.id.toLowerCase().includes(query)
    )
  }
  
  if (filterStatus.value) {
    filtered = filtered.filter(t => t.status === filterStatus.value)
  }
  
  if (filterType.value) {
    filtered = filtered.filter(t => t.type === filterType.value)
  }
  
  if (filterPriority.value) {
    filtered = filtered.filter(t => t.priority === filterPriority.value)
  }
  
  if (filterAssignee.value) {
    filtered = filtered.filter(t => t.assigned_to === filterAssignee.value)
  }
  
  return filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

// Tickets paginés
const paginatedTickets = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return filteredTickets.value.slice(start, end)
})

// Fonctions utilitaires
function getTypeIcon(type) {
  switch(type) {
    case TICKET_TYPES.VIDEO: return 'pi pi-video'
    case TICKET_TYPES.DEVELOPMENT: return 'pi pi-code'
    case TICKET_TYPES.SIMULATION: return 'pi pi-desktop'
    default: return 'pi pi-folder'
  }
}

function getTypeLabel(type) {
  switch(type) {
    case TICKET_TYPES.VIDEO: return 'Vidéo'
    case TICKET_TYPES.DEVELOPMENT: return 'Développement'
    case TICKET_TYPES.SIMULATION: return 'Simulation'
    default: return 'Autre'
  }
}

function getTypeSeverity(type) {
  switch(type) {
    case TICKET_TYPES.VIDEO: return 'info'
    case TICKET_TYPES.DEVELOPMENT: return 'success'
    case TICKET_TYPES.SIMULATION: return 'warning'
    default: return 'secondary'
  }
}

function getStatusLabel(status) {
  switch(status) {
    case TICKET_STATUS.BACKLOG: return 'Backlog'
    case TICKET_STATUS.TODO: return 'À faire'
    case TICKET_STATUS.IN_PROGRESS: return 'En cours'
    case TICKET_STATUS.VALIDATION: return 'Validation'
    case TICKET_STATUS.PROBLEMS: return 'Problèmes'
    case TICKET_STATUS.DONE: return 'Terminé'
    default: return status
  }
}

function getStatusSeverity(status) {
  switch(status) {
    case TICKET_STATUS.BACKLOG: return 'secondary'
    case TICKET_STATUS.TODO: return 'info'
    case TICKET_STATUS.IN_PROGRESS: return 'warning'
    case TICKET_STATUS.VALIDATION: return 'help'
    case TICKET_STATUS.PROBLEMS: return 'danger'
    case TICKET_STATUS.DONE: return 'success'
    default: return 'secondary'
  }
}

function getAssigneeName(userId) {
  const user = users.value.find(u => u.value === userId)
  return user?.label || 'Utilisateur'
}

function getInitials(name) {
  if (!name) return 'U'
  const parts = name.split(' ')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return name.substring(0, 2).toUpperCase()
}

function getTimeAgo(date) {
  const now = new Date()
  const past = new Date(date)
  const diffMs = now - past
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)
  
  if (diffMins < 1) return 'À l\'instant'
  if (diffMins < 60) return `Il y a ${diffMins}min`
  if (diffHours < 24) return `Il y a ${diffHours}h`
  if (diffDays < 7) return `Il y a ${diffDays}j`
  return past.toLocaleDateString('fr-FR')
}

function formatDate(date) {
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

function isOverdue(date) {
  return new Date(date) < new Date()
}

// Actions
function selectTicket(ticket) {
  selectedTicket.value = ticket
  showSidebar.value = true
}

function toggleMenu(event, ticket) {
  selectedTicket.value = ticket
  ticketMenu.value.toggle(event)
}

function onPageChange(event) {
  currentPage.value = event.page + 1
  first.value = event.first
}

// CRUD
async function loadTickets() {
  try {
    tickets.value = await getAllTickets()
  } catch (error) {
    console.error('[TicketList] Erreur:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur', 
      detail: 'Impossible de charger les tickets',
      life: 4000 
    })
  }
}

async function loadUsers() {
  try {
    const { supabase } = await import('@/supabase')
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .order('full_name')
    
    if (error) throw error
    users.value = data.map(u => ({
      label: u.full_name || u.email,
      value: u.id
    }))
  } catch (error) {
    console.error('[TicketList] Erreur:', error)
  }
}

async function createTicket(ticketData) {
  try {
    await createTicketService(ticketData)
    toast.add({ 
      severity: 'success', 
      summary: 'Succès', 
      detail: 'Ticket créé',
      life: 3000 
    })
    showCreateDialog.value = false
    await loadTickets()
  } catch (error) {
    console.error('[TicketList] Erreur:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur', 
      detail: 'Impossible de créer le ticket',
      life: 4000 
    })
  }
}

async function updateTicket(ticketData) {
  try {
    await updateTicketService(selectedTicket.value.id, ticketData)
    toast.add({ 
      severity: 'success', 
      summary: 'Succès', 
      detail: 'Ticket modifié',
      life: 3000 
    })
    showEditDialog.value = false
    await loadTickets()
  } catch (error) {
    console.error('[TicketList] Erreur:', error)
    toast.add({ 
      severity: 'error', 
      summary: 'Erreur', 
      detail: 'Impossible de modifier le ticket',
      life: 4000 
    })
  }
}

function editTicket(ticket) {
  selectedTicket.value = ticket
  showSidebar.value = false
  showEditDialog.value = true
}

function deleteTicketConfirm(ticketId) {
  console.log('Delete:', ticketId)
}

async function handleTicketUpdate() {
  await loadTickets()
  if (selectedTicket.value) {
    const updatedTicket = tickets.value.find(t => t.id === selectedTicket.value.id)
    if (updatedTicket) {
      selectedTicket.value = updatedTicket
    }
  }
}

onMounted(async () => {
  await Promise.all([
    loadTickets(),
    loadUsers()
  ])
})
</script>

<style scoped>
.ticket-list-view {
}

.list-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

.list-header {
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
  gap: 2rem;
  flex-wrap: wrap;
}

.title-section h1 {
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.75rem;
  color: var(--text-color);
}

.subtitle {
  margin: 0.5rem 0 0 0;
  color: var(--text-color-secondary);
  font-size: 0.938rem;
}

.header-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Filtres */
.filters-section {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
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

/* Liste tickets */
.tickets-list {
  background: var(--surface-card);
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  overflow: hidden;
}

.ticket-row {
  display: grid;
  grid-template-columns: 50px 100px 1fr 150px 60px 60px;
  align-items: center;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--surface-border);
  cursor: pointer;
  transition: all 0.2s;
}

.ticket-row:hover {
  background: var(--surface-50);
}

.ticket-row.selected {
  background: rgba(59, 130, 246, 0.1);
  border-left: 4px solid var(--primary-color);
}

.ticket-checkbox {
  display: flex;
  align-items: center;
}

.ticket-id {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-color-secondary);
  font-weight: 600;
  font-size: 0.875rem;
}

.type-icon {
  color: var(--primary-color);
  font-size: 1rem;
}

.ticket-content {
  min-width: 0;
}

.ticket-title-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.ticket-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ticket-badges {
  display: flex;
  gap: 0.5rem;
}

.priority-tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}

.ticket-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.813rem;
  color: var(--text-color-secondary);
}

.meta-item.overdue {
  color: var(--red-600);
  font-weight: 600;
}

.ticket-assignee {
  display: flex;
  justify-content: center;
}

.assignee-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--green-500) 0%, var(--green-600) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 700;
  border: 2px solid var(--green-200);
  cursor: pointer;
}

.no-assignee {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--surface-100);
  color: var(--text-color-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px dashed var(--surface-border);
  cursor: pointer;
}

/* Empty state */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
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
  margin: 0 0 1.5rem 0;
  color: var(--text-color-secondary);
}

/* Pagination */
.pagination-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--surface-card);
  border-radius: 12px;
  margin-top: 1rem;
  border: 1px solid var(--surface-border);
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
}

/* Sidebar */
:deep(.ticket-sidebar) {
  box-shadow: -4px 0 20px rgba(0,0,0,0.1);
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.sidebar-header h2 {
  margin: 0;
  font-size: 1.25rem;
}

.ticket-id-header {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  font-weight: 600;
}

/* Responsive */
@media (max-width: 1200px) {
  .ticket-row {
    grid-template-columns: 50px 80px 1fr 120px 50px 50px;
  }
}

@media (max-width: 768px) {
  .ticket-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
  
  .ticket-checkbox,
  .ticket-actions {
    display: none;
  }
}
</style>
