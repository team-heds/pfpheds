<template>
  <fieldset class="form-section">
    <legend><i v-if="icon" :class="icon" aria-hidden="true"></i><span>{{ title }}</span></legend>
    <p v-if="description">{{ description }}</p>
    <div class="form-section__grid"><slot /></div>
  </fieldset>
</template>
<script setup>
defineProps({ title: { type: String, required: true }, description: { type: String, default: '' }, icon: { type: String, default: '' } })
</script>
<style scoped>
.form-section{min-width:0;margin:0;padding:0;border:0}.form-section+ .form-section{padding-block-start:1.5rem}legend{display:flex;align-items:center;gap:.625rem;padding:0;color:var(--text-color);font-size:1.0625rem;font-weight:700}legend i{color:var(--primary-color)}p{max-width:65ch;margin:.375rem 0 1rem;color:var(--text-color-secondary);font-size:.875rem}.form-section__grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:1rem}@media(max-width:40rem){.form-section__grid{grid-template-columns:1fr}}
</style>
