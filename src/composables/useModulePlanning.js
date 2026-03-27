import { ref, computed } from 'vue'
import { supabase } from '@/supabase'
import { useModuleHelpers } from './useModuleHelpers'

export function useModulePlanning(toast, moduleRef, moduleTeachersRef) {
  const {
    normalizeClass, getSlotHours, formatTeachersArray, formatDay,
    getClassColor, getClassDisplayColor, getDateFromWeekAndDay,
    formatDateForDisplay
  } = useModuleHelpers()

  // Planning du module
  const modulePlanning = ref([])
  const loadingPlanning = ref(false)
  const selectedClass = ref(null)
  const planningView = ref('list') // 'list' ou 'calendar'

  // Variables pour l'édition de séance
  const showDialog = ref(false)
  const editingSession = ref(null)
  const saving = ref(false)

  // Classes chargées dynamiquement depuis la DB
  const dbClassCodes = ref([])

  // Classes disponibles dans le planning (pour n'afficher que les boutons pertinents)
  const availableClasses = computed(() => {
    const classesSet = new Set()
    modulePlanning.value.forEach(slot => {
      if (slot.class_code) {
        const normalized = normalizeClass(slot.class_code)
        classesSet.add(normalized)
        const match = normalized.match(/^(BAC\d{2})(-TP|-PA)?/)
        if (match) {
          const base = match[1]
          const suffix = match[2]
          if (suffix) {
            classesSet.add(`${base}${suffix}`)
          } else {
            classesSet.add(base)
          }
        }
      }
    })
    return Array.from(classesSet).sort()
  })

  // Toutes les classes possibles (dynamiques depuis la DB + ce qui existe dans le planning)
  const allClassOptions = computed(() => {
    const allCodes = new Set(dbClassCodes.value)
    availableClasses.value.forEach(c => allCodes.add(c))
    return Array.from(allCodes).sort()
  })

  // Planning filtré par classe (comparaison normalisée)
  const filteredPlanning = computed(() => {
    if (!selectedClass.value) return []
    const normalizedFilter = normalizeClass(selectedClass.value)

    return modulePlanning.value.filter(slot => {
      const classCodes = slot.class_codes && slot.class_codes.length > 0
        ? slot.class_codes
        : (slot.class_code ? [slot.class_code] : [])

      return classCodes.some(classCode => {
        return normalizeClass(classCode) === normalizedFilter
      })
    })
  })

  // Total des heures planifiées
  const totalPlanningHours = computed(() => {
    return Math.round(modulePlanning.value.reduce((sum, slot) => sum + getSlotHours(slot), 0) * 10) / 10
  })

  // Détecter les conflits horaires (même prof planifié 2x au même moment)
  const planningConflicts = computed(() => {
    const conflicts = []
    const slots = modulePlanning.value

    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const slotA = slots[i]
        const slotB = slots[j]

        if (slotA.week_number !== slotB.week_number || slotA.day !== slotB.day) continue

        const startA = slotA.start_time || '00:00'
        const endA = slotA.end_time || '23:59'
        const startB = slotB.start_time || '00:00'
        const endB = slotB.end_time || '23:59'

        const overlap = startA < endB && startB < endA
        if (!overlap) continue

        const teachersA = (slotA.teachers_list || slotA.teachers || []).map(t =>
          (typeof t === 'object' ? t.name : t)?.toLowerCase()
        ).filter(Boolean)
        const teachersB = (slotB.teachers_list || slotB.teachers || []).map(t =>
          (typeof t === 'object' ? t.name : t)?.toLowerCase()
        ).filter(Boolean)

        const commonTeachers = teachersA.filter(t => teachersB.includes(t))

        if (commonTeachers.length > 0) {
          conflicts.push({
            teacher: commonTeachers[0],
            week: slotA.week_number,
            day: formatDay(slotA.day),
            slotA: {
              time: `${slotA.start_time?.substring(0,5)} - ${slotA.end_time?.substring(0,5)}`,
              class: normalizeClass(slotA.class_code)
            },
            slotB: {
              time: `${slotB.start_time?.substring(0,5)} - ${slotB.end_time?.substring(0,5)}`,
              class: normalizeClass(slotB.class_code)
            }
          })
        }
      }
    }

    return conflicts
  })

  // Semaines pour la vue calendrier
  const calendarWeeks = computed(() => {
    const weeks = new Map()
    filteredPlanning.value.forEach(slot => {
      if (!weeks.has(slot.week_number)) {
        weeks.set(slot.week_number, {
          number: slot.week_number,
          dateRange: (() => {
            if (!slot.date) return ''
            try {
              const date = new Date(slot.date)
              const day = date.getDay()
              const monday = new Date(date)
              monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
              const friday = new Date(monday)
              friday.setDate(monday.getDate() + 4)
              return `${monday.toLocaleDateString('fr-CH')} - ${friday.toLocaleDateString('fr-CH')}`
            } catch { return '' }
          })()
        })
      }
    })
    return Array.from(weeks.values()).sort((a, b) => a.number - b.number)
  })

  // Obtenir les créneaux d'un jour spécifique
  const getDaySlots = (weekNumber, day) => {
    return filteredPlanning.value
      .filter(slot => slot.week_number === weekNumber && slot.day?.toLowerCase() === day.toLowerCase())
      .sort((a, b) => (a.start_time || '').localeCompare(b.start_time || ''))
  }

  // Données groupées par semaine et jour pour un meilleur affichage
  const groupedPlanningData = computed(() => {
    if (!filteredPlanning.value.length) return []

    const grouped = []
    let currentWeek = null
    let currentDay = null
    let weekGroup = null
    let dayGroup = null

    // Trier par semaine académique (38-53 puis 1-37)
    const sortedPlanning = [...filteredPlanning.value].sort((a, b) => {
      const getAcademicOrder = (w) => (w >= 38 ? w - 38 : w + 16);
      const orderA = getAcademicOrder(a.week_number);
      const orderB = getAcademicOrder(b.week_number);

      if (orderA !== orderB) return orderA - orderB;

      const dayOrder = { 'lundi': 0, 'mardi': 1, 'mercredi': 2, 'jeudi': 3, 'vendredi': 4, 'samedi': 5, 'dimanche': 6, 'distance': 7 };
      const dayA = dayOrder[a.day?.toLowerCase()] ?? 8;
      const dayB = dayOrder[b.day?.toLowerCase()] ?? 8;

      if (dayA !== dayB) return dayA - dayB;

      return (a.start_time || '').localeCompare(b.start_time || '');
    });

    sortedPlanning.forEach((slot) => {
      const weekNum = slot.week_number
      const dayName = slot.day

      if (weekNum !== currentWeek) {
        currentWeek = weekNum
        weekGroup = { weekNumber: weekNum, days: [], weekSpan: 0 }
        grouped.push(weekGroup)
        currentDay = null
      }

      if (dayName !== currentDay) {
        currentDay = dayName
        dayGroup = { dayName: dayName, slots: [], daySpan: 0 }
        weekGroup.days.push(dayGroup)
      }

      dayGroup.slots.push(slot)
      weekGroup.weekSpan++
      dayGroup.daySpan++
    })

    return grouped
  })

  // Données plates pour DataTable avec rowSpan (sans lignes d'ajout)
  const flatPlanningData = computed(() => {
    const flat = []
    groupedPlanningData.value.forEach(weekGroup => {
      weekGroup.days.forEach((dayGroup, dayIndex) => {
        dayGroup.slots.forEach((slot, slotIndex) => {
          flat.push({
            ...slot,
            weekSpan: dayIndex === 0 ? weekGroup.weekSpan : 0,
            daySpan: slotIndex === 0 ? dayGroup.daySpan : 0,
            isFirstSlotOfWeek: dayIndex === 0 && slotIndex === 0,
            isFirstSlotOfDay: slotIndex === 0
          })
        })
      })
    })
    return flat
  })

  // Style des lignes pour grouper par semaine et jour
  const rowClass = (data) => {
    const classes = [];
    classes.push(data.week_number % 2 === 0 ? 'week-even' : 'week-odd');
    if (data.isFirstSlotOfWeek) {
      classes.push('new-week-row');
    } else if (data.isFirstSlotOfDay) {
      classes.push('new-day-row');
    } else {
      classes.push('same-day-row');
    }
    return classes;
  };

  // Options pour les formulaires (dynamiques depuis allClassOptions)
  const classOptions = computed(() => {
    return allClassOptions.value.map(code => {
      const suffix = code.endsWith('-PA') ? ' (Passerelle)' :
                     code.endsWith('-TP') ? ' (Temps partiel)' :
                     code.endsWith('-EE') ? ' (En emploi)' : ''
      return { label: `${code}${suffix}`, value: code }
    })
  })

  const dayOptions = [
    { label: 'Lundi', value: 'lundi' },
    { label: 'Mardi', value: 'mardi' },
    { label: 'Mercredi', value: 'mercredi' },
    { label: 'Jeudi', value: 'jeudi' },
    { label: 'Vendredi', value: 'vendredi' }
  ]

  const activityOptions = ['Cours', 'Cours Asynchrone', 'Examen']

  // Charger le planning du module depuis planning_time_slots
  const loadModulePlanning = async () => {
    if (!moduleRef.value?.code) return

    loadingPlanning.value = true
    try {
      const { data, error } = await supabase
        .from('planning_time_slots')
        .select('*')
        .eq('module_code', moduleRef.value.code)
        .order('week_number', { ascending: true })
        .order('day_index', { ascending: true })
        .order('start_time', { ascending: true })

      if (error) {
        console.warn('Erreur chargement planning:', error)
        modulePlanning.value = []
        return
      }

      modulePlanning.value = (data || []).map(slot => ({
        ...slot,
        teacher_name: formatTeachersArray(slot.teachers),
        teachers_list: slot.teachers || []
      }))
      console.log('📅 Planning chargé:', modulePlanning.value.length, 'séances')
    } catch (error) {
      console.error('Erreur planning:', error)
      modulePlanning.value = []
    } finally {
      loadingPlanning.value = false
    }
  }

  // Charger les codes de classes depuis l'année académique active
  const loadDbClassCodes = async (academicYearService) => {
    try {
      const activeYear = await academicYearService.getActiveAcademicYear()
      if (!activeYear) return
      const classes = await academicYearService.getClassesByAcademicYear(activeYear.id)
      if (classes && classes.length > 0) {
        dbClassCodes.value = classes.map(c => {
          const code = c.code
          return code.match(/^B\d/) ? 'BAC' + code.substring(1) : code.toUpperCase()
        })
      }
    } catch (error) {
      console.warn('Impossible de charger les classes depuis la DB:', error)
    }
  }

  // Éditer une séance
  const editSession = (session) => {
    const normalizedTeachers = []
    if (session.teacher_name) {
      const teacherNames = session.teacher_name.split(',').map(name => name.trim()).filter(name => name)
      normalizedTeachers.push(...teacherNames.map(name => ({ name })))
    } else if (session.teachers_list && Array.isArray(session.teachers_list)) {
      session.teachers_list.forEach(t => {
        if (typeof t === 'string') {
          normalizedTeachers.push({ name: t })
        } else if (t && t.name) {
          normalizedTeachers.push({ name: t.name })
        }
      })
    }

    editingSession.value = {
      id: session.id,
      classCodes: session.class_codes && session.class_codes.length > 0
        ? session.class_codes
        : (session.class_code ? [session.class_code] : []),
      periods: session.periods || 2,
      weekNumber: session.week_number,
      day: session.day?.toLowerCase(),
      startTime: session.start_time,
      endTime: session.end_time,
      moduleCode: moduleRef.value?.code,
      courseTitle: session.course_title || '',
      activity: session.activity || 'Cours',
      teachers: normalizedTeachers,
      room: session.room,
      notes: session.notes || ''
    }
    showDialog.value = true
  }

  // Ajouter une séance à une semaine
  const addSessionToWeek = (weekNumber) => {
    editingSession.value = {
      id: null,
      classCodes: selectedClass.value ? [selectedClass.value] : [],
      periods: 2,
      weekNumber: weekNumber,
      day: 'lundi',
      startTime: '09:00',
      endTime: '11:00',
      moduleCode: moduleRef.value?.code,
      courseTitle: '',
      activity: 'Cours',
      teachers: [],
      room: '',
      notes: ''
    }
    showDialog.value = true
  }

  // Fonction pour toggle une classe dans la sélection multiple
  const toggleClass = (classCode) => {
    if (!editingSession.value) return

    const index = editingSession.value.classCodes.indexOf(classCode)
    const newClassCodes = [...editingSession.value.classCodes]

    if (index > -1) {
      newClassCodes.splice(index, 1)
      if (classCode && !classCode.includes('-tp')) {
        const tpVariant = `${classCode}-tp`
        const tpIndex = newClassCodes.indexOf(tpVariant)
        if (tpIndex > -1) newClassCodes.splice(tpIndex, 1)
      }
      if (classCode && classCode.includes('-tp')) {
        const baseClass = classCode.replace('-tp', '')
        const baseIndex = newClassCodes.indexOf(baseClass)
        if (baseIndex > -1) newClassCodes.splice(baseIndex, 1)
      }
    } else {
      newClassCodes.push(classCode)
    }

    editingSession.value.classCodes = newClassCodes
  }

  // Sauvegarder la séance
  const saveSession = async () => {
    if (!editingSession.value) return

    if (!editingSession.value.classCodes || editingSession.value.classCodes.length === 0) {
      toast.add({
        severity: 'warn',
        summary: 'Attention',
        detail: 'Veuillez sélectionner au moins une classe',
        life: 3000
      })
      return
    }

    const scrollPosition = window.scrollY || document.documentElement.scrollTop

    saving.value = true
    try {
      const normalizedTeachers = []
      const newTeachers = []

      const teachersArray = Array.isArray(editingSession.value.teachers)
        ? editingSession.value.teachers
        : (editingSession.value.teachers ? [editingSession.value.teachers] : [])

      teachersArray.forEach(t => {
        const teacherName = typeof t === 'object' && t !== null ? t.name : t
        normalizedTeachers.push(teacherName)
        if (typeof t === 'object' && t.isNew) {
          newTeachers.push({ name: teacherName, email: t.email || '', hours: 0, source: 'manual' })
        }
      })

      // Enregistrer les nouveaux enseignants dans la liste du module
      if (newTeachers.length > 0 && moduleTeachersRef) {
        for (const nt of newTeachers) {
          const exists = moduleTeachersRef.value.some(t =>
            t.name.toLowerCase() === nt.name.toLowerCase()
          )
          if (!exists) {
            moduleTeachersRef.value.push({
              id: Date.now() + Math.random(),
              name: nt.name,
              email: nt.email || '',
              hours: 0,
              source: 'manual'
            })
          }
        }
      }

      const isAsync = editingSession.value.activity === 'Cours Asynchrone'

      const sessionData = {
        class_codes: editingSession.value.classCodes,
        class_code: editingSession.value.classCodes[0],
        is_async: isAsync,
        module_code: moduleRef.value?.code,
        course_title: editingSession.value.courseTitle,
        activity: editingSession.value.activity,
        teachers: normalizedTeachers,
        room: editingSession.value.room,
        notes: editingSession.value.notes
      }

      const dayIndexMap = {
        'lundi': 0, 'mardi': 1, 'mercredi': 2, 'jeudi': 3,
        'vendredi': 4, 'samedi': 5, 'dimanche': 6, 'distance': 6
      }

      if (isAsync) {
        sessionData.periods = editingSession.value.periods || 2
        sessionData.week_number = editingSession.value.weekNumber || 1
        sessionData.day = 'distance'
        sessionData.day_index = 6
        sessionData.date = null
        sessionData.start_time = null
        sessionData.end_time = null
      } else {
        sessionData.week_number = editingSession.value.weekNumber
        sessionData.day = editingSession.value.day
        sessionData.day_index = dayIndexMap[editingSession.value.day?.toLowerCase()] || 0
        sessionData.date = getDateFromWeekAndDay(editingSession.value.weekNumber, editingSession.value.day)
        sessionData.start_time = editingSession.value.startTime
        sessionData.end_time = editingSession.value.endTime
        sessionData.periods = null
      }

      if (editingSession.value.id) {
        const { error } = await supabase
          .from('planning_time_slots')
          .update(sessionData)
          .eq('id', editingSession.value.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('planning_time_slots')
          .insert([sessionData])
        if (error) throw error
      }

      const classCount = editingSession.value.classCodes.length
      const weekNum = editingSession.value.weekNumber
      toast.add({
        severity: 'success',
        summary: 'Succès',
        detail: `Séance semaine ${weekNum} enregistrée pour ${classCount} classe${classCount > 1 ? 's' : ''}`,
        life: 2000
      })
      showDialog.value = false
      await loadModulePlanning()

      setTimeout(() => {
        const element = document.getElementById(`week-${weekNum}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else {
          window.scrollTo({ top: scrollPosition, behavior: 'smooth' })
        }
      }, 100)
    } catch (error) {
      console.error('Erreur save:', error)
      toast.add({ severity: 'error', summary: 'Erreur', detail: error.message, life: 3000 })
    } finally {
      saving.value = false
    }
  }

  // Supprimer la séance en cours de modification
  const deleteCurrentSession = async () => {
    if (!editingSession.value?.id) return

    try {
      const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer cette séance ?\n\n${editingSession.value.course_title || 'Sans titre'}\n${editingSession.value.day} ${editingSession.value.startTime}-${editingSession.value.endTime}\n\nCette action est irréversible.`)
      if (!confirmed) return

      const { error } = await supabase
        .from('planning_time_slots')
        .delete()
        .eq('id', editingSession.value.id)

      if (error) throw error

      toast.add({ severity: 'success', summary: 'Séance supprimée', detail: 'La séance a été supprimée avec succès', life: 3000 })
      showDialog.value = false
      await loadModulePlanning()
    } catch (error) {
      console.error('Erreur suppression séance:', error)
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer la séance', life: 3000 })
    }
  }

  // Supprimer une séance
  const deleteSession = async (session) => {
    if (!session?.id) return

    try {
      const confirmed = confirm(`Êtes-vous sûr de vouloir supprimer cette séance ?\n\n${session.course_title || 'Sans titre'}\n${session.day} ${session.start_time}-${session.end_time}\n\nCette action est irréversible.`)
      if (!confirmed) return

      const { error } = await supabase
        .from('planning_time_slots')
        .delete()
        .eq('id', session.id)

      if (error) throw error

      const weekNum = session.week_number
      toast.add({ severity: 'success', summary: 'Séance supprimée', detail: `La séance de la semaine ${weekNum} a été supprimée`, life: 3000 })
      await loadModulePlanning()

      setTimeout(() => {
        const element = document.getElementById(`week-${weekNum}`)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
    } catch (error) {
      console.error('Erreur suppression séance:', error)
      toast.add({ severity: 'error', summary: 'Erreur', detail: 'Impossible de supprimer la séance', life: 3000 })
    }
  }

  // Export du planning en Excel avec feuilles par classe
  const exportPlanningToExcel = async () => {
    if (filteredPlanning.value.length === 0) return

    const XLSX = await import('xlsx')
    const wb = XLSX.utils.book_new()

    const colWidths = [
      { wch: 10 }, { wch: 12 }, { wch: 12 }, { wch: 8 }, { wch: 8 },
      { wch: 25 }, { wch: 12 }, { wch: 22 }, { wch: 12 }, { wch: 15 }, { wch: 30 }
    ]

    const byClass = new Map()
    filteredPlanning.value.forEach(slot => {
      const nc = normalizeClass(slot.class_code) || 'Sans classe'
      if (!byClass.has(nc)) byClass.set(nc, [])
      byClass.get(nc).push(slot)
    })

    if (selectedClass.value || byClass.size === 1) {
      const data = filteredPlanning.value.map(slot => ({
        'Semaine': slot.week_number || '',
        'Jour': formatDay(slot.day),
        'Date': slot.date || '',
        'Début': slot.start_time?.substring(0,5) || '',
        'Fin': slot.end_time?.substring(0,5) || '',
        'Cours': slot.course_title || moduleRef.value?.title || '',
        'Type': slot.activity || slot.activity_type || 'Cours',
        'Enseignant': slot.teacher_name || '',
        'Classe': normalizeClass(slot.class_code),
        'Salle': slot.room || '',
        'Commentaire': slot.comment || slot.notes || ''
      }))

      const ws = XLSX.utils.json_to_sheet(data)
      ws['!cols'] = colWidths
      const sheetName = normalizeClass(selectedClass.value) || 'Planning'
      XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31))
    } else {
      const sortedClasses = Array.from(byClass.keys()).sort()
      sortedClasses.forEach(classCode => {
        const slots = byClass.get(classCode)
        const data = slots.map(slot => ({
          'Semaine': slot.week_number || '',
          'Jour': formatDay(slot.day),
          'Date': slot.date || '',
          'Début': slot.start_time?.substring(0,5) || '',
          'Fin': slot.end_time?.substring(0,5) || '',
          'Cours': slot.course_title || moduleRef.value?.title || '',
          'Type': slot.activity || slot.activity_type || 'Cours',
          'Enseignant': slot.teacher_name || '',
          'Classe': classCode,
          'Salle': slot.room || '',
          'Commentaire': slot.comment || slot.notes || ''
        }))

        const ws = XLSX.utils.json_to_sheet(data)
        ws['!cols'] = colWidths

        const color = getClassColor(classCode)
        const range = XLSX.utils.decode_range(ws['!ref'])
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const addr = XLSX.utils.encode_cell({ r: 0, c: C })
          if (!ws[addr]) continue
          ws[addr].s = { fill: { fgColor: { rgb: color } }, font: { bold: true } }
        }

        XLSX.utils.book_append_sheet(wb, ws, classCode.substring(0, 31))
      })

      const summaryData = sortedClasses.map(classCode => ({
        'Classe': classCode,
        'Nb Séances': byClass.get(classCode).length,
        'Couleur': getClassColor(classCode) === 'FFFFFF' ? 'Blanc' : 'Voir onglet'
      }))
      const summaryWs = XLSX.utils.json_to_sheet(summaryData)
      summaryWs['!cols'] = [{ wch: 15 }, { wch: 12 }, { wch: 15 }]
      XLSX.utils.book_append_sheet(wb, summaryWs, 'Récapitulatif')
    }

    const moduleCode = moduleRef.value?.code || 'module'
    const classLabel = normalizeClass(selectedClass.value) || 'all'
    XLSX.writeFile(wb, `Planning_${moduleCode}_${classLabel}.xlsx`)

    toast.add({
      severity: 'success',
      summary: 'Export réussi',
      detail: `${filteredPlanning.value.length} séances exportées (${byClass.size} classe${byClass.size > 1 ? 's' : ''})`,
      life: 3000
    })
  }

  // Export du planning en PDF
  const exportPlanningToPDF = async () => {
    if (filteredPlanning.value.length === 0) return

    const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
      import('jspdf'),
      import('jspdf-autotable')
    ])
    const doc = new jsPDF('landscape')

    doc.setFontSize(18)
    doc.text(`Planning - ${moduleRef.value?.title || 'Module'}`, 14, 20)

    doc.setFontSize(11)
    doc.setTextColor(100)
    doc.text(`Code: ${moduleRef.value?.code || ''} | Classe: ${selectedClass.value || 'Toutes'}`, 14, 28)
    doc.text(`Total: ${filteredPlanning.value.length} séances | ${totalPlanningHours.value}h planifiées`, 14, 34)
    doc.setTextColor(0)

    const tableData = filteredPlanning.value.map(slot => [
      `S${slot.week_number}`,
      formatDay(slot.day),
      slot.date || '',
      `${slot.start_time?.substring(0,5) || ''} - ${slot.end_time?.substring(0,5) || ''}`,
      slot.course_title || moduleRef.value?.title || '',
      slot.teacher_name || '',
      slot.activity || 'Cours',
      normalizeClass(slot.class_code),
      slot.room || ''
    ])

    autoTable(doc, {
      head: [['Sem.', 'Jour', 'Date', 'Horaire', 'Cours', 'Enseignant', 'Type', 'Classe', 'Salle']],
      body: tableData,
      startY: 42,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 15 }, 1: { cellWidth: 22 }, 2: { cellWidth: 22 },
        3: { cellWidth: 28 }, 4: { cellWidth: 50 }, 5: { cellWidth: 40 },
        6: { cellWidth: 18 }, 7: { cellWidth: 25 }, 8: { cellWidth: 20 }
      }
    })

    const pageCount = doc.internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.setTextColor(150)
      doc.text(`Généré le ${new Date().toLocaleDateString('fr-CH')} - Page ${i}/${pageCount}`, 14, doc.internal.pageSize.height - 10)
    }

    const moduleCode = moduleRef.value?.code || 'module'
    const classLabel = normalizeClass(selectedClass.value) || 'all'
    doc.save(`Planning_${moduleCode}_${classLabel}.pdf`)

    toast.add({ severity: 'success', summary: 'Export PDF réussi', detail: `${filteredPlanning.value.length} séances exportées`, life: 3000 })
  }

  // Obtenir les heures par classe
  const getClassHours = (classCode) => {
    return Math.round(
      modulePlanning.value
        .filter(slot => normalizeClass(slot.class_code) === classCode)
        .reduce((sum, slot) => sum + getSlotHours(slot), 0) * 10
    ) / 10
  }

  return {
    modulePlanning,
    loadingPlanning,
    selectedClass,
    planningView,
    showDialog,
    editingSession,
    saving,
    dbClassCodes,
    availableClasses,
    allClassOptions,
    filteredPlanning,
    totalPlanningHours,
    planningConflicts,
    calendarWeeks,
    groupedPlanningData,
    flatPlanningData,
    classOptions,
    dayOptions,
    activityOptions,
    rowClass,
    getDaySlots,
    loadModulePlanning,
    loadDbClassCodes,
    editSession,
    addSessionToWeek,
    toggleClass,
    saveSession,
    deleteCurrentSession,
    deleteSession,
    exportPlanningToExcel,
    exportPlanningToPDF,
    getClassHours,
  }
}
