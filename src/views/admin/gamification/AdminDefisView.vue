<template>
  <Navbar />
  <div class="admin-defis">
    <h2 class="title">
      <i class="pi pi-flag"></i>
      Gestion des Défis Gamification
    </h2>

    <!-- Toolbar -->
    <div class="card toolbar-card">
      <div class="toolbar">
        <div class="left">
          <i class="pi pi-flag"></i>
          <span>Gestion des Défis</span>
        </div>
        <div class="right">
          <span class="p-input-icon-left">
            <i class="pi pi-search" />
            <InputText v-model="search" placeholder="Rechercher..." />
          </span>
          <Button label="Nouveau Défi" icon="pi pi-plus" class="p-button-success" @click="openCreateDialog" />
          <Button label="Actualiser" icon="pi pi-refresh" class="p-button-secondary" @click="loadDefis" />
        </div>
      </div>
    </div>

    <!-- Data Table -->
    <div class="card">
      <DataTable
        :value="filteredDefis"
        :loading="loading"
        dataKey="id"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10,20,50]"
        :sortField="'createdAt'"
        :sortOrder="-1"
        responsiveLayout="scroll"
        class="p-datatable-gridlines">
        
        <template #empty>Aucun défi pour le moment.</template>
        <template #loading>Chargement des défis...</template>

        <Column field="title" header="Titre" sortable></Column>
        <Column field="type" header="Type" sortable>
          <template #body="{ data }">
            <Tag :value="(data.type || 'general')" :severity="typeSeverity(data.type)" />
          </template>
        </Column>
        <Column field="targetHouse" header="Maison" sortable>
          <template #body="{ data }">
            <Tag :value="data.targetHouse || 'all'" severity="info" />
          </template>
        </Column>
        <Column field="reward" header="XP" sortable>
          <template #body="{ data }">{{ data.reward || 0 }} XP</template>
        </Column>
        <Column field="deadline" header="Échéance" sortable>
          <template #body="{ data }">{{ data.deadline ? new Date(data.deadline).toLocaleDateString() : '-' }}</template>
        </Column>
        <Column field="active" header="Statut" sortable>
          <template #body="{ data }">
            <Tag :value="data.active ? 'Actif' : 'Inactif'" :severity="data.active ? 'success' : 'danger'" />
          </template>
        </Column>
        <Column header="Actions" :exportable="false" style="min-width:12rem">
          <template #body="{ data }">
            <div class="row-actions">
              <Button icon="pi pi-pencil" rounded text @click="openEditDialog(data)" />
              <Button :icon="data.active ? 'pi pi-times' : 'pi pi-check'" rounded text @click="toggleActive(data)" />
              <Button icon="pi pi-trash" rounded text severity="danger" @click="confirmDelete(data)" />
            </div>
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialog Form -->
    <Dialog v-model:visible="dialogVisible" modal :header="editId ? 'Modifier un défi' : 'Nouveau défi'" :style="{ width: '700px' }">
      <form @submit.prevent="onSubmit" class="defi-form">
        <div class="form-grid">
          <div class="form-field">
            <label>Titre</label>
            <InputText v-model="form.title" placeholder="Ex: Semaine de la collaboration" required />
          </div>
          <div class="form-field">
            <label>Type</label>
            <Dropdown v-model="form.type" :options="typeOptions" optionLabel="label" optionValue="value" />
          </div>
          <div class="form-field">
            <label>Maison ciblée</label>
            <Dropdown v-model="form.targetHouse" :options="houseOptions" optionLabel="label" optionValue="value" />
          </div>
          <div class="form-field">
            <label>Récompense (XP)</label>
            <InputNumber v-model="form.reward" :min="0" :step="10" showButtons />
          </div>
          <div class="form-field">
            <label>Échéance</label>
            <Calendar v-model="form.deadline" dateFormat="dd/mm/yy" :showIcon="true" :manualInput="false" />
          </div>
          <div class="form-field">
            <label>Actif</label>
            <InputSwitch v-model="form.active" />
          </div>
          <div class="form-field full">
            <label>Description / Objectif</label>
            <Textarea v-model="form.description" rows="3" autoResize placeholder="Décrivez le défi..." />
          </div>
          <div class="form-field full">
            <label>Objectif (courte phrase)</label>
            <InputText v-model="form.goal" placeholder="Ex: Participer à 3 activités de groupe" />
          </div>
        </div>
        <div class="dialog-actions">
          <Button type="button" label="Annuler" class="p-button-text" @click="closeDialog" />
          <Button type="submit" :label="editId ? 'Enregistrer' : 'Créer'" icon="pi pi-save" />
        </div>
      </form>
    </Dialog>

    <ConfirmDialog />
    <Toast />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { createDefi, listDefis, updateDefi, deleteDefi } from '@/service/defisService'
import Navbar from '@/components/common/utils/Navbar.vue'

// PrimeVue components
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'
import Calendar from 'primevue/calendar'
import InputSwitch from 'primevue/inputswitch'
import Tag from 'primevue/tag'
import ConfirmDialog from 'primevue/confirmdialog'
import { useConfirm } from 'primevue/useconfirm'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'

const toast = useToast()
const confirm = useConfirm()

