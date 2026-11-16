import { onBeforeUnmount, onMounted } from 'vue'
import { createEdgeSwipe, startsInHorizontalArea } from '@/mobile/shell/edgeSwipe'

const SETTLE = 'transform 220ms cubic-bezier(0, 0, 0.2, 1)'
const CLEAN_AFTER = 360

/** Application installée sur iPhone ou iPad : la seule à n'avoir aucun geste de retour. */
export function isInstalledIosApp(win = typeof window === 'undefined' ? null : window) {
  return win?.navigator?.standalone === true
}

/**
 * Glisser depuis le bord gauche ramène à l'écran précédent ; l'écran suit le
 * doigt, puis part vers la droite ou revient en place.
 *
 * - `enabled()` : le geste a-t-il un sens ici (écran empilé, panneau plein écran) ?
 * - `target()` : l'élément qui suit le doigt (l'écran du dessus).
 * - `onBack()` : revenir en arrière, comme le bouton de l'en-tête.
 */
export function useEdgeSwipeBack(rootRef, { enabled, target, onBack, win = typeof window === 'undefined' ? null : window }) {
  let tracker = null
  let element = null
  let cleanTimer = null

  const reducedMotion = () => Boolean(win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches)

  const clearStyles = (el) => {
    if (!el) return
    el.style.transition = ''
    el.style.transform = ''
    el.style.boxShadow = ''
    el.style.willChange = ''
  }

  const point = (event) => {
    const touch = event.touches?.[0] || event.changedTouches?.[0]
    return touch ? { x: touch.clientX, y: touch.clientY, t: event.timeStamp || Date.now() } : null
  }

  function onStart(event) {
    tracker = null
    element = null
    if (event.touches?.length !== 1 || !enabled()) return
    const p = point(event)
    const root = rootRef.value
    if (!p || !root || startsInHorizontalArea(event.target, root)) return
    const swipe = createEdgeSwipe({ width: win?.innerWidth || root.clientWidth || 375 })
    if (!swipe.start(p)) return
    tracker = swipe
  }

  function onMove(event) {
    if (!tracker) return
    const p = point(event)
    if (!p) return
    const { state, dx } = tracker.move(p)
    if (state === 'cancel') {
      tracker = null
      return
    }
    if (state !== 'drag') return
    // Le doigt part de côté : la page ne défile plus, l'écran suit le doigt.
    if (event.cancelable) event.preventDefault()
    if (!element) {
      element = target()
      if (!element) {
        tracker = null
        return
      }
      clearTimeout(cleanTimer)
      element.style.transition = 'none'
      element.style.willChange = 'transform'
      element.style.boxShadow = '-12px 0 24px rgba(0, 0, 0, 0.22)'
    }
    element.style.transform = `translateX(${dx}px)`
  }

  function onEnd(event) {
    if (!tracker) return
    const result = tracker.end()
    const engaged = result.engaged
    // Geste interrompu par le système : l'écran revient en place.
    const commit = result.commit && event?.type !== 'touchcancel'
    tracker = null
    const el = element
    element = null
    if (!engaged || !el) return
    if (commit) {
      if (!reducedMotion()) {
        el.style.transition = SETTLE
        el.style.transform = 'translateX(100%)'
      }
      onBack()
    } else {
      el.style.transition = reducedMotion() ? 'none' : SETTLE
      el.style.transform = 'translateX(0)'
    }
    // L'écran quitté peut rester en mémoire (KeepAlive) : il doit revenir propre.
    cleanTimer = setTimeout(() => clearStyles(el), CLEAN_AFTER)
  }

  onMounted(() => {
    if (!isInstalledIosApp(win)) return
    const root = rootRef.value
    if (!root) return
    root.addEventListener('touchstart', onStart, { passive: true })
    root.addEventListener('touchmove', onMove, { passive: false })
    root.addEventListener('touchend', onEnd, { passive: true })
    root.addEventListener('touchcancel', onEnd, { passive: true })
  })

  onBeforeUnmount(() => {
    clearTimeout(cleanTimer)
    const root = rootRef.value
    if (!root) return
    root.removeEventListener('touchstart', onStart)
    root.removeEventListener('touchmove', onMove)
    root.removeEventListener('touchend', onEnd)
    root.removeEventListener('touchcancel', onEnd)
  })

  return { onStart, onMove, onEnd }
}
