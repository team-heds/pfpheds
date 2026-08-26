import { describe, expect, it, vi } from 'vitest'
import { nextTick, reactive, ref } from 'vue'

const { fetchOptionsMock } = vi.hoisted(() => ({ fetchOptionsMock: vi.fn() }))
vi.mock('@/service/adminDashboardStatsService', () => ({
  ADMIN_DASHBOARD_FILTER_KEYS: ['track', 'role', 'class', 'cohort', 'pfp', 'institution', 'status'],
  fetchAdminDashboardFilterOptions: fetchOptionsMock,
  normalizeAdminDashboardFilters(filters = {}) {
    return Object.fromEntries(Object.entries(filters)
      .map(([key, value]) => [key, [...new Set((Array.isArray(value) ? value : [value]).filter(Boolean))].sort()])
      .filter(([, values]) => values.length))
  },
}))

import { useAdminDashboardFilters } from '@/composables/useAdminDashboardFilters'

const catalog = {
  options: {
    classes: [{ value: 'BA25', label: 'BA25' }],
    pfpTypes: [{ value: 'PFP2', label: 'PFP2' }],
  },
  applicability: {},
}

describe('useAdminDashboardFilters', () => {
  it('restaure la query, retire les valeurs inconnues et synchronise les changements', async () => {
    fetchOptionsMock.mockResolvedValue(catalog)
    const route = reactive({ query: { class: ['BA25', 'UNKNOWN'], pfp: 'PFP2', keep: 'yes' } })
    const router = {
      replace: vi.fn(async ({ query }) => { route.query = query }),
    }
    const filters = useAdminDashboardFilters({
      route,
      router,
      domains: ['pfp'],
      period: ref('month'),
    })

    await filters.loadOptions()
    expect(filters.filters.value).toEqual({ class: ['BA25'], pfp: ['PFP2'] })
    expect(router.replace).toHaveBeenCalledWith({
      query: { keep: 'yes', class: ['BA25'], pfp: ['PFP2'], period: 'month' },
    })

    await filters.removeFilter('class', 'BA25')
    expect(filters.filters.value).toEqual({ pfp: ['PFP2'] })
    expect(filters.activeFilters.value).toEqual([
      expect.objectContaining({ key: 'pfp', value: 'PFP2', label: 'PFP2' }),
    ])
  })

  it('restaure un changement de query provenant de la navigation', async () => {
    const route = reactive({ query: {} })
    const router = { replace: vi.fn(async ({ query }) => { route.query = query }) }
    const filters = useAdminDashboardFilters({ route, router, domains: ['pfp'] })
    route.query = { pfp: 'PFP2' }
    await nextTick()
    expect(filters.filters.value).toEqual({ pfp: ['PFP2'] })
  })
})
