import { describe, it, expect } from 'vitest'
import { canPreviewVotation, selectPreviewSession } from '../../src/domain/pfp/votationAdminPreview'

describe('admin voting preview', () => {
  it('uses admin permissions rather than class or URL', () => {
    expect(canPreviewVotation({ id: 'admin' }, { can: (permission) => permission === 'admin' })).toBe(true)
    expect(canPreviewVotation({ id: 'student', classe: 'BA25', admin: true }, { can: () => false })).toBe(false)
    expect(canPreviewVotation(null, { can: () => true })).toBe(false)
    expect(canPreviewVotation({ id: 'pending' }, null)).toBe(false)
  })
  it('includes priority campaigns without student membership', () => {
    const priority = { id: 'p', status: 'open', is_priority: true, priority_user_ids: [] }
    const normal = { id: 'n', status: 'open' }
    expect(selectPreviewSession([priority, normal], 'p')).toBe(priority)
    expect(selectPreviewSession([priority, normal], 'n')).toBe(normal)
    expect(selectPreviewSession([{ id: 'x', status: 'closed' }, normal], 'x')).toBe(normal)
    expect(selectPreviewSession([], null)).toBeNull()
  })
})
