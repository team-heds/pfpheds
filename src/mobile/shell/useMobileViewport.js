import { onScopeDispose, ref } from 'vue'
import { MOBILE_BREAKPOINT_QUERY } from '@/mobile/shell/tabs'

/** Vrai tant que la fenêtre a la largeur d'un téléphone. Suit les changements de taille. */
export function useMobileViewport(win = typeof window !== 'undefined' ? window : null) {
  const query = win?.matchMedia ? win.matchMedia(MOBILE_BREAKPOINT_QUERY) : null
  const isMobile = ref(Boolean(query?.matches))
  if (!query) return isMobile

  const onChange = (event) => {
    isMobile.value = event.matches
  }
  if (query.addEventListener) query.addEventListener('change', onChange)
  else query.addListener?.(onChange)
  onScopeDispose(() => {
    if (query.removeEventListener) query.removeEventListener('change', onChange)
    else query.removeListener?.(onChange)
  })
  return isMobile
}
