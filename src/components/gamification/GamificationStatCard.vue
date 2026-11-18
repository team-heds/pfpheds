<template>
  <article class="game-stat">
    <span class="game-stat__icon" aria-hidden="true"><i :class="icon"></i></span>
    <div class="game-stat__body">
      <strong>{{ value }}</strong>
      <span>{{ label }}</span>
      <div v-if="progress !== null" class="game-stat__track" aria-hidden="true">
        <span :style="{ width: `${safeProgress}%` }"></span>
      </div>
    </div>
  </article>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  icon: { type: String, required: true },
  value: { type: [String, Number], required: true },
  label: { type: String, required: true },
  progress: { type: Number, default: null }
})

const safeProgress = computed(() => Math.max(0, Math.min(100, props.progress ?? 0)))
</script>

<style scoped>
.game-stat {
  display: flex;
  align-items: center;
  min-height: 7rem;
  gap: 1rem;
  padding: 1.2rem;
  /* Couleurs du thème : bleu nuit en sombre, carte claire en clair. */
  background: var(--surface-card, #071426);
  border: 1px solid color-mix(in srgb, var(--house-color, #f3c300) 24%, var(--surface-border, #243a58));
  border-radius: 1rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.game-stat__icon {
  display: grid;
  flex: 0 0 3rem;
  width: 3rem;
  height: 3rem;
  place-items: center;
  color: #071426;
  background: #f3c300;
  border-radius: 0.8rem;
}

.game-stat__icon i { font-size: 1.15rem; }
.game-stat__body { display: grid; flex: 1; gap: 0.2rem; min-width: 0; }
.game-stat__body strong { color: var(--text-color, #f8fafc); font-size: 1.65rem; line-height: 1; }
.game-stat__body > span { color: var(--text-color-secondary, #b8c3d1); font-size: 0.78rem; font-weight: 800; letter-spacing: 0.035em; text-transform: uppercase; }
.game-stat__track { height: 0.35rem; margin-top: 0.35rem; overflow: hidden; background: color-mix(in srgb, var(--text-color, #f8fafc) 14%, transparent); border-radius: 999px; }
.game-stat__track span { display: block; height: 100%; background: var(--house-color, #f3c300); border-radius: inherit; }

/* Téléphone : trois chiffres côte à côte au lieu de trois grandes cartes
   empilées qui repoussaient les défis, quêtes et badges deux écrans plus bas. */
@media (max-width: 640px) {
  .game-stat {
    flex-direction: column;
    align-items: flex-start;
    min-height: 0;
    gap: 0.35rem;
    padding: 0.7rem 0.75rem;
    border-radius: 0.8rem;
    box-shadow: none;
  }
  .game-stat__icon { display: none; }
  .game-stat__body { width: 100%; }
  .game-stat__body strong { font-size: 1.2rem; }
  .game-stat__body > span {
    font-size: 0.68rem;
    letter-spacing: 0.02em;
    line-height: 1.25;
    hyphens: auto;
    overflow-wrap: anywhere;
  }
}
</style>
