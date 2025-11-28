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
          @click="selectedType = type.value"
          size="small"
          v-tooltip.top="type.tooltip"
        />
      </div>
      
      <Button
        v-if="showRefresh"
        icon="pi pi-refresh"
        @click="$emit('refresh')"
        outlined
        size="small"
        v-tooltip.top="'Actualiser'"
      />
    </div>

    <!-- Chart Display -->
    <div class="chart-display">
      <component
        :is="currentChartComponent"
        v-bind="currentChartProps"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
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

const selectedType = ref(props.defaultType)

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

const currentChartComponent = computed(() => {
  switch (selectedType.value) {
    case 'pie':
      return PieChart
    case 'doughnut':
      return DoughnutChart
    case 'bar':
    case 'horizontal-bar':
      return BarChart
    case 'line':
      return LineChart
    default:
      return PieChart
  }
})

const currentChartProps = computed(() => {
  const baseProps = {
    data: props.data,
    title: props.title,
    height: props.height
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
  background: var(--surface-50);
  border-radius: 8px;
}

.chart-type-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.chart-display {
  padding: 1rem;
  background: var(--surface-card);
  border-radius: 8px;
  border: 1px solid var(--surface-border);
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
