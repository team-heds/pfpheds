/**
 * Service Dashboard Enseignant
 * Récupère les données spécifiques à l'enseignant connecté depuis Supabase
 */
import { supabase } from '@/supabase'

/**
 * Récupère les cours assignés à l'enseignant via course_teachers
 * @param {string} userId - ID de l'enseignant
 * @param {string} userEmail - Email de l'enseignant (fallback)
 */
export async function getMyCourses(userId, userEmail) {
  try {
    if (import.meta.env.DEV) console.log('📚 [getMyCourses] Chargement cours pour enseignant:', userId)
    
    // Récupérer les assignations via course_teachers
    const { data: assignments, error: assignError } = await supabase
      .from('course_teachers')
      .select(`
        id,
        course_id,
        hours,
        role,
        courses (
          id,
          name,
          code,
          module_id,
          type,
          hours,
          color,
          modules (
            id,
            title,
            code,
            track_id,
            responsable,
            responsable_email
          )
        )
      `)
      .or(`teacher_id.eq.${userId},teacher_email.eq.${userEmail}`)
    
    if (assignError) {
      console.error('❌ [getMyCourses] Erreur:', assignError)
      // Fallback: essayer sans la relation modules
      return await getMyCoursesSimple(userId, userEmail)
    }
    
    // Formater les cours
    const courses = (assignments || [])
      .filter(a => a.courses)
      .map(a => ({
        id: a.courses.id,
        name: a.courses.name,
        code: a.courses.code,
        moduleId: a.courses.module_id,
        moduleName: a.courses.modules?.title || 'Module inconnu',
        moduleCode: a.courses.modules?.code || '',
        type: a.courses.type || 'CM',
        hours: a.hours || a.courses.hours || 0,
        color: a.courses.color || '#3b82f6',
        role: a.role || 'Enseignant',
        trackId: a.courses.modules?.track_id || null
      }))
    
    if (import.meta.env.DEV) console.log('✅ [getMyCourses] Cours trouvés:', courses.length)
    return courses
  } catch (error) {
    console.error('❌ [getMyCourses] Erreur:', error)
    return []
  }
}

/**
 * Fallback simplifié pour récupérer les cours
 */
async function getMyCoursesSimple(userId, userEmail) {
  try {
    const { data, error } = await supabase
      .from('course_teachers')
      .select('course_id, hours, role')
      .or(`teacher_id.eq.${userId},teacher_email.eq.${userEmail}`)
    
    if (error || !data) return []
    
    // Récupérer les détails des cours
    const courseIds = data.map(d => d.course_id)
    if (courseIds.length === 0) return []
    
    const { data: courses } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds)
    
    return (courses || []).map(c => ({
      id: c.id,
      name: c.name,
      code: c.code,
      moduleId: c.module_id,
      moduleName: 'Module',
      type: c.type || 'CM',
      hours: c.hours || 0,
      color: c.color || '#3b82f6',
      role: 'Enseignant'
    }))
  } catch (error) {
    console.error('❌ [getMyCoursesSimple] Erreur:', error)
    return []
  }
}

/**
 * Récupère le planning hebdomadaire de l'enseignant depuis planning_time_slots
 * @param {string} userId - ID de l'enseignant
 * @param {string} userEmail - Email de l'enseignant
 * @param {string} teacherName - Nom de l'enseignant (pour recherche dans teachers array)
 */
