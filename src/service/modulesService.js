import { supabase } from '@/supabase'

class ModulesService {
  /**
   * Récupère tous les modules
   */
  async getAllModules() {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')

      if (error) {
        console.error('[ModulesService] ❌ Erreur Supabase:', error)
        throw error
      }
      
      return data || []
    } catch (error) {
      console.error('[ModulesService] ❌ Erreur getAllModules:', error)
      throw error
    }
  }

  /**
   * Récupère les modules par année
   */
  async getModulesByYear(year) {
    try {
      let query = supabase.from('modules').select('*')

      if (year) {
        query = query.or(`annee.eq.${year},year.eq.${year}`)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[ModulesService] Erreur getModulesByYear:', error)
      throw error
    }
  }

  /**
   * Récupère un module par son ID
   */
  async getModuleById(id) {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[ModulesService] Erreur getModuleById:', error)
      throw error
    }
  }

  /**
   * Récupère un module par son numéro
   */
  async getModuleByNumber(numero) {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('number', numero)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[ModulesService] Erreur getModuleByNumber:', error)
      throw error
    }
  }

  /**
   * Crée un nouveau module
   */
  async createModule(moduleData) {
    try {
      // Exclure explicitement 'id' pour laisser Postgres auto-générer la PK
      const { id, ...cleanData } = moduleData
      console.log('[ModulesService] createModule payload:', JSON.stringify(cleanData))

      // Utiliser upsert pour éviter les conflits de clé primaire
      const { data, error } = await supabase
        .from('modules')
        .upsert([cleanData], { onConflict: 'code' })
        .select()

      if (error) throw error
      return Array.isArray(data) ? data[0] : data
    } catch (error) {
      console.error('[ModulesService] Erreur createModule:', error)
      throw error
    }
  }

  /**
   * Met à jour un module
   */
  async updateModule(id, moduleData) {
    try {
      const { data, error } = await supabase
        .from('modules')
        .update(moduleData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[ModulesService] Erreur updateModule:', error)
      throw error
    }
  }

  /**
   * Supprime un module
   */
  async deleteModule(id) {
    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('[ModulesService] Erreur deleteModule:', error)
      throw error
    }
  }

  /**
   * Récupère les modules par semestre
   */
  async getModulesBySemester(annee, semestre) {
    try {
      let query = supabase.from('modules').select('*')

      if (semestre) {
        query = query.eq('semestre', semestre)
      }
      if (annee) {
        query = query.or(`annee.eq.${annee},year.eq.${annee}`)
      }

      const { data, error } = await query
      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[ModulesService] Erreur getModulesBySemester:', error)
      throw error
    }
  }
}

const modulesService = new ModulesService()
export default modulesService
