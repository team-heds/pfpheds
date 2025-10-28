<template>
  <div>
    <Navbar />
    
    <div class="dashboard-layout">
      <AdminSidebar />
      <div class="dashboard-content">
      <div v-if="loading" class="flex flex-column align-items-center justify-content-center p-8">
        <ProgressSpinner />
        <p class="mt-3 text-600">Chargement du tableau de bord...</p>
      </div>

      <div v-else class="p-4 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="surface-card p-4 border-round shadow-2 mb-4 border-left-3 border-primary">
          <div class="flex justify-content-between align-items-center">
            <div class="flex align-items-center gap-3">
              <i class="pi pi-star-fill text-primary text-3xl"></i>
              <div>
                <h1 class="text-2xl font-bold text-900 m-0">Dashboard Gamification</h1>
                <p class="text-600 m-0 mt-1">Tableau de bord gamification et engagement</p>
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
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-orange-100 border-circle">
                  <i class="pi pi-trophy text-orange-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.challenges || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Défis Totaux</p>
                  <span class="text-sm text-500">{{ stats.challengesActive || 0 }} actifs</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card p-4 border-round shadow-2 hover:shadow-4 transition-all transition-duration-300">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-purple-100 border-circle">
                  <i class="pi pi-flag text-purple-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.quests || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Quêtes Totales</p>
                  <span class="text-sm text-500">{{ stats.questsActive || 0 }} actives</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card p-4 border-round shadow-2 hover:shadow-4 transition-all transition-duration-300">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-red-100 border-circle">
                  <i class="pi pi-star text-red-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.badges || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Badges Totaux</p>
                  <span class="text-sm text-500">{{ stats.badgesUnlocked || 0 }} débloqués</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card p-4 border-round shadow-2 hover:shadow-4 transition-all transition-duration-300">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-green-100 border-circle">
                  <i class="pi pi-users text-green-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.users || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Utilisateurs</p>
                  <span class="text-sm text-500">{{ stats.usersActive || 0 }} actifs</span>
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
                @click="navigateTo('/admin/gamification/challenges')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-orange-100 border-circle mb-3">
                  <i class="pi pi-trophy text-orange-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Gérer les Défis</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Créer, modifier et supprimer des défis</p>
              </div>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/admin/gamification/users')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-green-100 border-circle mb-3">
                  <i class="pi pi-users text-green-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Gérer les Utilisateurs</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Attribuer des rôles et gérer les permissions</p>
              </div>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/admin/gamification/houses')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-blue-100 border-circle mb-3">
                  <i class="pi pi-home text-blue-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Gérer les Maisons</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Points des maisons et statistiques</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import Navbar from '../common/utils/Navbar.vue'
import AdminSidebar from './lists/AdminSidebar.vue'
import Button from 'primevue/button'
import ProgressSpinner from 'primevue/progressspinner'

const router = useRouter()
const loading = ref(true)
const refreshing = ref(false)
const stats = ref({
  challenges: 0,
  challengesActive: 0,
  quests: 0,
  questsActive: 0,
  badges: 0,
  badgesUnlocked: 0,
  users: 0,
  usersActive: 0
})

const loadDashboardData = async () => {
  refreshing.value = true
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

<style scoped>
.dashboard-layout {
  display: flex;
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--surface-ground);
  min-height: calc(100vh - 80px);
}

.dashboard-content {
  flex: 1;
  min-width: 0;
}
</style>
