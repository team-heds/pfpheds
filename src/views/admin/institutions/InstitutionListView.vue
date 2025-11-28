<template>
  <AdminLayout>
    <h1 style="margin: 2rem 0 1rem 0; text-align: center;" class="m-8">Liste des institutions</h1>
    <div style="margin: 0 2rem;">
      <DataTable
        :value="filteredInstitutions"
        :paginator="true"
        :rows="10"
        dataKey="InstitutionId"
        :rowHover="true"
        :loading="loading"
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
</style>