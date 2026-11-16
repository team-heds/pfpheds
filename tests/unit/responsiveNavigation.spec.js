import { mount, flushPromises } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const stores = vi.hoisted(() => ({ auth: null, user: null, role: null }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => stores.auth }))
vi.mock('@/stores/userStore', () => ({ useUserStore: () => stores.user }))
vi.mock('@/stores/role', () => ({ useRoleStore: () => stores.role }))
vi.mock('@/supabase', () => ({ supabase: {} }))
vi.mock('@/components/common/utils/GlobalSearch.vue', () => ({ default: { template: '<button aria-label="Rechercher">Rechercher</button>' } }))
vi.mock('@/components/ui/buttons/SwitchColor.vue', () => ({ default: { template: '<button aria-label="Activer le thème clair">Thème</button>' } }))
vi.mock('@/components/common/utils/PwaInstallPrompt.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/common/utils/VersionningComponent.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/components/gamification/notifications/GamificationNotification.vue', () => ({ default: { template: '<div />' } }))
vi.mock('@/mobile/home/HomeTab.vue', () => ({ default: { props: ['active'], template: '<section class="mobile-home-stub" />' } }))
vi.mock('@/mobile/profile/ProfileTab.vue', () => ({ default: { props: ['active'], template: '<section />' } }))
vi.mock('@/mobile/search/SearchTab.vue', () => ({ default: { props: ['active'], template: '<section />' } }))
vi.mock('@/mobile/map/MapTab.vue', () => ({ default: { props: ['active'], template: '<section />' } }))
vi.mock('@/mobile/institutions/InstitutionsTab.vue', () => ({ default: { props: ['active'], template: '<section />' } }))
vi.mock('@/mobile/institutions/InstitutionDetailScreen.vue', () => ({ default: { template: '<article />' } }))
vi.mock('@/mobile/home/mobileStoriesStore', () => ({ useMobileStoriesStore: () => ({ ownAvatarUrl: null, loadOwnAvatar: vi.fn() }) }))
vi.mock('@/mobile/home/mobileNotificationsStore', () => ({ useMobileNotificationsStore: () => ({ hasUnread: false }) }))
vi.mock('@/service/questExpirationService', () => ({ default: { startPeriodicCheck: vi.fn(), stopPeriodicCheck: vi.fn() } }))

import { createPinia } from 'pinia'
import Navbar from '@/components/common/utils/Navbar.vue'
import App from '@/App.vue'

const DialogStub = {
  props: ['visible', 'header'],
  template: '<section v-if="visible" role="dialog" :aria-label="header"><slot /></section>',
}
const ButtonStub = { props: ['label'], template: '<button><slot />{{ label }}</button>' }

function makeRouter() {
  const paths = ['/feed', '/institution', '/institution/:id', '/votation', '/votation_pfp1b', '/map', '/admin', '/admin/dashboard-rm', '/admin/settings', '/profile/:id', '/mobile-outils', '/mobile-search', '/communities', '/home']
  return createRouter({
    history: createMemoryHistory(),
    routes: paths.map(path => ({ path, component: { template: '<main><h1>Page de test</h1></main>' } })),
  })
}

