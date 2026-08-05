/**
 * Service pour récupérer les KPI académiques (RM & Enseignant) depuis Supabase
 * TABLES RÉELLES: modules, courses, course_teachers, planning_cells
 */
import { supabase } from '@/supabase'
import apiClient from './apiClient'

/**
 * Récupère les modules d'un responsable module
 * Table: modules (responsable_email)
 */
export async function getRMModules(userId, userEmail) {
  try {
    if (import.meta.env.DEV) console.log('📚 [getRMModules] Requête modules pour RM:', userEmail || userId)
    
    // Utiliser responsable_email car responsable_id n'existe pas
    const { data: modules, error } = await supabase
      .from('modules')
      .select('*')
      .eq('responsable_email', userEmail)
    
    if (error) {
      console.error('❌ [getRMModules] Erreur Supabase:', error)
      return []
    }
    
    if (import.meta.env.DEV) console.log('✅ [getRMModules] Modules trouvés:', modules?.length || 0)
    return modules || []
  } catch (error) {
    console.error('❌ [getRMModules] Erreur:', error)
    return []
  }
}

/**
 * Récupère les statistiques RM
 */
export async function getRMStats(userId, userEmail) {
  try {
    if (import.meta.env.DEV) console.log('📊 [getRMStats] Calcul stats RM pour:', userEmail || userId)
    
    const modules = await getRMModules(userId, userEmail)
    
    // Calculer les statistiques
    let totalHours = 0
    let teachersSet = new Set()
    let studentsCount = 0
    
    modules.forEach(module => {
      totalHours += module.hours || 0
      
      // Compter les enseignants uniques
      if (module.teachers && Array.isArray(module.teachers)) {
        module.teachers.forEach(teacherId => teachersSet.add(teacherId))
      }
      
      // Compter les étudiants
      studentsCount += module.studentsCount || 0
    })
    
    const stats = {
      modulesCount: modules.length,
      teachersCount: teachersSet.size,
      totalHours,
      studentsCount
    }
    
    if (import.meta.env.DEV) console.log('✅ [getRMStats] Stats calculées:', stats)
    return stats
  } catch (error) {
    console.error('❌ [getRMStats] Erreur:', error)
    return {
      modulesCount: 0,
      teachersCount: 0,
      totalHours: 0,
      studentsCount: 0
    }
  }
}

/**
 * Récupère les enseignants d'un RM avec leurs heures
 * Table: course_teachers (relation cours-enseignants)
 */
export async function getRMTeachers(userId, userEmail) {
  try {
    if (import.meta.env.DEV) console.log('👨‍🏫 [getRMTeachers] Requête enseignants pour RM:', userEmail || userId)
    
    // Récupérer les cours des modules du RM
    const modules = await getRMModules(userId, userEmail)
    if (modules.length === 0) return []
    
    const moduleIds = modules.map(m => m.id)
    
    // Récupérer les cours de ces modules
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('id, module_id')
      .in('module_id', moduleIds)
    
    if (coursesError || !courses) return []
    
    const courseIds = courses.map(c => c.id)
    if (courseIds.length === 0) return []
    
    // Récupérer les assignations enseignant-cours
    const { data: assignments, error: assignError } = await supabase
      .from('course_teachers')
      .select(`
        teacher_id,
        hours,
        role,
        user_profiles!inner(user_id, display_name, forname, family_name, email)
      `)
      .in('course_id', courseIds)
    
    if (assignError) {
      console.error('❌ [getRMTeachers] Erreur Supabase:', assignError)
      return []
    }
    
    // Grouper par enseignant et calculer les heures totales
    const teachersMap = new Map()
    
    assignments?.forEach(assign => {
      const teacherId = assign.teacher_id
      if (!teachersMap.has(teacherId)) {
        teachersMap.set(teacherId, {
          id: teacherId,
          name: assign.user_profiles.display_name || 
                `${assign.user_profiles.forname} ${assign.user_profiles.family_name}`,
          email: assign.user_profiles.email,
          hours: 0
        })
      }
      teachersMap.get(teacherId).hours += assign.hours || 0
    })
    
    const teachers = Array.from(teachersMap.values())
    if (import.meta.env.DEV) console.log('✅ [getRMTeachers] Enseignants trouvés:', teachers.length)
    return teachers
  } catch (error) {
    console.error('❌ [getRMTeachers] Erreur:', error)
    return []
  }
}

