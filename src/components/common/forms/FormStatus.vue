<template>
  <div v-if="status !== 'idle' || message" class="form-status" :class="`form-status--${status}`" :role="status === 'error' ? 'alert' : 'status'" :aria-live="status === 'error' ? 'assertive' : 'polite'">
    <i :class="iconClass" aria-hidden="true"></i>
    <div class="form-status__content">
      <strong v-if="title">{{ title }}</strong>
      <p v-if="message">{{ message }}</p>
    </div>
    <slot name="action" />
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  status: { type: String, default: 'idle', validator: value => ['idle', 'loading', 'success', 'error'].includes(value) },
  title: { type: String, default: '' },
  message: { type: String, default: '' }
})
const iconClass = computed(() => ({
  loading: 'pi pi-spin pi-spinner',
  success: 'pi pi-check-circle',
  error: 'pi pi-exclamation-circle'
}[props.status] || 'pi pi-info-circle'))
</script>

<style scoped>
.form-status{display:flex;align-items:flex-start;gap:var(--app-space-3);padding:var(--app-space-3) var(--app-space-4);border-radius:var(--app-radius-md);color:var(--app-color-text);background:var(--app-color-section);font-size:var(--app-font-size-sm)}.form-status>i{margin-block-start:var(--app-space-1)}.form-status__content{display:grid;gap:var(--app-space-1);min-width:0}.form-status strong,.form-status p{margin:0}.form-status p{color:inherit}.form-status--loading{color:var(--app-color-info);background:var(--app-color-info-soft)}.form-status--success{color:var(--app-color-success);background:var(--app-color-success-soft)}.form-status--error{color:var(--app-color-danger);background:var(--app-color-danger-soft)}
</style>
