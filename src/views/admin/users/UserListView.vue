<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader title="Liste des utilisateurs" subtitle="Consultez et gérez la liste complète des utilisateurs">
        <template #breadcrumbs>
          <div class="flex align-items-center gap-2 text-sm text-600">
            <router-link to="/admin" class="text-600 no-underline hover:text-primary">Dashboard</router-link>
            <i class="pi pi-angle-right text-300" aria-hidden="true"></i>
            <span class="text-900">Utilisateurs</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>
    <div class="user-list-page is-compact">
      <div class="col-12">
      <AppSkeleton v-if="loading" variant="table" :rows="8" :cols="6" />
      <DataTable
        v-else
        :value="filteredUtilisateurs"
        :paginator="true"
        :rows="10"
        dataKey="id"
        :rowHover="true"
        v-model:filters="filters"
        filterDisplay="menu"
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
        <template #empty>
          <EmptyState
            title="Aucun utilisateur trouvé"
            description="Ajustez les filtres ou ajoutez un utilisateur."
            icon="pi-users"
            actionLabel="Ajouter"
            @action="goToUserForm"
          />
        </template>
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

    <!-- Dialog d'ajout d'utilisateur -->
    <Dialog v-model:visible="showAddUserDialog" modal header="Créer un nouvel utilisateur" :style="{ width: '48rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
      <div class="flex flex-column gap-3 pt-3">
        <div class="p-message p-message-info mb-2" style="border-radius: 8px;">
          <div class="p-message-wrapper" style="padding: 0.75rem 1rem;">
            <span class="p-message-icon pi pi-info-circle"></span>
            <span class="p-message-detail">L'utilisateur sera créé directement dans Supabase avec email confirmé. Il pourra se connecter immédiatement.</span>
          </div>
        </div>

        <div class="grid">
          <div class="col-6">
            <div class="flex flex-column gap-2">
              <label for="newUserForname" class="font-semibold">Prénom *</label>
              <InputText id="newUserForname" v-model="newUser.forname" placeholder="Prénom" />
            </div>
          </div>
          <div class="col-6">
            <div class="flex flex-column gap-2">
              <label for="newUserFamilyName" class="font-semibold">Nom de famille *</label>
              <InputText id="newUserFamilyName" v-model="newUser.familyName" placeholder="Nom de famille" />
            </div>
          </div>
        </div>

        <div class="flex flex-column gap-2">
          <label for="newUserEmail" class="font-semibold">Email *</label>
          <InputText id="newUserEmail" v-model="newUser.email" type="email" placeholder="prenom.nom@hedsvs.ch" :class="{ 'p-invalid': emailError }" />
          <small v-if="emailError" class="p-error">Veuillez entrer un email valide</small>
        </div>
        
        <div class="flex flex-column gap-2">
          <label for="newUserPassword" class="font-semibold">Mot de passe *</label>
          <div class="flex gap-2 align-items-center">
            <Password id="newUserPassword" v-model="newUser.password" placeholder="Minimum 6 caractères" toggleMask :feedback="false" :class="{ 'p-invalid': passwordError }" class="flex-1" />
            <Button icon="pi pi-refresh" severity="secondary" size="small" v-tooltip.top="'Générer un mot de passe'" @click="generatePassword" />
          </div>
          <small v-if="passwordError" class="p-error">Le mot de passe doit contenir au moins 6 caractères</small>
        </div>

        <div class="grid">
          <div class="col-6">
            <div class="flex flex-column gap-2">
              <label for="newUserRole" class="font-semibold">Rôle</label>
              <Dropdown id="newUserRole" v-model="newUser.role" :options="roleOptions" placeholder="Sélectionner un rôle" />
            </div>
          </div>
          <div class="col-6">
            <div class="flex flex-column gap-2">
              <label for="newUserPermissions" class="font-semibold">Permissions</label>
              <MultiSelect id="newUserPermissions" v-model="newUser.permissions" :options="permissionOptions" placeholder="Sélectionner les permissions" display="chip" :maxSelectedLabels="3" />
            </div>
          </div>
        </div>

        <div class="flex flex-column gap-2">
          <label for="newUserDisplayName" class="font-semibold">Nom d'affichage</label>
          <InputText id="newUserDisplayName" v-model="newUser.displayName" :placeholder="newUser.forname && newUser.familyName ? newUser.forname + ' ' + newUser.familyName : 'Généré automatiquement'" />
          <small class="text-500">Laissez vide pour utiliser Prénom + Nom</small>
        </div>

        <div v-if="createUserError" class="p-message p-message-error mt-2" style="border-radius: 8px;">
          <div class="p-message-wrapper" style="padding: 0.75rem 1rem;">
            <span class="p-message-icon pi pi-times-circle"></span>
            <span class="p-message-detail">{{ createUserError }}</span>
          </div>
        </div>

        <div v-if="createdUserSummary" class="p-message p-message-success mt-2" style="border-radius: 8px;">
          <div class="p-message-wrapper" style="padding: 0.75rem 1rem;">
            <span class="p-message-icon pi pi-check-circle"></span>
            <span class="p-message-detail">{{ createdUserSummary }}</span>
          </div>
        </div>
      </div>

      <template #footer>
        <Button label="Annuler" icon="pi pi-times" @click="closeAddUserDialog" text />
        <Button label="Créer l'utilisateur" icon="pi pi-check" @click="createNewUser" :loading="creatingUser" severity="success" />
      </template>
    </Dialog>

    <Toast />
  </AdminLayout>
