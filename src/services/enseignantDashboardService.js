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
    console.log('📚 [getMyCourses] Chargement cours pour enseignant:', userId)
    
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
    
    console.log('✅ [getMyCourses] Cours trouvés:', courses.length)
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
 * Récupère le planning hebdomadaire de l'enseignant
 * @param {string} userId - ID de l'enseignant
 */
export async function getMyWeekPlanning(userId, userEmail) {
  try {
    console.log('📅 [getMyWeekPlanning] Chargement planning pour:', userId)
    
    // Récupérer les cellules de planning
    const { data: cells, error } = await supabase
      .from('planning_cells')
      .select(`
        id,
        day,
        time_slot_id,
        course_id,
        room,
        color,
        planning_time_slots (
          start_time,
          end_time
        ),
        courses (
          name,
          code
        )
      `)
      .or(`teacher_id.eq.${userId},teacher_email.eq.${userEmail}`)
      .order('day', { ascending: true })
    
    if (error) {
      console.warn('⚠️ [getMyWeekPlanning] Erreur:', error)
      return generateEmptyWeek()
    }
    
    if (!cells || cells.length === 0) {
      console.log('ℹ️ [getMyWeekPlanning] Aucun planning trouvé')
      return generateEmptyWeek()
    }
    
    // Convertir en format semaine
    return formatCellsToWeek(cells)
  } catch (error) {
    console.error('❌ [getMyWeekPlanning] Erreur:', error)
    return generateEmptyWeek()
  }
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
export async function loadEnseignantDashboard(userId, userEmail) {
  try {
    console.log('🚀 [loadEnseignantDashboard] Chargement complet pour:', userEmail)
    
    // Charger cours et planning en parallèle
    const [courses, weekPlanning] = await Promise.all([
      getMyCourses(userId, userEmail),
      getMyWeekPlanning(userId, userEmail)
    ])
    
    // Charger les modules
    const modules = await getMyModules(courses)
    
    // Calculer les stats
    const stats = calculateStats(courses, weekPlanning)
    
    const result = {
      courses,
      weekPlanning,
      modules,
      stats
    }
    
    console.log('✅ [loadEnseignantDashboard] Données chargées:', {
      coursesCount: courses.length,
      modulesCount: modules.length,
      stats
    })
    
    return result
  } catch (error) {
    console.error('❌ [loadEnseignantDashboard] Erreur:', error)
    return {
      courses: [],
      weekPlanning: generateEmptyWeek(),
      modules: [],
      stats: {
        coursesCount: 0,
        totalHours: 0,
        weeklyHours: 0,
        nextCourse: 'N/A',
        modulesCount: 0,
        studentsCount: 0
      }
    }
  }
}
