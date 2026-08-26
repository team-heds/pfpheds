import { computed, ref, unref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ADMIN_DASHBOARD_FILTER_KEYS,
  fetchAdminDashboardFilterOptions,
  normalizeAdminDashboardFilters,
} from '@/service/adminDashboardStatsService'

const OPTION_KEYS = Object.freeze({
  track: 'tracks',
  role: 'roles',
  class: 'classes',
  cohort: 'cohorts',
  pfp: 'pfpTypes',
  institution: 'institutions',
  status: 'statuses',
})

function filtersFromQuery(query = {}) {
  return normalizeAdminDashboardFilters(
    Object.fromEntries(
      ADMIN_DASHBOARD_FILTER_KEYS.map((key) => [key, query[key]]).filter(([, value]) => value),
    ),
  )
}

export function useAdminDashboardFilters(options = {}) {
  const route = options.route || useRoute()
  const router = options.router || useRouter()
  const filters = ref(filtersFromQuery(route.query))
  const catalog = ref(null)
  const loading = ref(false)
  const error = ref(null)
  let syncingUrl = false

  const activeFilters = computed(() => {
    const optionCatalog = catalog.value?.options || {}
    return Object.entries(filters.value).flatMap(([key, values]) => {
      const entries = optionCatalog[OPTION_KEYS[key]] || []
      return values.map((value) => ({
        key,
        value,
        id: `${key}:${value}`,
        label: entries.find((entry) => entry.value === value)?.label || value,
      }))
    })
  })

  function sanitizeFilters(candidate) {
    if (!catalog.value) return normalizeAdminDashboardFilters(candidate)
    const optionCatalog = catalog.value.options || {}
    return Object.fromEntries(
      Object.entries(normalizeAdminDashboardFilters(candidate))
        .map(([key, values]) => {
          const allowed = new Set((optionCatalog[OPTION_KEYS[key]] || []).map((entry) => entry.value))
          return [key, values.filter((value) => allowed.has(value))]
        })
        .filter(([, values]) => values.length),
    )
  }

  async function syncUrl() {
    syncingUrl = true
    const query = { ...route.query }
    for (const key of ADMIN_DASHBOARD_FILTER_KEYS) delete query[key]
    for (const [key, values] of Object.entries(filters.value)) query[key] = values
    const period = unref(options.period)
    if (period) query.period = period
    await router.replace({ query })
    syncingUrl = false
  }

  async function setFilters(nextFilters) {
    filters.value = sanitizeFilters(nextFilters)
    await syncUrl()
  }

  async function removeFilter(key, value) {
    const next = { ...filters.value, [key]: (filters.value[key] || []).filter((entry) => entry !== value) }
    await setFilters(next)
  }

  async function resetFilters() {
    await setFilters({})
  }

  async function loadOptions() {
    loading.value = true
    error.value = null
    try {
      catalog.value = await fetchAdminDashboardFilterOptions({ domains: unref(options.domains) })
      const sanitized = sanitizeFilters(filters.value)
      if (JSON.stringify(sanitized) !== JSON.stringify(filters.value)) {
        filters.value = sanitized
        await syncUrl()
      }
      return catalog.value
    } catch (requestError) {
      error.value = requestError
      throw requestError
    } finally {
      loading.value = false
    }
  }

  watch(
    () => route.query,
    (query) => {
      if (!syncingUrl) filters.value = sanitizeFilters(filtersFromQuery(query))
    },
  )

  if (options.period) {
    watch(
      () => unref(options.period),
      () => syncUrl(),
    )
  }

  return {
    activeFilters,
    applicability: computed(() => catalog.value?.applicability || {}),
    catalog,
    error,
    filters,
    loading,
    loadOptions,
    removeFilter,
    resetFilters,
    setFilters,
  }
}
