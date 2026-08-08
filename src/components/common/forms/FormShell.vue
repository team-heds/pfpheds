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
.form-shell{width:min(100%,var(--app-content-max));margin-inline:auto;border:1px solid var(--app-color-border);border-radius:var(--app-radius-xl);background:var(--app-color-surface);box-shadow:var(--app-shadow-xs);overflow:hidden}.form-shell__header{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--app-space-4);padding:var(--app-page-gutter);border-block-end:1px solid var(--app-color-border)}h1{margin:0;color:var(--app-color-text);font-size:var(--app-font-size-2xl);line-height:var(--app-line-height-tight);text-wrap:balance}p{max-width:var(--app-text-measure);margin:var(--app-space-2) 0 0;color:var(--app-color-text-muted);line-height:var(--app-line-height-body);text-wrap:pretty}.form-shell__body{display:grid;gap:var(--app-space-6);padding:var(--app-page-gutter)}.form-shell__actions{position:sticky;bottom:0;z-index:2;display:flex;justify-content:flex-end;gap:var(--app-space-3);padding:var(--app-space-4) var(--app-page-gutter);border-block-start:1px solid var(--app-color-border);background:color-mix(in srgb,var(--app-color-surface) 94%,transparent);backdrop-filter:blur(12px)}@media(max-width:40rem){.form-shell{border-radius:var(--app-radius-md)}.form-shell__actions{align-items:stretch;flex-direction:column-reverse}.form-shell__actions :deep(.p-button){width:100%;min-height:var(--app-touch-target)}}
</style>
