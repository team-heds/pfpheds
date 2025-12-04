<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader title="Liste des institutions" subtitle="Gérez les institutions partenaires">
        <template #breadcrumbs>
          <div class="flex align-items-center gap-2 text-sm text-600">
            <router-link to="/admin" class="text-600 no-underline hover:text-primary">Dashboard</router-link>
            <i class="pi pi-angle-right text-300" aria-hidden="true"></i>
            <span class="text-900">Institutions</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>
    <div class="filter-menu is-compact">
      <AppSkeleton v-if="loading" variant="table" :rows="8" :cols="5" />
      <DataTable
        v-else
        :value="filteredInstitutions"
        :paginator="true"
        :rows="10"
        dataKey="InstitutionId"
        :rowHover="true"
      >
        <template #header>
          <div style="display: flex; justify-content: space-between; align-items: center;" class="mr-5">
            <Button label="Ajouter une institution" icon="pi pi-plus" outlined @click="goToInstitutionForm" class="ml-5" />
            <span style="flex: 1"></span>
            <span>
              <InputText v-model="searchTerm" placeholder="Rechercher par nom..." />
            </span>
          </div>
        </template>
        <template #empty>
          <EmptyState
            title="Aucune institution trouvée"
            description="Ajustez les filtres ou ajoutez une institution."
            icon="pi-building"
            actionLabel="Ajouter une institution"
            @action="goToInstitutionForm"
          />
        </template>
        
        <Column field="InstitutionId" header="ID" :sortable="true"></Column>
        <Column field="Name" header="Nom" :sortable="true"></Column>
        <Column field="Address" header="Adresse"></Column>
        <Column field="Locality" header="Localité" :sortable="true"></Column>
        <Column field="Canton" header="Canton" :sortable="true"></Column>
        
        <Column header="Actions">
          <template #body="{ data }">
            <Button icon="pi pi-eye" class="p-button-rounded p-button-info mr-2" @click="goToDetails(data.InstitutionId)" />
            <Button icon="pi pi-pencil" class="p-button-rounded p-button-success mr-2" @click="goToInstitutionFormModif(data.InstitutionId)" />
            <Button icon="pi pi-trash" class="p-button-rounded p-button-danger" @click="handleDelete(data.InstitutionId)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useInstitutionsStore } from '@/stores/institutionsStore';
import { useToast } from 'primevue/usetoast';

// PrimeVue Components
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue';
import AppSkeleton from '@/components/common/feedback/AppSkeleton.vue';
import EmptyState from '@/components/common/feedback/EmptyState.vue';

// Setup
const router = useRouter();
const institutionsStore = useInstitutionsStore();
const toast = useToast();

// State
const searchTerm = ref('');
const loading = computed(() => institutionsStore.loading);

// Computed properties
const institutions = computed(() => institutionsStore.institutions);

const filteredInstitutions = computed(() => {
  if (!searchTerm.value) {
    return institutions.value;
  }
  return institutions.value.filter(inst =>
    inst.Name && inst.Name.toLowerCase().includes(searchTerm.value.toLowerCase())
  );
});

// Lifecycle hooks
onMounted(() => {
  institutionsStore.fetchInstitutions();
});

// Methods
const handleDelete = async (id) => {
  if (window.confirm("Êtes-vous sûr de vouloir supprimer cette institution ?")) {
    try {
      await institutionsStore.deleteInstitution(id);
      toast.add({ severity: 'success', summary: 'Succès', detail: 'Institution supprimée.', life: 3000 });
    } catch (error) {
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'La suppression a échoué.', life: 3000 });
    }
  }
};

const goToInstitutionForm = () => router.push({ name: 'InstitutionForm' });
const goToInstitutionFormModif = (id) => router.push({ name: 'InstitutionFormModif', params: { id } });
const goToDetails = (id) => router.push({ name: 'InstitutionView', params: { id } });

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