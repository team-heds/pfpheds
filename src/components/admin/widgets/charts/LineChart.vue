<template>
  <div class="chart-wrapper" :style="{ height: height + 'px' }">
    <Line v-if="chartData" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
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
  textColor: String
})

// Détection réactive du thème
const resolvedTextColor = ref('rgba(255, 255, 255, 0.87)')

function detectTextColor() {
  const themeLink = document.getElementById('theme-link')
  if (themeLink) {
    const href = themeLink.getAttribute('href') || ''
    if (href.includes('theme-light')) return '#4b5563'
    if (href.includes('theme-dim') || href.includes('theme-dark')) return 'rgba(255, 255, 255, 0.87)'
  }
  const cs = getComputedStyle(document.documentElement).colorScheme
  if (cs && cs.includes('dark')) return 'rgba(255, 255, 255, 0.87)'
  return '#4b5563'
}

onMounted(() => {
  resolvedTextColor.value = detectTextColor()
  const themeLink = document.getElementById('theme-link')
  if (themeLink) {
    const obs = new MutationObserver(() => { resolvedTextColor.value = detectTextColor() })
    obs.observe(themeLink, { attributes: true, attributeFilter: ['href'] })
  }
})

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
</style>
