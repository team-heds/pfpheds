import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import { useModuleHelpers } from './useModuleHelpers'

export function useModuleTeachers(toast, moduleRef, modulePlanningRef) {
  const { normalizeClass, getSlotHours } = useModuleHelpers()

  const normalizeTeacherName = (name) => String(name || '').trim().toLowerCase()

  const getSlotTeacherNames = (slot) => {
    const slotTeachers = slot?.teachers_list || slot?.teachers || []
    const names = Array.isArray(slotTeachers)
      ? slotTeachers
          .map(t => (typeof t === 'object' ? t?.name : t))
          .map(name => String(name || '').trim())
          .filter(Boolean)
      : []

    const unique = []
    const seen = new Set()
    names.forEach(name => {
      const normalized = normalizeTeacherName(name)
      if (!normalized || seen.has(normalized)) return
      seen.add(normalized)
      unique.push(name)
    })

    return unique
  }

  const getTeacherHoursShareForSlot = (slot, teacherName) => {
    const slotHours = getSlotHours(slot)
    if (slotHours <= 0) return 0

    const teacherNames = getSlotTeacherNames(slot)
    if (teacherNames.length === 0) return 0

    const target = normalizeTeacherName(teacherName)
    const includesTeacher = teacherNames.some(name => normalizeTeacherName(name) === target)
    if (!includesTeacher) return 0

    return slotHours / teacherNames.length
  }

  // Enseignants du module
  const moduleTeachers = ref([])
  const showAddTeacherDialog = ref(false)
  const newTeacher = ref({ name: '', email: '', hours: 0 })

  // Filtres par classe
  const classFilter = ref(null)
  const loadingGlobalTeachers = ref(false)
  const globalTeachers = ref([])
  const selectedTeacher = ref(null)
  const showTeacherDetailsDialog = ref(false)

  // Variables pour les enseignants (recherche)
  const teachers = ref([])
  const filteredTeachers = ref([])

  // Enseignants avec statistiques d'heures depuis le planning
  const teachersWithStats = computed(() => {
    const teachersMap = new Map()

    // D'abord ajouter les enseignants de moduleTeachers (priorité)
    moduleTeachers.value.forEach(teacher => {
      if (teacher.name) {
        const normalizedName = teacher.name.toLowerCase()
        teachersMap.set(normalizedName, {
          ...teacher,
          planningHours: 0,
          sessionsCount: 0,
          source: teacher.source || 'module'
        })
      }
    })

    // Ensuite ajouter les enseignants du planning qui ne sont pas déjà dans moduleTeachers
    modulePlanningRef.value.forEach(slot => {
      const slotTeachers = getSlotTeacherNames(slot)
      slotTeachers.forEach(t => {
        const name = typeof t === 'object' ? t.name : t
        if (name) {
          const normalizedName = name.toLowerCase()
          if (!teachersMap.has(normalizedName)) {
            teachersMap.set(normalizedName, {
              id: Date.now() + Math.random(),
              name: name,
              email: '',
              hours: 0,
              source: 'planning',
              planningHours: 0,
              sessionsCount: 0
            })
          }
        }
      })
    })

    // Maintenant calculer les heures pour tous les enseignants uniques
    teachersMap.forEach(teacher => {
      let planningHours = 0
      let sessionsCount = 0
      let hasValidHours = false

      modulePlanningRef.value.forEach(slot => {
        const teacherNames = getSlotTeacherNames(slot)

        if (teacherNames.some(name => name?.toLowerCase() === teacher.name.toLowerCase())) {
          sessionsCount++
          const slotHours = getTeacherHoursShareForSlot(slot, teacher.name)

          if (teacher.source === 'manual' && slotHours > 0) {
            planningHours += slotHours
            hasValidHours = true
          } else if (teacher.source !== 'manual') {
            planningHours += slotHours
            hasValidHours = true
          }
        }
      })

      let finalHours = planningHours
      if (teacher.source === 'manual' && !hasValidHours) {
        finalHours = NaN
      }

      teacher.planningHours = hasValidHours ? Math.round(finalHours * 10) / 10 : NaN
      teacher.sessionsCount = sessionsCount
    })

    return Array.from(teachersMap.values()).sort((a, b) => {
      if (isNaN(a.planningHours) && !isNaN(b.planningHours)) return 1
      if (!isNaN(a.planningHours) && isNaN(b.planningHours)) return -1
      return b.planningHours - a.planningHours
    })
  })

  // Liste filtrée des enseignants (avec filtre automatique >0h ou NaN)
  const filteredTeachersList = computed(() => {
    let result = teachersWithStats.value

    if (classFilter.value) {
      const normalizedFilter = normalizeClass(classFilter.value)

      const filteredPlanningSlots = modulePlanningRef.value.filter(slot => {
        const classCodes = slot.class_codes && slot.class_codes.length > 0
          ? slot.class_codes
          : (slot.class_code ? [slot.class_code] : [])

        return classCodes.some(classCode => normalizeClass(classCode) === normalizedFilter)
      })

      const teacherNames = new Set()
      filteredPlanningSlots.forEach(slot => {
        const slotTeachers = slot.teachers_list || slot.teachers || []
        slotTeachers.forEach(t => {
          const name = typeof t === 'object' ? t.name : t
          if (name && name.trim()) teacherNames.add(name.trim())
        })
      })

      result = teachersWithStats.value.filter(teacher => teacherNames.has(teacher.name))
    }

    let filtered = result.filter(teacher => {
      const hours = teacher.planningHours
      if (teacher.source === 'manual') return true
      return hours > 0 || isNaN(hours) || hours === null || hours === undefined
    })

    return filtered.sort((a, b) => b.planningHours - a.planningHours)
  })

  // Total des heures filtrées
  const totalFilteredHours = computed(() => {
    return Math.round(filteredTeachersList.value.reduce((sum, teacher) => sum + (teacher.planningHours || 0), 0) * 10) / 10
  })

  // Charger les enseignants (adapté de ModulePlanningView)
  const loadTeachers = async () => {
    try {
      const { data: teacherData } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, forname, family_name, email')
        .in('role', ['EnseignantSoins', 'EnseignantPhysio', 'AdminSoins', 'AdminPhysio'])

      if (teacherData && teacherData.length > 0) {
        teachers.value = teacherData.map(t => ({
          id: t.user_id,
          name: t.display_name || `${t.forname} ${t.family_name}`,
          email: t.email
        }))
      }
    } catch (error) {
      console.error('Erreur chargement enseignants:', error)
    }
  }

  // Fonction de recherche d'enseignants pour l'autocomplétion
  const searchTeachers = (event) => {
    const query = event.query.toLowerCase().trim()
    if (!query) {
      filteredTeachers.value = []
      return
    }

    const allTeachers = [...teachers.value, ...moduleTeachers.value]
    const uniqueTeachers = []
    const seenNames = new Set()

    allTeachers.forEach(teacher => {
      const normalizedName = teacher.name.toLowerCase()
      if (!seenNames.has(normalizedName)) {
        seenNames.add(normalizedName)
        uniqueTeachers.push(teacher)
      }
    })

    const matchingTeachers = uniqueTeachers.filter(teacher =>
      teacher.name.toLowerCase().includes(query) ||
      (teacher.email && teacher.email.toLowerCase().includes(query))
    )

    const exactMatch = uniqueTeachers.find(teacher =>
      teacher.name.toLowerCase() === query
    )

    if (!exactMatch && query.length > 2) {
      const newT = { name: event.query, isNew: true, email: '', source: 'manual' }
      filteredTeachers.value = [newT, ...matchingTeachers]
    } else {
      filteredTeachers.value = matchingTeachers
    }
  }

  // Charger les enseignants du module (course_teachers + planning)
  const loadModuleTeachers = async () => {
    if (!moduleRef.value?.code) return

    try {
      const teachersMap = new Map()

      // 1. Récupérer les enseignants via course_teachers
      const { data, error } = await supabase
        .from('course_teachers')
        .select(`
          teacher_id,
          hours,
          user_profiles(
            user_id,
            email,
            forname,
            family_name,
            display_name,
            avatar_url
          )
        `)

      if (!error && data) {
        data.forEach(ct => {
          const id = ct.teacher_id
          if (!teachersMap.has(id)) {
            teachersMap.set(id, {
              id,
              name: ct.user_profiles?.display_name ||
                    `${ct.user_profiles?.forname || ''} ${ct.user_profiles?.family_name || ''}`.trim() || 'Inconnu',
              email: ct.user_profiles?.email || '',
              avatar: ct.user_profiles?.avatar_url,
              hours: 0,
              source: 'course_teachers'
            })
          }
          teachersMap.get(id).hours += ct.hours || 0
        })
      }

      // 2. Ajouter les enseignants du planning (tableau teachers)
      if (modulePlanningRef.value.length > 0) {
        const planningTeachers = new Set()
        modulePlanningRef.value.forEach(slot => {
          const slotTeachers = slot.teachers_list || slot.teachers || []
          if (Array.isArray(slotTeachers)) {
            slotTeachers.forEach(t => {
              const name = typeof t === 'object' ? t.name : t
              if (name && name.trim()) planningTeachers.add(name.trim())
            })
          }
        })

        planningTeachers.forEach(teacherName => {
          const exists = Array.from(teachersMap.values()).some(t =>
            t.name.toLowerCase() === teacherName.toLowerCase()
          )
          if (!exists) {
            const id = `planning_${teacherName.replace(/\s+/g, '_')}`
            teachersMap.set(id, {
              id,
              name: teacherName,
              email: '',
              avatar: null,
              hours: 0,
              source: 'planning'
            })
          }
        })
      }

      // 3. Charger tous les enseignants disponibles depuis la DB
      const { data: allTeachers, error: teachersError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, forname, family_name, email')
        .in('role', ['EnseignantSoins', 'EnseignantPhysio', 'AdminSoins', 'AdminPhysio'])

      if (!teachersError && allTeachers) {
        allTeachers.forEach(teacher => {
          const teacherName = teacher.display_name || `${teacher.forname || ''} ${teacher.family_name || ''}`.trim()
          if (teacherName) {
            const exists = Array.from(teachersMap.values()).some(t =>
              t.name.toLowerCase() === teacherName.toLowerCase()
            )
            if (!exists) {
              teachersMap.set(teacher.user_id, {
                id: teacher.user_id,
                name: teacherName,
                email: teacher.email || '',
                avatar: null,
                hours: 0,
                source: 'database'
              })
            }
          }
        })
      }

      moduleTeachers.value = Array.from(teachersMap.values())
      console.log('👥 Enseignants chargés:', moduleTeachers.value.length, '(course_teachers + planning + database)')
    } catch (error) {
      console.error('Erreur enseignants:', error)
      moduleTeachers.value = []
    }
  }

  // Charger les enseignants globaux (tous les modules)
  const loadGlobalTeachers = async () => {
    loadingGlobalTeachers.value = true
    try {
      const { data: allPlanning, error: planningError } = await supabase
        .from('planning_time_slots')
        .select('module_code, teachers, class_code, start_time, end_time')
        .not('teachers', 'is', null)
        .not('teachers', 'eq', '[]')

      if (planningError) throw planningError

      const tMap = new Map()

      allPlanning?.forEach(slot => {
        const slotTeachers = getSlotTeacherNames(slot)
        const share = slotTeachers.length > 0 ? (getSlotHours(slot) / slotTeachers.length) : 0
        slotTeachers.forEach(teacher => {
          const teacherName = typeof teacher === 'object' ? teacher.name : teacher
          if (!teacherName) return

          if (!tMap.has(teacherName)) {
            tMap.set(teacherName, {
              name: teacherName,
              email: '',
              planningHours: 0,
              sessionsCount: 0,
              modules: new Set()
            })
          }

          const teacherData = tMap.get(teacherName)
          teacherData.planningHours += share
          teacherData.sessionsCount += 1
          teacherData.modules.add({ module_code: slot.module_code, class_code: slot.class_code })
        })
      })

      globalTeachers.value = Array.from(tMap.values()).map(teacher => ({
        ...teacher,
        modules: Array.from(teacher.modules),
        planningHours: Math.round(teacher.planningHours * 10) / 10
      }))
    } catch (error) {
      console.error('Erreur chargement enseignants globaux:', error)
      globalTeachers.value = []
    } finally {
      loadingGlobalTeachers.value = false
    }
  }

  // Obtenir les séances d'un enseignant
  const getTeacherSessions = (teacherName) => {
    return modulePlanningRef.value.filter(slot => {
      const slotTeachers = slot.teachers_list || slot.teachers || []
      const teacherNames = slotTeachers.map(t => typeof t === 'object' ? t.name : t)
      return teacherNames.some(name => name?.toLowerCase() === teacherName?.toLowerCase())
    }).sort((a, b) => {
      if (a.week_number !== b.week_number) return a.week_number - b.week_number
      const dayOrder = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche']
      return dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
    })
  }

  // Obtenir les séances groupées d'un enseignant
  const getTeacherGroupedSessions = (teacherName) => {
    const sessions = getTeacherSessions(teacherName)
    const groupedByWeek = {}

    sessions.forEach(session => {
      const weekKey = `Semaine ${session.week_number}`
      if (!groupedByWeek[weekKey]) {
        groupedByWeek[weekKey] = {
          week_number: session.week_number,
          sessions: [],
          totalHours: 0,
          classes: new Set()
        }
      }

      groupedByWeek[weekKey].sessions.push(session)
      groupedByWeek[weekKey].totalHours += getSlotHours(session)

      const classCodes = session.class_codes && session.class_codes.length > 0
        ? session.class_codes
        : (session.class_code ? [session.class_code] : [])

      classCodes.forEach(classCode => {
        if (classCode) groupedByWeek[weekKey].classes.add(classCode)
      })
    })

    return Object.values(groupedByWeek)
      .map(week => ({
        ...week,
        classes: Array.from(week.classes),
        totalHours: Math.round(week.totalHours * 10) / 10
      }))
      .sort((a, b) => a.week_number - b.week_number)
  }

  // Afficher les détails d'un enseignant
  const showTeacherDetails = (teacher) => {
    selectedTeacher.value = teacher
    showTeacherDetailsDialog.value = true
  }

  // Ajouter un enseignant
  const addTeacher = async () => {
    if (!newTeacher.value.name || !newTeacher.value.email) {
      toast.add({ severity: 'warn', summary: 'Attention', detail: 'Veuillez remplir tous les champs', life: 3000 })
      return
    }

    try {
      const existingTeacher = moduleTeachers.value.find(t =>
        t.name.toLowerCase() === newTeacher.value.name.toLowerCase() ||
        t.email?.toLowerCase() === newTeacher.value.email.toLowerCase()
      )

      if (existingTeacher) {
        toast.add({ severity: 'warn', summary: 'Attention', detail: 'Cet enseignant existe déjà dans ce module', life: 3000 })
        return
      }

      const { data: teacherData, error: teacherError } = await supabase
        .from('user_profiles')
        .select('user_id')
        .eq('email', newTeacher.value.email)
        .single()

      let teacherId
      if (teacherError || !teacherData) {
        teacherId = Date.now()
        console.log('Création enseignant temporaire sans profil user_profiles:', newTeacher.value.name)
      } else {
        teacherId = teacherData.user_id
      }

      const { error: courseTeacherError } = await supabase
        .from('course_teachers')
        .insert({
          course_code: moduleRef.value?.code,
          teacher_id: teacherId,
          hours: newTeacher.value.hours || 0
        })

      if (courseTeacherError) throw courseTeacherError

      moduleTeachers.value.push({
        ...newTeacher.value,
        id: teacherId,
        source: 'course_teachers'
      })

      newTeacher.value = { name: '', email: '', hours: 0 }
      showAddTeacherDialog.value = false

      toast.add({ severity: 'success', summary: 'Succès', detail: 'Enseignant ajouté et sauvegardé', life: 3000 })
    } catch (error) {
      console.error('Erreur ajout enseignant:', error)
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible d\'ajouter l\'enseignant', life: 3000 })
    }
  }

  // Retirer un enseignant
  const removeTeacher = async (teacher) => {
    if (confirm(`Retirer ${teacher.name} de ce module ?`)) {
      try {
        if (teacher.source === 'course_teachers' && typeof teacher.id === 'number') {
          const { error } = await supabase
            .from('course_teachers')
            .delete()
            .eq('course_code', moduleRef.value?.code)
            .eq('teacher_id', teacher.id)

          if (error) console.warn('Erreur suppression DB:', error)
        }

        moduleTeachers.value = moduleTeachers.value.filter(t => t.id !== teacher.id)
        toast.add({ severity: 'success', summary: 'Succès', detail: 'Enseignant retiré', life: 3000 })
      } catch (error) {
        console.error('Erreur suppression enseignant:', error)
        toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de retirer l\'enseignant', life: 3000 })
      }
    }
  }

  return {
    moduleTeachers,
    showAddTeacherDialog,
    newTeacher,
    classFilter,
    loadingGlobalTeachers,
    globalTeachers,
    selectedTeacher,
    showTeacherDetailsDialog,
    teachers,
    filteredTeachers,
    teachersWithStats,
    filteredTeachersList,
    totalFilteredHours,
    loadTeachers,
    searchTeachers,
    loadModuleTeachers,
    loadGlobalTeachers,
    getTeacherSessions,
    getTeacherGroupedSessions,
    showTeacherDetails,
    addTeacher,
    removeTeacher,
  }
}
