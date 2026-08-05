<template>
  <article class="dashboard-stat" :aria-label="loading ? `${label} : chargement` : `${label}: ${value}`" :aria-busy="loading">
    <template v-if="loading">
      <div class="dashboard-stat__skeleton">
        <Skeleton width="7rem" height=".875rem" />
        <Skeleton width="4.5rem" height="2.25rem" />
        <Skeleton width="5.5rem" height=".75rem" />
      </div>
      <Skeleton shape="circle" size="3rem" />
    </template>
    <template v-else>
    <div class="dashboard-stat__copy">
      <span class="dashboard-stat__label">{{ label }}</span>
      <strong class="dashboard-stat__value">{{ value }}</strong>
      <span class="dashboard-stat__caption">{{ caption }}</span>
    </div>
    <span class="dashboard-stat__icon" :style="{ '--stat-color': color }" aria-hidden="true"><i :class="icon"></i></span>
    </template>
  </article>
</template>

<script setup>
import Skeleton from 'primevue/skeleton'

defineProps({
  caption: { type: String, default: '' },
  color: { type: String, default: 'var(--primary-color)' },
  icon: { type: String, required: true },
  label: { type: String, required: true },
  loading: { type: Boolean, default: false },
  value: { type: [String, Number], default: 0 },
})
</script>

<style scoped>
.dashboard-stat{display:flex;align-items:center;justify-content:space-between;gap:1rem;min-height:8.5rem;height:100%;padding:1.25rem;border:1px solid var(--surface-border);border-radius:1rem;background:var(--surface-card)}.dashboard-stat__copy,.dashboard-stat__skeleton{display:grid;gap:.35rem;min-width:0}.dashboard-stat__label{color:var(--text-color-secondary);font-size:.875rem;font-weight:600}.dashboard-stat__value{color:var(--text-color);font-size:clamp(1.75rem,3vw,2.5rem);line-height:1.1;font-variant-numeric:tabular-nums}.dashboard-stat__caption{color:var(--text-color-secondary);font-size:.8125rem}.dashboard-stat__icon{display:grid;place-items:center;flex:0 0 3rem;width:3rem;height:3rem;border-radius:.875rem;color:var(--stat-color);background:color-mix(in srgb,var(--stat-color) 14%,transparent)}.dashboard-stat__icon i{font-size:1.25rem}@media(max-width:36rem){.dashboard-stat{min-height:7.5rem;padding:1rem}}
</style>
