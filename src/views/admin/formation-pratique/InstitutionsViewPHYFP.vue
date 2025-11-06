<template>
  <AdminLayout>
    <div class="p-4 admin-scrollable">
      <div class="surface-card fp-dark p-4 border-round shadow-2 mb-3">
        <div class="flex align-items-center justify-content-between gap-3">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-building text-primary text-4xl"></i>
            <div>
              <h1 class="text-3xl font-bold text-900 m-0">Institutions</h1>
              <p class="text-600 m-0 mt-2">Liste des institutions</p>
            </div>
          </div>
          <div class="flex align-items-center gap-2">
            <InputText v-model="searchTerm" placeholder="Rechercher par nom..." class="search-input" />
          </div>
        </div>
      </div>
      <div class="surface-card fp-dark p-3 border-round shadow-2">
        <DataTable
          :value="filteredInstitutions"
          :paginator="true"
          :rows="10"
          dataKey="InstitutionId"
          :rowHover="true"
          :loading="loading"
        >
          <template #header>
            <div class="flex align-items-center justify-content-end gap-2 mr-3">
              <Button label="Ajouter une institution" icon="pi pi-plus" outlined @click="goToInstitutionForm" />
            </div>
          </template>
          <template #empty> Aucune institution trouvée. </template>
          <template #loading> Chargement des données... </template>

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
.search-input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--surface-border,#e0e0e0);
  border-radius: 8px;
  min-width: 260px;
}
.fp-dark {
  background: #0f1f33; /* navy */
  border: 1px solid rgba(255,255,255,0.06);
}
.fp-dark :deep(.p-datatable) {
  background: transparent;
  color: #e5e7eb;
}
.fp-dark :deep(.p-datatable-thead > tr > th) {
  background: rgba(255,255,255,0.03);
  color: #cbd5e1;
  border-color: rgba(255,255,255,0.06);
}
.fp-dark :deep(.p-datatable-tbody > tr > td) {
  background: transparent;
  color: #e5e7eb;
  border-color: rgba(255,255,255,0.06);
}
.fp-dark :deep(.p-paginator) {
  background: rgba(255,255,255,0.03);
  border-top: 1px solid rgba(255,255,255,0.06);
}
.fp-dark :deep(.p-inputtext),
.fp-dark :deep(textarea) {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.12);
  color: #f8fafc;
}
.fp-dark :deep(.p-inputtext::placeholder),
.fp-dark :deep(textarea::placeholder) { color: #cbd5e1; }
.admin-scrollable {
  height: 100vh;
  overflow-y: auto;
  padding-bottom: 2rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.admin-scrollable::-webkit-scrollbar {
  display: none;
}
</style>
