<template>
  <AdminLayout>
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
              <Dropdown v-model="selectedRole" :options="availableRoles" placeholder="Filtrer par rôle" showClear class="w-16rem" />
              <Dropdown v-model="selectedPermission" :options="availablePermissions" placeholder="Filtrer par permission" showClear class="w-20rem" />
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
        <Column field="Roles" header="Rôles" style="min-width: 14rem" class="text-center">
          <template #body="{ data }">
            <div class="flex gap-1 justify-content-center flex-wrap">
              <Tag v-for="r in (data.rolesList || [])" :key="r" :value="r" :severity="r === 'admin' ? 'danger' : 'info'" />
            </div>
          </template>
        </Column>
        <Column field="Permissions" header="Permissions" style="min-width: 16rem" class="text-center">
          <template #body="{ data }">
            <div class="flex gap-1 justify-content-center flex-wrap">
              <Tag v-for="p in (data.permsList || [])" :key="p" :value="p" severity="secondary" />
            </div>
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
  </AdminLayout>
</template>

<script>
import { supabase } from '@/supabase';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Dropdown from 'primevue/dropdown';
import Tag from 'primevue/tag';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
// import Navbar from '@/components/common/utils/Navbar.vue';

export default {
  name: "UserList",
  components: {
    DataTable,
    Column,
    InputText,
    Button,
    IconField,
    InputIcon,
    Dropdown,
    Tag,
    AdminLayout
  },
  data() {
    return {
      utilisateurs: [],
      filters: {},
      loading: true,
      globalFilter: '',
      search: '',
      selectedRole: null,
      selectedPermission: null,
      availableRoles: [],
      availablePermissions: [],
    };
  },
  computed: {
    filteredUtilisateurs() {
      const term = (this.globalFilter || '').toLowerCase();
      return this.utilisateurs
        .filter(u => {
          // role filter
          if (this.selectedRole) {
            const rolesList = u.rolesList || [];
            if (!rolesList.includes(this.selectedRole)) return false;
          }
          // permission filter
          if (this.selectedPermission) {
            const permsList = u.permsList || [];
            if (!permsList.includes(this.selectedPermission)) return false;
          }
          return true;
        })
        .filter(u => {
          if (!term) return true;
          const rolesJoined = (u.rolesList || []).join(' ').toLowerCase();
          const permsJoined = (u.permsList || []).join(' ').toLowerCase();
          return (
            (u.Name || '').toLowerCase().includes(term) ||
            (u.Forname || '').toLowerCase().includes(term) ||
            (u.Mail || '').toLowerCase().includes(term) ||
            rolesJoined.includes(term) ||
            permsJoined.includes(term)
          );
        });
    }
  },
  async mounted() {
    try {

      const roleSet = new Set();
      const permSet = new Set();

      // Normalisation des permissions comme dans RoleManagement.vue
      const normalize = (p) => {
        if (!p || typeof p !== 'string') return p;
        if (p === 'page1') return 'page1.access';
        if (p === 'page2') return 'page2.access';
        if (p.endsWith('.access')) {
          const base = p.slice(0, -7);
          const prefixes = ['Admin', 'Enseignant', 'Etudiant', 'RM'];
          if (prefixes.some(pr => base.startsWith(pr))) return base;
        }
        return p;
      };

      // Read from user_profiles including permissions array if present
      let rows = [];
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('user_id,email,display_name,forname,family_name,role,is_active,permissions');
        if (error) throw error;
        rows = data || [];
      } catch (e) {
        // If permissions column is missing, retry without it
        if (e?.code === '42703' || /column\s+.*permissions.*\s+does not exist/i.test(e?.message || '')) {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('user_id,email,display_name,forname,family_name,role,is_active');
          if (error) throw error;
          rows = data || [];
        } else {
          throw e;
        }
      }

      // Map to UI model
      this.utilisateurs = (rows || []).map(u => {
        const permsArr = Array.isArray(u?.permissions) ? u.permissions.map(normalize) : [];
        const permsList = Array.from(new Set(permsArr));
        permsList.forEach(p => permSet.add(p));
        const roleFromCol = u.role ? [String(u.role)] : [];
        const rolesFromPerms = permsList.filter(p => !p.endsWith('.access'));
        const rolesList = Array.from(new Set([...roleFromCol, ...rolesFromPerms].filter(Boolean)));
        rolesList.forEach(r => roleSet.add(r));
        const Name = u.family_name || '';
        const Forname = u.forname || '';
        const display = u.display_name || `${Forname} ${Name}`.trim();
        return {
          id: u.user_id,
          Mail: u.email || '',
          Name: Name || display || '',
          Forname: Forname || '',
          rolesList,
          permsList,
          is_active: u.is_active,
        };
      });

      this.availableRoles = Array.from(roleSet).sort();
      this.availablePermissions = Array.from(permSet).sort();
      this.loading = false;
    } catch (error) {
      console.error('Erreur de récupération des données', error);
      this.loading = false;
    }
  },
  methods: {
    async deleteUser() {
      alert('Suppression côté Supabase non implémentée ici.');
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