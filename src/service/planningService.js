import { supabase } from '@/supabase'

/**
 * Service unifié de gestion du planning - Supabase
 * Remplace weeklyPlanningService et academicPlanningService (Firebase)
 */
class PlanningService {
  
  // ==================== GESTION DES CRÉNEAUX HORAIRES ====================
  
  /**
   * Récupère tous les créneaux d'une classe pour une semaine spécifique
   * @param {string} classCode - Code de la classe (ex: "bac26", "bac26-pt")
   * @param {number} weekNumber - Numéro de semaine (1-52)
   * @returns {Array} Liste des créneaux
   */
  async getWeekTimeSlots(classCode, weekNumber) {
    try {
      const { data, error } = await supabase
        .from('planning_time_slots')
        .select('*')
        .eq('class_code', classCode)
        .eq('week_number', weekNumber)
        .order('day_index', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[PlanningService] Erreur getWeekTimeSlots:', error)
      throw error
    }
  }

  /**
   * Récupère tous les créneaux d'un semestre
   * @param {string} classCode - Code de la classe
   * @param {string} semester - 'spring' (S8-S37) ou 'autumn' (S38-S52 & S1-S7)
   * @returns {Array} Liste des créneaux
   */
  async getSemesterTimeSlots(classCode, semester) {
    try {
      let query = supabase
        .from('planning_time_slots')
        .select('*')
        .eq('class_code', classCode)
        .order('week_number', { ascending: true })
        .order('day_index', { ascending: true })
        .order('start_time', { ascending: true })

      // Filtrer par semestre
      if (semester === 'spring') {
        query = query.gte('week_number', 8).lte('week_number', 37)
      } else if (semester === 'autumn') {
        query = query.or('week_number.gte.38,week_number.lte.7')
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('[PlanningService] Erreur getSemesterTimeSlots:', error)
      throw error
    }
  }

  /**
   * Crée ou met à jour un créneau horaire
   * @param {object} slotData - Données du créneau
   * @returns {object} Créneau créé/mis à jour
   */
  async saveTimeSlot(slotData) {
    try {
      const slot = {
        class_code: slotData.classCode || slotData.class_code,
        week_number: slotData.weekNumber || slotData.week_number,
        day: slotData.day,
        day_index: this.getDayIndex(slotData.day),
        date: slotData.date,
        start_time: slotData.startTime || slotData.start_time,
        end_time: slotData.endTime || slotData.end_time,
        module_code: slotData.moduleCode || slotData.module_code,
        course_title: slotData.courseTitle || slotData.course_title,
        activity: slotData.activity,
        teachers: slotData.teachers || [],
        room: slotData.room,
        notes: slotData.notes,
        updated_at: new Date().toISOString()
      }

      if (slotData.id) {
        // Update
        const { data, error } = await supabase
          .from('planning_time_slots')
          .update(slot)
          .eq('id', slotData.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Insert
        slot.created_at = new Date().toISOString()
        
        const { data, error } = await supabase
          .from('planning_time_slots')
          .insert([slot])
          .select()
          .single()

        if (error) throw error
        return data
      }
    } catch (error) {
      console.error('[PlanningService] Erreur saveTimeSlot:', error)
      throw error
    }
  }

  /**
   * Supprime un créneau horaire
   * @param {number} slotId - ID du créneau
   */
  async deleteTimeSlot(slotId) {
    try {
      const { error } = await supabase
        .from('planning_time_slots')
        .delete()
        .eq('id', slotId)

      if (error) throw error
    } catch (error) {
      console.error('[PlanningService] Erreur deleteTimeSlot:', error)
      throw error
    }
  }

  /**
   * Duplique tous les créneaux d'une semaine vers une autre
   * @param {string} classCode - Code de la classe
   * @param {number} fromWeek - Semaine source
   * @param {number} toWeek - Semaine destination
   */
  async duplicateWeek(classCode, fromWeek, toWeek) {
    try {
      // Récupérer les créneaux source
      const sourceSlots = await this.getWeekTimeSlots(classCode, fromWeek)

      // Créer les nouveaux créneaux
      const newSlots = sourceSlots.map(slot => ({
        class_code: classCode,
        week_number: toWeek,
        day: slot.day,
        day_index: slot.day_index,
        date: null, // À recalculer
        start_time: slot.start_time,
        end_time: slot.end_time,
        module_code: slot.module_code,
        course_title: slot.course_title,
        activity: slot.activity,
        teachers: slot.teachers,
        room: slot.room,
        notes: slot.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      const { data, error } = await supabase
        .from('planning_time_slots')
        .insert(newSlots)
        .select()

      if (error) throw error
      return data
    } catch (error) {
      console.error('[PlanningService] Erreur duplicateWeek:', error)
      throw error
    }
  }

  // ==================== GESTION DES MODULES DE COURS ====================

  /**
   * Récupère tous les modules de cours
   * @returns {Array} Liste des modules avec mapping camelCase
   */
  async getAllCourseModules() {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .order('number', { ascending: true })

      if (error) throw error
      
      // Mapper les colonnes de votre table vers le format attendu
      return (data || []).map(module => ({
        id: module.id,
        code: module.code,
        module_number: module.number,
        label: module.title,
        color: module.color,
        year_level: module.year,
        // Conserver aussi les colonnes originales
        ...module
      }))
    } catch (error) {
      console.error('[PlanningService] Erreur getAllCourseModules:', error)
      throw error
    }
  }

  /**
   * Récupère un module de cours par son code
   * @param {string} moduleCode - Code du module
   * @returns {object} Module
   */
  async getCourseModule(moduleCode) {
    try {
      const { data, error } = await supabase
        .from('modules')
        .select('*')
        .eq('code', moduleCode)
        .single()

      if (error) throw error
      
      // Mapper pour compatibilité
      return {
        id: data.id,
        code: data.code,
        module_number: data.number,
        label: data.title,
        color: data.color,
        year_level: data.year,
        ...data
      }
    } catch (error) {
      console.error('[PlanningService] Erreur getCourseModule:', error)
      throw error
    }
  }

  /**
   * Crée ou met à jour un module de cours
   * @param {object} moduleData - Données du module
   * @returns {object} Module créé/mis à jour
   */
  async saveCourseModule(moduleData) {
    try {
      const module = {
        code: moduleData.code,
        number: moduleData.moduleNumber || moduleData.module_number || moduleData.number,
        title: moduleData.label || moduleData.title,
        color: moduleData.color,
        year: moduleData.yearLevel || moduleData.year_level || moduleData.year || 1,
        updated_at: new Date().toISOString()
      }

      if (moduleData.id) {
        // Update
        const { data, error } = await supabase
          .from('modules')
          .update(module)
          .eq('id', moduleData.id)
          .select()
          .single()

        if (error) throw error
        return data
      } else {
        // Insert
        module.created_at = new Date().toISOString()
        
        const { data, error } = await supabase
          .from('modules')
          .insert([module])
          .select()
          .single()

        if (error) throw error
        return data
      }
    } catch (error) {
      console.error('[PlanningService] Erreur saveCourseModule:', error)
      throw error
    }
  }

  /**
   * Supprime un module de cours
   * @param {number} moduleId - ID du module
   */
  async deleteCourseModule(moduleId) {
    try {
      const { error } = await supabase
        .from('modules')
        .delete()
        .eq('id', moduleId)

      if (error) throw error
    } catch (error) {
      console.error('[PlanningService] Erreur deleteCourseModule:', error)
      throw error
    }
  }

  // ==================== GESTION DU PLANNING ACADÉMIQUE (MINIBRICK) ====================

  /**
   * Récupère toutes les cellules d'une classe pour un semestre
   * @param {string} classCode - Code de la classe
   * @param {string} semester - 'spring' ou 'autumn'
   * @returns {Object} Objet avec les cellules indexées par "day_week"
   */
  async getPlanningCells(classCode, semester) {
    try {
      let query = supabase
        .from('planning_cells')
        .select('*')
        .eq('class_code', classCode)

      // Filtrer par semestre
      if (semester === 'spring') {
        query = query.gte('week_number', 8).lte('week_number', 37)
      } else if (semester === 'autumn') {
        query = query.or('week_number.gte.38,week_number.lte.7')
      }

      const { data, error } = await query

      if (error) throw error

      // Convertir en objet indexé par "day_week"
      // ET convertir les jours longs en jours courts pour compatibilité avec le template
      const cells = {}
      if (data) {
        data.forEach(cell => {
          const shortDay = this.getDayShortName(cell.day)
          const key = `${shortDay}_${cell.week_number}`
          cells[key] = {
            ...cell,
            day: shortDay // Convertir pour le template
          }
        })
      }

      return cells
    } catch (error) {
      console.error('[PlanningService] Erreur getPlanningCells:', error)
      throw error
    }
  }

  /**
   * Sauvegarde une cellule du planning académique
   * @param {string} classCode - Code de la classe
   * @param {number} weekNumber - Numéro de semaine
   * @param {string} day - Jour de la semaine
   * @param {string} moduleCode - Code du module (null pour supprimer)
   */
  async savePlanningCell(classCode, weekNumber, day, moduleCode) {
    try {
      // Convertir le jour court en jour complet (lu -> lundi)
      const fullDay = this.getDayFullName(day)
      
      if (!moduleCode) {
        // Supprimer la cellule si module vide
        const { error } = await supabase
          .from('planning_cells')
          .delete()
          .eq('class_code', classCode)
          .eq('week_number', weekNumber)
          .eq('day', fullDay)

        if (error?.message) {
          console.error('[PlanningService] Erreur DELETE:', error)
          throw error
        }
        return null
      }

      // Upsert (insert or update)
      const payload = {
        class_code: classCode,
        week_number: weekNumber,
        day: fullDay,
        module_code: moduleCode
      }
      
      const { data, error } = await supabase
        .from('planning_cells')
        .upsert(payload, {
          onConflict: 'class_code,week_number,day'
        })
        .select()

      // Vérifier si c'est une vraie erreur (pas juste un objet vide {})
      if (error?.message) {
        console.error('[PlanningService] Erreur UPSERT:', error)
        throw error
      }
      
      // Si upsert retourne un tableau, prendre le premier élément
      const cellData = Array.isArray(data) ? data[0] : data
      
      return cellData
    } catch (error) {
      console.error('[PlanningService] Erreur savePlanningCell:', error)
      throw error
    }
  }

  /**
   * Supprime une cellule du planning académique
   * @param {string} classCode - Code de la classe
   * @param {number} weekNumber - Numéro de semaine
   * @param {string} day - Jour de la semaine
   */
  async deletePlanningCell(classCode, weekNumber, day) {
    try {
      // Convertir le jour court en jour complet
      const fullDay = this.getDayFullName(day)
      
      const { error } = await supabase
        .from('planning_cells')
        .delete()
        .eq('class_code', classCode)
        .eq('week_number', weekNumber)
        .eq('day', fullDay)

      if (error?.message) throw error
    } catch (error) {
      console.error('[PlanningService] Erreur deletePlanningCell:', error)
      throw error
    }
  }

  /**
   * Génère automatiquement les créneaux hebdomadaires depuis une cellule
   * @param {Object} cell - Cellule du planning académique
   */
  async generateTimeSlotsFromCell(cell) {
    try {
      // Convertir le jour court en jour complet
      const fullDay = this.getDayFullName(cell.day)
      
      // Supprimer les créneaux existants pour ce jour
      const { error: deleteError } = await supabase
        .from('planning_time_slots')
        .delete()
        .eq('class_code', cell.class_code)
        .eq('week_number', cell.week_number)
        .eq('day', fullDay)

      if (deleteError?.message) {
        console.error('[PlanningService] Erreur DELETE time_slots:', deleteError)
        throw deleteError
      }

      if (!cell.module_code) {
        return // Pas de module = pas de créneaux
      }

      // Générer 2 créneaux par défaut (matin et après-midi)
      const slots = [
        {
          class_code: cell.class_code,
          week_number: cell.week_number,
          day: fullDay,
          day_index: this.getDayIndex(fullDay),
          date: this.getDateForWeekAndDay(cell.week_number, this.getDayIndex(fullDay)),
          start_time: '09:00',
          end_time: '11:00',
          module_code: cell.module_code,
          activity: 'Cours',
          teachers: [],
          room: null,
          notes: null
        },
        {
          class_code: cell.class_code,
          week_number: cell.week_number,
          day: fullDay,
          day_index: this.getDayIndex(fullDay),
          date: this.getDateForWeekAndDay(cell.week_number, this.getDayIndex(fullDay)),
          start_time: '13:00',
          end_time: '15:00',
          module_code: cell.module_code,
          activity: 'Cours',
          teachers: [],
          room: null,
          notes: null
        }
      ]
      
      const { error: insertError } = await supabase
        .from('planning_time_slots')
        .insert(slots)

      if (insertError?.message) {
        console.error('[PlanningService] Erreur INSERT time_slots:', insertError)
        throw insertError
      }
      
    } catch (error) {
      console.error('[PlanningService] Erreur generateTimeSlotsFromCell:', error)
      throw error
    }
  }

  // ==================== UTILITAIRES ====================

  /**
   * Convertit le nom du jour court en jour complet
   * @param {string} day - Nom du jour court ('lu', 'ma', etc.) ou 'dist'
   * @returns {string} Nom du jour complet ('lundi', 'mardi', etc.) ou 'distance'
   */
  getDayFullName(day) {
    const mapping = {
      lu: 'lundi',
      ma: 'mardi',
      me: 'mercredi',
      je: 'jeudi',
      ve: 'vendredi',
      dist: 'distance'
    }
    return mapping[day] || day // Si déjà en format long, retourner tel quel
  }

  /**
   * Convertit le nom du jour complet en jour court
   * @param {string} day - Nom du jour complet ('lundi', 'mardi', etc.) ou 'distance'
   * @returns {string} Nom du jour court ('lu', 'ma', etc.) ou 'dist'
   */
  getDayShortName(day) {
    const mapping = {
      lundi: 'lu',
      mardi: 'ma',
      mercredi: 'me',
      jeudi: 'je',
      vendredi: 've',
      distance: 'dist'
    }
    return mapping[day] || day // Si déjà en format court, retourner tel quel
  }

  /**
   * Convertit le nom du jour en index
   * @param {string} day - Nom du jour ('lu', 'ma', 'lundi', 'mardi', etc.) ou 'distance'
   * @returns {number} Index du jour (0-4, 5 pour distance)
   */
  getDayIndex(day) {
    const days = { 
      lu: 0, ma: 1, me: 2, je: 3, ve: 4, dist: 5,
      lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, distance: 5
    }
    return days[day] ?? 0
  }

  /**
   * Calcule la date d'un jour à partir du numéro de semaine ISO
   * @param {number} weekNumber - Numéro de semaine ISO (1-53)
   * @param {number} dayIndex - Index du jour (0=lundi, 4=vendredi)
   * @param {number} [autumnYear] - Année civile de l'automne académique (ex: 2025 pour 2025-2026)
   * @returns {string} Date au format DD.MM.YYYY
   */
  getDateForWeekAndDay(weekNumber, dayIndex, autumnYear) {
    // Si pas d'année fournie, déduire depuis la date courante
    if (!autumnYear) {
      const now = new Date()
      const currentMonth = now.getMonth() + 1
      autumnYear = currentMonth >= 8 ? now.getFullYear() : now.getFullYear() - 1
    }
    
    const springYear = autumnYear + 1
    
    // S38-S53 → automne (autumnYear), S1-S37 → printemps (springYear)
    // Note: certaines années ISO ont 53 semaines (ex: 2020, 2026)
    const year = weekNumber >= 38 ? autumnYear : springYear
    
    // Trouver le lundi de la semaine 1 de cette année
    const jan4 = new Date(year, 0, 4) // 4 janvier est toujours dans la semaine 1 ISO
    const jan4Day = jan4.getDay() || 7 // Dimanche = 7
    const week1Monday = new Date(jan4)
    week1Monday.setDate(jan4.getDate() - jan4Day + 1) // Reculer au lundi
    
    // Calculer le lundi de la semaine demandée
    const targetMonday = new Date(week1Monday)
    targetMonday.setDate(week1Monday.getDate() + (weekNumber - 1) * 7)
    
    // Ajouter l'offset du jour (0=lundi, 1=mardi, ..., 4=vendredi)
    const targetDate = new Date(targetMonday)
    targetDate.setDate(targetMonday.getDate() + dayIndex)
    
    // Formater en DD.MM.YYYY
    const day = String(targetDate.getDate()).padStart(2, '0')
    const month = String(targetDate.getMonth() + 1).padStart(2, '0')
    const fullYear = targetDate.getFullYear()
    
    return `${day}.${month}.${fullYear}`
  }
}

const planningService = new PlanningService()
export default planningService
