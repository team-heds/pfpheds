<template>
  <AdminLayout>
    <template #header>
      <PageHeader title="Enseignants SI" subtitle="Utilisateurs avec le rôle EnseignantSoins" icon="pi pi-user-edit" />
    </template>

    <div class="teachers-page">
      <div class="surface-card p-3 border-round shadow-2 mb-3">
        <div class="flex align-items-center gap-2">
          <i class="pi pi-search"></i>
          <InputText v-model="search" placeholder="Rechercher (nom, email)" class="w-full" />
          <span class="ml-auto text-600">Total: {{ filteredUsers.length }}</span>
        </div>
      </div>

      <div class="surface-card p-3 border-round shadow-2">
        <DataTable :value="filteredUsers" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="15">
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucun enseignant trouvé avec le rôle EnseignantSoins</p>
            </div>
          </template>
          <Column field="displayName" header="Nom" sortable>
            <template #body="{ data }">
              <span>{{ data.displayName || data.name || '-' }}</span>
            </template>
          </Column>
          <Column field="email" header="Email" sortable></Column>
          <Column field="classe" header="Classe" sortable>
            <template #body="{ data }">
              <Tag :value="data.classe || data.class || '-'" />
            </template>
          </Column>
          <Column field="house" header="Maison" sortable></Column>
          <Column header="Rôles">
            <template #body="{ data }">
              <div class="flex gap-1 flex-wrap">
                <Tag v-for="r in data.rolesList" :key="r" :value="r" :severity="r === 'EnseignantSoins' ? 'success' : 'info'" />
              </div>
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getDatabase, ref as dbRef, get } from 'firebase/database'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import PageHeader from '@/components/admin/common/PageHeader.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'

const loading = ref(false)
const search = ref('')
const users = ref([])

const normalizeRoles = (u) => {
  const rolesObj = u.Roles || u.roles || {}
  const perms = u.permissions || u.Permissions || []
  const list = new Set()
  // Roles legacy object { roleName: true }
  Object.keys(rolesObj || {}).forEach(k => { if (rolesObj[k]) list.add(k) })
  // Permissions array
  if (Array.isArray(perms)) perms.forEach(p => list.add(p))
  return Array.from(list)
}

const filteredUsers = computed(() => {
  const term = search.value.trim().toLowerCase()
  return users.value
    .filter(u => u.rolesList.includes('EnseignantSoins'))
    .filter(u => {
      if (!term) return true
      return (
        (u.displayName && u.displayName.toLowerCase().includes(term)) ||
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.email && u.email.toLowerCase().includes(term))
      )
    })
})

onMounted(async () => {
  loading.value = true
  try {
    const db = getDatabase()
    const snap = await get(dbRef(db, '/Users'))
    const raw = snap.exists() ? snap.val() : {}
    const list = Object.entries(raw).map(([id, u]) => ({
      id,
      email: u.email || u.Email || '-',
      displayName: u.displayName || `${u.Prenom || ''} ${u.Nom || ''}`.trim() || '-',
      house: u.house || u.House || '-',
      classe: u.classe || u.Classe || u.class || '-',
      rolesList: normalizeRoles(u),
      ...u,
    }))
    users.value = list
  } catch (e) {
    // soft-fail, keep empty list
    console.error('Erreur chargement utilisateurs:', e)
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.teachers-page { min-height: calc(100vh - 100px); }
</style>
