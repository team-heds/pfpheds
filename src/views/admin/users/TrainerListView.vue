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
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue';
import AppSkeleton from '@/components/common/feedback/AppSkeleton.vue';
import EmptyState from '@/components/common/feedback/EmptyState.vue';
// import Navbar from '@/components/common/utils/Navbar.vue'
import { FilterMatchMode } from 'primevue/api'
 
const router = useRouter()
const store = usePraticiensStore()
 
// ✅ on lit bien items + loading depuis le store
const { items, loading } = storeToRefs(store)
 
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
})
 
onMounted(() => {
  store.fetchPraticiens()
})
 
const confirmDelete = async (id) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce praticien ?')) {
    await store.deletePraticien(id)
  }
}
 
const goToPraticienFormModif = (id) => {
  // adapte le nom de route selon ton router
  router.push({ name: 'PraticienFormateurFormModif', params: { praticienFormateurId: id } })
}
 
const goToPraticienForm = () => {
  // adapte le nom de route selon ton router
  router.push({ name: 'PraticienFormateurForm' })
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
</style>
 
<style scoped>
.admin-scrollable {
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}
.admin-scrollable::-webkit-scrollbar {
  display: none; /* Chrome, Safari, Opera */
}
.filter-menu {
  padding: 20px;
}
</style>
 
 