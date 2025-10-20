<template>
  <Navbar />
  <div class="page-wrapper">
    <div class="academic-kanban-page">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <h1>
              <i class="pi pi-box text-primary"></i>
              Tableau Kanban - Gestion Académique
            </h1>
            <p class="text-600">Suivi de la production de contenu académique</p>
          </div>
          
          <div class="header-actions">
            <Button 
              label="Nouveau ticket"
              icon="pi pi-plus"
              @click="showCreateDialog = true"
              severity="success"
            />
            <Button 
              label="Statistiques"
              icon="pi pi-chart-bar"
              @click="showStatsDialog = true"
              outlined
            />
          </div>
        </div>

        <!-- Filtres -->
        <div class="filters-section mt-4">
          <div class="grid">
            <div class="col-12 md:col-3">
              <Dropdown
                v-model="filterType"
                :options="typeOptions"
                optionLabel="label"
                optionValue="value"
                placeholder="Tous les types"
                class="w-full"
                showClear
              />
            </div>
            <div class="col-12 md:col-3">
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
            <div class="col-12 md:col-3">
              <InputText
                v-model="searchQuery"
                placeholder="Rechercher..."
                class="w-full"
                @input="debouncedSearch"
              >
                <template #prepend>
                  <i class="pi pi-search"></i>
                </template>
              </InputText>
            </div>
            <div class="col-12 md:col-3 flex gap-2">
              <Button 
                label="Rafraîchir"
                icon="pi pi-refresh"
                @click="loadTickets"
                :loading="loading"
                outlined
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Kanban Board -->
      <div v-if="loading" class="loading-state">
        <ProgressSpinner />
        <p>Chargement des tickets...</p>
      </div>

      <KanbanBoard
        v-else
        :tickets="filteredTickets"
        @ticket-click="openTicketDetails"
        @status-change="handleStatusChange"
        @ticket-action="handleTicketAction"
      />

      <!-- Dialog de création de ticket -->
      <Dialog
        v-model:visible="showCreateDialog"
        modal
        :header="editingTicket ? 'Modifier le ticket' : 'Nouveau ticket'"
        :style="{ width: '900px' }"
        :closable="true"
      >
        <TicketForm
          :ticket="editingTicket"
          :modules="moduleOptions"
          @save="saveTicket"
          @cancel="closeCreateDialog"
        />
      </Dialog>

      <!-- Dialog de détails du ticket -->
      <Dialog
        v-model:visible="showDetailsDialog"
        modal
        header="Détails du ticket"
        :style="{ width: '800px' }"
        :closable="true"
      >
        <TicketDetails
          v-if="selectedTicket"
          :ticket="selectedTicket"
          @edit="editTicket"
          @delete="deleteTicketConfirm"
          @publish="publishToVimeo"
          @close="showDetailsDialog = false"
        />
      </Dialog>

      <!-- Dialog de statistiques -->
      <Dialog
        v-model:visible="showStatsDialog"
        modal
        header="Statistiques"
        :style="{ width: '600px' }"
      >
        <div v-if="stats" class="stats-content">
          <div class="stat-card">
            <span class="stat-label">Total de tickets</span>
            <span class="stat-value">{{ stats.total }}</span>
          </div>

          <Divider />

          <h3>Par statut</h3>
          <div class="grid">
            <div v-for="(count, status) in stats.by_status" :key="status" class="col-6">
              <div class="stat-item">
                <span>{{ getStatusLabel(status) }}</span>
                <Tag :value="count" severity="secondary" />
              </div>
            </div>
          </div>

          <Divider />

          <h3>Par type</h3>
          <div class="grid">
            <div v-for="(count, type) in stats.by_type" :key="type" class="col-6">
              <div class="stat-item">
                <span>{{ getTypeLabel(type) }}</span>
                <Tag :value="count" severity="info" />
              </div>
            </div>
          </div>
        </div>
      </Dialog>

      <!-- Confirmation de suppression -->
      <ConfirmDialog />
      <Toast />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'
