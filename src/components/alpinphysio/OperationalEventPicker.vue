<template>
  <section class="picker">
    <label :for="inputId">{{ label }}</label>
    <select :id="inputId" :value="modelValue" @change="$emit('update:modelValue', $event.target.value)">
      <option value="" disabled>Sélectionner un événement</option>
      <option v-for="event in events" :key="event.id" :value="event.id">{{ event.title }} · {{ formatDate(event.start_date) }}</option>
    </select>
  </section>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: '' },
  events: { type: Array, default: () => [] },
  label: { type: String, default: 'Événement' },
})
defineEmits(['update:modelValue'])
const inputId = `event-picker-${Math.random().toString(36).slice(2)}`
const formatDate = (value) => new Intl.DateTimeFormat('fr-CH', { dateStyle: 'medium' }).format(new Date(value))
</script>

<style scoped>
.picker{display:grid;grid-template-columns:auto minmax(240px,520px);align-items:center;gap:1rem;margin-bottom:1rem;padding:1rem 1.25rem;background:#eaf7f6;border:1px solid #dbe7e5;border-radius:1rem}.picker label{font-size:.78rem;font-weight:700}.picker select{min-height:44px;padding:.65rem .75rem;border:1px solid #bfd7d4;border-radius:.65rem;color:inherit;background:#fff;font:inherit;font-size:16px}.picker select:focus-visible{outline:3px solid #64d0d8;outline-offset:2px}@media(max-width:620px){.picker{grid-template-columns:1fr;gap:.5rem}}
</style>
