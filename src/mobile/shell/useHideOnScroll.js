import { onBeforeUnmount, onMounted, watch } from 'vue'
import { useMobileShellStore } from '@/mobile/shell/mobileShellStore'
import { createScrollHider } from '@/mobile/shell/scrollHider'

/**
 * Cache la barre d'onglets quand on descend dans une longue liste et la
 * montre dès qu'on remonte. À utiliser sur les listes racines des onglets
 * (fil, institutions, recherche), jamais sur la carte ni les écrans courts.
 */
export function useHideOnScroll(scrollerRef, isActive) {
  const store = useMobileShellStore()
  const hider = createScrollHider()
  let frame = 0

  const onScroll = () => {
    if (!isActive() || frame) return
    frame = requestAnimationFrame(() => {
      frame = 0
      const el = scrollerRef.value
      if (!el) return
      store.setBarsHidden(hider.update(el))
    })
  }

  onMounted(() => scrollerRef.value?.addEventListener('scroll', onScroll, { passive: true }))
  onBeforeUnmount(() => {
    scrollerRef.value?.removeEventListener('scroll', onScroll)
    cancelAnimationFrame(frame)
  })
  // Changement d'écran : la barre revient.
  watch(isActive, () => {
    hider.reset()
    store.setBarsHidden(false)
  })
}
