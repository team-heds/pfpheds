<template>
  <section class="form-shell" :aria-labelledby="title ? titleId : undefined" :aria-busy="busy || undefined">
    <header v-if="title || description || $slots.header" class="form-shell__header">
      <slot name="header"><div><h1 :id="titleId">{{ title }}</h1><p v-if="description">{{ description }}</p></div></slot>
    </header>
    <div class="form-shell__body"><slot /></div>
    <footer v-if="$slots.actions" class="form-shell__actions"><slot name="actions" /></footer>
  </section>
</template>
<script setup>
import { useId } from 'vue'
defineProps({ title: { type: String, default: '' }, description: { type: String, default: '' }, busy: Boolean })
const titleId = `form-shell-${useId()}`
</script>
<style scoped>
.form-shell{width:min(100%,72rem);margin-inline:auto;border:1px solid var(--surface-border);border-radius:1rem;background:var(--surface-card);box-shadow:0 1px 2px rgba(0,0,0,.04);overflow:hidden}.form-shell__header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;padding:clamp(1rem,2vw,1.5rem);border-block-end:1px solid var(--surface-border)}h1{margin:0;color:var(--text-color);font-size:clamp(1.375rem,2.5vw,2rem);line-height:1.15;text-wrap:balance}p{max-width:65ch;margin:.5rem 0 0;color:var(--text-color-secondary);text-wrap:pretty}.form-shell__body{display:grid;gap:1.5rem;padding:clamp(1rem,2vw,1.5rem)}.form-shell__actions{position:sticky;bottom:0;z-index:2;display:flex;justify-content:flex-end;gap:.75rem;padding:1rem clamp(1rem,2vw,1.5rem);border-block-start:1px solid var(--surface-border);background:color-mix(in srgb,var(--surface-card) 94%,transparent);backdrop-filter:blur(12px)}@media(max-width:40rem){.form-shell{border-radius:.75rem}.form-shell__actions{align-items:stretch;flex-direction:column-reverse}.form-shell__actions :deep(.p-button){width:100%}}
</style>
