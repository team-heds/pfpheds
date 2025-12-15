<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader title="Liste des enseignants physio" subtitle="Gérez la liste des enseignants">
        <template #breadcrumbs>
          <div class="flex align-items-center gap-2 text-sm text-600">
            <router-link to="/admin" class="text-600 no-underline hover:text-primary">Dashboard</router-link>
            <i class="pi pi-angle-right text-300" aria-hidden="true"></i>
            <span class="text-900">Enseignants</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>
    <div class="filter-menu is-compact">
      <AppSkeleton v-if="loading" variant="table" :rows="8" :cols="4" />
      <DataTable
        v-else
        :value="items"
        :paginator="true"
        :rows="20"
        dataKey="id"
        :rowHover="true"
        v-model:filters="filters"
        filterDisplay="menu"
        :globalFilterFields="['last_name', 'first_name', 'email']"
        showGridlines
      >
        <template #header>
          <div class="flex justify-content-between flex-column sm:flex-row">
            <Button label="Ajouter un enseignant" icon="pi pi-plus" class="mb-2 mr-2" outlined @click="openCreateDialog" />
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText
                v-model="filters['global'].value"
                placeholder="Recherche globale"
                style="width: 100%"
              />
            </IconField>
          </div>
        </template>
        <template #empty>
          <EmptyState
            title="Aucun enseignant trouvé"
            description="Ajustez les filtres ou ajoutez un enseignant."
            icon="pi-users"
            actionLabel="Ajouter un enseignant"
            @action="openCreateDialog"
          />
        </template>

        <Column field="last_name" header="Nom" style="min-width: 12rem" sortable>
          <template #body="{ data }">{{ data.last_name }}</template>
        </Column>
        <Column field="first_name" header="Prénom" style="min-width: 12rem" sortable>
          <template #body="{ data }">{{ data.first_name }}</template>
        </Column>
        <Column field="email" header="Email" style="min-width: 12rem" sortable>
          <template #body="{ data }">{{ data.email }}</template>
        </Column>

        <Column header="Action" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            <Button label="Modifier" class="mb-2 mr-2" size="small" outlined severity="success" @click="openEditDialog(data.id)" />
            <Button label="Supprimer" class="mb-2 mr-2" size="small" outlined severity="danger" @click="confirmDelete(data.id)" />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialog de création -->
    <Dialog
      v-model:visible="showCreateDialog"
      modal
      header="Nouvel enseignant physio"
      :style="{ width: '30rem' }"
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
      <form @submit.prevent="submitCreate" class="p-fluid">
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
      </form>
      <template #footer>
        <Button label="Annuler" icon="pi pi-times" text @click="showCreateDialog = false" />
        <Button label="Créer" icon="pi pi-check" @click="submitCreate" :loading="creating" />
      </template>
    </Dialog>

    <!-- Dialog de modification -->
    <Dialog
      v-model:visible="showEditDialog"
      modal
      header="Modifier l'enseignant physio"
      :style="{ width: '30rem' }"
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
      <form v-if="editEnseignant" @submit.prevent="submitUpdate" class="p-fluid">
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
      </form>
      <template #footer>
        <Button label="Annuler" icon="pi pi-times" text @click="showEditDialog = false" />
        <Button label="Mettre à jour" icon="pi pi-check" @click="submitUpdate" :loading="updating" />
      </template>
    </Dialog>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useEnseignantsStore } from '@/stores/enseignantsStore'

import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue'
import AppSkeleton from '@/components/common/feedback/AppSkeleton.vue'
import EmptyState from '@/components/common/feedback/EmptyState.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Dialog from 'primevue/dialog'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import { FilterMatchMode } from 'primevue/api'

const store = useEnseignantsStore()
const { enseignants: items, loading } = storeToRefs(store)

const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const creating = ref(false)
const updating = ref(false)

const newEnseignant = ref({
  first_name: '',
  last_name: '',
  email: '',
})

const editEnseignant = ref(null)

onMounted(async () => {
  await store.fetchEnseignants()
})

const confirmDelete = async (id) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
    await store.deleteEnseignant(id)
  }
}

const openCreateDialog = () => {
  newEnseignant.value = {
    first_name: '',
    last_name: '',
    email: '',
  }
  showCreateDialog.value = true
}

const submitCreate = async () => {
  if (!newEnseignant.value.first_name || !newEnseignant.value.last_name || !newEnseignant.value.email) {
    alert('Veuillez remplir tous les champs requis')
    return
  }

  if (confirm('Êtes-vous sûr de vouloir ajouter ce nouvel enseignant ?')) {
    creating.value = true
    try {
      await store.createEnseignant(newEnseignant.value)
      showCreateDialog.value = false
      newEnseignant.value = { first_name: '', last_name: '', email: '' }
    } catch (error) {
      console.error('❌ Error creating enseignant:', error)
      alert('Erreur lors de la création: ' + error.message)
    } finally {
      creating.value = false
    }
  }
}

const openEditDialog = async (id) => {
  try {
    const foundEnseignant = await store.getEnseignantById(id)
    if (foundEnseignant) {
      editEnseignant.value = { ...foundEnseignant }
      showEditDialog.value = true
    } else {
      alert('Enseignant non trouvé')
    }
  } catch (error) {
    console.error('❌ Error loading enseignant:', error)
    alert('Erreur lors du chargement: ' + error.message)
  }
}

const submitUpdate = async () => {
  if (!editEnseignant.value) return

  if (confirm('Êtes-vous sûr de vouloir mettre à jour cet enseignant ?')) {
    updating.value = true
    try {
      await store.updateEnseignant(editEnseignant.value.id, editEnseignant.value)
      showEditDialog.value = false
      editEnseignant.value = null
    } catch (error) {
      console.error('❌ Error updating enseignant:', error)
      alert('Erreur lors de la mise à jour: ' + error.message)
    } finally {
      updating.value = false
    }
  }
}
</script>

<style scoped>
.admin-scrollable {
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.admin-scrollable::-webkit-scrollbar {
  display: none;
}
.filter-menu { padding: 20px; }
.is-compact :deep(.p-datatable .p-datatable-header) { padding: .75rem 1rem; }
.is-compact :deep(.p-datatable .p-datatable-thead > tr > th) { padding: .5rem .75rem; }
.is-compact :deep(.p-datatable .p-datatable-tbody > tr > td) { padding: .5rem .75rem; font-size: .95rem; }
.is-compact :deep(.p-inputtext),
.is-compact :deep(.p-dropdown),
.is-compact :deep(.p-button) { height: 2.5rem; }

.field {
  margin-bottom: 1.5rem;
}
</style>
