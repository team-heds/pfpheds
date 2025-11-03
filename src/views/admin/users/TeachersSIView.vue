<template>
  <AdminLayout>
    <template #header>
      <PageHeader 
        title="Enseignants SI" 
        subtitle="Gestion des enseignants - Soins Infirmiers" 
        icon="pi pi-users" 
      />
    </template>

    <div class="teachers-page">
      <!-- Barre d'outils -->
      <div class="toolbar-card">
        <div class="search-section">
          <span class="p-input-icon-left">
            <i class="pi pi-search"></i>
            <InputText v-model="search" placeholder="Rechercher (nom, prénom, email)" class="search-input" />
          </span>
          <Button label="Nouvel Enseignant" icon="pi pi-plus" @click="createTeacher" />
        </div>
        <div class="stats-section">
          <div class="stat-item">
            <span class="stat-label">Total:</span>
            <span class="stat-value">{{ filteredUsers.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Heures totales:</span>
            <span class="stat-value">{{ totalHours }}h</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Avec modules RM:</span>
            <span class="stat-value">{{ teachersWithRM }}</span>
          </div>
        </div>
      </div>

      <!-- Tableau des enseignants -->
      <div class="table-card">
        <DataTable 
          v-model:selection="selectedTeachers"
          :value="filteredUsers" 
          :loading="loading" 
          responsiveLayout="scroll" 
          :paginator="true" 
          :rows="15"
          selectionMode="multiple"
          dataKey="id"
          @row-select="onRowSelect"
          @row-unselect="onRowUnselect"
        >
          <template #empty>
            <div class="empty-state">
              <i class="pi pi-inbox"></i>
              <p>Aucun enseignant trouvé</p>
            </div>
          </template>

          <Column selectionMode="multiple" headerStyle="width: 3rem"></Column>

          <Column field="Prenom" header="Prénom" sortable>
            <template #body="{ data }">
              <span class="editable-field" @click="editField(data, 'Prenom')">
                {{ data.Prenom || '-' }}
                <i class="pi pi-pencil edit-icon"></i>
              </span>
            </template>
          </Column>

          <Column field="Nom" header="Nom" sortable>
            <template #body="{ data }">
              <span class="editable-field" @click="editField(data, 'Nom')">
                {{ data.Nom || '-' }}
                <i class="pi pi-pencil edit-icon"></i>
              </span>
            </template>
          </Column>

          <Column field="email" header="Email" sortable>
            <template #body="{ data }">
              <a :href="`mailto:${data.email}`" class="email-link">{{ data.email }}</a>
            </template>
          </Column>

          <Column field="moduleRM" header="Module RM" sortable>
            <template #body="{ data }">
              <Dropdown 
                v-model="data.moduleRM" 
                :options="availableModules" 
                optionLabel="name" 
                optionValue="id"
                placeholder="Sélectionner" 
                @change="updateModuleRM(data)"
                class="compact-dropdown"
                showClear
              />
            </template>
          </Column>

          <Column field="hours" header="Heures" sortable>
            <template #body="{ data }">
              <InputNumber 
                v-model="data.hours" 
                :min="0" 
                :max="200"
                @blur="updateHours(data)"
                class="compact-input"
                placeholder="0"
              />
            </template>
          </Column>

          <Column field="classe" header="Classe" sortable>
            <template #body="{ data }">
              <Tag :value="data.classe || '-'" />
            </template>
          </Column>

          <Column header="Rôles">
            <template #body="{ data }">
              <div class="roles-tags">
                <Tag v-for="r in data.rolesList" :key="r" :value="r" :severity="getRoleSeverity(r)" />
              </div>
            </template>
          </Column>

          <Column header="Actions">
            <template #body="{ data }">
              <div class="action-buttons">
                <Button icon="pi pi-pencil" class="p-button-sm p-button-text" v-tooltip.top="'Éditer'" @click="editTeacher(data)" />
                <Button icon="pi pi-eye" class="p-button-sm p-button-text" v-tooltip.top="'Voir détails'" @click="viewTeacher(data)" />
                <Button icon="pi pi-trash" class="p-button-sm p-button-text p-button-danger" v-tooltip.top="'Supprimer'" @click="deleteTeacher(data)" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Panneau de sélection -->
      <div v-if="selectedTeachers.length > 0" class="selection-panel">
        <div class="selection-header">
          <h4>{{ selectedTeachers.length }} enseignant(s) sélectionné(s)</h4>
          <Button icon="pi pi-times" class="p-button-text p-button-rounded" @click="clearSelection" />
        </div>
        <div class="selection-content">
          <div class="selected-list">
            <div v-for="teacher in selectedTeachers" :key="teacher.id" class="selected-item">
              <div class="teacher-info">
                <strong>{{ teacher.Prenom }} {{ teacher.Nom }}</strong>
                <span>{{ teacher.email }}</span>
              </div>
              <div class="teacher-meta">
                <span v-if="teacher.moduleRM" class="module-badge">RM: {{ getModuleName(teacher.moduleRM) }}</span>
                <span class="hours-badge">{{ teacher.hours || 0 }}h</span>
              </div>
            </div>
          </div>
          <div class="bulk-actions">
            <Button label="Assigner module" icon="pi pi-book" class="p-button-outlined" @click="bulkAssignModule" />
            <Button label="Exporter sélection" icon="pi pi-download" class="p-button-outlined" @click="exportSelection" />
          </div>
        </div>
      </div>
    </div>

    <!-- Dialog d'édition -->
    <Dialog v-model:visible="editDialog" header="Éditer l'enseignant" :modal="true" :style="{ width: '600px' }">
      <div v-if="currentTeacher" class="edit-form">
        <div class="form-field">
          <label>Prénom</label>
          <InputText v-model="currentTeacher.Prenom" />
        </div>
        <div class="form-field">
          <label>Nom</label>
          <InputText v-model="currentTeacher.Nom" />
        </div>
        <div class="form-field">
          <label>Email</label>
          <InputText v-model="currentTeacher.email" type="email" />
        </div>
        <div class="form-field">
          <label>Module RM</label>
          <Dropdown v-model="currentTeacher.moduleRM" :options="availableModules" optionLabel="name" optionValue="id" placeholder="Sélectionner" showClear />
        </div>
        <div class="form-field">
          <label>Heures</label>
          <InputNumber v-model="currentTeacher.hours" :min="0" :max="200" />
        </div>
        <div class="form-field">
          <label>Classe</label>
          <InputText v-model="currentTeacher.classe" />
        </div>
      </div>
      <template #footer>
        <Button label="Annuler" icon="pi pi-times" class="p-button-text" @click="editDialog = false" />
        <Button label="Enregistrer" icon="pi pi-check" @click="saveTeacher" />
      </template>
    </Dialog>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDatabase, ref as dbRef, get, update } from 'firebase/database'
import { useToast } from 'primevue/usetoast'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import InputNumber from 'primevue/inputnumber'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'

const toast = useToast()
const loading = ref(false)
const search = ref('')
const users = ref([])
const selectedTeachers = ref([])
const editDialog = ref(false)
const currentTeacher = ref(null)

// Modules disponibles (à charger depuis la base de données)
const availableModules = ref([
  { id: 1, name: 'Anatomie' },
  { id: 2, name: 'Physiologie' },
  { id: 3, name: 'Pathologie' },
  { id: 4, name: 'Pharmacologie' },
  { id: 5, name: 'Soins Généraux' }
])

const normalizeRoles = (u) => {
  const rolesObj = u.Roles || u.roles || {}
  const perms = u.permissions || u.Permissions || []
  const list = new Set()
  Object.keys(rolesObj || {}).forEach(k => { if (rolesObj[k]) list.add(k) })
  if (Array.isArray(perms)) perms.forEach(p => list.add(p))
  return Array.from(list)
}

const filteredUsers = computed(() => {
  const term = search.value.trim().toLowerCase()
  return users.value
    .filter(u => u.rolesList.includes('EnseignantSoins'))
    .filter(u => {
      if (!term) return true
      return (
        (u.Prenom && u.Prenom.toLowerCase().includes(term)) ||
        (u.Nom && u.Nom.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term))
      )
    })
})

