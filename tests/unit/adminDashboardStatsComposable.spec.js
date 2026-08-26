import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

const { fetchStatsMock, mapKpisMock } = vi.hoisted(() => ({
  fetchStatsMock: vi.fn(),
  mapKpisMock: vi.fn(() => []),
}))

vi.mock('@/service/adminDashboardStatsService', () => ({
  ADMIN_DASHBOARD_DOMAINS: ['general', 'pfp', 'academic', 'gamification'],
  fetchAdminDashboardStats: fetchStatsMock,
  mapAdminDashboardKpis: mapKpisMock,
}))

import { useAdminDashboardStats } from '@/composables/useAdminDashboardStats'

const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

describe('useAdminDashboardStats', () => {
  beforeEach(() => vi.clearAllMocks())

  it('ignore une réponse ancienne après un changement rapide de période', async () => {
    const month = deferred()
    const week = deferred()
    fetchStatsMock.mockReturnValueOnce(month.promise).mockReturnValueOnce(week.promise)
    const period = ref('month')
    const stats = useAdminDashboardStats({ domains: ['general'], period })

    const firstLoad = stats.load()
    period.value = 'week'
    const secondLoad = stats.load({ force: true })
    week.resolve({ asOf: 'week', domains: { general: { status: 'ok' } } })
    await secondLoad
    month.resolve({ asOf: 'month', domains: { general: { status: 'ok' } } })
    await firstLoad

    expect(stats.data.value.asOf).toBe('week')
    expect(fetchStatsMock).toHaveBeenNthCalledWith(2, expect.objectContaining({ period: 'week', force: true }))
  })

  it('conserve une erreur réessayable sans fabriquer de données', async () => {
    fetchStatsMock.mockRejectedValueOnce(new Error('service indisponible'))
    const stats = useAdminDashboardStats({ domains: ['general'] })

    await expect(stats.load()).rejects.toThrow('service indisponible')
    expect(stats.data.value).toBeNull()
    expect(stats.error.value?.message).toBe('service indisponible')
    expect(stats.status.value).toBe('error')
  })
})
