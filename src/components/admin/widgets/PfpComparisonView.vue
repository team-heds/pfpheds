<template>
  <div class="comparison-view p-4">
    <h2 class="text-2xl font-bold mb-4">
      <i class="pi pi-balance-scale mr-2" style="color: #3b82f6;"></i>
      Comparaison PFP1A vs PFP1B
    </h2>

    <div class="grid">
      <!-- Graphique comparatif -->
      <div class="col-12 lg:col-8">
        <div class="surface-card border-round-xl p-4 shadow-2">
          <div class="flex justify-content-between align-items-center mb-4">
            <h3 class="text-lg font-bold m-0">Places par Cohorte</h3>
            <Dropdown 
              v-model="comparisonType" 
              :options="comparisonOptions" 
              optionLabel="label"
              optionValue="value"
            />
          </div>

          <BarChart
            v-if="comparisonChartData.length > 0"
            :data="comparisonChartData"
            :height="350"
            horizontal
            stacked
          />
        </div>
      </div>

      <!-- Métriques de comparaison -->
      <div class="col-12 lg:col-4">
        <div class="surface-card border-round-xl p-4 shadow-2 mb-3">
          <h4 class="text-sm font-semibold text-600 mb-3 uppercase">Différence</h4>
          
          <div class="metric-item mb-3">
            <span class="text-600">Total places</span>
            <div class="flex align-items-center gap-2 mt-1">
              <i 
                :class="placeDifference >= 0 ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'"
              ></i>
              <span class="text-xl font-bold">{{ Math.abs(placeDifference) }}</span>
            </div>
          </div>

          <div class="metric-item mb-3">
            <span class="text-600">Taux d'attribution</span>
            <div class="flex align-items-center gap-2 mt-1">
              <i 
                :class="rateDifference >= 0 ? 'pi pi-arrow-up text-green-500' : 'pi pi-arrow-down text-red-500'"
              ></i>
              <span class="text-xl font-bold">{{ Math.abs(rateDifference) }}%</span>
            </div>
          </div>

          <Divider />

          <div class="metric-item">
            <span class="text-600">Cohorte dominante</span>
            <Tag 
              :value="dominantCohort"
              :severity="dominantCohort === 'PFP1A' ? 'info' : 'warning'"
              class="mt-2"
            />
          </div>
        </div>

        <!-- Recommandations -->
        <div class="surface-card border-round-xl p-4 shadow-2">
          <h4 class="text-sm font-semibold text-600 mb-3 uppercase">
            <i class="pi pi-lightbulb mr-1"></i>
            Recommandations
          </h4>
          <ul class="text-sm pl-3 m-0">
            <li v-for="(rec, index) in recommendations" :key="index" class="mb-2">
              {{ rec }}
            </li>
          </ul>
        </div>
      </div>

      <!-- Tableau comparatif détaillé -->
      <div class="col-12">
        <div class="surface-card border-round-xl shadow-2">
          <DataTable
            :value="comparisonTableData"
            responsiveLayout="scroll"
            class="comparison-table"
          >
            <template #header>
              <div class="p-3">
                <span class="text-lg font-bold">Tableau Comparatif Détaillé</span>
              </div>
            </template>

            <Column field="metric" header="Métrique" :style="{ width: '30%' }">
              <template #body="{ data }">
                <span class="font-semibold">{{ data.metric }}</span>
              </template>
            </Column>

            <Column header="PFP1A">
              <template #body="{ data }">
                <div class="flex align-items-center gap-2">
                  <div class="cohort-indicator" style="background: #667eea;"></div>
                  <Tag :value="data.pfp1a" severity="info" />
                </div>
              </template>
            </Column>

            <Column header="PFP1B">
              <template #body="{ data }">
                <div class="flex align-items-center gap-2">
                  <div class="cohort-indicator" style="background: #f093fb;"></div>
                  <Tag :value="data.pfp1b" severity="warning" />
                </div>
              </template>
            </Column>

            <Column field="difference" header="Différence" :sortable="true">
              <template #body="{ data }">
                <span 
                  class="font-bold"
                  :class="data.difference >= 0 ? 'text-green-500' : 'text-red-500'"
                >
                  {{ data.difference >= 0 ? '+' : '' }}{{ data.difference }}{{ data.unit }}
                </span>
              </template>
            </Column>
          </DataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import BarChart from './charts/BarChart.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'
