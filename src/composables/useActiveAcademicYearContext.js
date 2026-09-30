import { computed, ref } from 'vue'
import academicYearService from '@/service/academicYearService'

const activeAcademicYear = ref(null)
const activeYearClasses = ref([])
const loading = ref(false)
const error = ref(null)

let loadPromise = null
let hasLoaded = false

export function normalizeAcademicClassCode(value) {
  return String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/_/g, '-')
}

export function getAcademicClassCodeAliases(value) {
  const normalized = normalizeAcademicClassCode(value)
  if (!normalized) return []

  const aliases = new Set([normalized])
  const bacMatch = normalized.match(/^BAC(\d{2})(-.+)?$/)
  if (bacMatch) aliases.add(`B${bacMatch[1]}${bacMatch[2] || ''}`)

  const bachelorMatch = normalized.match(/^B(\d{2})(-.+)?$/)
  if (bachelorMatch) aliases.add(`BAC${bachelorMatch[1]}${bachelorMatch[2] || ''}`)

  return Array.from(aliases)
}

export function buildAcademicClassCodeSet(classes = []) {
  return new Set(
    classes
      .flatMap(item => getAcademicClassCodeAliases(item?.code))
      .filter(Boolean)
  )
}

export function slotBelongsToAcademicYear(slot, classCodes) {
  if (!(classCodes instanceof Set) || classCodes.size === 0) return false

  const values = []
  if (Array.isArray(slot?.class_codes)) values.push(...slot.class_codes)
  if (slot?.class_code) values.push(slot.class_code)

  return values.some(value =>
    getAcademicClassCodeAliases(value).some(alias => classCodes.has(alias))
  )
}

async function loadActiveAcademicYearContext({ force = false } = {}) {
  if (!force && hasLoaded) return activeAcademicYear.value
  if (!force && loadPromise) return loadPromise

  loading.value = true
  error.value = null

  loadPromise = (async () => {
    try {
      const year = await academicYearService.getActiveAcademicYear()
      const classes = year?.id
        ? await academicYearService.getClassesByAcademicYear(year.id)
        : []

      activeAcademicYear.value = year || null
      activeYearClasses.value = classes || []
      hasLoaded = true
      return activeAcademicYear.value
    } catch (loadError) {
      activeAcademicYear.value = null
      activeYearClasses.value = []
      error.value = loadError
      throw loadError
    } finally {
      loading.value = false
      loadPromise = null
    }
  })()

  return loadPromise
}

export function resetActiveAcademicYearContext() {
  activeAcademicYear.value = null
  activeYearClasses.value = []
  error.value = null
  hasLoaded = false
  loadPromise = null
}

export function useActiveAcademicYearContext() {
  const activeYearName = computed(() => activeAcademicYear.value?.name || '')
  const activeYearId = computed(() => activeAcademicYear.value?.id || null)
  const academicStartYear = computed(() => {
    const nameMatch = String(activeAcademicYear.value?.name || '').match(/(\d{4})/)
    if (nameMatch) return Number(nameMatch[1])

    const startDate = activeAcademicYear.value?.start_date
    if (!startDate) return null
    const parsed = new Date(startDate).getFullYear()
    return Number.isFinite(parsed) ? parsed : null
  })
  const activeClassCodes = computed(() => buildAcademicClassCodeSet(activeYearClasses.value))

  return {
    activeAcademicYear,
    activeYearClasses,
    activeYearName,
    activeYearId,
    academicStartYear,
    activeClassCodes,
    loading,
    error,
    loadActiveAcademicYearContext
  }
}
