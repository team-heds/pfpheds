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
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 3fr) minmax(0, 1fr);
  gap: 1.5rem;
  height: calc(100vh - var(--navbar-h) - (2 * var(--content-pad)));
  max-height: calc(100vh - var(--navbar-h) - (2 * var(--content-pad)));
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

@media (max-width: 1366px) {
  .social-layout:not(.social-layout--single) {
    grid-template-columns: minmax(0, 0.8fr) minmax(0, 2.5fr) minmax(0, 0.8fr);
    gap: 1rem;
  }
}

@media (max-width: 1200px) {
  .social-layout:not(.social-layout--single) {
    grid-template-columns: minmax(0, 0.7fr) minmax(0, 2.8fr) minmax(0, 0.7fr);
    gap: 0.8rem;
  }
}

@media (max-width: 1024px) {
  .social-layout:not(.social-layout--single) {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  }

  .social-layout__side--right {
    display: none;
  }
}

@media (max-width: 768px) {
  .social-layout:not(.social-layout--single) {
    display: block;
    width: 100%;
    max-width: 100vw;
  }

  .social-layout__side {
    display: none;
  }

  .social-layout__main {
    width: 100%;
    max-width: 100vw;
  }
}
</style>
