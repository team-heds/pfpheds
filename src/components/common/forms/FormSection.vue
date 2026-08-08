<template>
  <fieldset class="form-section" :disabled="disabled">
    <legend><i v-if="icon" :class="icon" aria-hidden="true"></i><span>{{ title }}</span></legend>
    <p v-if="description">{{ description }}</p>
    <div class="form-section__grid"><slot /></div>
  </fieldset>
</template>
<script setup>
defineProps({ title: { type: String, required: true }, description: { type: String, default: '' }, icon: { type: String, default: '' }, disabled: Boolean })
</script>
<style scoped>
.form-section{min-width:0;margin:0;padding:var(--app-page-gutter);border:1px solid var(--app-color-border);border-radius:var(--app-radius-lg);background:var(--app-color-surface)}.form-section+ .form-section{margin-block-start:var(--app-space-1)}legend{display:flex;align-items:center;gap:var(--app-space-2);padding-inline:var(--app-space-1);color:var(--app-color-text);font-size:var(--app-font-size-lg);font-weight:var(--app-font-weight-bold)}legend i{color:var(--app-color-brand)}p{max-width:var(--app-text-measure);margin:var(--app-space-2) 0 var(--app-space-4);color:var(--app-color-text-muted);font-size:var(--app-font-size-sm);line-height:var(--app-line-height-body)}.form-section__grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:var(--app-space-3) var(--app-space-4)}.form-section__grid :deep(> .grid){grid-column:1/-1;width:100%;margin:0}@media(max-width:40rem){.form-section{padding:var(--app-space-4)}.form-section__grid{grid-template-columns:1fr}}
</style>
