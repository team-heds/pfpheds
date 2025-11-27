<template>
  <div class="period-comparison-panel">
    <div class="comparison-header mb-4">
      <h3 class="text-xl font-bold text-900 m-0 mb-2">
        <i class="pi pi-chart-line mr-2"></i>
        Comparaison de périodes
      </h3>
      
      <div class="flex gap-3 flex-wrap">
        <!-- Période actuelle -->
        <div class="flex-1">
          <label class="text-sm font-semibold text-600 mb-2 block">Période actuelle</label>
          <Dropdown
            v-model="currentPeriod"
            :options="periodOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner"
            class="w-full"
          />
        </div>

        <!-- Période de comparaison -->
        <div class="flex-1">
          <label class="text-sm font-semibold text-600 mb-2 block">Comparer avec</label>
          <Dropdown
            v-model="comparePeriod"
            :options="comparePeriodOptions"
            optionLabel="label"
            optionValue="value"
            placeholder="Sélectionner"
            class="w-full"
          />
        </div>

        <!-- Bouton appliquer -->
        <div class="flex align-items-end">
          <Button
            label="Comparer"
            icon="pi pi-refresh"
            @click="applyComparison"
            :loading="loading"
          />
        </div>
      </div>
    </div>

    <!-- Résultats de comparaison -->
    <div v-if="comparisonData" class="comparison-results">
      <div class="grid">
        <div
          v-for="kpi in comparisonData"
          :key="kpi.id"
          class="col-12 md:col-6 lg:col-4"
        >
          <Card class="comparison-card">
            <template #header>
              <div class="flex align-items-center justify-content-between p-3">
                <div class="flex align-items-center gap-2">
                  <i :class="kpi.icon" :style="{ color: kpi.color }"></i>
                  <span class="font-semibold">{{ kpi.label }}</span>
                </div>
                <Tag
                  :value="getVariationText(kpi)"
                  :severity="getVariationSeverity(kpi)"
                />
              </div>
            </template>

            <template #content>
              <!-- Valeurs -->
              <div class="flex justify-content-between mb-3">
                <div>
                  <div class="text-sm text-600">Actuelle</div>
                  <div class="text-2xl font-bold text-900">
                    {{ kpi.currentValue.toLocaleString() }}
                  </div>
                </div>
                <div class="text-right">
                  <div class="text-sm text-600">Précédente</div>
                  <div class="text-xl font-semibold text-700">
                    {{ kpi.previousValue.toLocaleString() }}
                  </div>
                </div>
              </div>

              <!-- Graphique mini comparaison -->
              <div class="comparison-chart mb-3">
                <div class="flex items-end h-4rem gap-1">
                  <div
                    class="comparison-bar"
                    :style="{
                      height: getBarHeight(kpi.previousValue, kpi.currentValue) + '%',
                      background: `${kpi.color}40`
                    }"
                  >
                    <span class="bar-label">Avant</span>
                  </div>
                  <div
                    class="comparison-bar"
                    :style="{
                      height: '100%',
                      background: kpi.color
                    }"
                  >
                    <span class="bar-label">Maintenant</span>
                  </div>
                </div>
              </div>

              <!-- Statistiques additionnelles -->
              <div class="stats-grid">
                <div class="stat-item">
                  <i class="pi pi-arrow-up-right text-sm text-600"></i>
                  <span class="text-sm text-600">Variation</span>
                  <span class="text-sm font-bold" :class="getVariationClass(kpi)">
                    {{ getAbsoluteVariation(kpi) }}
                  </span>
                </div>
                <div class="stat-item">
                  <i class="pi pi-percentage text-sm text-600"></i>
                  <span class="text-sm text-600">Pourcentage</span>
                  <span class="text-sm font-bold" :class="getVariationClass(kpi)">
                    {{ getPercentageVariation(kpi) }}%
                  </span>
                </div>
              </div>
            </template>
          </Card>
        </div>
      </div>
    </div>

    <!-- État vide -->
    <div v-else class="text-center p-5">
      <i class="pi pi-chart-bar text-6xl text-300 mb-3"></i>
      <p class="text-600">Sélectionnez des périodes pour comparer les KPI</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import Card from 'primevue/card'
