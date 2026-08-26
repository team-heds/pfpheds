import { getAcademicYearKeys } from '@/service/offerProposalMatchingService'

export const PLACEMENT_NEEDS_PFPS = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']
export const PLACEMENT_NEEDS_CRITERIA = ['MSQ', 'SYSINT', 'NEUROGER', 'AIGU', 'REHAB', 'AMBU']

const isTrue = value => value === true || value === 'true' || value === 1 || value === '1'
const normalizeId = value => String(value ?? '').trim()

export function normalizeClassCode(value) {
  const normalized = normalizeId(value).toUpperCase()
  const match = normalized.match(/BA\s*(\d{2})/)
  return match ? `BA${match[1]}` : normalized
}

export function getTargetClass(year, pfp) {
  const numericYear = Number(year)
  if (!Number.isInteger(numericYear)) return ''
  const offset = pfp === 'PFP1A' || pfp === 'PFP1B' ? 1 : pfp === 'PFP2' ? 2 : 3
  return `BA${String((numericYear - offset) % 100).padStart(2, '0')}`
}

function readCapacity(place, pfp, year) {
  const source = place?.[pfp]
  if (!source || typeof source !== 'object' || Array.isArray(source)) return 0
  for (const key of getAcademicYearKeys(year)) {
    const value = Number(source[key])
    if (Number.isFinite(value) && value > 0) return value
  }
  return 0
}

function parseStages(value) {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? Object.values(parsed) : []
    } catch {
      return []
    }
  }
  return typeof value === 'object' ? Object.values(value) : []
}

function extractCriteria(source) {
  const criteria = new Set()
  for (const criterion of PLACEMENT_NEEDS_CRITERIA) {
    if (isTrue(source?.[criterion]) || isTrue(source?.[criterion.toLowerCase()])) criteria.add(criterion)
  }
  return criteria
}

export function buildPlacementNeeds({ places = [], students = [], physioRows = [], resultRows = [], year, pfp } = {}) {
  const normalizedPfp = normalizeId(pfp).toUpperCase()
  const targetClass = getTargetClass(year, normalizedPfp)
  const placeMap = new Map(places.map(place => [normalizeId(place?.PlaceId), place]))
  const studentsInClass = students.filter(student => normalizeClassCode(student?.Classe || student?.classe) === targetClass)
  const studentIds = new Set(studentsInClass.map(student => normalizeId(student?.id || student?.user_id)).filter(Boolean))

  const validatedPfpIds = new Set()
  const completedCriteria = new Map([...studentIds].map(id => [id, new Set()]))

  for (const row of physioRows) {
    const userId = normalizeId(row?.user_id)
    if (!studentIds.has(userId)) continue
    const stages = [...parseStages(row?.pfp_valided), ...parseStages(row?.pfp2_data)]
    for (const stage of stages) {
      for (const criterion of extractCriteria(stage)) completedCriteria.get(userId).add(criterion)
      const placeId = normalizeId(stage?.PlaceId || stage?.ID_PFP || stage?.id_pfp)
      if (placeMap.has(placeId)) {
        for (const criterion of extractCriteria(placeMap.get(placeId))) completedCriteria.get(userId).add(criterion)
      }
    }
  }

  for (const row of resultRows) {
    const userId = normalizeId(row?.user_id)
    if (!studentIds.has(userId) || !isTrue(row?.pfp_validee)) continue
    const resultPfp = normalizeId(row?.pfp_type).toUpperCase()
    if (resultPfp === normalizedPfp) validatedPfpIds.add(userId)
    const place = placeMap.get(normalizeId(row?.assigned_place_id))
    if (place) {
      for (const criterion of extractCriteria(place)) completedCriteria.get(userId).add(criterion)
    }
  }

  const studentsToPlace = Math.max(0, studentIds.size - validatedPfpIds.size)
  const offered = places.reduce((sum, place) => sum + readCapacity(place, normalizedPfp, year), 0)
  const missing = Math.max(0, studentsToPlace - offered)
  const surplus = Math.max(0, offered - studentsToPlace)

  const criteria = PLACEMENT_NEEDS_CRITERIA.map(criterion => {
    const need = [...studentIds].filter(id => !completedCriteria.get(id)?.has(criterion)).length
    const capacity = places.reduce((sum, place) => {
      return extractCriteria(place).has(criterion) ? sum + readCapacity(place, normalizedPfp, year) : sum
    }, 0)
    return {
      criterion,
      need,
      capacity,
      missing: Math.max(0, need - capacity),
      surplus: Math.max(0, capacity - need),
      coverage: need > 0 ? Math.round((capacity / need) * 100) : capacity > 0 ? 100 : 0
    }
  })

  return {
    year: normalizeId(year),
    pfp: normalizedPfp,
    targetClass,
    studentCount: studentIds.size,
    studentsToPlace,
    offered,
    missing,
    surplus,
    coverage: studentsToPlace > 0 ? Math.round((offered / studentsToPlace) * 100) : offered > 0 ? 100 : 0,
    criteria
  }
}

export async function loadPlacementNeedsSourceData() {
  const [{ supabase }, { default: studentsService }] = await Promise.all([
    import('@/supabase'),
    import('@/service/studentsService')
  ])
  const [students, physioResult, resultVoteResult] = await Promise.all([
    studentsService.getAllStudents(),
    supabase.from('StudentsPhysio').select('user_id,pfp_valided,pfp2_data'),
    supabase.from('student_result_vote').select('user_id,pfp_type,pfp_validee,assigned_place_id')
  ])

  if (physioResult.error) throw physioResult.error
  if (resultVoteResult.error) throw resultVoteResult.error
  return {
    students: students || [],
    physioRows: physioResult.data || [],
    resultRows: resultVoteResult.data || []
  }
}
