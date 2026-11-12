import { nextTick, onBeforeUnmount, onMounted, watch } from 'vue'

/**
 * Garde la position de défilement d'un écran qui reste en mémoire : un bloc
 * masqué ou détaché de la page perd son défilement, on le note donc en continu
 * et on le remet quand l'écran redevient visible.
 */
export function useKeptScroll(scrollerRef, isActive) {
  let saved = 0
  const onScroll = () => {
    if (isActive()) saved = scrollerRef.value?.scrollTop || 0
  }
  const restore = async () => {
    await nextTick()
    if (scrollerRef.value && scrollerRef.value.scrollTop !== saved) scrollerRef.value.scrollTop = saved
  }

  onMounted(() => scrollerRef.value?.addEventListener('scroll', onScroll, { passive: true }))
  onBeforeUnmount(() => scrollerRef.value?.removeEventListener('scroll', onScroll))
  watch(isActive, (active) => {
    if (active) void restore()
  })

  return {
    restore,
    position: () => saved,
    scrollToTop(smooth = true) {
      saved = 0
      scrollerRef.value?.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' })
    },
  }
}
