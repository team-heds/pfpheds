import { describe, expect, it, vi, beforeEach } from 'vitest'

vi.mock('@/service/apiClient', () => ({ default: { post: vi.fn() } }))
import apiClient from '@/service/apiClient'
import { sendAdminPasswordRecovery } from '@/service/adminPasswordRecoveryService'

describe('adminPasswordRecoveryService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends only the encoded account id', async () => {
    apiClient.post.mockResolvedValue({ data: { status: 'sent' } })
    await expect(sendAdminPasswordRecovery('user/id')).resolves.toEqual({ status: 'sent' })
    expect(apiClient.post).toHaveBeenCalledWith('/admin/users/user%2Fid/password-recovery')
  })
})