const totalHours = computed(() => {
  return filteredUsers.value.reduce((sum, u) => sum + (u.hours || 0), 0)
})

const teachersWithRM = computed(() => {
  return filteredUsers.value.filter(u => u.moduleRM).length
})

function getRoleSeverity(role) {
  if (role === 'EnseignantSoins') return 'success'
  if (role.includes('Admin')) return 'danger'
  if (role.includes('RM')) return 'warning'
  return 'info'
}

function getModuleName(moduleId) {
  const module = availableModules.value.find(m => m.id === moduleId)
  return module ? module.name : 'Module inconnu'
}

async function updateModuleRM(teacher) {
  try {
    const db = getDatabase()
    await update(dbRef(db, `/Users/${teacher.id}`), {
      moduleRM: teacher.moduleRM
    })
    toast.add({
      severity: 'success',
      summary: 'Module mis à jour',
      detail: `Module RM assigné pour ${teacher.Prenom} ${teacher.Nom}`,
      life: 3000
    })
  } catch (error) {
    console.error('Erreur mise à jour module:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la mise à jour du module',
      life: 3000
    })
  }
}

async function updateHours(teacher) {
  try {
    const db = getDatabase()
    await update(dbRef(db, `/Users/${teacher.id}`), {
      hours: teacher.hours || 0
    })
    toast.add({
      severity: 'success',
      summary: 'Heures mises à jour',
      detail: `${teacher.hours || 0}h pour ${teacher.Prenom} ${teacher.Nom}`,
      life: 3000
    })
  } catch (error) {
    console.error('Erreur mise à jour heures:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la mise à jour des heures',
      life: 3000
    })
  }
}

function editField(teacher, field) {
  currentTeacher.value = { ...teacher }
  editDialog.value = true
}

