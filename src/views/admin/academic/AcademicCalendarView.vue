<template>
  <div class="calendar-view">
    <Navbar />
    
    <div class="calendar-container">
      <!-- Header -->
      <div class="calendar-header">
        <div class="header-content">
          <div class="title-section">
            <h1>
              <i class="pi pi-calendar"></i>
              Calendrier des Tickets
            </h1>
            <p class="subtitle">Vue des dates de rendu et échéances</p>
          </div>
          
          <div class="header-actions">
            <Button 
              label="Vue Liste" 
              icon="pi pi-list" 
              outlined
              @click="$router.push('/admin/academic/tickets')"
            />
            <Button 
              label="Vue Kanban" 
              icon="pi pi-th-large" 
              outlined
              @click="$router.push('/admin/academic/kanban')"
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

      <!-- Filtres -->
      <div class="filters-bar">
        <div class="filter-group">
          <label>Type</label>
          <MultiSelect 
            v-model="selectedTypes" 
            :options="typeOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Tous les types"
            class="filter-select"
          />
        </div>
        
        <div class="filter-group">
          <label>Statut</label>
          <MultiSelect 
            v-model="selectedStatuses" 
            :options="statusOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Tous les statuts"
            class="filter-select"
          />
        </div>

        <div class="filter-group">
          <label>Assigné à</label>
          <Dropdown 
            v-model="selectedAssignee" 
            :options="[{ label: 'Tous', value: null }, ...users]"
            optionLabel="label"
            optionValue="value"
            placeholder="Tous"
            class="filter-select"
            showClear
          />
        </div>

        <Button 
          label="Réinitialiser" 
          icon="pi pi-filter-slash" 
          outlined
          severity="secondary"
          @click="resetFilters"
        />
      </div>

      <!-- Calendrier PrimeVue -->
      <div class="calendar-content">
        <FullCalendar :options="calendarOptions" ref="fullCalendar" />
      </div>
    </div>

    <!-- Dialog Détails Ticket -->
    <Dialog 
      v-model:visible="showDetailsDialog" 
      :style="{ width: '90vw' }" 
      modal
      :dismissableMask="true"
      maximizable
    >
      <template #header>
        <div class="dialog-header-custom">
          <i class="pi pi-ticket"></i>
          <span>Détails du ticket</span>
        </div>
      </template>
      
      <TicketDetails
        v-if="selectedTicket"
        :ticket="selectedTicket"
        @edit="editTicket"
        @delete="deleteTicketConfirm"
        @close="showDetailsDialog = false"
        @update="handleTicketUpdate"
      />
    </Dialog>

    <!-- Dialog Création Ticket -->
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

    <!-- Dialog Édition Ticket -->
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
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import frLocale from '@fullcalendar/core/locales/fr'
import Navbar from '@/components/common/utils/Navbar.vue'
import TicketDetails from '@/components/academic/TicketDetails.vue'
import TicketForm from '@/components/academic/TicketForm.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'
import MultiSelect from 'primevue/multiselect'
import Dropdown from 'primevue/dropdown'
import { getAllTickets, createTicket as createTicketService, updateTicket as updateTicketService, deleteTicket } from '@/service/ticketService'
import { TICKET_STATUS, TICKET_TYPES } from '@/service/ticketService'

const router = useRouter()
const toast = useToast()

const tickets = ref([])
const modules = ref([])
const users = ref([])
const selectedTicket = ref(null)
const showDetailsDialog = ref(false)
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const fullCalendar = ref(null)

// Filtres
const selectedTypes = ref([])
const selectedStatuses = ref([])
const selectedAssignee = ref(null)

const typeOptions = [
  { label: 'Vidéo', value: TICKET_TYPES.VIDEO },
  { label: 'Développement', value: TICKET_TYPES.DEVELOPMENT },
  { label: 'Simulation', value: TICKET_TYPES.SIMULATION },
  { label: 'Autre', value: TICKET_TYPES.OTHER }
]

const statusOptions = [
  { label: 'Backlog', value: TICKET_STATUS.BACKLOG },
  { label: 'À faire', value: TICKET_STATUS.TODO },
  { label: 'En cours', value: TICKET_STATUS.IN_PROGRESS },
  { label: 'Validation', value: TICKET_STATUS.VALIDATION },
  { label: 'Problèmes', value: TICKET_STATUS.PROBLEMS },
  { label: 'Terminé', value: TICKET_STATUS.DONE }
]

// Tickets filtrés
const filteredTickets = computed(() => {
  let filtered = tickets.value.filter(t => t.due_date)
  
  if (selectedTypes.value.length > 0) {
    filtered = filtered.filter(t => selectedTypes.value.includes(t.type))
  }
  
  if (selectedStatuses.value.length > 0) {
    filtered = filtered.filter(t => selectedStatuses.value.includes(t.status))
  }
  
  if (selectedAssignee.value) {
    filtered = filtered.filter(t => t.assigned_to === selectedAssignee.value)
  }
  
  return filtered
})

// Configuration FullCalendar
const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: frLocale,
  headerToolbar: {
    left: 'prev,next today',
    center: 'title',
    right: 'dayGridMonth,dayGridWeek'
  },
  events: filteredTickets.value.map(ticket => ({
    id: ticket.id,
    title: ticket.title,
    start: ticket.due_date,
    backgroundColor: getTicketColor(ticket),
    borderColor: getTicketBorderColor(ticket),
    extendedProps: {
      ticket: ticket
    }
  })),
  eventClick: handleEventClick,
  dateClick: handleDateClick,
  height: 'auto',
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }
}))

