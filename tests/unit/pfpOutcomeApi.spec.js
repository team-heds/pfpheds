import { beforeEach, describe, expect, it, vi } from 'vitest'

const { authFetch } = vi.hoisted(() => ({ authFetch: vi.fn() }))
vi.mock('@/service/apiClient', () => ({ API_URL: 'https://api.test/api', authFetch }))

import { savePfpOutcome } from '@/service/pfpOutcomeApi'

describe('pfpOutcomeApi', () => {
  beforeEach(() => authFetch.mockReset())

  it('sends one authenticated exact-id mutation', async () => {
    authFetch.mockResolvedValue({
      json: async () => ({ outcome: { id: 'assignment-1', pfp_validee: true } })
    })

    await expect(savePfpOutcome('assignment-1', 'passed')).resolves.toEqual({
      id: 'assignment-1', pfp_validee: true
    })
    expect(authFetch).toHaveBeenCalledWith('https://api.test/api/pfp-outcomes/assignment-1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: 'passed', comment: '' })
    })
  })

  it('rejects invalid local input before the network', async () => {
    await expect(savePfpOutcome('', 'passed')).rejects.toThrow(/identifiant/)
    await expect(savePfpOutcome('assignment-1', 'stopped')).rejects.toThrow(/motif/)
    expect(authFetch).not.toHaveBeenCalled()
  })
})
