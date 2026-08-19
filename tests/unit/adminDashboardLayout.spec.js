import { mount } from '@vue/test-utils'
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

describe('admin dashboard layout', () => {
  it('applies the wide layout only when explicitly requested', () => {
    const wide = mount(AdminLayout, {
      props: { wide: true },
      slots: { default: '<p>Dashboard</p>' },
      global: { stubs: layoutStubs },
    })
    const standard = mount(AdminLayout, {
      slots: { default: '<p>Administration</p>' },
      global: { stubs: layoutStubs },
    })

    expect(wide.get('.admin-layout').classes()).toContain('is-wide')
    expect(standard.get('.admin-layout').classes()).not.toContain('is-wide')
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
})