import Tag from 'primevue/tag'
import Divider from 'primevue/divider'

const props = defineProps({
  stats: {
    type: Object,
    required: true
  }
})

// État
const comparisonType = ref('total')
const comparisonOptions = [
  { label: 'Comparaison Totale', value: 'total' },
  { label: 'Places Attribuées', value: 'assigned' },
  { label: 'Places Disponibles', value: 'available' }
]

// Computed
const comparisonChartData = computed(() => {
  const pfp1a = props.stats.PFP1A
  const pfp1b = props.stats.PFP1B

  if (comparisonType.value === 'total') {
    return [
      { label: 'PFP1A', value: pfp1a.total, color: '#667eea' },
      { label: 'PFP1B', value: pfp1b.total, color: '#f093fb' }
    ]
  } else if (comparisonType.value === 'assigned') {
    return [
      { label: 'PFP1A Attribuées', value: pfp1a.assigned, color: '#667eea' },
      { label: 'PFP1B Attribuées', value: pfp1b.assigned, color: '#f093fb' }
    ]
  } else {
    return [
      { label: 'PFP1A Disponibles', value: pfp1a.available, color: '#667eea' },
      { label: 'PFP1B Disponibles', value: pfp1b.available, color: '#f093fb' }
    ]
  }
})

const placeDifference = computed(() => {
  return props.stats.PFP1A.total - props.stats.PFP1B.total
})

const rateDifference = computed(() => {
  const rate1a = props.stats.PFP1A.total > 0 
    ? Math.round((props.stats.PFP1A.assigned / props.stats.PFP1A.total) * 100)
    : 0
  const rate1b = props.stats.PFP1B.total > 0 
    ? Math.round((props.stats.PFP1B.assigned / props.stats.PFP1B.total) * 100)
    : 0
  return rate1a - rate1b
})

const dominantCohort = computed(() => {
  return props.stats.PFP1A.total > props.stats.PFP1B.total ? 'PFP1A' : 'PFP1B'
})

const recommendations = computed(() => {
  const recs = []
  const { PFP1A, PFP1B } = props.stats

  if (PFP1A.available > 10) {
    recs.push(`${PFP1A.available} places PFP1A encore disponibles à attribuer`)
  }
  
  if (PFP1B.available > 10) {
    recs.push(`${PFP1B.available} places PFP1B encore disponibles à attribuer`)
  }

  if (Math.abs(placeDifference.value) > 20) {
    recs.push(`Déséquilibre de ${Math.abs(placeDifference.value)} places entre cohortes`)
  }

  if (Math.abs(rateDifference.value) > 15) {
    recs.push(`Écart d'attribution de ${Math.abs(rateDifference.value)}% entre cohortes`)
  }

  if (recs.length === 0) {
    recs.push('Répartition équilibrée entre les deux cohortes')
  }

  return recs
})

const comparisonTableData = computed(() => {
  const { PFP1A, PFP1B } = props.stats

  return [
    {
      metric: 'Total Places',
      pfp1a: PFP1A.total,
      pfp1b: PFP1B.total,
      difference: PFP1A.total - PFP1B.total,
      unit: ''
    },
    {
      metric: 'Places Attribuées',
      pfp1a: PFP1A.assigned,
      pfp1b: PFP1B.assigned,
      difference: PFP1A.assigned - PFP1B.assigned,
      unit: ''
    },
    {
      metric: 'Places Disponibles',
      pfp1a: PFP1A.available,
      pfp1b: PFP1B.available,
      difference: PFP1A.available - PFP1B.available,
      unit: ''
    },
    {
      metric: 'Taux d\'Attribution',
      pfp1a: PFP1A.total > 0 ? `${Math.round((PFP1A.assigned / PFP1A.total) * 100)}%` : '0%',
      pfp1b: PFP1B.total > 0 ? `${Math.round((PFP1B.assigned / PFP1B.total) * 100)}%` : '0%',
      difference: rateDifference.value,
      unit: '%'
    }
  ]
})
</script>

<style scoped>
.comparison-view {
  min-height: 400px;
}

.metric-item {
  display: flex;
  flex-direction: column;
}

.cohort-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.comparison-table :deep(.p-datatable-thead > tr > th) {
  padding: 0.75rem;
  font-size: 0.875rem;
}

.comparison-table :deep(.p-datatable-tbody > tr > td) {
  padding: 0.75rem;
}
</style>
