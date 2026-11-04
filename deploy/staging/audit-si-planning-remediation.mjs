import fs from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const env = Object.fromEntries(
  (await fs.readFile(new URL('.env', import.meta.url), 'utf8'))
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const separator = line.indexOf('=')
      return [line.slice(0, separator), line.slice(separator + 1)]
    })
)

if (!env.STAGING_SERVICE_ROLE_KEY) throw new Error('STAGING_SERVICE_ROLE_KEY is unavailable')

const endpoint = process.env.HEDS_STAGING_URL || 'https://test.hedsvs.ch'
if (!['https://test.hedsvs.ch', 'http://localhost:8180'].includes(endpoint)) {
  throw new Error(`Environnement refusé: ${endpoint}`)
}

const client = createClient(endpoint, env.STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const check = ({ data, error }) => {
  if (error) throw error
  return data || []
}

const normalize = value => String(value || '').replace(/\s+/g, ' ').trim()
const key = value => normalize(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()

const classAliases = value => {
  const normalized = normalize(value).toUpperCase().replace(/\s+/g, '').replace(/_/g, '-')
  const values = new Set(normalized ? [normalized] : [])
  const match = normalized.match(/^(?:B|BA|BAC)(\d{2})(.*)$/)
  if (match) {
    values.add(`B${match[1]}${match[2]}`)
    values.add(`BA${match[1]}${match[2]}`)
    values.add(`BAC${match[1]}${match[2]}`)
  }
  return values
}

const parseMinutes = value => {
  const raw = normalize(value)
  let match = raw.match(/^(\d{1,2})[:.](\d{2})(?::\d{2})?$/)
  if (!match) match = raw.match(/^(\d{1,2})(\d{2})$/)
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

const parseHumanMinutes = value => {
  const raw = normalize(value)
  const match = raw.match(/^(\d{1,2})\s*h\s*(\d{2})$/i)
  if (!match) return parseMinutes(raw)
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return hours * 60 + minutes
}

const formatMinutes = value => `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`

const deliveryMode = slot => {
  const text = key([slot.day, slot.activity_type, slot.activity, slot.course_title, slot.room].filter(Boolean).join(' '))
  return {
    remote: /\b(distance|distanciel|online|en ligne|e-?learning)\b/.test(text),
    asynchronous: /\b(asynchrone|asynchronous)\b/.test(text)
  }
}

const rawTeachers = slot => {
  if (Array.isArray(slot.teachers)) return slot.teachers
  if (typeof slot.teachers === 'string') return slot.teachers.split(/[;,|]/)
  return slot.teachers ? [slot.teachers] : []
}

const teacherLabel = value => typeof value === 'object'
  ? normalize(value?.name || value?.display_name || value?.email)
  : normalize(value)

const placeholderTeacher = value => {
  const text = key(teacherLabel(value))
  return !text || text === '?' || [
    'postulation', 'repourvoir', 'reattribuer', 'réattribuer', 'pas d enseignant',
    'vacataire', 'nouveau rm', 'a definir', 'à définir'
  ].some(label => text.includes(key(label)))
}

const slotIdentity = (slot, { includeTime = true, includeCourse = true } = {}) => [
  key(slot.module_code),
  includeCourse ? key(slot.course_id || slot.course_title) : key(slot.course_title),
  key(slot.class_code),
  slot.week_number ?? '',
  key(slot.day),
  includeTime ? normalize(slot.start_time) : '',
  includeTime ? normalize(slot.end_time) : ''
].join('|')

async function fetchAll(table, select = '*') {
  const rows = []
  for (let offset = 0; offset < 20000; offset += 1000) {
    const page = check(await client.from(table).select(select).order('id').range(offset, offset + 999))
    rows.push(...page)
    if (page.length < 1000) break
  }
  return rows
}

const activeYears = check(await client.from('academic_years').select('id,name').eq('is_active', true))
if (activeYears.length !== 1) throw new Error(`Expected one active academic year, found ${activeYears.length}`)
const activeYear = activeYears[0]
const classes = check(await client.from('classes').select('code').eq('academic_year_id', activeYear.id))
const activeClassCodes = new Set(classes.flatMap(row => [...classAliases(row.code)]))

const [allSlots, modules, courses] = await Promise.all([
  fetchAll('planning_time_slots'),
  fetchAll('modules', 'id,code'),
  fetchAll('courses', 'id,name,module_id')
])

const activeSlots = allSlots.filter(slot => {
  const codes = [...(Array.isArray(slot.class_codes) ? slot.class_codes : []), slot.class_code].filter(Boolean)
  return codes.some(code => [...classAliases(code)].some(alias => activeClassCodes.has(alias)))
})

const moduleIdByCode = new Map(modules.map(module => [key(module.code), String(module.id)]))
const validCourseIds = new Set(courses.map(course => String(course.id)))
const courseCandidatesByModuleAndTitle = new Map()
for (const course of courses) {
  const moduleCode = [...moduleIdByCode.entries()].find(([, id]) => id === String(course.module_id))?.[0]
  if (!moduleCode) continue
  const lookup = `${moduleCode}|${key(course.name)}`
  if (!courseCandidatesByModuleAndTitle.has(lookup)) courseCandidatesByModuleAndTitle.set(lookup, new Set())
  courseCandidatesByModuleAndTitle.get(lookup).add(String(course.id))
}

const donorRooms = new Map()
const donorTeachers = new Map()
const donorCourses = new Map()

for (const slot of activeSlots) {
  const identity = slotIdentity(slot)
  const room = normalize(slot.room)
  if (room) {
    if (!donorRooms.has(identity)) donorRooms.set(identity, new Set())
    donorRooms.get(identity).add(room)
  }

  const concreteTeachers = rawTeachers(slot).map(teacherLabel).filter(label => label && !placeholderTeacher(label))
  if (concreteTeachers.length) {
    if (!donorTeachers.has(identity)) donorTeachers.set(identity, new Set())
    donorTeachers.get(identity).add(JSON.stringify(concreteTeachers.sort()))
  }

  const courseId = String(slot.course_id || '')
  if (validCourseIds.has(courseId)) {
    const courseIdentity = `${key(slot.module_code)}|${key(slot.course_title)}`
    if (!donorCourses.has(courseIdentity)) donorCourses.set(courseIdentity, new Set())
    donorCourses.get(courseIdentity).add(courseId)
  }
}

const issues = {
  missingCourse: [],
  missingTeacher: [],
  missingRoom: [],
  invalidTime: []
}

for (const slot of activeSlots) {
  const mode = deliveryMode(slot)
  const start = parseMinutes(slot.start_time)
  const end = parseMinutes(slot.end_time)
  const courseId = String(slot.course_id || '')
  const teachers = rawTeachers(slot).map(teacherLabel).filter(Boolean)
  const concreteTeachers = teachers.filter(label => !placeholderTeacher(label))

  if (!validCourseIds.has(courseId)) {
    const observed = donorCourses.get(`${key(slot.module_code)}|${key(slot.course_title)}`) || new Set()
    const catalog = courseCandidatesByModuleAndTitle.get(`${key(slot.module_code)}|${key(slot.course_title)}`) || new Set()
    const candidates = new Set([...observed, ...catalog])
    issues.missingCourse.push({
      id: slot.id,
      module: slot.module_code,
      title: slot.course_title,
      deterministicCandidate: candidates.size === 1 ? [...candidates][0] : null,
      candidateCount: candidates.size
    })
  }

  if (!concreteTeachers.length) {
    const donors = donorTeachers.get(slotIdentity(slot)) || new Set()
    issues.missingTeacher.push({
      id: slot.id,
      placeholderOnly: teachers.length > 0,
      deterministicCandidate: donors.size === 1,
      candidateCount: donors.size
    })
  }

  if (!normalize(slot.room) && !mode.remote && !mode.asynchronous) {
    const donors = donorRooms.get(slotIdentity(slot)) || new Set()
    issues.missingRoom.push({
      id: slot.id,
      deterministicCandidate: donors.size === 1 ? [...donors][0] : null,
      candidateCount: donors.size
    })
  }

  const hasStart = Boolean(normalize(slot.start_time))
  const hasEnd = Boolean(normalize(slot.end_time))
  const timeIsInvalid = !mode.asynchronous && (!hasStart || !hasEnd || start == null || end == null || end <= start)
  if (timeIsInvalid) {
    const humanStart = parseHumanMinutes(slot.start_time)
    const humanEnd = parseHumanMinutes(slot.end_time)
    const formattingOnly = hasStart && hasEnd &&
      (start == null || end == null) &&
      humanStart != null && humanEnd != null && humanEnd > humanStart
    issues.invalidTime.push({
      id: slot.id,
      week: slot.week_number,
      day: slot.day,
      classCode: slot.class_code,
      module: slot.module_code,
      title: slot.course_title,
      start: slot.start_time,
      end: slot.end_time,
      kind: !hasStart || !hasEnd
        ? 'missing'
        : formattingOnly
          ? 'formatting'
          : 'invalid_order_or_value',
      deterministicCandidate: formattingOnly
        ? `${formatMinutes(humanStart)}|${formatMinutes(humanEnd)}`
        : null,
      candidateCount: formattingOnly ? 1 : 0
    })
  }
}

const summarize = rows => ({
  total: rows.length,
  deterministic: rows.filter(row => row.deterministicCandidate).length,
  ambiguous: rows.filter(row => row.candidateCount > 1).length,
  needsDecision: rows.filter(row => !row.deterministicCandidate).length
})

const report = {
  environment: endpoint,
  readOnly: true,
  activeAcademicYear: activeYear.name,
  activeClassCount: classes.length,
  activeSlotCount: activeSlots.length,
  remediation: {
    courseLinks: summarize(issues.missingCourse),
    teachers: {
      ...summarize(issues.missingTeacher),
      empty: issues.missingTeacher.filter(row => !row.placeholderOnly).length,
      placeholderOnly: issues.missingTeacher.filter(row => row.placeholderOnly).length
    },
    rooms: summarize(issues.missingRoom),
    times: summarize(issues.invalidTime)
  },
  timeBreakdown: {
    missing: issues.invalidTime.filter(row => row.kind === 'missing').length,
    formatting: issues.invalidTime.filter(row => row.kind === 'formatting').length,
    invalidOrderOrValue: issues.invalidTime.filter(row => row.kind === 'invalid_order_or_value').length
  },
  invalidTimeRows: issues.invalidTime,
  samples: {
    deterministicCourseLinks: issues.missingCourse.filter(row => row.deterministicCandidate).slice(0, 10),
    deterministicRooms: issues.missingRoom.filter(row => row.deterministicCandidate).slice(0, 10)
  }
}

if (process.argv.includes('--times-only')) {
  console.log(JSON.stringify({
    environment: endpoint,
    readOnly: true,
    activeAcademicYear: activeYear.name,
    invalidTimeRows: issues.invalidTime
  }, null, 2))
} else if (process.argv.includes('--summary')) {
  const { invalidTimeRows: _invalidTimeRows, ...summaryReport } = report
  console.log(JSON.stringify(summaryReport, null, 2))
} else {
  console.log(JSON.stringify(report, null, 2))
}
