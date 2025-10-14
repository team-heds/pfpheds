import { supabase } from '@/supabase'

class AcademicYearService {
  /**
   * Récupère toutes les années académiques
   */
  async getAllAcademicYears() {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[AcademicYearService] Erreur getAllAcademicYears:', error)
      throw error
    }
  }

  /**
   * Récupère l'année académique active
   */
  async getActiveAcademicYear() {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .eq('is_active', true)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[AcademicYearService] Erreur getActiveAcademicYear:', error)
      throw error
    }
  }

  /**
   * Crée une nouvelle année académique
   */
  async createAcademicYear(yearData) {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .insert([yearData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[AcademicYearService] Erreur createAcademicYear:', error)
      throw error
    }
  }

  /**
   * Met à jour une année académique
   */
  async updateAcademicYear(id, yearData) {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .update(yearData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[AcademicYearService] Erreur updateAcademicYear:', error)
      throw error
    }
  }

  /**
   * Active une année académique (et désactive les autres)
   */
  async setActiveAcademicYear(id) {
    try {
      // Désactiver toutes les années
      await supabase
        .from('academic_years')
        .update({ is_active: false })
        .neq('id', id)

      // Activer l'année sélectionnée
      const { data, error } = await supabase
        .from('academic_years')
        .update({ is_active: true })
        .eq('id', id)
        .select()

      if (error) throw error
      return data && data.length > 0 ? data[0] : null
    } catch (error) {
      console.error('[AcademicYearService] Erreur setActiveAcademicYear:', error)
      throw error
    }
  }

  /**
   * Récupère toutes les classes
   */
  async getAllClasses() {
    try {
      const { data, error} = await supabase
        .from('classes')
        .select('*, academic_year:academic_years(*)')
        .order('code', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[AcademicYearService] Erreur getAllClasses:', error)
      throw error
    }
  }

  /**
   * Récupère les classes pour une année académique
   */
  async getClassesByAcademicYear(academicYearId) {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('academic_year_id', academicYearId)
        .order('year_level', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[AcademicYearService] Erreur getClassesByAcademicYear:', error)
      throw error
    }
  }

  /**
   * Crée une nouvelle classe
   */
  async createClass(classData) {
    try {
      const { data, error } = await supabase
        .from('classes')
        .insert([classData])
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[AcademicYearService] Erreur createClass:', error)
      throw error
    }
  }

  /**
   * Met à jour une classe
   */
  async updateClass(id, classData) {
    try {
      const { data, error } = await supabase
        .from('classes')
        .update(classData)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[AcademicYearService] Erreur updateClass:', error)
      throw error
    }
  }

  /**
   * Génère automatiquement les classes pour une année académique
   * Basé sur l'année de départ (ex: 2025 génère B25, B24, B23)
   */
  async generateClassesForYear(academicYearId, startYear) {
    try {
      // Vérifier quelles classes existent déjà pour cette année
      const { data: existingClasses } = await supabase
        .from('classes')
        .select('code')
        .eq('academic_year_id', academicYearId)
      
      const existingCodes = new Set(existingClasses?.map(c => c.code) || [])
      
      const classes = []
      
      for (let level = 1; level <= 3; level++) {
        const classYear = startYear - (level - 1)
        const code = `B${classYear.toString().slice(-2)}`
        
        // Seulement ajouter si elle n'existe pas déjà
        if (!existingCodes.has(code)) {
          classes.push({
            code,
            name: `Bachelor ${classYear} - ${level}${level === 1 ? 'ère' : 'ème'} année`,
            year_level: level,
            academic_year_id: academicYearId
          })
        }
      }

      // Si aucune classe à créer, retourner les existantes
      if (classes.length === 0) {
        return existingClasses
      }

      const { data, error } = await supabase
        .from('classes')
        .insert(classes)
        .select()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[AcademicYearService] Erreur generateClassesForYear:', error)
      throw error
    }
  }

  /**
   * Récupère le mapping classe -> année d'étude pour l'année active
   * Retourne ex: { 'bac25': 1, 'bac24': 2, 'bac23': 3 }
   */
  async getClassYearLevelMapping() {
    try {
      const activeYear = await this.getActiveAcademicYear()
      if (!activeYear) return {}

      const classes = await this.getClassesByAcademicYear(activeYear.id)
      
      const mapping = {}
      classes.forEach(classItem => {
        // Convertir B25 -> bac25
        const key = 'bac' + classItem.code.substring(1)
        mapping[key] = classItem.year_level
      })

      return mapping
    } catch (error) {
      console.error('[AcademicYearService] Erreur getClassYearLevelMapping:', error)
      return {}
    }
  }
}

const academicYearService = new AcademicYearService()
export default academicYearService
