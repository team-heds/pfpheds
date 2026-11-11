// Sur téléphone, ce n'est pas la fenêtre qui défile mais le bloc principal de
// l'application (.content dans App.vue). Ces aides retrouvent le bloc qui
// défile réellement, pour écouter et restaurer le bon défilement.

/** Premier ancêtre qui défile verticalement, sinon la fenêtre. */
export function findPageScroller(element, win = window) {
  let node = element?.parentElement || null
  while (node && node !== win.document?.documentElement) {
    const overflowY = win.getComputedStyle(node).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll') return node
    node = node.parentElement
  }
  return win
}

// Un bloc expose scrollTop ; la fenêtre (ou son équivalent en test) ne l'expose pas.
const isWindow = target => typeof target?.scrollTop !== 'number'

/** Position et dimensions de défilement, pour la fenêtre comme pour un bloc. */
export function getScrollMetrics(target, win = window) {
  if (!target || isWindow(target)) {
    const root = win.document.documentElement
    return {
      scrollTop: win.scrollY || root.scrollTop || 0,
      clientHeight: win.innerHeight || root.clientHeight,
      scrollHeight: root.scrollHeight,
    }
  }
  return { scrollTop: target.scrollTop, clientHeight: target.clientHeight, scrollHeight: target.scrollHeight }
}

export function setScrollTop(target, top, win = window) {
  if (!target || isWindow(target)) (target || win).scrollTo({ top, behavior: 'auto' })
  else target.scrollTop = top
}
