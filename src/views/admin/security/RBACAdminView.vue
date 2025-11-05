<template>
  <AdminLayout>
    <template #header>
      <PageHeader title="RBAC: Rôles & Permissions" subtitle="Gérer les rôles, permissions et attributions" icon="pi pi-shield" />
    </template>

    <div class="rbac-admin">
      <div class="grid">
        <div class="col">
          <Panel header="Permissions">
            <div class="toolbar">
              <InputText v-model="newPerm.slug" placeholder="permission ex: page1.access" />
              <InputText v-model="newPerm.description" placeholder="description" />
              <Button label="Ajouter" icon="pi pi-plus" @click="createPermission" :disabled="!newPerm.slug" />
            </div>
            <DataTable :value="permissions" dataKey="slug" :loading="loading">
              <Column field="slug" header="Permission" />
              <Column field="description" header="Description" />
              <Column header="Actions" style="width: 120px">
                <template #body="slotProps">
                  <Button icon="pi pi-trash" text @click="deletePermission(slotProps.data)" />
                </template>
              </Column>
            </DataTable>
          </Panel>
        </div>
        <div class="col">
          <Panel header="Rôles">
            <div class="toolbar">
              <InputText v-model="newRole.slug" placeholder="nom ex: admin" />
              <InputText v-model="newRole.label" placeholder="label" />
              <Button label="Ajouter" icon="pi pi-plus" @click="createRole" :disabled="!newRole.slug" />
            </div>
            <DataTable :value="roles" dataKey="slug" :loading="loading">
              <Column field="slug" header="Rôle" />
              <Column field="label" header="Label" />
              <Column header="Actions" style="width: 120px">
                <template #body="slotProps">
                  <Button icon="pi pi-trash" text @click="deleteRole(slotProps.data)" />
                </template>
              </Column>
            </DataTable>
          </Panel>
        </div>
      </div>

      <Panel header="Attribution: Permissions d'un rôle" class="mt-4">
        <div class="assign">
          <Dropdown v-model="selectedRoleId" :options="roles" optionLabel="slug" optionValue="id" placeholder="Choisir un rôle" style="min-width: 240px"/>
          <div v-if="selectedRoleId" class="dual-list">
            <div class="list">
              <h4>Permissions disponibles</h4>
              <div class="items">
                <div v-for="p in availablePerms" :key="p.slug" class="item">
                  <span>{{ p.slug }}</span>
                  <Button icon="pi pi-angle-right" text @click="attachPermToRole(p.slug)" />
                </div>
              </div>
            </div>
            <div class="list">
              <h4>Permissions du rôle</h4>
              <div class="items">
                <div v-for="p in rolePerms" :key="`${p.role_id}-${p.permission_slug}`" class="item">
                  <Button icon="pi pi-times" text @click="detachPermFromRole(p.role_id, p.permission_slug)" />
                  <span>{{ p.permission_slug }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      <Panel header="Attribution: Rôles d'un utilisateur" class="mt-4">
        <div class="assign">
          <InputText v-model="selectedUserId" placeholder="User UUID" style="min-width: 300px" />
          <div v-if="selectedUserId" class="dual-list">
            <div class="list">
              <h4>Rôles disponibles</h4>
              <div class="items">
                <div v-for="r in availableRolesForUser" :key="r.id" class="item">
                  <span>{{ r.slug }}</span>
                  <Button icon="pi pi-angle-right" text @click="attachRoleToUser(r.id)" />
                </div>
              </div>
            </div>
            <div class="list">
              <h4>Rôles de l'utilisateur</h4>
              <div class="items">
                <div v-for="r in userRoles" :key="`${r.user_id}-${r.role_id}`" class="item">
                  <Button icon="pi pi-times" text @click="detachRoleFromUser(r.user_id, r.role_id)" />
                  <span>{{ roleNameById(r.role_id) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import PageHeader from '@/components/admin/common/PageHeader.vue';
import { supabase } from '@/supabase';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const loading = ref(false);

const permissions = ref([]);
const roles = ref([]);
const rolePermissions = ref([]); // rows: { role_id, permission_slug }

const newPerm = ref({ slug: '', description: '' });
const newRole = ref({ slug: '', label: '' });

const selectedRoleId = ref(null);
const selectedUserId = ref('');
const userRoles = ref([]); // rows: { user_id, role_id }

const roleNameById = (id) => roles.value.find(r => r.id === id)?.slug || id;

const fetchAll = async () => {
  loading.value = true;
  try {
    const [{ data: perms }, { data: rs }, { data: rps }] = await Promise.all([
      supabase.from('permissions').select('*').order('slug'),
      supabase.from('roles').select('*').order('slug'),
      supabase.from('role_permissions').select('*')
    ]);
    permissions.value = perms || [];
    roles.value = rs || [];
    rolePermissions.value = rps || [];
  } catch (e) {
    console.error(e);
    toast.add({ severity: 'error', summary: 'Erreur chargement', detail: e.message, life: 4000 });
  } finally {
    loading.value = false;
  }
};

const createPermission = async () => {
  const payload = { slug: newPerm.value.slug.trim(), description: newPerm.value.description?.trim() || null };
  if (!payload.slug) return;
  const { error } = await supabase.from('permissions').insert(payload);
  if (error) return toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 4000 });
  newPerm.value = { slug: '', description: '' };
  await fetchAll();
  toast.add({ severity: 'success', summary: 'Ajouté', detail: 'Permission créée', life: 2000 });
};

const deletePermission = async (row) => {
  const { error } = await supabase.from('permissions').delete().eq('slug', row.slug);
  if (error) return toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 4000 });
  await fetchAll();
  toast.add({ severity: 'success', summary: 'Supprimée', detail: 'Permission supprimée', life: 2000 });
};

