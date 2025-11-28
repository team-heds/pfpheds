<template>
  <AdminLayout>
    <div class="pfp-encours-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-clock text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">PFP en Cours</h1>
              <p class="text-600 m-0 mt-1">Gestion et suivi des pratiques de formation en cours</p>
            </div>
          </div>
          <Button icon="pi pi-plus" label="Nouveau PFP" severity="success" />
        </div>
      </div>

      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="pfpList" :loading="loading" responsiveLayout="scroll">
          <template #header>
            <div class="flex justify-content-between">
              <span class="text-xl text-900 font-bold">Liste des PFP</span>
              <InputText v-model="searchQuery" placeholder="Rechercher..." />
            </div>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucun PFP en cours</p>
            </div>
          </template>
          <Column field="etudiant" header="Étudiant" sortable></Column>
          <Column field="institution" header="Institution" sortable></Column>
          <Column field="dateDebut" header="Date Début" sortable></Column>
          <Column field="dateFin" header="Date Fin" sortable></Column>
          <Column field="status" header="Statut">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body>
              <Button icon="pi pi-eye" class="p-button-text p-button-sm mr-2" />
              <Button icon="pi pi-pencil" class="p-button-text p-button-sm mr-2" severity="success" />
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
const pfpList = ref([])

const getStatusSeverity = (status) => {
  const severities = {
    'En cours': 'success',
    'Terminé': 'info',
    'En attente': 'warning'
  }
  return severities[status] || 'secondary'
}

onMounted(() => {
  // Load PFP data
  loading.value = false
})
</script>

<style scoped>
.pfp-encours-page {
  min-height: calc(100vh - 100px);
}
</style>
