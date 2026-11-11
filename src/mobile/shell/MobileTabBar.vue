<template>
  <nav class="m-tabs" aria-label="Navigation principale">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="m-tabs__item"
      :class="{ 'is-active': tab.key === active }"
      :aria-current="tab.key === active ? 'page' : undefined"
      @click="emit('select', tab.key)"
    >
      <MIcon :name="tab.icon" />
      <span class="m-tabs__label">{{ tab.label }}</span>
    </button>
  </nav>
</template>

<script setup>
import MIcon from '@/mobile/ui/MIcon.vue'

defineProps({
  tabs: { type: Array, required: true },
  active: { type: String, required: true },
})
const emit = defineEmits(['select'])
</script>

<style scoped>
.m-tabs {
  display: flex;
  flex-shrink: 0;
  padding: 6px max(6px, env(safe-area-inset-right, 0px)) calc(6px + env(safe-area-inset-bottom, 0px)) max(6px, env(safe-area-inset-left, 0px));
  border-top: 1px solid var(--m-line);
  background: var(--m-surface);
}
.m-tabs__item {
  flex: 1 1 0;
  min-width: 0;
  min-height: 48px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: none;
  color: var(--m-muted);
  font: inherit;
  font-size: 0.6875rem;
  line-height: 1.2;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  user-select: none;
  -webkit-user-select: none;
}
.m-tabs__item.is-active {
  color: var(--m-accent-text);
  font-weight: 500;
}
.m-tabs__item:active {
  background: var(--m-raised);
}
.m-tabs__item:focus-visible {
  outline: 2px solid var(--m-accent-text);
  outline-offset: -2px;
}
.m-tabs__label {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (forced-colors: active) {
  .m-tabs__item.is-active {
    outline: 1px solid CanvasText;
    outline-offset: -3px;
  }
}
</style>
