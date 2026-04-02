<template>
  <AdminLayout>
    <ConfirmDialog />
    <div class="p-4">
      <div class="breadcrumb-section mb-3">
        <router-link to="/admin/formation-pratique/dashboard" class="text-600 no-underline hover:text-primary"><i class="pi pi-home mr-1"></i>Formation Pratique</router-link>
        <i class="pi pi-angle-right text-400 mx-2"></i>
        <span class="text-900 font-medium">Enseignants Physio</span>
      </div>

      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-3">
        <div class="flex align-items-center justify-content-between gap-3 flex-wrap">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-book text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Enseignants Physio</h1>
              <p class="text-600 m-0 mt-2">Répondants HES de formation pratique</p>
            </div>
          </div>
          <div class="flex align-items-center gap-2 flex-wrap">
            <InputText v-model="globalSearch" placeholder="Rechercher (nom, email)" class="w-16rem" />
            <Button icon="pi pi-file-excel" label="Excel" outlined severity="success" @click="exportExcel" />
            <Button icon="pi pi-plus" label="Ajouter" outlined @click="openCreateDialog" />
            <Button icon="pi pi-refresh" outlined @click="refresh" />
          </div>
        </div>
      </div>

      <div class="surface-card fp-dark p-3 border-round shadow-2">
        <div class="text-600 mb-2">{{ filteredItems.length }} enseignant(s)</div>
        <DataTable
          :value="filteredItems"
          :loading="loading"
          :paginator="true"
          :rows="20"
          :rowsPerPageOptions="[10, 20, 50, 100]"
          dataKey="id"
          :rowHover="true"
          sortField="last_name"
          :sortOrder="1"
          :scrollable="true"
          scrollHeight="65vh"
        >
          <template #empty>Aucun enseignant trouvé.</template>
          <template #loading>Chargement des données...</template>

          <Column header="Nom" sortField="last_name" :sortable="true" style="min-width: 14rem">
            <template #body="{ data }">
              <div class="font-semibold">{{ (data.last_name || '').toUpperCase() }} {{ data.first_name || '' }}</div>
            </template>
          </Column>
          <Column field="email" header="Email" :sortable="true" style="min-width: 14rem"></Column>
          <Column header="Actions" style="min-width: 10rem">
            <template #body="{ data }">
              <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" size="small" v-tooltip.top="'Modifier'" @click="openEditDialog(data.id)" />
              <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" size="small" v-tooltip.top="'Supprimer'" @click="handleDelete(data)" />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Dialog de création -->
      <Dialog
        v-model:visible="showCreateDialog"
        modal
        header="Nouveau répondant physio"
        :style="{ width: '30rem' }"
      >
        <div class="p-fluid">
          <div class="field mb-3">
            <label for="create-prenom" class="font-semibold">Prénom *</label>
            <InputText id="create-prenom" v-model="newEnseignant.first_name" required />
          </div>
          <div class="field mb-3">
            <label for="create-nom" class="font-semibold">Nom *</label>
            <InputText id="create-nom" v-model="newEnseignant.last_name" required />
          </div>
          <div class="field mb-3">
            <label for="create-email" class="font-semibold">Email *</label>
            <InputText id="create-email" v-model="newEnseignant.email" type="email" required />
          </div>
        </div>
        <template #footer>
          <Button label="Annuler" icon="pi pi-times" text @click="showCreateDialog = false" />
          <Button label="Créer" icon="pi pi-check" @click="submitCreate" :loading="creating" />
        </template>
      </Dialog>

      <!-- Dialog de modification -->
      <Dialog
        v-model:visible="showEditDialog"
        modal
        header="Modifier le répondant physio"
        :style="{ width: '30rem' }"
      >
        <div v-if="editEnseignant" class="p-fluid">
          <div class="field mb-3">
            <label for="edit-prenom" class="font-semibold">Prénom *</label>
            <InputText id="edit-prenom" v-model="editEnseignant.first_name" required />
          </div>
          <div class="field mb-3">
            <label for="edit-nom" class="font-semibold">Nom *</label>
            <InputText id="edit-nom" v-model="editEnseignant.last_name" required />
          </div>
          <div class="field mb-3">
            <label for="edit-email" class="font-semibold">Email *</label>
            <InputText id="edit-email" v-model="editEnseignant.email" type="email" required />
          </div>
        </div>
        <template #footer>
          <Button label="Annuler" icon="pi pi-times" text @click="showEditDialog = false" />
          <Button label="Mettre à jour" icon="pi pi-check" @click="submitUpdate" :loading="updating" />
        </template>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useRepondantPhysioHESStore } from '@/stores/repondantPhysioHESStore'
