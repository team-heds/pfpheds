import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock Supabase ────────────────────────────────────
const mockFrom = vi.fn()

vi.mock('@/supabase', () => ({
  supabase: {
    from: (...args) => mockFrom(...args),
  },
}))

import {
  getAllTickets,
  getTicketsByStatus,
  createTicket,
  updateTicket,
  changeTicketStatus,
  deleteTicket,
  publishToVimeo,
  getTicketStats,
  TICKET_STATUS,
  TICKET_TYPES,
  VIDEO_MODALITIES,
} from '@/service/ticketService'

// ── Helper: chainable Supabase mock ──────────────────
function createChain(terminalResult) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue(terminalResult),
    single: vi.fn().mockResolvedValue(terminalResult),
    maybeSingle: vi.fn().mockResolvedValue(terminalResult),
  }
  return chain
}

describe('ticketService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==================== CONSTANTS ====================
  describe('constants', () => {
    it('TICKET_STATUS contient les statuts attendus', () => {
      expect(TICKET_STATUS.BACKLOG).toBe('backlog')
      expect(TICKET_STATUS.TODO).toBe('todo')
      expect(TICKET_STATUS.IN_PROGRESS).toBe('in_progress')
      expect(TICKET_STATUS.VALIDATION).toBe('validation')
      expect(TICKET_STATUS.PROBLEMS).toBe('problems')
      expect(TICKET_STATUS.DONE).toBe('done')
    })

    it('TICKET_TYPES contient les types attendus', () => {
      expect(TICKET_TYPES.VIDEO).toBe('video')
      expect(TICKET_TYPES.DEVELOPMENT).toBe('development')
      expect(TICKET_TYPES.SIMULATION).toBe('simulation')
      expect(TICKET_TYPES.OTHER).toBe('other')
    })

    it('VIDEO_MODALITIES contient les modalités attendues', () => {
      expect(VIDEO_MODALITIES.POWERPOINT).toBe('powerpoint_sonorise')
      expect(VIDEO_MODALITIES.TABLE_RONDE).toBe('table_ronde')
      expect(VIDEO_MODALITIES.PODCAST).toBe('podcast')
    })
  })

  // ==================== getAllTickets ====================
  describe('getAllTickets', () => {
    it('récupère tous les tickets triés par date', async () => {
      const tickets = [
        { id: 't1', title: 'Ticket 1', status: 'backlog' },
        { id: 't2', title: 'Ticket 2', status: 'done' },
      ]
      const chain = createChain({ data: tickets, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await getAllTickets()

      expect(mockFrom).toHaveBeenCalledWith('academic_tickets')
      expect(chain.select).toHaveBeenCalledWith('*')
      expect(chain.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(tickets)
    })

    it('retourne un tableau vide si data est null', async () => {
      const chain = createChain({ data: null, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await getAllTickets()
      expect(result).toEqual([])
    })

    it('lance une erreur Supabase', async () => {
      const chain = createChain({ data: null, error: { message: 'DB error' } })
      mockFrom.mockReturnValue(chain)

      await expect(getAllTickets()).rejects.toEqual({ message: 'DB error' })
    })
  })

  // ==================== getTicketsByStatus ====================
  describe('getTicketsByStatus', () => {
    it('récupère les tickets filtrés par statut', async () => {
      const tickets = [{ id: 't1', status: 'todo' }]
      const chain = createChain({ data: tickets, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await getTicketsByStatus('todo')

      expect(chain.eq).toHaveBeenCalledWith('status', 'todo')
      expect(chain.order).toHaveBeenCalledWith('order_index', { ascending: true })
      expect(result).toEqual(tickets)
    })
  })

  // ==================== createTicket ====================
  describe('createTicket', () => {
    it('crée un ticket avec le statut par défaut backlog', async () => {
      const created = { id: 't3', title: 'New', status: 'backlog' }
      const chain = createChain({ data: created, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await createTicket({ title: 'New' })

      expect(chain.insert).toHaveBeenCalledWith([
        expect.objectContaining({ title: 'New', status: 'backlog' })
      ])
      expect(result).toEqual(created)
    })

    it('respecte le statut fourni', async () => {
      const chain = createChain({ data: { id: 't4', status: 'todo' }, error: null })
      mockFrom.mockReturnValue(chain)

      await createTicket({ title: 'Test', status: 'todo' })

      expect(chain.insert).toHaveBeenCalledWith([
        expect.objectContaining({ status: 'todo' })
      ])
    })

    it('nettoie module_id invalide (non UUID)', async () => {
      const chain = createChain({ data: { id: 't5' }, error: null })
      mockFrom.mockReturnValue(chain)

      await createTicket({ title: 'Test', module_id: 'not-a-uuid' })

      expect(chain.insert).toHaveBeenCalledWith([
        expect.objectContaining({ module_id: null })
      ])
    })

    it('conserve module_id valide (UUID)', async () => {
      const validUUID = '12345678-1234-1234-1234-123456789abc'
      const chain = createChain({ data: { id: 't6' }, error: null })
      mockFrom.mockReturnValue(chain)

      await createTicket({ title: 'Test', module_id: validUUID })

      expect(chain.insert).toHaveBeenCalledWith([
        expect.objectContaining({ module_id: validUUID })
      ])
    })

    it('lance une erreur Supabase', async () => {
      const chain = createChain({ data: null, error: { message: 'Insert failed' } })
      mockFrom.mockReturnValue(chain)

      await expect(createTicket({ title: 'Test' })).rejects.toEqual({ message: 'Insert failed' })
    })
  })

  // ==================== changeTicketStatus ====================
  describe('changeTicketStatus', () => {
    it('change le statut d\'un ticket', async () => {
      const updated = { id: 't1', status: 'in_progress' }
      const chain = createChain({ data: updated, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await changeTicketStatus('t1', 'in_progress')

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'in_progress' })
      )
      expect(chain.eq).toHaveBeenCalledWith('id', 't1')
      expect(result).toEqual(updated)
    })

    it('inclut order_index si fourni', async () => {
      const chain = createChain({ data: { id: 't1' }, error: null })
      mockFrom.mockReturnValue(chain)

      await changeTicketStatus('t1', 'todo', 3)

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'todo', order_index: 3 })
      )
    })
  })

  // ==================== deleteTicket ====================
  describe('deleteTicket', () => {
    it('supprime un ticket par id', async () => {
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: null }),
      }
      mockFrom.mockReturnValue(chain)

      await deleteTicket('t1')

      expect(mockFrom).toHaveBeenCalledWith('academic_tickets')
      expect(chain.delete).toHaveBeenCalled()
      expect(chain.eq).toHaveBeenCalledWith('id', 't1')
    })

    it('lance une erreur si suppression échoue', async () => {
      const chain = {
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
      }
      mockFrom.mockReturnValue(chain)

      await expect(deleteTicket('t1')).rejects.toEqual({ message: 'Delete failed' })
    })
  })

  // ==================== publishToVimeo ====================
  describe('publishToVimeo', () => {
    it('publie une vidéo et passe le ticket en done', async () => {
      const published = { id: 't1', vimeo_id: 'v123', status: 'done' }
      const chain = createChain({ data: published, error: null })
      mockFrom.mockReturnValue(chain)

      const result = await publishToVimeo('t1', 'v123', 'https://vimeo.com/123')

      expect(chain.update).toHaveBeenCalledWith(
        expect.objectContaining({
          vimeo_id: 'v123',
          vimeo_url: 'https://vimeo.com/123',
          status: 'done',
        })
      )
      expect(result).toEqual(published)
    })
  })

  // ==================== getTicketStats ====================
  describe('getTicketStats', () => {
    it('calcule les statistiques par statut et par type', async () => {
      const tickets = [
        { status: 'backlog', type: 'video' },
        { status: 'backlog', type: 'video' },
        { status: 'todo', type: 'development' },
        { status: 'done', type: 'simulation' },
      ]
      const chain = {
        select: vi.fn().mockResolvedValue({ data: tickets, error: null }),
      }
      mockFrom.mockReturnValue(chain)

      const stats = await getTicketStats()

      expect(stats.total).toBe(4)
      expect(stats.by_status.backlog).toBe(2)
      expect(stats.by_status.todo).toBe(1)
      expect(stats.by_status.done).toBe(1)
      expect(stats.by_status.in_progress).toBe(0)
      expect(stats.by_type.video).toBe(2)
      expect(stats.by_type.development).toBe(1)
      expect(stats.by_type.simulation).toBe(1)
      expect(stats.by_type.other).toBe(0)
    })

    it('lance une erreur si Supabase échoue', async () => {
      const chain = {
        select: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      }
      mockFrom.mockReturnValue(chain)

      await expect(getTicketStats()).rejects.toEqual({ message: 'DB error' })
    })
  })
})
