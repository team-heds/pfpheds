<template>
  <div class="loading-state" role="status" aria-live="polite">
    <i class="pi pi-spin pi-spinner" aria-hidden="true"></i>
    <span>{{ label }}</span>
  </div>
</template>

<script setup>
defineProps({ label: { type: String, default: 'Chargement en cours…' } })
</script>

<style scoped>
.loading-state { display:flex; align-items:center; justify-content:center; gap:.75rem; min-height:8rem; padding:2rem; color:var(--text-color-secondary); }
.loading-state i { color:var(--primary-color); font-size:1.25rem; }
</style>
