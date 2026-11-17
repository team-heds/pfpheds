<template>
  <div class="chart-wrapper" :style="{ height: height + 'px' }" :role="chartData ? 'img' : 'status'" :aria-label="accessibleLabel || label || 'Graphique en ligne'">
    <Line v-if="chartData" :data="chartData" :options="chartOptions" />
    <p v-else class="chart-empty">Aucune donnée disponible</p>
  </div>
</template>

<script setup>
import { useTheme } from '@/theme/useTheme'
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

const props = defineProps({
  data: {
    type: Array,
    required: true
    // Format: [{ x: 'Jan', y: 45 }, { x: 'Feb', y: 52 }, ...]
  },
  label: String,
  color: {
    type: String,
    default: '#3b82f6'
  },
  height: {
    type: Number,
    default: 300
  },
  fill: {
    type: Boolean,
    default: true
  },
  showPoints: {
    type: Boolean,
    default: true
  },
  smooth: {
    type: Boolean,
    default: true
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
    labels: props.data.map(d => d.x || d.label),
    datasets: [{
      label: props.label || 'Données',
      data: props.data.map(d => d.y || d.value),
      borderColor: props.color,
      backgroundColor: props.fill ? `${props.color}20` : 'transparent',
      borderWidth: 3,
      fill: props.fill,
      tension: props.smooth ? 0.4 : 0,
      pointRadius: props.showPoints ? 4 : 0,
      pointHoverRadius: props.showPoints ? 6 : 4,
      pointBackgroundColor: props.color,
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointHoverBackgroundColor: props.color,
      pointHoverBorderColor: '#fff',
      pointHoverBorderWidth: 3
    }]
  }
})

const chartOptions = computed(() => {
  const textColorToUse = props.textColor || resolvedTextColor.value
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    color: textColorToUse,
    plugins: {
      legend: {
        display: !!props.label,
        position: 'top',
        labels: {
          padding: 15,
          color: textColorToUse,
          font: { size: 12 }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        cornerRadius: 8,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        titleColor: '#fff',
        bodyColor: '#fff',
        mode: 'index',
        intersect: false
      }
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: textColorToUse,
          font: { size: 12 }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(255, 255, 255, 0.06)',
          drawBorder: false
        },
        ticks: {
          color: textColorToUse,
          font: { size: 12 }
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
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
