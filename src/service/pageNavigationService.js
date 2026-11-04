const SCROLL_SELECTORS = ['[data-page-scroll]', '.content', '.main-content', '.admin-content']
const TITLE_SUFFIX = 'HEdS'
const FALLBACK_TITLES = [
  ['/reset-password', 'Réinitialisation du mot de passe'],
  ['/new-password', 'Nouveau mot de passe'],
  ['/documents_pfp', 'Documents PFP'],
  ['/document_pfp', 'Documents PFP'],
  ['/documents', 'Documents PFP'],
  ['/mobile-outils', 'Mon espace'],
  ['/mobile-tools', 'Mon espace'],
  ['/mobile-search', 'Recherche'],
  ['/institution', 'Institutions'],
  ['/votation', 'Votation'],
  ['/profile', 'Profil'],
  ['/communities', 'Communautés'],
  ['/event-management', 'Événements'],
  ['/events', 'Événements'],
  ['/alpinphysio', 'Alp’in Physio'],
  ['/outils', 'Outils'],
  ['/tools', 'Outils'],
  ['/admin', 'Administration'],
  ['/map', 'Carte des institutions'],
  ['/feed', 'Fil d’actualité'],
  ['/home', 'Connexion'],
  ['/access', 'Accès à la page'],
]

const text = value => typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''
const fullPath = route => route?.fullPath || route?.path || '/'
const provisionalHeading = /^(?:chargement\b|(?:veuillez\s+)?patient(?:ez|er)\b|loading\b|please wait\b)/i

function pageHeading(document) {
  return Array.from(document.querySelectorAll('[data-page-title], main h1, #main-content h1, h1'))
    .find(element => text(element.textContent)
      && !provisionalHeading.test(text(element.textContent))
      && !element.closest('[hidden], [aria-hidden="true"], article, .post-content, .post-body, .post-item, .post-card, [data-post-id]')) || null
}

export function resolvePageTitle(route, heading = '') {
  const explicit = text(route?.meta?.title) || text(route?.meta?.pageTitle)
  const fallback = FALLBACK_TITLES.find(([prefix]) => route?.path === prefix || route?.path?.startsWith(`${prefix}/`))?.[1]
  const title = explicit || text(heading) || fallback
  return title ? `${title} — ${TITLE_SUFFIX}` : `Plateforme — ${TITLE_SUFFIX}`
}

function captureScroll(document) {
  const entries = []
  const seen = new Set()
  for (const selector of SCROLL_SELECTORS) {
    Array.from(document.querySelectorAll(selector)).forEach((element, index) => {
      if (seen.has(element)) return
      seen.add(element)
      entries.push({ selector, index, top: element.scrollTop, left: element.scrollLeft })
    })
  }
  const page = document.scrollingElement || document.documentElement
  return { entries, page: { top: page?.scrollTop || 0, left: page?.scrollLeft || 0 } }
}

function restoreScroll(document, snapshot, completed) {
  if (!snapshot) return true
  const page = document.scrollingElement || document.documentElement
  const canRestore = (element, position) => position.top <= Math.max(0, element.scrollHeight - element.clientHeight)
    && position.left <= Math.max(0, element.scrollWidth - element.clientWidth)
  if (page && !completed.has('page') && canRestore(page, snapshot.page)) {
    page.scrollTop = snapshot.page.top
    page.scrollLeft = snapshot.page.left
    completed.add('page')
  }
  snapshot.entries.forEach((entry, position) => {
    if (completed.has(position)) return
    const element = document.querySelectorAll(entry.selector)[entry.index]
    if (!element) return
    // Wait for asynchronous list content instead of clamping a saved position
    // to the height of its temporary empty/loading state.
    if (!canRestore(element, entry)) return
    element.scrollTop = entry.top
    element.scrollLeft = entry.left
    completed.add(position)
  })
  return completed.has('page') && snapshot.entries.every((_entry, index) => completed.has(index))
}

/**
 * Install navigation presentation only. This hook never changes access rules,
 * submits data or stores route information outside this tab's memory.
 *
 * Pass Vue's nextTick from the router integration. AdminLayout remains the
 * owner of its existing focus management. Call clearHistory on account change.
 */
