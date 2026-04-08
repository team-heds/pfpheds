<template>
  <div class="chart-wrapper" :style="{ height: height + 'px' }">
    <Bar v-if="chartData" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
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
</style>
