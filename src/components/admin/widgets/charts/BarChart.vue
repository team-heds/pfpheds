<template>
  <div class="chart-wrapper" :style="{ height: height + 'px' }">
    <Bar v-if="chartData" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Bar } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const props = defineProps({
  data: {
    type: Array,
    required: true
    // Format: [{ label: 'BA23', value: 61, color: '#3b82f6' }, ...]
  },
  title: String,
  height: {
    type: Number,
    default: 300
  },
  horizontal: {
    type: Boolean,
    default: false
  },
  showValues: {
    type: Boolean,
    default: true
  },
  stacked: {
    type: Boolean,
    default: false
  }
})

const chartData = computed(() => {
  if (!props.data || props.data.length === 0) return null

  return {
    labels: props.data.map(d => d.label),
    datasets: [{
      label: props.title || 'Données',
      data: props.data.map(d => d.value),
      backgroundColor: props.data.map(d => d.color || '#3b82f6'),
      borderColor: props.data.map(d => d.color || '#3b82f6'),
      borderWidth: 0,
      borderRadius: 8,
      borderSkipped: false
    }]
  }
})

const chartOptions = computed(() => ({
  indexAxis: props.horizontal ? 'y' : 'x',
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      display: false
    },
    title: {
      display: !!props.title,
      text: props.title,
      font: {
        size: 16,
        weight: 'bold'
      },
      padding: {
        bottom: 20
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      padding: 12,
      cornerRadius: 8,
      titleFont: {
        size: 14,
        weight: 'bold'
      },
      bodyFont: {
        size: 13
      },
      callbacks: {
        label: (context) => {
          return `${context.parsed.y || context.parsed.x} étudiants`
        }
      }
    }
  },
  scales: {
    x: {
      stacked: props.stacked,
      grid: {
        display: !props.horizontal,
        drawBorder: false,
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          size: 12
        }
      }
    },
    y: {
      stacked: props.stacked,
      beginAtZero: true,
      grid: {
        display: props.horizontal,
        drawBorder: false,
        color: 'rgba(0, 0, 0, 0.05)'
      },
      ticks: {
        font: {
          size: 12
        }
      }
    }
  }
}))
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
}
</style>