export function installPageNavigation(router, {
  document = globalThis.document,
  window = globalThis.window,
  nextTick = () => Promise.resolve(),
  maxEntries = 50,
  observationTimeout = 2500,
} = {}) {
  if (!document || !window) return { dispose() {}, clearHistory() {}, refresh: async () => {} }
  const history = window.history
  const previousScrollRestoration = history?.scrollRestoration
  const managesScrollRestoration = history && 'scrollRestoration' in history
  // Vue Router only disables native restoration when scrollBehavior is set.
  // This service owns nested scrollers too: native popstate restoration must
  // not overwrite positions applied after the route has rendered.
  if (managesScrollRestoration) history.scrollRestoration = 'manual'
  const snapshots = new Map()
  const attempts = new WeakMap()
  let disposed = false
  let generation = 0
  let stopObserving = () => {}
  let pendingInteraction = null
  let popTarget = null
  let currentEntry = historyKey(router.currentRoute?.value)

  function historyKey(route) {
    const position = window.history?.state?.position
    return Number.isFinite(position) ? `history:${position}` : `route:${fullPath(route)}`
  }

  function remember(key, snapshot) {
    snapshots.delete(key)
    snapshots.set(key, snapshot)
    while (snapshots.size > maxEntries) snapshots.delete(snapshots.keys().next().value)
  }

  const interrupt = () => {
    if (pendingInteraction) pendingInteraction.interrupted = true
  }
  const onPopState = () => { popTarget = historyKey() }
  window.addEventListener('popstate', onPopState)
  for (const event of ['pointerdown', 'keydown', 'wheel', 'touchstart']) document.addEventListener(event, interrupt, { passive: true, capture: true })

  async function updatePage(route, { focus = false, resetScroll = false, snapshot = null, token = generation } = {}) {
    await nextTick()
    // Let existing component nextTick focus handlers complete first.
    await Promise.resolve()
    if (disposed || token !== generation) return
    stopObserving()
    const interaction = { interrupted: false }
    pendingInteraction = interaction
    const completed = new Set()
    let focused = false
    let reset = false
    let observer = null
    let timeout = null
    const stop = () => {
      observer?.disconnect()
      if (timeout !== null) window.clearTimeout(timeout)
      if (pendingInteraction === interaction) pendingInteraction = null
      if (stopObserving === stop) stopObserving = () => {}
    }
    stopObserving = stop

    const apply = () => {
      if (disposed || token !== generation) return stop()
      const heading = pageHeading(document)
      document.title = resolvePageTitle(route, heading?.textContent)
      if (resetScroll && !reset && !interaction.interrupted) {
        const scrollers = new Set(SCROLL_SELECTORS.flatMap(selector => Array.from(document.querySelectorAll(selector))))
        scrollers.add(document.scrollingElement || document.documentElement)
        scrollers.forEach(element => { if (element) { element.scrollTop = 0; element.scrollLeft = 0 } })
        reset = true
      }
      if (focus && !focused && !interaction.interrupted) {
        const admin = document.getElementById('admin-content')
        const target = heading || (!admin && document.querySelector('main, #main-content'))
        // Preserve focus already placed inside the admin page. If its title
        // arrives asynchronously, complete the otherwise missing arrival focus.
        if (admin?.contains(document.activeElement) && document.activeElement !== admin) {
          focused = true
        } else if (target) {
          if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
          if (document.activeElement !== target) {
            try { target.focus({ preventScroll: true }) } catch { target.focus() }
          }
          focused = true
        }
      }
      const restored = interaction.interrupted || restoreScroll(document, snapshot, completed)
      if (heading && restored) stop()
    }

    if (window.MutationObserver) {
      observer = new window.MutationObserver(apply)
      observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    }
    // This bounds observation resources; it never delays focus or navigation.
    timeout = window.setTimeout(stop, observationTimeout)
    apply()
  }

  const removeBefore = router.beforeEach((to, from) => {
    remember(currentEntry, captureScroll(document))
    stopObserving()
    const destinationEntry = historyKey(to)
    // A push changes its history position only after guards have succeeded.
    // An already different position here therefore identifies a traversal,
    // including when this service missed the browser's popstate notification.
    const traversedHistory = currentEntry.startsWith('history:')
      && destinationEntry.startsWith('history:') && destinationEntry !== currentEntry
    const attempt = { token: ++generation, isPop: popTarget === destinationEntry || traversedHistory }
    popTarget = null
    attempts.set(to, attempt)
  })

  const removeAfter = router.afterEach((to, from, failure) => {
    const attempt = attempts.get(to)
    if (disposed || failure || (attempt && attempt.token !== generation)) return
    currentEntry = historyKey(to)
    void updatePage(to, {
      token: attempt?.token ?? ++generation,
      focus: to.path !== from.path,
      resetScroll: to.path !== from.path && !attempt?.isPop && !to.hash,
      snapshot: attempt?.isPop ? snapshots.get(currentEntry) : null,
    })
  })

  const refresh = () => updatePage(router.currentRoute?.value, { token: generation })
  void refresh()

  return {
    refresh,
    clearHistory() {
      snapshots.clear()
      popTarget = null
      currentEntry = historyKey(router.currentRoute?.value)
      stopObserving()
      generation++
    },
    dispose() {
      disposed = true
      generation++
      stopObserving()
      snapshots.clear()
      removeBefore?.()
      removeAfter?.()
      if (managesScrollRestoration && history.scrollRestoration === 'manual') {
        history.scrollRestoration = previousScrollRestoration
      }
      window.removeEventListener('popstate', onPopState)
      for (const event of ['pointerdown', 'keydown', 'wheel', 'touchstart']) document.removeEventListener(event, interrupt, true)
    },
  }
}
