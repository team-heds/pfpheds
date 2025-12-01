<template>
  <AdminLayout>
    <template #header>
      <AdminPageHeader 
        title="Statistiques PFP par Cohorte" 
        subtitle="Vue d'ensemble des places de stages PFP1A et PFP1B"
      >
        <template #breadcrumbs>
          <div class="flex align-items-center gap-2 text-sm text-600">
            <router-link to="/admin" class="text-600 no-underline hover:text-primary">Dashboard</router-link>
            <i class="pi pi-angle-right text-300" aria-hidden="true"></i>
            <router-link to="/admin/dashboard-pfp" class="text-600 no-underline hover:text-primary">PFP</router-link>
            <i class="pi pi-angle-right text-300" aria-hidden="true"></i>
            <span class="text-900">Stats Cohortes</span>
          </div>
        </template>
      </AdminPageHeader>
    </template>

    <div class="pfp-stats-page">
      <!-- Vue d'ensemble globale -->
      <div class="surface-card border-round-xl p-4 mb-4 shadow-2">
        <h2 class="text-2xl font-bold mb-4">
          <i class="pi pi-chart-bar mr-2" style="color: #3b82f6;"></i>
          Vue d'ensemble
        </h2>
        
        <div v-if="loadingGlobal" class="grid">
          <div v-for="i in 4" :key="i" class="col-12 md:col-3">
            <Skeleton height="120px" borderRadius="12px" />
          </div>
        </div>

        <div v-else class="grid">
          <!-- Total global -->
          <div class="col-12 md:col-3">
            <KpiCard
              label="Total Places"
              subtitle="Toutes cohortes"
              :value="globalStats.total"
              icon="pi pi-map-marker"
              color="#3b82f6"
              size="medium"
              :animated="true"
            />
          </div>

          <!-- PFP1A -->
          <div class="col-12 md:col-3">
            <KpiCard
              label="PFP1A"
              :subtitle="`${pfp1aRate}% attribué`"
              :value="globalStats.PFP1A.total"
              icon="pi pi-calendar"
              color="#667eea"
              :trend="pfp1aRate"
              size="medium"
              :animated="true"
              clickable
              action-label="Détails"
              @action="scrollToCohort('pfp1a')"
            />
          </div>

          <!-- PFP1B -->
          <div class="col-12 md:col-3">
            <KpiCard
              label="PFP1B"
              :subtitle="`${pfp1bRate}% attribué`"
              :value="globalStats.PFP1B.total"
              icon="pi pi-calendar"
              color="#f093fb"
              :trend="pfp1bRate"
              size="medium"
              :animated="true"
              clickable
              action-label="Détails"
              @action="scrollToCohort('pfp1b')"
            />
          </div>

          <!-- Statut global -->
          <div class="col-12 md:col-3">
            <KpiCard
              label="Taux Global"
              subtitle="Attribution moyenne"
              :value="`${globalRate}%`"
              icon="pi pi-percentage"
              color="#10b981"
              size="medium"
              :animated="true"
            />
          </div>
        </div>
      </div>

      <!-- Onglets pour chaque cohorte -->
      <TabView>
        <TabPanel>
          <template #header>
            <div class="flex align-items-center gap-2">
              <div class="cohort-indicator" style="background: #667eea;"></div>
              <span class="font-semibold">PFP1A</span>
              <Tag 
                v-if="!loadingGlobal"
                :value="globalStats.PFP1A.total" 
                severity="info" 
              />
            </div>
          </template>
          <div id="pfp1a">
            <PfpCohortKpiWidget cohort="PFP1A" />
          </div>
        </TabPanel>

        <TabPanel>
          <template #header>
            <div class="flex align-items-center gap-2">
              <div class="cohort-indicator" style="background: #f093fb;"></div>
              <span class="font-semibold">PFP1B</span>
              <Tag 
                v-if="!loadingGlobal"
                :value="globalStats.PFP1B.total" 
                severity="info" 
              />
            </div>
          </template>
          <div id="pfp1b">
            <PfpCohortKpiWidget cohort="PFP1B" />
          </div>
        </TabPanel>

        <TabPanel>
          <template #header>
            <div class="flex align-items-center gap-2">
              <i class="pi pi-chart-line"></i>
              <span class="font-semibold">Comparaison</span>
            </div>
          </template>
          <ComparisonView :stats="globalStats" />
        </TabPanel>
      </TabView>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import AdminPageHeader from '@/components/admin/common/AdminPageHeader.vue'
import KpiCard from '@/components/admin/widgets/KpiCard.vue'
import PfpCohortKpiWidget from '@/components/admin/widgets/PfpCohortKpiWidget.vue'
import ComparisonView from '@/components/admin/widgets/PfpComparisonView.vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import Tag from 'primevue/tag'
import Skeleton from 'primevue/skeleton'
import pfpStatsService from '@/service/pfpStatsService'

// État
const loadingGlobal = ref(true)
const globalStats = ref({
  total: 0,
  PFP1A: { total: 0, assigned: 0, available: 0 },
  PFP1B: { total: 0, assigned: 0, available: 0 }
})

// Computed
const pfp1aRate = computed(() => {
  const { total, assigned } = globalStats.value.PFP1A
  return total > 0 ? Math.round((assigned / total) * 100) : 0
})

const pfp1bRate = computed(() => {
  const { total, assigned } = globalStats.value.PFP1B
  return total > 0 ? Math.round((assigned / total) * 100) : 0
})

const globalRate = computed(() => {
  const totalPlaces = globalStats.value.PFP1A.total + globalStats.value.PFP1B.total
  const totalAssigned = globalStats.value.PFP1A.assigned + globalStats.value.PFP1B.assigned
  return totalPlaces > 0 ? Math.round((totalAssigned / totalPlaces) * 100) : 0
})

// Méthodes
async function loadGlobalStats() {
  loadingGlobal.value = true
  try {
    const stats = await pfpStatsService.getPfpCohortStats()
    globalStats.value = {
      total: stats.global.total,
      PFP1A: {
        total: stats.PFP1A.total,
        assigned: stats.PFP1A.assigned,
        available: stats.PFP1A.available
      },
      PFP1B: {
        total: stats.PFP1B.total,
        assigned: stats.PFP1B.assigned,
        available: stats.PFP1B.available
      }
    }
    console.log('✅ Stats globales chargées:', globalStats.value)
  } catch (error) {
    console.error('❌ Erreur chargement stats globales:', error)
  } finally {
    loadingGlobal.value = false
  }
}

function scrollToCohort(id) {
  const element = document.getElementById(id)
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

// Lifecycle
onMounted(() => {
  loadGlobalStats()
})
</script>

<style scoped>
.pfp-stats-page {
  padding: 1rem;
}

.cohort-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

@media (max-width: 768px) {
  .pfp-stats-page {
    padding: 0.5rem;
  }
}
</style>
