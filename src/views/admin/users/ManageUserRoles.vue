<template>
  <AdminLayout>
    <template #header>
      <PageHeader title="Gestion des rôles utilisateurs" subtitle="Modifier le rôle et l'état des autres utilisateurs" icon="pi pi-users" />
    </template>

    <div class="page">
      <div class="card surface-card border-round shadow-2">
        <div class="flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
          <div class="flex align-items-center gap-2">
            <IconField iconPosition="left">
              <InputIcon class="pi pi-search" />
              <InputText v-model="search" placeholder="Rechercher nom/email" class="w-16rem" />
            </IconField>
            <Dropdown v-model="roleFilter" :options="roleOptions" placeholder="Filtrer par rôle" showClear class="w-14rem" />
            <Dropdown v-model="activeFilter" :options="activeOptions" optionLabel="label" optionValue="value" placeholder="Actif ?" showClear class="w-10rem" />
          </div>
          <div class="text-color-secondary">{{ filteredUsers.length }} utilisateur(s)</div>
        </div>

        <DataTable
          :value="filteredUsers"
          :loading="loading"
          dataKey="user_id"
          :paginator="true"
          :rows="12"
          :rowHover="true"
          :scrollable="true"
          scrollHeight="60vh"
          scrollDirection="both"
          tableStyle="min-width: 1200px"
          :style="{ '--frozen-left-width': '780px' }"
          @rowDblclick="onOpenDialog"
        >
          <Column field="display_name" header="Nom" sortable frozen alignFrozen="left" style="min-width: 220px"></Column>
          <Column field="email" header="Email" sortable frozen alignFrozen="left" style="min-width: 260px"></Column>
          <Column header="Rôle" sortable frozen alignFrozen="left" style="min-width: 180px">
            <template #body="{ data }">
              <Dropdown v-model="data.role" :options="roleOptions" class="w-12rem" @change="updateRole(data, data.role)" />
            </template>
          </Column>
          <Column header="Actif" sortable frozen alignFrozen="left" style="min-width: 120px; text-align:center;">
            <template #body="{ data }">
              <input type="checkbox" :checked="data.is_active" @change="updateActive(data, $event.target.checked)" />
            </template>
          </Column>
          <template v-if="hasPermissionsColumn">
            <Column
              v-for="key in permissionKeys"
              :key="'perm-col-'+key"
              :header="key"
            >
              <template #body="{ data }">
                <input type="checkbox" :checked="rowHasPerm(data, key)" @change="togglePerm(data, key, $event.target.checked)" />
              </template>
            </Column>
          </template>
          <Column header="Actions">
            <template #body="{ data }">
              <Button label="Éditer" size="small" @click="onOpenDialog({ data })" />
            </template>
          </Column>
        </DataTable>
      </div>

      <Dialog v-model:visible="editorVisible" :modal="true" header="Éditer l'utilisateur" class="w-30rem">
        <div v-if="form.user_id" class="form-grid grid">
          <div class="col-12">
            <div class="mb-2 text-color-secondary">ID: {{ form.user_id }}</div>
          </div>
          <div class="col-12">
            <label class="block mb-2">Email</label>
            <InputText v-model="form.email" class="w-full" disabled />
          </div>
          <div class="col-12">
            <label class="block mb-2">Nom affiché</label>
            <InputText v-model="form.display_name" class="w-full" />
          </div>
          <div class="col-6">
            <label class="block mb-2">Prénom</label>
            <InputText v-model="form.forname" class="w-full" />
          </div>
          <div class="col-6">
            <label class="block mb-2">Nom</label>
            <InputText v-model="form.family_name" class="w-full" />
          </div>
          <div class="col-12">
            <label class="block mb-2">Rôle</label>
            <Dropdown v-model="form.role" :options="roleOptions" placeholder="Choisir un rôle" class="w-full mb-2" />
            <div class="quick-roles flex flex-wrap gap-2">
              <Button v-for="r in quickRoles" :key="r" size="small" outlined :label="r" @click="form.role = r" />
            </div>
          </div>
          <div class="col-12">
            <div class="flex align-items-center gap-2">
              <input id="active" type="checkbox" v-model="form.is_active" />
              <label for="active">Actif</label>
            </div>
          </div>

          <!-- Rôles par Filière (SI/PHY) -->
          <div class="col-12">
            <h4 class="mt-3 mb-2">Rôles par Filière</h4>
            <div class="track-roles-section">
              <!-- Liste des rôles existants -->
              <div v-if="userTrackRoles.length > 0" class="track-roles-list mb-3">
                <div v-for="tr in userTrackRoles" :key="tr.id" class="track-role-item">
                  <Tag :value="tr.track_id" :severity="tr.track_id === 'SI' ? 'info' : 'success'" />
                  <Tag :value="getTrackRoleLabel(tr.role)" severity="secondary" class="ml-2" />
                  <Button icon="pi pi-times" class="p-button-rounded p-button-text p-button-danger p-button-sm ml-2" @click="deleteTrackRole(tr.id)" />
                </div>
              </div>
              <div v-else class="text-500 text-sm mb-3">Aucun rôle par filière</div>
              
              <!-- Ajouter un rôle -->
              <div class="add-track-role flex gap-2 align-items-end">
                <div class="flex-1">
                  <label class="block mb-1 text-sm">Filière</label>
                  <Dropdown v-model="newTrackRole.trackId" :options="trackOptions" optionLabel="label" optionValue="value" placeholder="Choisir" class="w-full" />
                </div>
                <div class="flex-1">
                  <label class="block mb-1 text-sm">Rôle</label>
                  <Dropdown v-model="newTrackRole.role" :options="trackRoleOptions" optionLabel="label" optionValue="value" placeholder="Choisir" class="w-full" />
                </div>
                <Button icon="pi pi-plus" label="Ajouter" size="small" @click="addTrackRole" :disabled="!newTrackRole.trackId || !newTrackRole.role" />
              </div>
            </div>
          </div>

          <div class="col-12" v-if="hasPermissionsColumn">
            <h4 class="mt-3">Permissions</h4>
            <div class="permissions-grid">
              <div class="perm-item" v-for="key in permissionKeys" :key="key">
                <div class="permission-info">
                  <span class="permission-label">{{ key }}</span>
                </div>
                <div class="permission-toggle">
                  <input type="checkbox" :id="'perm-'+key" v-model="permissions[key]" />
                  <label :for="'perm-'+key" class="toggle-label"></label>
                </div>
              </div>
            </div>
          </div>
        </div>
        <template #footer>
          <div class="flex gap-2">
            <Button label="Annuler" class="p-button-secondary" @click="onCloseDialog" :disabled="saving" />
            <Button label="Sauvegarder" icon="pi pi-save" :loading="saving" @click="save" />
          </div>
        </template>
      </Dialog>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import { supabase } from '@/supabase'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import Tag from 'primevue/tag'
