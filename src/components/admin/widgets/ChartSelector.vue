<template>
  <div class="chart-selector-wrapper">
    <!-- Type Selector -->
    <div class="chart-controls">
      <div class="chart-type-buttons">
        <Button
          v-for="type in chartTypes"
          :key="type.value"
          :icon="type.icon"
          :label="type.label"
          :outlined="selectedType !== type.value"
          :severity="selectedType === type.value ? 'primary' : 'secondary'"
          @click.stop="onSelectType(type.value)"
          :disabled="switching"
          size="small"
          :title="type.tooltip"
        />
      </div>
      
      <Button
        v-if="showRefresh"
        icon="pi pi-refresh"
        @click="$emit('refresh')"
        outlined
        size="small"
        title="Actualiser"
      />
    </div>

    <!-- Chart Display -->
    <div class="chart-display" ref="displayRef">
      <!-- Loading state pendant le switch pour éviter les re-renders -->
      <div v-if="switching" class="chart-loading">
        <i class="pi pi-spin pi-spinner" style="font-size: 2rem; color: var(--primary-color)"></i>
        <span>Changement de vue...</span>
      </div>
      
      <!-- Wrapper avec v-if pour forcer destruction complète -->
      <div v-else-if="!switching" style="width: 100%; height: 100%">
        <PieChart
          v-if="selectedType === 'pie'"
          :key="remountKey + '-pie'"
          v-bind="currentChartProps"
        />
        <DoughnutChart
          v-else-if="selectedType === 'doughnut'"
          :key="remountKey + '-doughnut'"
          v-bind="currentChartProps"
        />
        <BarChart
          v-else-if="selectedType === 'bar' || selectedType === 'horizontal-bar'"
          :key="remountKey + '-bar'"
          v-bind="currentChartProps"
        />
        <LineChart
          v-else
          :key="remountKey + '-line'"
          v-bind="currentChartProps"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
// (removed ChartJS defaults usage to avoid reactive loops)
import Button from 'primevue/button'
import PieChart from './charts/PieChart.vue'
import DoughnutChart from './charts/DoughnutChart.vue'
import BarChart from './charts/BarChart.vue'
import LineChart from './charts/LineChart.vue'

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  title: String,
  defaultType: {
    type: String,
    default: 'pie'
  },
  height: {
    type: Number,
    default: 300
  },
  showRefresh: {
    type: Boolean,
    default: false
  },
  chartColor: {
    type: String,
    default: '#3b82f6'
  }
})

defineEmits(['refresh'])

// Mapping de couleurs cohérentes par label
const CATEGORY_COLOR_MAP = {
  BA22: '#0ea5e9',
  BA23: '#3b82f6',
  BA24: '#8b5cf6',
  BA25: '#10b981',
  'NON DÉFINI': '#9ca3af',
  'NON DEFINI': '#9ca3af',
}

function getLabelColor(label) {
  const key = String(label || '').toUpperCase().trim()
  if (CATEGORY_COLOR_MAP[key]) return CATEGORY_COLOR_MAP[key]
  // Détection BAxx générique
  const match = key.match(/BA\s?(\d{2})/)
  if (match) {
    const ba = `BA${match[1]}`
    if (CATEGORY_COLOR_MAP[ba]) return CATEGORY_COLOR_MAP[ba]
  }
  return undefined
}

function detectType(data) {
  if (!Array.isArray(data) || data.length === 0) return 'pie'
  const first = data[0]
  // Timeseries: array of numbers or objects with date-like keys
  const isNumberArray = typeof first === 'number'
  const isTimeLikeObj = typeof first === 'object' && first !== null && (
    'date' in first || 'timestamp' in first || 'time' in first || 'x' in first
  )
  if (isNumberArray || isTimeLikeObj) return 'line'

  // Categorical: [{ label, value }]
  const categories = data.length
  if (categories <= 4) return 'doughnut'
  if (categories <= 7) return 'pie'
  return 'horizontal-bar'
}

const userOverridden = ref(false)
const selectedType = ref(props.defaultType === 'auto' ? detectType(props.data) : props.defaultType)
const remountKey = ref(0)
const switching = ref(false)

