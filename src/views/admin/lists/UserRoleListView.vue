<template>
  <AdminLayout>
    <div class="user-role-page p-4">
      <div class="surface-card p-4 border-round shadow-2 mb-4">
        <div class="flex align-items-center justify-content-between">
          <div class="flex align-items-center gap-3">
            <i class="pi pi-shield text-primary text-3xl"></i>
            <div>
              <h1 class="text-2xl font-bold text-900 m-0">Attribution des Rôles</h1>
              <p class="text-600 m-0 mt-1">Gestion des rôles utilisateurs</p>
            </div>
          </div>
          <Button icon="pi pi-refresh" label="Actualiser" @click="loadData" />
        </div>
      </div>

      <!-- Stats -->
      <div class="grid mb-4">
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Total Utilisateurs</div>
            <div class="text-2xl font-bold text-900">{{ stats.total }}</div>
          </div>
        </div>
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Rôles Actifs</div>
            <div class="text-2xl font-bold text-blue-500">{{ stats.roles }}</div>
          </div>
        </div>
        <div class="col-12 md:col-4">
          <div class="surface-card p-4 border-round shadow-2">
            <div class="text-600 mb-2">Admins</div>
            <div class="text-2xl font-bold text-green-500">{{ stats.admins }}</div>
          </div>
        </div>
      </div>

      <!-- Filtres -->
      <div class="surface-card p-3 border-round shadow-2 mb-4">
        <div class="grid">
          <div class="col-12 md:col-4">
            <Dropdown v-model="filterRole" :options="roles" placeholder="Tous les rôles" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-4">
            <Dropdown v-model="filterStatus" :options="statusOptions" placeholder="Tous les statuts" class="w-full" showClear />
          </div>
          <div class="col-12 md:col-4">
            <InputText v-model="searchQuery" placeholder="Rechercher..." class="w-full" />
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="surface-card p-4 border-round shadow-2">
        <DataTable :value="userList" :loading="loading" responsiveLayout="scroll" :paginator="true" :rows="15">
          <template #header>
            <span class="text-xl text-900 font-bold">Utilisateurs et Rôles</span>
          </template>
          <template #empty>
            <div class="text-center p-4">
              <i class="pi pi-inbox text-4xl text-400 mb-3"></i>
              <p class="text-600">Aucun utilisateur</p>
            </div>
          </template>
          <Column field="nom" header="Nom" sortable></Column>
          <Column field="prenom" header="Prénom" sortable></Column>
          <Column field="email" header="Email" sortable></Column>
          <Column field="role" header="Rôle" sortable>
            <template #body="slotProps">
              <Tag :value="slotProps.data.role" :severity="getRoleSeverity(slotProps.data.role)" />
            </template>
          </Column>
          <Column field="permissions" header="Permissions">
            <template #body="slotProps">
              <div class="flex gap-1">
                <Tag v-for="perm in slotProps.data.permissions" :key="perm" :value="perm" severity="info" class="text-xs" />
              </div>
            </template>
          </Column>
          <Column field="status" header="Statut">
            <template #body="slotProps">
              <Tag :value="slotProps.data.status" :severity="getStatusSeverity(slotProps.data.status)" />
            </template>
          </Column>
          <Column header="Actions">
            <template #body="slotProps">
              <Button icon="pi pi-pencil" class="p-button-text p-button-sm" severity="success" @click="editRole(slotProps.data)" />
            </template>
          </Column>
        </DataTable>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import InputText from 'primevue/inputtext'
import Tag from 'primevue/tag'
import Dropdown from 'primevue/dropdown'

const loading = ref(false)
const searchQuery = ref('')
const filterRole = ref(null)
const filterStatus = ref(null)
const userList = ref([])

const roles = ref(['Admin', 'Enseignant', 'Étudiant', 'Praticien'])
const statusOptions = ref(['Actif', 'Inactif'])

const stats = ref({
  total: 0,
  roles: 0,
  admins: 0
})

const getRoleSeverity = (role) => {
  const severities = {
    'Admin': 'danger',
    'Enseignant': 'success',
    'Étudiant': 'info',
    'Praticien': 'warning'
  }
  return severities[role] || 'secondary'
}

const getStatusSeverity = (status) => {
  return status === 'Actif' ? 'success' : 'secondary'
}

const editRole = (user) => {
  console.log('Edit role:', user)
}

const loadData = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 500)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.user-role-page {
  min-height: calc(100vh - 100px);
}
</style>
