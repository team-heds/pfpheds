import { mount, flushPromises } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const storeState = vi.hoisted(() => ({ auth: null, user: null, role: null }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => storeState.auth }))
vi.mock('@/stores/userStore', () => ({ useUserStore: () => storeState.user }))
vi.mock('@/stores/role', () => ({ useRoleStore: () => storeState.role }))
vi.mock('@/supabase', () => ({ supabase: {} }))
vi.mock('@/components/common/utils/Navbar.vue', () => ({ default: { template: '<header />' } }))

import MobileToolsView from '@/views/apps/tools/MobileToolsView.vue'
import MobileTabBar from '@/mobile/shell/MobileTabBar.vue'
import { buildTabs, tabForPath } from '@/mobile/shell/tabs'
import { getNavigationDestinations, getVotationDestination } from '@/composables/useNavigationDestinations'
import appRoutes from '@/router/routes/apps'
import adminRoutes from '@/router/routes/admin'
import pagesRoutes from '@/router/routes/pages'
import profileRoutes from '@/router/routes/profiles'
import votationRoutes from '@/router/routes/votations'

function makeRouter() {
  const routes = [...adminRoutes, ...pagesRoutes, ...profileRoutes, ...votationRoutes, ...appRoutes]
    .map(route => ({ ...route, redirect: undefined, beforeEnter: undefined, component: { template: '<div />' } }))
  routes.push({ path: '/feed', name: 'FeedForTest', component: { template: '<div />' }, meta: { requiresAuth: true } })
  return createRouter({ history: createMemoryHistory(), routes })
}

function context(router, permissions = []) {
  return {
    router,
    userId: 'student-test',
    profile: { pfp_cohort: 'PFP1A' },
    permissions,
    isAuthenticated: true,
    isSuper: permissions.includes('super.all'),
    can: requirement => (Array.isArray(requirement) ? requirement : [requirement]).some(permission => permissions.includes(permission)),
    features: { gamesHub: false },
  }
}

describe('Mobile navigation hub destinations', () => {
  it('resolves the existing PFP1B voting route and keeps the normal route for other cohorts', () => {
    expect(getVotationDestination({ pfp_cohort: 'PFP1B' })).toBe('/votation_pfp1b')
    expect(getVotationDestination({ pfp_cohort: 'PFP1A' })).toBe('/votation')
    expect(getVotationDestination({ pfp_cohort: 'BA25-PHY' })).toBe('/votation')
    expect(getVotationDestination(null)).toBe('/votation')
  })

  it('gives an authenticated student real study links without administrative destinations', () => {
    const destinations = getNavigationDestinations(context(makeRouter()))
    expect(destinations.map(item => item.key)).toEqual(expect.arrayContaining(['votation', 'institutions', 'documents', 'map', 'events', 'profile', 'notes', 'tools']))
    expect(destinations.some(item => item.section === 'administration')).toBe(false)
    expect(destinations.find(item => item.key === 'profile').to).toBe('/profile/student-test')
    expect(destinations.some(item => item.key === 'games')).toBe(false)
  })

  it('does not offer authenticated destinations without an identity', () => {
    const values = context(makeRouter())
    expect(getNavigationDestinations({ ...values, isAuthenticated: false, userId: null })).toEqual([])
  })

  it('offers the personal progression hub only while its rollout is enabled', () => {
    const values = context(makeRouter())
    expect(getNavigationDestinations(values).some(item => item.key === 'progression')).toBe(false)
    const enabled = getNavigationDestinations({ ...values, features: { userJourney: true } })
    expect(enabled.find(item => item.key === 'progression')).toMatchObject({ to: '/gamification-profile', label: 'Ma progression' })
  })

  it('shows only the permitted administration for a minimal nursing teacher', () => {
    const destinations = getNavigationDestinations(context(makeRouter(), ['EnseignantSoins']))
    expect(destinations.filter(item => item.section === 'administration').map(item => item.key)).toEqual(['teacher'])
  })

  it('distinguishes nursing module responsibility from secretariat management', () => {
    const destinations = getNavigationDestinations(context(makeRouter(), ['RMSoins']))
    expect(destinations.filter(item => item.section === 'administration').map(item => item.key)).toEqual(['rm', 'teacher'])
    expect(destinations.some(item => item.key === 'secretariat')).toBe(false)
  })

  it('retains the academic restricted navigation policy', () => {
    const destinations = getNavigationDestinations(context(makeRouter(), ['academic.restricted', 'auth.redirect.dashboard_rm']))
    expect(destinations.map(item => item.key)).toEqual(['profile', 'rm'])
  })

  it('uses route permissions for administrators and feature availability for games', () => {
    const router = makeRouter()
    const values = { ...context(router, ['super.all']), features: { gamesHub: true } }
    const destinations = getNavigationDestinations(values)
    expect(destinations.filter(item => item.section === 'administration').map(item => item.key)).toEqual(['admin', 'rm', 'teacher', 'secretariat'])
    expect(destinations.find(item => item.key === 'games').to).toBe('/game')
  })

  it('omits a destination whose route is unavailable', () => {
    const router = makeRouter()
    const resolve = router.resolve.bind(router)
    const missingEventRouter = { resolve: to => to === '/events' ? resolve('/missing-event-page') : resolve(to) }
    expect(getNavigationDestinations(context(missingEventRouter)).some(item => item.key === 'events')).toBe(false)
  })

  it('keeps both mobile hub URLs authenticated with distinct route names', () => {
    const hubRoutes = appRoutes.filter(route => ['/mobile-tools', '/mobile-outils'].includes(route.path))
    expect(hubRoutes).toHaveLength(2)
    expect(new Set(hubRoutes.map(route => route.name)).size).toBe(2)
    expect(hubRoutes.every(route => route.meta.requiresAuth && route.meta.title === 'Mon espace')).toBe(true)
    const router = makeRouter()
    expect(router.resolve('/mobile-tools').name).toBe('MobileToolsLegacy')
    expect(router.resolve('/mobile-outils').name).toBe('MobileToolsView')
  })
})

