import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, reactive } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ store: null }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => auth.store }))
vi.mock('@/mobile/home/HomeTab.vue', () => ({
  default: { name: 'HomeTab', props: ['active'], template: '<section class="home-stub">Fil</section>' },
}))
vi.mock('@/mobile/home/mobileNotificationsStore', () => ({
  useMobileNotificationsStore: () => ({ hasUnread: false }),
}))
vi.mock('@/mobile/shell/overlayRegistry', () => {
  const sheet = { name: 'SheetStub', props: ['post'], emits: ['close'], template: '<div class="sheet-stub" @click="$emit(\'close\')">{{ post?.id }}</div>' }
  const screen = { name: 'ScreenStub', emits: ['close'], template: '<div class="screen-stub"></div>' }
  const OVERLAYS = { notifications: { component: screen, restorable: true }, publier: { component: sheet, restorable: true }, commentaires: { component: sheet } }
  return { OVERLAYS, canRestoreOverlay: (name) => Boolean(OVERLAYS[name]?.restorable) }
})

import BottomSheet from '@/mobile/ui/BottomSheet.vue'
import MobileTabBar from '@/mobile/shell/MobileTabBar.vue'
import MobileAppShell from '@/mobile/shell/MobileAppShell.vue'
import { useMobileShell } from '@/mobile/shell/useMobileShell'
import { buildTabs } from '@/mobile/shell/tabs'

const USER = 'etudiant-1'
let mounts = 0
const page = (name) => defineComponent({
  name,
  setup() {
    mounts += 1
    const shell = useMobileShell()
    return () => h('div', { class: 'page-stub', 'data-page': name }, [
      h('button', { class: 'open-comments', onClick: () => shell.open('commentaires', { post: { id: 'p9' } }) }, name),
    ])
  },
})

function makeRouter() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/feed', name: 'FeedView', component: page('Feed') },
      { path: '/institution', name: 'Institution', component: page('Institutions') },
      { path: '/mobile-search', name: 'MobileSearchView', component: page('Recherche') },
      { path: '/quiz', name: 'QuizListView', component: page('Quiz'), meta: { title: 'Quiz' } },
      { path: '/map', name: 'Map', component: page('Carte') },
      { path: '/profile/:id', name: 'Profile', component: page('Profil') },
      { path: '/create', name: 'Create', component: page('Créer'), meta: { mobileChrome: 'none' } },
    ],
  })
}

async function mountShell(start = '/feed') {
  const router = makeRouter()
  await router.push(start)
  await router.isReady()
  const wrapper = mount(MobileAppShell, { global: { plugins: [router], stubs: { Transition: true, TransitionGroup: true } }, attachTo: document.body })
  await flushPromises()
  return { wrapper, router }
}

const tabButton = (wrapper, label) => wrapper.findAll('.m-tabs__item').find((button) => button.text() === label)
const settle = async () => { await flushPromises(); await new Promise((resolve) => setTimeout(resolve, 0)); await flushPromises() }

describe('barre d’onglets', () => {
  it('affiche les cinq onglets, signale l’onglet actif et émet le choix', async () => {
    const wrapper = mount(MobileTabBar, { props: { tabs: buildTabs(USER), active: 'search' } })
    expect(wrapper.findAll('button').map((button) => button.text())).toEqual(['Accueil', 'Institutions', 'Recherche', 'Carte', 'Profil'])
    expect(wrapper.get('[aria-current="page"]').text()).toBe('Recherche')
    await wrapper.findAll('button')[3].trigger('click')
    expect(wrapper.emitted('select')[0]).toEqual(['map'])
  })
})

describe('panneau du bas', () => {
  let wrapper
  afterEach(() => wrapper?.unmount())

  it('est une fenêtre de dialogue nommée, qui prend le focus', () => {
    wrapper = mount(BottomSheet, { props: { title: 'Commentaires' }, slots: { default: '<p>Contenu</p>', footer: '<button>Envoyer</button>' }, attachTo: document.body })
    const panel = wrapper.get('[role="dialog"]')
    expect(panel.attributes('aria-modal')).toBe('true')
    expect(document.getElementById(panel.attributes('aria-labelledby')).textContent).toBe('Commentaires')
    expect(document.activeElement).toBe(panel.element)
    expect(wrapper.find('.m-sheet__footer').exists()).toBe(true)
  })

  it('se ferme par la croix, le fond et la touche Échap', async () => {
    wrapper = mount(BottomSheet, { props: { title: 'Publier' }, attachTo: document.body })
    await wrapper.get('[aria-label="Fermer"]').trigger('click')
    await wrapper.get('.m-sheet__scrim').trigger('click')
    await wrapper.get('.m-sheet').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('close')).toHaveLength(3)
  })

  it('reste ouvert pendant un envoi', async () => {
    wrapper = mount(BottomSheet, { props: { title: 'Publier', locked: true }, attachTo: document.body })
    await wrapper.get('.m-sheet__scrim').trigger('click')
    await wrapper.get('.m-sheet').trigger('keydown', { key: 'Escape' })
    expect(wrapper.emitted('close')).toBeUndefined()
  })
})

