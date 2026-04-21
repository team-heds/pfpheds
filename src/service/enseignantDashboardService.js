/**
 * Service Dashboard Enseignant
 * Récupère les données spécifiques à l'enseignant connecté depuis Supabase
 */
import { supabase } from '@/supabase'
import academicYearService from '@/service/academicYearService'

function normalizeTeacherValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function getSupabaseErrorText(error) {
  return [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function isMissingTeacherEmailColumn(error) {
  const text = getSupabaseErrorText(error)
  return text.includes('teacher_email') && (text.includes('does not exist') || text.includes('column'))
}

function normalizeModuleCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

function normalizeClassCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
}

function getClassCodeAliases(value) {
  const raw = normalizeClassCode(value)
  if (!raw) return []

  const aliases = new Set([raw])
  const normalized = raw.replace(/_/g, '-')
  aliases.add(normalized)

  const bacMatch = normalized.match(/^BAC(\d{2})(-.+)?$/)
  if (bacMatch) {
    aliases.add(`B${bacMatch[1]}${bacMatch[2] || ''}`)
  }

  const bMatch = normalized.match(/^B(\d{2})(-.+)?$/)
  if (bMatch) {
    aliases.add(`BAC${bMatch[1]}${bMatch[2] || ''}`)
  }

  return Array.from(aliases)
}

async function resolveActiveAcademicYearClassCodes() {
  try {
    const activeYear = await academicYearService.getActiveAcademicYear()
    if (!activeYear?.id) return null

    const classes = await academicYearService.getClassesByAcademicYear(activeYear.id)
    const classCodes = new Set(
      (classes || [])
        .flatMap(c => getClassCodeAliases(c?.code))
        .filter(Boolean)
    )

    return classCodes.size > 0 ? classCodes : null
  } catch (error) {
    console.warn('⚠️ [enseignantDashboardService] Impossible de charger les classes de l\'année active:', error)
    return null
  }
}

function slotInActiveYear(slot, activeYearClassCodes) {
  if (!(activeYearClassCodes instanceof Set) || activeYearClassCodes.size === 0) return true

  const slotClassCodes = []
  if (Array.isArray(slot?.class_codes)) slotClassCodes.push(...slot.class_codes)
  if (slot?.class_code) slotClassCodes.push(slot.class_code)

  if (slotClassCodes.length === 0) return false

  return slotClassCodes.some(code => {
    const aliases = getClassCodeAliases(code)
    return aliases.some(alias => activeYearClassCodes.has(alias))
  })
}

function getTeacherSearchTokens(userId, userEmail, teacherName = null) {
  const tokens = new Set()
  const normalizedUserId = normalizeTeacherValue(userId)
  const normalizedEmail = normalizeTeacherValue(userEmail)
  const normalizedName = normalizeTeacherValue(teacherName)

  if (normalizedUserId) {
    tokens.add(normalizedUserId)
  }

  if (normalizedEmail) {
    tokens.add(normalizedEmail)
    const emailPrefix = normalizedEmail.split('@')[0]
    if (emailPrefix) {
      tokens.add(emailPrefix)
      emailPrefix.split(/[^a-z0-9]+/).filter(Boolean).forEach(part => tokens.add(part))
    }
  }

  if (normalizedName) {
    tokens.add(normalizedName)
    normalizedName.split(/[^a-z0-9]+/).filter(Boolean).forEach(part => tokens.add(part))
  }

  return Array.from(tokens).filter(token => token.length >= 1)
}

function parseTeachersField(teachersField) {
  if (!teachersField) return []

  if (Array.isArray(teachersField)) {
    return teachersField
  }

  if (typeof teachersField === 'object') {
    return [teachersField]
  }

  if (typeof teachersField === 'string') {
    const raw = teachersField.trim()
    if (!raw) return []

    // cas JSON sérialisé
    if (raw.startsWith('[') || raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw)
        return Array.isArray(parsed) ? parsed : [parsed]
      } catch (_) {
        // fallback CSV en dessous
      }
    }

    // cas "Nom 1, Nom 2"
    return raw
      .split(/[;,|\n/]+/)
      .map(v => v.trim())
      .filter(Boolean)
  }

  return []
}

