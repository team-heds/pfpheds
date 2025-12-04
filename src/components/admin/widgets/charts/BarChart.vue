<template>
  <div class="chart-wrapper" :style="{ height: height + 'px' }">
    <Bar v-if="chartData" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed, markRaw } from 'vue'
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
  return varText || '#e5e7eb'
}

const chartOptions = computed(() => {
  // Utiliser props.textColor s'il est fourni, sinon détecter automatiquement
  const textColorToUse = props.textColor || pickTextColor()
  
  return {
    indexAxis: props.horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
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
      padding: {
        bottom: 20
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
