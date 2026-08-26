<template>
  <div 
    class="kpi-card" 
    :class="[
      `kpi-${variant}`, 
      `kpi-size-${size}`,
      { 'kpi-loading': loading, 'kpi-clickable': clickable }
    ]"
    :style="{ '--kpi-color': color }"
    :role="clickable ? 'button' : undefined"
    :tabindex="clickable ? 0 : undefined"
    :aria-label="clickable ? `${label} : ${formattedValue}. Ouvrir les détails` : undefined"
    @click="clickable && $emit('action')"
    @keydown.enter="clickable && $emit('action')"
    @keydown.space.prevent="clickable && $emit('action')"
  >
    <Skeleton v-if="loading" height="140px" borderRadius="12px" />
    
    <template v-else>
      <!-- Header avec icône et label -->
      <div class="kpi-header">
        <div class="kpi-icon" :style="{ background: `${color}15`, color }">
          <i :class="icon" class="text-xl"></i>
        </div>
        <div class="kpi-info">
          <span class="kpi-label">{{ label }}</span>
          <span v-if="subtitle" class="kpi-subtitle">{{ subtitle }}</span>
        </div>
      </div>

      <!-- Valeur principale avec animation -->
      <div class="kpi-value-section">
        <div class="kpi-value" :class="{ 'animate-value': animated, 'kpi-value--unavailable': !isAvailable }">
          {{ formattedValue }}
        </div>
        
        <!-- Tendance optionnelle -->
        <div v-if="trend !== null && trend !== undefined" class="kpi-trend" :class="trendClass">
          <i :class="trendIcon"></i>
          <span>{{ Math.abs(trend) }}%</span>
        </div>
      </div>

      <p v-if="!isAvailable" class="kpi-unavailable" role="status">
        Cette donnée est temporairement indisponible.
      </p>

      <!-- Charts optionnels -->
      <template v-if="showChart && chartData && chartData.length">
        <!-- Mini chart pour les KPI compacts -->
        <div v-if="chartType === 'mini'" class="kpi-mini-chart" @click.stop>
          <MiniChart 
            :data="chartData" 
            :color="color"
            :height="40"
          />
        </div>
        
        <!-- Chart Selector TEMPORAIREMENT DÉSACTIVÉ - Bug Chart.js/Vue3 -->
        <!-- TODO: Réactiver quand Chart.js sera compatible ou migration vers ECharts -->
        <div v-else-if="false && enableChartSelector" class="kpi-chart-selector" @click.stop>
          <ChartSelector
            :data="normalizedChartData"
            :default-type="chartType || 'auto'"
            :height="effectiveChartHeight"
            :chart-color="color"
            :show-refresh="false"
          />
        </div>
        
        <!-- Graphique simple fixe -->
        <div v-else class="kpi-chart" @click.stop>
          <component
            :is="getChartComponent(resolvedChartType)"
            :data="normalizedChartData"
            :height="effectiveChartHeight"
            :color="color"
            :text-color="themeTextColor"
            v-bind="chartProps"
          />
        </div>
      </template>

      <!-- Footer avec comparaison -->
      <div v-if="comparison || clickable" class="kpi-footer">
        <span v-if="comparison" class="kpi-compare">{{ comparison }}</span>
        <Button 
          v-if="clickable && actionLabel" 
          :label="actionLabel" 
          text 
          size="small"
          @click.stop="$emit('action')"
        />
      </div>
    </template>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import Skeleton from 'primevue/skeleton'
import Button from 'primevue/button'
import MiniChart from './MiniChart.vue'
import ChartSelector from './ChartSelector.vue'
import PieChart from './charts/PieChart.vue'
import DoughnutChart from './charts/DoughnutChart.vue'
import BarChart from './charts/BarChart.vue'
import LineChart from './charts/LineChart.vue'
import SimpleTable from './charts/SimpleTable.vue'

const props = defineProps({
  label: { type: String, required: true },
  subtitle: String,
  value: [Number, String],
  icon: { type: String, required: true },
  color: { type: String, default: '#3b82f6' },
  trend: Number, // +12 ou -5
  comparison: String,
  chartData: Array,
  showChart: { type: Boolean, default: false },
  chartType: { type: String, default: 'mini' }, // mini, pie, doughnut, bar, line, auto
  chartHeight: Number,
  chartProps: Object,
  enableChartSelector: { type: Boolean, default: false },
  animated: { type: Boolean, default: true },
  clickable: { type: Boolean, default: false },
  actionLabel: String,
  variant: { type: String, default: 'default' }, // default, compact, large
  size: { type: String, default: 'medium' }, // compact, small, medium, large, xlarge
  loading: { type: Boolean, default: false },
  status: { type: String, default: 'ok' }
})

