<template>
  <Navbar />
  <div class="page-wrapper">
    <div class="user-list-page">
      <!-- Header de la page -->
      <div class="col-12">
        <div class="card">
          <div class="flex align-items-center gap-2 mb-3 text-sm text-600">
            <router-link to="/admin" class="text-600 no-underline hover:text-primary transition-colors">
              <i class="pi pi-home mr-1"></i>
              Dashboard
            </router-link>
            <i class="pi pi-angle-right text-300"></i>
            <span class="text-900 font-medium">Liste des Utilisateurs</span>
          </div>
          <h1 class="text-3xl font-bold text-900 m-0 mb-2 flex align-items-center gap-3">
            <i class="pi pi-users text-blue-500 text-3xl"></i>
            Liste des Utilisateurs
          </h1>
          <p class="text-600 text-lg line-height-3 m-0">
            Consultez et gérez la liste complète des utilisateurs de la plateforme.
          </p>
        </div>
      </div>

      <!-- Contenu principal -->
      <div class="col-12">
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
        class="surface-card border-round shadow-2"
      >
        <template #header>
          <div class="flex justify-content-between align-items-center flex-wrap gap-3 p-4">
            <div class="flex align-items-center gap-3">
              <div class="bg-blue-50 w-3rem h-3rem border-circle flex align-items-center justify-content-center">
                <i class="pi pi-users text-blue-500 text-xl"></i>
              </div>
              <div>
                <h3 class="text-xl font-semibold text-900 m-0">Utilisateurs</h3>
                <p class="text-600 m-0 text-sm">{{ filteredUtilisateurs.length }} utilisateur(s) trouvé(s)</p>
              </div>
            </div>
            <div class="flex gap-3 align-items-center flex-wrap">
              <IconField iconPosition="left">
                <InputIcon class="pi pi-search" />
                <InputText v-model="globalFilter" placeholder="Rechercher..." class="w-20rem" />
              </IconField>
              <Button label="Ajouter" icon="pi pi-plus" class="p-button-success" @click="goToUserForm" />
            </div>
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
import Navbar from '@/components/common/utils/Navbar.vue';

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
.page-wrapper {
  width: 100%;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.page-wrapper::-webkit-scrollbar {
  display: none;
}

.user-list-page {
  min-height: 100vh;
  padding: 2rem;
  padding-bottom: 8rem;
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .user-list-page {
    padding: 1rem;
    padding-bottom: 6rem;
  }
}
</style>