import Tag from 'primevue/tag'

const props = defineProps({
  kpis: { type: Array, required: true }
})

const emit = defineEmits(['compare'])

const loading = ref(false)
const currentPeriod = ref('7d')
const comparePeriod = ref('previous')
const comparisonData = ref(null)

const periodOptions = [
  { label: 'Derniers 7 jours', value: '7d' },
  { label: 'Derniers 30 jours', value: '30d' },
  { label: 'Derniers 90 jours', value: '90d' },
  { label: 'Cette année', value: 'year' },
  { label: 'Personnalisé', value: 'custom' }
]

const comparePeriodOptions = computed(() => {
  const options = [
    { label: 'Période précédente', value: 'previous' }
  ]
  
  if (currentPeriod.value !== 'year') {
    options.push({ label: 'Même période année dernière', value: 'last_year' })
  }
  
  options.push(
    { label: 'Début de l\'année', value: 'year_start' },
    { label: 'Personnalisé', value: 'custom' }
  )
  
  return options
})

async function applyComparison() {
  loading.value = true
  
  // Simuler chargement (remplacer par vrai appel API)
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // Générer données de comparaison (à remplacer par vraies données)
  comparisonData.value = props.kpis.map(kpi => {
    const variation = (Math.random() - 0.3) * 0.4 // -30% à +40%
    const previousValue = Math.round(kpi.value / (1 + variation))
    
    return {
      ...kpi,
      currentValue: kpi.value,
      previousValue,
      variation: ((kpi.value - previousValue) / previousValue) * 100
    }
  })
  
  emit('compare', {
    currentPeriod: currentPeriod.value,
    comparePeriod: comparePeriod.value,
    data: comparisonData.value
  })
  
  loading.value = false
}

function getVariationText(kpi) {
  const variation = getPercentageVariation(kpi)
  if (variation > 0) return `+${variation}%`
  return `${variation}%`
}

function getVariationSeverity(kpi) {
  const variation = getPercentageVariation(kpi)
  if (variation > 20) return 'success'
  if (variation > 5) return 'info'
  if (variation < -20) return 'danger'
  if (variation < -5) return 'warning'
  return 'secondary'
}

function getVariationClass(kpi) {
  const variation = getPercentageVariation(kpi)
  if (variation > 0) return 'text-green-500'
  if (variation < 0) return 'text-red-500'
  return 'text-600'
}

function getAbsoluteVariation(kpi) {
  const diff = kpi.currentValue - kpi.previousValue
  return diff > 0 ? `+${diff.toLocaleString()}` : diff.toLocaleString()
}

function getPercentageVariation(kpi) {
  if (kpi.previousValue === 0) return 0
  const percent = ((kpi.currentValue - kpi.previousValue) / kpi.previousValue) * 100
  return Math.round(percent * 10) / 10
}

function getBarHeight(previousValue, currentValue) {
  const max = Math.max(previousValue, currentValue)
  return (previousValue / max) * 100
}
</script>

<style scoped>
.period-comparison-panel {
  background: var(--surface-card);
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.comparison-card {
  height: 100%;
  transition: all 0.3s ease;
}

.comparison-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}

.comparison-chart {
  background: var(--surface-100);
  border-radius: 8px;
  padding: 0.75rem;
}

.comparison-bar {
  flex: 1;
  border-radius: 4px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 0.5rem;
  transition: all 0.3s ease;
  min-height: 2rem;
}

.bar-label {
  font-size: 0.625rem;
  font-weight: 600;
  color: var(--text-color);
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--surface-border);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
</style>