describe('coque de l’application mobile', () => {
  let wrapper
  let router
  beforeEach(() => {
    setActivePinia(createPinia())
    auth.store = reactive({ user: { id: USER } })
    mounts = 0
  })
  afterEach(() => wrapper?.unmount())

  it('affiche l’écran mobile de l’accueil à la place de la page d’ordinateur', async () => {
    ({ wrapper, router } = await mountShell('/feed'))
    expect(wrapper.find('.home-stub').exists()).toBe(true)
    expect(wrapper.find('[data-page="Feed"]').exists()).toBe(false)
    expect(wrapper.get('h1.m-header__title').text()).toBe('Accueil')
    expect(wrapper.get('.m-tabs__item[aria-current="page"]').text()).toBe('Accueil')
    expect(wrapper.find('[aria-label="Créer une publication"]').exists()).toBe(true)
    expect(wrapper.find('[aria-label="Notifications"]').exists()).toBe(true)
  })

  it('ouvre les autres onglets avec les pages existantes, sans les recharger au retour', async () => {
    ({ wrapper, router } = await mountShell('/feed'))
    await tabButton(wrapper, 'Institutions').trigger('click'); await settle()
    expect(router.currentRoute.value.path).toBe('/institution')
    expect(wrapper.find('[data-page="Institutions"]').exists()).toBe(true)
    expect(wrapper.find('.home-stub').isVisible()).toBe(false)

    await tabButton(wrapper, 'Carte').trigger('click'); await settle()
    await tabButton(wrapper, 'Institutions').trigger('click'); await settle()
    await tabButton(wrapper, 'Accueil').trigger('click'); await settle()
    expect(wrapper.find('.home-stub').isVisible()).toBe(true)
    // Une seule création par page : les onglets sont gardés en mémoire.
    expect(mounts).toBe(2)
  })

  it('empile un écran avec bouton retour, et l’onglet retrouve cet écran', async () => {
    ({ wrapper, router } = await mountShell('/mobile-search'))
    expect(wrapper.find('.m-header [aria-label="Retour"]').exists()).toBe(false)
    await router.push('/quiz'); await settle()
    expect(wrapper.get('.m-header__title').text()).toBe('Quiz')
    expect(wrapper.find('.m-header [aria-label="Retour"]').exists()).toBe(true)

    await tabButton(wrapper, 'Accueil').trigger('click'); await settle()
    await tabButton(wrapper, 'Recherche').trigger('click'); await settle()
    expect(router.currentRoute.value.path).toBe('/quiz')

    await wrapper.get('.m-header [aria-label="Retour"]').trigger('click'); await settle()
    expect(router.currentRoute.value.path).toBe('/mobile-search')
    expect(wrapper.find('.m-header [aria-label="Retour"]').exists()).toBe(false)
  })

  it('ouvre un panneau depuis un écran et le ferme au retour', async () => {
    ({ wrapper, router } = await mountShell('/institution'))
    await wrapper.get('.open-comments').trigger('click'); await settle()
    expect(router.currentRoute.value.hash).toBe('#/commentaires')
    expect(wrapper.get('.sheet-stub').text()).toBe('p9')

    router.back(); await settle()
    expect(router.currentRoute.value.fullPath).toBe('/institution')
    expect(wrapper.find('.sheet-stub').exists()).toBe(false)
  })

  it('ferme le panneau quand il le demande lui-même', async () => {
    ({ wrapper, router } = await mountShell('/feed'))
    await wrapper.get('[aria-label="Créer une publication"]').trigger('click'); await settle()
    expect(router.currentRoute.value.hash).toBe('#/publier')
    await wrapper.get('.sheet-stub').trigger('click'); await settle()
    expect(router.currentRoute.value.fullPath).toBe('/feed')
    expect(wrapper.find('.sheet-stub').exists()).toBe(false)
  })

  it('nettoie l’adresse d’un panneau impossible à rouvrir après un rechargement', async () => {
    ({ wrapper, router } = await mountShell('/feed#/commentaires'))
    await settle()
    expect(router.currentRoute.value.fullPath).toBe('/feed')
    expect(wrapper.find('.sheet-stub').exists()).toBe(false)
  })

  it('laisse tout l’écran aux pages qui ont leur propre en-tête', async () => {
    ({ wrapper, router } = await mountShell('/create'))
    expect(wrapper.find('.m-header').exists()).toBe(false)
    expect(wrapper.find('.m-tabs').exists()).toBe(false)
    expect(wrapper.find('[data-page="Créer"]').exists()).toBe(true)
  })
})
