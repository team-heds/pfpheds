<template>
  <div ref="wrapperRef" class="chart-wrapper" :style="{ height: height + 'px' }">
    <Pie v-if="chartData" :data="chartData" :options="chartOptions" />
  </div>
</template>

<script setup>
import { computed, ref, onMounted, markRaw, shallowRef } from 'vue'
import { Pie } from 'vue-chartjs'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)
const ForceLegendColorPlugin = {
  id: 'forceLegendColor',
  beforeUpdate(chart, args, opts) {
    if (chart && chart.options && chart.options.plugins && chart.options.plugins.legend) {
      chart.options.plugins.legend.labels = chart.options.plugins.legend.labels || {}
      chart.options.plugins.legend.labels.color = opts && opts.color ? opts.color : chart.options.plugins.legend.labels.color
    }
  }
}
ChartJS.register(ForceLegendColorPlugin)

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
  showLegend: {
    type: Boolean,
    default: true
  },
  showPercentage: {
    type: Boolean,
    default: true
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
      borderWidth: 2,
      hoverOffset: 10
    }]
  }
})

function pickTextColor() {
  const css = getComputedStyle(document.documentElement)
  const varText = css.getPropertyValue('--text-color')?.trim()
  const surface = css.getPropertyValue('--surface-card')?.trim() || css.getPropertyValue('--surface-ground')?.trim()
  // If surface is rgb/hex, compute luminance to pick contrast color
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

const legendColor = ref('#e5e7eb')
const wrapperRef = ref(null)

function parseColorToRGB(c) {
  if (!c) return null
  if (c.startsWith('#')) {
    const n = c.replace('#','')
    const bigint = parseInt(n.length === 3 ? n.split('').map(x=>x+x).join('') : n, 16)
    return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255, a: 1 }
  }
  const m = c.match(/rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([0-9\.]+))?\)/i)
  if (m) return { r: +m[1], g: +m[2], b: +m[3], a: m[4] !== undefined ? +m[4] : 1 }
  return null
}

function luminance({r,g,b}) {
  const a = [r,g,b].map(v => { v/=255; return v<=0.03928? v/12.92 : Math.pow(((v+0.055)/1.055),2.4) })
  return 0.2126*a[0] + 0.7152*a[1] + 0.0722*a[2]
}

function effectiveBackground(el) {
  let node = el
  for (let i=0; i<10 && node; i++) {
    const bg = getComputedStyle(node).backgroundColor
    const rgba = parseColorToRGB(bg)
    if (rgba && rgba.a > 0 && bg !== 'transparent') return rgba
    node = node.parentElement
  }
  const bodyBg = getComputedStyle(document.body).backgroundColor
  return parseColorToRGB(bodyBg) || { r: 255, g: 255, b: 255, a: 1 }
}

onMounted(() => {
  const rgb = effectiveBackground(wrapperRef.value || document.body)
  const color = luminance(rgb) < 0.5 ? '#e5e7eb' : '#111827'
  legendColor.value = props.textColor || color
})

const chartOptions = computed(() => {
  // Utiliser props.textColor s'il est fourni, sinon détecter automatiquement
  const textColorToUse = props.textColor || pickTextColor()
  
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      forceLegendColor: { color: textColorToUse },
      legend: {
        display: props.showLegend,
        position: 'right',
        labels: {
          padding: 15,
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
                  text: props.showPercentage 
                    ? `${label} (${percentage}%)`
                    : `${label} - ${value} (${percentage}%)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i,
                  fontColor: textColorToUse
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
  
  // NE PAS GELER chartOptions - Chart.js a besoin de les modifier
  // On gèle SEULEMENT chartData
  return options
})

// Note: Avoid setting global Chart.js defaults with reactive refs to prevent
// potential reactive loops when switching chart types. Legend colors are
// enforced via options and the ForceLegendColor plugin.

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
</style>
