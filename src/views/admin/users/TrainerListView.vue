<template>
  <div class="admin-scrollable">
    <Navbar />
    <div class="filter-menu">
      <DataTable
        :value="praticiensFormateurs"
        :paginator="true"
        :rows="10"
        dataKey="id"
        :rowHover="true"
        v-model:filters="filters"
        filterDisplay="menu"
        :loading="loading"
        :globalFilterFields="['nom', 'prenom', 'mail', 'institution']"
        showGridlines
      >
        <template #header>
          <div class="flex justify-content-between flex-column sm:flex-row">
            <Button label="Ajouter un praticien" icon="pi pi-plus" class="mb-2 mr-2" outlined @click="goToPraticienFormateurForm" />
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText v-model="filters['global'].value" placeholder="Recherche globale" style="width: 100%" />
            </IconField>
          </div>
        </template>
        <template #empty> Aucun praticien formateur trouvé. </template>
        <template #loading> Chargement des données... </template>
        
        <Column field="nom" header="Nom" style="min-width: 12rem" sortable>
          <template #body="{ data }">{{ data.nom }}</template>
        </Column>
        <Column field="prenom" header="Prénom" style="min-width: 12rem" sortable>
          <template #body="{ data }">{{ data.prenom }}</template>
        </Column>
        <Column field="mail" header="Mail" style="min-width: 12rem" sortable>
          <template #body="{ data }">{{ data.mail }}</template>
        </Column>
        <Column field="institution" header="Institution" style="min-width: 12rem" sortable>
          <template #body="{ data }">{{ data.institution }}</template>
        </Column>

        <Column header="Action" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            <Button label="Modifier" class="mb-2 mr-2" size="small" outlined severity="success" @click="goToPraticienFormateurFormModif(data.id)" />
            <Button label="Supprimer" class="mb-2 mr-2" size="small" outlined severity="danger" @click="confirmDelete(data.id)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';
import { usePraticiensFormateursStore } from '@/stores/praticiensFormateursStore';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Navbar from '@/components/common/utils/Navbar.vue';
import { FilterMatchMode } from 'primevue/api';

const router = useRouter();
const store = usePraticiensFormateursStore();

// State from store - using storeToRefs to keep reactivity
const { praticiensFormateurs, loading } = storeToRefs(store);

// Local state for filtering
const filters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

// Fetch data on component mount
onMounted(() => {
  store.fetchPraticiensFormateurs();
});

// Methods
const confirmDelete = (id) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer ce praticien formateur ?')) {
    store.deletePraticienFormateur(id);
  }
};

const goToPraticienFormateurFormModif = (id) => {
  router.push({ name: 'PraticienFormateurFormModif', params: { praticienFormateurId: id } });
};

const goToPraticienFormateurForm = () => {
  router.push({ name: 'PraticienFormateurForm' });
};
</script>

<style scoped>
.admin-scrollable {
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
}
.admin-scrollable::-webkit-scrollbar {
  display: none; /* Chrome, Safari, and Opera */
}
.filter-menu {
  padding: 20px;
}
</style>