import { assignTrackRole, removeTrackRole } from '@/service/adminDashboardService'
import { useAuthStore } from '@/stores/authStore'

const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const users = ref([])
const search = ref('')
const roleFilter = ref(null)
const activeFilter = ref(null)
const editorVisible = ref(false)
const hasPermissionsColumn = ref(false)

const roleOptions = [
  'user',
  'admin',
  'AdminSoins',
  'AdminPhysio',
  'EnseignantSoins',
  'EnseignantPhysio',
  'EtudiantSoins',
  'EtudiantPhysio',
  'RMSoins'
]

const activeOptions = [
  { label: 'Actifs', value: true },
  { label: 'Inactifs', value: false }
]

// Options filières et rôles
const trackOptions = [
  { label: 'Soins Infirmiers', value: 'SI' },
  { label: 'Physiothérapie', value: 'PHY' }
]

const trackRoleOptions = [
  { label: 'Administrateur', value: 'ADMIN' },
  { label: 'Responsable Module', value: 'RM' },
  { label: 'Enseignant', value: 'TEACHER' },
  { label: 'Secrétariat', value: 'SECRETARIAT' }
]

const quickRoles = roleOptions

const filteredUsers = computed(() => {
  const term = search.value.trim().toLowerCase()
  return users.value.filter(u => {
    const okSearch = !term || (u.display_name || '').toLowerCase().includes(term) || (u.email || '').toLowerCase().includes(term)
    const okRole = !roleFilter.value || u.role === roleFilter.value
    const okActive = activeFilter.value === null || u.is_active === activeFilter.value
    return okSearch && okRole && okActive
  })
})

const form = ref({ user_id: null, email: '', display_name: '', forname: '', family_name: '', role: 'user', is_active: true })