describe('responsive navigation contract', () => {
  let router
  let wrapper

  beforeEach(async () => {
    stores.auth = reactive({
      user: { id: 'student-test' },
      isSupabaseUser: true,
      initialized: true,
      session: { user: { id: 'student-test' } },
      initializeAuth: vi.fn().mockResolvedValue(undefined),
      signOut: vi.fn().mockResolvedValue(undefined),
    })
    stores.user = reactive({
      initialized: true,
      profile: { role: 'student', permissions: [], pfp_cohort: 'PFP1B' },
      init: vi.fn(),
      fetchProfile: vi.fn(),
    })
    stores.role = reactive({ perms: [], isSuper: false, can: vi.fn(() => false) })
    router = makeRouter()
    await router.push('/feed')
    await router.isReady()
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.unstubAllGlobals()
  })

  const mountNavbar = async () => {
    wrapper = mount(Navbar, { global: { plugins: [router], stubs: { Dialog: DialogStub, Button: ButtonStub } } })
    await flushPromises()
    return wrapper
  }

  it('renders named primary links with the existing PFP1B destination and route active states', async () => {
    await mountNavbar()
    const navigation = wrapper.get('nav[aria-label="Navigation principale"]')
    const primaryLinks = navigation.findAll('.center-menu a')
    expect(primaryLinks.map(link => link.attributes('aria-label'))).toEqual(['Accueil', 'Institutions', 'Votation', 'Carte'])
    expect(primaryLinks.map(link => link.attributes('href'))).toEqual(['/feed', '/institution', '/votation_pfp1b', '/map'])
    expect(navigation.get('a[href="/feed"]').attributes('aria-current')).toBe('page')
    expect(navigation.get('a[href="/votation_pfp1b"]').attributes('aria-current')).toBeUndefined()

    await navigation.get('a[href="/institution"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/institution')
    expect(navigation.get('a[href="/institution"]').attributes('aria-current')).toBe('page')
    expect(navigation.get('a[href="/feed"]').attributes('aria-current')).toBeUndefined()

    await router.push('/institution/institution-test')
    await nextTick()
    expect(navigation.get('a[href="/institution"]').attributes('aria-current')).toBe('page')

    stores.user.profile.pfp_cohort = 'PFP1A'
    await nextTick()
    expect(navigation.get('a[aria-label="Votation"]').attributes('href')).toBe('/votation')
  })

  it('opens the named settings action without rendering an inoperative notification control', async () => {
    await mountNavbar()
    expect(wrapper.find('[aria-label="Notifications"]').exists()).toBe(false)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.get('button[aria-label="Rechercher"]').exists()).toBe(true)
    await wrapper.get('button[aria-label="Ouvrir les paramètres"]').trigger('click')
    const dialog = wrapper.get('[role="dialog"][aria-label="Paramètres"]')
    expect(dialog.text()).toContain('Profil')
    expect(dialog.text()).toContain('Se déconnecter')
  })

  it('preserves administrative and restricted academic destinations as identity permissions change', async () => {
    await mountNavbar()
    expect(wrapper.find('.center-menu a[href="/admin"]').exists()).toBe(false)
    stores.user.profile.role = 'admin'
    await flushPromises()
    expect(wrapper.get('.center-menu a[href="/admin"]').attributes('aria-label')).toBe('Admin')

    stores.user.profile.permissions = ['academic.restricted']
    await flushPromises()
    expect(wrapper.findAll('.center-menu a').map(link => link.attributes('href'))).toEqual(['/admin/dashboard-rm'])
  })

  it('reuses the resolved session and profile while navigating between primary destinations', async () => {
    await mountNavbar()
    expect(stores.auth.initializeAuth).toHaveBeenCalledTimes(1)
    expect(stores.user.init).not.toHaveBeenCalled()
    expect(stores.user.fetchProfile).not.toHaveBeenCalled()

    for (const href of ['/institution', '/votation_pfp1b', '/map', '/feed']) {
      await wrapper.get(`.center-menu a[href="${href}"]`).trigger('click')
      await flushPromises()
      expect(router.currentRoute.value.path).toBe(href)
    }

    expect(stores.auth.initializeAuth).toHaveBeenCalledTimes(1)
    expect(stores.user.init).not.toHaveBeenCalled()
    expect(stores.user.fetchProfile).not.toHaveBeenCalled()
  })

  const mountApp = async () => {
    wrapper = mount(App, { global: { plugins: [router, createPinia()], stubs: { Transition: true, TransitionGroup: true } } })
    // La coque et ses onglets sont chargés à la demande : on attend leur arrivée.
    for (let round = 0; round < 40; round += 1) {
      await flushPromises()
      await new Promise((resolve) => setTimeout(resolve, 25))
      if (!window.matchMedia('(max-width: 768px)').matches || !stores.auth.user || wrapper.find('nav.m-tabs').exists()) break
    }
    return wrapper
  }

  it('renders the mobile app shell on a phone, with one tab bar tied to the current auth identity', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    await mountApp()
    expect(wrapper.findAll('nav.m-tabs')).toHaveLength(1)
    expect(wrapper.findAll('nav.m-tabs button').map(button => button.attributes('aria-label'))).toEqual(['Carte', 'Institutions', 'Accueil', 'Recherche', 'Profil'])
    expect(wrapper.find('.m-shell .m-page main h1').text()).toBe('Page de test')
    expect(wrapper.find('.navbar-shell').exists()).toBe(false)

    await wrapper.findAll('nav.m-tabs button')[4].trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/profile/student-test')

    stores.auth.user = { id: 'another-test-user' }
    await nextTick()
    await wrapper.findAll('nav.m-tabs button')[0].trigger('click')
    await flushPromises()
    await wrapper.findAll('nav.m-tabs button')[4].trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/profile/another-test-user')

    await router.push('/mobile-outils')
    await flushPromises()
    expect(wrapper.findAll('nav.m-tabs')).toHaveLength(1)
    expect(wrapper.get('nav.m-tabs [aria-current="page"]').attributes('aria-label')).toBe('Recherche')
  })

  it('keeps the regular pages on a computer and on public pages, without the mobile shell', async () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    await mountApp()
    expect(wrapper.find('.m-shell').exists()).toBe(false)
    expect(wrapper.get('main h1').text()).toBe('Page de test')
    wrapper.unmount()

    vi.stubGlobal('matchMedia', () => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
    stores.auth.user = null
    await mountApp()
    expect(wrapper.find('.m-shell').exists()).toBe(false)
    expect(wrapper.get('main h1').text()).toBe('Page de test')
  })
})