export async function getMyWeekPlanning(userId, userEmail, teacherName = null) {
  try {
    if (import.meta.env.DEV) console.log('📅 [getMyWeekPlanning] Chargement planning pour:', userEmail || userId)
    
    // Calculer la semaine courante
    const now = new Date()
    const dayOfWeek = now.getDay()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    const weekNumber = getWeekNumber(startOfWeek)
    
    // Récupérer tous les créneaux de la semaine courante
    const { data: slots, error } = await supabase
      .from('planning_time_slots')
      .select('*')
      .eq('week_number', weekNumber)
      .order('day_index', { ascending: true })
      .order('start_time', { ascending: true })
    
    if (error) {
      console.warn('⚠️ [getMyWeekPlanning] Erreur:', error)
      return { week: generateEmptyWeek(), allSlots: [] }
    }
    
    if (!slots || slots.length === 0) {
      if (import.meta.env.DEV) console.log('ℹ️ [getMyWeekPlanning] Aucun planning trouvé pour semaine', weekNumber)
      return { week: generateEmptyWeek(), allSlots: [] }
    }
    
    // Filtrer les créneaux où l'enseignant est présent
    const mySlots = slots.filter(slot => {
      const teachers = slot.teachers || []
      return teachers.some(t => {
        const name = typeof t === 'object' ? t.name : t
        if (!name) return false
        const nameLower = name.toLowerCase().trim()
        // Comparer avec email ou nom
        if (userEmail && nameLower.includes(userEmail.split('@')[0].toLowerCase())) return true
        if (teacherName && nameLower.includes(teacherName.toLowerCase())) return true
        return false
      })
    })
    
    if (import.meta.env.DEV) console.log('📅 [getMyWeekPlanning] Créneaux trouvés:', mySlots.length, '/', slots.length)
    
    // Convertir en format semaine
    return { week: formatSlotsToWeek(mySlots), allSlots: mySlots }
  } catch (error) {
    console.error('❌ [getMyWeekPlanning] Erreur:', error)
    return { week: generateEmptyWeek(), allSlots: [] }
  }
}

/**
 * Récupère toutes les séances à venir de l'enseignant
 */
export async function getUpcomingSessions(userEmail, teacherName = null, limit = 10) {
  try {
    if (import.meta.env.DEV) console.log('📆 [getUpcomingSessions] Chargement séances à venir pour:', userEmail)
    
    const today = new Date().toISOString().split('T')[0]
    const currentWeek = getWeekNumber(new Date())
    
    // Récupérer les créneaux à venir
    const { data: slots, error } = await supabase
      .from('planning_time_slots')
      .select('*')
      .gte('week_number', currentWeek)
      .order('week_number', { ascending: true })
      .order('day_index', { ascending: true })
      .order('start_time', { ascending: true })
      .limit(200)
    
    if (error || !slots) {
      console.warn('⚠️ [getUpcomingSessions] Erreur:', error)
      return []
    }
    
    // Filtrer les créneaux de l'enseignant
    const mySlots = slots.filter(slot => {
      const teachers = slot.teachers || []
      return teachers.some(t => {
        const name = typeof t === 'object' ? t.name : t
        if (!name) return false
        const nameLower = name.toLowerCase().trim()
        if (userEmail && nameLower.includes(userEmail.split('@')[0].toLowerCase())) return true
        if (teacherName && nameLower.includes(teacherName.toLowerCase())) return true
        return false
      })
    })
    
    // Formater les séances
    const sessions = mySlots.slice(0, limit).map(slot => ({
      id: slot.id,
      date: slot.date || `Semaine ${slot.week_number}`,
      day: slot.day,
      time: `${slot.start_time?.substring(0, 5) || ''} - ${slot.end_time?.substring(0, 5) || ''}`,
      course: slot.course_title || slot.module_code || 'Cours',
      module: slot.module_code,
      room: slot.room || 'Salle N/A',
      class: slot.class_code,
      type: slot.activity || 'Cours',
      weekNumber: slot.week_number
    }))
    
    if (import.meta.env.DEV) console.log('✅ [getUpcomingSessions] Séances à venir:', sessions.length)
    return sessions
  } catch (error) {
    console.error('❌ [getUpcomingSessions] Erreur:', error)
    return []
  }
}

/**
 * Calcule le numéro de semaine
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

/**
 * Convertit les slots en format semaine
 */
function formatSlotsToWeek(slots) {
  const daysMap = {
    'Lundi': 0, 'Mardi': 1, 'Mercredi': 2, 'Jeudi': 3, 'Vendredi': 4
  }
  
  const week = [
    { name: 'Lundi', courses: [] },
    { name: 'Mardi', courses: [] },
    { name: 'Mercredi', courses: [] },
    { name: 'Jeudi', courses: [] },
    { name: 'Vendredi', courses: [] }
  ]
  
  slots.forEach(slot => {
    const dayIndex = daysMap[slot.day]
    if (dayIndex !== undefined && dayIndex < 5) {
      week[dayIndex].courses.push({
        id: slot.id,
        time: `${slot.start_time?.substring(0, 5) || '08:00'}-${slot.end_time?.substring(0, 5) || '10:00'}`,
        name: slot.course_title || slot.module_code || 'Cours',
        code: slot.module_code || '',
        room: slot.room || 'Salle N/A',
        color: getActivityColor(slot.activity),
        type: slot.activity || 'Cours',
        class: slot.class_code
      })
    }
  })
  
  // Trier par heure
  week.forEach(day => {
    day.courses.sort((a, b) => a.time.localeCompare(b.time))
  })
  
  return week
}

