<template>
  <AdminLayout>
      <div v-if="loading" class="flex flex-column align-items-center justify-content-center p-8">
        <ProgressSpinner />
        <p class="mt-3 text-600">Chargement du tableau de bord...</p>
      </div>

      <div v-else class="p-4 max-w-7xl mx-auto">
        <!-- Header -->
        <div class="surface-card p-4 border-round shadow-2 mb-4 border-left-3 border-primary">
          <div class="dashboard-header flex justify-content-between align-items-center gap-3">
            <div class="flex align-items-center gap-3">
              <i class="pi pi-star-fill text-primary text-3xl"></i>
              <div>
                <h1 class="text-2xl font-bold text-900 m-0">Dashboard Gamification</h1>
                <p class="text-600 m-0 mt-1">Tableau de bord gamification et engagement</p>
              </div>
            </div>
            
            <div class="dashboard-periods flex gap-3">
              <ButtonGroup>
                <Button
                  label="Semaine"
                  :outlined="period !== 'week'"
                  :severity="period === 'week' ? 'primary' : 'secondary'"
                  @click="changePeriod('week')"
                  size="small"
                />
                <Button
                  label="Mois"
                  :outlined="period !== 'month'"
                  :severity="period === 'month' ? 'primary' : 'secondary'"
                  @click="changePeriod('month')"
                  size="small"
                />
                <Button
                  label="Trimestre"
                  :outlined="period !== 'quarter'"
                  :severity="period === 'quarter' ? 'primary' : 'secondary'"
                  @click="changePeriod('quarter')"
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
          />
        </div>

        <!-- Activités récentes -->
        <div class="mb-4">
          <h2 class="text-xl font-semibold text-900 mb-3">Activités récentes</h2>
          <div class="surface-card p-4 border-round shadow-2">
            <div v-if="activitiesError" class="flex align-items-center justify-content-between gap-3">
              <span class="text-red-500">Les activités récentes sont momentanément indisponibles.</span>
              <Button label="Réessayer" class="p-button-text p-button-sm" @click="loadActivities" />
            </div>
            <div v-else-if="!activities.length" class="text-600">Aucune activité récente</div>
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
                    <small class="text-500">{{ formatTime(a.occurredAt) }}<span v-if="a.xp"> · {{ a.xp > 0 ? '+' : '' }}{{ a.xp }} XP</span></small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
  </AdminLayout>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import AdminLayout from './layouts/AdminLayout.vue'
import KpiCard from './widgets/KpiCard.vue'
import Button from 'primevue/button'
import ButtonGroup from 'primevue/buttongroup'
import ProgressSpinner from 'primevue/progressspinner'
import { useAdminDashboardStats } from '@/composables/useAdminDashboardStats'
import { fetchGamificationActivity } from '@/service/adminDashboardStatsService'
import { getKpisForRole } from '@/config/kpiConfigs'
import { useRoleStore } from '@/stores/role'

const roleStore = useRoleStore()
const period = ref('month')
const stats = useAdminDashboardStats({ domains: ['gamification'], period })
const configurations = computed(() => getKpisForRole('gamification', roleStore.perms || [], roleStore.isSuper))
const kpisWithData = stats.mapKpis('gamification', configurations)
const { loading, refreshing } = stats
const loadKpis = () => stats.load().catch(() => undefined)
const refresh = async () => {
  await Promise.all([stats.refresh().catch(() => undefined), loadActivities()])
}
const changePeriod = async (nextPeriod) => {
  period.value = nextPeriod
  await refresh()
}

const activities = ref([])
const activitiesError = ref(false)

const loadActivities = async () => {
  activitiesError.value = false
  try {
    activities.value = await fetchGamificationActivity({ limit: 20 })
  } catch (_) {
    activities.value = []
    activitiesError.value = true
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

@media (max-width: 900px) {
  .dashboard-header {
    align-items: flex-start !important;
    flex-direction: column;
  }

  .dashboard-periods {
    flex-wrap: wrap;
    width: 100%;
  }
}
</style>
