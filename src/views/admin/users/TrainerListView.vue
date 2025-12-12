<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader title="Liste des praticiens" subtitle="Gérez la liste des praticiens formateurs">
        <template #breadcrumbs>
          <div class="flex align-items-center gap-2 text-sm text-600">
            <router-link to="/admin" class="text-600 no-underline hover:text-primary">Dashboard</router-link>
            <i class="pi pi-angle-right text-300" aria-hidden="true"></i>
            <span class="text-900">Praticiens</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>
    <div class="filter-menu is-compact">
      <AppSkeleton v-if="loading" variant="table" :rows="8" :cols="5" />
      <DataTable
        v-else
        :value="items"
        :paginator="true"
        :rows="20"
        dataKey="id"
        :rowHover="true"
        v-model:filters="filters"
        filterDisplay="menu"
        :globalFilterFields="['nom', 'prenom', 'mail', 'institution']"
        showGridlines
      >
        <template #header>
          <div class="flex justify-content-between flex-column sm:flex-row">
            <Button
              label="Ajouter un praticien"
              icon="pi pi-plus"
              class="mb-2 mr-2"
              outlined
              @click="goToPraticienForm"
            />
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
            title="Aucun praticien trouvé"
            description="Ajustez les filtres ou ajoutez un praticien."
            icon="pi-users"
            actionLabel="Ajouter un praticien"
            @action="goToPraticienForm"
          />
        </template>
 
        <Column field="nom" header="Nom" style="min-width:12rem" sortable />
        <Column field="prenom" header="Prénom" style="min-width:12rem" sortable />
        <Column field="mail" header="Mail" style="min-width:12rem" sortable />
        <Column field="institution" header="Institution" style="min-width:12rem" sortable />
 
        <Column header="Action" style="min-width:12rem" class="text-center">
          <template #body="{ data }">
            <Button
              label="Modifier"
              class="mb-2 mr-2"
              size="small"
              outlined
              severity="success"
              @click="goToPraticienFormModif(data.id)"
            />
            <Button
              label="Supprimer"
              class="mb-2 mr-2"
              size="small"
              outlined
              severity="danger"
              @click="confirmDelete(data.id)"
            />
          </template>
        </Column>
      </DataTable>
    </div>

    <!-- Dialog de création -->
    <Dialog
      v-model:visible="showCreateDialog"
      modal
      header="Nouveau praticien formateur"
      :style="{ width: '30rem' }"
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
      <form @submit.prevent="submitCreate" class="p-fluid">
        <div class="field mb-3">
          <label for="create-prenom" class="font-semibold">Prénom *</label>
          <InputText id="create-prenom" v-model="newPraticien.prenom" required />
        </div>
        <div class="field mb-3">
          <label for="create-nom" class="font-semibold">Nom *</label>
          <InputText id="create-nom" v-model="newPraticien.nom" required />
        </div>
        <div class="field mb-3">
          <label for="create-mail" class="font-semibold">Mail *</label>
          <InputText id="create-mail" v-model="newPraticien.mail" type="email" required />
        </div>
        <div class="field mb-3">
          <label for="create-institution" class="font-semibold">Institution</label>
          <InputText id="create-institution" v-model="newPraticien.institution" />
        </div>
        <div class="field mb-3">
          <label for="create-localite" class="font-semibold">Localité</label>
          <InputText id="create-localite" v-model="newPraticien.localite" />
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
      header="Modifier le praticien formateur"
      :style="{ width: '30rem' }"
      :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"
    >
      <form v-if="editPraticien" @submit.prevent="submitUpdate" class="p-fluid">
        <div class="field mb-3">
          <label for="edit-prenom" class="font-semibold">Prénom *</label>
          <InputText 
            id="edit-prenom" 
            v-model="editPraticien.prenom" 
            required 
            @input="validateNameField('prenom')"
          />
          <small v-if="hasNumbers(editPraticien.prenom)" class="p-error">
            ⚠️ Les chiffres seront automatiquement supprimés du prénom
          </small>
        </div>
        <div class="field mb-3">
          <label for="edit-nom" class="font-semibold">Nom *</label>
          <InputText 
            id="edit-nom" 
            v-model="editPraticien.nom" 
            required 
            @input="validateNameField('nom')"
          />
          <small v-if="hasNumbers(editPraticien.nom)" class="p-error">
            ⚠️ Les chiffres seront automatiquement supprimés du nom
          </small>
        </div>
        <div class="field mb-3">
          <label for="edit-mail" class="font-semibold">Mail *</label>
          <InputText id="edit-mail" v-model="editPraticien.mail" type="email" required />
        </div>
        <div class="field mb-3">
          <label for="edit-institution" class="font-semibold">Institution</label>
          <InputText id="edit-institution" v-model="editPraticien.institution" />
        </div>
        <div class="field mb-3">
          <label for="edit-localite" class="font-semibold">Localité</label>
          <InputText id="edit-localite" v-model="editPraticien.localite" />
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
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { usePraticiensStore } from '@/stores/praticiensStore'

