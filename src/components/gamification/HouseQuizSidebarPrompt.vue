<template>
  <RouterLink v-if="quizOpen" to="/hes-house-quiz" class="house-quiz-prompt">
    <span class="house-quiz-prompt__icon" aria-hidden="true"><i class="pi pi-home"></i></span>
    <span class="house-quiz-prompt__text">
      <strong>Découvrir ma maison HES</strong>
      <small>Passe le quiz pour rejoindre ta maison</small>
    </span>
    <i class="pi pi-chevron-right house-quiz-prompt__arrow" aria-hidden="true"></i>
  </RouterLink>
</template>

<script setup>
import { useHouseQuizStatus } from '@/composables/useHouseQuizStatus'

// Le serveur décide : visible seulement pour un joueur qui n'a pas encore de maison.
const { quizOpen } = useHouseQuizStatus()
</script>

<style scoped>
.house-quiz-prompt {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-block-end: 0.75rem;
  padding: 0.75rem;
  border: 1px solid color-mix(in srgb, var(--primary-color) 45%, transparent);
  border-radius: 0.75rem;
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  color: var(--text-color);
  text-decoration: none;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.house-quiz-prompt:hover {
  border-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 20%, transparent);
}

.house-quiz-prompt:focus-visible {
  outline: 2px solid var(--primary-color);
  outline-offset: 2px;
}

.house-quiz-prompt__icon {
  display: grid;
  flex: none;
  place-items: center;
  width: 2rem;
  height: 2rem;
  border-radius: 0.625rem;
  background: var(--primary-color);
  color: var(--primary-color-text);
}

.house-quiz-prompt__text {
  display: grid;
  min-width: 0;
  gap: 0.125rem;
}

.house-quiz-prompt__text strong {
  font-size: 0.9rem;
  line-height: 1.25;
}

.house-quiz-prompt__text small {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
  line-height: 1.3;
}

.house-quiz-prompt__arrow {
  flex: none;
  margin-inline-start: auto;
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}
</style>
