<template>
  <div ref="scrollerRef" class="m-page" :class="{ 'm-page--bare': bare }">
    <component :is="component" />
  </div>
</template>

<script setup>
import { onActivated, onDeactivated, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useKeptScroll } from '@/mobile/shell/useKeptScroll'
import { useMobileShellStore } from '@/mobile/shell/mobileShellStore'

// Cadre d'une page existante affichée dans la coque : une seule zone qui
// défile, dont la position est gardée tant que la page reste en mémoire.
defineProps({
  component: { type: [Object, Function], default: null },
  /** Page plein écran qui apporte son propre en-tête : pas de marge. */
  bare: { type: Boolean, default: false },
})

const scrollerRef = ref(null)
const active = ref(true)
const kept = useKeptScroll(scrollerRef, () => active.value)

onActivated(() => {
  active.value = true
})
onDeactivated(() => {
  active.value = false
})

const { scrollTopSignal } = storeToRefs(useMobileShellStore())
watch(scrollTopSignal, () => {
  if (active.value) kept.scrollToTop()
})
</script>

<style scoped>
.m-page {
  position: absolute;
  inset: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0.5rem var(--content-pad, 1rem) 1.5rem;
  background: var(--m-bg);
}
.m-page--bare {
  padding: 0;
}
</style>
