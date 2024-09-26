<template>
  <div>
    <Navbar />
    <div class="filter-menu">
      <DataTable
        :value="filteredUtilisateurs"
        :paginator="true"
        :rows="10"
        dataKey="id"
        :rowHover="true"
        v-model:filters="filters"
        filterDisplay="menu"
        :loading="loading"
        :globalFilterFields="['Nom', 'Prenom', 'Role', 'Email']"
        showGridlines
      >
        <template #header>
          <div class="flex justify-content-between flex-column sm:flex-row">
            <Button label="Ajouter un utilisateur" icon="pi pi-plus" class="mb-2 mr-2" outlined @click="goToUserForm" />
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText v-model="globalFilter" placeholder="Recherche" style="width: 100%" />
            </IconField>
          </div>
        </template>
        <template #empty> Aucun utilisateur trouvé. </template>
        <template #loading> Chargement des données des utilisateurs. Veuillez patienter. </template>
        <Column field="Nom" header="Nom" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            {{ data.Name }}
          </template>
          <template #filter="{ filterModel }">
            <InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Rechercher par nom" />
          </template>
        </Column>
        <Column field="Prenom" header="Prénom" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            {{ data.Forname }}
          </template>
          <template #filter="{ filterModel }">
            <InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Rechercher par prénom" />
          </template>
        </Column>
        <Column field="Role" header="Rôle" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            {{ data.Roles }}
          </template>
          <template #filter="{ filterModel }">
            <InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Rechercher par rôle" />
          </template>
        </Column>
        <Column field="Email" header="Email" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            {{ data.Mail }}
          </template>
          <template #filter="{ filterModel }">
            <InputText type="text" v-model="filterModel.value" class="p-column-filter" placeholder="Rechercher par email" />
          </template>
        </Column>
        <Column header="Action" style="min-width: 12rem" class="text-center">
          <template #body="{ data }">
            <Button label="Modifier" class="mb-2 mr-2" size="small" outlined severity="success" @click="goToUserFormModif(data.id)" />
            <Button label="Supprimer" class="mb-2 mr-2" size="small" outlined severity="danger" @click="deleteUser(data.id)" />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script>
import { db } from '../../../../firebase.js';
import { ref, onValue, set } from "firebase/database";
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Navbar from '@/components/Utils/Navbar.vue';

export default {
  name: "UserList",
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
      utilisateurs: [],
      filters: {},
      loading: true,
      globalFilter: '',
      search: '',
    };
  },
  computed: {
    filteredUtilisateurs() {
      const searchLower = this.globalFilter.toLowerCase();
      return this.utilisateurs.filter(utilisateur => {
        return utilisateur.Name.toLowerCase().includes(searchLower)
          || utilisateur.Forname.toLowerCase().includes(searchLower)
          || utilisateur.Roles.toLowerCase().includes(searchLower)
          || utilisateur.Mail.toLowerCase().includes(searchLower);
      });
    }
  },
  async mounted() {
    try {
      const usersRef = ref(db, 'Users/');
      onValue(usersRef, (snapshot) => {
        const usersData = snapshot.val();
        if (usersData) {
          this.utilisateurs = Object.keys(usersData).map(key => ({
            id: key,
            ...usersData[key]
          }));
        }
        this.loading = false;
      });
    } catch (error) {
      console.error('Erreur de récupération des données', error);
    }
  },
  methods: {
    async deleteUser(userId) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
        try {
          const userRef = ref(db, 'Users/' + userId);
          await set(userRef, null);
        } catch (error) {
          console.error('Erreur de suppression de l’utilisateur', error);
        }
      }
    },
    goToUserFormModif(userId) {
      this.$router.push({ name: 'NewUserFormModif', params: { userId } });
    },
    goToUserForm() {
      this.$router.push({ name: 'NewUserForm' });
    },
    goToAdminDashboard() {
      this.$router.push({ name: 'DashboardAdmin' });
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
