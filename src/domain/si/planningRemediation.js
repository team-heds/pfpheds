const normalize = value => String(value || '').replace(/\s+/g, ' ').trim()

const normalizedKey = value => normalize(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()

function parseClockMinutes(value) {
  const raw = normalize(value)
  let match = raw.match(/^(\d{1,2})[:.](\d{2})(?::\d{2})?$/)
  if (!match) match = raw.match(/^(\d{1,2})(\d{2})$/)
  if (!match) return null

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

function parseHumanClockMinutes(value) {
  const raw = normalize(value)
  const match = raw.match(/^(\d{1,2})\s*h\s*(\d{2})$/i)
  if (!match) return parseClockMinutes(raw)

  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

function deliveryMode(slot) {
  const text = normalizedKey([
    slot?.day,
    slot?.activity_type,
    slot?.activity,
    slot?.course_title,
    slot?.room
  ].filter(Boolean).join(' '))

  return {
    remote: /\b(distance|distanciel|online|en ligne|e-?learning)\b/.test(text),
    asynchronous: /\b(asynchrone|asynchronous)\b/.test(text)
  }
}

function rawTeachers(slot) {
  if (Array.isArray(slot?.teachers)) return slot.teachers
  if (typeof slot?.teachers === 'string') return slot.teachers.split(/[;,|]/)
  return slot?.teachers ? [slot.teachers] : []
}

function exactTeacherValues(slot) {
  if (Array.isArray(slot?.teachers)) return slot.teachers.map(value => String(value))
  if (typeof slot?.teachers === 'string') return slot.teachers.split(/[;,|]/).map(value => String(value))
  return slot?.teachers == null ? [] : [String(slot.teachers)]
}

function teacherLabel(value) {
  if (typeof value === 'object') {
    return normalize(value?.name || value?.displayName || value?.display_name || value?.email)
  }
  return normalize(value)
}

function isPlaceholderTeacher(value) {
  const text = normalizedKey(teacherLabel(value))
  if (!text || text === '?') return true

  return [
    'postulation',
    'repourvoir',
    'reattribuer',
    'pas d enseignant',
    'vacataire',
    'nouveau rm',
    'a definir'
  ].some(label => text.includes(normalizedKey(label)))
}

function slotIdentity(slot) {
  return [
    normalizedKey(slot?.module_code),
    normalizedKey(slot?.course_id || slot?.course_title),
    normalizedKey(slot?.class_code),
    slot?.week_number ?? '',
    normalizedKey(slot?.day),
    normalize(slot?.start_time),
    normalize(slot?.end_time)
  ].join('|')
}

function courseIdentity(slot) {
  return `${normalizedKey(slot?.module_code)}|${normalizedKey(slot?.course_title)}`
}

function addCandidate(index, identity, value) {
  if (!value) return
  if (!index.has(identity)) index.set(identity, new Map())
  index.get(identity).set(JSON.stringify(value), value)
}

function candidatesFor(index, identity) {
  return [...(index.get(identity)?.values() || [])]
}

function confidenceFor(candidates) {
  if (candidates.length === 1) return 'high'
  if (candidates.length > 1) return 'ambiguous'
  return 'manual'
}

function sourceLabel(slot) {
  return [
    slot?.class_code,
    slot?.week_number != null ? `S${slot.week_number}` : '',
    slot?.day,
    [slot?.start_time, slot?.end_time].filter(Boolean).join('–')
  ].filter(Boolean).join(' · ')
}

function makeFinding(slot, category, currentValue, candidates, expectedValue, details = {}) {
  const confidence = confidenceFor(candidates)
  return {
    id: `${category}-${slot.id}`,
    slotId: slot.id,
    category,
    confidence,
    status: confidence === 'high' ? 'proposal' : 'decision_required',
    classCode: normalize(slot.class_code) || 'Non assignée',
    moduleCode: normalize(slot.module_code) || 'Sans module',
    courseTitle: normalize(slot.course_title) || 'Cours sans titre',
    weekNumber: slot.week_number ?? null,
    day: normalize(slot.day) || 'Jour inconnu',
    startTime: normalize(slot.start_time),
    endTime: normalize(slot.end_time),
    source: sourceLabel(slot),
    currentValue,
    expectedValue,
    candidates,
    proposedValue: candidates.length === 1 ? candidates[0] : null,
    replacementValue: candidates.length === 1
      ? (category === 'course'
          ? { id: candidates[0].id }
          : { value: candidates[0].value })
      : null,
    ...details
  }
}

export function buildPlanningRemediationFindings({ slots = [], modules = [], courses = [] } = {}) {
  const moduleCodeById = new Map(
    modules.map(module => [String(module.id), normalizedKey(module.code || module.number)])
  )
  const courseById = new Map(courses.map(course => [String(course.id), course]))
  const validCourseIds = new Set(courseById.keys())
  const courseCandidates = new Map()
  const teacherDonors = new Map()
  const roomDonors = new Map()

  for (const course of courses) {
    const moduleCode = moduleCodeById.get(String(course.module_id))
    if (!moduleCode) continue
    addCandidate(courseCandidates, `${moduleCode}|${normalizedKey(course.name)}`, {
      id: String(course.id),
      label: normalize(course.name) || String(course.id)
    })
  }

  for (const slot of slots) {
    const identity = slotIdentity(slot)
    const concreteTeachers = rawTeachers(slot)
      .map(teacherLabel)
      .filter(label => label && !isPlaceholderTeacher(label))
      .sort((left, right) => left.localeCompare(right, 'fr'))

    if (concreteTeachers.length) {
      addCandidate(teacherDonors, identity, {
        value: concreteTeachers,
        label: concreteTeachers.join(', ')
      })
    }

    const room = normalize(slot.room)
    if (room) addCandidate(roomDonors, identity, { value: room, label: room })

    const courseId = String(slot.course_id || '')
    if (validCourseIds.has(courseId)) {
      const course = courseById.get(courseId)
      addCandidate(courseCandidates, courseIdentity(slot), {
        id: courseId,
        label: normalize(course?.name || slot.course_title) || courseId
      })
    }
  }

  const findings = []

  for (const slot of slots) {
    const mode = deliveryMode(slot)
    const identity = slotIdentity(slot)
    const courseId = String(slot.course_id || '')
    const teachers = rawTeachers(slot).map(teacherLabel).filter(Boolean)
    const concreteTeachers = teachers.filter(label => !isPlaceholderTeacher(label))

    if (!validCourseIds.has(courseId)) {
      findings.push(makeFinding(
        slot,
        'course',
        courseId || 'Aucun cours lié',
        candidatesFor(courseCandidates, courseIdentity(slot)),
        { id: slot.course_id || null },
        { reason: 'Le créneau n’est pas relié à un cours officiel valide.' }
      ))
    }

    if (!concreteTeachers.length) {
      findings.push(makeFinding(
        slot,
        'teacher',
        teachers.join(', ') || 'Aucun enseignant',
        candidatesFor(teacherDonors, identity),
        { value: exactTeacherValues(slot) },
        {
          reason: teachers.length
            ? 'La valeur actuelle est un libellé temporaire ou de postulation.'
            : 'Aucun enseignant n’est renseigné.'
        }
      ))
    }

    if (!normalize(slot.room) && !mode.remote && !mode.asynchronous) {
      findings.push(makeFinding(
        slot,
        'room',
        'Aucune salle',
        candidatesFor(roomDonors, identity),
        { value: slot.room == null ? null : String(slot.room) },
        { reason: 'Ce créneau présentiel ne possède pas de salle.' }
      ))
    }

    const hasStart = Boolean(normalize(slot.start_time))
    const hasEnd = Boolean(normalize(slot.end_time))
    const start = parseHumanClockMinutes(slot.start_time)
    const end = parseHumanClockMinutes(slot.end_time)
    const invalid = !mode.asynchronous && (!hasStart || !hasEnd || start == null || end == null || end <= start)

    if (invalid) {
      findings.push(makeFinding(
        slot,
        'time',
        [normalize(slot.start_time), normalize(slot.end_time)].filter(Boolean).join('–') || 'Horaire absent',
        [],
        {
          startTime: slot.start_time == null ? null : String(slot.start_time),
          endTime: slot.end_time == null ? null : String(slot.end_time)
        },
        {
          reason: 'L’horaire est absent, invalide ou incohérent.'
        }
      ))
    }
  }

  return findings
}

export function summarizePlanningRemediation(findings = []) {
  const categories = ['course', 'teacher', 'room', 'time']
  const byCategory = Object.fromEntries(categories.map(category => [category, {
    total: 0,
    proposals: 0,
    ambiguous: 0,
    manual: 0
  }]))

  for (const finding of findings) {
    const summary = byCategory[finding.category]
    if (!summary) continue
    summary.total++
    if (finding.confidence === 'high') summary.proposals++
    if (finding.confidence === 'ambiguous') summary.ambiguous++
    if (finding.confidence === 'manual') summary.manual++
  }

  return {
    total: findings.length,
    proposals: findings.filter(finding => finding.confidence === 'high').length,
    decisionsRequired: findings.filter(finding => finding.confidence !== 'high').length,
    byCategory
  }
}

export default {
  buildPlanningRemediationFindings,
  summarizePlanningRemediation
}