import { useToast } from 'primevue/usetoast'
import { useConfirm } from 'primevue/useconfirm'

import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import ConfirmDialog from 'primevue/confirmdialog'

const store = useRepondantPhysioHESStore()
const toast = useToast()
const confirmSvc = useConfirm()
const { repondants: items, loading } = storeToRefs(store)

const globalSearch = ref('')
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const creating = ref(false)
const updating = ref(false)

const newEnseignant = ref({ first_name: '', last_name: '', email: '' })
const editEnseignant = ref(null)

const filteredItems = computed(() => {
  if (!globalSearch.value.trim()) return items.value || []
  const q = globalSearch.value.trim().toLowerCase()
  return (items.value || []).filter(u =>
    (u.last_name || '').toLowerCase().includes(q) ||
    (u.first_name || '').toLowerCase().includes(q) ||
    (u.email || '').toLowerCase().includes(q)
  )
})

onMounted(async () => {
  await store.fetchRepondants()
})

const refresh = () => store.fetchRepondants()

const exportExcel = async () => {
  const XLSX = await import('xlsx')
  const data = filteredItems.value.map(u => ({
    Nom: u.last_name || '',
    Prénom: u.first_name || '',
    Email: u.email || ''
  }))
  const ws = XLSX.utils.json_to_sheet(data)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Enseignants')
  XLSX.writeFile(wb, 'enseignants_physio.xlsx')
}

const handleDelete = (data) => {
  confirmSvc.require({
    message: `Supprimer l'enseignant ${(data.last_name || '').toUpperCase()} ${data.first_name || ''} ?`,
    header: 'Confirmation de suppression',
    icon: 'pi pi-exclamation-triangle',
    acceptClass: 'p-button-danger',
    acceptLabel: 'Supprimer',
    rejectLabel: 'Annuler',
    accept: async () => {
      try {
        await store.deleteRepondant(data.id)
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Enseignant supprimé.', life: 3000 })
      } catch (e) {
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'La suppression a échoué.', life: 3000 })
      }
    }
  })
}

const openCreateDialog = () => {
  newEnseignant.value = { first_name: '', last_name: '', email: '' }
  showCreateDialog.value = true
}

const submitCreate = async () => {
  if (!newEnseignant.value.first_name || !newEnseignant.value.last_name || !newEnseignant.value.email) {
    toast.add({ severity: 'warn', summary: 'Champs requis', detail: 'Veuillez remplir tous les champs.', life: 3000 })
    return
  }
  creating.value = true
  try {
    await store.createRepondant(newEnseignant.value)
    showCreateDialog.value = false
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Enseignant créé.', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la création: ' + error.message, life: 5000 })
  } finally {
    creating.value = false
  }
}

const openEditDialog = async (id) => {
  try {
    const foundRepondant = await store.getRepondantByIdAsync(id)
    if (foundRepondant) {
      editEnseignant.value = { ...foundRepondant }
      showEditDialog.value = true
    } else {
      toast.add({ severity: 'warn', summary: 'Non trouvé', detail: 'Répondant non trouvé.', life: 3000 })
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors du chargement: ' + error.message, life: 5000 })
  }
}

const submitUpdate = async () => {
  if (!editEnseignant.value) return
  updating.value = true
  try {
    await store.updateRepondant(editEnseignant.value.id, editEnseignant.value)
    showEditDialog.value = false
    editEnseignant.value = null
    toast.add({ severity: 'success', summary: 'Succès', detail: 'Enseignant mis à jour.', life: 3000 })
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Erreur', detail: 'Erreur lors de la mise à jour: ' + error.message, life: 5000 })
  } finally {
    updating.value = false
  }
}
</script>

<style>
@import '@/assets/styles/fp-dark.css';
</style>
