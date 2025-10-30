<template>
  <AdminLayout>
      <div v-if="loading" class="flex flex-column align-items-center justify-content-center p-8">
        <ProgressSpinner />
        <p class="mt-3 text-600">Chargement du tableau de bord...</p>
      </div>

      <div v-else class="p-4 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="surface-card p-4 border-round shadow-2 mb-4 border-left-3 border-primary">
          <div class="flex justify-content-between align-items-center">
            <div class="flex align-items-center gap-3">
              <i class="pi pi-cog text-primary text-3xl"></i>
              <div>
                <h1 class="text-2xl font-bold text-900 m-0">Admin Général</h1>
                <p class="text-600 m-0 mt-1">Tableau de bord administration générale</p>
              </div>
            </div>
            
            <Button 
              icon="pi pi-refresh" 
              label="Actualiser" 
              @click="loadDashboardData"
              :loading="refreshing"
              class="p-button-primary"
            />
          </div>
        </div>

        <!-- Statistics Overview -->
        <div class="grid mb-4">
          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card p-4 border-round shadow-2 hover:shadow-4 transition-all transition-duration-300">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-blue-100 border-circle">
                  <i class="pi pi-users text-blue-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.users || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Utilisateurs</p>
                  <span class="text-sm text-500">Total système</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card p-4 border-round shadow-2 hover:shadow-4 transition-all transition-duration-300">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-green-100 border-circle">
                  <i class="pi pi-lock text-green-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.roles || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Rôles</p>
                  <span class="text-sm text-500">Configurés</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card p-4 border-round shadow-2 hover:shadow-4 transition-all transition-duration-300">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-orange-100 border-circle">
                  <i class="pi pi-sitemap text-orange-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.routes || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Routes</p>
                  <span class="text-sm text-500">Dans le système</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card p-4 border-round shadow-2 hover:shadow-4 transition-all transition-duration-300">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-purple-100 border-circle">
                  <i class="pi pi-key text-purple-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.permissions || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Permissions</p>
                  <span class="text-sm text-500">Actives</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-900 mb-3">Actions Rapides</h2>
          <div class="grid">
            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/role-management')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-blue-100 border-circle mb-3">
                  <i class="pi pi-user-edit text-blue-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Gestion des Rôles</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Configurer les rôles et permissions</p>
              </div>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/router-inspector')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-orange-100 border-circle mb-3">
                  <i class="pi pi-sitemap text-orange-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Routes & Accès</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Voir toutes les routes du système</p>
              </div>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/admin/users')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-green-100 border-circle mb-3">
                  <i class="pi pi-users text-green-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Utilisateurs</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Gérer les utilisateurs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from './layouts/AdminLayout.vue'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const loading = ref(true)
const refreshing = ref(false)
const stats = ref({
  users: 0,
  roles: 10,
  routes: 0,
  permissions: 11
})

const loadDashboardData = async () => {
  refreshing.value = true
  // Simuler chargement
  setTimeout(() => {
    refreshing.value = false
  }, 500)
}

const navigateTo = (path) => {
  router.push(path)
}

onMounted(() => {
  loading.value = false
})
</script>