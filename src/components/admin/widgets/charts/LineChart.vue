<template>
  <div class="chart-wrapper" :style="{ height: height + 'px' }">
    <Line v-if="chartData" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
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
    responsive: true,
    maintainAspectRatio: false,
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
