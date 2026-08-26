<template>
  <section class="period-comparison-panel" aria-labelledby="comparison-title">
    <div class="comparison-header mb-4">
      <h3 id="comparison-title" class="text-xl font-bold text-900 m-0 mb-2">
        <i class="pi pi-chart-line mr-2" aria-hidden="true"></i>
        Comparaison de périodes
      </h3>
      <p class="text-600 m-0">
        {{ periodLabel }} comparée à la période précédente, selon les données historiques disponibles.
      </p>
    </div>

    <div v-if="comparisonData.length" class="grid">
      <div v-for="kpi in comparisonData" :key="kpi.id" class="col-12 md:col-6 lg:col-4">
        <Card class="comparison-card">
          <template #header>
            <div class="flex align-items-center justify-content-between p-3 gap-2">
              <div class="flex align-items-center gap-2">
                <i :class="kpi.icon" :style="{ color: kpi.color }" aria-hidden="true"></i>
                <span class="font-semibold">{{ kpi.label }}</span>
              </div>
              <Tag :value="variationText(kpi)" :severity="variationSeverity(kpi)" />
            </div>
          </template>
          <template #content>
            <div class="flex justify-content-between gap-3">
              <div>
                <div class="text-sm text-600">Actuelle</div>
                <div class="text-2xl font-bold text-900">{{ format(kpi.currentValue) }}</div>
              </div>
              <div class="text-right">
                <div class="text-sm text-600">Précédente</div>
                <div class="text-xl font-semibold text-700">{{ format(kpi.previousValue) }}</div>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>

    <Message v-else severity="info" :closable="false">
      L'historique nécessaire à la comparaison n'est pas disponible pour cette période.
    </Message>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import Card from 'primevue/card'
import Tag from 'primevue/tag'
import Message from 'primevue/message'

const props = defineProps({
  kpis: { type: Array, required: true },
  period: { type: String, default: 'month' },
})
const PERIOD_LABELS = Object.freeze({
  day: 'La journée',
  week: 'La semaine',
  month: 'Le mois',
  quarter: 'Le trimestre',
  year: "L'année",
})
const periodLabel = computed(() => PERIOD_LABELS[props.period] || 'La période')
const comparisonData = computed(() => props.kpis.flatMap((kpi) => {
  const comparison = kpi.comparisonData
  if (kpi.status !== 'ok' || comparison?.status !== 'ok') return []
  if (!Number.isFinite(kpi.value) || !Number.isFinite(comparison.value)) return []
  return [{
    ...kpi,
    currentValue: kpi.value,
    previousValue: comparison.value,
    percentChange: comparison.percentChange,
  }]
}))

const format = (value) => value.toLocaleString('fr-CH')
const variation = (kpi) => Number.isFinite(kpi.percentChange)
  ? kpi.percentChange
  : (kpi.previousValue === 0 ? null : ((kpi.currentValue - kpi.previousValue) / kpi.previousValue) * 100)
const variationText = (kpi) => {
  const value = variation(kpi)
  if (value === null) return 'N/A'
  const rounded = Math.round(value * 10) / 10
  return `${rounded > 0 ? '+' : ''}${rounded}%`
}
const variationSeverity = (kpi) => {
  const value = variation(kpi)
  if (value === null) return 'secondary'
  if (value > 5) return 'success'
  if (value < -5) return 'warning'
  return 'info'
}
</script>

<style scoped>
.period-comparison-panel{background:var(--surface-card);border:1px solid var(--surface-border);border-radius:12px;padding:1.5rem}.comparison-card{height:100%}
</style>
