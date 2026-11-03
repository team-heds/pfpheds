<template>
  <header class="game-header">
    <div class="game-header__identity">
      <span class="game-header__icon" aria-hidden="true">
        <i :class="icon"></i>
      </span>
      <div>
        <p v-if="eyebrow" class="game-header__eyebrow">{{ eyebrow }}</p>
        <h1>{{ title }}</h1>
        <p class="game-header__description">{{ description }}</p>
      </div>
    </div>
    <div class="game-header__actions">
      <slot name="actions" />
      <Button
        v-if="showBack"
        label="Retour"
        icon="pi pi-arrow-left"
        outlined
        class="game-header__back"
        @click="$emit('back')"
      />
    </div>
  </header>
</template>

<script setup>
import Button from 'primevue/button'

defineProps({
  title: { type: String, required: true },
  description: { type: String, required: true },
  eyebrow: { type: String, default: '' },
  icon: { type: String, default: 'pi pi-sparkles' },
  showBack: { type: Boolean, default: true }
})

defineEmits(['back'])
</script>

<style scoped>
.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  max-width: 1200px;
  margin: 0 auto 1.5rem;
  padding: 1.5rem;
  color: var(--text-color);
  background: var(--surface-card);
  border: 1px solid color-mix(in srgb, var(--house-color, #f3c300) 38%, var(--surface-border));
  border-radius: 1rem;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.12);
}

.game-header__identity {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 0;
}

.game-header__icon {
  position: relative;
  display: grid;
  flex: 0 0 3.25rem;
  width: 3.25rem;
  height: 3.25rem;
  place-items: center;
  color: #071426;
  background: #f3c300;
  border-radius: 0.9rem;
  box-shadow: 0 7px 18px rgba(243, 195, 0, 0.25);
}

.game-header__icon::after {
  position: absolute;
  right: -0.25rem;
  bottom: -0.25rem;
  width: 0.85rem;
  height: 0.85rem;
  background: var(--house-color, #f3c300);
  border: 2px solid var(--surface-card);
  border-radius: 50%;
  content: '';
}

.game-header__icon i { font-size: 1.35rem; }
.game-header__eyebrow {
  margin: 0 0 0.25rem;
  color: var(--text-color-secondary);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: var(--text-color);
  font-size: clamp(1.55rem, 3vw, 2.15rem);
  line-height: 1.1;
}

.game-header__description {
  max-width: 46rem;
  margin: 0.45rem 0 0;
  color: var(--text-color-secondary);
  line-height: 1.5;
}

.game-header__actions { display: flex; align-items: center; gap: 0.75rem; }

:deep(.game-header__back) {
  min-height: 44px;
  color: var(--text-color);
  border-color: var(--surface-border);
  border-radius: 0.75rem;
  font-weight: 700;
}

@media (max-width: 640px) {
  .game-header { align-items: stretch; flex-direction: column; padding: 1.1rem; }
  .game-header__identity { align-items: flex-start; }
  .game-header__icon { flex-basis: 2.75rem; width: 2.75rem; height: 2.75rem; }
  .game-header__actions, :deep(.game-header__back) { width: 100%; }
  :deep(.game-header__back) { justify-content: center; }
}
</style>
