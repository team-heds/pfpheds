<template>
  <AdminLayout>
    <div class="p-4">
      <div class="surface-card p-4 border-round shadow-2">
        <div class="flex align-items-center gap-3 mb-4">
          <i class="pi pi-chart-bar text-primary text-4xl"></i>
          <div>
            <h1 class="text-3xl font-bold text-900 m-0">Dashboard Formation Pratique Physio</h1>
            <p class="text-600 m-0 mt-2">Vue d'ensemble de la formation pratique en physiothérapie</p>
          </div>
        </div>

        <!-- KPI Grid -->
        <DashboardKpiGrid
          ref="kpiGridRef"
          :kpis="kpisWithData"
          title="Indicateurs Clés"
          subtitle="Suivi de la formation pratique"
          storage-key="pfp-dashboard-config"
          @kpi-action="handleKpiAction"
          class="mb-4"
        />

        <!-- Actions Rapides -->
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-900 mb-3">Actions Rapides</h2>
          <div class="grid">
            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/affectation_stage_etudiant_ba24')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-purple-100 border-circle mb-3">
                  <i class="pi pi-user-plus text-purple-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Affectation PFP2 BA24</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Gérer les affectations PFP2 pour la volée BA24</p>
              </div>
            </div>
             <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/admin/formation-pratique/etudiants')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-blue-100 border-circle mb-3">
                  <i class="pi pi-users text-blue-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Étudiants</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Gérer les étudiants</p>
              </div>
            </div>
            <div class="col-12 md:col-6 lg:col-4">
              <div 
                class="surface-card p-4 border-round shadow-2 cursor-pointer hover:shadow-4 transition-all transition-duration-300 border-2 border-transparent hover:border-primary h-full"
                @click="navigateTo('/admin/formation-pratique/places')"
              >
                <div class="flex align-items-center justify-content-center w-3rem h-3rem bg-green-100 border-circle mb-3">
                  <i class="pi pi-map-marker text-green-500 text-xl"></i>
                </div>
                <h3 class="text-lg font-semibold text-900 m-0 mb-2">Places</h3>
                <p class="text-600 text-sm m-0 mb-3 line-height-3">Gérer les places de stage</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DashboardKpiGrid from '@/components/admin/widgets/DashboardKpiGrid.vue'
import { useKpiManager } from '@/composables/useKpiManager'

const router = useRouter()

// Utiliser le système KPI modulable pour 'pfp'
const {
  kpisWithData,
  loadKpis
} = useKpiManager('pfp')

const navigateTo = (path) => {
  router.push(path)
}

const handleKpiAction = (kpi) => {
  // Logique de redirection basée sur l'ID du KPI
  const routes = {
    students_count: '/admin/formation-pratique/etudiants',
    institutions_count: '/admin/formation-pratique/institutions',
    places_count: '/admin/formation-pratique/places',
    pfp_ongoing: '/management_pfpencours'
  }
  if (routes[kpi.id]) {
    router.push(routes[kpi.id])
  }
}

onMounted(async () => {
  await loadKpis()
})
</script>

<style scoped>
</style>
