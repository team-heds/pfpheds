import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { installPageNavigation, resolvePageTitle } from '@/service/pageNavigationService'

const route = (path, meta = {}, extra = {}) => ({ path, fullPath: path, meta, ...extra })
const settle = async () => { await Promise.resolve(); await Promise.resolve(); await Promise.resolve(); await Promise.resolve() }
const geometry = (element, height = 2000, width = 800) => {
  Object.defineProperties(element, {
    scrollHeight: { configurable: true, value: height },
    clientHeight: { configurable: true, value: 400 },
    scrollWidth: { configurable: true, value: width },
    clientWidth: { configurable: true, value: 400 },
  })
}

function createRouter(initial = route('/feed')) {
  const before = new Set()
  const after = new Set()
  const router = {
    currentRoute: { value: initial },
    beforeEach(callback) { before.add(callback); return () => before.delete(callback) },
    afterEach(callback) { after.add(callback); return () => after.delete(callback) },
    start(to, { popPosition } = {}) {
      const from = router.currentRoute.value
      if (popPosition !== undefined) {
        window.history.replaceState({ position: popPosition }, '', to.fullPath)
        window.dispatchEvent(new PopStateEvent('popstate', { state: window.history.state }))
      }
      before.forEach(callback => callback(to, from))
      return {
        finish({ failure, position = 1, html } = {}) {
          if (!failure) {
            router.currentRoute.value = to
            if (popPosition === undefined) window.history.replaceState({ position }, '', to.fullPath)
            if (html !== undefined) document.body.innerHTML = html
          }
          after.forEach(callback => callback(to, from, failure))
        },
      }
    },
  }
  return router
}

