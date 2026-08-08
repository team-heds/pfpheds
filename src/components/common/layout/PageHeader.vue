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
.page-header{display:flex;align-items:flex-start;justify-content:space-between;gap:var(--app-space-6);margin-block-end:var(--app-space-6)}.page-header__copy{min-width:0}.page-header__eyebrow{margin:0 0 var(--app-space-1);color:var(--app-color-brand);font-size:var(--app-font-size-xs);font-weight:var(--app-font-weight-bold);letter-spacing:.08em;text-transform:uppercase}.page-header h1{margin:0;color:var(--app-color-text);font-size:var(--app-font-size-page-title);line-height:var(--app-line-height-tight);text-wrap:balance}.page-header__description{max-width:var(--app-content-max);margin:var(--app-space-2) 0 0;color:var(--app-color-text-muted);line-height:var(--app-line-height-body);text-wrap:pretty}.page-header__actions{display:flex;align-items:center;gap:var(--app-space-3);flex-wrap:wrap}@media(max-width:40rem){.page-header{flex-direction:column;gap:var(--app-space-4)}.page-header__actions{width:100%}.page-header__actions :deep(.p-button){flex:1 1 auto;min-height:var(--app-touch-target)}}
</style>
