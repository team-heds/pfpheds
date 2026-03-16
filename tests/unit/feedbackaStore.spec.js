import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// ── Mock axios ───────────────────────────────────────
const mockGet = vi.fn()
const mockPost = vi.fn()
const mockPut = vi.fn()

vi.mock('axios', () => ({
  default: {
    get: (...args) => mockGet(...args),
    post: (...args) => mockPost(...args),
    put: (...args) => mockPut(...args),
  },
}))

import { useFeedbackaStore } from '@/stores/feedbackaStore'

describe('feedbackaStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useFeedbackaStore()
    vi.clearAllMocks()
  })

  // ==================== INITIAL STATE ====================
  describe('initial state', () => {
    it('has empty feedbackas', () => {
      expect(store.feedbackas).toEqual([])
    })

    it('has null current', () => {
      expect(store.current).toBeNull()
    })

    it('has empty submissions', () => {
      expect(store.submissions).toEqual([])
    })

    it('is not loading', () => {
      expect(store.loading).toBe(false)
    })

    it('has no error', () => {
      expect(store.error).toBeNull()
    })
  })

  // ==================== fetchFeedbackas ====================
  describe('fetchFeedbackas', () => {
    it('récupère la liste des feedbackas', async () => {
      const items = [{ id: '1', title: 'FB1' }, { id: '2', title: 'FB2' }]
      mockGet.mockResolvedValue({ data: items })

      const result = await store.fetchFeedbackas()

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/feedbacka'), { params: {} })
      expect(store.feedbackas).toEqual(items)
      expect(result).toEqual(items)
      expect(store.loading).toBe(false)
    })

    it('passe les params de filtrage', async () => {
      mockGet.mockResolvedValue({ data: [] })

      await store.fetchFeedbackas({ module_id: 'm1' })

      expect(mockGet).toHaveBeenCalledWith(expect.any(String), { params: { module_id: 'm1' } })
    })

    it('gère les erreurs gracieusement', async () => {
      mockGet.mockRejectedValue(new Error('Network error'))

      const result = await store.fetchFeedbackas()

      expect(store.error).toBe('Failed to fetch feedbackas.')
      expect(result).toEqual([])
      expect(store.loading).toBe(false)
    })

    it('retourne un tableau vide si data est null', async () => {
      mockGet.mockResolvedValue({ data: null })

      const result = await store.fetchFeedbackas()
      expect(store.feedbackas).toEqual([])
      expect(result).toEqual([])
    })
  })

  // ==================== fetchFeedbacka ====================
  describe('fetchFeedbacka', () => {
    it('récupère un feedbacka par id', async () => {
      const item = { id: '1', title: 'FB1', questions: [] }
      mockGet.mockResolvedValue({ data: item })

      const result = await store.fetchFeedbacka('1')

      expect(mockGet).toHaveBeenCalledWith(expect.stringContaining('/feedbacka/1'), { params: {} })
      expect(store.current).toEqual(item)
      expect(result).toEqual(item)
    })

    it('gère les erreurs gracieusement', async () => {
      mockGet.mockRejectedValue(new Error('Not found'))

      const result = await store.fetchFeedbacka('unknown')

      expect(store.error).toBe('Failed to fetch feedbacka.')
      expect(result).toBeNull()
    })
  })

  // ==================== createFeedbacka ====================
  describe('createFeedbacka', () => {
    it('crée un nouveau feedbacka', async () => {
      const created = { id: '3', title: 'New FB' }
      mockPost.mockResolvedValue({ data: created })

      const result = await store.createFeedbacka({ title: 'New FB' })

      expect(mockPost).toHaveBeenCalledWith(expect.stringContaining('/feedbacka'), { title: 'New FB' })
      expect(store.current).toEqual(created)
      expect(result).toEqual(created)
    })

    it('gère les erreurs gracieusement', async () => {
      mockPost.mockRejectedValue(new Error('Server error'))

      const result = await store.createFeedbacka({ title: 'test' })

      expect(store.error).toBe('Failed to create feedbacka.')
      expect(result).toBeNull()
    })
  })

  // ==================== updateFeedbacka ====================
  describe('updateFeedbacka', () => {
    it('met à jour un feedbacka existant', async () => {
      const updated = { id: '1', title: 'Updated FB' }
      mockPut.mockResolvedValue({ data: updated })

      const result = await store.updateFeedbacka('1', { title: 'Updated FB' })

      expect(mockPut).toHaveBeenCalledWith(expect.stringContaining('/feedbacka/1'), { title: 'Updated FB' })
      expect(store.current).toEqual(updated)
      expect(result).toEqual(updated)
    })

    it('gère les erreurs gracieusement', async () => {
      mockPut.mockRejectedValue(new Error('Update failed'))

      const result = await store.updateFeedbacka('1', { title: 'test' })

      expect(store.error).toBe('Failed to update feedbacka.')
      expect(result).toBeNull()
    })
  })

  // ==================== testFeedbacka ====================
  describe('testFeedbacka', () => {
    it('envoie une réponse test', async () => {
      const feedback = { score: 8, feedback: 'Bien' }
      mockPost.mockResolvedValue({ data: feedback })

      const result = await store.testFeedbacka('1', 'Ma réponse test')

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/feedbacka/1/test'),
        { answer_text: 'Ma réponse test' },
        { params: {} }
      )
      expect(result).toEqual(feedback)
    })

    it('gère les erreurs gracieusement', async () => {
      mockPost.mockRejectedValue(new Error('AI error'))

      const result = await store.testFeedbacka('1', 'test')

      expect(store.error).toBe('Failed to test evaluation.')
      expect(result).toBeNull()
    })
  })

  // ==================== submitAnswer ====================
  describe('submitAnswer', () => {
    it('soumet une réponse étudiant', async () => {
      const submission = { id: 's1', score: 7 }
      mockPost.mockResolvedValue({ data: submission })

      const result = await store.submitAnswer('1', { answer_text: 'Réponse', student_id: 'u1' })

      expect(mockPost).toHaveBeenCalledWith(
        expect.stringContaining('/feedbacka/1/submit'),
        { answer_text: 'Réponse', student_id: 'u1' }
      )
      expect(result).toEqual(submission)
    })

    it('gère les erreurs gracieusement', async () => {
      mockPost.mockRejectedValue(new Error('Submit failed'))

      const result = await store.submitAnswer('1', {})

      expect(store.error).toBe('Failed to submit answer.')
      expect(result).toBeNull()
    })
  })

  // ==================== fetchSubmissions ====================
  describe('fetchSubmissions', () => {
    it('récupère les soumissions d\'un feedbacka', async () => {
      const subs = [{ id: 's1', score: 8 }, { id: 's2', score: 6 }]
      mockGet.mockResolvedValue({ data: subs })

      store.current = { author_id: 'admin-1' }
      const result = await store.fetchSubmissions('1')

      expect(mockGet).toHaveBeenCalledWith(
        expect.stringContaining('/feedbacka/1/submissions'),
        { params: { author_id: 'admin-1' } }
      )
      expect(store.submissions).toEqual(subs)
      expect(result).toEqual(subs)
    })

    it('gère les erreurs gracieusement', async () => {
      mockGet.mockRejectedValue(new Error('Fetch failed'))

      const result = await store.fetchSubmissions('1')

      expect(store.error).toBe('Failed to fetch submissions.')
      expect(result).toEqual([])
    })
  })
})
