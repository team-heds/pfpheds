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
import { computed, markRaw } from 'vue'
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

function pickTextColor() {
  const css = getComputedStyle(document.documentElement)
  const varText = css.getPropertyValue('--text-color')?.trim()
  const surface = css.getPropertyValue('--surface-card')?.trim() || css.getPropertyValue('--surface-ground')?.trim()
  function parse(c) {
    if (!c) return null
    if (c.startsWith('#')) {
      const n = c.replace('#','')
      const bigint = parseInt(n.length === 3 ? n.split('').map(x=>x+x).join('') : n, 16)
      const r = (bigint >> 16) & 255, g = (bigint >> 8) & 255, b = bigint & 255
      return {r,g,b}
    }
    const m = c.match(/rgb\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\)/i)
    if (m) return { r: +m[1], g: +m[2], b: +m[3] }
    return null
  }
  function luminance({r,g,b}) {
    const a = [r,g,b].map(v => { v/=255; return v<=0.03928? v/12.92 : Math.pow(((v+0.055)/1.055),2.4) })
    return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2]
  }
  const p = parse(surface)
  if (p) return luminance(p) < 0.5 ? '#e5e7eb' : '#111827'
  const bodyBg = getComputedStyle(document.body).backgroundColor
  const pb = parse(bodyBg)
  if (pb) return luminance(pb) < 0.5 ? '#e5e7eb' : '#111827'
  return varText || '#e5e7eb'
}

const chartOptions = computed(() => {
  // Utiliser props.textColor s'il est fourni, sinon détecter automatiquement
  const textColorToUse = props.textColor || pickTextColor()
  
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: props.cutout,
    plugins: {
      legend: {
        display: props.showLegend,
        position: 'bottom',
        labels: {
          padding: 20,
          font: {
            size: 12,
            family: 'Inter, system-ui, sans-serif'
          },
          color: textColorToUse,
        generateLabels: (chart) => {
          const data = chart.data
          if (data.labels.length && data.datasets.length) {
            const total = data.datasets[0].data.reduce((a, b) => a + b, 0)
            return data.labels.map((label, i) => {
              const value = data.datasets[0].data[i]
              const percentage = ((value / total) * 100).toFixed(1)
              return {
                text: `${label} - ${value} (${percentage}%)`,
                fillStyle: data.datasets[0].backgroundColor[i],
                hidden: false,
                index: i
              }
            })
          }
          return []
        }
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
          return `${label}: ${value} (${percentage}%)`
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
