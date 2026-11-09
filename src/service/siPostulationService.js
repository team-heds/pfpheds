export { fetchPlanningSlotsPaginated } from '@/service/siPlanningQueryService'

const POSTULATION_FIELDS = [
  'teacher',
  'teacher_name',
  'teacher_label',
  'notes',
  'comment',
  'commentaire',
  'status',
  'assignment_status',
  'teacher_status',
  'slot_type',
  'type',
  'course_title',
  'activity',
  'activity_type'
]

const DAY_LABELS = {
  monday: 'Lundi',
  tuesday: 'Mardi',
  wednesday: 'Mercredi',
  thursday: 'Jeudi',
  friday: 'Vendredi',
  lundi: 'Lundi',
  mardi: 'Mardi',
  mercredi: 'Mercredi',
  jeudi: 'Jeudi',
  vendredi: 'Vendredi'
}

const DAY_INDEX_LABELS = {
  0: 'Lundi',
  1: 'Mardi',
  2: 'Mercredi',
  3: 'Jeudi',
  4: 'Vendredi',
  5: 'Distance'
}

export function normalizePostulationText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim()
}

function normalizeLookupKey(value) {
  return normalizePostulationText(value).toLocaleLowerCase('fr-CH')
}

export function isPostulationLabel(value) {
  const text = normalizePostulationText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return ['postulation', 'postulat', 'repourvoir', 'repourv', 'reattribuer', 'reattrib']
    .some(label => text.includes(label))
}

export function extractPostulationTeacherLabels(slot) {
  const rawTeachers = slot?.teachers ?? slot?.teachers_list ?? slot?.teacher ?? slot?.teacher_name ?? null

  if (Array.isArray(rawTeachers)) {
    return rawTeachers
      .map(teacher => typeof teacher === 'object'
        ? teacher?.name || teacher?.display_name || teacher?.email
        : teacher)
      .map(normalizePostulationText)
      .filter(Boolean)
  }

  if (typeof rawTeachers === 'object' && rawTeachers !== null) {
    const label = rawTeachers?.name || rawTeachers?.display_name || rawTeachers?.email
    return label ? [normalizePostulationText(label)] : []
  }

  if (typeof rawTeachers === 'string') {
    const value = rawTeachers.trim()
    if (!value) return []

    if (value.startsWith('[') && value.endsWith(']')) {
      try {
        const parsed = JSON.parse(value)
        if (Array.isArray(parsed)) {
          return parsed
            .map(teacher => typeof teacher === 'object'
              ? teacher?.name || teacher?.display_name || teacher?.email
              : teacher)
            .map(normalizePostulationText)
            .filter(Boolean)
        }
      } catch {
        // Les anciennes valeurs texte restent lisibles même si elles ressemblent à du JSON invalide.
      }
    }

    return [normalizePostulationText(value)]
  }

  return []
}

export function getPostulationTexts(slot) {
  return [
    ...extractPostulationTeacherLabels(slot),
    ...POSTULATION_FIELDS.map(field => slot?.[field])
  ]
    .map(normalizePostulationText)
    .filter(Boolean)
}

export function isPostulationSlot(slot) {
  return getPostulationTexts(slot).some(isPostulationLabel)
}

export function formatPostulationDay(slot) {
  const day = normalizeLookupKey(slot?.day)
  if (DAY_LABELS[day]) return DAY_LABELS[day]

  const dayIndex = Number(slot?.day_index)
  if (Number.isFinite(dayIndex) && DAY_INDEX_LABELS[dayIndex]) return DAY_INDEX_LABELS[dayIndex]

  return normalizePostulationText(slot?.day) || '—'
}

export function buildPostulationRows({ slots = [], modules = [], courses = [] } = {}) {
  const moduleByCode = new Map(
    modules
      .map(module => [normalizeLookupKey(module?.code), module])
      .filter(([key]) => key)
  )
  const courseById = new Map(
    courses
      .map(course => [String(course?.id || ''), course])
      .filter(([key]) => key)
  )
  const courseIdsByModule = new Map()

  for (const slot of slots) {
    const moduleKey = normalizeLookupKey(slot?.module_code)
    const courseId = String(slot?.course_id || '')
    if (!moduleKey || !courseId || !courseById.has(courseId)) continue
    if (!courseIdsByModule.has(moduleKey)) courseIdsByModule.set(moduleKey, new Set())
    courseIdsByModule.get(moduleKey).add(courseId)
  }

  const seenSlotIds = new Set()
  const rows = []

  for (const slot of slots) {
    if (!isPostulationSlot(slot)) continue

    const slotId = String(slot?.id || '')
    if (!slotId || seenSlotIds.has(slotId)) continue
    seenSlotIds.add(slotId)

    const moduleKey = normalizeLookupKey(slot?.module_code)
    const module = moduleByCode.get(moduleKey)
    const directCourseId = String(slot?.course_id || '')
    const moduleCourseIds = [...(courseIdsByModule.get(moduleKey) || [])]
    const inferredCourseId = !directCourseId && moduleCourseIds.length === 1 ? moduleCourseIds[0] : null
    const courseId = directCourseId && courseById.has(directCourseId)
      ? directCourseId
      : inferredCourseId
    const course = courseId ? courseById.get(courseId) : null
    const texts = getPostulationTexts(slot)
    const teachers = extractPostulationTeacherLabels(slot)

    rows.push({
      id: slotId,
      slotId: slot.id,
      courseId: courseId || null,
      courseLinkSource: directCourseId && courseById.has(directCourseId)
        ? 'direct'
        : inferredCourseId
          ? 'module_unique'
          : 'missing',
      moduleId: module?.id || null,
      moduleCode: normalizePostulationText(slot?.module_code || module?.code),
      moduleNumber: normalizePostulationText(module?.number || slot?.module_code) || '—',
      moduleTitle: normalizePostulationText(module?.title) || 'Module non trouvé',
      courseTitle: normalizePostulationText(slot?.course_title || course?.name) || 'Cours sans titre',
      courseCatalogName: normalizePostulationText(course?.name),
      classCode: normalizePostulationText(
        slot?.class_code || (Array.isArray(slot?.class_codes) ? slot.class_codes.join(', ') : slot?.class_codes)
      ) || '—',
      weekNumber: slot?.week_number ?? '—',
      dayKey: normalizePostulationText(slot?.day) || null,
      dayIndex: slot?.day_index ?? null,
      dayLabel: formatPostulationDay(slot),
      startTime: slot?.start_time || null,
      endTime: slot?.end_time || null,
      timeRange: `${slot?.start_time || '--:--'} - ${slot?.end_time || '--:--'}`,
      teacherLabel: teachers.find(isPostulationLabel) || texts.find(isPostulationLabel) || 'Postulation',
      activity: normalizePostulationText(slot?.activity || slot?.activity_type),
      existingTeacherCount: teachers.filter(label => !isPostulationLabel(label)).length,
      voteCount: 0,
      hasMyVote: false
    })
  }

  return rows.sort((left, right) => {
    const moduleOrder = String(left.moduleNumber).localeCompare(String(right.moduleNumber), 'fr', { numeric: true })
    if (moduleOrder !== 0) return moduleOrder
    const weekOrder = Number(left.weekNumber || 0) - Number(right.weekNumber || 0)
    if (weekOrder !== 0) return weekOrder
    const dayOrder = Number(left.dayIndex ?? 99) - Number(right.dayIndex ?? 99)
    if (dayOrder !== 0) return dayOrder
    return String(left.startTime || '').localeCompare(String(right.startTime || ''))
  })
}
