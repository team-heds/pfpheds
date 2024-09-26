<template>
  <div>
    <Navbar />
    <div class="filter-menu">
      <DataTable
        :value="filteredPraticiensFormateurs"
        :paginator="true"
        :rows="10"
        dataKey="id"
        :rowHover="true"
        :filters="filters"
        filterDisplay="menu"
        :loading="loading"
        :globalFilterFields="['Nom', 'Prenom', 'Mail']"
        :globalFilter="globalFilter"
        showGridlines
      >
        <template #header>
          <div class="flex justify-content-between flex-column sm:flex-row">
            <Button label="Ajouter un praticien formateur" icon="pi pi-plus" class="mb-2 mr-2" outlined @click="goToPraticienFormateurForm" />
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText v-model="globalFilter" placeholder="Recherche" style="width: 100%" />
            </IconField>
          </div>
        </template>
        <template #empty> Aucun praticien formateur trouvé. </template>
        <template #loading> Chargement des données des praticiens formateurs. Veuillez patienter. </template>
        <Column field="Nom" header="Nom" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            {{ data.Nom }}
          </template>

        </Column>
        <Column field="Prenom" header="Prénom" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            {{ data.Prenom }}
          </template>
          <template #filter="{ filterModel }">
            <InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Rechercher par prénom" />
          </template>
        </Column>
        <Column field="Mail" header="Mail" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            {{ data.Mail }}
          </template>
          <template #filter="{ filterModel }">
            <InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Rechercher par mail" />
          </template>
        </Column>
        <Column header="Action" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            <Button label="Modifier" class="mb-2 mr-2" size="small" outlined severity="success" @click="goToPraticienFormateurFormModif(data.id)" />
            <Button label="Supprimer" class="mb-2 mr-2"  size="small" outlined severity="danger" @click="deletePraticienFormateur(data.id)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script>
import { db } from '../../../../firebase.js';
import { ref, onValue, remove } from "firebase/database";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Navbar from '@/components/Utils/Navbar.vue';

export default {
  name: "PraticienFormateurList",
  components: {
    DataTable,
    Column,
    InputText,
    Button,
    IconField,
    InputIcon,
    Navbar
  },
  data() {
    return {
      praticiensFormateurs: [],
      filters: {},
      loading: true,
      globalFilter: '',
    };
  },
  computed: {
    filteredPraticiensFormateurs() {
      const searchLower = this.globalFilter.toLowerCase();
      return this.praticiensFormateurs.filter(praticienFormateur => {
        const nom = praticienFormateur.Nom ? praticienFormateur.Nom.toLowerCase() : '';
        const prenom = praticienFormateur.Prenom ? praticienFormateur.Prenom.toLowerCase() : '';
        const mail = praticienFormateur.Mail ? praticienFormateur.Mail.toLowerCase() : '';

        return nom.includes(searchLower) || prenom.includes(searchLower) || mail.includes(searchLower);
      });
    }
  },
  async mounted() {
    try {
      const praticiensFormateursRef = ref(db, 'PraticienFormateurs/');
      onValue(praticiensFormateursRef, (snapshot) => {
        const praticiensFormateursData = snapshot.val();
        if (praticiensFormateursData) {
          this.praticiensFormateurs = Object.keys(praticiensFormateursData).map(key => ({
            id: key,
            ...praticiensFormateursData[key]
          }));
        }
        this.loading = false;
      });
    } catch (error) {
      console.error('Erreur de récupération des données des praticiens formateurs', error);
      this.loading = false;
    }
  },
  methods: {
    async deletePraticienFormateur(praticienFormateurId) {
      if (confirm('Êtes-vous sûr de vouloir supprimer ce praticien formateur ?')) {
        try {
          const praticienFormateurRef = ref(db, 'PraticienFormateurs/' + praticienFormateurId);
          await remove(praticienFormateurRef);
          // Rafraîchir la liste des praticiens formateurs
          this.praticiensFormateurs = this.praticiensFormateurs.filter(p => p.id !== praticienFormateurId);
        } catch (error) {
          console.error('Erreur de suppression du praticien formateur', error);
        }
      }
    },
    goToPraticienFormateurFormModif(praticienFormateurId) {
      this.$router.push({ name: 'PraticienFormateurFormModif', params: { praticienFormateurId } });
    },
    goToPraticienFormateurForm() {
      this.$router.push({ name: 'PraticienFormateurForm' });
    },
    goToAdminDashboard() {
      this.$router.push({ name: 'AdminDashboard' });
    },
    clearFilter() {
      this.filters = {};
      this.globalFilter = '';
    }
  }
};
</script>

<style scoped>
.filter-menu {
  padding: 20px;
}
</style>