function getActivityColor(activity) {
  const colors = {
    'Cours': '#3b82f6',
    'CM': '#3b82f6',
    'TP': '#10b981',
    'TD': '#f59e0b',
    'Examen': '#ef4444',
    'Atelier': '#8b5cf6'
  }
  return colors[activity] || '#e0e7ff'
}

/**
 * Convertit les cellules en format semaine
 */
function formatCellsToWeek(cells) {
  const daysMap = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 } // Lundi=1 -> index 0
  
  const week = [
    { name: 'Lundi', courses: [] },
    { name: 'Mardi', courses: [] },
    { name: 'Mercredi', courses: [] },
    { name: 'Jeudi', courses: [] },
    { name: 'Vendredi', courses: [] }
  ]
  
  cells.forEach(cell => {
    const dayIndex = daysMap[cell.day]
    if (dayIndex !== undefined && dayIndex < 5) {
      const timeSlot = cell.planning_time_slots
      const course = cell.courses
      
      week[dayIndex].courses.push({
        id: cell.id,
        time: timeSlot 
          ? `${timeSlot.start_time?.substring(0, 5)}-${timeSlot.end_time?.substring(0, 5)}`
          : '08:00-10:00',
        name: course?.name || 'Cours',
        code: course?.code || '',
        room: cell.room || 'Salle N/A',
        color: cell.color || '#e0e7ff'
      })
    }
  })
  
  // Trier les cours par heure
  week.forEach(day => {
    day.courses.sort((a, b) => a.time.localeCompare(b.time))
  })
  
  return week
}

/**
 * Génère une semaine vide
 */
function generateEmptyWeek() {
  return [
    { name: 'Lundi', courses: [] },
    { name: 'Mardi', courses: [] },
    { name: 'Mercredi', courses: [] },
    { name: 'Jeudi', courses: [] },
    { name: 'Vendredi', courses: [] }
  ]
}

/**
 * Récupère les modules où l'enseignant intervient
 * @param {array} courses - Liste des cours de l'enseignant
 */
export async function getMyModules(courses) {
  try {
    const moduleIds = [...new Set(courses.map(c => c.moduleId).filter(Boolean))]
    if (moduleIds.length === 0) return []
    
    const { data: modules, error } = await supabase
      .from('modules')
      .select('id, title, code, responsable, responsable_email, track_id, year, credits')
      .in('id', moduleIds)
    
    if (error) {
      console.error('❌ [getMyModules] Erreur:', error)
      return []
    }
    
    return modules || []
  } catch (error) {
    console.error('❌ [getMyModules] Erreur:', error)
    return []
  }
}

/**
 * Calcule les statistiques de l'enseignant
 */
export function calculateStats(courses, weekPlanning) {
  // Compter les heures totales
  const totalHours = courses.reduce((sum, c) => sum + (c.hours || 0), 0)
  
  // Compter les heures de la semaine
  let weeklyHours = 0
  weekPlanning.forEach(day => {
    day.courses.forEach(course => {
      // Estimer 2h par cours si pas de durée précise
      weeklyHours += 2
    })
  })
  
  // Trouver le prochain cours
  const now = new Date()
  const dayOfWeek = now.getDay() // 0=Dim, 1=Lun...
  const currentTime = now.toTimeString().substring(0, 5)
  
  let nextCourse = 'Aucun'
  
  // Parcourir les jours à partir d'aujourd'hui
  for (let i = 0; i < 5; i++) {
    const checkDay = (dayOfWeek + i - 1 + 7) % 7 // Convertir en index semaine (Lun=0)
    if (checkDay >= 0 && checkDay < 5) {
      const dayCourses = weekPlanning[checkDay]?.courses || []
      for (const course of dayCourses) {
        const courseTime = course.time.split('-')[0]
        if (i === 0 && courseTime > currentTime) {
          nextCourse = `Aujourd'hui ${courseTime}`
          break
        } else if (i > 0 && dayCourses.length > 0) {
          nextCourse = `${weekPlanning[checkDay].name} ${dayCourses[0].time.split('-')[0]}`
          break
        }
      }
      if (nextCourse !== 'Aucun') break
    }
  }
  
  // Compter les modules uniques
  const modulesCount = new Set(courses.map(c => c.moduleId).filter(Boolean)).size
  
  return {
    coursesCount: courses.length,
    totalHours,
    weeklyHours,
    nextCourse,
    modulesCount,
    studentsCount: modulesCount * 25 // Estimation
  }
}

