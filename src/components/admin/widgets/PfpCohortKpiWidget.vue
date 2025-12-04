<template>
  <div class="pfp-cohort-widget">
    <!-- Header -->
    <div class="widget-header mb-4">
      <div class="flex align-items-center gap-3">
        <div class="icon-wrapper" :style="{ background: `${cohortColor}15`, color: cohortColor }">
          <i class="pi pi-calendar text-2xl"></i>
        </div>
        <div>
          <h2 class="text-2xl font-bold m-0">{{ cohort }}</h2>
          <p class="text-600 m-0">Places de stages par canton</p>
        </div>
      </div>
      <Button 
        v-if="!loading"
        icon="pi pi-refresh" 
        text 
        rounded 
        @click="loadStats"
        :loading="refreshing"
      />
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid">
      <div v-for="i in 3" :key="i" class="col-12 md:col-4">
        <Skeleton height="140px" borderRadius="12px" />
      </div>
    </div>

    <!-- Stats Grid -->
    <div v-else class="grid">
      <!-- Total des places -->
      <div class="col-12 md:col-4">
        <KpiCard
          label="Total Places"
          :subtitle="`Cohorte ${cohort}`"
          :value="stats.total"
          icon="pi pi-map-marker"
          :color="cohortColor"
          size="medium"
          :animated="true"
        />
      </div>

      <!-- Places attribuées -->
      <div class="col-12 md:col-4">
        <KpiCard
          label="Places Attribuées"
          :subtitle="`${assignmentRate}% d'attribution`"
          :value="stats.assigned"
          icon="pi pi-check-circle"
          color="#10b981"
          :trend="assignmentRate"
          size="medium"
          :animated="true"
        />
      </div>

      <!-- Places disponibles -->
      <div class="col-12 md:col-4">
        <KpiCard
          label="Places Disponibles"
          subtitle="À attribuer"
          :value="stats.available"
          icon="pi pi-circle"
          color="#f59e0b"
          size="medium"
          :animated="true"
        />
      </div>

      <!-- Graphique par canton -->
      <div class="col-12">
        <div class="surface-card border-round-xl p-4 shadow-2">
          <div class="flex justify-content-between align-items-center mb-4">
            <div>
              <h3 class="text-xl font-bold m-0 mb-2">Répartition par Canton</h3>
              <p class="text-600 m-0 text-sm">{{ stats.topCantons.length }} canton(s) avec des places</p>
            </div>
            <div class="flex gap-2">
              <Button 
                :label="chartType === 'bar' ? 'Barres' : chartType === 'pie' ? 'Camembert' : 'Donut'"
                :icon="chartType === 'bar' ? 'pi pi-chart-bar' : 'pi pi-chart-pie'"
                outlined
                size="small"
                @click="toggleChartType"
              />
            </div>
          </div>

          <!-- Chart -->
          <div v-if="stats.topCantons.length > 0" style="height: 400px;">
            <component
              :is="currentChartComponent"
              :data="stats.topCantons"
              :height="400"
              :color="cohortColor"
              v-bind="chartProps"
            />
          </div>
          <EmptyState
            v-else
            title="Aucune place trouvée"
            description="Aucune place n'est associée à cette cohorte PFP"
            icon="pi-map-marker"
          />
        </div>
      </div>

      <!-- Tableau détaillé par canton -->
      <div class="col-12">
        <div class="surface-card border-round-xl shadow-2">
          <DataTable
            :value="tableData"
            :paginator="true"
            :rows="10"
            dataKey="canton"
            :rowHover="true"
            responsiveLayout="scroll"
            class="compact-table"
          >
            <template #header>
              <div class="flex justify-content-between align-items-center p-3">
                <span class="text-lg font-bold">Détails par Canton</span>
                <Button 
                  label="Exporter CSV" 
                  icon="pi pi-download" 
                  size="small"
                  outlined
                  @click="exportToCSV"
                />
              </div>
            </template>

            <Column field="canton" header="Canton" :sortable="true">
              <template #body="{ data }">
                <div class="flex align-items-center gap-2">
                  <div 
                    class="canton-badge"
                    :style="{ background: data.color }"
                  ></div>
                  <span class="font-semibold">{{ data.canton }}</span>
                </div>
              </template>
            </Column>

            <Column field="total" header="Total" :sortable="true">
              <template #body="{ data }">
                <Tag :value="data.total" severity="info" />
              </template>
            </Column>

            <Column field="assigned" header="Attribuées" :sortable="true">
              <template #body="{ data }">
                <Tag :value="data.assigned" severity="success" />
              </template>
            </Column>

            <Column field="available" header="Disponibles" :sortable="true">
              <template #body="{ data }">
                <Tag :value="data.available" severity="warning" />
              </template>
            </Column>

            <Column field="rate" header="Taux" :sortable="true">
              <template #body="{ data }">
                <div class="flex align-items-center gap-2">
                  <ProgressBar 
                    :value="data.rate" 
                    :showValue="false"
                    style="height: 8px; width: 100px;"
                    :pt="{ value: { style: { background: cohortColor } } }"
                  />
                  <span class="text-sm font-semibold">{{ data.rate }}%</span>
                </div>
              </template>
            </Column>

            <Column header="Actions">
              <template #body="{ data }">
                <Button 
                  label="Voir places" 
                  icon="pi pi-eye"
                  text
                  size="small"
                  @click="viewPlaces(data.canton)"
                />
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import KpiCard from './KpiCard.vue'
import BarChart from './charts/BarChart.vue'
import PieChart from './charts/PieChart.vue'
import DoughnutChart from './charts/DoughnutChart.vue'
import EmptyState from '@/components/common/feedback/EmptyState.vue'
import Skeleton from 'primevue/skeleton'
import Button from 'primevue/button'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Tag from 'primevue/tag'
import ProgressBar from 'primevue/progressbar'
import pfpStatsService from '@/service/pfpStatsService'

