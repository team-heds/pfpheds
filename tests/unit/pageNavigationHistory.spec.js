import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createApp, h, nextTick } from 'vue'
import { createRouter, createWebHistory, RouterView } from 'vue-router'
import { installPageNavigation } from '@/service/pageNavigationService'

const settle = async () => { await nextTick(); await Promise.resolve(); await Promise.resolve() }

describe('contexte de page avec le véritable historique Vue Router', () => {
  let app
  let routerHistory
  let service
  let originalScrollRestoration

  beforeEach(() => {
    document.body.innerHTML = '<div id="navigation-app"></div>'
    window.history.replaceState(null, '', '/institution')
    originalScrollRestoration = Object.getOwnPropertyDescriptor(window.history, 'scrollRestoration')
    Object.defineProperty(window.history, 'scrollRestoration', { configurable: true, writable: true, value: 'auto' })
  })

  afterEach(() => {
    service?.dispose()
    app?.unmount()
    routerHistory?.destroy()
    service = app = routerHistory = null
    if (originalScrollRestoration) Object.defineProperty(window.history, 'scrollRestoration', originalScrollRestoration)
    else delete window.history.scrollRestoration
  })

  async function mountNavigation({ omitServicePopstate = false } = {}) {
    const List = { render: () => h('section', { 'data-page-scroll': '' }, [h('h1', 'Institutions'), h('button', 'Détails')]) }
    const Detail = { render: () => h('main', [h('h1', 'Cabinet des Arcades')]) }
    routerHistory = createWebHistory()
    const router = createRouter({
      history: routerHistory,
      routes: [
        { path: '/institution', name: 'InstitutionList', component: List },
        { path: '/institutions', component: List },
        { path: '/institution/:id', component: Detail },
      ],
    })
    app = createApp({ render: () => h('div', { id: 'main-content', class: 'content' }, [h(RouterView)]) })
    app.use(router)
    // Vue Router keeps the real window and receives native history events. Only
    // the presentation service misses popstate, as observed in the embedded UI.
    const serviceWindow = omitServicePopstate ? {
      history: window.history,
      MutationObserver: window.MutationObserver,
      setTimeout: window.setTimeout.bind(window),
      clearTimeout: window.clearTimeout.bind(window),
      addEventListener: (event, ...args) => { if (event !== 'popstate') window.addEventListener(event, ...args) },
      removeEventListener: (event, ...args) => { if (event !== 'popstate') window.removeEventListener(event, ...args) },
    } : window
    service = installPageNavigation(router, { nextTick, window: serviceWindow })
    app.mount('#navigation-app')
    await router.isReady()
    await settle()
    return router
  }

  async function backTo(router, path, delta = -1) {
    await new Promise(resolve => {
      const remove = router.afterEach(to => {
        if (to.path === path) { remove(); resolve() }
      })
      router.go(delta)
    })
    await settle()
  }

  it('restaure le défileur partagé au retour natif, malgré l’ordre réel de popstate et des gardes', async () => {
    // jsdom has no native persisted-scroll restoration. Leaving the property
    // absent verifies history keys/guard ordering independently of its ownership.
    delete window.history.scrollRestoration
    const router = await mountNavigation()
    const content = document.querySelector('.content')
    Object.defineProperties(content, {
      scrollHeight: { configurable: true, value: 3000 },
      clientHeight: { configurable: true, value: 743 },
    })
    const listPosition = window.history.state.position
    content.scrollTop = 2257
    await router.push('/institution/arcades')
    await settle()
    expect(content.scrollTop).toBe(0)
    expect(window.history.state.position).toBe(listPosition + 1)
    await backTo(router, '/institution')
    expect(window.history.state.position).toBe(listPosition)
    expect(document.title).toBe('Institutions — HEdS')
    expect(content.scrollTop).toBe(2257)
  })

  it('prend en charge la restauration native et rétablit son réglage au démontage', async () => {
    await mountNavigation()
    expect(window.history.scrollRestoration).toBe('manual')
    service.dispose()
    expect(window.history.scrollRestoration).toBe('auto')
  })

  it('déduit les retours et avances de leur position historique sans recevoir popstate, et réinitialise une nouvelle visite', async () => {
    const router = await mountNavigation({ omitServicePopstate: true })
    const content = document.querySelector('.content')
    Object.defineProperties(content, {
      scrollHeight: { configurable: true, value: 3000 },
      clientHeight: { configurable: true, value: 743 },
    })
    const listPosition = window.history.state.position
    content.scrollTop = 2257
    await router.push('/institution/arcades')
    await settle()
    expect(content.scrollTop).toBe(0)
    content.scrollTop = 180
    await backTo(router, '/institution')
    expect(window.history.state.position).toBe(listPosition)
    expect(content.scrollTop).toBe(2257)
    await backTo(router, '/institution/arcades', 1)
    expect(window.history.state.position).toBe(listPosition + 1)
    expect(content.scrollTop).toBe(180)
    await router.push('/institution')
    await settle()
    expect(window.history.state.position).toBe(listPosition + 2)
    expect(content.scrollTop).toBe(0)
  })

  it('restaure aussi une ancienne entrée devenue une redirection, sans notification popstate au service', async () => {
    const router = await mountNavigation({ omitServicePopstate: true })
    const content = document.querySelector('.content')
    Object.defineProperties(content, {
      scrollHeight: { configurable: true, value: 3000 },
      clientHeight: { configurable: true, value: 743 },
    })
    const listPosition = window.history.state.position
    content.scrollTop = 2257
    await router.push('/institution/arcades')
    await settle()
    router.removeRoute('InstitutionList')
    router.addRoute({ path: '/institution', redirect: '/institutions' })
    await backTo(router, '/institutions')
    expect(window.history.state.position).toBe(listPosition)
    expect(content.scrollTop).toBe(2257)
    expect(document.title).toBe('Institutions — HEdS')
  })

  it('respecte un réglage natif modifié après son installation', async () => {
    window.history.scrollRestoration = 'manual'
    await mountNavigation()
    window.history.scrollRestoration = 'auto'
    service.dispose()
    expect(window.history.scrollRestoration).toBe('auto')
  })
})