function getTeacherValuesFromSlot(slot) {
  const values = []
  const teachers = parseTeachersField(slot?.teachers || slot?.teachers_list)

  teachers.forEach(t => {
    if (!t) return
    if (typeof t === 'object') {
      Object.values(t).forEach(v => {
        if (typeof v === 'string' && v.trim()) values.push(v)
        if (typeof v === 'number') values.push(String(v))
      })
      return
    }
    values.push(t)
  })

  // fallback éventuel (si les colonnes n'existent pas, reste undefined)
  if (slot?.teacher_name) values.push(slot.teacher_name)
  if (slot?.teacher_email) values.push(slot.teacher_email)

  return values.filter(Boolean)
}

function isTeacherInSlot(slot, userEmail, teacherName = null) {
  const tokens = getTeacherSearchTokens(slot?.__targetUserId, userEmail, teacherName)
  if (!tokens.length) return false

  const teacherValues = getTeacherValuesFromSlot(slot)
  return teacherValues.some(value => {
    const normalizedValue = normalizeTeacherValue(value)
    if (!normalizedValue) return false
    return tokens.some(token => normalizedValue.includes(token))
  })
}

function getSlotDurationHours(slot) {
  const start = String(slot?.start_time || '').trim()
  const end = String(slot?.end_time || '').trim()
  if (!start || !end) return 0

  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  if ([sh, sm, eh, em].some(Number.isNaN)) return 0

  const diff = (eh + em / 60) - (sh + sm / 60)
  return diff > 0 ? diff : 0
}

/**
 * Récupère les cours assignés à l'enseignant via course_teachers
 * @param {string} userId - ID de l'enseignant
 * @param {string} userEmail - Email de l'enseignant (fallback)
 */