// Rôles par filière de l'utilisateur en édition
const userTrackRoles = ref([])
const newTrackRole = ref({ trackId: null, role: null })
const permissions = ref({
  'page1.access': false,
  'page2.access': false,
  'super.all': false,
  'admin': false,
  'AdminSoins': false,
  'AdminPhysio': false,
  'EnseignantSoins': false,
  'EnseignantPhysio': false,
  'EtudiantSoins': false,
  'EtudiantPhysio': false,
  'RMSoins': false,
  'BA24-PHY': false,
  'BA23-PHY': false,
  'BA25-PHY': false,
  'B25-SI': false,
  'B24-SI': false,
  'B23-SI': false
})
const permissionKeys = Object.keys(permissions.value)

async function updateRole(u, role) {
  const prev = u.role
  u.role = role
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role, updated_at: new Date().toISOString() })
      .eq('user_id', u.user_id)
    if (error) throw error
  } catch (e) {
    u.role = prev
    alert('Erreur mise à jour rôle: ' + (e.message || ''))
  }
}

async function updateActive(u, val) {
  const prev = u.is_active
  u.is_active = val
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_active: val, updated_at: new Date().toISOString() })
      .eq('user_id', u.user_id)
    if (error) throw error
  } catch (e) {
    u.is_active = prev
    alert('Erreur mise à jour actif: ' + (e.message || ''))
  }
}

function rowHasPerm(u, key) {
  const arr = Array.isArray(u.permissions) ? u.permissions : []
  return arr.includes(key)
}

async function togglePerm(u, key, checked) {
  if (!hasPermissionsColumn.value) return
  const prev = Array.isArray(u.permissions) ? [...u.permissions] : []
  const next = [...prev]
  const idx = next.indexOf(key)
  if (checked && idx === -1) next.push(key)
  if (!checked && idx !== -1) next.splice(idx, 1)
  u.permissions = next
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ permissions: next, updated_at: new Date().toISOString() })
      .eq('user_id', u.user_id)
    if (error) throw error
    const { error: rpcError } = await supabase.rpc('update_user_permissions', {
      target_user_id: u.user_id,
      new_permissions: next
    })
    if (rpcError) console.warn('RPC update_user_permissions', rpcError)
  } catch (e) {
    u.permissions = prev
    alert('Erreur mise à jour permissions: ' + (e.message || ''))
  }
}

function hydrateForm(u) {
  form.value = {
    user_id: u.user_id,
    email: u.email || '',
    display_name: u.display_name || '',
    forname: u.forname || '',
    family_name: u.family_name || '',
    role: u.role || 'user',
    is_active: !!u.is_active
  }
  // Permissions: charger et normaliser
  const normalize = (p) => {
    if (!p || typeof p !== 'string') return p
    if (p === 'page1') return 'page1.access'
    if (p === 'page2') return 'page2.access'
    if (p.endsWith('.access')) {
      const base = p.slice(0, -7)
      const prefixes = ['Admin', 'Enseignant', 'Etudiant', 'RM']
      if (prefixes.some(pr => base.startsWith(pr))) return base
    }
    return p
  }
  const arr = Array.isArray(u.permissions) ? u.permissions.map(normalize) : []
  Object.keys(permissions.value).forEach(k => { permissions.value[k] = false })
  arr.forEach(k => { if (k in permissions.value) permissions.value[k] = true })
}


async function loadUsers() {
  loading.value = true
  try {
    let dataRes = []
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('user_id,email,display_name,forname,family_name,role,is_active,permissions')
        .order('display_name', { ascending: true })
      if (error) throw error
      dataRes = data || []
      hasPermissionsColumn.value = true
    } catch (e) {
      if (e?.code === '42703' || /column\s+.*permissions.*\s+does not exist/i.test(e?.message || '')) {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('user_id,email,display_name,forname,family_name,role,is_active')
          .order('display_name', { ascending: true })
        if (error) throw error
        dataRes = data || []
        hasPermissionsColumn.value = false
      } else {
        throw e
      }
    }
    users.value = dataRes
  } catch (e) {
    console.error('loadUsers error', e)
  } finally {
    loading.value = false
  }
}

