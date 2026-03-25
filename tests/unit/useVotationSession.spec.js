import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock supabase before importing the composable
vi.mock('@/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ count: 5 }))
        }))
      }))
    }))
  }
}))

vi.mock('@/service/votationSessionService', () => ({
  default: {
    getActiveSession: vi.fn(),
    openSession: vi.fn(),
    closeSession: vi.fn(),
    fetchAll: vi.fn()
  }
}))

import { useVotationSession } from '@/composables/useVotationSession'
import votationSessionService from '@/service/votationSessionService'

describe('useVotationSession', () => {
  let toast
  let userStore
  let session

  beforeEach(() => {
    vi.clearAllMocks()
    toast = { add: vi.fn() }
    userStore = { user: { id: 'user-123' } }
    session = useVotationSession(toast, userStore)
  })

  describe('initial state', () => {
    it('has null currentSession', () => {
      expect(session.currentSession.value).toBeNull()
    })

    it('sessionIsOpen is false when no session', () => {
      expect(session.sessionIsOpen.value).toBe(false)
    })

    it('sessionLoading is false', () => {
      expect(session.sessionLoading.value).toBe(false)
    })

    it('showSessionDialog is false', () => {
      expect(session.showSessionDialog.value).toBe(false)
    })
  })

  describe('sessionIsOpen computed', () => {
    it('returns true when session status is open', () => {
      session.currentSession.value = { status: 'open' }
      expect(session.sessionIsOpen.value).toBe(true)
    })

    it('returns false when session status is closed', () => {
      session.currentSession.value = { status: 'closed' }
      expect(session.sessionIsOpen.value).toBe(false)
    })

    it('returns false when session is null', () => {
      session.currentSession.value = null
      expect(session.sessionIsOpen.value).toBe(false)
    })
  })

  describe('loadCurrentSession', () => {
    it('sets session when found', async () => {
      const mockSession = { id: 1, status: 'open', pfp_type: 'PFP4', year: '2025-2026' }
      votationSessionService.getActiveSession.mockResolvedValue(mockSession)

      await session.loadCurrentSession('PFP4', '2025-2026')

      expect(votationSessionService.getActiveSession).toHaveBeenCalledWith('PFP4', '2025-2026')
      expect(session.currentSession.value).toEqual(mockSession)
    })

    it('clears session when pfpType is missing', async () => {
      session.currentSession.value = { id: 1 }
      await session.loadCurrentSession(null, '2025-2026')
      expect(session.currentSession.value).toBeNull()
    })

    it('clears session when year is missing', async () => {
      session.currentSession.value = { id: 1 }
      await session.loadCurrentSession('PFP4', null)
      expect(session.currentSession.value).toBeNull()
    })

    it('handles errors gracefully', async () => {
      votationSessionService.getActiveSession.mockRejectedValue(new Error('Network error'))

      await session.loadCurrentSession('PFP4', '2025-2026')

      expect(session.currentSession.value).toBeNull()
    })
  })

  describe('openVotation', () => {
    it('opens a session and shows success toast', async () => {
      const mockSession = { id: 1, status: 'open' }
      votationSessionService.openSession.mockResolvedValue(mockSession)

      await session.openVotation('BA25', 'PFP4', '2025-2026', 10, 20)

      expect(votationSessionService.openSession).toHaveBeenCalledWith('PFP4', '2025-2026', 'BA25', 'user-123')
      expect(session.currentSession.value).toEqual(mockSession)
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
    })

    it('shows warning when params are missing', async () => {
      await session.openVotation(null, 'PFP4', '2025-2026')

      expect(votationSessionService.openSession).not.toHaveBeenCalled()
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'warn' }))
    })

    it('sets loading state during operation', async () => {
      let loadingDuringCall = false
      votationSessionService.openSession.mockImplementation(async () => {
        loadingDuringCall = session.sessionLoading.value
        return { id: 1 }
      })

      await session.openVotation('BA25', 'PFP4', '2025-2026', 10, 20)

      expect(loadingDuringCall).toBe(true)
      expect(session.sessionLoading.value).toBe(false)
    })

    it('shows error toast on failure', async () => {
      votationSessionService.openSession.mockRejectedValue(new Error('DB error'))

      await session.openVotation('BA25', 'PFP4', '2025-2026', 10, 20)

      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }))
      expect(session.sessionLoading.value).toBe(false)
    })
  })

  describe('closeVotation', () => {
    it('closes session and clears currentSession', async () => {
      votationSessionService.closeSession.mockResolvedValue()
      session.currentSession.value = { id: 1, status: 'open' }

      await session.closeVotation('PFP4', '2025-2026')

      expect(votationSessionService.closeSession).toHaveBeenCalledWith('PFP4', '2025-2026')
      expect(session.currentSession.value).toBeNull()
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'info' }))
    })

    it('does nothing when params missing', async () => {
      await session.closeVotation(null, '2025-2026')
      expect(votationSessionService.closeSession).not.toHaveBeenCalled()
    })

    it('shows error toast on failure', async () => {
      votationSessionService.closeSession.mockRejectedValue(new Error('DB error'))

      await session.closeVotation('PFP4', '2025-2026')

      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }))
      expect(session.sessionLoading.value).toBe(false)
    })
  })

  describe('formatDuration', () => {
    it('returns dash for null openedAt', () => {
      expect(session.formatDuration(null, null)).toBe('-')
    })

    it('formats minutes only', () => {
      const opened = new Date('2026-03-18T10:00:00')
      const closed = new Date('2026-03-18T10:45:00')
      expect(session.formatDuration(opened.toISOString(), closed.toISOString())).toBe('45min')
    })

    it('formats hours and minutes', () => {
      const opened = new Date('2026-03-18T10:00:00')
      const closed = new Date('2026-03-18T12:30:00')
      expect(session.formatDuration(opened.toISOString(), closed.toISOString())).toBe('2h 30min')
    })

    it('formats 0min for same open/close time', () => {
      const t = new Date('2026-03-18T10:00:00').toISOString()
      expect(session.formatDuration(t, t)).toBe('0min')
    })
  })
})
