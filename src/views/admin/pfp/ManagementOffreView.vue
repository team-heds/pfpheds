<template>
  <AdminLayout>
    <div class="offre-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-briefcase text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Gestion des Offres</h1>
              <p class="text-600 m-0 mt-1">Gestion des offres de stages disponibles</p>
            </div>
          </div>
          <Button icon="pi pi-plus" label="Nouvelle Offre" severity="success" @click="showDialog = true" />
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid mb-4">
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-100 border-circle p-3">
                <i class="pi pi-briefcase text-blue-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.total }}</h3>
                <p class="text-600 m-0">Offres Totales</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.actives }}</h3>
                <p class="text-600 m-0">Actives</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-map-marker text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.places }}</h3>
                <p class="text-600 m-0">Places Dispo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Table des offres -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="offresList" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="10">
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Liste des Offres</span>
              <div class="flex gap-2">
                <InputText v-model="searchQuery" placeholder="Rechercher..." />
                <Button icon="pi pi-filter" outlined />
              </div>
            </div>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucune offre disponible</p>
            </div>
          </template>
          <Column field="titre" header="Titre" sortable></Column>
          <Column field="institution" header="Institution" sortable></Column>
          <Column field="type" header="Type PFP" sortable></Column>
          <Column field="places" header="Places" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.places" severity="info" />
            </template>
          </Column>
          <Column field="dateDebut" header="Début" sortable></Column>
          <Column field="status" header="Statut">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body>
              <Button icon="pi pi-eye" class="p-button-text p-button-sm mr-2" />
              <Button icon="pi pi-pencil" class="p-button-text p-button-sm mr-2" severity="success" />
              <Button icon="pi pi-trash" class="p-button-text p-button-sm" severity="danger" />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Dialog Nouvelle Offre -->
      <Dialog v-model:visible="showDialog" header="Nouvelle Offre" :style="{ width: '600px' }" modal>
        <div class="flex flex-column gap-3">
          <div>
            <label class="block mb-2">Titre de l'offre</label>
            <InputText v-model="newOffre.titre" class="w-full" />
          </div>
          <div>
            <label class="block mb-2">Institution</label>
            <Dropdown v-model="newOffre.institution" :options="institutions" optionLabel="nom" class="w-full" />
          </div>
          <div>
            <label class="block mb-2">Type PFP</label>
            <Dropdown v-model="newOffre.type" :options="typesPFP" class="w-full" />
          </div>
          <div>
            <label class="block mb-2">Nombre de places</label>
            <InputNumber v-model="newOffre.places" class="w-full" />
          </div>
        </div>
        <template #footer>
          <Button label="Annuler" @click="showDialog = false" text />
          <Button label="Créer" @click="createOffre" severity="success" />
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
import Dialog from 'primevue/dialog'
import Dropdown from 'primevue/dropdown'
import InputNumber from 'primevue/inputnumber'

const loading = ref(false)
const searchQuery = ref('')
const showDialog = ref(false)
const offresList = ref([])
const institutions = ref([])
const typesPFP = ref(['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4'])

const stats = ref({
  total: 0,
  actives: 0,
  places: 0
})

const newOffre = ref({
  titre: '',
  institution: null,
  type: null,
  places: 1
})

const getStatusSeverity = (status) => {
  const severities = {
    'Active': 'success',
    'Fermée': 'danger',
    'En attente': 'warning'
  }
  return severities[status] || 'secondary'
}

const createOffre = () => {
  // Logic to create offre
  showDialog.value = false
}

onMounted(() => {
  loading.value = false
})
</script>

<style scoped>
.offre-page {
  min-height: calc(100vh - 100px);
}
</style>