const createRole = async () => {
  const payload = { slug: newRole.value.slug.trim(), label: newRole.value.label?.trim() || null };
  if (!payload.slug) return;
  const { error } = await supabase.from('roles').insert(payload);
  if (error) return toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 4000 });
  newRole.value = { slug: '', label: '' };
  await fetchAll();
  toast.add({ severity: 'success', summary: 'Ajouté', detail: 'Rôle créé', life: 2000 });
};

const deleteRole = async (row) => {
  const { error } = await supabase.from('roles').delete().eq('slug', row.slug);
  if (error) return toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 4000 });
  await fetchAll();
  toast.add({ severity: 'success', summary: 'Supprimé', detail: 'Rôle supprimé', life: 2000 });
};

const rolePerms = computed(() => {
  if (!selectedRoleId.value) return [];
  const links = rolePermissions.value.filter(rp => rp.role_id === selectedRoleId.value);
  return links.map(link => ({
    role_id: link.role_id,
    permission_slug: link.permission_slug
  }));
});

const availablePerms = computed(() => {
  const used = new Set(rolePerms.value.map(x => x.permission_slug));
  return permissions.value.filter(p => !used.has(p.slug));
});

const attachPermToRole = async (permSlug) => {
  if (!selectedRoleId.value) return;
  const payload = { role_id: selectedRoleId.value, permission_slug: permSlug };
  const { error } = await supabase.from('role_permissions').insert(payload);
  if (error) return toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 4000 });
  await fetchAll();
};

const detachPermFromRole = async (roleId, permSlug) => {
  const { error } = await supabase.from('role_permissions').delete().match({ role_id: roleId, permission_slug: permSlug });
  if (error) return toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 4000 });
  await fetchAll();
};

watch(selectedRoleId, async () => {
  // Refresh when role changes to keep right panel in sync
  await fetchAll();
});

// User role assignment
const availableRolesForUser = computed(() => {
  const used = new Set(userRoles.value.map(x => x.role_id));
  return roles.value.filter(r => !used.has(r.id));
});

const fetchUserRoles = async () => {
  userRoles.value = [];
  if (!selectedUserId.value) return;
  const { data, error } = await supabase.from('user_roles').select('*').eq('user_id', selectedUserId.value);
  if (error) return toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 4000 });
  userRoles.value = data || [];
};

watch(selectedUserId, fetchUserRoles);

const attachRoleToUser = async (roleId) => {
  if (!selectedUserId.value) return;
  const payload = { user_id: selectedUserId.value, role_id: roleId };
  const { error } = await supabase.from('user_roles').insert(payload);
  if (error) return toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 4000 });
  await fetchUserRoles();
};

const detachRoleFromUser = async (userId, roleId) => {
  const { error } = await supabase.from('user_roles').delete().match({ user_id: userId, role_id: roleId });
  if (error) return toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 4000 });
  await fetchUserRoles();
};

onMounted(async () => {
  await fetchAll();
});
</script>

<style scoped>
.rbac-admin {
  padding: 1rem 1.5rem;
}
.grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}
.col { min-width: 0; }
.toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
}
.assign {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}
.dual-list {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  width: 100%;
}
.list {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 0.75rem;
}
.items { display: flex; flex-direction: column; gap: 0.5rem; }
.item { display: flex; align-items: center; gap: 0.5rem; }
.mt-4 { margin-top: 1.5rem; }
</style>
