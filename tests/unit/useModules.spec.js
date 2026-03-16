import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useModules } from '@/composables/useModules'

// Mock modulesService
vi.mock('@/service/modulesService', () => ({
  default: {
    getAllModules: vi.fn(),
    getModulesByYear: vi.fn(),
    getModulesBySemester: vi.fn(),
    createModule: vi.fn(),
    updateModule: vi.fn(),
    deleteModule: vi.fn(),
    getModuleByNumber: vi.fn(),
  }
}))

import modulesService from '@/service/modulesService'

describe('useModules', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── État initial ───
  describe('état initial', () => {
    it('retourne les refs avec valeurs par défaut', () => {
      const { modules, loading, error } = useModules()
      expect(modules.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })
  })

  // ─── loadModules ───
  describe('loadModules', () => {
    it('charge tous les modules', async () => {
      const mockModules = [
        { id: 1, number: 'M1', title: 'Anatomie', year: 1 },
        { id: 2, number: 'M2', title: 'Physiologie', year: 1 }
      ]
      modulesService.getAllModules.mockResolvedValue(mockModules)

      const { modules, loading, error, loadModules } = useModules()
      await loadModules()

      expect(modules.value).toEqual(mockModules)
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('gère les erreurs', async () => {
      modulesService.getAllModules.mockRejectedValue(new Error('DB error'))

      const { modules, loading, error, loadModules } = useModules()
      await loadModules()

      expect(modules.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(error.value).toBe('DB error')
    })

    it('met loading à true pendant le chargement', async () => {
      let resolvePromise
      modulesService.getAllModules.mockReturnValue(new Promise(r => { resolvePromise = r }))

      const { loading, loadModules } = useModules()
      const promise = loadModules()
      expect(loading.value).toBe(true)

      resolvePromise([])
      await promise
      expect(loading.value).toBe(false)
    })
  })

  // ─── loadModulesByYear ───
  describe('loadModulesByYear', () => {
    it('charge les modules par année', async () => {
      const mockModules = [{ id: 1, number: 'M1', title: 'Anatomie', year: 2 }]
      modulesService.getModulesByYear.mockResolvedValue(mockModules)

      const { modules, loadModulesByYear } = useModules()
      await loadModulesByYear(2)

      expect(modulesService.getModulesByYear).toHaveBeenCalledWith(2)
      expect(modules.value).toEqual(mockModules)
    })

    it('gère les erreurs', async () => {
      modulesService.getModulesByYear.mockRejectedValue(new Error('Year error'))

      const { error, loadModulesByYear } = useModules()
      await loadModulesByYear(2)

      expect(error.value).toBe('Year error')
    })
  })

  // ─── loadModulesBySemester ───
  describe('loadModulesBySemester', () => {
    it('charge les modules par semestre', async () => {
      const mockModules = [{ id: 1, number: 'M1', title: 'Anatomie' }]
      modulesService.getModulesBySemester.mockResolvedValue(mockModules)

      const { modules, loadModulesBySemester } = useModules()
      await loadModulesBySemester(1, 'automne')

      expect(modulesService.getModulesBySemester).toHaveBeenCalledWith(1, 'automne')
      expect(modules.value).toEqual(mockModules)
    })
  })

  // ─── createModule ───
  describe('createModule', () => {
    it('crée un module et l\'ajoute à la liste', async () => {
      const newModule = { id: 3, number: 'M3', title: 'Pharmacologie', year: 1 }
      modulesService.createModule.mockResolvedValue(newModule)

      const { modules, createModule } = useModules()
      modules.value = [{ id: 1, number: 'M1', title: 'Anatomie', year: 1 }]

      const result = await createModule({ number: 'M3', title: 'Pharmacologie', year: 1 })

      expect(result).toEqual(newModule)
      expect(modules.value).toHaveLength(2)
      expect(modules.value[1]).toEqual(newModule)
    })

    it('throw en cas d\'erreur', async () => {
      modulesService.createModule.mockRejectedValue(new Error('Create failed'))

      const { error, createModule } = useModules()

      await expect(createModule({})).rejects.toThrow('Create failed')
      expect(error.value).toBe('Create failed')
    })
  })

  // ─── updateModule ───
  describe('updateModule', () => {
    it('met à jour un module existant dans la liste', async () => {
      const updated = { id: 1, number: 'M1', title: 'Anatomie Avancée', year: 1 }
      modulesService.updateModule.mockResolvedValue(updated)

      const { modules, updateModule } = useModules()
      modules.value = [
        { id: 1, number: 'M1', title: 'Anatomie', year: 1 },
        { id: 2, number: 'M2', title: 'Physiologie', year: 1 }
      ]

      const result = await updateModule(1, { title: 'Anatomie Avancée' })

      expect(result).toEqual(updated)
      expect(modules.value[0].title).toBe('Anatomie Avancée')
      expect(modules.value).toHaveLength(2)
    })

    it('ne plante pas si le module n\'est pas dans la liste', async () => {
      const updated = { id: 99, number: 'M99', title: 'Inconnu', year: 1 }
      modulesService.updateModule.mockResolvedValue(updated)

      const { modules, updateModule } = useModules()
      modules.value = [{ id: 1, number: 'M1', title: 'Anatomie', year: 1 }]

      const result = await updateModule(99, { title: 'Inconnu' })
      expect(result).toEqual(updated)
      expect(modules.value).toHaveLength(1) // pas modifié
    })
  })

  // ─── deleteModule ───
  describe('deleteModule', () => {
    it('supprime un module de la liste', async () => {
      modulesService.deleteModule.mockResolvedValue()

      const { modules, deleteModule } = useModules()
      modules.value = [
        { id: 1, number: 'M1', title: 'Anatomie', year: 1 },
        { id: 2, number: 'M2', title: 'Physiologie', year: 1 }
      ]

      await deleteModule(1)

      expect(modules.value).toHaveLength(1)
      expect(modules.value[0].id).toBe(2)
    })

    it('throw en cas d\'erreur', async () => {
      modulesService.deleteModule.mockRejectedValue(new Error('Delete failed'))

      const { error, deleteModule } = useModules()

      await expect(deleteModule(1)).rejects.toThrow('Delete failed')
      expect(error.value).toBe('Delete failed')
    })
  })

  // ─── getModuleByNumber ───
  describe('getModuleByNumber', () => {
    it('retourne un module par numéro', async () => {
      const mockModule = { id: 1, number: 'M1', title: 'Anatomie' }
      modulesService.getModuleByNumber.mockResolvedValue(mockModule)

      const { getModuleByNumber } = useModules()
      const result = await getModuleByNumber('M1')

      expect(result).toEqual(mockModule)
      expect(modulesService.getModuleByNumber).toHaveBeenCalledWith('M1')
    })

    it('retourne null en cas d\'erreur', async () => {
      modulesService.getModuleByNumber.mockRejectedValue(new Error('Not found'))

      const { getModuleByNumber } = useModules()
      const result = await getModuleByNumber('M999')

      expect(result).toBeNull()
    })
  })
})
