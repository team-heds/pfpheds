<template>
  <div class="smart-visualization">
    <!-- Controls -->
    <div class="viz-controls">
      <div class="viz-type-selector">
        <div class="viz-buttons">
          <Button
            v-for="type in availableTypes"
            :key="type.value"
            :icon="type.icon"
            :outlined="selectedType !== type.value"
            :severity="selectedType === type.value ? 'primary' : 'secondary'"
            @click="selectedType = type.value"
            size="small"
            rounded
            v-tooltip.bottom="getTooltip(type)"
            :class="{ 'suggested-type': type.value === suggestedType }"
          />
        </div>
      </div>
      
      <div class="viz-actions">
        <Button
          v-if="showExport"
          icon="pi pi-download"
          @click="exportData"
          outlined
          rounded
          size="small"
          v-tooltip.bottom="'Exporter en CSV'"
        />
        <Button
          v-if="showRefresh"
          icon="pi pi-refresh"
          @click="$emit('refresh')"
          outlined
          rounded
          size="small"
          v-tooltip.bottom="'Actualiser'"
        />
      </div>
    </div>

    <!-- No Data Message -->
    <div v-if="!data || data.length === 0" class="viz-display">
      <div class="no-data-message">
        <i class="pi pi-chart-line text-4xl text-400 mb-3"></i>
        <p class="text-600 m-0">Aucune donnée à afficher</p>
      </div>
    </div>

    <!-- Visualization Display -->
    <div class="viz-display" v-else>
      <!-- Table View -->
      <DataTable
        v-if="selectedType === 'table'"
        :value="tableData"
        :paginator="tableData.length > 10"
        :rows="10"
        :rowsPerPageOptions="[5, 10, 20, 50]"
        sortMode="multiple"
        stripedRows
        responsiveLayout="scroll"
        :exportFilename="title || 'data'"
      >
        <Column
          v-for="col in tableColumns"
          :key="col.field"
          :field="col.field"
          :header="col.header"
          :sortable="col.sortable !== false"
        >
          <template #body="slotProps" v-if="col.field === 'color'">
            <div class="flex align-items-center gap-2">
              <div
                class="color-badge"
                :style="{ backgroundColor: slotProps.data[col.field] }"
              ></div>
              <span>{{ slotProps.data[col.field] }}</span>
            </div>
          </template>
        </Column>
      </DataTable>

      <!-- Stats Cards -->
      <div v-else-if="selectedType === 'cards'" class="stats-cards-grid">
        <Card v-for="item in data" :key="item.label" class="stat-card">
          <template #content>
            <div class="stat-card-content" :style="{ borderLeftColor: item.color }">
              <div class="stat-icon" :style="{ background: item.color + '20', color: item.color }">
                <i class="pi pi-chart-bar text-2xl"></i>
              </div>
              <div class="stat-info">
                <div class="stat-label">{{ item.label }}</div>
                <div class="stat-value">{{ item.value }}</div>
                <div class="stat-percentage" v-if="totalValue > 0">
                  {{ ((item.value / totalValue) * 100).toFixed(1) }}%
                </div>
              </div>
            </div>
          </template>
        </Card>
      </div>

      <!-- Number Grid -->
      <div v-else-if="selectedType === 'numbers'" class="numbers-grid">
        <div
          v-for="item in data"
          :key="item.label"
          class="number-item"
          :style="{ borderColor: item.color }"
        >
          <div class="number-label">{{ item.label }}</div>
          <div class="number-value" :style="{ color: item.color }">
            {{ item.value }}
          </div>
          <div class="number-bar">
            <div
              class="number-bar-fill"
              :style="{
                width: totalValue > 0 ? (item.value / totalValue * 100) + '%' : '0%',
                backgroundColor: item.color
              }"
            ></div>
          </div>
        </div>
      </div>

      <!-- Charts -->
      <component
        v-else
        :is="getChartComponent(selectedType)"
        :data="data"
        :title="title"
        :height="height"
        v-bind="chartProps"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import Button from 'primevue/button'
import Card from 'primevue/card'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import PieChart from './charts/PieChart.vue'
import DoughnutChart from './charts/DoughnutChart.vue'
import BarChart from './charts/BarChart.vue'
import LineChart from './charts/LineChart.vue'

