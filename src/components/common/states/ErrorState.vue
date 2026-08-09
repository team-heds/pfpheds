<template>
  <section class="error-state" role="alert">
    <i class="pi pi-exclamation-circle" aria-hidden="true"></i>
    <div><h2>{{ title }}</h2><p>{{ description }}</p></div>
    <button v-if="retryLabel" type="button" @click="$emit('retry')">{{ retryLabel }}</button>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: 'Impossible de charger le contenu' },
  description: { type: String, default: 'Vérifiez votre connexion et réessayez.' },
  retryLabel: { type: String, default: 'Réessayer' },
})
defineEmits(['retry'])
</script>

<style scoped>
.error-state { display:flex; align-items:center; gap:1rem; padding:1rem 1.25rem; border:1px solid color-mix(in srgb,#ef4444 38%,transparent); border-radius:1rem; background:color-mix(in srgb,#ef4444 8%,var(--surface-card)); color:var(--text-color); }
.error-state>i { color:#ef4444; font-size:1.25rem; }.error-state div{flex:1}.error-state h2{margin:0;font-size:1rem}.error-state p{margin:.25rem 0 0;color:var(--text-color-secondary)}
.error-state button{min-height:2.5rem;padding:.5rem .875rem;border:1px solid #ef4444;border-radius:.65rem;background:transparent;color:#ef4444;font:inherit;font-weight:600;cursor:pointer}.error-state button:focus-visible{outline:2px solid #ef4444;outline-offset:2px}
</style>
