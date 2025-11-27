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
              <i class="pi pi-star-fill text-primary text-3xl"></i>
              <div>
                <h1 class="text-2xl font-bold text-900 m-0">Dashboard Gamification</h1>
                <p class="text-600 m-0 mt-1">Tableau de bord gamification et engagement</p>
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
              <Button 
                icon="pi pi-refresh" 
                @click="refresh"
                :loading="refreshing"
                outlined
              />
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

        <!-- Activités récentes -->
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-900 mb-3">Activités récentes</h2>
          <div class="surface-card p-4 border-round shadow-2">
            <div v-if="!activities.length" class="text-600">Aucune activité récente</div>
            <div v-else class="flex flex-column gap-2">
              <div
                v-for="(a, i) in activities"
                :key="i"
                class="flex align-items-center justify-content-between border-1 surface-border border-round p-3"
              >
                <div class="flex align-items-center gap-3">
                  <div class="flex align-items-center justify-content-center w-2rem h-2rem bg-blue-50 border-circle">
                    <i :class="activityIcon(a.type)" class="text-blue-500 text-sm"></i>
                  </div>
                  <div>
                    <div class="text-900 font-medium">{{ a.title || a.description || 'Activité' }}</div>
                    <small class="text-500">{{ a.time || formatTime(a.timestamp) }}</small>
                  </div>
                </div>
                <Button v-if="a.to" label="Voir" class="p-button-text p-button-sm" @click="navigateTo(a.to)" />
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
import gamificationAdminService from '@/service/gamificationAdminService'

const router = useRouter()

// Utiliser le système KPI modulable
const {
  kpisWithData,
  loading,
  refreshing,
  period,
  loadKpis,
  refresh
} = useKpiManager('gamification')

const activities = ref([])

const loadActivities = async () => {
  try {
    const logs = await gamificationAdminService.getRecentLogs(10)
    activities.value = (logs || []).map(l => ({
      type: l.action || 'activity',
      title: l.title || l.description || 'Action gamification',
      timestamp: l.timestamp || Date.now(),
      to: null
    }))
  } catch (_) {
    activities.value = []
  }
}

const navigateTo = (path) => {
  router.push(path)
}

const handleKpiAction = (kpi) => {
  const routes = {
    challenges_active: '/admin/gamification/challenges',
    quests_completed: '/admin/gamification/quests',
    badges_total: '/admin/gamification/badges',
    users_active: '/admin/gamification/users'
  }
  if (routes[kpi.id]) {
    router.push(routes[kpi.id])
  }
}

const activityIcon = (type) => {
  switch (type) {
    case 'challenge': return 'pi pi-trophy'
    case 'quest': return 'pi pi-flag'
    case 'badge': return 'pi pi-star'
    case 'house': return 'pi pi-home'
    default: return 'pi pi-info-circle'
  }
}

function formatTime(ts) {
  try {
    const d = new Date(ts)
    return d.toLocaleString()
  } catch { return '' }
}

onMounted(async () => {
  await Promise.all([loadKpis(), loadActivities()])
})
</script>

<style scoped>
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}
</style>