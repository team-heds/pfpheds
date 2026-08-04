<template>
  <header class="page-header">
    <div class="page-header__copy">
      <p v-if="eyebrow" class="page-header__eyebrow">{{ eyebrow }}</p>
      <h1>{{ title }}</h1>
      <p v-if="description" class="page-header__description">{{ description }}</p>
    </div>
    <div v-if="$slots.actions" class="page-header__actions"><slot name="actions" /></div>
  </header>
</template>

<script setup>
defineProps({ title: { type:String, required:true }, description: { type:String, default:'' }, eyebrow: { type:String, default:'' } })
</script>

<style scoped>
.page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:1.5rem;margin-bottom:1.5rem}.page-header__copy{min-width:0}.page-header__eyebrow{margin:0 0 .35rem;color:var(--primary-color);font-size:.75rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.page-header h1{margin:0;color:var(--text-color);font-size:clamp(1.5rem,2.4vw,2.25rem);line-height:1.15}.page-header__description{max-width:48rem;margin:.5rem 0 0;color:var(--text-color-secondary);line-height:1.55}.page-header__actions{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}@media(max-width:640px){.page-header{flex-direction:column}.page-header__actions{width:100%}}
</style>
