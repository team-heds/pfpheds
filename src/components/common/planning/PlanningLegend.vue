<template>
  <section class="planning-legend" aria-label="Légende du planning">
    <strong>Légende</strong>
    <ul><li v-for="item in items" :key="item.label"><span :style="{ backgroundColor: item.color }" aria-hidden="true"></span>{{ item.label }}</li></ul>
  </section>
</template>
<script setup>
defineProps({ items: { type: Array, default: () => [{ label: 'Planifié', color: '#3b82f6' },{ label: 'Confirmé', color: '#10b981' },{ label: 'À valider', color: '#f59e0b' },{ label: 'Annulé', color: '#ef4444' }] } })
</script>
<style scoped>
.planning-legend{display:flex;align-items:center;gap:1rem;flex-wrap:wrap;padding:.75rem 1rem;border:1px solid var(--surface-border);border-radius:.75rem;background:var(--surface-card)}ul{display:flex;gap:1rem;flex-wrap:wrap;list-style:none;padding:0;margin:0}li{display:flex;align-items:center;gap:.4rem;color:var(--text-color-secondary);font-size:.875rem}li span{width:.75rem;height:.75rem;border-radius:999px}@media(max-width:640px){.planning-legend,ul{align-items:flex-start;flex-direction:column;gap:.5rem}}
</style>