async function onOpenDialog(e) {
  const u = e?.data || e
  hydrateForm(u)
  // Si le champ permissions n'est pas présent sur la ligne, tenter une RPC pour récupérer les permissions depuis auth.metadata
  if (!Array.isArray(u.permissions)) {
    fetchUserPermissions(u.user_id)
  }
  // Charger les rôles par filière
  await loadUserTrackRoles(u.user_id)
  editorVisible.value = true
}

// Charger les rôles par filière d'un utilisateur
async function loadUserTrackRoles(userId) {
  try {
    const { data, error } = await supabase
      .from('user_track_roles')
      .select('id, track_id, role, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (error) throw error
    userTrackRoles.value = data || []
  } catch (e) {
    console.warn('Erreur chargement rôles filière:', e)
    userTrackRoles.value = []
  }
}

// Ajouter un rôle par filière
async function addTrackRole() {
  if (!newTrackRole.value.trackId || !newTrackRole.value.role || !form.value.user_id) return
  
  const result = await assignTrackRole(
    form.value.user_id,
    newTrackRole.value.trackId,
    newTrackRole.value.role,
    authStore.user?.id
  )
  
  if (result.success) {
    await loadUserTrackRoles(form.value.user_id)
    newTrackRole.value = { trackId: null, role: null }
  } else {
    alert('Erreur: ' + result.message)
  }
}

// Supprimer un rôle par filière
async function deleteTrackRole(roleId) {
  const result = await removeTrackRole(roleId)
  if (result.success) {
    await loadUserTrackRoles(form.value.user_id)
  }
}

// Label du rôle
function getTrackRoleLabel(role) {
  const labels = { ADMIN: 'Admin', RM: 'RM', TEACHER: 'Enseignant', SECRETARIAT: 'Secrétariat' }
  return labels[role] || role
}

function onCloseDialog() {
  editorVisible.value = false
}

async function save() {
  if (!form.value.user_id) return
  saving.value = true
  try {
    const payload = {
      email: form.value.email,
      display_name: form.value.display_name,
      forname: form.value.forname,
      family_name: form.value.family_name,
      role: form.value.role,
      is_active: form.value.is_active,
      updated_at: new Date().toISOString()
    }
    
    const selectedPermissions = Object.keys(permissions.value).filter(k => permissions.value[k])
    
    if (hasPermissionsColumn.value) {
      payload.permissions = selectedPermissions
    }
    
    let updateError = null
    // Try update with permissions (if column exists)
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update(payload)
        .eq('user_id', form.value.user_id)
      if (error) throw error
    } catch (e) {
      // If column does not exist or PostgREST schema cache not reloaded, retry without permissions
      if (
        e?.code === '42703' ||
        e?.code === 'PGRST204' ||
        /schema cache/i.test(e?.message || '') ||
        /column\s+.*permissions.*\s+does not exist/i.test(e?.message || '')
      ) {
        const withoutPerms = { ...payload }
        delete withoutPerms.permissions
        const { error: e2 } = await supabase
          .from('user_profiles')
          .update(withoutPerms)
          .eq('user_id', form.value.user_id)
        if (e2) updateError = e2; else updateError = null
      } else {
        updateError = e
      }
    }
    
    if (updateError) throw updateError
    
    // Mettre à jour les permissions via RPC pour synchroniser avec auth.users
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc('update_user_permissions', {
        target_user_id: form.value.user_id,
        new_permissions: selectedPermissions
      })
      
      if (rpcError) {
        console.warn('Avertissement: Impossible de mettre à jour les permissions dans auth.users:', rpcError)
        // On continue même si la RPC échoue, car user_profiles a été mis à jour
      } else if (rpcData && !rpcData.success) {
        console.warn('Avertissement RPC:', rpcData.error)
      } else {
        console.log('✅ Permissions mises à jour avec succès dans user_profiles et auth.users')
      }
    } catch (rpcErr) {
      console.warn('Erreur lors de l\'appel RPC update_user_permissions:', rpcErr)
      // On continue même si la RPC échoue
    }
    
    // Mettre à jour la liste locale
    const idx = users.value.findIndex(u => u.user_id === form.value.user_id)
    if (idx !== -1) users.value[idx] = { ...users.value[idx], ...payload }
    
    // Fermer le dialog et afficher un message de succès
    editorVisible.value = false
    console.log('✅ Utilisateur mis à jour avec succès')
  } catch (e) {
    console.error('❌ Erreur lors de la sauvegarde:', e)
    alert('Erreur lors de la sauvegarde: ' + (e.message || 'Erreur inconnue'))
  } finally {
    saving.value = false
  }
}