/**
 * Récupère les cours d'un enseignant
 * Table: courses (via course_teachers)
 */
export async function getTeacherCourses(userId) {
  try {
    if (import.meta.env.DEV) console.log('📖 [getTeacherCourses] Requête cours pour enseignant:', userId)
    
    // Récupérer les assignations de l'enseignant
    const { data: assignments, error: assignError } = await supabase
      .from('course_teachers')
      .select('course_id, hours, role')
      .eq('teacher_id', userId)
    
    if (assignError || !assignments || assignments.length === 0) {
      if (import.meta.env.DEV) console.log('⚠️ [getTeacherCourses] Aucune assignation trouvée')
      return []
    }
    
    const courseIds = assignments.map(a => a.course_id)
    
    // Récupérer les détails des cours
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .in('id', courseIds)
    
    if (error) {
      console.error('❌ [getTeacherCourses] Erreur Supabase:', error)
      return []
    }
    
    if (import.meta.env.DEV) console.log('✅ [getTeacherCourses] Cours trouvés:', courses?.length || 0)
    return courses || []
  } catch (error) {
    console.error('❌ [getTeacherCourses] Erreur:', error)
    return []
  }
}

/**
 * Récupère les statistiques enseignant
 */
export async function getTeacherStats(userId) {
  try {
    if (import.meta.env.DEV) console.log('📊 [getTeacherStats] Calcul stats enseignant pour:', userId)
    
    const courses = await getTeacherCourses(userId)
    
    // Calculer les statistiques
    let weeklyHours = 0
    let studentsCount = 0
    let nextCourse = 'N/A'
    
    courses.forEach(course => {
      weeklyHours += course.weeklyHours || 0
      studentsCount += course.studentsCount || 0
    })
    
    // TODO: Calculer le prochain cours depuis le planning
    nextCourse = 'Lundi 08:00'
    
    const stats = {
      coursesCount: courses.length,
      weeklyHours,
      nextCourse,
      studentsCount
    }
    
    if (import.meta.env.DEV) console.log('✅ [getTeacherStats] Stats calculées:', stats)
    return stats
  } catch (error) {
    console.error('❌ [getTeacherStats] Erreur:', error)
    return {
      coursesCount: 0,
      weeklyHours: 0,
      nextCourse: 'N/A',
      studentsCount: 0
    }
  }
}

/**
 * Récupère le planning hebdomadaire d'un enseignant
 * Table: planning_cells (avec planning_time_slots)
 */
export async function getTeacherWeekSchedule(userId) {
  try {
    if (import.meta.env.DEV) console.log('📅 [getTeacherWeekSchedule] Requête planning pour:', userId)
    
    // Récupérer toutes les cellules de planning de l'enseignant
    const { data: cells, error } = await supabase
      .from('planning_cells')
      .select(`
        *,
        planning_time_slots(start_time, end_time),
        courses(name, code)
      `)
      .eq('teacher_id', userId)
      .order('day', { ascending: true })
    
    if (error) {
      console.error('❌ [getTeacherWeekSchedule] Erreur Supabase:', error)
      return generateEmptyWeek()
    }
    
    if (!cells || cells.length === 0) {
      if (import.meta.env.DEV) console.log('⚠️ [getTeacherWeekSchedule] Aucun planning trouvé')
      return generateEmptyWeek()
    }
    
    // Convertir les cellules en format semaine
    const weekData = formatPlanningCellsToWeek(cells)
    
    if (import.meta.env.DEV) console.log('✅ [getTeacherWeekSchedule] Planning trouvé')
    return weekData
  } catch (error) {
    console.error('❌ [getTeacherWeekSchedule] Erreur:', error)
    return generateEmptyWeek()
  }
}