const loading = ref(false)
const defis = ref([])
const editId = ref(null)
const dialogVisible = ref(false)
const search = ref('')

const typeOptions = [
  { label: 'Général', value: 'general' },
  { label: 'Série', value: 'streak' },
  { label: 'Maison', value: 'house' },
  { label: 'Bonus', value: 'bonus' },
]
const houseOptions = [
  { label: 'Toutes', value: 'all' },
  { label: 'Harmonis', value: 'Harmonis' },
  { label: 'Elaris', value: 'Elaris' },
  { label: 'Doloris', value: 'Doloris' },
  { label: 'Solencia', value: 'Solencia' },
]

const typeSeverity = (type) => {
  switch (type) {
    case 'streak': return 'warning'
    case 'house': return 'info'
    case 'bonus': return 'success'
    default: return 'secondary'
  }
}

const form = ref({
  title: '',
  description: '',
  type: 'general',
  goal: '',
  reward: 0,
  deadline: null, // Date object in dialog
  targetHouse: 'all',
  active: true,
})

const resetForm = () => {
  editId.value = null
  form.value = {
    title: '',
    description: '',
    type: 'general',
    goal: '',
    reward: 0,
    deadline: null,
    targetHouse: 'all',
    active: true,
  }
}

const openCreateDialog = () => {
  resetForm()
  dialogVisible.value = true
}
const openEditDialog = (d) => {
  editId.value = d.id
  form.value = {
    title: d.title || '',
    description: d.description || '',
    type: d.type || 'general',
    goal: d.goal || '',
    reward: d.reward || 0,
    deadline: d.deadline ? new Date(d.deadline) : null,
    targetHouse: d.targetHouse || 'all',
    active: d.active !== false,
  }
  dialogVisible.value = true
}
const closeDialog = () => { dialogVisible.value = false }

const filteredDefis = computed(() => {
  const q = (search.value || '').toLowerCase()
  if (!q) return defis.value
  return defis.value.filter(d =>
    [d.title, d.type, d.targetHouse, d.description, d.goal]
      .filter(Boolean)
      .some(v => String(v).toLowerCase().includes(q))
  )
})

const loadDefis = async () => {
  loading.value = true
  try {
    defis.value = await listDefis()
    defis.value.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
  } catch (e) {
    console.error(e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de charger les défis', life: 3000 })
  } finally {
    loading.value = false
  }
}

const onSubmit = async () => {
  try {
    const payload = { ...form.value }
    // Convert Date to ISO string for deadline
    payload.deadline = payload.deadline instanceof Date ? payload.deadline.toISOString() : payload.deadline || ''

    if (editId.value) {
      await updateDefi(editId.value, payload)
      toast.add({ severity: 'success', summary: 'Enregistré', detail: 'Défi mis à jour', life: 2000 })
    } else {
      await createDefi(payload)
      toast.add({ severity: 'success', summary: 'Créé', detail: 'Nouveau défi créé', life: 2000 })
    }
    dialogVisible.value = false
    await loadDefis()
    resetForm()
  } catch (e) {
    console.error('Erreur lors de la sauvegarde du défi', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Sauvegarde impossible', life: 3000 })
  }
}

const toggleActive = async (d) => {
  try {
    await updateDefi(d.id, { active: !d.active })
    toast.add({ severity: 'success', summary: 'Statut', detail: d.active ? 'Défi désactivé' : 'Défi activé', life: 2000 })
    await loadDefis()
  } catch (e) {
    console.error('Erreur activation défi', e)
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Action impossible', life: 3000 })
  }
}

const confirmDelete = (d) => {
  confirm.require({
    message: `Supprimer le défi "${d.title}" ?`,
    header: 'Confirmation',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    acceptClass: 'p-button-danger',
    accept: async () => {
      try {
        await deleteDefi(d.id)
        toast.add({ severity: 'success', summary: 'Supprimé', detail: 'Défi supprimé', life: 2000 })
        await loadDefis()
      } catch (e) {
        console.error('Erreur suppression défi', e)
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Suppression impossible', life: 3000 })
      }
    },
  })
}

onMounted(loadDefis)
</script>

<style scoped>
.admin-defis { padding: 1rem; }
.title { display: flex; align-items: center; gap: .5rem; margin-bottom: 1rem; }
.card { background: var(--surface-card, #fff); border-radius: 12px; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,.06); margin-bottom: 1rem; }

.toolbar-card { padding: .75rem 1rem; }
.toolbar { display: flex; justify-content: space-between; align-items: center; gap: .75rem; }
.toolbar .left { display: flex; align-items: center; gap: .5rem; font-weight: 600; }
.toolbar .right { display: flex; align-items: center; gap: .5rem; }

.defi-form .form-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: .75rem; }
.form-field { display: flex; flex-direction: column; gap: .25rem; }
.form-field.full { grid-column: 1 / -1; }
.form-field.checkbox { justify-content: end; }

.dialog-actions { display: flex; justify-content: flex-end; gap: .5rem; margin-top: .75rem; }

.row-actions { display: flex; gap: .25rem; align-items: center; }

@media (max-width: 900px) {
  .defi-form .form-grid { grid-template-columns: 1fr 1fr; }
}
@media (max-width: 600px) {
  .defi-form .form-grid { grid-template-columns: 1fr; }
}
</style>
