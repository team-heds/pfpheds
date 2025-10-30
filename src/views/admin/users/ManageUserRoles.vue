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
          @rowDblclick="onOpenDialog"
        >
          <Column field="display_name" header="Nom" sortable></Column>
          <Column field="email" header="Email" sortable></Column>
          <Column header="Rôle" sortable>
            <template #body="{ data }">
              <Tag :value="data.role || 'user'" :severity="roleSeverity(data.role)" />
            </template>
          </Column>
          <Column header="Actif" sortable>
            <template #body="{ data }">
              <Tag :value="data.is_active ? 'Actif' : 'Inactif'" :severity="data.is_active ? 'success' : 'warning'" />
            </template>
          </Column>
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
import Tag from 'primevue/tag'
import Dialog from 'primevue/dialog'

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
  'RMSoins': false
})
const permissionKeys = Object.keys(permissions.value)

function roleSeverity(r) {
  if (r === 'admin') return 'danger'
  if (!r || r === 'user') return 'info'
  return 'secondary'
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

function onOpenDialog(e) {
  const u = e?.data || e
  hydrateForm(u)
  // Si le champ permissions n'est pas présent sur la ligne, tenter une RPC pour récupérer les permissions depuis auth.metadata
  if (!Array.isArray(u.permissions)) {
    fetchUserPermissions(u.user_id)
  }
  editorVisible.value = true
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
    if (hasPermissionsColumn.value) {
      payload.permissions = Object.keys(permissions.value).filter(k => permissions.value[k])
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
        // Facultatif: si tu as une Edge Function/RPC admin pour MAJ metadata, on peut l'appeler ici
      } else {
        updateError = e
      }
    }
    if (updateError) throw updateError
    const idx = users.value.findIndex(u => u.user_id === form.value.user_id)
    if (idx !== -1) users.value[idx] = { ...users.value[idx], ...payload }
  } catch (e) {
    console.error('save error', e)
  } finally {
    saving.value = false
    if (!saving.value) editorVisible.value = false
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
</style>
