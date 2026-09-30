import { supabase } from '@/supabase'
import { slotBelongsToAcademicYear } from '@/composables/useActiveAcademicYearContext'

const DEFAULT_PAGE_SIZE = 1000
const DEFAULT_LIMIT = 10000
const DEFAULT_TTL_MS = 60_000
const cache = new Map()
const inFlight = new Map()

function normalizeList(values = []) {
  return [...new Set(
    values
      .map(value => String(value || '').trim())
      .filter(Boolean)
  )].sort((left, right) => left.localeCompare(right, 'fr'))
}

function buildCacheKey({ classCodes, moduleCodes, weekNumber, select }) {
  return JSON.stringify({
    classCodes: normalizeList([...(classCodes || [])]),
    moduleCodes: normalizeList(moduleCodes),
    weekNumber: weekNumber ?? null,
    select
  })
}

export function clearSIPlanningQueryCache() {
  cache.clear()
  inFlight.clear()
}

export async function fetchPlanningSlotsPaginated({
  classCodes,
  moduleCodes = [],
  weekNumber = null,
  select = '*',
  pageSize = DEFAULT_PAGE_SIZE,
  limit = DEFAULT_LIMIT,
  ttlMs = DEFAULT_TTL_MS,
  force = false,
  client = supabase
} = {}) {
  if (!(classCodes instanceof Set) || classCodes.size === 0) {
    throw new Error('Impossible de charger le planning SI sans année académique active.')
  }

  const normalizedModules = normalizeList(moduleCodes)
  const cacheEnabled = client === supabase && ttlMs > 0
  const cacheKey = buildCacheKey({ classCodes, moduleCodes: normalizedModules, weekNumber, select })
  const now = Date.now()

  if (!force && cacheEnabled) {
    const cached = cache.get(cacheKey)
    if (cached && now - cached.createdAt < ttlMs) return cached.rows
    if (inFlight.has(cacheKey)) return inFlight.get(cacheKey)
  }

  const request = (async () => {
    const rows = []

    for (let offset = 0; offset < limit; offset += pageSize) {
      let query = client
        .from('planning_time_slots')
        .select(select)

      if (normalizedModules.length) query = query.in('module_code', normalizedModules)
      if (weekNumber != null) query = query.eq('week_number', weekNumber)

      query = query
        .order('id', { ascending: true })
        .range(offset, Math.min(offset + pageSize - 1, limit - 1))

      const { data, error } = await query
      if (error) throw error

      const page = data || []
      rows.push(...page)
      if (page.length < pageSize) break
    }

    const scopedRows = rows.filter(slot => slotBelongsToAcademicYear(slot, classCodes))
    if (cacheEnabled) cache.set(cacheKey, { rows: scopedRows, createdAt: Date.now() })
    return scopedRows
  })()

  if (cacheEnabled) inFlight.set(cacheKey, request)

  try {
    return await request
  } finally {
    if (cacheEnabled) inFlight.delete(cacheKey)
  }
}

export default {
  clearSIPlanningQueryCache,
  fetchPlanningSlotsPaginated
}
