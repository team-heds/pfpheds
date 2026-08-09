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
.form-status{display:flex;align-items:flex-start;gap:.75rem;padding:.875rem 1rem;border-radius:.75rem;color:var(--text-color);background:var(--surface-100);font-size:.875rem}.form-status>i{margin-block-start:.15rem}.form-status__content{display:grid;gap:.15rem;min-width:0}.form-status strong,.form-status p{margin:0}.form-status p{color:inherit}.form-status--loading{color:var(--blue-700,#1d4ed8);background:var(--blue-50,#eff6ff)}.form-status--success{color:var(--green-700,#15803d);background:var(--green-50,#f0fdf4)}.form-status--error{color:var(--red-700,#b91c1c);background:var(--red-50,#fef2f2)}
</style>