// Couleurs selon le statut et la priorité
function getTicketColor(ticket) {
  if (ticket.status === TICKET_STATUS.DONE) return '#10b981'
  if (ticket.status === TICKET_STATUS.PROBLEMS) return '#ef4444'
  if (ticket.priority === 'urgent') return '#dc2626'
  if (ticket.priority === 'high') return '#f59e0b'
  if (ticket.status === TICKET_STATUS.IN_PROGRESS) return '#3b82f6'
  if (ticket.status === TICKET_STATUS.VALIDATION) return '#8b5cf6'
  return '#6b7280'
}

function getTicketBorderColor(ticket) {
  if (ticket.status === TICKET_STATUS.DONE) return '#059669'
  if (ticket.status === TICKET_STATUS.PROBLEMS) return '#dc2626'
  if (ticket.priority === 'urgent') return '#991b1b'
  if (ticket.priority === 'high') return '#d97706'
  if (ticket.status === TICKET_STATUS.IN_PROGRESS) return '#2563eb'
  if (ticket.status === TICKET_STATUS.VALIDATION) return '#7c3aed'
  return '#4b5563'
}

// Handlers
function handleEventClick(info) {
  selectedTicket.value = info.event.extendedProps.ticket
  showDetailsDialog.value = true
}

function handleDateClick(info) {
  console.log('Date cliquée:', info.dateStr)
  // On pourrait créer un nouveau ticket avec cette date
}

function resetFilters() {
  selectedTypes.value = []
  selectedStatuses.value = []
  selectedAssignee.value = null
}

// CRUD Operations
async function loadTickets() {
  try {
    tickets.value = await getAllTickets()
    console.log('[Calendar] Tickets chargés:', tickets.value.length)
  } catch (error) {
    console.error('[Calendar] Erreur chargement tickets:', error)
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
    console.error('[Calendar] Erreur chargement utilisateurs:', error)
  }
}

async function createTicket(ticketData) {
  try {
    await createTicketService(ticketData)
    toast.add({ 
      severity: 'success', 
      summary: 'Succès', 
      detail: 'Ticket créé avec succès',
      life: 3000 
    })
    showCreateDialog.value = false
    await loadTickets()
  } catch (error) {
    console.error('[Calendar] Erreur création ticket:', error)
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
      detail: 'Ticket modifié avec succès',
      life: 3000 
    })
    showEditDialog.value = false
    await loadTickets()
  } catch (error) {
    console.error('[Calendar] Erreur modification ticket:', error)
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
  showDetailsDialog.value = false
  showEditDialog.value = true
}

function deleteTicketConfirm(ticketId) {
  // Implémenter la confirmation
  console.log('Delete ticket:', ticketId)
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

// Charger les données au montage
onMounted(async () => {
  await Promise.all([
    loadTickets(),
    loadUsers()
  ])
})
</script>

<style scoped>
.calendar-view {
  min-height: 100vh;
}

.calendar-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 2rem;
}

.calendar-header {
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

/* Filtres */
.filters-bar {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  background: var(--surface-card);
  border-radius: 12px;
  margin-bottom: 2rem;
  border: 1px solid var(--surface-border);
  flex-wrap: wrap;
  align-items: flex-end;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

.filter-group label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-color);
}

.filter-select {
  width: 100%;
}

/* Calendrier */
.calendar-content {
  background: var(--surface-card);
  padding: 2rem;
  border-radius: 12px;
  border: 1px solid var(--surface-border);
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

/* FullCalendar overrides */
:deep(.fc) {
  font-family: var(--font-family);
}

:deep(.fc-toolbar-title) {
  font-size: 1.5rem !important;
  color: var(--text-color) !important;
  font-weight: 600;
}

:deep(.fc-button) {
  background: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
  color: white !important;
  text-transform: capitalize !important;
  padding: 0.5rem 1rem !important;
  border-radius: 8px !important;
}

:deep(.fc-button:hover) {
  background: var(--primary-600) !important;
}

:deep(.fc-button-active) {
  background: var(--primary-700) !important;
}

:deep(.fc-daygrid-day) {
  background: var(--surface-50);
  border-color: var(--surface-border) !important;
}

:deep(.fc-daygrid-day:hover) {
  background: var(--surface-100);
}

:deep(.fc-day-today) {
  background: rgba(59, 130, 246, 0.1) !important;
}

:deep(.fc-event) {
  cursor: pointer;
  border-radius: 4px;
  padding: 2px 4px;
  font-size: 0.813rem;
  font-weight: 500;
}

:deep(.fc-event:hover) {
  opacity: 0.85;
}

:deep(.fc-col-header-cell) {
  background: var(--surface-100);
  color: var(--text-color);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 0.75rem;
  padding: 0.75rem;
}

:deep(.fc-daygrid-day-number) {
  color: var(--text-color);
  padding: 0.5rem;
  font-weight: 500;
}

.dialog-header-custom {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 600;
}

/* Responsive */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .filters-bar {
    flex-direction: column;
  }
  
  .filter-group {
    width: 100%;
  }
}
</style>
