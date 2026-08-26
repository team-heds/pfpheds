import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}))

vi.mock('@/supabase', () => ({
  supabase: { from: fromMock },
}))

vi.mock('@/composables/useInputValidation', () => ({
  validateId: () => ({ valid: true }),
  validateEmail: () => ({ valid: true }),
}))

import { assignTrackRole } from '@/service/adminDashboardService'

describe('data integrity services', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
})