function createTeacher() {
  currentTeacher.value = {
    Prenom: '',
    Nom: '',
    email: '',
    moduleRM: null,
    hours: 0,
    classe: ''
  }
  editDialog.value = true
}

function editTeacher(teacher) {
  currentTeacher.value = { ...teacher }
  editDialog.value = true
}

function viewTeacher(teacher) {
  console.log('View teacher:', teacher)
  // TODO: Implémenter la vue détaillée
}

function deleteTeacher(teacher) {
  // TODO: Implémenter la suppression
  console.log('Delete teacher:', teacher)
}

async function saveTeacher() {
  try {
    const db = getDatabase()
    if (currentTeacher.value.id) {
      // Mise à jour
      await update(dbRef(db, `/Users/${currentTeacher.value.id}`), {
        Prenom: currentTeacher.value.Prenom,
        Nom: currentTeacher.value.Nom,
        email: currentTeacher.value.email,
        moduleRM: currentTeacher.value.moduleRM,
        hours: currentTeacher.value.hours || 0,
        classe: currentTeacher.value.classe
      })
      toast.add({
        severity: 'success',
        summary: 'Enseignant mis à jour',
        detail: 'Les informations ont été enregistrées',
        life: 3000
      })
      // Recharger les données
      await loadUsers()
    } else {
      // Création
      toast.add({
        severity: 'info',
        summary: 'Fonction à implémenter',
        detail: 'La création d\'enseignant sera disponible prochainement',
        life: 3000
      })
    }
    editDialog.value = false
  } catch (error) {
    console.error('Erreur sauvegarde:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors de la sauvegarde',
      life: 3000
    })
  }
}

function onRowSelect(event) {
  console.log('Row selected:', event.data)
}

function onRowUnselect(event) {
  console.log('Row unselected:', event.data)
}

function clearSelection() {
  selectedTeachers.value = []
}

function bulkAssignModule() {
  // TODO: Implémenter l'assignation en masse
  toast.add({
    severity: 'info',
    summary: 'Fonction à implémenter',
    detail: 'Assignation de module en masse',
    life: 3000
  })
}

function exportSelection() {
  // TODO: Implémenter l'export
  toast.add({
    severity: 'info',
    summary: 'Export',
    detail: `Export de ${selectedTeachers.value.length} enseignants`,
    life: 3000
  })
}

async function loadUsers() {
  loading.value = true
  try {
    const db = getDatabase()
    const snap = await get(dbRef(db, '/Users'))
    const raw = snap.exists() ? snap.val() : {}
    const list = Object.entries(raw).map(([id, u]) => ({
      id,
      email: u.email || u.Email || '-',
      Prenom: u.Prenom || '',
      Nom: u.Nom || '',
      house: u.house || u.House || '-',
      classe: u.classe || u.Classe || u.class || '-',
      moduleRM: u.moduleRM || null,
      hours: u.hours || 0,
      rolesList: normalizeRoles(u),
      ...u,
    }))
    users.value = list
  } catch (e) {
    console.error('Erreur chargement utilisateurs:', e)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Erreur lors du chargement des enseignants',
      life: 3000
    })
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.teachers-page {
  padding: 2rem;
  min-height: calc(100vh - 100px);
}

.toolbar-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.search-section {
  display: flex;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1rem;
}

.search-input {
  flex: 1;
  max-width: 400px;
}

.stats-section {
  display: flex;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--surface-border);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.stat-label {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.stat-value {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--primary-color);
}

.table-card {
  background: var(--surface-card);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.empty-state i {
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.3;
}

.editable-field {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  transition: background 0.2s;
}

.editable-field:hover {
  background: var(--surface-hover);
}

.edit-icon {
  font-size: 0.75rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.editable-field:hover .edit-icon {
  opacity: 0.5;
}

.email-link {
  color: var(--primary-color);
  text-decoration: none;
}

.email-link:hover {
  text-decoration: underline;
}

.compact-dropdown {
  width: 100%;
  max-width: 200px;
}

.compact-input {
  width: 100px;
}

.roles-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.selection-panel {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--surface-card);
  border-top: 2px solid var(--primary-color);
  padding: 1.5rem;
  box-shadow: 0 -4px 12px rgba(0,0,0,0.1);
  z-index: 1000;
}

.selection-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.selection-header h4 {
  margin: 0;
  color: var(--text-color);
}

.selection-content {
  display: flex;
  gap: 2rem;
}

.selected-list {
  flex: 1;
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 0.5rem;
}

.selected-item {
  background: var(--surface-ground);
  padding: 1rem;
  border-radius: 0.5rem;
  min-width: 250px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.teacher-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.teacher-info strong {
  color: var(--text-color);
}

.teacher-info span {
  font-size: 0.9rem;
  color: var(--text-color-secondary);
}

.teacher-meta {
  display: flex;
  gap: 0.5rem;
}

.module-badge, .hours-badge {
  background: var(--primary-color);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-size: 0.85rem;
}

.hours-badge {
  background: var(--surface-500);
}

.bulk-actions {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field label {
  font-weight: 600;
  color: var(--text-color);
}
</style>
