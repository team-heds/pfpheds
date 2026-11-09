import { supabase } from '@/supabase'
import { normalizeTeacherName, teacherKey, computePeriods } from '@/service/workloadService'

function normalizeClassCode(code) {
  if (!code) return 'non-assigné'
  return String(code).trim().toUpperCase()
}

export function expandPlanningClassCodeAliases(classCodes = []) {
  const aliases = new Set()

  for (const rawCode of classCodes) {
    if (!rawCode) continue
    const code = normalizeClassCode(rawCode)
    aliases.add(code)

    const cohortMatch = code.match(/^(?:B|BA|BAC)(\d{2})(.*)$/)
    if (!cohortMatch) continue

    const [, year, suffix] = cohortMatch
    aliases.add(`B${year}${suffix}`)
    aliases.add(`BA${year}${suffix}`)
    aliases.add(`BAC${year}${suffix}`)
  }

  return [...aliases]
}

function hasText(value) {
  return typeof value === 'string' ? value.trim().length > 0 : Boolean(value)
}

function slotDeliveryMode(slot) {
  const text = [slot?.day, slot?.activity_type, slot?.activity, slot?.course_title, slot?.room]
    .filter(Boolean)
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  return {
    isRemote: /\b(distance|distanciel|online|en ligne|e-?learning)\b/.test(text),
    isAsynchronous: /\b(asynchrone|asynchronous)\b/.test(text)
  }
}

function extractRawTeachers(rawTeachers) {
  if (!rawTeachers) return []
  if (Array.isArray(rawTeachers)) {
    return rawTeachers
      .map(entry => {
        if (!entry) return null
        if (typeof entry === 'string') return entry
        if (typeof entry === 'object') {
          return entry.name || entry.displayName || entry.email || entry.value || null
        }
        return null
      })
      .filter(Boolean)
  }

  if (typeof rawTeachers === 'string') {
    return rawTeachers
      .split(/[;,|]/)
      .map(part => part.trim())
      .filter(Boolean)
  }

  return []
}

function buildTeacherNormalization(rawTeachers) {
  const normalizedNames = []
  const teacherKeys = new Set()

  for (const raw of extractRawTeachers(rawTeachers)) {
    const normalized = normalizeTeacherName(raw)
    if (!normalized) continue
    const key = teacherKey(normalized)
    if (!key || teacherKeys.has(key)) continue
    teacherKeys.add(key)
    normalizedNames.push(normalized)
  }

  return {
    normalizedNames,
    teacherKeys
  }
}

export function collectPlanningSlotIssues(slot) {
  const issues = []
  const hasStart = hasText(slot?.start_time)
  const hasEnd = hasText(slot?.end_time)
  const deliveryMode = slotDeliveryMode(slot)
  if ((!hasStart || !hasEnd) && !deliveryMode.isAsynchronous) {
    issues.push('missing_time')
  }

  const periods = computePeriods(slot?.start_time, slot?.end_time)
  if (hasStart && hasEnd && periods <= 0) {
    issues.push('invalid_time')
  }

  if (!hasText(slot?.course_id) && !hasText(slot?.course_code)) {
    issues.push('missing_course_link')
  }

  if (!hasText(slot?.activity_type) && !hasText(slot?.activity)) {
    issues.push('missing_activity')
  }

  if (!hasText(slot?.room) && !deliveryMode.isRemote && !deliveryMode.isAsynchronous) {
    issues.push('missing_room')
  }

  const { normalizedNames, teacherKeys } = buildTeacherNormalization(slot?.teachers)
  if ((Array.isArray(slot?.teachers) ? slot.teachers.length : extractRawTeachers(slot?.teachers).length) === 0) {
    issues.push('no_teachers_declared')
  }
  if (teacherKeys.size === 0) {
    issues.push('no_valid_teacher')
  }

  return {
    issues,
    normalizedNames,
    normalizedTeacherCount: teacherKeys.size,
    rawTeacherCount: Array.isArray(slot?.teachers)
      ? slot.teachers.length
      : extractRawTeachers(slot?.teachers).length
  }
}