import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Dialog from 'primevue/dialog'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue';
import AppSkeleton from '@/components/common/feedback/AppSkeleton.vue';
import EmptyState from '@/components/common/feedback/EmptyState.vue';
import { FilterMatchMode } from 'primevue/api'
 
const router = useRouter()
const store = usePraticiensStore()
 
// ✅ on lit bien items + loading depuis le store
const { items, loading } = storeToRefs(store)
 
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})

// Dialogs
const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const creating = ref(false)
const updating = ref(false)

// Formulaire de création
const newPraticien = ref({
  prenom: '',
  nom: '',
  mail: '',
  institution: '',
  localite: '',
})

// Formulaire de modification
const editPraticien = ref(null)
 
onMounted(() => {
  store.fetchPraticiens()
})
 
const confirmDelete = async (id) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce praticien ?')) {
    await store.deletePraticien(id)
  }
}

// Validation pour les noms
const hasNumbers = (value) => value && /\d/.test(value)

const validateNameField = (fieldName) => {
  console.log(`🔍 [VALIDATION] Checking field ${fieldName}:`, editPraticien.value?.[fieldName])
}

// Création
const goToPraticienForm = () => {
  newPraticien.value = {
    prenom: '',
    nom: '',
    mail: '',
    institution: '',
    localite: '',
  }
  showCreateDialog.value = true
}

const submitCreate = async () => {
  if (!newPraticien.value.prenom || !newPraticien.value.nom || !newPraticien.value.mail) {
    alert('Veuillez remplir tous les champs requis')
    return
  }

  if (confirm('Êtes-vous sûr de vouloir ajouter ce nouveau praticien formateur ?')) {
    creating.value = true
    try {
      console.log('➕ Creating new praticien:', newPraticien.value)
      await store.createPraticien(newPraticien.value)
      console.log('✅ Praticien created successfully')
      showCreateDialog.value = false
      newPraticien.value = {
        prenom: '',
        nom: '',
        mail: '',
        institution: '',
        localite: '',
      }
    } catch (error) {
      console.error('❌ Error creating praticien:', error)
      alert('Erreur lors de la création: ' + error.message)
    } finally {
      creating.value = false
    }
  }
}

// Modification
const goToPraticienFormModif = async (id) => {
  try {
    console.log('🔍 Loading praticien with ID:', id)
    
    const foundPraticien = await store.getPraticienById(id)
    
    if (foundPraticien) {
      editPraticien.value = { ...foundPraticien }
      console.log('✅ Praticien loaded:', editPraticien.value)
      showEditDialog.value = true
    } else {
      console.warn('⚠️ Praticien non trouvé avec ID:', id)
      alert('Praticien non trouvé')
    }
  } catch (error) {
    console.error('❌ Error loading praticien:', error)
    alert('Erreur lors du chargement: ' + error.message)
  }
}

const submitUpdate = async () => {
  if (!editPraticien.value) return

  let confirmMessage = 'Êtes-vous sûr de vouloir mettre à jour ce praticien formateur ?'
  if (hasNumbers(editPraticien.value.nom) || hasNumbers(editPraticien.value.prenom)) {
    confirmMessage += '\n\n⚠️ ATTENTION: Les chiffres dans le nom et/ou prénom seront automatiquement supprimés.'
  }

  if (confirm(confirmMessage)) {
    updating.value = true
    try {
      console.log('📝 Updating praticien:', editPraticien.value)
      await store.updatePraticien(editPraticien.value.id, editPraticien.value)
      console.log('✅ Praticien updated successfully')
      showEditDialog.value = false
      editPraticien.value = null
    } catch (error) {
      console.error('❌ Error updating praticien:', error)
      alert('Erreur lors de la mise à jour: ' + error.message)
    } finally {
      updating.value = false
    }
  }
}
</script>

<style scoped>
.filter-menu { padding: 20px; }
.is-compact :deep(.p-datatable .p-datatable-header) { padding: .75rem 1rem; }
.is-compact :deep(.p-datatable .p-datatable-thead > tr > th) { padding: .5rem .75rem; }
.is-compact :deep(.p-datatable .p-datatable-tbody > tr > td) { padding: .5rem .75rem; font-size: .95rem; }
.is-compact :deep(.p-inputtext),
.is-compact :deep(.p-dropdown),
.is-compact :deep(.p-button) { height: 2.5rem; }

.admin-scrollable {
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}
.admin-scrollable::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}

.field {
  margin-bottom: 1.5rem;
}
</style>
 
 