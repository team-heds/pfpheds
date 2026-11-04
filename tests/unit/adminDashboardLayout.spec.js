import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/common/utils/Navbar.vue', () => ({
  default: { name: 'Navbar', template: '<nav />' },
}))

vi.mock('@/components/admin/lists/AdminSidebar.vue', () => ({
  default: { name: 'AdminSidebar', template: '<div class="admin-sidebar-stub" />' },
}))

import AdminLayout from '@/components/admin/layouts/AdminLayout.vue'
import DashboardStatCard from '@/components/admin/widgets/DashboardStatCard.vue'

const layoutStubs = {
  Navbar: { template: '<nav />' },
  AdminSidebar: { template: '<div class="admin-sidebar-stub" />' },
}

async function makeRouter() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/admin', component: { template: '<div />' } },
      { path: '/admin/other', component: { template: '<div />' } },
    ],
  })
  await router.push('/admin')
  await router.isReady()
  return router
}

describe('admin dashboard layout', () => {
  it('applies the wide layout only when explicitly requested', async () => {
    const router = await makeRouter()
    const wide = mount(AdminLayout, {
      props: { wide: true },
      slots: { default: '<p>Dashboard</p>' },
      global: { plugins: [router], stubs: layoutStubs },
    })
    const standard = mount(AdminLayout, {
      slots: { default: '<p>Administration</p>' },
      global: { plugins: [router], stubs: layoutStubs },
    })

    expect(wide.get('.admin-layout').classes()).toContain('is-wide')
    expect(standard.get('.admin-layout').classes()).not.toContain('is-wide')
    wide.unmount()
    standard.unmount()
  })

  it('keeps focus in a filter when only the query changes and focuses the next page title', async () => {
    const router = await makeRouter()
    const wrapper = mount(AdminLayout, {
      attachTo: document.body,
      slots: { default: '<h1>Planning</h1><input aria-label="Classe" />' },
      global: { plugins: [router], stubs: layoutStubs },
    })
    await flushPromises()
    const filter = wrapper.get('input').element
    filter.focus()
    await router.push('/admin?classe=BA25')
    await flushPromises()
    expect(document.activeElement).toBe(filter)

    await router.push('/admin/other')
    await flushPromises()
    expect(document.activeElement).toBe(wrapper.get('h1').element)
    wrapper.unmount()
  })

  it('announces and renders the loading state of a quick statistic', () => {
    const wrapper = mount(DashboardStatCard, {
      props: {
        label: 'Étudiants',
        value: 194,
        icon: 'pi pi-users',
        loading: true,
      },
      global: {
        stubs: {
          Skeleton: { template: '<span class="skeleton-stub" />' },
        },
      },
    })

    expect(wrapper.get('article').attributes('aria-busy')).toBe('true')
    expect(wrapper.get('article').attributes('aria-label')).toContain('chargement')
    expect(wrapper.findAll('.skeleton-stub')).toHaveLength(4)
    expect(wrapper.text()).not.toContain('194')
  })

  it('distingue une statistique indisponible d’un vrai zéro', () => {
    const unavailable = mount(DashboardStatCard, {
      props: { label: 'Étudiants', value: null, status: 'error', icon: 'pi pi-users' },
    })
    const zero = mount(DashboardStatCard, {
      props: { label: 'Étudiants', value: 0, status: 'ok', icon: 'pi pi-users' },
    })

    expect(unavailable.text()).toContain('Indisponible')
    expect(unavailable.text()).not.toMatch(/>0</)
    expect(zero.get('.dashboard-stat__value').text()).toBe('0')
  })
})