describe('contexte de page après navigation', () => {
  let service
  beforeEach(() => {
    document.body.innerHTML = '<div id="main-content" class="content"><h1>Fil d’actualité</h1><input aria-label="Recherche"></div>'
    document.title = 'Ancien titre'
    window.history.replaceState({ position: 0 }, '', '/feed')
  })
  afterEach(() => { service?.dispose(); service = null; vi.restoreAllMocks() })

  it('préfère un titre explicite et ne transforme pas les identifiants techniques en titre', () => {
    expect(resolvePageTitle(route('/admin/detail/123', { title: 'Suivi des étudiants' }), 'Autre titre')).toBe('Suivi des étudiants — HEdS')
    expect(resolvePageTitle(route('/institution'), 'Institutions')).toBe('Institutions — HEdS')
    expect(resolvePageTitle(route('/unknown/123'))).toBe('Plateforme — HEdS')
  })

  it('synchronise le titre initial sans déplacer le focus', async () => {
    const input = document.querySelector('input')
    input.focus()
    service = installPageNavigation(createRouter())
    await settle()
    expect(document.title).toBe('Fil d’actualité — HEdS')
    expect(document.activeElement).toBe(input)
  })

  it('annonce la nouvelle page et place le focus sur son titre après rendu', async () => {
    const router = createRouter()
    service = installPageNavigation(router)
    await settle()
    router.start(route('/institution')).finish({ html: '<main><h1>Institutions partenaires</h1><button>Détails</button></main>' })
    await settle()
    const heading = document.querySelector('h1')
    expect(document.title).toBe('Institutions partenaires — HEdS')
    expect(document.activeElement).toBe(heading)
    expect(heading.tabIndex).toBe(-1)
  })

  it('ne vole pas le focus lors des filtres query ou d’un changement de fragment', async () => {
    const router = createRouter(route('/institution'))
    service = installPageNavigation(router)
    await settle()
    const input = document.querySelector('input')
    input.focus()
    router.start(route('/institution', {}, { fullPath: '/institution?canton=VS' })).finish()
    await settle()
    expect(document.activeElement).toBe(input)
    router.start(route('/institution', {}, { fullPath: '/institution?canton=VS#results', hash: '#results' })).finish()
    await settle()
    expect(document.activeElement).toBe(input)
  })

  it('laisse AdminLayout propriétaire du focus et met tout de même le titre à jour', async () => {
    const router = createRouter()
    service = installPageNavigation(router)
    await settle()
    router.start(route('/admin/suivi')).finish({ html: '<main id="admin-content"><h1>Suivi étudiant</h1><button>Modifier</button></main>' })
    const button = document.querySelector('button')
    button.focus()
    await settle()
    expect(document.activeElement).toBe(button)
    expect(document.title).toBe('Suivi étudiant — HEdS')
  })

  it('restaure les défilements imbriqués au retour historique, sans les réappliquer à une nouvelle visite', async () => {
    const router = createRouter(route('/institution'))
    const list = '<div class="content"><main class="main-content"><h1>Institutions</h1></main></div>'
    document.body.innerHTML = list
    const outer = document.querySelector('.content')
    const inner = document.querySelector('.main-content')
    geometry(outer); geometry(inner)
    service = installPageNavigation(router)
    await settle()
    outer.scrollTop = 120
    inner.scrollTop = 900
    inner.scrollLeft = 50
    router.start(route('/institution/one')).finish({ html: '<div class="content"><h1>Une institution</h1></div>' })
    await settle()
    const returning = router.start(route('/institution'), { popPosition: 0 })
    returning.finish({ html: list })
    geometry(document.querySelector('.content')); geometry(document.querySelector('.main-content'))
    await settle()
    expect(document.querySelector('.content').scrollTop).toBe(120)
    expect(document.querySelector('.main-content').scrollTop).toBe(900)
    expect(document.querySelector('.main-content').scrollLeft).toBe(50)

    router.start(route('/institution/two')).finish({ position: 2, html: '<div class="content"><h1>Autre institution</h1></div>' })
    await settle()
    router.start(route('/institution')).finish({ position: 3, html: list })
    geometry(document.querySelector('.content')); geometry(document.querySelector('.main-content'))
    await settle()
    expect(document.querySelector('.main-content').scrollTop).toBe(0)
  })

  it('attend la hauteur réelle des résultats pour restaurer une liste chargée de manière asynchrone', async () => {
    const router = createRouter(route('/institution'))
    document.body.innerHTML = '<main class="main-content"><h1>Institutions</h1></main>'
    geometry(document.querySelector('main'))
    service = installPageNavigation(router)
    await settle()
    document.querySelector('main').scrollTop = 800
    router.start(route('/institution/one')).finish({ html: '<main><h1>Une institution</h1></main>' })
    await settle()
    router.start(route('/institution'), { popPosition: 0 }).finish({ html: '<main class="main-content"><h1>Institutions</h1></main>' })
    geometry(document.querySelector('main'), 400)
    await settle()
    expect(document.querySelector('main').scrollTop).toBe(0)
    geometry(document.querySelector('main'), 2000)
    document.querySelector('main').appendChild(document.createElement('section'))
    await settle()
    expect(document.querySelector('main').scrollTop).toBe(800)
  })

  it('attend aussi la hauteur du document au retour sur une liste mobile asynchrone, puis arrête l’observation', async () => {
    vi.useFakeTimers()
    const page = document.scrollingElement || document.documentElement
    const properties = ['scrollHeight', 'clientHeight', 'scrollTop']
    const originalProperties = new Map(properties.map(key => [key, Object.getOwnPropertyDescriptor(page, key)]))
    try {
      const router = createRouter(route('/institution'))
      let pageHeight = 2000
      let pageTop = 0
      Object.defineProperties(page, {
        scrollHeight: { configurable: true, get: () => pageHeight },
        clientHeight: { configurable: true, get: () => 400 },
        scrollTop: {
          configurable: true,
          get: () => pageTop,
          set: value => { pageTop = Math.max(0, Math.min(value, pageHeight - 400)) },
        },
      })
      const observer = vi.spyOn(window.MutationObserver.prototype, 'disconnect')
      document.body.innerHTML = '<main><h1>Institutions</h1></main>'
      service = installPageNavigation(router, { observationTimeout: 500 })
      await settle()
      page.scrollTop = 800
      router.start(route('/institution/one')).finish({ html: '<main><h1>Une institution</h1></main>' })
      await settle()
      pageHeight = 400
      router.start(route('/institution'), { popPosition: 0 }).finish({ html: '<main><h1>Institutions</h1></main>' })
      await settle()
      expect(page.scrollTop).toBe(0)
      const completedBeforeLoad = observer.mock.calls.length
      pageHeight = 2000
      document.querySelector('main').appendChild(document.createElement('section'))
      await settle()
      expect(page.scrollTop).toBe(800)
      expect(observer.mock.calls.length).toBeGreaterThan(completedBeforeLoad)

      // A position which never becomes available does not leave a live observer.
      router.start(route('/institution/two')).finish({ position: 2, html: '<main><h1>Autre institution</h1></main>' })
      await settle()
      pageHeight = 400
      router.start(route('/institution'), { popPosition: 0 }).finish({ html: '<main><h1>Institutions</h1></main>' })
      await settle()
      const completedBeforeTimeout = observer.mock.calls.length
      vi.advanceTimersByTime(500)
      expect(observer.mock.calls.length).toBeGreaterThan(completedBeforeTimeout)
      expect(page.scrollTop).toBe(0)
    } finally {
      properties.forEach(key => {
        const original = originalProperties.get(key)
        if (original) Object.defineProperty(page, key, original)
        else delete page[key]
      })
      vi.useRealTimers()
    }
  })

  it('restaure un défileur opt-in comme celui des documents à chaque déplacement historique arrière ou avant', async () => {
    const router = createRouter(route('/documents_pfp'))
    const list = '<div class="documents-container scrollable-container" data-page-scroll><h1>Documents PFP</h1></div>'
    document.body.innerHTML = list
    geometry(document.querySelector('[data-page-scroll]'))
    service = installPageNavigation(router)
    await settle()
    document.querySelector('[data-page-scroll]').scrollTop = 650
    router.start(route('/documents_pfp/one')).finish({ position: 1, html: '<main><h1>Un document</h1></main>' })
    await settle()
    router.start(route('/documents_pfp'), { popPosition: 0 }).finish({ html: list })
    geometry(document.querySelector('[data-page-scroll]'))
    await settle()
    expect(document.querySelector('[data-page-scroll]').scrollTop).toBe(650)
    router.start(route('/documents_pfp/one'), { popPosition: 1 }).finish({ html: '<main><h1>Un document</h1></main>' })
    await settle()
    router.start(route('/documents_pfp'), { popPosition: 0 }).finish({ html: list })
    geometry(document.querySelector('[data-page-scroll]'))
    await settle()
    expect(document.querySelector('[data-page-scroll]').scrollTop).toBe(650)
  })

  it('garde un titre stable pendant le chargement puis utilise le nom de la fiche sans refocaliser', async () => {
    const router = createRouter()
    service = installPageNavigation(router)
    await settle()
    router.start(route('/institution/one')).finish({ html: '<main><h1>Chargement…</h1></main>' })
    const focus = vi.spyOn(HTMLElement.prototype, 'focus')
    await settle()
    expect(document.title).toBe('Institutions — HEdS')
    expect(document.activeElement).toBe(document.querySelector('main'))
    expect(focus).toHaveBeenCalledTimes(1)
    document.querySelector('h1').textContent = 'Cabinet Dynaphyz'
    await settle()
    expect(document.title).toBe('Cabinet Dynaphyz — HEdS')
    expect(document.activeElement).toBe(document.querySelector('main'))
    expect(focus).toHaveBeenCalledTimes(1)
  })

  it('ignore une navigation abandonnée et les effets retardés d’une navigation précédente', async () => {
    let resolveTick
    const router = createRouter()
    service = installPageNavigation(router, { nextTick: () => new Promise(resolve => { resolveTick = resolve }) })
    const first = router.start(route('/institution'))
    first.finish({ html: '<main><h1>Institutions</h1></main>' })
    const oldTick = resolveTick
    const second = router.start(route('/documents_pfp'))
    second.finish({ position: 2, html: '<main><h1>Documents PFP</h1></main>' })
    oldTick()
    resolveTick()
    await settle()
    expect(document.title).toBe('Documents PFP — HEdS')
    expect(document.activeElement.textContent).toBe('Documents PFP')

    const input = document.createElement('input')
    document.body.appendChild(input)
    input.focus()
    router.start(route('/admin')).finish({ failure: new Error('Accès refusé') })
    await settle()
    expect(document.title).toBe('Documents PFP — HEdS')
    expect(document.activeElement).toBe(input)
  })

  it('n’utilise pas un titre de publication du feed pour nommer la page', async () => {
    document.body.innerHTML = '<div id="main-content"><article><h1>Un titre de publication</h1></article></div>'
    service = installPageNavigation(createRouter())
    await settle()
    expect(document.title).toBe('Fil d’actualité — HEdS')
  })

  it('nettoie les hooks et annule l’observation après destruction', async () => {
    const router = createRouter()
    service = installPageNavigation(router)
    await settle()
    service.dispose()
    router.start(route('/institution')).finish({ html: '<h1>Institutions</h1>' })
    await settle()
    expect(document.title).toBe('Fil d’actualité — HEdS')
    expect(document.activeElement).not.toBe(document.querySelector('h1'))
  })
})
