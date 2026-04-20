import { supabase } from '@/supabase'
import { normalizeTeacherName, teacherKey, computePeriods } from '@/service/workloadService'

function normalizeClassCode(code) {
  if (!code) return 'non-assigné'
  return String(code).trim().toUpperCase()
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

function collectIssues(slot) {
  const issues = []
  const hasStart = Boolean(slot?.start_time)
  const hasEnd = Boolean(slot?.end_time)
  if (!hasStart || !hasEnd) {
    issues.push('missing_time')
  }

  const periods = computePeriods(slot?.start_time, slot?.end_time)
  if (hasStart && hasEnd && periods <= 0) {
    issues.push('invalid_time')
  }

  if (!slot?.course_id && !slot?.course_code) {
    issues.push('missing_course_link')
  }

  if (!slot?.activity_type && !slot?.activity) {
    issues.push('missing_activity')
  }

  if (!slot?.room) {
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

function summarizeIssues(rows) {
  const summary = {
    totalSlots: rows.length,
    missingCourseLink: 0,
    noTeachersDeclared: 0,
    noValidTeacher: 0,
    missingActivity: 0,
    missingRoom: 0,
    missingTime: 0,
    invalidTime: 0
  }

  for (const row of rows) {
    if (row.issues.includes('missing_course_link')) summary.missingCourseLink++
    if (row.issues.includes('no_teachers_declared')) summary.noTeachersDeclared++
    if (row.issues.includes('no_valid_teacher')) summary.noValidTeacher++
    if (row.issues.includes('missing_activity')) summary.missingActivity++
    if (row.issues.includes('missing_room')) summary.missingRoom++
    if (row.issues.includes('missing_time')) summary.missingTime++
    if (row.issues.includes('invalid_time')) summary.invalidTime++
  }

  return summary
}

export async function scanPlanningDataQuality({
  academicYearId = null,
  weekNumber = null,
  classCodes = [],
  limit = 5000,
  includeRows = true
} = {}) {
  let query = supabase
    .from('planning_time_slots')
    .select('*')
    .order('week_number')
    .order('day_index')
    .order('start_time')

  if (academicYearId) {
    query = query.eq('academic_year_id', academicYearId)
  }

  if (weekNumber != null) {
    query = query.eq('week_number', weekNumber)
  }

  if (Array.isArray(classCodes) && classCodes.length > 0) {
    const uniqueCodes = Array.from(new Set(classCodes.filter(Boolean).map(normalizeClassCode)))
    if (uniqueCodes.length === 1) {
      query = query.eq('class_code', uniqueCodes[0])
    } else if (uniqueCodes.length > 1) {
      query = query.in('class_code', uniqueCodes)
    }
  }

  if (limit) {
    query = query.limit(limit)
  }

  const { data, error } = await query
  if (error) {
    console.error('[DataQuality] Erreur lecture planning_time_slots:', error)
    throw error
  }

  const rows = (data || []).map(slot => {
    const { issues, normalizedNames, normalizedTeacherCount, rawTeacherCount } = collectIssues(slot)
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

  const summary = summarizeIssues(rows)

  return {
    fetchedSlots: rows.length,
    summary,
    rows: includeRows ? rows : undefined,
    generatedAt: new Date().toISOString()
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
    const total = summary.noTeachersDeclared + summary.noValidTeacher
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
