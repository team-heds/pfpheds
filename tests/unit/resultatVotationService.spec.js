import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ────────────────────────────────────────────
const mockGetSession = vi.fn()
const mockGetUser = vi.fn()
const mockSupabaseFrom = vi.fn()

vi.mock('@/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      getUser: () => mockGetUser(),
    },
    from: (...args) => mockSupabaseFrom(...args),
    rpc: vi.fn(),
  },
}))

const mockAxiosGet = vi.fn()
const mockAxiosPost = vi.fn()
const mockAxiosPut = vi.fn()
const mockAxiosDelete = vi.fn()

vi.mock('axios', () => ({
  default: {
    get: (...args) => mockAxiosGet(...args),
    post: (...args) => mockAxiosPost(...args),
    put: (...args) => mockAxiosPut(...args),
    delete: (...args) => mockAxiosDelete(...args),
  },
}))

import { resultatVotationService } from '@/stores/resultatVotationService'

// ── Helpers ──────────────────────────────────────────
const fakeSession = { access_token: 'tok-123' }

function mockAuth() {
  mockGetSession.mockResolvedValue({ data: { session: fakeSession } })
}

function mockAuthFail() {
  mockGetSession.mockResolvedValue({ data: { session: null } })
}

// ── Tests ────────────────────────────────────────────
describe('resultatVotationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAuth()
  })

  // ==================== runAlgorithm ====================
  describe('runAlgorithm', () => {
    it('envoie les données au backend et retourne le résultat', async () => {
      const response = { data: { ok: true, results: [{ id: 'r1' }] } }
      mockAxiosPost.mockResolvedValue(response)

      const result = await resultatVotationService.runAlgorithm('PFP2', '2026', [{ id: 's1' }], [{ id: 'p1' }])

      expect(mockAxiosPost).toHaveBeenCalledWith(
        expect.stringContaining('/api/resultat-votation/run-algorithm'),
        { pfpType: 'PFP2', year: '2026', students: [{ id: 's1' }], places: [{ id: 'p1' }] },
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer tok-123' })
        })
      )
      expect(result).toEqual(response.data)
    })

    it('lance une erreur si le backend retourne ok=false', async () => {
      mockAxiosPost.mockResolvedValue({ data: { ok: false, error: 'Algo failed' } })

      await expect(resultatVotationService.runAlgorithm('PFP2', '2026', [], [])).rejects.toThrow('Algo failed')
    })

    it('lance une erreur si non authentifié', async () => {
      mockAuthFail()

      await expect(resultatVotationService.runAlgorithm('PFP2', '2026', [], [])).rejects.toThrow('Authentication required')
    })
  })

  // ==================== getResults ====================
  describe('getResults', () => {
    it('récupère les résultats pour un PFP/année', async () => {
      const results = [{ id: 'r1', assigned_place_id: 'p1' }]
      mockAxiosGet.mockResolvedValue({ data: { ok: true, results } })

      const result = await resultatVotationService.getResults('PFP3', '2026')

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('/api/resultat-votation/results/PFP3/2026'),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer tok-123' })
        })
      )
      expect(result).toEqual(results)
    })

    it('ajoute algorithmRunId en query param si fourni', async () => {
      mockAxiosGet.mockResolvedValue({ data: { ok: true, results: [] } })

      await resultatVotationService.getResults('PFP3', '2026', 'run-abc')

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('algorithmRunId=run-abc'),
        expect.any(Object)
      )
    })

    it('retourne un tableau vide si results est null', async () => {
      mockAxiosGet.mockResolvedValue({ data: { ok: true, results: null } })

      const result = await resultatVotationService.getResults('PFP3', '2026')
      expect(result).toEqual([])
    })

    it('lance une erreur si ok=false', async () => {
      mockAxiosGet.mockResolvedValue({ data: { ok: false, error: 'Not found' } })

      await expect(resultatVotationService.getResults('PFP3', '2026')).rejects.toThrow('Not found')
    })
  })

  // ==================== getStudentResult ====================
  describe('getStudentResult', () => {
    it('récupère le résultat d\'un étudiant spécifique', async () => {
      const studentResult = { assigned_place_id: 'p1', assigned_rank: 1 }
      mockAxiosGet.mockResolvedValue({ data: { ok: true, result: studentResult } })

      const result = await resultatVotationService.getStudentResult('user-1', 'PFP4', '2026')

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('/api/resultat-votation/student/user-1/PFP4/2026'),
        expect.any(Object)
      )
      expect(result).toEqual(studentResult)
    })
  })

  // ==================== getMyResult ====================
  describe('getMyResult', () => {
    it('appelle supabase.rpc avec les bons paramètres', async () => {
      const { supabase } = await import('@/supabase')
      mockGetUser.mockResolvedValue({ data: { user: { id: 'my-id' } } })
      supabase.rpc.mockResolvedValue({ data: { assigned_place_id: 'p1' }, error: null })

      const result = await resultatVotationService.getMyResult('PFP2', '2026')

      expect(supabase.rpc).toHaveBeenCalledWith('get_student_result', {
        p_user_id: 'my-id',
        p_pfp_type: 'PFP2',
        p_year: '2026'
      })
      expect(result).toEqual({ assigned_place_id: 'p1' })
    })

    it('lance une erreur si non authentifié', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null } })

      await expect(resultatVotationService.getMyResult('PFP2', '2026')).rejects.toThrow('Authentication required')
    })
  })

  // ==================== getStatistics ====================
  describe('getStatistics', () => {
    it('récupère les statistiques', async () => {
      const stats = [{ rank: 1, count: 5 }]
      mockAxiosGet.mockResolvedValue({ data: { ok: true, statistics: stats } })

      const result = await resultatVotationService.getStatistics('PFP2', '2026')

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('/api/resultat-votation/statistics/PFP2/2026'),
        expect.any(Object)
      )
      expect(result).toEqual(stats)
    })

    it('retourne un tableau vide si statistics est null', async () => {
      mockAxiosGet.mockResolvedValue({ data: { ok: true, statistics: null } })

      const result = await resultatVotationService.getStatistics('PFP2', '2026')
      expect(result).toEqual([])
    })
  })

  // ==================== updateStatus ====================
  describe('updateStatus', () => {
    it('met à jour le statut d\'un résultat', async () => {
      const updated = { id: 'r1', status: 'confirmed' }
      mockAxiosPut.mockResolvedValue({ data: { ok: true, result: updated } })

      const result = await resultatVotationService.updateStatus('r1', 'confirmed', 'OK')

      expect(mockAxiosPut).toHaveBeenCalledWith(
        expect.stringContaining('/api/resultat-votation/status/r1'),
        { status: 'confirmed', notes: 'OK' },
        expect.any(Object)
      )
      expect(result).toEqual(updated)
    })
  })

  // ==================== deleteResult ====================
  describe('deleteResult', () => {
    it('supprime un résultat et retourne true', async () => {
      mockAxiosDelete.mockResolvedValue({ data: { ok: true } })

      const result = await resultatVotationService.deleteResult('r1')

      expect(mockAxiosDelete).toHaveBeenCalledWith(
        expect.stringContaining('/api/resultat-votation/r1'),
        expect.any(Object)
      )
      expect(result).toBe(true)
    })

    it('lance une erreur si ok=false', async () => {
      mockAxiosDelete.mockResolvedValue({ data: { ok: false, error: 'Not found' } })

      await expect(resultatVotationService.deleteResult('r1')).rejects.toThrow('Not found')
    })
  })

  // ==================== deleteAlgorithmRun ====================
  describe('deleteAlgorithmRun', () => {
    it('supprime tous les résultats d\'un run', async () => {
      mockAxiosDelete.mockResolvedValue({ data: { ok: true, deletedCount: 12 } })

      const count = await resultatVotationService.deleteAlgorithmRun('run-abc')

      expect(mockAxiosDelete).toHaveBeenCalledWith(
        expect.stringContaining('/api/resultat-votation/algorithm-run/run-abc'),
        expect.any(Object)
      )
      expect(count).toBe(12)
    })

    it('retourne 0 si deletedCount absent', async () => {
      mockAxiosDelete.mockResolvedValue({ data: { ok: true } })

      const count = await resultatVotationService.deleteAlgorithmRun('run-abc')
      expect(count).toBe(0)
    })
  })

  // ==================== generatePfp4Proposals ====================
  describe('generatePfp4Proposals', () => {
    it('génère les propositions PFP4', async () => {
      const response = { ok: true, proposals: { 'u1': ['p1', 'p2'] }, stats: {} }
      mockAxiosPost.mockResolvedValue({ data: response })

      const result = await resultatVotationService.generatePfp4Proposals('2026', 'BA23')

      expect(mockAxiosPost).toHaveBeenCalledWith(
        expect.stringContaining('/api/resultat-votation/generate-pfp4-proposals'),
        { year: '2026', targetClass: 'BA23' },
        expect.any(Object)
      )
      expect(result).toEqual(response)
    })
  })

  // ==================== savePfp4Proposals ====================
  describe('savePfp4Proposals', () => {
    it('sauvegarde les propositions PFP4', async () => {
      mockAxiosPost.mockResolvedValue({ data: { ok: true } })

      const proposals = { 'u1': ['p1', 'p2'] }
      const counts = { 'p1': 1 }
      const result = await resultatVotationService.savePfp4Proposals('2026', 'BA23', proposals, counts)

      expect(mockAxiosPost).toHaveBeenCalledWith(
        expect.stringContaining('/api/resultat-votation/save-pfp4-proposals'),
        { year: '2026', targetClass: 'BA23', proposals, assignCounts: counts },
        expect.any(Object)
      )
      expect(result).toEqual({ ok: true })
    })
  })

  // ==================== getPfp4Proposals ====================
  describe('getPfp4Proposals', () => {
    it('récupère les propositions PFP4 pour l\'étudiant connecté', async () => {
      mockAxiosGet.mockResolvedValue({
        data: {
          ok: true,
          proposedPlaceIds: ['p1', 'p2'],
          missingCriteria: ['DE'],
          appliedRule: 'de_missing',
          assignCounts: { 'p1': 2 }
        }
      })

      const result = await resultatVotationService.getPfp4Proposals('2026')

      expect(mockAxiosGet).toHaveBeenCalledWith(
        expect.stringContaining('/api/resultat-votation/pfp4-proposals/2026'),
        expect.any(Object)
      )
      expect(result).toEqual({
        proposedPlaceIds: ['p1', 'p2'],
        missingCriteria: ['DE'],
        appliedRule: 'de_missing',
        assignCounts: { 'p1': 2 }
      })
    })
  })

  // ==================== getResultsDirect ====================
  describe('getResultsDirect', () => {
    it('récupère les résultats directement via Supabase', async () => {
      const results = [{ id: 'r1', pfp_type: 'PFP2', year: '2026' }]
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: results, error: null }),
      }
      mockSupabaseFrom.mockReturnValue(chain)

      const result = await resultatVotationService.getResultsDirect('PFP2', '2026')

      expect(mockSupabaseFrom).toHaveBeenCalledWith('student_result_vote')
      expect(chain.eq).toHaveBeenCalledWith('pfp_type', 'PFP2')
      expect(chain.eq).toHaveBeenCalledWith('year', '2026')
      expect(result).toEqual(results)
    })

    it('retourne un tableau vide si data est null', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: null }),
      }
      mockSupabaseFrom.mockReturnValue(chain)

      const result = await resultatVotationService.getResultsDirect('PFP2', '2026')
      expect(result).toEqual([])
    })

    it('lance une erreur Supabase', async () => {
      const chain = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
      }
      mockSupabaseFrom.mockReturnValue(chain)

      await expect(resultatVotationService.getResultsDirect('PFP2', '2026')).rejects.toEqual({ message: 'DB error' })
    })
  })
})
