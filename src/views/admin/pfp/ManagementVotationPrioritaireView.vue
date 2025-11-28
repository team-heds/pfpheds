<template>
  <AdminLayout>
    <div class="votation-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between flex-wrap">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-sliders-h text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Votation Prioritaire LESE</h1>
              <p class="text-600 m-0 mt-1">Gestion des priorités de placement pour les stages</p>
            </div>
          </div>
          <div class="flex gap-2">
            <Button icon="pi pi-download" label="Exporter" outlined />
            <Button icon="pi pi-cog" label="Configurer" severity="success" />
          </div>
        </div>
      </div>

      <!-- Statistics Cards -->
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
                <i class="pi pi-check text-green-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.voted }}</h3>
                <p class="text-600 m-0">Ont Voté</p>
              </div>
            </div>
          </div>
        </div>
        <div class="col-12 md:col-3">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="flex align-items-center gap-3">
              <div class="bg-orange-100 border-circle p-3">
                <i class="pi pi-clock text-orange-500 text-2xl"></i>
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
              <div class="bg-purple-100 border-circle p-3">
                <i class="pi pi-map-marker text-purple-500 text-2xl"></i>
              </div>
              <div>
                <h3 class="text-2xl font-bold text-900 m-0">{{ stats.places }}</h3>
                <p class="text-600 m-0">Places Dispo</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Votation Table -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="votationList" :loading="loading" responsiveLayout="scroll">
          <template #header>
            <div class="flex justify-content-between align-items-center">
              <span class="text-xl text-900 font-bold">Résultats Votation</span>
              <InputText v-model="searchQuery" placeholder="Rechercher étudiant..." />
            </div>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucune votation en cours</p>
            </div>
          </template>
          <Column field="etudiant" header="Étudiant" sortable></Column>
          <Column field="classe" header="Classe" sortable></Column>
          <Column field="priorite1" header="Priorité 1"></Column>
          <Column field="priorite2" header="Priorité 2"></Column>
          <Column field="priorite3" header="Priorité 3"></Column>
          <Column field="status" header="Statut">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body>
              <Button icon="pi pi-eye" class="p-button-text p-button-sm mr-2" />
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

const loading = ref(false)
const searchQuery = ref('')
const votationList = ref([])
const stats = ref({
  total: 0,
  voted: 0,
  pending: 0,
  places: 0
})

const getStatusSeverity = (status) => {
  const severities = {
    'Voté': 'success',
    'En attente': 'warning',
    'Assigné': 'info'
  }
  return severities[status] || 'secondary'
}

onMounted(() => {
  loading.value = false
})
</script>

<style scoped>
.votation-page {
  min-height: calc(100vh - 100px);
}
</style>