defineEmits(['action'])

const formattedValue = computed(() => {
  if (!isAvailable.value) return 'Indisponible'
  if (typeof props.value === 'number') {
    return props.value.toLocaleString()
  }
  return props.value
})

const isAvailable = computed(() => props.status === 'ok' && props.value !== null && props.value !== undefined)

const trendClass = computed(() => ({
  'trend-up': props.trend > 0,
  'trend-down': props.trend < 0,
  'trend-neutral': props.trend === 0
}))

const trendIcon = computed(() => {
  if (props.trend > 0) return 'pi pi-arrow-up'
  if (props.trend < 0) return 'pi pi-arrow-down'
  return 'pi pi-minus'
})

function getChartComponent(type) {
  const components = {
    pie: PieChart,
    doughnut: DoughnutChart,
    bar: BarChart,
    line: LineChart,
    mini: MiniChart,
    table: SimpleTable
  }
  return components[type] || MiniChart
}

// Couleurs cohérentes par label (BAxx, Non défini)
const CATEGORY_COLOR_MAP = {
  BA22: '#0ea5e9',
  BA23: '#3b82f6',
  BA24: '#8b5cf6',
  BA25: '#10b981',
  'NON DÉFINI': '#9ca3af',
  'NON DEFINI': '#9ca3af'
}

function getLabelColor(label) {
  const key = String(label || '').toUpperCase().trim()
  if (CATEGORY_COLOR_MAP[key]) return CATEGORY_COLOR_MAP[key]
  const match = key.match(/BA\s?(\d{2})/)
  if (match) {
    const ba = `BA${match[1]}`
    if (CATEGORY_COLOR_MAP[ba]) return CATEGORY_COLOR_MAP[ba]
  }
  return undefined
}

const normalizedChartData = computed(() => {
  const data = Array.isArray((/** @type {any} */(props)).chartData) ? (props.chartData) : []
  return data.map(d => ({
    ...d,
    color: d?.color || getLabelColor(d?.label)
  }))
})

// Variable réactive pour suivre les changements de thème
const isDarkMode = ref(false)

// Détecter le thème au montage
onMounted(() => {
  const updateTheme = () => {
    // Vérifier via le theme-link href (méthode HEdS)
    const themeLink = document.getElementById('theme-link')
    if (themeLink) {
      const href = themeLink.getAttribute('href') || ''
      if (href.includes('theme-dim') || href.includes('theme-dark')) { isDarkMode.value = true; return }
      if (href.includes('theme-light')) { isDarkMode.value = false; return }
    }
    // Fallback: vérifier les classes
    const root = document.documentElement
    const body = document.body
    isDarkMode.value = root.classList.contains('dark') || 
                       root.classList.contains('p-dark') || 
                       body.classList.contains('dark') || 
                       body.classList.contains('p-dark')
  }
  
  // Détecter le thème initial
  updateTheme()
  
  // Observer les changements de classes ET du theme-link
  const observer = new MutationObserver(updateTheme)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] })
  const themeLink = document.getElementById('theme-link')
  if (themeLink) observer.observe(themeLink, { attributes: true, attributeFilter: ['href'] })
  
  // Nettoyer l'observer
  onUnmounted(() => observer.disconnect())
})

const themeTextColor = computed(() => {
  // Forcer la mise à jour en fonction du mode sombre
  return isDarkMode.value ? '#e5e7eb' : '#111827'
})

function detectType(data) {
  if (!Array.isArray(data) || data.length === 0) return 'pie'
  const first = data[0]
  const isNumberArray = typeof first === 'number'
  const isTimeLikeObj = typeof first === 'object' && first !== null && (
    'date' in first || 'timestamp' in first || 'time' in first || 'x' in first
  )
  if (isNumberArray || isTimeLikeObj) return 'line'
  const categories = data.length
  if (categories <= 4) return 'doughnut'
  if (categories <= 7) return 'pie'
  return 'bar'
}

const resolvedChartType = computed(() => {
  if (props.chartType === 'auto') return detectType(props.chartData || [])
  return props.chartType
})

