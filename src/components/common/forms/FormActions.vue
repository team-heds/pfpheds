<template>
  <div class="form-actions-bar" :class="{ 'form-actions-bar--sticky': sticky }">
    <div v-if="$slots.secondary" class="form-actions-bar__secondary">
      <slot name="secondary" />
    </div>
    <div class="form-actions-bar__primary">
      <slot />
    </div>
  </div>
</template>

<script setup>
defineProps({ sticky: { type: Boolean, default: false } })
</script>

<style scoped>
.form-actions-bar{display:flex;align-items:center;justify-content:space-between;gap:.75rem;width:100%;padding-block-start:1rem;border-block-start:1px solid var(--surface-border)}
.form-actions-bar--sticky{position:sticky;bottom:0;z-index:3;padding:1rem;background:color-mix(in srgb,var(--surface-card) 94%,transparent);backdrop-filter:blur(12px)}
.form-actions-bar__secondary,.form-actions-bar__primary{display:flex;align-items:center;gap:.75rem;flex-wrap:wrap}.form-actions-bar__primary{margin-inline-start:auto}
@media(max-width:40rem){.form-actions-bar{align-items:stretch;flex-direction:column-reverse}.form-actions-bar__secondary,.form-actions-bar__primary{display:grid;width:100%;margin:0}.form-actions-bar :deep(.p-button){width:100%}}
</style>
