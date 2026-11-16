<template>
  <div class="m-chips" role="group" aria-label="Filtrer le fil">
    <button
      v-for="filter in filters"
      :key="filter.key"
      type="button"
      class="m-chip"
      :aria-pressed="filter.key === selected ? 'true' : 'false'"
      @click="emit('select', filter)"
    >
      {{ filter.label }}
    </button>
    <button type="button" class="m-chip m-chip--link" @click="emit('manage')">
      <MIcon name="users" />
      Communautés
    </button>
  </div>
</template>

<script setup>
import MIcon from '@/mobile/ui/MIcon.vue'

defineProps({
  filters: { type: Array, required: true },
  selected: { type: String, required: true },
})
const emit = defineEmits(['select', 'manage'])
</script>

<style scoped>
.m-chips {
  display: flex;
  gap: 8px;
  margin: 0 -16px;
  padding: 4px 16px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.m-chips::-webkit-scrollbar {
  display: none;
}
.m-chip {
  position: relative;
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 36px;
  padding: 0 14px;
  border: 1px solid var(--m-line);
  border-radius: 99px;
  background: var(--m-surface);
  color: var(--m-muted);
  font: inherit;
  font-size: 0.8125rem;
  white-space: nowrap;
  cursor: pointer;
  touch-action: manipulation;
}
/* Cible tactile de 44 px sans épaissir la pastille. */
.m-chip::after {
  content: '';
  position: absolute;
  inset: -4px 0;
}
.m-chip[aria-pressed='true'] {
  border-color: var(--m-accent);
  background: var(--m-accent);
  color: var(--m-on-accent);
  font-weight: 500;
}
.m-chip--link {
  border-style: dashed;
  background: none;
}
.m-chip--link :deep(.m-icon) {
  width: 16px;
  height: 16px;
}
.m-chip:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: 2px;
}
</style>
