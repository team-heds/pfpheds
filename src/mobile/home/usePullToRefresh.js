import { onBeforeUnmount, onMounted, ref } from 'vue'

const TRIGGER = 64
const MAX_PULL = 96

/**
 * Tirer pour rafraîchir : quand la liste est tout en haut, tirer vers le bas
 * fait descendre un indicateur ; au-delà du seuil, relâcher lance `onRefresh`.
 */
export function usePullToRefresh(scrollerRef, onRefresh) {
  const pull = ref(0)
  const refreshing = ref(false)
  let startY = null
  let startX = 0

  const onStart = (event) => {
    if (refreshing.value || event.touches.length !== 1) return
    if ((scrollerRef.value?.scrollTop || 0) > 0) return
    startY = event.touches[0].clientY
    startX = event.touches[0].clientX
  }
  const onMove = (event) => {
    if (startY === null) return
    const dy = event.touches[0].clientY - startY
    const dx = Math.abs(event.touches[0].clientX - startX)
    // Geste horizontal (stories, pastilles) ou liste qui a défilé : on laisse faire.
    if ((scrollerRef.value?.scrollTop || 0) > 0 || (pull.value === 0 && dx > Math.abs(dy))) {
      startY = null
      pull.value = 0
      return
    }
    pull.value = dy > 0 ? Math.min(MAX_PULL, dy * 0.5) : 0
  }
  const onEnd = async () => {
    if (startY === null) return
    startY = null
    if (pull.value < TRIGGER) {
      pull.value = 0
      return
    }
    refreshing.value = true
    pull.value = TRIGGER
    try {
      await onRefresh()
    } finally {
      refreshing.value = false
      pull.value = 0
    }
  }

  onMounted(() => {
    const el = scrollerRef.value
    if (!el) return
    el.addEventListener('touchstart', onStart, { passive: true })
    el.addEventListener('touchmove', onMove, { passive: true })
    el.addEventListener('touchend', onEnd)
    el.addEventListener('touchcancel', onEnd)
  })
  onBeforeUnmount(() => {
    const el = scrollerRef.value
    if (!el) return
    el.removeEventListener('touchstart', onStart)
    el.removeEventListener('touchmove', onMove)
    el.removeEventListener('touchend', onEnd)
    el.removeEventListener('touchcancel', onEnd)
  })

  return { pull, refreshing, threshold: TRIGGER }
}
