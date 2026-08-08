<template>
  <div class="form-actions-bar" :class="{ 'form-actions-bar--sticky': sticky }" :aria-busy="busy || undefined">
    <p v-if="statusMessage" class="form-actions-bar__status" :class="`form-actions-bar__status--${status}`" :role="status === 'error' ? 'alert' : 'status'">
      <i :class="statusIcon" aria-hidden="true"></i>
      <span>{{ statusMessage }}</span>
    </p>
    <div v-if="$slots.secondary" class="form-actions-bar__secondary">
      <slot name="secondary" />
    </div>
    <div class="form-actions-bar__primary">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({ sticky: { type: Boolean, default: false }, busy: Boolean, statusMessage: { type: String, default: '' }, status: { type: String, default: 'idle', validator: value => ['idle', 'loading', 'success', 'error'].includes(value) } })
const statusIcon = computed(() => ({ loading: 'pi pi-spin pi-spinner', success: 'pi pi-check-circle', error: 'pi pi-exclamation-circle' }[props.status] || 'pi pi-info-circle'))
</script>

<style scoped>
.form-actions-bar{display:flex;align-items:center;justify-content:space-between;gap:var(--app-space-3);width:100%;padding-block-start:var(--app-space-4);border-block-start:1px solid var(--app-color-border)}
.form-actions-bar--sticky{position:sticky;bottom:0;z-index:3;padding:var(--app-space-4);background:color-mix(in srgb,var(--app-color-surface) 94%,transparent);backdrop-filter:blur(12px)}
.form-actions-bar__secondary,.form-actions-bar__primary{display:flex;align-items:center;gap:var(--app-space-3);flex-wrap:wrap}.form-actions-bar__primary{margin-inline-start:auto}.form-actions-bar__status{display:flex;align-items:center;gap:var(--app-space-2);min-width:0;margin:0;color:var(--app-color-text-muted);font-size:var(--app-font-size-sm)}.form-actions-bar__status--success{color:var(--app-color-success)}.form-actions-bar__status--error{color:var(--app-color-danger)}
@media(max-width:40rem){.form-actions-bar{align-items:stretch;flex-direction:column-reverse}.form-actions-bar__secondary,.form-actions-bar__primary{display:grid;width:100%;margin:0}.form-actions-bar :deep(.p-button){width:100%;min-height:var(--app-touch-target)}}
</style>