describe('Mobile navigation hub interface', () => {
  let router
  let wrapper

  beforeEach(() => {
    router = makeRouter()
    storeState.auth = reactive({ user: { id: 'student-test' }, initializeAuth: vi.fn() })
    storeState.user = reactive({ profile: { pfp_cohort: 'PFP1B' }, init: vi.fn() })
    storeState.role = reactive({ perms: [], isSuper: false, init: vi.fn(), can(requirement) {
      return (Array.isArray(requirement) ? requirement : [requirement]).some(permission => this.perms.includes(permission))
    } })
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.unstubAllGlobals()
  })

  it('renders named navigation links and no diagnostic notification controls', async () => {
    await router.push('/mobile-outils')
    await router.isReady()
    wrapper = mount(MobileToolsView, { global: { plugins: [router] } })
    expect(wrapper.get('h1').text()).toBe('Mon espace')
    expect(wrapper.get('a[href="/votation_pfp1b"]').text()).toContain('Votation')
    expect(wrapper.get('a[href="/documents_pfp"]').text()).toContain('Documents PFP')
    expect(wrapper.get('a[href="/institution"]').text()).toContain('Institutions')
    expect(wrapper.find('button').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Push Notifications')
    expect(wrapper.text()).not.toContain('Notifier tous les admins')
    expect(wrapper.text()).not.toContain('Interface en cours de développement')
    expect(storeState.auth.initializeAuth).not.toHaveBeenCalled()
    expect(storeState.user.init).not.toHaveBeenCalled()
    expect(storeState.role.init).not.toHaveBeenCalled()

    await wrapper.get('a[href="/documents_pfp"]').trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/documents_pfp')
  })

  it('updates the destinations with the current identity and permissions without fetching data', async () => {
    await router.push('/mobile-outils')
    wrapper = mount(MobileToolsView, { global: { plugins: [router] } })
    expect(wrapper.find('a[href="/admin"]').exists()).toBe(false)
    storeState.role.perms = ['admin']
    await nextTick()
    expect(wrapper.get('a[href="/admin"]').text()).toContain('Administration')
    storeState.auth.user = null
    storeState.role.perms = []
    await nextTick()
    expect(wrapper.find('a[href="/profile/student-test"]').exists()).toBe(false)
    expect(wrapper.find('a[href="/admin"]').exists()).toBe(false)
    expect(storeState.role.init).not.toHaveBeenCalled()
  })

  it('shows the five tabs of the mobile app and highlights the hub inside the search tab', async () => {
    await router.push('/mobile-tools')
    wrapper = mount(MobileTabBar, {
      props: { tabs: buildTabs('student-test'), active: tabForPath('/mobile-tools', { userId: 'student-test' }) },
    })
    expect(wrapper.findAll('button')).toHaveLength(5)
    expect(wrapper.get('[aria-current="page"]').text()).toContain('Recherche')
    expect(wrapper.findAll('button').at(4).text()).toContain('Profil')
  })
})