export async function getMyCourses(userId, userEmail, teacherName = null, activeYearClassCodes = null) {
  try {
    if (import.meta.env.DEV) console.log('📚 [getMyCourses] Chargement cours pour enseignant:', userId)

    if (!userId && !userEmail && !teacherName) {
      if (import.meta.env.DEV) console.log('ℹ️ [getMyCourses] Aucun identifiant enseignant fourni')
      return []
    }

    const buildAssignmentFilters = (includeTeacherEmail = true) => {
      const filters = []
      if (userId) filters.push(`teacher_id.eq.${userId}`)
      if (includeTeacherEmail && userEmail) filters.push(`teacher_email.eq.${userEmail}`)
      return filters
    }
    
    // Récupérer les assignations via course_teachers
    const runAssignmentQuery = async (includeTeacherEmail = true) => {
      const filters = buildAssignmentFilters(includeTeacherEmail)
      let assignmentQuery = supabase
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
              color,
              track_id,
              responsable,
              responsable_email
            )
          )
        `)

      if (filters.length) {
        assignmentQuery = assignmentQuery.or(filters.join(','))
      }

      return assignmentQuery
    }

    let { data: assignments, error: assignError } = await runAssignmentQuery(true)

    if (assignError && userEmail && isMissingTeacherEmailColumn(assignError)) {
      console.warn('⚠️ [getMyCourses] Colonne teacher_email absente, retry via teacher_id uniquement')
      const retry = await runAssignmentQuery(false)
      assignments = retry.data
      assignError = retry.error
    }

    let courses = []
    if (assignError) {
      console.error('❌ [getMyCourses] Erreur relation assignments, fallback simple:', assignError)
      courses = await getMyCoursesSimple(userId, userEmail)
    } else {
      courses = (assignments || [])
        .filter(a => a.courses)
        .map(a => ({
          id: a.courses.id,
          name: a.courses.name,
          code: a.courses.code,
          moduleId: a.courses.module_id,
          moduleName: a.courses.modules?.title || 'Module inconnu',
          moduleCode: a.courses.modules?.code || '',
          moduleColor: a.courses.modules?.color || null,
          type: a.courses.type || 'CM',
          hours: a.hours || a.courses.hours || 0,
          color: a.courses.color || '#3b82f6',
          role: a.role || 'Enseignant',
          trackId: a.courses.modules?.track_id || null,
          canOpenDetails: true
        }))
    }

    const planningCourses = await getMyCoursesFromPlanning(userId, userEmail, teacherName, activeYearClassCodes)
    const merged = new Map()

    ;[...courses, ...planningCourses].forEach(course => {
      const key = course.id || `${course.code || ''}::${course.name || ''}`
      if (!merged.has(key)) {
        merged.set(key, course)
      }
    })
    
    const mergedCourses = Array.from(merged.values())

    if (import.meta.env.DEV) console.log('✅ [getMyCourses] Cours trouvés:', mergedCourses.length)
    return mergedCourses
  } catch (error) {
    console.error('❌ [getMyCourses] Erreur:', error)
    return []
  }
}

async function getMyCoursesFromPlanning(userId, userEmail, teacherName = null, activeYearClassCodes = null) {
  try {
    if (!userId && !userEmail && !teacherName) return []

    const slots = []
    const pageSize = 1000
    let from = 0
    let hasMore = true

    while (hasMore) {
      const to = from + pageSize - 1
      const { data, error } = await supabase
        .from('planning_time_slots')
        .select('*')
        .range(from, to)

      if (error) {
        console.error('❌ [getMyCoursesFromPlanning] Erreur chargement slots:', error)
        return []
      }

      const page = data || []
      slots.push(...page)

      if (page.length < pageSize) {
        hasMore = false
      } else {
        from += pageSize
      }
    }

    if (!slots.length) return []

    const teacherSlots = slots.filter(slot => {
      if (!slotInActiveYear(slot, activeYearClassCodes)) return false
      return isTeacherInSlot({ ...slot, __targetUserId: userId }, userEmail, teacherName)
    })
    if (!teacherSlots.length) return []

    const hoursByCourseKey = new Map()
    teacherSlots.forEach(slot => {
      const linkedKey = slot.course_id || `${slot.module_code || ''}::${slot.course_title || ''}`
      if (!linkedKey) return
      const duration = getSlotDurationHours(slot)
      hoursByCourseKey.set(linkedKey, (hoursByCourseKey.get(linkedKey) || 0) + duration)
    })

    const courseIds = [...new Set(teacherSlots.map(s => s.course_id).filter(Boolean))]
    const moduleCodesRaw = teacherSlots
      .map(s => s.module_code)
      .filter(Boolean)
    const moduleCodes = [...new Set(moduleCodesRaw.map(normalizeModuleCode).filter(Boolean))]
    let coursesById = new Map()
    let modulesByCode = new Map()

    if (courseIds.length) {
      const { data: coursesData } = await supabase
        .from('courses')
        .select(`
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
            color,
            track_id
          )
        `)
        .in('id', courseIds)

      coursesById = new Map((coursesData || []).map(c => [c.id, c]))
    }

    if (moduleCodes.length) {
      const { data: modulesData } = await supabase
        .from('modules')
        .select('id, title, code, color, track_id')
        .in('code', moduleCodes)

      modulesByCode = new Map((modulesData || []).map(m => [normalizeModuleCode(m.code), m]))
    }

    const planningCoursesMap = new Map()

    teacherSlots.forEach(slot => {
      const linkedCourse = slot.course_id ? coursesById.get(slot.course_id) : null
      const moduleFromCode = slot.module_code ? modulesByCode.get(normalizeModuleCode(slot.module_code)) : null
      if (linkedCourse?.id) {
        const plannedHours = Math.round((hoursByCourseKey.get(linkedCourse.id) || 0) * 10) / 10
        planningCoursesMap.set(linkedCourse.id, {
          id: linkedCourse.id,
          name: linkedCourse.name,
          code: linkedCourse.code,
          moduleId: linkedCourse.module_id,
          moduleName: linkedCourse.modules?.title || moduleFromCode?.title || (slot.module_code ? `Module ${slot.module_code}` : 'Module planning'),
          moduleCode: linkedCourse.modules?.code || moduleFromCode?.code || slot.module_code || '',
          moduleColor: linkedCourse.modules?.color || moduleFromCode?.color || null,
          type: linkedCourse.type || slot.activity || 'CM',
          hours: plannedHours || linkedCourse.hours || 0,
          color: linkedCourse.color || '#3b82f6',
          role: 'Enseignant',
          trackId: linkedCourse.modules?.track_id || moduleFromCode?.track_id || null,
          canOpenDetails: true
        })
        return
      }

      const fallbackKey = `${slot.module_code || ''}::${slot.course_title || ''}`
      if (!planningCoursesMap.has(fallbackKey)) {
        const plannedHours = Math.round((hoursByCourseKey.get(fallbackKey) || 0) * 10) / 10
        planningCoursesMap.set(fallbackKey, {
          id: null,
          name: slot.course_title || slot.module_code || 'Cours',
          code: slot.module_code || '',
          moduleId: moduleFromCode?.id || null,
          moduleName: moduleFromCode?.title || (slot.module_code ? `Module ${slot.module_code}` : 'Module planning'),
          moduleCode: moduleFromCode?.code || slot.module_code || '',
          moduleColor: moduleFromCode?.color || null,
          type: slot.activity || 'Cours',
          hours: plannedHours,
          color: '#3b82f6',
          role: 'Planning',
          trackId: moduleFromCode?.track_id || null,
          canOpenDetails: false
        })
      }
    })

    return Array.from(planningCoursesMap.values())
  } catch (error) {
    console.error('❌ [getMyCoursesFromPlanning] Erreur:', error)
    return []
  }
}

/**
 * Fallback simplifié pour récupérer les cours
 */
async function getMyCoursesSimple(userId, userEmail) {
  try {
    const runSimpleQuery = async (includeTeacherEmail = true) => {
      const filters = []
      if (userId) filters.push(`teacher_id.eq.${userId}`)
      if (includeTeacherEmail && userEmail) filters.push(`teacher_email.eq.${userEmail}`)
      if (!filters.length) return { data: [], error: null }

      return supabase
        .from('course_teachers')
        .select('course_id, hours, role')
        .or(filters.join(','))
    }

    let { data, error } = await runSimpleQuery(true)

    if (error && userEmail && isMissingTeacherEmailColumn(error)) {
      console.warn('⚠️ [getMyCoursesSimple] Colonne teacher_email absente, retry via teacher_id uniquement')
      const retry = await runSimpleQuery(false)
      data = retry.data
      error = retry.error
    }
    
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
      role: 'Enseignant',
      canOpenDetails: true
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
export async function getMyWeekPlanning(userId, userEmail, teacherName = null, activeYearClassCodes = null) {
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
      if (!slotInActiveYear(slot, activeYearClassCodes)) return false
      return isTeacherInSlot(slot, userEmail, teacherName)
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
export async function getUpcomingSessions(userEmail, teacherName = null, limit = 10, activeYearClassCodes = null) {
  try {
    if (import.meta.env.DEV) console.log('📆 [getUpcomingSessions] Chargement séances à venir pour:', userEmail)

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
      if (!slotInActiveYear(slot, activeYearClassCodes)) return false
      return isTeacherInSlot(slot, userEmail, teacherName)
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
    const moduleCodes = [...new Set(courses.map(c => normalizeModuleCode(c.moduleCode)).filter(Boolean))]
    if (moduleIds.length === 0 && moduleCodes.length === 0) return []

    const [byIdRes, byCodeRes] = await Promise.all([
      moduleIds.length
        ? supabase
          .from('modules')
          .select('id, title, code, color, responsable, responsable_email, track_id, year, credits')
          .in('id', moduleIds)
        : Promise.resolve({ data: [], error: null }),
      moduleCodes.length
        ? supabase
          .from('modules')
          .select('id, title, code, color, responsable, responsable_email, track_id, year, credits')
          .in('code', moduleCodes)
        : Promise.resolve({ data: [], error: null })
    ])

    if (byIdRes.error) {
      console.error('❌ [getMyModules] Erreur query id:', byIdRes.error)
    }
    if (byCodeRes.error) {
      console.error('❌ [getMyModules] Erreur query code:', byCodeRes.error)
    }

    const merged = [...(byIdRes.data || []), ...(byCodeRes.data || [])]
    const uniqueById = new Map(merged.map(m => [m.id, m]))
    return Array.from(uniqueById.values())
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
    day.courses.forEach(() => {
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

    const activeYearClassCodes = await resolveActiveAcademicYearClassCodes()
    
    // Charger cours, planning et séances à venir en parallèle
    const [courses, planningData, upcomingSessions] = await Promise.all([
      getMyCourses(userId, userEmail, teacherName, activeYearClassCodes),
      getMyWeekPlanning(userId, userEmail, teacherName, activeYearClassCodes),
      getUpcomingSessions(userEmail, teacherName, 15, activeYearClassCodes)
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
