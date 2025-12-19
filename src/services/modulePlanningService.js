/**
 * Service Planning Module
 * Gère le planning des cours d'un module spécifique
 */
import { supabase } from '@/supabase'

/**
 * Récupère tous les créneaux de planning d'un module
 * @param {number} moduleId - ID du module
 * @returns {Array} Liste des séances planifiées
 */
export async function getModulePlanning(moduleId) {
  try {
    console.log('📅 [modulePlanning] Chargement planning pour module:', moduleId)
    
    // Récupérer le code du module
    const { data: module, error: moduleError } = await supabase
      .from('modules')
      .select('code, title, number')
      .eq('id', moduleId)
      .single()
    
    if (moduleError) throw moduleError
    
    // Récupérer les créneaux via planning_time_slots (lié par module_code)
    const { data: timeSlots, error: slotsError } = await supabase
      .from('planning_time_slots')
      .select(`
        id,
        class_code,
        week_number,
        day,
        day_index,
        date,
        start_time,
        end_time,
        module_code,
        course_title,
        activity,
        teachers,
        room,
        notes,
        created_at
      `)
      .eq('module_code', module.code)
      .order('week_number', { ascending: true })
      .order('day_index', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (slotsError) {
      console.warn('⚠️ [modulePlanning] Erreur time_slots:', slotsError)
    }
    
    // Récupérer aussi les cellules planning_cells
    const { data: cells, error: cellsError } = await supabase
      .from('planning_cells')
      .select(`
        id,
        class_code,
        week_number,
        day,
        module_code,
        created_at
      `)
      .eq('module_code', module.code)
      .order('week_number', { ascending: true })
    
    if (cellsError) {
      console.warn('⚠️ [modulePlanning] Erreur cells:', cellsError)
    }
    
    // Combiner les données
    const planning = formatPlanningData(timeSlots || [], cells || [], module)
    
    console.log('✅ [modulePlanning] Planning chargé:', planning.length, 'séances')
    return planning
  } catch (error) {
    console.error('❌ [modulePlanning] Erreur:', error)
    return []
  }
}

/**
 * Récupère le planning d'un module par son code
 * @param {string} moduleCode - Code du module
 */
export async function getModulePlanningByCode(moduleCode) {
  try {
    const { data: timeSlots, error } = await supabase
      .from('planning_time_slots')
      .select('*')
      .eq('module_code', moduleCode)
      .order('week_number', { ascending: true })
      .order('day_index', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (error) throw error
    return timeSlots || []
  } catch (error) {
    console.error('❌ [modulePlanning] Erreur getByCode:', error)
    return []
  }
}

/**
 * Crée ou met à jour un créneau de planning pour un module
 * @param {Object} slotData - Données du créneau
 */
export async function saveModuleTimeSlot(slotData) {
  try {
    console.log('💾 [modulePlanning] Sauvegarde créneau:', slotData)
    
    const payload = {
      class_code: slotData.classCode || slotData.class_code,
      week_number: slotData.weekNumber || slotData.week_number,
      day: slotData.day,
      day_index: getDayIndex(slotData.day),
      date: slotData.date || null,
      start_time: slotData.startTime || slotData.start_time,
      end_time: slotData.endTime || slotData.end_time,
      module_code: slotData.moduleCode || slotData.module_code,
      course_title: slotData.courseTitle || slotData.course_title,
      activity: slotData.activity || 'Cours',
      teachers: slotData.teachers || [],
      room: slotData.room || null,
      notes: slotData.notes || null,
      updated_at: new Date().toISOString()
    }
    
    if (slotData.id) {
      // Update
      const { data, error } = await supabase
        .from('planning_time_slots')
        .update(payload)
        .eq('id', slotData.id)
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ [modulePlanning] Créneau mis à jour')
      return data
    } else {
      // Insert
      payload.created_at = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('planning_time_slots')
        .insert([payload])
        .select()
        .single()
      
      if (error) throw error
      console.log('✅ [modulePlanning] Créneau créé')
      return data
    }
  } catch (error) {
    console.error('❌ [modulePlanning] Erreur save:', error)
    throw error
  }
}

/**
 * Supprime un créneau de planning
 * @param {number} slotId - ID du créneau
 */
export async function deleteModuleTimeSlot(slotId) {
  try {
    console.log('🗑️ [modulePlanning] Suppression créneau:', slotId)
    
    const { error } = await supabase
      .from('planning_time_slots')
      .delete()
      .eq('id', slotId)
    
    if (error) throw error
    console.log('✅ [modulePlanning] Créneau supprimé')
    return { success: true }
  } catch (error) {
    console.error('❌ [modulePlanning] Erreur delete:', error)
    return { success: false, message: error.message }
  }
}

/**
 * Récupère les statistiques de planning d'un module
 * @param {number} moduleId - ID du module
 */
export async function getModulePlanningStats(moduleId) {
  try {
    const planning = await getModulePlanning(moduleId)
    
    // Calculer les stats
    const totalSessions = planning.length
    const totalHours = planning.reduce((sum, s) => {
      const start = parseTime(s.start_time)
      const end = parseTime(s.end_time)
      return sum + (end - start)
    }, 0)
    
    const byWeek = {}
    const byDay = { lundi: 0, mardi: 0, mercredi: 0, jeudi: 0, vendredi: 0 }
    
    planning.forEach(s => {
      // Par semaine
      byWeek[s.week_number] = (byWeek[s.week_number] || 0) + 1
      
      // Par jour
      const dayLower = s.day?.toLowerCase()
      if (byDay[dayLower] !== undefined) {
        byDay[dayLower]++
      }
    })
    
    return {
      totalSessions,
      totalHours: Math.round(totalHours * 10) / 10,
      weeksCount: Object.keys(byWeek).length,
      byWeek,
      byDay,
      sessions: planning
    }
  } catch (error) {
    console.error('❌ [modulePlanning] Erreur stats:', error)
    return {
      totalSessions: 0,
      totalHours: 0,
      weeksCount: 0,
      byWeek: {},
      byDay: {},
      sessions: []
    }
  }
}

/**
 * Récupère les classes disponibles
 */
export async function getAvailableClasses() {
  try {
    const { data, error } = await supabase
      .from('planning_time_slots')
      .select('class_code')
      .order('class_code')
    
    if (error) throw error
    
    // Unique classes
    const classes = [...new Set((data || []).map(d => d.class_code))].filter(Boolean)
    return classes
  } catch (error) {
    console.error('❌ [modulePlanning] Erreur classes:', error)
    return ['bac26', 'bac26-pt', 'bac25', 'bac25-pt']
  }
}

// ==================== UTILITAIRES ====================

function formatPlanningData(timeSlots, cells, module) {
  const sessions = []
  
  // Ajouter les time_slots
  timeSlots.forEach(slot => {
    sessions.push({
      id: slot.id,
      type: 'time_slot',
      classCode: slot.class_code,
      weekNumber: slot.week_number,
      day: slot.day,
      dayIndex: slot.day_index,
      date: slot.date,
      startTime: slot.start_time,
      endTime: slot.end_time,
      moduleCode: slot.module_code,
      courseTitle: slot.course_title || module.title,
      activity: slot.activity,
      teachers: slot.teachers || [],
      room: slot.room,
      notes: slot.notes,
      // Pour l'affichage
      displayTime: `${slot.start_time?.substring(0, 5)} - ${slot.end_time?.substring(0, 5)}`,
      displayDay: getDayLabel(slot.day)
    })
  })
  
  return sessions.sort((a, b) => {
    if (a.weekNumber !== b.weekNumber) return a.weekNumber - b.weekNumber
    if (a.dayIndex !== b.dayIndex) return a.dayIndex - b.dayIndex
    return (a.startTime || '').localeCompare(b.startTime || '')
  })
}

function getDayIndex(day) {
  const days = { 
    lu: 0, ma: 1, me: 2, je: 3, ve: 4, dist: 5,
    lundi: 0, mardi: 1, mercredi: 2, jeudi: 3, vendredi: 4, distance: 5
  }
  return days[day?.toLowerCase()] ?? 0
}

function getDayLabel(day) {
  const labels = {
    lundi: 'Lundi', mardi: 'Mardi', mercredi: 'Mercredi', 
    jeudi: 'Jeudi', vendredi: 'Vendredi', distance: 'Distance',
    lu: 'Lundi', ma: 'Mardi', me: 'Mercredi', je: 'Jeudi', ve: 'Vendredi', dist: 'Distance'
  }
  return labels[day?.toLowerCase()] || day
}

function parseTime(timeStr) {
  if (!timeStr) return 0
  const [hours, minutes] = timeStr.split(':').map(Number)
  return hours + minutes / 60
}

export default {
  getModulePlanning,
  getModulePlanningByCode,
  saveModuleTimeSlot,
  deleteModuleTimeSlot,
  getModulePlanningStats,
  getAvailableClasses
}
