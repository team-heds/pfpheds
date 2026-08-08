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
.error-state { display:flex; align-items:center; gap:var(--app-space-4); padding:var(--app-space-4) var(--app-space-5); border:1px solid color-mix(in srgb,var(--app-color-danger) 38%,transparent); border-radius:var(--app-radius-xl); background:color-mix(in srgb,var(--app-color-danger) 8%,var(--app-color-surface)); color:var(--app-color-text); }
.error-state>i { color:var(--app-color-danger); font-size:var(--app-font-size-xl); }.error-state div{flex:1;min-width:0}.error-state h2{margin:0;font-size:var(--app-font-size-md)}.error-state p{margin:var(--app-space-1) 0 0;color:var(--app-color-text-muted);text-wrap:pretty}
.error-state button{min-height:var(--app-touch-target);padding:var(--app-space-2) var(--app-control-padding-inline);border:1px solid var(--app-color-danger);border-radius:var(--app-control-radius);background:transparent;color:var(--app-color-danger);font:inherit;font-weight:var(--app-font-weight-semibold);cursor:pointer}.error-state button:hover{background:var(--app-color-danger-soft)}.error-state button:focus-visible{outline:max(2px,.1875rem) solid var(--app-color-danger);outline-offset:var(--app-space-1)}
@media(max-width:40rem){.error-state{align-items:flex-start;flex-wrap:wrap;padding:var(--app-space-4)}.error-state div{flex:1 1 calc(100% - var(--app-space-10))}.error-state button{width:100%}}
</style>