const props = defineProps({
  cohort: {
    type: String,
    required: true,
    validator: (value) => ['PFP1A', 'PFP1B'].includes(value)
  }
})

const router = useRouter()

// État
const loading = ref(true)
const refreshing = ref(false)
const stats = ref({
  total: 0,
  assigned: 0,
  available: 0,
  topCantons: []
})
const chartType = ref('bar') // bar, pie, doughnut

// Couleurs par cohorte
const cohortColor = computed(() => {
  return props.cohort === 'PFP1A' ? '#667eea' : '#f093fb'
})

// Taux d'attribution
const assignmentRate = computed(() => {
  if (stats.value.total === 0) return 0
  return Math.round((stats.value.assigned / stats.value.total) * 100)
})

// Composant de graphique actuel
const currentChartComponent = computed(() => {
  const components = {
    bar: BarChart,
    pie: PieChart,
    doughnut: DoughnutChart
  }
  return components[chartType.value]
})

// Props du graphique
const chartProps = computed(() => {
  if (chartType.value === 'bar') {
    return {
      horizontal: false,
      showValues: true
    }
  }
  return {
    showLegend: true,
    showPercentage: true
  }
})

// Données pour le tableau
const tableData = computed(() => {
  return stats.value.topCantons.map(canton => ({
    canton: canton.label,
    total: canton.value,
    assigned: canton.assigned,
    available: canton.available,
    rate: canton.value > 0 ? Math.round((canton.assigned / canton.value) * 100) : 0,
    color: canton.color
  }))
})

// Méthodes
async function loadStats() {
  refreshing.value = true
  try {
    const allStats = await pfpStatsService.getPfpCohortStats()
    stats.value = allStats[props.cohort]
    console.log(`✅ Stats ${props.cohort} chargées:`, stats.value)
  } catch (error) {
    console.error(`❌ Erreur chargement stats ${props.cohort}:`, error)
  } finally {
    loading.value = false
    refreshing.value = false
  }
}

function toggleChartType() {
  const types = ['bar', 'pie', 'doughnut']
  const currentIndex = types.indexOf(chartType.value)
  chartType.value = types[(currentIndex + 1) % types.length]
}

function viewPlaces(canton) {
  // Navigation vers la vue détaillée des places
  router.push({
    name: 'ManagementPlaces',
    query: {
      cohort: props.cohort,
      canton: canton
    }
  })
}

function exportToCSV() {
  const csvContent = [
    ['Canton', 'Total', 'Attribuées', 'Disponibles', 'Taux (%)'].join(','),
    ...tableData.value.map(row => 
      [row.canton, row.total, row.assigned, row.available, row.rate].join(',')
    )
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `${props.cohort}_places_par_canton.csv`
  link.click()
}

// Lifecycle
onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.pfp-cohort-widget {
  padding: 1rem;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.canton-badge {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.compact-table :deep(.p-datatable-thead > tr > th) {
  padding: 0.75rem;
  font-size: 0.875rem;
}

.compact-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.75rem;
}

@media (max-width: 768px) {
  .pfp-cohort-widget {
    padding: 0.5rem;
  }
}
</style>