/**
 * Convertit les planning_cells en format semaine
 */
function formatPlanningCellsToWeek(cells) {
  const daysMap = {
    1: 'Lundi',
    2: 'Mardi',
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi',
    7: 'Dimanche'
  }
  
  const week = [
    { name: 'Lundi', courses: [] },
    { name: 'Mardi', courses: [] },
    { name: 'Mercredi', courses: [] },
    { name: 'Jeudi', courses: [] },
    { name: 'Vendredi', courses: [] }
  ]
  
  cells.forEach(cell => {
    const dayName = daysMap[cell.day] || 'Lundi'
    const dayIndex = week.findIndex(d => d.name === dayName)
    
    if (dayIndex !== -1 && cell.planning_time_slots && cell.courses) {
      week[dayIndex].courses.push({
        id: cell.course_id || cell.id,
        time: `${cell.planning_time_slots.start_time}-${cell.planning_time_slots.end_time}`,
        name: cell.courses.name || 'Cours',
        room: cell.room || 'N/A',
        color: cell.color || '#3b82f620'
      })
    }
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
 * Récupère tous les enseignants SI (Soins Infirmiers)
 * Table: user_profiles (via role ou permissions)
 */
export async function getSITeachers() {
  try {
    const response = await apiClient.get('/audiences/si-teachers')
    const teachers = Array.isArray(response.data?.data) ? response.data.data : []
    if (import.meta.env.DEV) console.log('✅ [getSITeachers] Enseignants SI trouvés:', teachers.length)
    return teachers
  } catch (error) {
    console.error('❌ [getSITeachers] Erreur:', error)
    return []
  }
}

/**
 * Récupère toutes les stats RM d'un coup
 */
export async function getAllRMData(userId, userEmail) {
  try {
    if (import.meta.env.DEV) console.log('🚀 [getAllRMData] Chargement complet données RM pour:', userEmail || userId)
    
    const [stats, modules, teachers, siTeachers] = await Promise.all([
      getRMStats(userId, userEmail),
      getRMModules(userId, userEmail),
      getRMTeachers(userId, userEmail),
      getSITeachers()
    ])
    
    const result = {
      stats,
      modules,
      teachers, // Enseignants liés aux modules du RM
      siTeachers // Tous les enseignants SI
    }
    
    if (import.meta.env.DEV) console.log('✅ [getAllRMData] Données RM chargées:', result)
    return result
  } catch (error) {
    console.error('❌ [getAllRMData] Erreur:', error)
    return {
      stats: {
        modulesCount: 0,
        teachersCount: 0,
        totalHours: 0,
        studentsCount: 0
      },
      modules: [],
      teachers: [],
      siTeachers: []
    }
  }
}

/**
 * Récupère toutes les stats enseignant d'un coup
 */
export async function getAllTeacherData(userId) {
  try {
    if (import.meta.env.DEV) console.log('🚀 [getAllTeacherData] Chargement complet données enseignant...')
    
    const [stats, courses, weekSchedule] = await Promise.all([
      getTeacherStats(userId),
      getTeacherCourses(userId),
      getTeacherWeekSchedule(userId)
    ])
    
    const result = {
      stats,
      courses,
      weekSchedule
    }
    
    if (import.meta.env.DEV) console.log('✅ [getAllTeacherData] Données enseignant chargées:', result)
    return result
  } catch (error) {
    console.error('❌ [getAllTeacherData] Erreur:', error)
    return {
      stats: {
        coursesCount: 0,
        weeklyHours: 0,
        nextCourse: 'N/A',
        studentsCount: 0
      },
      courses: [],
      weekSchedule: generateEmptyWeek()
    }
  }
}