const effectiveChartHeight = computed(() => {
  if (props.chartHeight) return props.chartHeight
  const map = { compact: 110, small: 140, medium: 180, large: 220, xlarge: 280 }
  return map[props.size] || 180
})
</script>


<style scoped>
.kpi-card {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1rem;
  border: 1px solid var(--surface-border, rgba(148, 163, 184, 0.2));
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}


.kpi-card:hover {
  border-color: color-mix(in srgb, var(--kpi-color) 45%, var(--surface-border));
}

.kpi-clickable {
  cursor: pointer;
}

.kpi-clickable:hover {
  transform: translateY(-2px);
}

.kpi-clickable:active {
  transform: translateY(0);
}

.kpi-clickable:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--kpi-color) 55%, transparent);
  outline-offset: 3px;
}

.kpi-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.kpi-icon {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.kpi-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
  min-width: 0;
}

.kpi-label {
  font-weight: 600;
  font-size: 0.875rem;
  color: var(--text-color);
  line-height: 1.3;
}

.kpi-subtitle {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
  line-height: 1.2;
}

.kpi-value-section {
  display: flex;
  align-items: center; /* Centrer verticalement */
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: 0.25rem;
  flex: 1; /* Prendre l'espace disponible pour centrer le contenu */
}

.kpi-value {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
  letter-spacing: -0.02em;
}

.kpi-value--unavailable {
  font-size: 1rem;
  color: var(--text-color-secondary);
}

.kpi-unavailable {
  margin: -.5rem 0 0;
  color: var(--text-color-secondary);
  font-size: .75rem;
}

.animate-value {
  animation: fadeInUp 0.6s ease-out;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.kpi-trend {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  flex-shrink: 0;
}

.trend-up {
  background: rgba(34, 197, 94, 0.1);
  color: #22c55e;
}

.trend-down {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.trend-neutral {
  background: rgba(156, 163, 175, 0.1);
  color: #9ca3af;
}

.kpi-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  margin-top: auto;
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}

.kpi-compare {
  font-size: 0.75rem;
  color: var(--text-color-secondary);
}

/* Variants */
.kpi-compact {
  padding: 0.75rem;
}

.kpi-compact .kpi-value {
  font-size: 1.5rem;
}

.kpi-compact .kpi-icon {
  width: 36px;
  height: 36px;
}

.kpi-large {
  padding: 2rem;
}

.kpi-large .kpi-value {
  font-size: 3rem;
}

.kpi-large .kpi-icon {
  width: 64px;
  height: 64px;
}

/* Sizes - Adaptation selon taille du conteneur */
.kpi-size-compact .kpi-value {
  font-size: 1.25rem;
}

.kpi-size-compact .kpi-icon {
  width: 32px;
  height: 32px;
}

.kpi-size-compact .kpi-header {
  flex-direction: row;
  align-items: center;
  gap: 0.5rem;
}

.kpi-size-compact {
  padding: 1rem;
  min-height: 110px;
}

.kpi-size-compact .kpi-label {
  font-size: 0.8rem;
}

.kpi-size-compact .kpi-value {
  font-size: 1.6rem;
}

.kpi-size-compact .kpi-icon {
  width: 36px;
  height: 36px;
}

.kpi-size-small .kpi-value {
  font-size: 1.4rem;
}

.kpi-size-small .kpi-icon {
  width: 36px;
  height: 36px;
}

.kpi-size-medium .kpi-value {
  font-size: 1.75rem;
}

.kpi-size-large {
  padding: 1.25rem;
  min-height: 140px;
}

.kpi-size-large .kpi-value {
  font-size: 2.2rem;
}

.kpi-size-large .kpi-icon {
  width: 50px;
  height: 50px;
}

.kpi-size-large .kpi-label {
  font-size: 1rem;
}

.kpi-size-xlarge {
  padding: 2rem;
}

.kpi-size-xlarge .kpi-value {
  font-size: 3rem;
  font-weight: 800;
}

.kpi-size-xlarge .kpi-icon {
  width: 64px;
  height: 64px;
}

.kpi-size-xlarge .kpi-header {
  margin-bottom: 1.5rem;
}

.kpi-size-xlarge .kpi-label {
  font-size: 1.1rem;
}

.kpi-chart-selector {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--surface-border);
}

/* Responsive */
@media (max-width: 768px) {
  .kpi-card {
    padding: 1rem;
  }
  
  .kpi-value {
    font-size: 1.75rem;
  }
  
  .kpi-icon {
    width: 40px;
    height: 40px;
  }
}
</style>