const props = defineProps({
  data: {
    type: Array,
    required: true
    // Format: [{ label: 'BA23', value: 61, color: '#f59e0b' }, ...]
  },
  title: String,
  height: {
    type: Number,
    default: 350
  },
  autoDetect: {
    type: Boolean,
    default: true
  },
  defaultType: String,
  chartProps: Object,
  showExport: {
    type: Boolean,
    default: true
  },
  showRefresh: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['refresh', 'export'])

const selectedType = ref('')

// Tous les types disponibles
const allTypes = [
  {
    value: 'pie',
    label: 'Camembert',
    icon: 'pi pi-chart-pie',
    tooltip: 'Camembert'
  },
  {
    value: 'doughnut',
    label: 'Anneau',
    icon: 'pi pi-circle',
    tooltip: 'Anneau'
  },
  {
    value: 'bar',
    label: 'Barres',
    icon: 'pi pi-chart-bar',
    tooltip: 'Barres'
  },
  {
    value: 'line',
    label: 'Ligne',
    icon: 'pi pi-chart-line',
    tooltip: 'Ligne'
  },
  {
    value: 'table',
    label: 'Tableau',
    icon: 'pi pi-table',
    tooltip: 'Tableau'
  },
  {
    value: 'cards',
    label: 'Cartes',
    icon: 'pi pi-th-large',
    tooltip: 'Cartes'
  },
  {
    value: 'numbers',
    label: 'Chiffres',
    icon: 'pi pi-list',
    tooltip: 'Chiffres'
  }
]

// Types disponibles selon les données
const availableTypes = computed(() => {
  if (!props.data || props.data.length === 0) return allTypes.slice(0, 3)
  
  const hasTimeSeries = props.data.every(d => d.x || d.date || d.month)
  
  if (hasTimeSeries) {
    // Pour les séries temporelles : ligne, bar, table
    return allTypes.filter(t => ['line', 'bar', 'table'].includes(t.value))
  }
  
  // Pour les données catégorielles : tous les types
  return allTypes
})

// Type suggéré automatiquement
const suggestedType = computed(() => {
  if (!props.autoDetect || !props.data || props.data.length === 0) {
    return props.defaultType || 'pie'
  }
  
  const dataCount = props.data.length
  const hasTimeSeries = props.data.every(d => d.x || d.date || d.month)
  const hasColors = props.data.every(d => d.color)
  
  // Série temporelle → Line chart
  if (hasTimeSeries) {
    return 'line'
  }
  
  // Beaucoup de données (> 10) → Table
  if (dataCount > 10) {
    return 'table'
  }
  
  // 2-3 items → Cards
  if (dataCount <= 3) {
    return 'cards'
  }
  
  // 4-6 items avec couleurs → Doughnut
  if (dataCount <= 6 && hasColors) {
    return 'doughnut'
  }
  
  // 7-10 items → Bar
  if (dataCount <= 10) {
    return 'bar'
  }
  
  // Par défaut → Pie
  return 'pie'
})

// Données formatées pour le tableau
const tableData = computed(() => {
  return props.data.map((item, index) => ({
    index: index + 1,
    label: item.label || item.x || `Item ${index + 1}`,
    value: item.value || item.y || 0,
    color: item.color || '#3b82f6',
    percentage: totalValue.value > 0 
      ? ((item.value || item.y || 0) / totalValue.value * 100).toFixed(1) + '%'
      : '0%'
  }))
})

const tableColumns = computed(() => [
  { field: 'index', header: '#', sortable: true },
  { field: 'label', header: 'Libellé', sortable: true },
  { field: 'value', header: 'Valeur', sortable: true },
  { field: 'percentage', header: '%', sortable: true },
  { field: 'color', header: 'Couleur', sortable: false }
])

const totalValue = computed(() => {
  return props.data.reduce((sum, item) => sum + (item.value || item.y || 0), 0)
})

function getChartComponent(type) {
  const components = {
    pie: PieChart,
    doughnut: DoughnutChart,
    bar: BarChart,
    line: LineChart
  }
  return components[type] || PieChart
}

function getTooltip(type) {
  const tooltip = type.tooltip
  return type.value === suggestedType.value 
    ? `${tooltip} ✓ (Suggéré)`
    : tooltip
}

function exportData() {
  const csv = [
    ['Label', 'Valeur', 'Pourcentage'],
    ...tableData.value.map(row => [
      row.label,
      row.value,
      row.percentage
    ])
  ].map(row => row.join(',')).join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${props.title || 'data'}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
  
  emit('export', { data: props.data, csv })
}

onMounted(() => {
  selectedType.value = props.defaultType || suggestedType.value
})
</script>

<style scoped>
.smart-visualization {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.viz-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--surface-card);
  border-radius: 8px;
}

.viz-type-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.viz-buttons {
  display: flex;
  gap: 0.375rem;
  flex-wrap: wrap;
}

.viz-actions {
  display: flex;
  gap: 0.375rem;
}

.suggested-type {
  position: relative;
}

.suggested-type::after {
  content: '✓';
  position: absolute;
  top: -4px;
  right: -4px;
  background: #10b981;
  color: white;
  font-size: 10px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.viz-display {
  background: var(--surface-card);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgba(0, 0, 0, 0.05);
}

/* Stats Cards Grid */
.stats-cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.stat-card {
  border-left: 4px solid;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
}

.stat-card-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.stat-icon {
  width: 4rem;
  height: 4rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-color);
  line-height: 1;
}

.stat-percentage {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}

/* Numbers Grid */
.numbers-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.number-item {
  padding: 1.5rem;
  background: var(--surface-50);
  border-radius: 8px;
  border-left: 4px solid;
  transition: all 0.3s;
}

.number-item:hover {
  background: var(--surface-100);
  transform: translateX(4px);
}

.number-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-bottom: 0.5rem;
}

.number-value {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  line-height: 1;
}

.number-bar {
  height: 4px;
  background: var(--surface-200);
  border-radius: 2px;
  overflow: hidden;
}

.number-bar-fill {
  height: 100%;
  transition: width 0.5s ease;
}

.color-badge {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 2px solid var(--surface-border);
}

.no-data-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

@media (max-width: 768px) {
  .viz-controls {
    padding: 0.5rem;
    gap: 0.5rem;
  }
  
  .viz-buttons {
    gap: 0.25rem;
  }
  
  .viz-display {
    padding: 0.75rem;
  }
  
  .stats-cards-grid,
  .numbers-grid {
    grid-template-columns: 1fr;
  }
  
  .number-item {
    padding: 1rem;
  }
}
</style>
