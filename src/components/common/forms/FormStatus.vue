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
.form-status{display:flex;align-items:flex-start;gap:.75rem;padding:.875rem 1rem;border-radius:.75rem;color:var(--text-color);background:var(--surface-100);font-size:.875rem}.form-status>i{margin-block-start:.15rem}.form-status__content{display:grid;gap:.15rem;min-width:0}.form-status strong,.form-status p{margin:0}.form-status p{color:inherit}.form-status--loading{color:var(--text-color);background:color-mix(in srgb, var(--blue-500,#3b82f6) 14%, var(--app-color-surface))}.form-status--loading>i{color:var(--blue-500,#3b82f6)}.form-status--success{color:var(--text-color);background:color-mix(in srgb, var(--green-500,#22c55e) 14%, var(--app-color-surface))}.form-status--success>i{color:var(--green-500,#22c55e)}.form-status--error{color:var(--text-color);background:color-mix(in srgb, var(--red-500,#ef4444) 14%, var(--app-color-surface))}.form-status--error>i{color:var(--red-500,#ef4444)}
</style>
