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

          <div class="flex gap-3">
            <ButtonGroup>
              <Button
                label="7j"
                :outlined="period !== '7d'"
                :severity="period === '7d' ? 'primary' : 'secondary'"
                @click="period = '7d'"
                size="small"
              />
              <Button
                label="30j"
                :outlined="period !== '30d'"
                :severity="period === '30d' ? 'primary' : 'secondary'"
                @click="period = '30d'"
                size="small"
              />
              <Button
                label="90j"
                :outlined="period !== '90d'"
                :severity="period === '90d' ? 'primary' : 'secondary'"
                @click="period = '90d'"
                size="small"
              />
            </ButtonGroup>
            <Button icon="pi pi-refresh" @click="refresh" :loading="refreshing" outlined />
          </div>
        </div>
      </div>

      <!-- KPI Cards modulables -->
      <div class="kpi-grid mb-4">
        <KpiCard
          v-for="kpi in kpisWithData"
          :key="kpi.id"
          v-bind="kpi"
          @action="handleKpiAction(kpi)"
        />
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
              <div
                class="flex align-items-center justify-content-center w-3rem h-3rem bg-blue-100 border-circle mb-3"
              >
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
              <div
                class="flex align-items-center justify-content-center w-3rem h-3rem bg-green-100 border-circle mb-3"
              >
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
              <div
                class="flex align-items-center justify-content-center w-3rem h-3rem bg-orange-100 border-circle mb-3"
              >
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
import KpiCard from './widgets/KpiCard.vue'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import ProgressSpinner from 'primevue/progressspinner'
import { useKpiManager } from '@/composables/useKpiManager'

const router = useRouter()

// Utiliser le système KPI modulable
const { kpisWithData, loading, refreshing, period, loadKpis, refresh } = useKpiManager('academique')

const activities = ref([])

const navigateTo = (path) => {
  router.push(path)
}

const handleKpiAction = (kpi) => {
  const routes = {
    teachers_count: '/admin/teachers-si',
    courses_count: '/admin/planning/manage',
    media_count: '/admin/academic/video-library',
    modules_count: '/admin/modules'
  }
  if (routes[kpi.id]) {
    router.push(routes[kpi.id])
  }
}

const activityIcon = (type) => {
  switch (type) {
    case 'enseignant':
      return 'pi pi-user'
    case 'cours':
      return 'pi pi-calendar'
    case 'media':
      return 'pi pi-video'
    case 'module':
      return 'pi pi-th-large'
    default:
      return 'pi pi-info-circle'
  }
}

onMounted(async () => {
  await loadKpis()
  activities.value = [
    {
      type: 'enseignant',
      title: 'Nouvel enseignant ajouté',
      time: 'il y a 25 min',
      to: '/admin/teachers-si'
    },
    { type: 'cours', title: 'Cours planifié', time: 'il y a 2 h', to: '/admin/planning/manage' },
    { type: 'media', title: 'Vidéo importée', time: 'hier', to: '/admin/academic/video-library' }
  ]
})
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
</style>