// Récupération des permissions depuis auth metadata via RPC si disponible
async function fetchUserPermissions(uid) {
  try {
    const { data, error } = await supabase.rpc('get_user_permissions', { uid })
    if (error) throw error
    const normalize = (p) => {
      if (!p || typeof p !== 'string') return p
      if (p === 'page1') return 'page1.access'
      if (p === 'page2') return 'page2.access'
      if (p.endsWith('.access')) {
        const base = p.slice(0, -7)
        const prefixes = ['Admin', 'Enseignant', 'Etudiant', 'RM']
        if (prefixes.some(pr => base.startsWith(pr))) return base
      }
      return p
    }
    const arr = Array.isArray(data) ? data.map(normalize) : []
    Object.keys(permissions.value).forEach(k => { permissions.value[k] = false })
    arr.forEach(k => { if (k in permissions.value) permissions.value[k] = true })
  } catch (_) { /* ignore if RPC not available */ }
}

onMounted(loadUsers)
</script>

<style scoped>
.page { padding: 1rem; }
.card { background: var(--surface-card); border-radius: 1rem; padding: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.quick-roles .p-button { font-size: 0.8rem; }
.permissions-grid { display: grid; grid-template-columns: 1fr auto; row-gap: 0.75rem; align-items: center; margin-top: 0.5rem; }
.permission-label { font-weight: 600; }
.permission-toggle { position: relative; }
.permission-toggle input[type="checkbox"] { opacity: 0; width: 0; height: 0; }
.toggle-label { position: relative; display: inline-block; width: 46px; height: 22px; background: var(--surface-border); border-radius: 22px; cursor: pointer; transition: background 0.2s; }
.toggle-label::after { content: ''; position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; background: white; border-radius: 50%; transition: transform 0.2s; }
.permission-toggle input[type="checkbox"]:checked + .toggle-label { background: var(--primary-color); }
.permission-toggle input[type="checkbox"]:checked + .toggle-label::after { transform: translateX(24px); }

/* Rôles par filière */
.track-roles-section {
  background: var(--surface-ground);
  border-radius: 0.5rem;
  padding: 1rem;
}
.track-roles-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.track-role-item {
  display: flex;
  align-items: center;
  padding: 0.5rem;
  background: var(--surface-card);
  border-radius: 0.25rem;
}
.add-track-role {
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}

/* Masquer le contenu (checkbox permissions) sous la zone gelée */
:deep(.p-datatable-scrollable .p-datatable-frozen-view) {
  background: var(--surface-card);
  z-index: 3;
}

:deep(.p-datatable-scrollable .p-datatable-unfrozen-view .p-datatable-wrapper) {
  position: relative;
}

/* Largeur cumulée des 4 colonnes gelées: 220 + 260 + 180 + 120 = 780px */
:deep(.p-datatable-scrollable .p-datatable-unfrozen-view .p-datatable-wrapper::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: var(--frozen-left-width, 780px);
  height: 100%;
  background: var(--surface-card);
  /* Option: gradient pour une transition douce */
  /* background: linear-gradient(90deg, var(--surface-card) 70%, transparent 100%); */
  z-index: 2;
  pointer-events: auto; /* bloque les clics sous la zone gelée */
}

/* S'assurer que le contenu défilant des permissions passe sous l'overlay */
:deep(.p-datatable-scrollable .p-datatable-unfrozen-view .p-datatable-scrollable-body) {
  position: relative;
  z-index: 1;
}

/* Overlay aussi pour l'en-tête non gelé */
:deep(.p-datatable-scrollable .p-datatable-unfrozen-view .p-datatable-scrollable-header-box) {
  position: relative;
}

:deep(.p-datatable-scrollable .p-datatable-unfrozen-view .p-datatable-scrollable-header-box::before) {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: var(--frozen-left-width, 780px);
  height: 100%;
  background: var(--surface-card);
  z-index: 2;
  pointer-events: auto; /* bloque les clics sous la zone gelée */
}

/* S'assurer que les cellules gelées recouvrent bien ce qui défile */
:deep(.p-datatable .p-frozen-column),
:deep(.p-datatable .p-datatable-tbody > tr > td[style*="position: sticky"]) {
  z-index: 4 !important;
  background: var(--surface-card) !important;
}
</style>
