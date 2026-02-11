import { describe, it, expect, vi, beforeEach } from 'vitest'
import { useAcademicYear } from '@/composables/useAcademicYear'

// Mock academicYearService
vi.mock('@/service/academicYearService', () => ({
  default: {
    getAllAcademicYears: vi.fn(),
    getActiveAcademicYear: vi.fn(),
    getAllClasses: vi.fn(),
    getClassesByAcademicYear: vi.fn(),
    setActiveAcademicYear: vi.fn(),
    createAcademicYear: vi.fn(),
    generateClassesForYear: vi.fn(),
    getClassYearLevelMapping: vi.fn(),
  }
}))

import academicYearService from '@/service/academicYearService'

describe('useAcademicYear', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ─── État initial ───
  describe('état initial', () => {
    it('retourne les refs avec valeurs par défaut', () => {
      const { academicYears, classes, activeAcademicYear, loading, error } = useAcademicYear()
      expect(academicYears.value).toEqual([])
      expect(classes.value).toEqual([])
      expect(activeAcademicYear.value).toBeNull()
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })
  })

  // ─── Computed ───
  describe('computed', () => {
    it('activeYearName retourne le nom de l\'année active', () => {
      const { activeAcademicYear, activeYearName } = useAcademicYear()
      activeAcademicYear.value = { name: '2024-2025' }
      expect(activeYearName.value).toBe('2024-2025')
    })

    it('activeYearName retourne fallback si pas d\'année active', () => {
      const { activeYearName } = useAcademicYear()
      expect(activeYearName.value).toBe('Aucune année active')
    })

    it('sortedClasses trie par year_level', () => {
      const { classes, sortedClasses } = useAcademicYear()
      classes.value = [
        { code: 'BA25', year_level: 3 },
        { code: 'BA27', year_level: 1 },
        { code: 'BA26', year_level: 2 },
      ]
      expect(sortedClasses.value.map(c => c.code)).toEqual(['BA27', 'BA26', 'BA25'])
    })

    it('sortedClasses retourne un tableau vide si pas de classes', () => {
      const { sortedClasses } = useAcademicYear()
      expect(sortedClasses.value).toEqual([])
    })
  })

  // ─── loadAcademicYears ───
  describe('loadAcademicYears', () => {
    it('charge les années académiques', async () => {
      const mockYears = [{ id: 1, name: '2024-2025' }, { id: 2, name: '2023-2024' }]
      academicYearService.getAllAcademicYears.mockResolvedValue(mockYears)

      const { academicYears, loading, error, loadAcademicYears } = useAcademicYear()
      await loadAcademicYears()

      expect(academicYears.value).toEqual(mockYears)
      expect(loading.value).toBe(false)
      expect(error.value).toBeNull()
    })

    it('gère les erreurs', async () => {
      academicYearService.getAllAcademicYears.mockRejectedValue(new Error('Network error'))

      const { academicYears, loading, error, loadAcademicYears } = useAcademicYear()
      await loadAcademicYears()

      expect(academicYears.value).toEqual([])
      expect(loading.value).toBe(false)
      expect(error.value).toBe('Network error')
    })
  })

  // ─── loadActiveAcademicYear ───
  describe('loadActiveAcademicYear', () => {
    it('charge l\'année active', async () => {
      const mockYear = { id: 1, name: '2024-2025', is_active: true }
      academicYearService.getActiveAcademicYear.mockResolvedValue(mockYear)

      const { activeAcademicYear, loadActiveAcademicYear } = useAcademicYear()
      await loadActiveAcademicYear()

      expect(activeAcademicYear.value).toEqual(mockYear)
    })

    it('gère les erreurs', async () => {
      academicYearService.getActiveAcademicYear.mockRejectedValue(new Error('Not found'))

      const { activeAcademicYear, error, loadActiveAcademicYear } = useAcademicYear()
      await loadActiveAcademicYear()

      expect(activeAcademicYear.value).toBeNull()
      expect(error.value).toBe('Not found')
    })
  })

  // ─── loadClasses ───
  describe('loadClasses', () => {
    it('charge toutes les classes', async () => {
      const mockClasses = [{ code: 'BA25', year_level: 1 }]
      academicYearService.getAllClasses.mockResolvedValue(mockClasses)

      const { classes, loadClasses } = useAcademicYear()
      await loadClasses()

      expect(classes.value).toEqual(mockClasses)
    })

    it('gère les erreurs', async () => {
      academicYearService.getAllClasses.mockRejectedValue(new Error('DB error'))

      const { classes, error, loadClasses } = useAcademicYear()
      await loadClasses()

      expect(classes.value).toEqual([])
      expect(error.value).toBe('DB error')
    })
  })

  // ─── loadClassesByYear ───
  describe('loadClassesByYear', () => {
    it('charge les classes pour une année spécifique', async () => {
      const mockClasses = [{ code: 'BA25', year_level: 1, academic_year_id: 'abc' }]
      academicYearService.getClassesByAcademicYear.mockResolvedValue(mockClasses)

      const { classes, loadClassesByYear } = useAcademicYear()
      await loadClassesByYear('abc')

      expect(academicYearService.getClassesByAcademicYear).toHaveBeenCalledWith('abc')
      expect(classes.value).toEqual(mockClasses)
    })

    it('gère les erreurs', async () => {
      academicYearService.getClassesByAcademicYear.mockRejectedValue(new Error('Invalid ID'))

      const { error, loadClassesByYear } = useAcademicYear()
      await loadClassesByYear('bad-id')

      expect(error.value).toBe('Invalid ID')
    })
  })

  // ─── setActiveYear ───
  describe('setActiveYear', () => {
    it('active une année et recharge l\'année active', async () => {
      const mockYear = { id: 'y1', name: '2024-2025', is_active: true }
      academicYearService.setActiveAcademicYear.mockResolvedValue()
      academicYearService.getActiveAcademicYear.mockResolvedValue(mockYear)

      const { activeAcademicYear, setActiveYear } = useAcademicYear()
      await setActiveYear('y1')

      expect(academicYearService.setActiveAcademicYear).toHaveBeenCalledWith('y1')
      expect(activeAcademicYear.value).toEqual(mockYear)
    })

    it('propage l\'erreur et la stocke', async () => {
      academicYearService.setActiveAcademicYear.mockRejectedValue(new Error('Permission denied'))

      const { error, setActiveYear } = useAcademicYear()
      await expect(setActiveYear('y1')).rejects.toThrow('Permission denied')
      expect(error.value).toBe('Permission denied')
    })
  })

  // ─── createAcademicYear ───
  describe('createAcademicYear', () => {
    it('crée une année et l\'ajoute en tête de liste', async () => {
      const newYear = { id: 'new', name: '2025-2026' }
      academicYearService.createAcademicYear.mockResolvedValue(newYear)

      const { academicYears, createAcademicYear } = useAcademicYear()
      academicYears.value = [{ id: 'old', name: '2024-2025' }]

      const result = await createAcademicYear({ name: '2025-2026' })

      expect(result).toEqual(newYear)
      expect(academicYears.value[0]).toEqual(newYear)
      expect(academicYears.value).toHaveLength(2)
    })

    it('propage l\'erreur', async () => {
      academicYearService.createAcademicYear.mockRejectedValue(new Error('Duplicate'))

      const { error, createAcademicYear } = useAcademicYear()
      await expect(createAcademicYear({ name: '2024-2025' })).rejects.toThrow('Duplicate')
      expect(error.value).toBe('Duplicate')
    })
  })

  // ─── generateClasses ───
  describe('generateClasses', () => {
    it('génère des classes et les ajoute à la liste', async () => {
      const generated = [
        { code: 'BA27', year_level: 1 },
        { code: 'BA26', year_level: 2 },
      ]
      academicYearService.generateClassesForYear.mockResolvedValue(generated)

      const { classes, generateClasses } = useAcademicYear()
      classes.value = [{ code: 'BA25', year_level: 3 }]

      const result = await generateClasses('y1', 2027, 'temps_plein')

      expect(academicYearService.generateClassesForYear).toHaveBeenCalledWith('y1', 2027, 'temps_plein')
      expect(result).toEqual(generated)
      expect(classes.value).toHaveLength(3)
    })

    it('propage l\'erreur', async () => {
      academicYearService.generateClassesForYear.mockRejectedValue(new Error('Gen error'))

      const { error, generateClasses } = useAcademicYear()
      await expect(generateClasses('y1', 2027)).rejects.toThrow('Gen error')
      expect(error.value).toBe('Gen error')
    })
  })

  // ─── getClassMapping ───
  describe('getClassMapping', () => {
    it('retourne le mapping classe -> niveau', async () => {
      const mapping = { BA25: 3, BA26: 2, BA27: 1 }
      academicYearService.getClassYearLevelMapping.mockResolvedValue(mapping)

      const { getClassMapping } = useAcademicYear()
      const result = await getClassMapping()

      expect(result).toEqual(mapping)
    })

    it('retourne un objet vide en cas d\'erreur', async () => {
      academicYearService.getClassYearLevelMapping.mockRejectedValue(new Error('fail'))

      const { getClassMapping } = useAcademicYear()
      const result = await getClassMapping()

      expect(result).toEqual({})
    })
  })

  // ─── Loading state ───
  describe('loading state', () => {
    it('loading est true pendant le chargement', async () => {
      let resolvePromise
      academicYearService.getAllAcademicYears.mockReturnValue(
        new Promise(resolve => { resolvePromise = resolve })
      )

      const { loading, loadAcademicYears } = useAcademicYear()
      const promise = loadAcademicYears()

      expect(loading.value).toBe(true)

      resolvePromise([])
      await promise

      expect(loading.value).toBe(false)
    })

    it('loading est false après une erreur', async () => {
      academicYearService.getAllAcademicYears.mockRejectedValue(new Error('err'))

      const { loading, loadAcademicYears } = useAcademicYear()
      await loadAcademicYears()

      expect(loading.value).toBe(false)
    })
  })
})
