<template>
  <div class="chart-wrapper" :style="{ height: height + 'px' }">
    <Doughnut v-if="chartData" :data="chartData" :options="chartOptions" />
    <div v-if="showCenterText" class="center-text">
      <div class="center-value">{{ centerValue }}</div>
      <div class="center-label">{{ centerLabel }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { Doughnut } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  data: {
    type: Array,
    required: true
  },
  title: String,
  height: {
    type: Number,
    default: 300
  },
  showLegend: {
    type: Boolean,
    default: true
  },
  showCenterText: {
    type: Boolean,
    default: false
  },
  centerValue: String,
  centerLabel: String,
  cutout: {
    type: String,
    default: '70%'
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
  // Observer le changement de thème
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
      data: props.data.map(d => d.value),
      backgroundColor: props.data.map(d => d.color || generateColor()),
      borderColor: '#fff',
      borderWidth: 3,
      hoverOffset: 8
    }]
  }
})

const chartOptions = computed(() => {
  const textColorToUse = props.textColor || resolvedTextColor.value
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: props.cutout,
    color: textColorToUse,
    plugins: {
      legend: {
        display: props.showLegend,
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'rectRounded',
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          color: textColorToUse
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
        titleColor: '#fff',
        bodyColor: '#fff',
        callbacks: {
          label: (context) => {
            const label = context.label || ''
            const value = context.parsed
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            return ` ${label}: ${value} (${percentage}%)`
          }
        }
      }
    }
  }
})

function generateColor() {
  const colors = [
    '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', 
    '#ec4899', '#14b8a6', '#f97316', '#6366f1'
  ]
  return colors[Math.floor(Math.random() * colors.length)]
}
</script>

<style scoped>
.chart-wrapper {
  position: relative;
  width: 100%;
}

.center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
}

.center-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-color);
  line-height: 1;
}

.center-label {
  font-size: 0.875rem;
  color: var(--text-color-secondary);
  margin-top: 0.25rem;
}
</style>
