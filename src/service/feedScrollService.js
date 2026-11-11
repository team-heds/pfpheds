import { getScrollMetrics, setScrollTop } from '@/utils/pageScroller'

// Sur ordinateur le fil défile dans son propre conteneur. Sur téléphone c'est
// le bloc principal de la page (pageScroller), ou la fenêtre à défaut.
export function readFeedScroll({ isMobile, container, pageScroller, windowObject = window }) {
  if (!isMobile) return container?.scrollTop || 0
  return pageScroller ? getScrollMetrics(pageScroller, windowObject).scrollTop : windowObject.scrollY
}

export function restoreFeedScroll({ isMobile, container, scrollTop, pageScroller, windowObject = window }) {
  const safeScrollTop = Math.max(0, Number(scrollTop) || 0)
  if (isMobile) setScrollTop(pageScroller || windowObject, safeScrollTop, windowObject)
  else if (container) container.scrollTop = safeScrollTop
}
