<template>
  <AdminLayout>
    <div class="places-assigned-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-map-marker text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Places Assignées</h1>
              <p class="text-600 m-0 mt-1">Vue d'ensemble des assignations de stages</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-download" label="Exporter PDF" outlined />
            <Button icon="pi pi-file-excel" label="Excel" severity="success" outlined />
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-map-marker text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.totalPlaces }}</h3>
                <p class="text-600 m-0">Places Totales</p>
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
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.assigned }}</h3>
                <p class="text-600 m-0">Assignées</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-circle text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.available }}</h3>
                <p class="text-600 m-0">Disponibles</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-purple-100 border-circle p-3">
                <i class="pi pi-building text-purple-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.institutions }}</h3>
                <p class="text-600 m-0">Institutions</p>
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
            <Dropdown v-model="filterInstitution" :options="institutions" optionLabel="nom" placeholder="Institution" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterStatus" :options="statusList" placeholder="Statut" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <InputText v-model="searchQuery" placeholder="Rechercher..." class="w-full" />
          </div>
        </div>
      </div>

      <!-- Table Places Assignées -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="placesList" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="15">
          <template #header>
            <span class="text-xl text-900 font-bold">Liste des Assignations</span>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucune assignation trouvée</p>
            </div>
          </template>
          <Column field="etudiant" header="Étudiant" sortable>
            <template #body="slotProps">
              <div class="flex align-items-center gap-2">
                <Avatar :label="slotProps.data.etudiant.charAt(0)" shape="circle" />
                <span>{{ slotProps.data.etudiant }}</span>
              </div>
            </template>
          </Column>
          <Column field="institution" header="Institution" sortable></Column>
          <Column field="typePFP" header="Type" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.typePFP" />
            </template>
          </Column>
          <Column field="dateDebut" header="Début" sortable></Column>
          <Column field="dateFin" header="Fin" sortable></Column>
          <Column field="priorite" header="Priorité" sortable>
            <template #body="slotProps">
              <Tag :value="`Choix ${slotProps.data.priorite}`" :severity="getPrioritySeverity(slotProps.data.priorite)" />
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
              <Button icon="pi pi-print" class="p-button-text p-button-sm" />
            </template>
          </Column>
        </DataTable>
      </div>
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
import Avatar from 'primevue/avatar'

const loading = ref(false)
const searchQuery = ref('')
const filterType = ref(null)
const filterInstitution = ref(null)
const filterStatus = ref(null)
const placesList = ref([])

const typesPFP = ref(['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4'])
const institutions = ref([])
const statusList = ref(['Confirmé', 'En attente', 'Annulé'])

const stats = ref({
  totalPlaces: 0,
  assigned: 0,
  available: 0,
  institutions: 0
})

const getStatusSeverity = (status) => {
  const severities = {
    'Confirmé': 'success',
    'En attente': 'warning',
    'Annulé': 'danger'
  }
  return severities[status] || 'secondary'
}

const getPrioritySeverity = (priorite) => {
  return priorite === 1 ? 'success' : priorite === 2 ? 'info' : 'warning'
}

const viewDetails = (data) => {
  console.log('View details:', data)
}

onMounted(() => {
  loading.value = false
})
</script>

<style scoped>
.places-assigned-page {
  min-height: calc(100vh - 100px);
}
</style>
