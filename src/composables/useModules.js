import { ref } from 'vue'
import modulesService from '@/service/modulesService'

export function useModules() {
  const modules = ref([])
  const loading = ref(false)
  const error = ref(null)

  /**
   * Charge tous les modules
   */
  const loadModules = async () => {
    console.log('[useModules] 🚀 Début loadModules...')
    loading.value = true
    error.value = null
    try {
      modules.value = await modulesService.getAllModules()
      console.log('[useModules] ✅ Modules assignés:', modules.value)
    } catch (e) {
      error.value = e.message
      console.error('[useModules] ❌ Erreur loadModules:', e)
    } finally {
      loading.value = false
      console.log('[useModules] 🏁 loadModules terminé')
    }
  }

  /**
   * Charge les modules par année
   */
  const loadModulesByYear = async (year) => {
    loading.value = true
    error.value = null
    try {
      modules.value = await modulesService.getModulesByYear(year)
    } catch (e) {
      error.value = e.message
      console.error('Erreur loadModulesByYear:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Charge les modules par semestre
   */
  const loadModulesBySemester = async (annee, semestre) => {
    loading.value = true
    error.value = null
    try {
      modules.value = await modulesService.getModulesBySemester(annee, semestre)
    } catch (e) {
      error.value = e.message
      console.error('Erreur loadModulesBySemester:', e)
    } finally {
      loading.value = false
    }
  }

  /**
   * Crée un nouveau module
   */
  const createModule = async (moduleData) => {
    loading.value = true
    error.value = null
    try {
      const newModule = await modulesService.createModule(moduleData)
      modules.value.push(newModule)
      return newModule
    } catch (e) {
      error.value = e.message
      console.error('Erreur createModule:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Met à jour un module
   */
  const updateModule = async (id, moduleData) => {
    loading.value = true
    error.value = null
    try {
      const updatedModule = await modulesService.updateModule(id, moduleData)
      const index = modules.value.findIndex(m => m.id === id)
      if (index !== -1) {
        modules.value[index] = updatedModule
      }
      return updatedModule
    } catch (e) {
      error.value = e.message
      console.error('Erreur updateModule:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Supprime un module
   */
  const deleteModule = async (id) => {
    loading.value = true
    error.value = null
    try {
      await modulesService.deleteModule(id)
      modules.value = modules.value.filter(m => m.id !== id)
    } catch (e) {
      error.value = e.message
      console.error('Erreur deleteModule:', e)
      throw e
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupère un module par son numéro
   */
  const getModuleByNumber = async (numero) => {
    try {
      return await modulesService.getModuleByNumber(numero)
    } catch (e) {
      console.error('Erreur getModuleByNumber:', e)
      return null
    }
  }

  return {
    modules,
    loading,
    error,
    loadModules,
    loadModulesByYear,
    loadModulesBySemester,
    createModule,
    updateModule,
    deleteModule,
    getModuleByNumber
  }
}
