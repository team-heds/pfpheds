import { ref, computed } from 'vue'
import academicYearService from '@/service/academicYearService'

export function useAcademicYear() {
  const academicYears = ref([])
  const classes = ref([])
  const activeAcademicYear = ref(null)
  const loading = ref(false)
  const error = ref(null)

  /**
   * Charge toutes les années académiques
   */
  const loadAcademicYears = async () => {
    loading.value = true
    error.value = null
    try {
      academicYears.value = await academicYearService.getAllAcademicYears()
    } catch (e) {
      error.value = e.message
      console.error('Erreur loadAcademicYears:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Charge l'année académique active
   */
  const loadActiveAcademicYear = async () => {
    loading.value = true
    error.value = null
    try {
      activeAcademicYear.value = await academicYearService.getActiveAcademicYear()
    } catch (e) {
      error.value = e.message
      console.error('Erreur loadActiveAcademicYear:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Charge toutes les classes
   */
  const loadClasses = async () => {
    loading.value = true
    error.value = null
    try {
      classes.value = await academicYearService.getAllClasses()
    } catch (e) {
      error.value = e.message
      console.error('Erreur loadClasses:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Charge les classes pour une année académique spécifique
   */
  const loadClassesByYear = async (academicYearId) => {
    loading.value = true
    error.value = null
    try {
      classes.value = await academicYearService.getClassesByAcademicYear(academicYearId)
    } catch (e) {
      error.value = e.message
      console.error('Erreur loadClassesByYear:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Active une année académique
   */
  const setActiveYear = async (id) => {
    loading.value = true
    error.value = null
    try {
      await academicYearService.setActiveAcademicYear(id)
      await loadActiveAcademicYear()
    } catch (e) {
      error.value = e.message
      console.error('Erreur setActiveYear:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Crée une nouvelle année académique
   */
  const createAcademicYear = async (yearData) => {
    loading.value = true
    error.value = null
    try {
      const newYear = await academicYearService.createAcademicYear(yearData)
      academicYears.value.unshift(newYear)
      return newYear
    } catch (e) {
      error.value = e.message
      console.error('Erreur createAcademicYear:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Génère automatiquement les classes pour une année
   */
  const generateClasses = async (academicYearId, startYear) => {
    loading.value = true
    error.value = null
    try {
      const newClasses = await academicYearService.generateClassesForYear(academicYearId, startYear)
      classes.value.push(...newClasses)
      return newClasses
    } catch (e) {
      error.value = e.message
      console.error('Erreur generateClasses:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère le mapping classe -> niveau d'année
   */
  const getClassMapping = async () => {
    try {
      return await academicYearService.getClassYearLevelMapping()
    } catch (e) {
      console.error('Erreur getClassMapping:', e)
      return {}
    }
  }

  /**
   * Computed: Nom formaté de l'année active
   */
  const activeYearName = computed(() => {
    return activeAcademicYear.value?.name || 'Aucune année active'
  })

  /**
   * Computed: Liste des classes triées par niveau
   */
  const sortedClasses = computed(() => {
    return [...classes.value].sort((a, b) => a.year_level - b.year_level)
  })

  return {
    // State
    academicYears,
    classes,
    activeAcademicYear,
    loading,
    error,
    
    // Computed
    activeYearName,
    sortedClasses,
    
    // Actions
    loadAcademicYears,
    loadActiveAcademicYear,
    loadClasses,
    loadClassesByYear,
    setActiveYear,
    createAcademicYear,
    generateClasses,
    getClassMapping
  }
}
