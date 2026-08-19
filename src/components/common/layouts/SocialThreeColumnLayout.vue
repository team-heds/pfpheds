<template>
  <div class="social-layout" :class="{ 'social-layout--single': singleColumn }">
    <aside v-if="!singleColumn" class="social-layout__side social-layout__side--left" :aria-label="leftLabel">
      <slot name="left" />
    </aside>

    <div
      class="social-layout__main"
      :class="{ 'social-layout__main--contained': centerMaxWidth }"
      :style="centerStyle"
    >
      <slot />
    </div>

    <aside v-if="!singleColumn" class="social-layout__side social-layout__side--right" :aria-label="rightLabel">
      <slot name="right" />
    </aside>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  centerMaxWidth: { type: String, default: '' },
  leftLabel: { type: String, default: 'Espace personnel' },
  rightLabel: { type: String, default: 'Contenu complémentaire' },
  singleColumn: { type: Boolean, default: false },
})

const centerStyle = computed(() => (
  props.centerMaxWidth ? { '--social-center-max': props.centerMaxWidth } : undefined
))
</script>

<style scoped>
.social-layout {
  --social-side-column: clamp(15rem, 20vw, 25.5rem);
  --social-side-inset: clamp(0rem, calc((100vw - 64rem) * 0.0625), 4rem);
  display: grid;
  grid-template-columns:
    minmax(15rem, var(--social-side-column))
    minmax(30rem, 1fr)
    minmax(15rem, var(--social-side-column));
  gap: clamp(1rem, 1.5vw, 1.5rem);
  height: calc(100dvh - var(--navbar-h) - (2 * var(--content-pad)));
  max-height: calc(100dvh - var(--navbar-h) - (2 * var(--content-pad)));
  overflow: hidden;
}

.social-layout--single {
  grid-template-columns: minmax(0, 1fr);
}

.social-layout__side,
.social-layout__main {
  min-width: 0;
  height: 100%;
}

.social-layout__side {
  overflow-y: hidden;
}

.social-layout__side--left :deep(.sidebar),
.social-layout__side--left :deep(.messaging-card),
.social-layout__side--left :deep(.upcoming-events-section) {
  margin-inline-start: var(--social-side-inset);
}

.social-layout__side--right :deep(.right-sidebar) {
  margin-inline-end: var(--social-side-inset);
}

.social-layout__main {
  overflow-x: hidden;
  overflow-y: auto;
  scrollbar-width: none;
}

.social-layout__main::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.social-layout__main--contained {
  width: 100%;
  max-width: var(--social-center-max);
  margin-inline: auto;
}

@media (max-width: 63.99rem) {
  .social-layout:not(.social-layout--single) {
    grid-template-columns: 15rem minmax(0, 1fr);
  }

  .social-layout__side--right {
    display: none;
  }
}

@media (max-width: 52rem) {
  .social-layout:not(.social-layout--single) {
    display: block;
    width: 100%;
    max-width: 100vw;
  }

  .social-layout {
    height: auto;
    max-height: none;
    overflow: visible;
  }

  .social-layout__side {
    display: none;
  }

  .social-layout:not(.social-layout--single) .social-layout__main {
    width: 100%;
    max-width: 100vw;
    height: auto;
    overflow: visible;
    padding-bottom: calc(5rem + env(safe-area-inset-bottom));
  }
}
</style>
