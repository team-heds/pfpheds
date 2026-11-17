<template>
  <div class="chart-wrapper" :style="{ height: height + 'px' }" :role="chartData ? 'img' : 'status'" :aria-label="accessibleLabel || title || 'Graphique en barres'">
    <Bar v-if="chartData" :data="chartData" :options="chartOptions" />
    <p v-else class="chart-empty">Aucune donnée disponible</p>
  </div>
</template>

<script setup>
import { useTheme } from '@/theme/useTheme'
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
  },
  textColor: String,
  accessibleLabel: String
})

// Couleur du texte selon le thème de la plateforme (service unique).
const { isDark } = useTheme()
const resolvedTextColor = computed(() => (isDark.value ? 'rgba(255, 255, 255, 0.87)' : '#4b5563'))

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

const chartOptions = computed(() => {
  const textColorToUse = props.textColor || resolvedTextColor.value
  
  return {
    indexAxis: props.horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    color: textColorToUse,
    plugins: {
      legend: {
        display: false,
        labels: {
          color: textColorToUse,
          font: { size: 12 }
        }
      },
      title: {
        display: !!props.title,
        text: props.title,
        color: textColorToUse,
        font: { size: 16, weight: 'bold' },
        padding: { bottom: 20 }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        titleColor: '#fff',
        bodyColor: '#fff',
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
          color: 'rgba(255, 255, 255, 0.06)'
        },
        ticks: {
          color: textColorToUse,
          font: { size: 12 }
        }
      },
      y: {
        stacked: props.stacked,
        beginAtZero: true,
        grid: {
          display: props.horizontal,
          drawBorder: false,
          color: 'rgba(255, 255, 255, 0.06)'
        },
        ticks: {
          color: textColorToUse,
          font: { size: 12 }
        }
      }
    }
  }
})
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
}
.chart-empty { display:grid;place-items:center;height:100%;margin:0;color:var(--text-color-secondary); }
</style>
