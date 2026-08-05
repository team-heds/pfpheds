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
.form-section{min-width:0;margin:0;padding:clamp(1rem,2vw,1.5rem);border:1px solid var(--surface-border);border-radius:.875rem;background:color-mix(in srgb,var(--surface-card) 96%,var(--surface-ground))}.form-section+ .form-section{margin-block-start:.25rem}legend{display:flex;align-items:center;gap:.625rem;padding-inline:.25rem;color:var(--text-color);font-size:1.0625rem;font-weight:700}legend i{color:var(--primary-color)}p{max-width:65ch;margin:.375rem 0 1rem;color:var(--text-color-secondary);font-size:.875rem}.form-section__grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:.75rem 1rem}.form-section__grid :deep(> .grid){grid-column:1/-1;width:100%;margin:0}@media(max-width:40rem){.form-section{padding:1rem}.form-section__grid{grid-template-columns:1fr}}
</style>