</template>

<script>
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue';
import AppSkeleton from '@/components/common/feedback/AppSkeleton.vue';
import EmptyState from '@/components/common/feedback/EmptyState.vue';
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
import Dialog from 'primevue/dialog';
import Password from 'primevue/password';
import MultiSelect from 'primevue/multiselect';
import Tooltip from 'primevue/tooltip';
import Toast from 'primevue/toast';
import { useToast } from 'primevue/usetoast';
import { useAuthStore } from '@/stores/authStore';
import { supabaseAdmin } from '@/supabaseAdmin';
import { nextTick } from 'vue';
// import Navbar from '@/components/common/utils/Navbar.vue';

export default {
  name: "UserList",
  components: {
    AdminPageHeader,
    AppSkeleton,
    EmptyState,
    DataTable,
    Column,
    InputText,
    Button,
    IconField,
    InputIcon,
    Dropdown,
    Tag,
    AdminLayout,
    Dialog,
    Password,
    MultiSelect,
    Toast
  },
  directives: {
    tooltip: Tooltip
  },
  setup() {
    const toast = useToast();
    const authStore = useAuthStore();
    return { toast, authStore };
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
      showAddUserDialog: false,
      creatingUser: false,
      emailError: false,
      passwordError: false,
      createUserError: '',
      newUser: {
        email: '',
        password: '',
        forname: '',
        familyName: '',
        displayName: '',
        role: 'student',
        permissions: []
      },
      createdUserSummary: '',
      roleOptions: ['student', 'teacher', 'admin', 'moderator', 'practitioner', 'EnseignantSoins', 'EnseignantPhysio', 'editor'],
      permissionOptions: ['EnseignantSoins', 'EnseignantPhysio', 'AdminSoins', 'AdminPhysio', 'Secretariat', 'RM', 'editor']
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
    await this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      this.loading = true;
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
      } catch (error) {
        console.error('Erreur de récupération des données', error);
        this.toast.add({ 
          severity: 'error', 
          summary: 'Erreur de chargement', 
          detail: 'Impossible de charger les utilisateurs.', 
          life: 3000 
        });
      } finally {
        this.loading = false;
      }
    },
    async deleteUser(userId) {
      // Confirmation de suppression
      const confirmed = confirm('⚠️ ATTENTION : Voulez-vous vraiment supprimer cet utilisateur ?\n\nCela supprimera :\n- Son profil utilisateur\n- Toutes ses données associées\n\nCette action est IRRÉVERSIBLE !');
      
      if (!confirmed) return;

      try {
        // 1. Supprimer de user_profiles
        const { error: profileError } = await supabase
          .from('user_profiles')
          .delete()
          .eq('user_id', userId);

        if (profileError) throw profileError;

        // 2. Supprimer l'authentification (nécessite une fonction RPC côté serveur)
        const { error: authError } = await supabase.rpc('delete_user', { 
          user_id: userId 
        });

        // 3. Attendre et recharger la liste automatiquement
        await nextTick();
        await new Promise(resolve => setTimeout(resolve, 100));
        await this.fetchUsers();

        if (authError) {
          console.warn('Impossible de supprimer l\'authentification:', authError);
          this.toast.add({ 
            severity: 'warn', 
            summary: 'Suppression partielle', 
            detail: 'Le profil a été supprimé mais l\'authentification reste active. Contactez un super admin.', 
            life: 6000 
          });
        } else {
          this.toast.add({ 
            severity: 'success', 
            summary: 'Utilisateur supprimé', 
            detail: 'L\'utilisateur a été complètement supprimé (profil + authentification).', 
            life: 4000 
          });
        }

      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        this.toast.add({ 
          severity: 'error', 
          summary: 'Erreur de suppression', 
          detail: error.message || 'Impossible de supprimer l\'utilisateur.', 
          life: 5000 
        });
      }
    },
    goToUserFormModif(userId) {
      this.$router.push({ name: 'NewUserFormModif', params: { userId } });
    },
    goToUserForm() {
      this.showAddUserDialog = true;
      this.resetNewUserForm();
    },
    closeAddUserDialog() {
      this.showAddUserDialog = false;
      this.resetNewUserForm();
    },
    resetNewUserForm() {
      this.newUser = {
        email: '',
        password: '',
        forname: '',
        familyName: '',
        displayName: '',
        role: 'student',
        permissions: []
      };
      this.emailError = false;
      this.passwordError = false;
      this.createUserError = '';
      this.createdUserSummary = '';
    },
    generatePassword() {
      const chars = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const specials = '!@#$%&*';
      let pwd = '';
      for (let i = 0; i < 10; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
      pwd += specials.charAt(Math.floor(Math.random() * specials.length));
      this.newUser.password = pwd;
    },
    async createNewUser() {
      this.emailError = false;
      this.passwordError = false;
      this.createUserError = '';
      this.createdUserSummary = '';

      // Validation
      const email = (this.newUser.email || '').trim().toLowerCase();
      if (!email || !email.includes('@')) {
        this.emailError = true;
        this.toast.add({ severity: 'warn', summary: 'Email invalide', detail: 'Veuillez entrer un email valide.', life: 3000 });
        return;
      }
      if (!this.newUser.password || this.newUser.password.length < 6) {
        this.passwordError = true;
        this.toast.add({ severity: 'warn', summary: 'Mot de passe trop court', detail: 'Le mot de passe doit contenir au moins 6 caractères.', life: 3000 });
        return;
      }
      if (!this.newUser.forname || !this.newUser.familyName) {
        this.toast.add({ severity: 'warn', summary: 'Nom requis', detail: 'Veuillez renseigner le prénom et le nom.', life: 3000 });
        return;
      }

      this.creatingUser = true;
      const forname = this.newUser.forname.trim();
      const familyName = this.newUser.familyName.trim();
      const displayName = this.newUser.displayName.trim() || `${forname} ${familyName}`;
      const role = this.newUser.role || 'student';
      const permissions = this.newUser.permissions || [];

      try {
        // ── Méthode 1 : Admin API via service role key ──
        if (supabaseAdmin) {
          // 1. Créer l'utilisateur via l'API admin (ne touche pas la session courante)
          const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password: this.newUser.password,
            email_confirm: true,
            user_metadata: { forname, family_name: familyName, display_name: displayName, role }
          });
          if (authError) throw authError;

          const userId = authData.user.id;

          // 2. Créer / mettre à jour le profil dans user_profiles
          const { error: profileError } = await supabaseAdmin
            .from('user_profiles')
            .upsert({
              user_id: userId,
              email,
              forname,
              family_name: familyName,
              display_name: displayName,
              role,
              permissions,
              is_active: true
            }, { onConflict: 'user_id' });

          if (profileError) {
            console.warn('Profil user_profiles non créé:', profileError.message);
          }

          this.createdUserSummary = `✅ ${displayName} (${email}) — ID: ${userId.slice(0, 8)}…`;

        } else {
          // ── Méthode 2 : Fallback signup classique (si pas de service role key) ──
          console.warn('⚠️ Pas de service role key — fallback sur signUp classique');
          const signUpData = await this.authStore.signUpSupabase({
            email,
            password: this.newUser.password,
            options: {
              data: { forname, family_name: familyName, display_name: displayName, role }
            }
          });
          this.createdUserSummary = `✅ ${displayName} (${email}) créé (fallback signup)`;
        }

        // Recharger la liste
        await nextTick();
        await new Promise(resolve => setTimeout(resolve, 300));
        await this.fetchUsers();

        this.toast.add({ 
          severity: 'success', 
          summary: 'Utilisateur créé', 
          detail: `${displayName} (${email}) — rôle: ${role}`, 
          life: 5000 
        });

      } catch (error) {
        console.error('Erreur création utilisateur:', error);
        this.createUserError = error.message || 'Erreur lors de la création.';
        this.toast.add({ severity: 'error', summary: 'Erreur', detail: this.createUserError, life: 5000 });
      } finally {
        this.creatingUser = false;
      }
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

/* Variante compacte locale */
.is-compact :deep(.p-datatable .p-datatable-header) {
  padding: .75rem 1rem;
}
.is-compact :deep(.p-datatable .p-datatable-thead > tr > th) {
  padding: .5rem .75rem;
}
.is-compact :deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: .5rem .75rem;
  font-size: .95rem;
}
.is-compact :deep(.p-inputtext),
.is-compact :deep(.p-dropdown),
.is-compact :deep(.p-button) {
  height: 2.5rem;
}

@media (max-width: 768px) {
  .user-list-page {
    padding: 1rem;
    padding-bottom: 6rem;
  }
}
</style>