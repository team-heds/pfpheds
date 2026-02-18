/**
 * Service pour le Dashboard RM
 * Récupère les modules du RM connecté avec leurs cours et enseignants
 */
import { supabase } from '@/supabase'

/**
 * Récupère les modules dont l'utilisateur est responsable
 * @param {string} userId - ID de l'utilisateur
 * @param {string} userEmail - Email de l'utilisateur
 */
export async function getMyModules(userId, userEmail) {
  try {
    if (import.meta.env.DEV) console.log('📚 [rmDashboardService] Chargement modules pour RM:', userEmail)
    
    const { data, error } = await supabase
      .from('modules')
      .select(`
        id,
        number,
        title,
        year,
        credits,
        heures_contact,
        responsable,
        responsable_email,
        coordinateur,
        track_id,
        description,
        created_at
      `)
      .or(`responsable_email.eq.${userEmail},coordinateur.ilike.%${userEmail}%`)
      .order('number')
    
    if (error) {
      console.error('❌ [rmDashboardService] Erreur:', error)
      return []
    }
    
    if (import.meta.env.DEV) console.log('✅ [rmDashboardService] Modules trouvés:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ [rmDashboardService] Erreur getMyModules:', error)
    return []
  }
}

/**
 * Récupère les cours d'un module avec leurs enseignants
 * @param {string} moduleId - ID du module
 */
export async function getModuleCourses(moduleId) {
  try {
    if (import.meta.env.DEV) console.log('📖 [rmDashboardService] Chargement cours pour module:', moduleId)
    
    const { data, error } = await supabase
      .from('courses')
      .select(`
        id,
        title,
        code,
        hours,
        type,
        module_id,
        course_teachers(
          id,
          hours,
          teacher_id,
          user_profiles(
            user_id,
            email,
            forname,
            family_name,
            display_name
          )
        )
      `)
      .eq('module_id', moduleId)
      .order('code')
    
    if (error) {
      console.error('❌ [rmDashboardService] Erreur cours:', error)
      return []
    }
    
    // Formater les données
    const courses = (data || []).map(course => ({
      ...course,
      teachers: (course.course_teachers || []).map(ct => ({
        id: ct.teacher_id,
        hours: ct.hours,
        name: ct.user_profiles?.display_name || 
              `${ct.user_profiles?.forname || ''} ${ct.user_profiles?.family_name || ''}`.trim() ||
              ct.user_profiles?.email || 'Inconnu',
        email: ct.user_profiles?.email
      }))
    }))
    
    if (import.meta.env.DEV) console.log('✅ [rmDashboardService] Cours trouvés:', courses.length)
    return courses
  } catch (error) {
    console.error('❌ [rmDashboardService] Erreur getModuleCourses:', error)
    return []
  }
}

/**
 * Récupère tous les enseignants intervenant dans les modules du RM
 * @param {Array} modules - Objets modules complets (avec id et code)
 */
