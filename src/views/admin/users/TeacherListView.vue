<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader title="Liste des enseignants" subtitle="Gérez la liste des enseignants">
        <template #breadcrumbs>
          <div class="flex align-items-center gap-2 text-sm text-600">
            <router-link to="/admin" class="text-600 no-underline hover:text-primary">Dashboard</router-link>
            <i class="pi pi-angle-right text-300" aria-hidden="true"></i>
            <span class="text-900">Enseignants</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>
    <div class="filter-menu is-compact">
      <AppSkeleton v-if="loading" variant="table" :rows="8" :cols="4" />
      <DataTable
        v-else
        :value="filteredEnseignants"
        :paginator="true"
        :rows="10"
        dataKey="id"
        :rowHover="true"
        v-model:filters="filters"
        filterDisplay="menu"
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
        <template #empty>
          <EmptyState
            title="Aucun enseignant trouvé"
            description="Ajustez les filtres ou ajoutez un enseignant."
            icon="pi-users"
            actionLabel="Ajouter un enseignant"
            @action="goToEnseignantForm"
          />
        </template>

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
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue';
import AppSkeleton from '@/components/common/feedback/AppSkeleton.vue';
import EmptyState from '@/components/common/feedback/EmptyState.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import { useEnseignantsStore } from '@/stores/enseignantsStore';

export default {
  name: "EnseignantList",
  components: {
    AdminPageHeader,
    AppSkeleton,
    EmptyState,
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
.filter-menu { padding: 20px; }
.is-compact :deep(.p-datatable .p-datatable-header) { padding: .75rem 1rem; }
.is-compact :deep(.p-datatable .p-datatable-thead > tr > th) { padding: .5rem .75rem; }
.is-compact :deep(.p-datatable .p-datatable-tbody > tr > td) { padding: .5rem .75rem; font-size: .95rem; }
.is-compact :deep(.p-inputtext),
.is-compact :deep(.p-dropdown),
.is-compact :deep(.p-button) { height: 2.5rem; }
</style>
