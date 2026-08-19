import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock, countStudentsMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  countStudentsMock: vi.fn(),
}))

vi.mock('@/supabase', () => ({
  supabase: { from: fromMock },
}))

vi.mock('@/service/studentDirectoryService', () => ({
  default: { countStudents: countStudentsMock },
}))

vi.mock('@/composables/useInputValidation', () => ({
  validateId: () => ({ valid: true }),
  validateEmail: () => ({ valid: true }),
}))

import { fetchQuickStats, fetchQuickStatsWithTrends } from '@/service/dashboardQuickStatsService'
import { assignTrackRole } from '@/service/adminDashboardService'

describe('data integrity services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    countStudentsMock.mockResolvedValue(12)
  })

  it('rejects quick stats when one upstream count fails instead of returning zeroes', async () => {
    fromMock.mockImplementation((table) => {
      if (table === 'user_profiles') {
        return {
          select: () => ({
            or: () => Promise.resolve({ data: [{ user_id: 'teacher-1' }], error: null }),
          }),
        }
      }

      return {
        select: () => ({
          limit: () => Promise.resolve(table === 'places'
            ? { count: null, error: { message: 'network down' } }
            : { count: 4, error: null }),
        }),
      }
    })

    await expect(fetchQuickStats()).rejects.toThrow('Impossible de compter places')
  })

  it('does not report a role assignment as successful when no row was affected', async () => {
    fromMock.mockReturnValue({
      update: () => ({
        eq: () => ({
          select: () => Promise.resolve({ data: [], error: null }),
        }),
      }),
    })

    const result = await assignTrackRole('user-1', 'PHY', 'EnseignantPhysio', 'admin-1')

    expect(result.success).toBe(false)
    expect(result.message).toContain('Aucun utilisateur modifié')
  })

  it('ne relit pas deux fois les mêmes statistiques pour une tendance non historisée', async () => {
    fromMock.mockImplementation((table) => {
      if (table === 'user_profiles') {
        return {
          select: () => ({ or: () => Promise.resolve({ data: [], error: null }) }),
        }
      }
      return {
        select: () => ({ limit: () => Promise.resolve({ count: 4, error: null }) }),
      }
    })

    await fetchQuickStatsWithTrends()

    expect(countStudentsMock).toHaveBeenCalledTimes(1)
  })
})