export async function getModulesTeachers(modules) {
  try {
    if (!modules || modules.length === 0) return []
    
    if (import.meta.env.DEV) console.log('👥 [rmDashboardService] Chargement enseignants pour modules:', modules.length)
    
    // Récupérer les cours via course_teachers directement avec les codes de modules
    // La table courses utilise des UUID, on va chercher via course_teachers
    const moduleCodes = modules.map(m => m.code).filter(Boolean)
    
    if (moduleCodes.length === 0) {
      if (import.meta.env.DEV) console.log('ℹ️ [rmDashboardService] Aucun code de module disponible')
      return []
    }
    
    // Récupérer les enseignants directement via course_teachers avec jointure
    const { data, error } = await supabase
      .from('course_teachers')
      .select(`
        teacher_id,
        hours,
        course_id,
        courses!inner(
          id,
          title,
          module_id
        ),
        user_profiles(
          user_id,
          email,
          forname,
          family_name,
          display_name,
          avatar_url
        )
      `)
    
    if (error) {
      console.warn('⚠️ [rmDashboardService] Erreur course_teachers:', error.message)
      return []
    }
    
    if (!data?.length) {
      if (import.meta.env.DEV) console.log('ℹ️ [rmDashboardService] Aucun enseignant trouvé')
      return []
    }
    
    // Grouper par enseignant
    const teachersMap = new Map()
    
    ;(data || []).forEach(ct => {
      const teacherId = ct.teacher_id
      if (!teachersMap.has(teacherId)) {
        teachersMap.set(teacherId, {
          id: teacherId,
          name: ct.user_profiles?.display_name || 
                `${ct.user_profiles?.forname || ''} ${ct.user_profiles?.family_name || ''}`.trim() ||
                'Inconnu',
          email: ct.user_profiles?.email,
          avatar: ct.user_profiles?.avatar_url,
          totalHours: 0,
          modules: new Set(),
          courses: []
        })
      }
      
      const teacher = teachersMap.get(teacherId)
      teacher.totalHours += ct.hours || 0
      teacher.modules.add(ct.courses?.module_id)
      teacher.courses.push({
        courseId: ct.course_id,
        courseName: ct.courses?.title,
        hours: ct.hours
      })
    })
    
    // Convertir en array
    const teachers = Array.from(teachersMap.values()).map(t => ({
      ...t,
      modulesCount: t.modules.size,
      modules: undefined
    }))
    
    if (import.meta.env.DEV) console.log('✅ [rmDashboardService] Enseignants trouvés:', teachers.length)
    return teachers.sort((a, b) => b.totalHours - a.totalHours)
  } catch (error) {
    console.error('❌ [rmDashboardService] Erreur getModulesTeachers:', error)
    return []
  }
}

/**
 * Récupère le planning des modules du RM
 * @param {string[]} moduleIds - IDs des modules
 */
export async function getModulesPlanning(moduleIds) {
  try {
    if (!moduleIds || moduleIds.length === 0) return []
    
    if (import.meta.env.DEV) console.log('📅 [rmDashboardService] Chargement planning pour modules:', moduleIds.length)
    
    // Vérifier si la table planning_cells existe
    const { data, error } = await supabase
      .from('planning_cells')
      .select(`
        id,
        date,
        start_time,
        end_time,
        room,
        status,
        course_id,
        courses(
          id,
          title,
          module_id,
          modules(number, title)
        )
      `)
      .in('courses.module_id', moduleIds)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date')
      .order('start_time')
      .limit(20)
    
    if (error) {
      console.warn('⚠️ [rmDashboardService] Planning non disponible:', error.message)
      return []
    }
    
    if (import.meta.env.DEV) console.log('✅ [rmDashboardService] Séances planning trouvées:', data?.length || 0)
    return data || []
  } catch (error) {
    console.error('❌ [rmDashboardService] Erreur getModulesPlanning:', error)
    return []
  }
}

/**
 * Récupère les statistiques globales des modules du RM
 * @param {Object[]} modules - Liste des modules
 * @param {Object[]} teachers - Liste des enseignants
 */
export function calculateStats(modules, teachers) {
  const stats = {
    modulesCount: modules.length,
    teachersCount: teachers.length,
    totalHours: 0,
    hoursByYear: { 1: 0, 2: 0, 3: 0 },
    modulesByYear: { 1: 0, 2: 0, 3: 0 }
  }
  
  modules.forEach(m => {
    stats.totalHours += m.heures_contact || 0
    const year = m.year || 1
    stats.hoursByYear[year] = (stats.hoursByYear[year] || 0) + (m.heures_contact || 0)
    stats.modulesByYear[year] = (stats.modulesByYear[year] || 0) + 1
  })
  
  return stats
}

export default {
  getMyModules,
  getModuleCourses,
  getModulesTeachers,
  getModulesPlanning,
  calculateStats
}