export function summarizePlanningDataQuality(rows) {
  const summary = {
    totalSlots: rows.length,
    completeSlots: 0,
    slotsWithAnyIssue: 0,
    qualityScore: null,
    missingCourseLink: 0,
    noTeachersDeclared: 0,
    noValidTeacher: 0,
    missingActivity: 0,
    missingRoom: 0,
    missingTime: 0,
    invalidTime: 0,
    teacherIssueSlots: 0
  }

  for (const row of rows) {
    if (row.issues.includes('missing_course_link')) summary.missingCourseLink++
    if (row.issues.includes('no_teachers_declared')) summary.noTeachersDeclared++
    if (row.issues.includes('no_valid_teacher')) summary.noValidTeacher++
    if (row.issues.includes('missing_activity')) summary.missingActivity++
    if (row.issues.includes('missing_room')) summary.missingRoom++
    if (row.issues.includes('missing_time')) summary.missingTime++
    if (row.issues.includes('invalid_time')) summary.invalidTime++
    if (row.issues.length === 0) summary.completeSlots++
    else summary.slotsWithAnyIssue++
    if (row.issues.includes('no_valid_teacher')) summary.teacherIssueSlots++
  }

  summary.qualityScore = summary.totalSlots > 0
    ? Math.round((summary.completeSlots / summary.totalSlots) * 1000) / 10
    : null

  return summary
}

