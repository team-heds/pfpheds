import { computed, ref, unref } from 'vue'
import {
  ADMIN_DASHBOARD_DOMAINS,
  fetchAdminDashboardStats,
  mapAdminDashboardKpis,
} from '@/service/adminDashboardStatsService'

export function useAdminDashboardStats(options = {}) {
  const data = ref(null)
  const error = ref(null)
  const loading = ref(false)
  const refreshing = ref(false)
  let requestSequence = 0

  const domains = computed(() => unref(options.domains) || ADMIN_DASHBOARD_DOMAINS)
  const period = computed(() => unref(options.period) || 'month')
  const reference = computed(() => unref(options.reference) || null)
  const filters = computed(() => unref(options.filters) || {})

  const status = computed(() => {
    if (loading.value) return 'loading'
    if (error.value) return 'error'
    if (!data.value) return 'idle'
    const statuses = Object.values(data.value.domains || {}).map((domain) => domain.status)
    return statuses.some((entry) => entry !== 'ok') ? 'partial' : 'ready'
  })

  async function load({ force = false } = {}) {
    const sequence = ++requestSequence
    if (data.value) refreshing.value = true
    else loading.value = true
    error.value = null

    try {
      const response = await fetchAdminDashboardStats({
        domains: domains.value,
        period: period.value,
        reference: reference.value,
        filters: filters.value,
        force,
      })
      if (sequence === requestSequence) data.value = response
      return response
    } catch (requestError) {
      if (sequence === requestSequence) error.value = requestError
      throw requestError
    } finally {
      if (sequence === requestSequence) {
        loading.value = false
        refreshing.value = false
      }
    }
  }

  function refresh() {
    return load({ force: true })
  }

  function invalidatePendingResponse() {
    requestSequence += 1
  }

  function mapKpis(domain, configurations) {
    return computed(() => mapAdminDashboardKpis(domain, unref(configurations), data.value, {
      loading: loading.value || (!data.value && !error.value),
    }))
  }

  return {
    data,
    error,
    loading,
    refreshing,
    status,
    period,
    domains,
    filters,
    load,
    refresh,
    invalidatePendingResponse,
    mapKpis,
  }
}
