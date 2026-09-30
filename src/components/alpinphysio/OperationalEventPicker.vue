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
.picker{display:grid;grid-template-columns:auto minmax(240px,520px);align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1rem;padding:1rem 1.25rem;color:#f7f9fc;background:var(--heds-navy-soft,#102c4e);border:1px solid var(--line,#294866);border-radius:1rem;box-shadow:0 12px 35px rgba(2,10,22,.2)}.picker label{color:#c4cfdd;font-size:.78rem;font-weight:700}.picker select{width:100%;min-height:46px;padding:.65rem 2.5rem .65rem .85rem;border:1px solid var(--line,#294866);border-radius:.65rem;color:#f7f9fc;background:var(--heds-navy-deep,#071426);color-scheme:dark;font:inherit;font-size:16px;cursor:pointer;transition:border-color 150ms ease,box-shadow 150ms ease}.picker select:hover{border-color:#547392}.picker select:focus-visible{border-color:var(--heds-yellow,#f3c300);outline:3px solid color-mix(in srgb,var(--heds-yellow,#f3c300) 35%,transparent);outline-offset:2px}.picker select option{color:#f7f9fc;background:var(--heds-navy-deep,#071426)}@media(max-width:620px){.picker{grid-template-columns:1fr;gap:.5rem}}
</style>