/**
 * Charge toutes les données du dashboard enseignant
 */
export async function loadEnseignantDashboard(userId, userEmail, teacherName = null) {
  try {
    if (import.meta.env.DEV) console.log('🚀 [loadEnseignantDashboard] Chargement complet pour:', userEmail)
    
    // Charger cours, planning et séances à venir en parallèle
    const [courses, planningData, upcomingSessions] = await Promise.all([
      getMyCourses(userId, userEmail),
      getMyWeekPlanning(userId, userEmail, teacherName),
      getUpcomingSessions(userEmail, teacherName, 15)
    ])
    
    const weekPlanning = planningData.week || planningData
    const allSlots = planningData.allSlots || []
    
    // Charger les modules
    const modules = await getMyModules(courses)
    
    // Calculer les stats améliorées
    const stats = calculateStatsEnhanced(courses, weekPlanning, allSlots, upcomingSessions)
    
    const result = {
      courses,
      weekPlanning,
      modules,
      upcomingSessions,
      allSlots,
      stats
    }
    
    if (import.meta.env.DEV) console.log('✅ [loadEnseignantDashboard] Données chargées:', {
      coursesCount: courses.length,
      modulesCount: modules.length,
      upcomingCount: upcomingSessions.length,
      stats
    })
    
    return result
  } catch (error) {
    console.error('❌ [loadEnseignantDashboard] Erreur:', error)
    return {
      courses: [],
      weekPlanning: generateEmptyWeek(),
      modules: [],
      upcomingSessions: [],
      allSlots: [],
      stats: {
        coursesCount: 0,
        totalHours: 0,
        weeklyHours: 0,
        nextCourse: 'N/A',
        modulesCount: 0,
        studentsCount: 0,
        upcomingCount: 0
      }
    }
  }
}

/**
 * Calcule les stats améliorées avec les vraies données de planning
 */
function calculateStatsEnhanced(courses, weekPlanning, allSlots, upcomingSessions) {
  const totalHours = courses.reduce((sum, c) => sum + (c.hours || 0), 0)
  
  // Calculer les heures de la semaine depuis les vrais slots
  let weeklyHours = 0
  allSlots.forEach(slot => {
    if (slot.start_time && slot.end_time) {
      const [sh, sm] = slot.start_time.split(':').map(Number)
      const [eh, em] = slot.end_time.split(':').map(Number)
      weeklyHours += (eh + em/60) - (sh + sm/60)
    } else {
      weeklyHours += 2 // Estimation par défaut
    }
  })
  weeklyHours = Math.round(weeklyHours * 10) / 10
  
  // Trouver le prochain cours
  let nextCourse = 'Aucun'
  if (upcomingSessions.length > 0) {
    const next = upcomingSessions[0]
    nextCourse = `${next.day} ${next.time.split(' - ')[0]}`
  }
  
  // Compter les modules uniques
  const modulesCount = new Set(courses.map(c => c.moduleId).filter(Boolean)).size
  
  // Total heures à venir (prochaines séances)
  let upcomingHours = 0
  upcomingSessions.forEach(s => {
    const timeParts = s.time.split(' - ')
    if (timeParts.length === 2) {
      const [sh, sm] = timeParts[0].split(':').map(Number)
      const [eh, em] = timeParts[1].split(':').map(Number)
      upcomingHours += (eh + em/60) - (sh + sm/60)
    }
  })
  
  return {
    coursesCount: courses.length,
    totalHours,
    weeklyHours,
    nextCourse,
    modulesCount,
    studentsCount: modulesCount * 25,
    upcomingCount: upcomingSessions.length,
    upcomingHours: Math.round(upcomingHours * 10) / 10
  }
}
