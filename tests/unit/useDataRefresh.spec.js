import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useDataRefresh } from '@/composables/useDataRefresh'

describe('useDataRefresh', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ─── emitAndWait ───
  describe('emitAndWait', () => {
    it('appelle emit avec le nom d\'événement', async () => {
      const { emitAndWait } = useDataRefresh()
      const emit = vi.fn()

      const promise = emitAndWait(emit, 'data-updated')
      await vi.runAllTimersAsync()
      await promise

      expect(emit).toHaveBeenCalledWith('data-updated')
    })

    it('appelle emit avec payload si fourni', async () => {
      const { emitAndWait } = useDataRefresh()
      const emit = vi.fn()

      const promise = emitAndWait(emit, 'data-updated', { id: 42 })
      await vi.runAllTimersAsync()
      await promise

      expect(emit).toHaveBeenCalledWith('data-updated', { id: 42 })
    })

    it('n\'envoie pas de payload si undefined', async () => {
      const { emitAndWait } = useDataRefresh()
      const emit = vi.fn()

      const promise = emitAndWait(emit, 'refresh')
      await vi.runAllTimersAsync()
      await promise

      expect(emit).toHaveBeenCalledWith('refresh')
      expect(emit).toHaveBeenCalledTimes(1)
    })
  })

  // ─── handleCrudOperation ───
  describe('handleCrudOperation', () => {
    it('exécute saveOperation, émet, toast succès, ferme le dialog', async () => {
      const { handleCrudOperation } = useDataRefresh()
      const emit = vi.fn()
      const saveOperation = vi.fn().mockResolvedValue()
      const toast = { add: vi.fn() }
      const closeDialog = vi.fn()

      const promise = handleCrudOperation({
        emit,
        eventName: 'saved',
        saveOperation,
        toast,
        closeDialog,
        messages: { successSummary: 'OK', successDetail: 'Sauvegardé' }
      })
      await vi.runAllTimersAsync()
      const result = await promise

      expect(result).toBe(true)
      expect(saveOperation).toHaveBeenCalled()
      expect(emit).toHaveBeenCalledWith('saved')
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'success',
        summary: 'OK',
        detail: 'Sauvegardé'
      }))
      expect(closeDialog).toHaveBeenCalled()
    })

    it('retourne false et toast erreur si saveOperation échoue', async () => {
      const { handleCrudOperation } = useDataRefresh()
      const emit = vi.fn()
      const saveOperation = vi.fn().mockRejectedValue(new Error('Save failed'))
      const toast = { add: vi.fn() }
      const closeDialog = vi.fn()

      const result = await handleCrudOperation({
        emit,
        eventName: 'saved',
        saveOperation,
        toast,
        closeDialog
      })

      expect(result).toBe(false)
      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
        severity: 'error'
      }))
      expect(closeDialog).not.toHaveBeenCalled()
    })

    it('utilise les messages par défaut si non fournis', async () => {
      const { handleCrudOperation } = useDataRefresh()
      const toast = { add: vi.fn() }

      const promise = handleCrudOperation({
        emit: vi.fn(),
        eventName: 'saved',
        saveOperation: vi.fn().mockResolvedValue(),
        toast,
        closeDialog: vi.fn()
      })
      await vi.runAllTimersAsync()
      await promise

      expect(toast.add).toHaveBeenCalledWith(expect.objectContaining({
        summary: 'Succès',
        detail: 'Opération réussie'
      }))
    })
  })
})
