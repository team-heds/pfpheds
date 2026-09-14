<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader
        title="Liste des utilisateurs"
        subtitle="Gérez les profils et le premier accès sécurisé des étudiants BA26"
      >
        <template #breadcrumbs>
          <div class="flex align-items-center gap-2 text-sm text-600">
            <router-link to="/admin" class="text-600 no-underline hover:text-primary"
              >Dashboard</router-link
            >
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
          responsiveLayout="scroll"
          class="surface-card border-round shadow-2"
        >
          <template #header>
            <div class="flex justify-content-between align-items-center flex-wrap gap-3 p-4">
              <div class="flex align-items-center gap-3">
                <div
                  class="bg-blue-50 w-3rem h-3rem border-circle flex align-items-center justify-content-center"
                >
                  <i class="pi pi-users text-blue-500 text-xl"></i>
                </div>
                <div>
                  <h3 class="text-xl font-semibold text-900 m-0">Utilisateurs</h3>
                  <p class="text-600 m-0 text-sm">
                    {{ filteredUtilisateurs.length }} utilisateur(s) trouvé(s)
                  </p>
                </div>
              </div>
              <div class="flex gap-3 align-items-center flex-wrap">
                <IconField iconPosition="left">
                  <InputIcon class="pi pi-search" />
                  <InputText v-model="globalFilter" placeholder="Rechercher..." class="w-20rem" />
                </IconField>
                <Dropdown
                  v-model="selectedRole"
                  :options="availableRoles"
                  placeholder="Filtrer par rôle"
                  showClear
                  class="w-16rem"
                />
                <Dropdown
                  v-model="selectedPermission"
                  :options="availablePermissions"
                  placeholder="Filtrer par permission"
                  showClear
                  class="w-20rem"
                />
              </div>
            </div>
          </template>
          <template #empty>
            <EmptyState
              title="Aucun utilisateur trouvé"
              description="Ajustez les filtres pour retrouver un utilisateur."
              icon="pi-users"
            />
          </template>
          <Column field="Nom" header="Nom" style="min-width: 12rem" class="text-center">
            <template #body="{ data }">
              {{ data.Name }}
            </template>
            <template #filter="{ filterModel }">
              <InputText
                type="text"
                v-model="filterModel.value"
                class="p-column-filter"
                placeholder="Rechercher par nom"
              />
            </template>
          </Column>
          <Column field="Prenom" header="Prénom" style="min-width: 12rem" class="text-center">
            <template #body="{ data }">
              {{ data.Forname }}
            </template>
            <template #filter="{ filterModel }">
              <InputText
                type="text"
                v-model="filterModel.value"
                class="p-column-filter"
                placeholder="Rechercher par prénom"
              />
            </template>
          </Column>
          <Column field="Roles" header="Rôles" style="min-width: 14rem" class="text-center">
            <template #body="{ data }">
              <div class="flex gap-1 justify-content-center flex-wrap">
                <Tag
                  v-for="r in data.rolesList || []"
                  :key="r"
                  :value="r"
                  :severity="r === 'admin' ? 'danger' : 'info'"
                />
              </div>
            </template>
          </Column>
          <Column
            field="Permissions"
            header="Permissions"
            style="min-width: 16rem"
            class="text-center"
          >
            <template #body="{ data }">
              <div class="flex gap-1 justify-content-center flex-wrap">
                <Tag v-for="p in data.permsList || []" :key="p" :value="p" severity="secondary" />
              </div>
            </template>
          </Column>
          <Column field="Email" header="Email" style="min-width: 12rem" class="text-center">
            <template #body="{ data }">
              {{ data.Mail }}
            </template>
            <template #filter="{ filterModel }">
              <InputText
                type="text"
                v-model="filterModel.value"
                class="p-column-filter"
                placeholder="Rechercher par email"
              />
            </template>
          </Column>
          <Column header="Premier accès" style="min-width: 14rem" class="text-center">
            <template #body="{ data }">
              <div v-if="canSendInitialAccess(data)" class="initial-access-cell">
                <Tag
                  :value="initialAccessView(data).label"
                  :severity="initialAccessView(data).severity"
                />
                <small v-if="data.initialAccess?.lastSentAt" class="text-500">
                  {{ formatAccessDate(data.initialAccess.lastSentAt) }}
                </small>
                <Button
                  v-if="initialAccessView(data).action"
                  :label="initialAccessView(data).action"
                  icon="pi pi-send"
                  size="small"
                  text
                  :loading="Boolean(initialAccessLoading[data.id])"
                  :aria-label="`${initialAccessView(data).action} pour ${data.Forname} ${data.Name}`"
                  @click="requestInitialAccess(data)"
                />
              </div>
              <span v-else class="text-500 text-sm">Non concerné</span>
            </template>
          </Column>
          <Column header="Action" style="min-width: 12rem" class="text-center">
            <template #body="{ data }">
              <Button
                label="Modifier"
                class="mb-2 mr-2"
                size="small"
                outlined
                severity="success"
                @click="goToUserFormModif(data.id)"
              />
              <Button
                label="Supprimer"
                class="mb-2 mr-2"
                size="small"
                outlined
                severity="danger"
                @click="deleteUser(data.id)"
              />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>

    <Toast />
  </AdminLayout>
