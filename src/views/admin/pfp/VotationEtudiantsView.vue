<template>
  <AdminLayout>
    <div class="votation-etudiants-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-users text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Votation Étudiants</h1>
              <p class="text-600 m-0 mt-1">Gestion des choix de stages des étudiants</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-download" label="Exporter" outlined />
            <Button icon="pi pi-envelope" label="Relancer" severity="warning" />
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
                <p class="text-600 m-0">Total Étudiants</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-green-100 border-circle p-3">
                <i class="pi pi-check-circle text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.completed }}</h3>
                <p class="text-600 m-0">Ont Voté</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-hourglass text-orange-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.pending }}</h3>
                <p class="text-600 m-0">En Attente</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-red-100 border-circle p-3">
                <i class="pi pi-times-circle text-red-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.incomplete }}</h3>
                <p class="text-600 m-0">Incomplets</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="surface-card p-3 border-round shadow-2 mb-4">
        <div class="grid">
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterClasse" :options="classes" placeholder="Toutes les classes" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-3">
            <Dropdown v-model="filterStatus" :options="statusOptions" placeholder="Tous les statuts" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-6">
            <InputText v-model="searchQuery" placeholder="Rechercher un étudiant..." class="w-full" />
          </div>
        </div>
      </div>

      <!-- Table Votations -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="votationsList" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="15">
          <template #header>
            <span class="text-xl text-900 font-bold">Votes des Étudiants</span>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucune votation trouvée</p>
            </div>
          </template>
          <Column field="nom" header="Nom" sortable></Column>
          <Column field="prenom" header="Prénom" sortable></Column>
          <Column field="classe" header="Classe" sortable></Column>
          <Column field="choix1" header="Choix 1"></Column>
          <Column field="choix2" header="Choix 2"></Column>
          <Column field="choix3" header="Choix 3"></Column>
          <Column field="dateVote" header="Date Vote" sortable></Column>
          <Column field="status" header="Statut">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <Button icon="pi pi-eye" class="p-button-text p-button-sm mr-2" @click="viewDetails(slotProps.data)" />
              <Button icon="pi pi-pencil" class="p-button-text p-button-sm" severity="success" />
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

const loading = ref(false)
const searchQuery = ref('')
const filterClasse = ref(null)
const filterStatus = ref(null)
const votationsList = ref([])

const classes = ref(['BA22', 'BA23', 'BA24'])
const statusOptions = ref(['Complet', 'Incomplet', 'En attente'])

const stats = ref({
  total: 0,
  completed: 0,
  pending: 0,
  incomplete: 0
})

const getStatusSeverity = (status) => {
  const severities = {
    'Complet': 'success',
    'Incomplet': 'danger',
    'En attente': 'warning'
  }
  return severities[status] || 'secondary'
}

const viewDetails = (data) => {
  console.log('View details:', data)
}

onMounted(() => {
  loading.value = false
})
</script>

<style scoped>
.votation-etudiants-page {
  min-height: calc(100vh - 100px);
}
</style>
