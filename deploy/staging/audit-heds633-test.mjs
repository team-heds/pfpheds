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
const client = createClient(endpoint, env.STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const check = ({ data, error }) => {
  if (error) throw error
  return data || []
}

const normalize = value => String(value || '').replace(/\s+/g, ' ').trim()
const lookup = value => normalize(value).toUpperCase().replace(/\s+/g, '').replace(/_/g, '-')
const aliases = value => {
  const normalized = lookup(value)
  const result = new Set(normalized ? [normalized] : [])
  const bac = normalized.match(/^BAC(\d{2})(-.+)?$/)
  if (bac) result.add(`B${bac[1]}${bac[2] || ''}`)
  const bachelor = normalized.match(/^B(\d{2})(-.+)?$/)
  if (bachelor) result.add(`BAC${bachelor[1]}${bachelor[2] || ''}`)
  return result
}
const isPostulation = value => {
  const text = normalize(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  return ['postulation', 'postulat', 'repourvoir', 'repourv', 'reattribuer', 'reattrib'].some(label => text.includes(label))
}
const teacherValues = slot => Array.isArray(slot.teachers) ? slot.teachers : [slot.teachers]
const isPostulationSlot = slot => [
  ...teacherValues(slot),
  slot.notes,
  slot.course_title,
  slot.activity,
  slot.activity_type
].some(value => isPostulation(typeof value === 'object' ? value?.name : value))

const activeYears = check(await client.from('academic_years').select('id,name').eq('is_active', true))
if (activeYears.length !== 1) throw new Error(`Expected one active academic year, found ${activeYears.length}`)
const activeYear = activeYears[0]
const classes = check(await client.from('classes').select('code').eq('academic_year_id', activeYear.id))
const activeCodes = new Set(classes.flatMap(row => [...aliases(row.code)]))
if (!activeCodes.size) throw new Error('The active academic year has no class codes')

const slots = []
for (let offset = 0; offset < 10000; offset += 1000) {
  const page = check(await client.from('planning_time_slots').select('*').order('id').range(offset, offset + 999))
  slots.push(...page)
  if (page.length < 1000) break
}

const activeSlots = slots.filter(slot => {
  const values = [...(Array.isArray(slot.class_codes) ? slot.class_codes : []), slot.class_code].filter(Boolean)
  return values.some(value => [...aliases(value)].some(alias => activeCodes.has(alias)))
})
const postulations = activeSlots.filter(isPostulationSlot)
const courses = check(await client.from('courses').select('id'))
const courseIds = new Set(courses.map(row => String(row.id)))
const validCourseIdsByModule = new Map()

for (const slot of activeSlots) {
  const moduleCode = normalize(slot.module_code).toLowerCase()
  const courseId = String(slot.course_id || '')
  if (!moduleCode || !courseId || !courseIds.has(courseId)) continue
  if (!validCourseIdsByModule.has(moduleCode)) validCourseIdsByModule.set(moduleCode, new Set())
  validCourseIdsByModule.get(moduleCode).add(courseId)
}

const quality = postulations.reduce((result, slot) => {
  const direct = String(slot.course_id || '')
  const candidates = validCourseIdsByModule.get(normalize(slot.module_code).toLowerCase()) || new Set()
  if (direct && courseIds.has(direct)) result.direct += 1
  else if (!direct && candidates.size === 1) result.inferredUnique += 1
  else result.missingOrAmbiguous += 1
  if (!normalize(slot.day)) result.missingDay += 1
  if (!normalize(slot.course_title)) result.missingTitle += 1
  return result
}, { direct: 0, inferredUnique: 0, missingOrAmbiguous: 0, missingDay: 0, missingTitle: 0 })

console.log(JSON.stringify({
  environment: endpoint,
  activeAcademicYear: activeYear.name,
  classCodes: [...activeCodes].sort(),
  planningSlotsFetched: slots.length,
  activePlanningSlots: activeSlots.length,
  postulationSlots: postulations.length,
  ...quality
}, null, 2))
