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
.loading-state { display:flex; align-items:center; justify-content:center; gap:var(--app-space-3); min-height:8rem; padding:var(--app-space-8); color:var(--app-color-text-muted); }
.loading-state i { color:var(--app-color-brand); font-size:var(--app-font-size-xl); }
</style>
