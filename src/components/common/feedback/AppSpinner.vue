<template>
  <div
    class="app-spinner"
    :class="[inline ? 'is-inline' : 'is-block', sizeClass]"
    role="status"
    aria-live="polite"
  >
    <ProgressSpinner :style="spinnerStyle" strokeWidth="8" aria-label="Chargement" />
    <span v-if="label" class="spinner-label">{{ label }}</span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import ProgressSpinner from 'primevue/progressspinner'

const props = defineProps({
  inline: { type: Boolean, default: true },
  size: { type: String, default: 'sm' }, // sm | md | lg
  label: { type: String, default: '' },
})

const sizeClass = computed(() => `size-${props.size}`)

const spinnerStyle = computed(() => {
  switch (props.size) {
    case 'lg':
      return { width: '2.25rem', height: '2.25rem' }
    case 'md':
      return { width: '1.75rem', height: '1.75rem' }
    default:
      return { width: '1.25rem', height: '1.25rem' }
  }
})
</script>

<style scoped>
.app-spinner {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2, .5rem);
  color: var(--text-600, #6b7280);
}
.is-block { display: flex; justify-content: center; }
.spinner-label { font-size: var(--font-size-sm, .875rem); }
</style>