function onSelectType(val) {
  if (switching.value || selectedType.value === val) return
  switching.value = true
  
  // Détruire complètement le chart actuel avant de changer
  setTimeout(() => {
    userOverridden.value = true
    selectedType.value = val
    remountKey.value++
    
    // Attendre 2 ticks pour vraiment stabiliser
    nextTick(() => {
      nextTick(() => {
        switching.value = false
      })
    })
  }, 50) // Délai plus long pour éviter les collisions
}

const chartTypes = [
  {
    value: 'pie',
    label: 'Camembert',
    icon: 'pi pi-chart-pie',
    tooltip: 'Diagramme en camembert'
  },
  {
    value: 'doughnut',
    label: 'Anneau',
    icon: 'pi pi-circle',
    tooltip: 'Diagramme en anneau'
  },
  {
    value: 'bar',
    label: 'Barres',
    icon: 'pi pi-chart-bar',
    tooltip: 'Diagramme en barres'
  },
  {
    value: 'horizontal-bar',
    label: 'Barres H',
    icon: 'pi pi-arrows-h',
    tooltip: 'Barres horizontales'
  },
  {
    value: 'line',
    label: 'Ligne',
    icon: 'pi pi-chart-line',
    tooltip: 'Graphique en ligne'
  }
]


const normalizedData = computed(() => {
  if (!Array.isArray(props.data)) return []
  return props.data.map(d => ({
    ...d,
    color: d?.color || getLabelColor(d?.label)
  }))
})

const displayRef = ref(null)
const themeTextColor = ref('#e5e7eb')

function parseColorToRGB(c) {
  if (!c) return null
  if (c.startsWith('#')) {
    const n = c.replace('#','')
    const bigint = parseInt(n.length === 3 ? n.split('').map(x=>x+x).join('') : n, 16)
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 }
  }
  const m = c.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i)
  if (m) return { r: +m[1], g: +m[2], b: +m[3] }
  return null
}

function luminance({r,g,b}) {
  const a = [r,g,b].map(v => { v/=255; return v<=0.03928? v/12.92 : Math.pow(((v+0.055)/1.055),2.4) })
  return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2]
}

function computeThemeTextColor() {
  let node = displayRef.value || document.body
  for (let i=0; i<10 && node; i++) {
    const bg = getComputedStyle(node).backgroundColor
    const rgb = parseColorToRGB(bg)
    if (rgb) {
      return luminance(rgb) < 0.5 ? '#e5e7eb' : '#111827'
    }
    node = node.parentElement
  }
  return '#e5e7eb'
}

onMounted(() => {
  const c = computeThemeTextColor()
  themeTextColor.value = c
})

const currentChartProps = computed(() => {
  const baseProps = {
    data: normalizedData.value,
    title: props.title,
    height: props.height,
    textColor: themeTextColor.value
  }

  switch (selectedType.value) {
    case 'pie':
      return {
        ...baseProps,
        showLegend: true,
        showPercentage: true
      }
    case 'doughnut':
      const total = props.data.reduce((sum, d) => sum + d.value, 0)
      return {
        ...baseProps,
        showLegend: true,
        showCenterText: true,
        centerValue: total.toString(),
        centerLabel: 'Total',
        cutout: '70%'
      }
    case 'bar':
      return {
        ...baseProps,
        horizontal: false,
        showValues: true
      }
    case 'horizontal-bar':
      return {
        ...baseProps,
        horizontal: true,
        showValues: true
      }
    case 'line':
      return {
        ...baseProps,
        label: props.title,
        color: props.chartColor,
        fill: true,
        showPoints: true,
        smooth: true
      }
    default:
      return baseProps
  }
})

// Note: Global Chart.js defaults removed; charts receive textColor via props.
</script>

<style scoped>
.chart-selector-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 8px;
  color: var(--text-color);
}

.chart-type-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

:deep(.chart-type-buttons .p-button) {
  color: var(--text-color) !important;
  border-color: var(--surface-border) !important;
}

:deep(.chart-type-buttons .p-button.p-button-outlined) {
  color: var(--text-color) !important;
}

.chart-display {
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: var(--text-color);
  font-size: 1rem;
  opacity: 0.7;
}

@media (max-width: 768px) {
  .chart-controls {
    flex-direction: column;
    align-items: stretch;
  }
  
  .chart-type-buttons {
    justify-content: center;
  }
}
</style>