</template>

<script>
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue'
import AppSkeleton from '@/components/common/feedback/AppSkeleton.vue'
import EmptyState from '@/components/common/feedback/EmptyState.vue'
import { supabase } from '@/supabase'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Button from 'primevue/button'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Toast from 'primevue/toast'
import { useToast } from 'primevue/usetoast'
import apiClient from '@/service/apiClient'
import { nextTick } from 'vue'
import {
  canRequestInitialAccess,
  initialAccessPresentation,
  loadInitialAccessStates,
  sendInitialAccess
} from '@/service/studentInitialAccessService'
// import Navbar from '@/components/common/utils/Navbar.vue';

export default {
  name: 'UserList',
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
    Toast
  },
  setup() {
    const toast = useToast()
    return { toast }
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
      initialAccessLoading: {}
    }
  },
  computed: {
    filteredUtilisateurs() {
      const term = (this.globalFilter || '').toLowerCase()
      return this.utilisateurs
        .filter((u) => {
          // role filter
          if (this.selectedRole) {
            const rolesList = u.rolesList || []
            if (!rolesList.includes(this.selectedRole)) return false
          }
          // permission filter
          if (this.selectedPermission) {
            const permsList = u.permsList || []
            if (!permsList.includes(this.selectedPermission)) return false
          }
          return true
        })
        .filter((u) => {
          if (!term) return true
          const rolesJoined = (u.rolesList || []).join(' ').toLowerCase()
          const permsJoined = (u.permsList || []).join(' ').toLowerCase()
          return (
            (u.Name || '').toLowerCase().includes(term) ||
            (u.Forname || '').toLowerCase().includes(term) ||
            (u.Mail || '').toLowerCase().includes(term) ||
            rolesJoined.includes(term) ||
            permsJoined.includes(term)
          )
        })
    }
  },
  async mounted() {
    await this.fetchUsers()
  },
  methods: {
    async fetchUsers() {
      this.loading = true
      try {
        const roleSet = new Set()
        const permSet = new Set()

        // Normalisation des permissions comme dans RoleManagement.vue
        const normalize = (p) => {
          if (!p || typeof p !== 'string') return p
          if (p === 'page1') return 'page1.access'
          if (p === 'page2') return 'page2.access'
          if (p.endsWith('.access')) {
            const base = p.slice(0, -7)
            const prefixes = ['Admin', 'Enseignant', 'Etudiant', 'RM']
            if (prefixes.some((pr) => base.startsWith(pr))) return base
          }
          return p
        }

        // Read from user_profiles including permissions array if present
        let rows = []
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select(
              'user_id,email,display_name,forname,family_name,role,is_active,permissions,classe'
            )
          if (error) throw error
          rows = data || []
        } catch (e) {
          // If permissions column is missing, retry without it
          if (
            e?.code === '42703' ||
            /column\s+.*permissions.*\s+does not exist/i.test(e?.message || '')
          ) {
            const { data, error } = await supabase
              .from('user_profiles')
              .select('user_id,email,display_name,forname,family_name,role,is_active,classe')
            if (error) throw error
            rows = data || []
          } else {
            throw e
          }
        }

        // Map to UI model
        this.utilisateurs = (rows || []).map((u) => {
          const permsArr = Array.isArray(u?.permissions) ? u.permissions.map(normalize) : []
          const permsList = Array.from(new Set(permsArr))
          permsList.forEach((p) => permSet.add(p))
          const roleFromCol = u.role ? [String(u.role)] : []
          const rolesFromPerms = permsList.filter((p) => !p.endsWith('.access'))
          const rolesList = Array.from(new Set([...roleFromCol, ...rolesFromPerms].filter(Boolean)))
          rolesList.forEach((r) => roleSet.add(r))
          const Name = u.family_name || ''
          const Forname = u.forname || ''
          const display = u.display_name || `${Forname} ${Name}`.trim()
          return {
            id: u.user_id,
            Mail: u.email || '',
            Name: Name || display || '',
            Forname: Forname || '',
            rolesList,
            permsList,
            role: u.role,
            classe: u.classe,
            is_active: u.is_active,
            initialAccess: { status: 'pending', attemptCount: 0 }
          }
        })

        try {
          const initialAccessStates = await loadInitialAccessStates()
          const statesByUser = new Map(initialAccessStates.map((state) => [state.userId, state]))
          this.utilisateurs = this.utilisateurs.map((user) => ({
            ...user,
            initialAccess: statesByUser.get(user.id) || user.initialAccess
          }))
        } catch {
          this.toast.add({
            severity: 'warn',
            summary: 'Suivi indisponible',
            detail:
              'Les utilisateurs restent visibles, mais les états de premier accès ne sont pas à jour.',
            life: 5000
          })
        }

        this.availableRoles = Array.from(roleSet).sort()
        this.availablePermissions = Array.from(permSet).sort()
      } catch (error) {
        console.error('Erreur de récupération des données', error)
        this.toast.add({
          severity: 'error',
          summary: 'Erreur de chargement',
          detail: 'Impossible de charger les utilisateurs.',
          life: 3000
        })
      } finally {
        this.loading = false
      }
    },
    async deleteUser(userId) {
      // Confirmation de suppression
      const confirmed = confirm(
        '⚠️ ATTENTION : Voulez-vous vraiment supprimer cet utilisateur ?\n\nCela supprimera :\n- Son profil utilisateur\n- Toutes ses données associées\n\nCette action est IRRÉVERSIBLE !'
      )

      if (!confirmed) return

      try {
        await apiClient.delete(`/admin/users/${encodeURIComponent(userId)}`)
        await nextTick()
        await new Promise((resolve) => setTimeout(resolve, 100))
        await this.fetchUsers()
        this.toast.add({
          severity: 'success',
          summary: 'Utilisateur supprimé',
          detail: "L'utilisateur a été complètement supprimé.",
          life: 4000
        })
      } catch (error) {
        console.error('Erreur lors de la suppression:', error)
        this.toast.add({
          severity: 'error',
          summary: 'Erreur de suppression',
          detail: error.message || "Impossible de supprimer l'utilisateur.",
          life: 5000
        })
      }
    },
    goToUserFormModif(userId) {
      this.$router.push({ name: 'NewUserFormModif', params: { userId } })
    },
    canSendInitialAccess(user) {
      return canRequestInitialAccess(user)
    },
    initialAccessView(user) {
      return initialAccessPresentation(user.initialAccess)
    },
    formatAccessDate(value) {
      return new Intl.DateTimeFormat('fr-CH', {
        dateStyle: 'short',
        timeStyle: 'short'
      }).format(new Date(value))
    },
    async requestInitialAccess(user) {
      const presentation = this.initialAccessView(user)
      const confirmed = confirm(
        `${presentation.action} à ${user.Forname} ${user.Name} ?\n\nUn lien individuel valable une heure sera envoyé à l’adresse vérifiée du compte.`
      )
      if (!confirmed) return

      this.initialAccessLoading[user.id] = true
      try {
        user.initialAccess = await sendInitialAccess(user.id)
        this.toast.add({
          severity: 'success',
          summary: 'Accès initial envoyé',
          detail:
            'Le lien sécurisé est valable une heure. Toute relance invalide le lien précédent.',
          life: 5000
        })
      } catch (error) {
        this.toast.add({
          severity: 'error',
          summary: 'Échec de l’envoi',
          detail: error.message || 'L’accès initial n’a pas pu être envoyé.',
          life: 5000
        })
      } finally {
        this.initialAccessLoading[user.id] = false
      }
    },
    goToAdminDashboard() {
      this.$router.push({ name: 'DashboardAdmin' })
    },
    clearFilter() {
      this.filters = {}
      this.globalFilter = ''
    }
  }
}
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
  padding: 0.75rem 1rem;
}
.is-compact :deep(.p-datatable .p-datatable-thead > tr > th) {
  padding: 0.5rem 0.75rem;
}
.is-compact :deep(.p-datatable .p-datatable-tbody > tr > td) {
  padding: 0.5rem 0.75rem;
  font-size: 0.95rem;
}
.is-compact :deep(.p-inputtext),
.is-compact :deep(.p-dropdown),
.is-compact :deep(.p-button) {
  height: 2.5rem;
}

.initial-access-cell {
  display: flex;
  min-width: 11rem;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
}

@media (max-width: 768px) {
  .user-list-page {
    padding: 1rem;
    padding-bottom: 6rem;
  }
}
</style>
