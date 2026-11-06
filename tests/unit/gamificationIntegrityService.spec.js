import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockGet = vi.fn()
const mockPost = vi.fn()
const mockNormalizeApiError = vi.fn((error) => error)

vi.mock('@/service/apiClient', () => ({
  apiClient: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
  },
  normalizeApiError: (...args) => mockNormalizeApiError(...args),
}))

const {
  getGamificationIntegrityReport,
  simulateGamificationIntegrityPlan,
} = await import('@/service/gamificationIntegrityService')

beforeEach(() => {
  mockGet.mockReset()
  mockPost.mockReset()
  mockNormalizeApiError.mockClear()
})

describe('gamificationIntegrityService', () => {
  it('requests the report using a path relative to the /api base URL', async () => {
    const report = { issues: [] }
    mockGet.mockResolvedValue({ data: report })

    await expect(getGamificationIntegrityReport()).resolves.toEqual(report)
    expect(mockGet).toHaveBeenCalledWith('/admin/gamification-integrity/report')
  })

  it('simulates a plan using a path relative to the /api base URL', async () => {
    const plan = { simulated: true }
    const issueIds = ['missing_house:user-1:record-1']
    mockPost.mockResolvedValue({ data: plan })

    await expect(simulateGamificationIntegrityPlan(issueIds)).resolves.toEqual(plan)
    expect(mockPost).toHaveBeenCalledWith('/admin/gamification-integrity/plan', { issueIds })
  })

  it('normalizes report request errors', async () => {
    const error = new Error('request failed')
    mockGet.mockRejectedValue(error)

    await expect(getGamificationIntegrityReport()).rejects.toBe(error)
    expect(mockNormalizeApiError).toHaveBeenCalledWith(error)
  })
})
