<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Gestion des Rôles par Filière" 
        subtitle="Assignez les rôles RM, Enseignant, Admin par filière SI/PHY" 
        icon="pi pi-id-card" 
      />
    </template>

    <div class="role-management">
      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <ProgressSpinner />
        <p>Chargement des données...</p>
      </div>

      <div v-else>
        <!-- Stats globales -->
        <div class="stats-section">
          <div class="stats-grid">
            <!-- SI Stats -->
            <div class="stat-card si-card">
              <div class="stat-header">
                <i class="pi pi-heart"></i>
                <span>Soins Infirmiers (SI)</span>
              </div>
              <div class="stat-content">
                <div class="stat-item">
                  <span class="label">Modules</span>
                  <span class="value">{{ stats?.si?.modules || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">Enseignants</span>
                  <span class="value">{{ stats?.si?.teachers || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">RM</span>
                  <span class="value">{{ stats?.si?.rm || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- PHY Stats -->
            <div class="stat-card phy-card">
              <div class="stat-header">
                <i class="pi pi-user"></i>
                <span>Physiothérapie (PHY)</span>
              </div>
              <div class="stat-content">
                <div class="stat-item">
                  <span class="label">Modules</span>
                  <span class="value">{{ stats?.phy?.modules || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">Enseignants</span>
                  <span class="value">{{ stats?.phy?.teachers || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">RM</span>
                  <span class="value">{{ stats?.phy?.rm || 0 }}</span>
                </div>
              </div>
            </div>

            <!-- Total -->
            <div class="stat-card total-card">
              <div class="stat-header">
                <i class="pi pi-chart-bar"></i>
                <span>Total</span>
              </div>
              <div class="stat-content">
                <div class="stat-item">
                  <span class="label">Modules</span>
                  <span class="value">{{ stats?.totalModules || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">Utilisateurs</span>
                  <span class="value">{{ stats?.totalUsersWithRoles || 0 }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">Sans filière</span>
                  <span class="value warning">{{ stats?.modulesNoTrack || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <TabView v-model:activeIndex="activeTab">
          <!-- Tab: Rôles par filière -->
          <TabPanel header="Rôles par Filière">
            <div class="tab-content">
              <!-- Actions -->
              <div class="actions-bar">
                <Button 
                  label="Assigner un rôle" 
                  icon="pi pi-plus" 
                  @click="showAssignDialog = true"
                />
                <div class="filters">
                  <Dropdown 
                    v-model="filterTrack" 
                    :options="trackOptions" 
                    optionLabel="label" 
                    optionValue="value"
                    placeholder="Filière"
                    class="filter-dropdown"
                  />
                  <Dropdown 
                    v-model="filterRole" 
                    :options="roleOptions" 
                    optionLabel="label" 
                    optionValue="value"
                    placeholder="Rôle"
                    class="filter-dropdown"
                  />
                </div>
              </div>

              <!-- Table des rôles -->
              <DataTable 
                :value="filteredRoles" 
                :paginator="true" 
                :rows="10"
                stripedRows
                class="roles-table"
              >
                <Column field="userName" header="Utilisateur" sortable>
                  <template #body="{ data }">
                    <div class="user-cell">
                      <span class="user-name">{{ data.userName }}</span>
                      <span class="user-email">{{ data.userEmail }}</span>
                    </div>
                  </template>
                </Column>
                <Column field="trackId" header="Filière" sortable>
                  <template #body="{ data }">
                    <Tag :value="data.trackId" :severity="data.trackId === 'SI' ? 'info' : 'success'" />
                  </template>
                </Column>
                <Column field="role" header="Rôle" sortable>
                  <template #body="{ data }">
                    <Tag :value="getRoleLabel(data.role)" :severity="getRoleSeverity(data.role)" />
                  </template>
                </Column>
                <Column field="isActive" header="Statut">
                  <template #body="{ data }">
                    <Tag :value="data.isActive ? 'Actif' : 'Inactif'" :severity="data.isActive ? 'success' : 'danger'" />
                  </template>
                </Column>
                <Column header="Actions" style="width: 100px">
                  <template #body="{ data }">
                    <Button 
                      v-if="data.isActive"
                      icon="pi pi-trash" 
                      class="p-button-rounded p-button-danger p-button-text"
                      @click="confirmRemoveRole(data)"
                    />
                  </template>
                </Column>
              </DataTable>
            </div>
          </TabPanel>

          <!-- Tab: Modules et RM -->
          <TabPanel header="Modules & Responsables">
            <div class="tab-content">
              <!-- Filtre -->
              <div class="actions-bar">
                <span class="p-input-icon-left">
                  <i class="pi pi-search" />
                  <InputText v-model="moduleSearch" placeholder="Rechercher module..." />
                </span>
                <Dropdown 
                  v-model="filterModuleTrack" 
                  :options="trackOptionsWithAll" 
                  optionLabel="label" 
                  optionValue="value"
                  placeholder="Filière"
                  class="filter-dropdown"
                />
              </div>

              <!-- Table des modules -->
              <DataTable 
                :value="filteredModules" 
                :paginator="true" 
                :rows="15"
                stripedRows
                class="modules-table"
              >
                <Column field="code" header="Code" sortable style="width: 100px" />
                <Column field="title" header="Module" sortable />
                <Column field="track_id" header="Filière" sortable style="width: 80px">
                  <template #body="{ data }">
                    <Tag 
                      :value="data.track_id || '—'" 
                      :severity="data.track_id === 'SI' ? 'info' : data.track_id === 'PHY' ? 'success' : 'warning'" 
                    />
                  </template>
                </Column>
                <Column field="year" header="Année" sortable style="width: 80px">
                  <template #body="{ data }">
                    BA{{ data.year }}
                  </template>
                </Column>
                <Column field="responsable_email" header="Responsable (RM)" sortable>
                  <template #body="{ data }">
                    <div class="rm-cell">
                      <span v-if="data.responsable_email">{{ data.responsable_email }}</span>
                      <span v-else class="no-rm">Non assigné</span>
                      <Button 
                        icon="pi pi-pencil" 
                        class="p-button-rounded p-button-text p-button-sm"
                        @click="editModuleRM(data)"
                      />
                    </div>
                  </template>
                </Column>
              </DataTable>
            </div>
          </TabPanel>
        </TabView>
      </div>

      <!-- Dialog: Assigner rôle -->
      <Dialog 
        v-model:visible="showAssignDialog" 
        header="Assigner un rôle" 
        :style="{ width: '450px' }"
        modal
      >
        <div class="assign-form">
          <div class="field">
            <label>Utilisateur</label>
            <Dropdown 
              v-model="assignForm.userId" 
              :options="users" 
              optionLabel="name" 
              optionValue="id"
              placeholder="Sélectionner un utilisateur"
              filter
              class="w-full"
            />
          </div>
          <div class="field">
            <label>Filière</label>
            <Dropdown 
              v-model="assignForm.trackId" 
              :options="tracks" 
              optionLabel="label" 
              optionValue="id"
              placeholder="Sélectionner une filière"
              class="w-full"
            />
          </div>
          <div class="field">
            <label>Rôle</label>
            <Dropdown 
              v-model="assignForm.role" 
              :options="availableRoles" 
              optionLabel="label" 
              optionValue="value"
              placeholder="Sélectionner un rôle"
              class="w-full"
            />
          </div>
        </div>
        <template #footer>
          <Button label="Annuler" icon="pi pi-times" class="p-button-text" @click="showAssignDialog = false" />
          <Button label="Assigner" icon="pi pi-check" @click="assignRole" :disabled="!canAssign" />
        </template>
      </Dialog>

      <!-- Dialog: Modifier RM -->
      <Dialog 
        v-model:visible="showRMDialog" 
        header="Modifier le Responsable de Module" 
        :style="{ width: '450px' }"
        modal
      >
        <div class="rm-form" v-if="selectedModule">
          <div class="module-info">
            <strong>{{ selectedModule.code }}</strong> - {{ selectedModule.title }}
          </div>
          <div class="field">
            <label>Email du Responsable</label>
            <Dropdown 
              v-model="rmForm.email" 
              :options="users" 
              optionLabel="email" 
              optionValue="email"
              placeholder="Sélectionner un utilisateur"
              filter
              editable
              class="w-full"
            />
          </div>
        </div>
        <template #footer>
          <Button label="Annuler" icon="pi pi-times" class="p-button-text" @click="showRMDialog = false" />
          <Button label="Enregistrer" icon="pi pi-check" @click="saveModuleRM" />
        </template>
      </Dialog>

      <!-- Confirm Dialog -->
      <ConfirmDialog />
      <Toast />
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import { useAuthStore } from '@/stores/authStore'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import InputText from 'primevue/inputtext'
import Dialog from 'primevue/dialog'
import ProgressSpinner from 'primevue/progressspinner'
import ConfirmDialog from 'primevue/confirmdialog'
import Toast from 'primevue/toast'
import { 
  loadAdminDashboard, 
  assignTrackRole, 
  removeTrackRole, 
  updateModuleRM 
} from '@/services/adminDashboardService'

const confirm = useConfirm()
const toast = useToast()
const authStore = useAuthStore()

// State
const loading = ref(true)
const activeTab = ref(0)
const stats = ref(null)
const roles = ref([])
const modules = ref([])
const tracks = ref([])
const users = ref([])

// Filters
const filterTrack = ref(null)
const filterRole = ref(null)
const filterModuleTrack = ref(null)
const moduleSearch = ref('')

// Dialogs
const showAssignDialog = ref(false)
const showRMDialog = ref(false)
const selectedModule = ref(null)

// Forms
const assignForm = ref({
  userId: null,
  trackId: null,
  role: null
})

const rmForm = ref({
  email: ''
})

// Options
const trackOptions = [
  { label: 'SI', value: 'SI' },
  { label: 'PHY', value: 'PHY' }
]

const trackOptionsWithAll = [
  { label: 'Toutes', value: null },
  { label: 'SI', value: 'SI' },
  { label: 'PHY', value: 'PHY' },
  { label: 'Sans filière', value: 'none' }
]

const roleOptions = [
  { label: 'Tous', value: null },
  { label: 'Admin', value: 'ADMIN' },
  { label: 'RM', value: 'RM' },
  { label: 'Enseignant', value: 'TEACHER' },
  { label: 'Secrétariat', value: 'SECRETARIAT' }
]

const availableRoles = [
  { label: 'Administrateur', value: 'ADMIN' },
  { label: 'Responsable de Module (RM)', value: 'RM' },
  { label: 'Enseignant', value: 'TEACHER' },
  { label: 'Secrétariat', value: 'SECRETARIAT' }
]

// Computed
const filteredRoles = computed(() => {
  let result = roles.value
  if (filterTrack.value) {
    result = result.filter(r => r.trackId === filterTrack.value)
  }
  if (filterRole.value) {
    result = result.filter(r => r.role === filterRole.value)
  }
  return result
})

const filteredModules = computed(() => {
  let result = modules.value
  
  if (filterModuleTrack.value === 'none') {
    result = result.filter(m => !m.track_id)
  } else if (filterModuleTrack.value) {
    result = result.filter(m => m.track_id === filterModuleTrack.value)
  }
  
  if (moduleSearch.value) {
    const search = moduleSearch.value.toLowerCase()
    result = result.filter(m => 
      m.code?.toLowerCase().includes(search) ||
      m.title?.toLowerCase().includes(search) ||
      m.responsable_email?.toLowerCase().includes(search)
    )
  }
  
  return result
})

const canAssign = computed(() => {
  return assignForm.value.userId && assignForm.value.trackId && assignForm.value.role
})

// Methods
function getRoleLabel(role) {
  const labels = {
    ADMIN: 'Admin',
    RM: 'RM',
    TEACHER: 'Enseignant',
    SECRETARIAT: 'Secrétariat'
  }
  return labels[role] || role
}

function getRoleSeverity(role) {
  const severities = {
    ADMIN: 'danger',
    RM: 'warning',
    TEACHER: 'info',
    SECRETARIAT: 'secondary'
  }
  return severities[role] || 'secondary'
}

function editModuleRM(module) {
  selectedModule.value = module
  rmForm.value.email = module.responsable_email || ''
  showRMDialog.value = true
}

async function assignRole() {
  const result = await assignTrackRole(
    assignForm.value.userId,
    assignForm.value.trackId,
    assignForm.value.role,
    authStore.user?.id
  )
  
  if (result.success) {
    toast.add({ severity: 'success', summary: 'Succès', detail: result.message, life: 3000 })
    showAssignDialog.value = false
    assignForm.value = { userId: null, trackId: null, role: null }
    await loadData()
  } else {
    toast.add({ severity: 'error', summary: 'Erreur', detail: result.message, life: 3000 })
  }
}

function confirmRemoveRole(role) {
  confirm.require({
    message: `Supprimer le rôle ${getRoleLabel(role.role)} de ${role.userName} pour ${role.trackId} ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    accept: async () => {
      const result = await removeTrackRole(role.id)
      if (result.success) {
        toast.add({ severity: 'success', summary: 'Rôle supprimé', life: 2000 })
        await loadData()
      }
    }
  })
}

async function saveModuleRM() {
  if (!selectedModule.value) return
  
  const result = await updateModuleRM(selectedModule.value.id, rmForm.value.email)
  
  if (result.success) {
    toast.add({ severity: 'success', summary: 'RM mis à jour', life: 2000 })
    showRMDialog.value = false
    await loadData()
  } else {
    toast.add({ severity: 'error', summary: 'Erreur', detail: result.message, life: 3000 })
  }
}

async function loadData() {
  loading.value = true
  try {
    const data = await loadAdminDashboard()
    stats.value = data.stats
    roles.value = data.roles
    modules.value = data.modules
    tracks.value = data.tracks
    users.value = data.users
  } catch (error) {
    console.error('Erreur chargement:', error)
    toast.add({ severity: 'error', summary: 'Erreur de chargement', life: 3000 })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.role-management {
  padding: 1.5rem;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  gap: 1rem;
}

/* Stats Section */
.stats-section {
  margin-bottom: 2rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  border-left: 4px solid;
}

.stat-card.si-card {
  border-left-color: #3b82f6;
}

.stat-card.phy-card {
  border-left-color: #10b981;
}

.stat-card.total-card {
  border-left-color: #8b5cf6;
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
  font-weight: 600;
  font-size: 1.1rem;
}

.stat-header i {
  font-size: 1.25rem;
}

.si-card .stat-header i { color: #3b82f6; }
.phy-card .stat-header i { color: #10b981; }
.total-card .stat-header i { color: #8b5cf6; }

.stat-content {
  display: flex;
  gap: 2rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-item .label {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.stat-item .value {
  font-size: 1.5rem;
  font-weight: 700;
}

.stat-item .value.warning {
  color: #f59e0b;
}

/* Tab Content */
.tab-content {
  padding: 1rem 0;
}

.actions-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.filters {
  display: flex;
  gap: 0.5rem;
}

.filter-dropdown {
  min-width: 120px;
}

/* Tables */
.user-cell {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 500;
}

.user-email {
  font-size: 0.85rem;
  color: var(--text-color-secondary);
}

.rm-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.no-rm {
  color: var(--text-color-secondary);
  font-style: italic;
}

/* Forms */
.assign-form,
.rm-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.field label {
  font-weight: 500;
}

.module-info {
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}
</style>