function getErrorText(error) {
  return [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function isAcademicYearFilterError(error) {
  const text = getErrorText(error)
  return text.includes('academic_year_id') && (text.includes('does not exist') || text.includes('column') || text.includes('schema cache'))
}

function isDayIndexOrderError(error) {
  const text = getErrorText(error)
  return text.includes('day_index') && (text.includes('does not exist') || text.includes('column') || text.includes('schema cache'))
}

export function analyzePlanningDataQuality(slots = [], { includeRows = true } = {}) {
  const rows = (slots || []).map(slot => {
    const { issues, normalizedNames, normalizedTeacherCount, rawTeacherCount } = collectPlanningSlotIssues(slot)
    return {
      slotId: slot.id,
      weekNumber: slot.week_number,
      day: slot.day,
      dayIndex: slot.day_index,
      classCode: normalizeClassCode(slot.class_code),
      moduleCode: slot.module_code || '',
      courseId: slot.course_id || null,
      courseCode: slot.course_code || null,
      courseTitle: slot.course_title || '',
      activityType: slot.activity_type || '',
      activity: slot.activity || '',
      room: slot.room || '',
      startTime: slot.start_time || '',
      endTime: slot.end_time || '',
      periods: computePeriods(slot.start_time, slot.end_time),
      rawTeacherCount,
      normalizedTeacherCount,
      normalizedTeachers: normalizedNames.join(' | '),
      rawTeachers: extractRawTeachers(slot.teachers).join(' | '),
      issues,
      issueSummary: issues.join(' | ')
    }
  })

  return {
    fetchedSlots: rows.length,
    summary: summarizePlanningDataQuality(rows),
    rows: includeRows ? rows : undefined,
    generatedAt: new Date().toISOString()
  }
}

export async function scanPlanningDataQuality({
  academicYearId = null,
  weekNumber = null,
  classCodes = [],
  limit = 5000,
  includeRows = true
} = {}) {
  const requestedLimit = Number.isFinite(Number(limit)) && Number(limit) > 0 ? Number(limit) : 5000
  const maxPageSize = 1000
  const buildQuery = (includeAcademicYear = true, includeDayIndexOrder = true, offset = 0) => {
    const pageSize = Math.min(maxPageSize, requestedLimit - offset)
    let query = supabase
      .from('planning_time_slots')
      .select('*')
      .order('week_number')
      .order('start_time')

    if (includeDayIndexOrder) {
      query = query.order('day_index')
    }

    query = query.order('id')

    if (includeAcademicYear && academicYearId) {
      query = query.eq('academic_year_id', academicYearId)
    }

    if (weekNumber != null) {
      query = query.eq('week_number', weekNumber)
    }

    if (Array.isArray(classCodes) && classCodes.length > 0) {
      const uniqueCodes = expandPlanningClassCodeAliases(classCodes)
      if (uniqueCodes.length === 1) {
        query = query.ilike('class_code', uniqueCodes[0])
      } else if (uniqueCodes.length > 1) {
        query = query.or(uniqueCodes.map(code => `class_code.ilike.${code}`).join(','))
      }
    }

    return query.range(offset, offset + pageSize - 1)
  }

  let useAcademicYearFilter = true
  let useDayIndexOrder = true
  let { data, error } = await buildQuery(useAcademicYearFilter, useDayIndexOrder)

  if (error && academicYearId && isAcademicYearFilterError(error)) {
    if (!Array.isArray(classCodes) || classCodes.length === 0) {
      throw new Error('Impossible de limiter le diagnostic à l’année active : aucun code de classe fourni et planning_time_slots.academic_year_id est indisponible.')
    }
    console.warn('[DataQuality] Colonne academic_year_id absente/inaccessible, fallback sans filtre année')
    useAcademicYearFilter = false
    const retry = await buildQuery(useAcademicYearFilter, useDayIndexOrder)
    data = retry.data
    error = retry.error
  }

  if (error && isDayIndexOrderError(error)) {
    console.warn('[DataQuality] Colonne day_index absente/inaccessible, fallback sans tri day_index')
    useDayIndexOrder = false
    const retry = await buildQuery(useAcademicYearFilter, useDayIndexOrder)
    data = retry.data
    error = retry.error
  }

  if (error) {
    console.error('[DataQuality] Erreur lecture planning_time_slots:', error)
    throw error
  }

  let pagesFetched = 1
  let lastPageLength = (data || []).length
  let allData = data || []

  while (allData.length < requestedLimit && lastPageLength === Math.min(maxPageSize, requestedLimit - (allData.length - lastPageLength))) {
    const offset = allData.length
    const pageSize = Math.min(maxPageSize, requestedLimit - offset)
    const nextPage = await buildQuery(useAcademicYearFilter, useDayIndexOrder, offset)
    if (nextPage.error) {
      console.error('[DataQuality] Erreur lecture page planning_time_slots:', nextPage.error)
      throw nextPage.error
    }

    const pageRows = nextPage.data || []
    allData = allData.concat(pageRows)
    lastPageLength = pageRows.length
    pagesFetched++
    if (lastPageLength < pageSize) break
  }

  data = allData.slice(0, requestedLimit)
  const truncated = data.length >= requestedLimit && lastPageLength === Math.min(maxPageSize, requestedLimit - (data.length - lastPageLength))

  const analysis = analyzePlanningDataQuality(data, { includeRows })

  return {
    ...analysis,
    scope: {
      academicYearId,
      academicYearFilterApplied: useAcademicYearFilter && Boolean(academicYearId),
      classCodes: expandPlanningClassCodeAliases(classCodes),
      weekNumber,
      limit: requestedLimit,
      pageSize: maxPageSize,
      pagesFetched,
      truncated
    },
    generatedAt: analysis.generatedAt
  }
}

export function buildDataQualityAlerts(summary) {
  if (!summary) return []

  const alerts = []

  if (summary.missingCourseLink > 0) {
    alerts.push({
      id: 'dq-missing-course',
      severity: summary.missingCourseLink > 10 ? 'danger' : 'warning',
      icon: 'pi pi-link-slash',
      title: `${summary.missingCourseLink} créneaux sans course_id`,
      message: 'Rattachez les créneaux au cours officiel pour fiabiliser les charges et exports.'
    })
  }

  if (summary.noTeachersDeclared > 0 || summary.noValidTeacher > 0) {
    const total = summary.teacherIssueSlots ?? summary.noValidTeacher
    alerts.push({
      id: 'dq-missing-teachers',
      severity: total > 10 ? 'danger' : 'warning',
      icon: 'pi pi-user-minus',
      title: `${total} créneaux sans enseignants valides`,
      message: 'Complétez la liste des enseignants pour chaque créneau.'
    })
  }

  if (summary.missingActivity > 0) {
    alerts.push({
      id: 'dq-missing-activity',
      severity: 'warning',
      icon: 'pi pi-briefcase',
      title: `${summary.missingActivity} créneaux sans activité`,
      message: 'Renseignez le type d’activité pour affiner les diagnostics.'
    })
  }

  if (summary.missingRoom > 0) {
    alerts.push({
      id: 'dq-missing-room',
      severity: 'info',
      icon: 'pi pi-building',
      title: `${summary.missingRoom} créneaux sans salle`,
      message: 'Affectez une salle pour assurer la logistique quotidienne.'
    })
  }

  if (summary.missingTime > 0 || summary.invalidTime > 0) {
    const total = summary.missingTime + summary.invalidTime
    alerts.push({
      id: 'dq-invalid-time',
      severity: 'danger',
      icon: 'pi pi-clock',
      title: `${total} créneaux avec horaire invalide`,
      message: 'Corrigez les horaires pour garantir des exports cohérents.'
    })
  }

  return alerts
}