import Navbar from '@/components/common/utils/Navbar.vue'
import KanbanBoard from '@/components/academic/KanbanBoard.vue'
import TicketForm from '@/components/academic/TicketForm.vue'
import TicketDetails from '@/components/academic/TicketDetails.vue'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import ProgressSpinner from 'primevue/progressspinner'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'
import Toast from 'primevue/toast'
import ConfirmDialog from 'primevue/confirmdialog'
import ticketService, { TICKET_STATUS, TICKET_TYPES } from '@/service/ticketService'
import { useModules } from '@/composables/useModules'

const router = useRouter()
const toast = useToast()
const confirm = useConfirm()

// State
const loading = ref(true)
const tickets = ref([])
const selectedTicket = ref(null)
const editingTicket = ref(null)
const showCreateDialog = ref(false)
const showDetailsDialog = ref(false)
const showStatsDialog = ref(false)
const stats = ref(null)

// Filtres
const filterType = ref(null)
const filterModule = ref(null)
const searchQuery = ref('')

// Modules
const { modules: supabaseModules, loadModules } = useModules()
const moduleOptions = computed(() => supabaseModules.value || [])

// Options de types
const typeOptions = [
  { label: 'Tous les types', value: null },
  { label: 'Vidéo', value: TICKET_TYPES.VIDEO },
  { label: 'Développement', value: TICKET_TYPES.DEVELOPMENT },
  { label: 'Simulation', value: TICKET_TYPES.SIMULATION },
  { label: 'Autre', value: TICKET_TYPES.OTHER }
]

// Tickets filtrés
const filteredTickets = computed(() => {
  let result = tickets.value

  // Filtre par type
  if (filterType.value) {
    result = result.filter(t => t.type === filterType.value)
  }

  // Filtre par module
  if (filterModule.value) {
    result = result.filter(t => t.module_id === filterModule.value)
  }

  // Recherche textuelle
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(t => 
      t.title?.toLowerCase().includes(query) ||
      t.description?.toLowerCase().includes(query)
    )
  }

  return result
})

// Charger les tickets
async function loadTickets() {
  loading.value = true
  try {
    tickets.value = await ticketService.getAllTickets()
    console.log('[AcademicKanban] ✅ Tickets chargés:', tickets.value.length)
  } catch (error) {
    console.error('[AcademicKanban] ❌ Erreur:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les tickets',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

// Charger les statistiques
async function loadStats() {
  try {
    stats.value = await ticketService.getTicketStats()
  } catch (error) {
    console.error('[AcademicKanban] Erreur stats:', error)
  }
}

// Sauvegarder un ticket
async function saveTicket(ticketData) {
  try {
    if (editingTicket.value) {
      await ticketService.updateTicket(editingTicket.value.id, ticketData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Ticket mis à jour',
        life: 3000
      })
    } else {
      await ticketService.createTicket(ticketData)
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: 'Ticket créé',
        life: 3000
      })
    }
    
    closeCreateDialog()
    await loadTickets()
  } catch (error) {
    console.error('[AcademicKanban] Erreur save:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de sauvegarder le ticket',
      life: 3000
    })
  }
}

// Gérer le changement de statut (drag & drop)
async function handleStatusChange({ ticket, newStatus }) {
  try {
    await ticketService.changeTicketStatus(ticket.id, newStatus)
    toast.add({
      severity: 'success',
      summary: 'Statut mis à jour',
      detail: `Ticket déplacé vers ${getStatusLabel(newStatus)}`,
      life: 2000
    })
    await loadTickets()
  } catch (error) {
    console.error('[AcademicKanban] Erreur changement statut:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de changer le statut',
      life: 3000
    })
  }
}

// Actions sur les tickets
function handleTicketAction({ action, ticket }) {
  switch (action) {
    case 'edit':
      editTicket(ticket)
      break
    case 'duplicate':
      duplicateTicket(ticket)
      break
    case 'delete':
      deleteTicketConfirm(ticket)
      break
  }
}

