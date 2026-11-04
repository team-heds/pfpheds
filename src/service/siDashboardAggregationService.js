function normalizeModuleCode(value) {
  return String(value || '').trim().toLowerCase()
}

function normalizeTeacherKey(value) {
  if (!value) return ''
  if (typeof value === 'object') {
    return String(value.id || value.email || value.name || value.display_name || '')
      .trim()
      .toLowerCase()
  }
  return String(value).trim().toLowerCase()
}

function teacherKeys(slot) {
  const rawTeachers = Array.isArray(slot?.teachers)
    ? slot.teachers
    : String(slot?.teachers || '').split(/[;,|]/)

  return new Set(rawTeachers.map(normalizeTeacherKey).filter(Boolean))
}

export function filterPlanningSlotsByModules(slots = [], moduleCodes = []) {
  const allowed = new Set(moduleCodes.map(normalizeModuleCode).filter(Boolean))
  if (allowed.size === 0) return []
  return (slots || []).filter(slot => allowed.has(normalizeModuleCode(slot?.module_code)))
}

export function calculatePlanningHours(slots = []) {
  return (slots || []).reduce((sum, slot) => {
    if (!slot?.start_time || !slot?.end_time) return sum
    const [startHours, startMinutes] = String(slot.start_time).split(':').map(Number)
    const [endHours, endMinutes] = String(slot.end_time).split(':').map(Number)
    if ([startHours, startMinutes, endHours, endMinutes].some(Number.isNaN)) return sum
    const duration = (endHours + endMinutes / 60) - (startHours + startMinutes / 60)
    return duration > 0 ? sum + duration : sum
  }, 0)
}

export function countPlanningTeacherConflicts(slots = []) {
  const buckets = new Map()

  for (const slot of slots || []) {
    const key = `${slot?.week_number ?? ''}|${String(slot?.day || '').trim().toLowerCase()}`
    if (!buckets.has(key)) buckets.set(key, [])
    buckets.get(key).push(slot)
  }

  let conflicts = 0
  for (const bucket of buckets.values()) {
    for (let index = 0; index < bucket.length; index++) {
      const left = bucket[index]
      const leftTeachers = teacherKeys(left)
      if (leftTeachers.size === 0) continue

      for (let comparedIndex = index + 1; comparedIndex < bucket.length; comparedIndex++) {
        const right = bucket[comparedIndex]
        const overlaps = (left.start_time || '00:00') < (right.end_time || '23:59')
          && (right.start_time || '00:00') < (left.end_time || '23:59')
        if (!overlaps) continue

        const rightTeachers = teacherKeys(right)
        if ([...leftTeachers].some(teacher => rightTeachers.has(teacher))) conflicts++
      }
    }
  }

  return conflicts
}

export default {
  filterPlanningSlotsByModules,
  calculatePlanningHours,
  countPlanningTeacherConflicts
}
