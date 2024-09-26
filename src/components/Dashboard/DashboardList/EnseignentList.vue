<template>
  <div>
    <Navbar />
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
        :globalFilterFields="['Name', 'Forname', 'Mail']"
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

        <Column field="Name" header="Nom" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">{{ data.Name }}</template>
        </Column>
        <Column field="Forname" header="Prénom" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">{{ data.Forname }}</template>
        </Column>
        <Column field="Mail" header="Email" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">{{ data.Mail }}</template>
        </Column>

        <Column header="Action" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            <Button label="Modifier" class="mb-2 mr-2" size="small" outlined severity="success" @click="goToEnseignantFormModif(data.id)" />
            <Button label="Supprimer" class="mb-2 mr-2" size="small" outlined severity="danger" @click="deleteEnseignant(data.id)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script>
import { ref, onValue, set } from "firebase/database";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import Navbar from '@/components/Utils/Navbar.vue';
import { getDatabase, ref as dbRef } from 'firebase/database';

export default {
  name: "EnseignantList",
  components: {
    DataTable,
    Column,
    InputText,
    Button,
    Navbar
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
        return enseignant.Name.toLowerCase().includes(searchLower)
          || enseignant.Forname.toLowerCase().includes(searchLower)
          || enseignant.Mail.toLowerCase().includes(searchLower);
      });
    }
  },
  async mounted() {
    try {
      const db = getDatabase();
      const enseignantsRef = dbRef(db, 'Enseignants/');
      onValue(enseignantsRef, (snapshot) => {
        const enseignantsData = snapshot.val();
        if (enseignantsData) {
          this.enseignants = Object.keys(enseignantsData).map(key => ({
            id: key,
            ...enseignantsData[key]
          }));
        }
        this.loading = false;
      });
    } catch (error) {
      console.error('Erreur de récupération des données des enseignants', error);
    }
  },
  methods: {
    async deleteEnseignant(enseignantId) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cet enseignant ?')) {
        try {
          const db = getDatabase();
          const enseignantRef = dbRef(db, 'Enseignants/' + enseignantId);
          await set(enseignantRef, null);
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
.filter-menu {
  padding: 20px;
}
</style>
