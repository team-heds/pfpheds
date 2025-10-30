<template>
  <AdminLayout>
    <div class="management-places-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-map text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Gestion des Places</h1>
              <p class="text-600 m-0 mt-1">Administration des places de stage disponibles</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-refresh" outlined @click="loadPlaces" />
            <Button icon="pi pi-plus" label="Nouvelle Place" severity="success" @click="showDialog = true" />
          </div>
        </div>
      </div>

      <!-- Statistiques Rapides -->
      <div class="grid mb-4">
        <div class="col-12 md:col-6 lg:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-map-marker text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.total }}</h3>
                <p class="text-600 m-0">Places Totales</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-6 lg:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check-circle text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.disponibles }}</h3>
                <p class="text-600 m-0">Disponibles</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-6 lg:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-user text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.occupees }}</h3>
                <p class="text-600 m-0">Occupées</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-6 lg:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-red-100 border-circle p-3">
                <i class="pi pi-times-circle text-red-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.inactives }}</h3>
                <p class="text-600 m-0">Inactives</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="surface-card p-3 border-round shadow-2 mb-4">
        <div class="grid">
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterType" :options="typesPFP" placeholder="Type PFP" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterStatus" :options="statusOptions" placeholder="Statut" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterInstitution" :options="institutions" optionLabel="nom" placeholder="Institution" class="w-full" showClear />
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

      <!-- Table Places -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="placesList" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="15">
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Liste des Places</span>
              <div class="flex gap-2">
                <Button icon="pi pi-filter" outlined />
                <Button icon="pi pi-download" label="Exporter" outlined />
              </div>
            </div>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucune place trouvée</p>
            </div>
          </template>
          <Column field="institution" header="Institution" sortable></Column>
          <Column field="service" header="Service" sortable></Column>
          <Column field="typePFP" header="Type" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.typePFP" />
            </template>
          </Column>
          <Column field="capacite" header="Capacité" sortable></Column>
          <Column field="occupees" header="Occupées" sortable></Column>
          <Column field="disponibles" header="Dispo" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.disponibles" :severity="slotProps.data.disponibles > 0 ? 'success' : 'danger'" />
            </template>
          </Column>
          <Column field="periode" header="Période" sortable></Column>
          <Column field="status" header="Statut">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <Button icon="pi pi-eye" class="p-button-text p-button-sm mr-2" @click="viewDetails(slotProps.data)" />
              <Button icon="pi pi-pencil" class="p-button-text p-button-sm mr-2" severity="success" />
              <Button icon="pi pi-trash" class="p-button-text p-button-sm" severity="danger" />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Dialog Nouvelle Place -->
      <Dialog v-model:visible="showDialog" header="Nouvelle Place de Stage" :style="{ width: '600px' }" modal>
        <div class="flex flex-column gap-3 p-4">
          <div>
            <label class="block mb-2 font-semibold">Institution</label>
            <Dropdown v-model="newPlace.institution" :options="institutions" optionLabel="nom" placeholder="Sélectionner" class="w-full" />
          </div>
          <div>
            <label class="block mb-2 font-semibold">Service/Département</label>
            <InputText v-model="newPlace.service" placeholder="Ex: Physiothérapie" class="w-full" />
          </div>
          <div>
            <label class="block mb-2 font-semibold">Type PFP</label>
            <Dropdown v-model="newPlace.typePFP" :options="typesPFP" placeholder="Sélectionner" class="w-full" />
          </div>
          <div class="grid">
            <div class="col-6">
              <label class="block mb-2 font-semibold">Capacité</label>
              <InputNumber v-model="newPlace.capacite" :min="1" class="w-full" />
            </div>
            <div class="col-6">
              <label class="block mb-2 font-semibold">Période</label>
              <InputText v-model="newPlace.periode" placeholder="2024-2025" class="w-full" />
            </div>
          </div>
        </div>
        <template #footer>
          <Button label="Annuler" @click="showDialog = false" text />
          <Button label="Créer" @click="createPlace" severity="success" />
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
import InputNumber from 'primevue/inputnumber'

const loading = ref(false)
const showDialog = ref(false)
const searchQuery = ref('')
const filterType = ref(null)
const filterStatus = ref(null)
const filterInstitution = ref(null)
const placesList = ref([])

const typesPFP = ref(['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4'])
const statusOptions = ref(['Active', 'Inactive', 'Complète'])
const institutions = ref([])

const stats = ref({
  total: 0,
  disponibles: 0,
  occupees: 0,
  inactives: 0
})

const newPlace = ref({
  institution: null,
  service: '',
  typePFP: null,
  capacite: 1,
  periode: ''
})

const getStatusSeverity = (status) => {
  const severities = {
    'Active': 'success',
    'Inactive': 'secondary',
    'Complète': 'warning'
  }
  return severities[status] || 'secondary'
}

const viewDetails = (data) => {
  console.log('View details:', data)
}

const createPlace = () => {
  // Logic to create place
  showDialog.value = false
}

const loadPlaces = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}

onMounted(() => {
  loading.value = false
})
</script>

<style scoped>
.management-places-page {
  min-height: calc(100vh - 100px);
}
</style>
