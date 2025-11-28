<template>
  <AdminLayout>
    <div class="repondant-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-user-edit text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Gestion des Répondants HES</h1>
              <p class="text-600 m-0 mt-1">Administration des praticiens formateurs</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-download" label="Exporter" outlined />
            <Button icon="pi pi-plus" label="Nouveau Répondant" severity="success" @click="showDialog = true" />
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-users text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.total }}</h3>
                <p class="text-600 m-0">Total Répondants</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.actifs }}</h3>
                <p class="text-600 m-0">Actifs</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-graduation-cap text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.physio }}</h3>
                <p class="text-600 m-0">Physiothérapie</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-purple-100 border-circle p-3">
                <i class="pi pi-heart text-purple-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.soins }}</h3>
                <p class="text-600 m-0">Soins Infirmiers</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="surface-card p-3 border-round shadow-2 mb-4">
        <div class="grid">
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterFiliere" :options="filieres" placeholder="Toutes les filières" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterInstitution" :options="institutions" optionLabel="nom" placeholder="Institution" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterStatus" :options="statusOptions" placeholder="Statut" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <InputText v-model="searchQuery" placeholder="Rechercher..." class="w-full">
              <template #prefix>
                <i class="pi pi-search"></i>
              </template>
            </InputText>
          </div>
        </div>
      </div>

      <!-- Table Répondants -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="repondantsList" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="15">
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Liste des Répondants</span>
              <Button icon="pi pi-filter-slash" label="Réinitialiser" text @click="resetFilters" />
            </div>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucun répondant trouvé</p>
            </div>
          </template>
          <Column field="nom" header="Nom" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center gap-2">
                <Avatar :label="slotProps.data.nom.charAt(0)" shape="circle" />
                <span class="font-semibold">{{ slotProps.data.nom }}</span>
              </div>
            </template>
          </Column>
          <Column field="prenom" header="Prénom" sortable></Column>
          <Column field="email" header="Email" sortable></Column>
          <Column field="institution" header="Institution" sortable></Column>
          <Column field="filiere" header="Filière" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.filiere" :severity="getFiliereSeverity(slotProps.data.filiere)" />
            </template>
          </Column>
          <Column field="telephone" header="Téléphone"></Column>
          <Column field="nbEtudiants" header="Étudiants" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.nbEtudiants" severity="info" />
            </template>
          </Column>
          <Column field="status" header="Statut">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <Button icon="pi pi-eye" class="p-button-text p-button-sm mr-2" @click="viewDetails(slotProps.data)" />
              <Button icon="pi pi-pencil" class="p-button-text p-button-sm mr-2" severity="success" />
              <Button icon="pi pi-envelope" class="p-button-text p-button-sm" />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Dialog Nouveau Répondant -->
      <Dialog v-model:visible="showDialog" header="Nouveau Répondant HES" :style="{ width: '700px' }" modal>
        <div class="flex flex-column gap-3 p-4">
          <div class="grid">
            <div class="col-6">
              <label class="block mb-2 font-semibold">Nom *</label>
              <InputText v-model="newRepondant.nom" class="w-full" />
            </div>
            <div class="col-6">
              <label class="block mb-2 font-semibold">Prénom *</label>
              <InputText v-model="newRepondant.prenom" class="w-full" />
            </div>
          </div>
          <div class="grid">
            <div class="col-6">
              <label class="block mb-2 font-semibold">Email *</label>
              <InputText v-model="newRepondant.email" type="email" class="w-full" />
            </div>
            <div class="col-6">
              <label class="block mb-2 font-semibold">Téléphone</label>
              <InputText v-model="newRepondant.telephone" class="w-full" />
            </div>
          </div>
          <div>
            <label class="block mb-2 font-semibold">Institution *</label>
            <Dropdown v-model="newRepondant.institution" :options="institutions" optionLabel="nom" placeholder="Sélectionner" class="w-full" />
          </div>
          <div>
            <label class="block mb-2 font-semibold">Filière *</label>
            <Dropdown v-model="newRepondant.filiere" :options="filieres" placeholder="Sélectionner" class="w-full" />
          </div>
          <div>
            <label class="block mb-2 font-semibold">Spécialité</label>
            <InputText v-model="newRepondant.specialite" class="w-full" />
          </div>
        </div>
        <template #footer>
          <Button label="Annuler" @click="showDialog = false" text />
          <Button label="Créer" @click="createRepondant" severity="success" />
        </template>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Avatar from 'primevue/avatar'

const loading = ref(false)
const showDialog = ref(false)
const searchQuery = ref('')
const filterFiliere = ref(null)
const filterInstitution = ref(null)
const filterStatus = ref(null)
const repondantsList = ref([])

const filieres = ref(['Physiothérapie', 'Soins Infirmiers'])
const statusOptions = ref(['Actif', 'Inactif', 'En congé'])
const institutions = ref([])

const stats = ref({
  total: 0,
  actifs: 0,
  physio: 0,
  soins: 0
})

const newRepondant = ref({
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  institution: null,
  filiere: null,
  specialite: ''
})

const getStatusSeverity = (status) => {
  const severities = {
    'Actif': 'success',
    'Inactif': 'secondary',
    'En congé': 'warning'
  }
  return severities[status] || 'secondary'
}

const getFiliereSeverity = (filiere) => {
  return filiere === 'Physiothérapie' ? 'info' : 'success'
}

const resetFilters = () => {
  filterFiliere.value = null
  filterInstitution.value = null
  filterStatus.value = null
  searchQuery.value = ''
}

const viewDetails = (data) => {
  console.log('View details:', data)
}

const createRepondant = () => {
  showDialog.value = false
}

onMounted(() => {
  loading.value = false
})
</script>

<style scoped>
.repondant-page {
  min-height: calc(100vh - 100px);
}
</style>
