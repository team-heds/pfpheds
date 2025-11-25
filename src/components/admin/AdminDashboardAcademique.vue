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
              <i class="pi pi-book text-primary text-3xl"></i>
              <div>
                <h1 class="text-2xl font-bold text-900 m-0">Dashboard Académique</h1>
                <p class="text-600 m-0 mt-1">Tableau de bord académique et enseignement</p>
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
                  <i class="pi pi-graduation-cap text-blue-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.enseignants || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Enseignants</p>
                  <span class="text-sm text-500">Total</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card p-4 border-round shadow-2 hover:shadow-4 transition-all transition-duration-300">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-green-100 border-circle">
                  <i class="pi pi-calendar text-green-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.cours || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Cours</p>
                  <span class="text-sm text-500">Planifiés</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card p-4 border-round shadow-2 hover:shadow-4 transition-all transition-duration-300">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-orange-100 border-circle">
                  <i class="pi pi-video text-orange-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.media || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Contenu Média</p>
                  <span class="text-sm text-500">Disponible</span>
                </div>
              </div>
            </div>
          </div>

          <div class="col-12 md:col-6 lg:col-3">
            <div class="surface-card p-4 border-round shadow-2 hover:shadow-4 transition-all transition-duration-300">
              <div class="flex align-items-center gap-3">
                <div class="flex align-items-center justify-content-center w-4rem h-4rem bg-purple-100 border-circle">
                  <i class="pi pi-th-large text-purple-500 text-2xl"></i>
                </div>
                <div class="flex-1">
                  <h3 class="text-2xl font-bold text-900 m-0">{{ stats.modules || 0 }}</h3>
                  <p class="text-600 font-medium m-0">Modules</p>
                  <span class="text-sm text-500">Actifs</span>
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
                @click="navigateTo('/admin/teachers-si')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-blue-100 border-circle mb-3">
                  <i class="pi pi-user-edit text-blue-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Enseignants SI</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Gérer les enseignants</p>
              </div>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/admin/planning')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-green-100 border-circle mb-3">
                  <i class="pi pi-calendar text-green-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Planning</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Voir et gérer le planning</p>
              </div>
            </div>

            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/admin/academic/media-content')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-orange-100 border-circle mb-3">
                  <i class="pi pi-video text-orange-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Contenu Multimédia</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Gérer le contenu média</p>
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
import { fetchAcademiqueKpis } from '@/service/dashboardService'

const router = useRouter()
const loading = ref(true)
const refreshing = ref(false)
const stats = ref({
  enseignants: 0,
  cours: 0,
  media: 0,
  modules: 0
})
const activities = ref([])

const loadDashboardData = async () => {
  refreshing.value = true
  try {
    const res = await fetchAcademiqueKpis()
    stats.value = { ...stats.value, ...res }
  } finally {
    refreshing.value = false
  }
}

const navigateTo = (path) => {
  router.push(path)
}

const activityIcon = (type) => {
  switch (type) {
    case 'enseignant': return 'pi pi-user';
    case 'cours': return 'pi pi-calendar';
    case 'media': return 'pi pi-video';
    case 'module': return 'pi pi-th-large';
    default: return 'pi pi-info-circle';
  }
}

onMounted(async () => {
  await loadDashboardData()
  activities.value = [
    { type: 'enseignant', title: 'Nouvel enseignant ajouté', time: 'il y a 25 min', to: '/admin/teachers-si' },
    { type: 'cours', title: 'Cours planifié', time: 'il y a 2 h', to: '/admin/planning/manage' },
    { type: 'media', title: 'Vidéo importée', time: 'hier', to: '/admin/academic/video-library' },
  ]
  loading.value = false
})
</script>