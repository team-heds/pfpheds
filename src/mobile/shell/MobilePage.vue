<template>
  <div ref="scrollerRef" class="m-page" :class="{ 'm-page--bare': bare }">
    <component :is="component" />
  </div>
</template>

<script setup>
import { onActivated, onBeforeUnmount, onDeactivated, onMounted, ref, watch } from 'vue'
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
  watchTitle()
})
onDeactivated(() => {
  active.value = false
})

// Le grand titre en haut d'une page existante répète celui de l'en-tête de
// l'application : il reste lu par les lecteurs d'écran mais n'est plus affiché.
const TITLE_ZONE = 220
let observer = null
let stopTimer = null
function hideDuplicateTitle() {
  const root = scrollerRef.value
  if (!root) return
  const heading = [...root.querySelectorAll('h1')].find((el) => !el.closest('.m-sr-only, [hidden]'))
  if (!heading || heading.classList.contains('m-page__title-hidden')) return
  const offset = heading.getBoundingClientRect().top - root.getBoundingClientRect().top + root.scrollTop
  if (offset < TITLE_ZONE) heading.classList.add('m-page__title-hidden')
}
function stopWatching() {
  observer?.disconnect()
  observer = null
  clearTimeout(stopTimer)
}
// Les pages affichent leur titre après chargement : on regarde quelques secondes.
function watchTitle() {
  stopWatching()
  hideDuplicateTitle()
  if (!window.MutationObserver || !scrollerRef.value) return
  observer = new MutationObserver(hideDuplicateTitle)
  observer.observe(scrollerRef.value, { childList: true, subtree: true })
  stopTimer = setTimeout(stopWatching, 4000)
}
onMounted(watchTitle)
onBeforeUnmount(stopWatching)

const { scrollTopSignal } = storeToRefs(useMobileShellStore())
watch(scrollTopSignal, () => {
  if (active.value) kept.scrollToTop()
})
</script>

<style scoped>
.m-page :deep(.m-page__title-hidden) {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  margin: -1px !important;
  padding: 0 !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}
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
