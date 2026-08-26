import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase
const { mockFrom } = vi.hoisted(() => ({
  mockFrom: vi.fn(),
}))

vi.mock('@/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}))

import votationSessionService from '@/service/votationSessionService'

// Helper pour créer des chaînes Supabase mockées
function createChain(finalResult) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(finalResult),
    maybeSingle: vi.fn().mockResolvedValue(finalResult),
    single: vi.fn().mockResolvedValue(finalResult),
  }
  // select retourne chain (pour chaîner .eq, .order, etc.)
  chain.select.mockReturnValue(chain)
  chain.insert.mockReturnValue(chain)
  chain.update.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.in.mockReturnValue(chain)
  chain.order.mockReturnValue(chain)
  return chain
}

describe('votationSessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==================== fetchAll ====================
  describe('fetchAll', () => {
    it('retourne toutes les sessions triées par date', async () => {
      const sessions = [
        { id: '1', pfp_type: 'PFP1A', year: '2026', status: 'open' },
        { id: '2', pfp_type: 'PFP2', year: '2026', status: 'closed' },
      ]
      const chain = createChain({ data: sessions, error: null })
      // fetchAll appelle: from().select().order()
      // order est le terminal, il doit résoudre directement
      chain.order.mockResolvedValue({ data: sessions, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await votationSessionService.fetchAll()
      expect(mockFrom).toHaveBeenCalledWith('votation_sessions')
      expect(chain.select).toHaveBeenCalledWith('*')
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(sessions)
    })

    it('retourne un tableau vide si pas de données', async () => {
      const chain = createChain({ data: null, error: null })
      chain.order.mockResolvedValue({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await votationSessionService.fetchAll()
      expect(result).toEqual([])
    })

    it('lance une erreur si Supabase échoue', async () => {
      const chain = createChain({ data: null, error: { message: 'DB error' } })
      chain.order.mockResolvedValue({ data: null, error: { message: 'DB error' } })
      mockFrom.mockReturnValue(chain)

      await expect(votationSessionService.fetchAll()).rejects.toEqual({ message: 'DB error' })
    })
  })

  // ==================== getActiveSession ====================
  describe('getActiveSession', () => {
    it('retourne la session active pour un PFP/année', async () => {
      const session = { id: '1', pfp_type: 'PFP1A', year: '2026', status: 'open' }
      const chain = createChain({ data: [session], error: null })
      mockFrom.mockReturnValue(chain)

      const result = await votationSessionService.getActiveSession('PFP1A', '2026')
      expect(mockFrom).toHaveBeenCalledWith('votation_sessions')
      expect(chain.eq).toHaveBeenCalledWith('pfp_type', 'PFP1A')
      expect(chain.in).toHaveBeenCalledWith('year', ['2026', '2025-2026'])
      expect(chain.eq).toHaveBeenCalledWith('status', 'open')
      expect(result).toEqual(session)
    })

    it('retourne null si aucune session active', async () => {
      const chain = createChain({ data: [], error: null })
      mockFrom.mockReturnValue(chain)

      const result = await votationSessionService.getActiveSession('PFP3', '2026')
      expect(result).toBeNull()
    })
  })

  // ==================== getAllActiveSessions ====================
  describe('getAllActiveSessions', () => {
    it('retourne toutes les sessions ouvertes', async () => {
      const sessions = [
        { id: '1', pfp_type: 'PFP1A', year: '2026', status: 'open' },
        { id: '2', pfp_type: 'PFP1B', year: '2026', status: 'open' },
      ]
      const chain = createChain({ data: sessions, error: null })
      chain.order.mockResolvedValue({ data: sessions, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await votationSessionService.getAllActiveSessions()
      expect(chain.eq).toHaveBeenCalledWith('status', 'open')
      expect(result).toEqual(sessions)
    })

    it('retourne un tableau vide si aucune session ouverte', async () => {
      const chain = createChain({ data: null, error: null })
      chain.order.mockResolvedValue({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await votationSessionService.getAllActiveSessions()
      expect(result).toEqual([])
    })
  })

  // ==================== openSession ====================
  describe('openSession', () => {
    it('ferme les sessions existantes puis en ouvre une nouvelle', async () => {
      // Premier appel: closeSession (update)
      const closeChain = createChain({ error: null })
      closeChain.eq.mockReturnValue(closeChain)
      // Le dernier .eq résout la promesse
      let callCount = 0
      mockFrom.mockImplementation(() => {
        callCount++
        if (callCount <= 1) {
          // closeSession: from().update().eq().in().eq()
          const chain = {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            in: vi.fn().mockReturnThis(),
          }
          chain.in.mockReturnValue(chain)
          // Le second eq est le terminal de cette chaîne.
          let eqCount = 0
          chain.eq.mockImplementation(() => {
            eqCount++
            if (eqCount >= 2) {
              return Promise.resolve({ error: null })
            }
            return chain
          })
          return chain
        } else {
          // openSession: from().insert().select().single()
          const newSession = {
            id: 'new-id',
            pfp_type: 'PFP1A',
            year: '2026',
            target_class: 'BA25',
            status: 'open',
          }
          const chain = {
            insert: vi.fn().mockReturnThis(),
            select: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: newSession, error: null }),
          }
          return chain
        }
      })

      const result = await votationSessionService.openSession('PFP1A', '2026', 'BA25', 'user-123')
      expect(result).toMatchObject({
        pfp_type: 'PFP1A',
        year: '2026',
        target_class: 'BA25',
        status: 'open',
      })
      // from() appelé 2 fois: closeSession + insert
      expect(mockFrom).toHaveBeenCalledTimes(2)
    })
  })

  // ==================== closeSession ====================
  describe('closeSession', () => {
    it('met à jour le statut à closed', async () => {
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      }
      chain.in.mockReturnValue(chain)
      let eqCount = 0
      chain.eq.mockImplementation(() => {
        eqCount++
        if (eqCount >= 2) {
          return Promise.resolve({ error: null })
        }
        return chain
      })
      mockFrom.mockReturnValue(chain)

      await votationSessionService.closeSession('PFP1A', '2026')

      expect(mockFrom).toHaveBeenCalledWith('votation_sessions')
      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'closed',
        })
      )
      expect(chain.eq).toHaveBeenCalledWith('pfp_type', 'PFP1A')
      expect(chain.in).toHaveBeenCalledWith('year', ['2026', '2025-2026'])
      expect(chain.eq).toHaveBeenCalledWith('status', 'open')
    })

    it('lance une erreur si Supabase échoue', async () => {
      const chain = {
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
      }
      chain.in.mockReturnValue(chain)
      let eqCount = 0
      chain.eq.mockImplementation(() => {
        eqCount++
        if (eqCount >= 2) {
          return Promise.resolve({ error: { message: 'Update failed' } })
        }
        return chain
      })
      mockFrom.mockReturnValue(chain)

      await expect(votationSessionService.closeSession('PFP1A', '2026')).rejects.toEqual({ message: 'Update failed' })
    })
  })

  // ==================== isVotationOpen ====================
  describe('isVotationOpen', () => {
    it('retourne true si une session est ouverte', async () => {
      const session = { id: '1', pfp_type: 'PFP1A', year: '2026', status: 'open' }
      const chain = createChain({ data: [session], error: null })
      mockFrom.mockReturnValue(chain)

      const result = await votationSessionService.isVotationOpen('PFP1A', '2026')
      expect(result).toBe(true)
    })

    it('retourne false si aucune session ouverte', async () => {
      const chain = createChain({ data: [], error: null })
      mockFrom.mockReturnValue(chain)

      const result = await votationSessionService.isVotationOpen('PFP3', '2026')
      expect(result).toBe(false)
    })
  })

  // ==================== getOpenSessionForClass ====================
  describe('getOpenSessionForClass', () => {
    it('retourne les sessions ouvertes pour une classe', async () => {
      const sessions = [
        { id: '1', pfp_type: 'PFP1A', year: '2026', target_class: 'BA25', status: 'open' },
      ]
      const chain = createChain({ data: sessions, error: null })
      chain.order.mockResolvedValue({ data: sessions, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await votationSessionService.getOpenSessionForClass('BA25')
      expect(chain.eq).toHaveBeenCalledWith('target_class', 'BA25')
      expect(chain.eq).toHaveBeenCalledWith('status', 'open')
      expect(result).toEqual(sessions)
    })

    it('retourne un tableau vide si aucune session pour cette classe', async () => {
      const chain = createChain({ data: null, error: null })
      chain.order.mockResolvedValue({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await votationSessionService.getOpenSessionForClass('BA22')
      expect(result).toEqual([])
    })
  })
})