// Ouvrir les détails
function openTicketDetails(ticket) {
  selectedTicket.value = ticket
  showDetailsDialog.value = true
}

// Éditer un ticket
function editTicket(ticket) {
  editingTicket.value = ticket
  showDetailsDialog.value = false
  showCreateDialog.value = true
}

// Dupliquer un ticket
async function duplicateTicket(ticket) {
  try {
    const duplicate = {
      ...ticket,
      title: `${ticket.title} (copie)`,
      status: TICKET_STATUS.BACKLOG
    }
    delete duplicate.id
    delete duplicate.created_at
    delete duplicate.updated_at
    
    await ticketService.createTicket(duplicate)
    toast.add({
      severity: 'success',
      summary: 'Ticket dupliqué',
      life: 2000
    })
    await loadTickets()
  } catch (error) {
    console.error('[AcademicKanban] Erreur duplication:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de dupliquer le ticket',
      life: 3000
    })
  }
}

// Confirmer la suppression
function deleteTicketConfirm(ticket) {
  confirm.require({
    message: `Êtes-vous sûr de vouloir supprimer "${ticket.title}" ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: () => deleteTicket(ticket.id)
  })
}

// Supprimer un ticket
async function deleteTicket(ticketId) {
  try {
    await ticketService.deleteTicket(ticketId)
    toast.add({
      severity: 'success',
      summary: 'Ticket supprimé',
      life: 2000
    })
    showDetailsDialog.value = false
    await loadTickets()
  } catch (error) {
    console.error('[AcademicKanban] Erreur suppression:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer le ticket',
      life: 3000
    })
  }
}

// Publier sur Vimeo
async function publishToVimeo(ticket, vimeoData) {
  try {
    await ticketService.publishToVimeo(ticket.id, vimeoData.vimeoId, vimeoData.vimeoUrl)
    toast.add({
      severity: 'success',
      summary: 'Publié sur Vimeo',
      detail: 'La vidéo est maintenant disponible',
      life: 3000
    })
    await loadTickets()
    showDetailsDialog.value = false
  } catch (error) {
    console.error('[AcademicKanban] Erreur publication Vimeo:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de publier sur Vimeo',
      life: 3000
    })
  }
}

// Fermer le dialog de création
function closeCreateDialog() {
  showCreateDialog.value = false
  editingTicket.value = null
}

// Labels
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

function getTypeLabel(type) {
  const labels = {
    [TICKET_TYPES.VIDEO]: 'Vidéo',
    [TICKET_TYPES.DEVELOPMENT]: 'Développement',
    [TICKET_TYPES.SIMULATION]: 'Simulation',
    [TICKET_TYPES.OTHER]: 'Autre'
  }
  return labels[type] || type
}

// Recherche avec debounce
let searchTimeout
function debouncedSearch() {
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    // La recherche est gérée par le computed filteredTickets
  }, 300)
}

// Lifecycle
onMounted(async () => {
  console.log('[AcademicKanban] 🚀 Chargement des données...')
  
  await loadModules()
  console.log('[AcademicKanban] 📦 Modules chargés:', supabaseModules.value)
  console.log('[AcademicKanban] 📦 Nombre de modules:', supabaseModules.value?.length)
  
  await loadTickets()
  await loadStats()
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

.academic-kanban-page {
  min-height: 100vh;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-header {
  background: var(--surface-card);
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border-left: 4px solid var(--primary-color);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
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

.title-section p {
  margin: 0.5rem 0 0 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.filters-section {
  background: var(--surface-50);
  padding: 1.5rem;
  border-radius: 12px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
}

.stats-content {
  padding: 1rem;
}

.stat-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  background: var(--primary-50);
  border-radius: 12px;
  margin-bottom: 1rem;
}

.stat-label {
  font-size: 1rem;
  color: var(--text-color-secondary);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--primary-color);
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--surface-50);
  border-radius: 8px;
  margin-bottom: 0.5rem;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions > * {
    flex: 1;
  }
}
</style>
