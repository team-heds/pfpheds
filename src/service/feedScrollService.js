export function readFeedScroll({ isMobile, container, windowObject = window }) {
  return isMobile ? windowObject.scrollY : container?.scrollTop || 0
}

export function restoreFeedScroll({ isMobile, container, scrollTop, windowObject = window }) {
  const safeScrollTop = Math.max(0, Number(scrollTop) || 0)
  if (isMobile) windowObject.scrollTo({ top: safeScrollTop, behavior: 'auto' })
  else if (container) container.scrollTop = safeScrollTop
}
