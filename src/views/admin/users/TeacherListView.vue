<template>
  <AdminLayout>
    <div class="filter-menu">
      <DataTable
        :value="filteredEnseignants"
        :paginator="true"
        :rows="10"
        dataKey="id"
        :rowHover="true"
        v-model:filters="filters"
        filterDisplay="menu"
        :loading="loading"
        :globalFilterFields="['last_name', 'first_name', 'email']"
        showGridlines
      >
        <template #header>
          <div class="flex justify-content-between flex-column sm:flex-row">
            <Button label="Ajouter un enseignant" icon="pi pi-plus" class="mb-2 mr-2" outlined @click="goToEnseignantForm" />
            <span class="p-input-icon-left">
              <InputText v-model="globalFilter" placeholder="Recherche" style="width: 100%" />
            </span>
          </div>
        </template>
        <template #empty> Aucun enseignant trouvé. </template>
        <template #loading> Chargement des données des enseignants. Veuillez patienter. </template>

        <Column field="last_name" header="Nom" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">{{ data.last_name }}</template>
        </Column>
        <Column field="first_name" header="Prénom" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">{{ data.first_name }}</template>
        </Column>
        <Column field="email" header="Email" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">{{ data.email }}</template>
        </Column>

        <Column header="Action" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            <Button label="Modifier" class="mb-2 mr-2" size="small" outlined severity="success" @click="goToEnseignantFormModif(data.id)" />
            <Button label="Supprimer" class="mb-2 mr-2" size="small" outlined severity="danger" @click="deleteEnseignant(data.id)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </AdminLayout>
</template>

<script>
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import { useEnseignantsStore } from '@/stores/enseignantsStore';

export default {
  name: "EnseignantList",
  components: {
    DataTable,
    Column,
    InputText,
    Button,
    AdminLayout
  },
  data() {
    return {
      enseignants: [],
      filters: {},
      loading: true,
      globalFilter: '',
      search: '',
    };
  },
  computed: {
    filteredEnseignants() {
      const searchLower = this.globalFilter.toLowerCase();
      return this.enseignants.filter(enseignant => {
        return (enseignant.last_name || '').toLowerCase().includes(searchLower)
          || (enseignant.first_name || '').toLowerCase().includes(searchLower)
          || (enseignant.email || '').toLowerCase().includes(searchLower);
      });
    }
  },
  async mounted() {
    try {
      const store = useEnseignantsStore();
      await store.fetchEnseignants();
      this.enseignants = store.enseignants;
      this.loading = false;
    } catch (error) {
      console.error('Erreur de récupération des données des enseignants', error);
    }
  },
  methods: {
    async deleteEnseignant(enseignantId) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
        try {
          const store = useEnseignantsStore();
          await store.deleteEnseignant(enseignantId);
          this.enseignants = store.enseignants;
        } catch (error) {
          console.error('Erreur de suppression de l’enseignant', error);
        }
      }
    },
    goToEnseignantFormModif(enseignantId) {
      this.$router.push({ name: 'EnseignentFormModif', params: { enseignantId } });
    },
    goToEnseignantForm() {
      this.$router.push({ name: 'EnseignentForm' });
    }
  }
};
</script>

<style scoped>
.admin-scrollable {
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.admin-scrollable::-webkit-scrollbar {
  display: none;
}
.filter-menu {
  padding: 20px;
}
</style>
