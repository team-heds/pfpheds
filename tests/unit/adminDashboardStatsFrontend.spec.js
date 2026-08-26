import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/service/apiClient', () => ({
  API_URL: 'https://api.example.test/api',
  authFetch: vi.fn(),
}))

import { authFetch } from '@/service/apiClient'
import {
  buildAdminDashboardFilterOptionsUrl,
  buildAdminDashboardStatsUrl,
  clearAdminDashboardStatsCache,
  fetchAdminDashboardFilterOptions,
  fetchAdminDashboardStats,
  mapAdminDashboardKpis,
  normalizeAdminDashboardFilters,
  validateAdminDashboardStatsResponse,
} from '@/service/adminDashboardStatsService'

function metric(value = 0, overrides = {}) {
  return {
    value,
    status: 'ok',
    source: 'public.test',
    asOf: '2026-08-26T08:00:00.000Z',
    period: { key: 'month', timezone: 'Europe/Zurich' },
    semantics: 'flow',
    comparison: {
      value: 2,
      status: 'ok',
      absoluteChange: value - 2,
      percentChange: value === 4 ? 100 : 0,
      period: { key: 'month', timezone: 'Europe/Zurich' },
      error: null,
    },
    error: null,
    ...overrides,
  }
}

function payload(domains = { general: { status: 'ok', metrics: { users: metric(4) } } }) {
  return {
    version: '1',
    asOf: '2026-08-26T08:00:00.000Z',
    period: { key: 'month', timezone: 'Europe/Zurich' },
    previousPeriod: { key: 'month', timezone: 'Europe/Zurich' },
    domains,
  }
}

describe('adminDashboardStatsService', () => {
  beforeEach(() => {
    clearAdminDashboardStatsCache()
    vi.clearAllMocks()
  })

  it('construit la route authentifiée avec domaines, période et référence', () => {
    expect(buildAdminDashboardStatsUrl({
      domains: ['pfp', 'general', 'pfp'],
      period: 'week',
      reference: '2026-08-26',
    })).toBe('https://api.example.test/api/admin-dashboard/v1/stats?domains=general%2Cpfp&period=week&reference=2026-08-26')
  })

  it('sérialise les filtres dans un ordre canonique et construit la route des options', () => {
    expect(normalizeAdminDashboardFilters({ class: ['BA25', 'BA24', 'BA25'], pfp: 'PFP2' }))
      .toEqual({ class: ['BA24', 'BA25'], pfp: ['PFP2'] })
    expect(buildAdminDashboardStatsUrl({
      domains: ['pfp'],
      filters: { class: ['BA25', 'BA24'], institution: ['Clinique Test'] },
    })).toBe('https://api.example.test/api/admin-dashboard/v1/stats?domains=pfp&period=month&class=BA24&class=BA25&institution=Clinique+Test')
    expect(buildAdminDashboardFilterOptionsUrl({ domains: ['academic', 'pfp'] }))
      .toBe('https://api.example.test/api/admin-dashboard/v1/filter-options?domains=pfp%2Cacademic')
  })

  it('déduplique deux demandes identiques simultanées', async () => {
    let resolveResponse
    authFetch.mockReturnValue(new Promise((resolve) => { resolveResponse = resolve }))

    const first = fetchAdminDashboardStats({ domains: ['general'], period: 'month' })
    const second = fetchAdminDashboardStats({ domains: ['general'], period: 'month' })
    expect(authFetch).toHaveBeenCalledTimes(1)

    resolveResponse({ json: async () => payload() })
    await expect(first).resolves.toEqual(payload())
    await expect(second).resolves.toEqual(payload())
  })

  it('réutilise le cache et permet un rafraîchissement forcé', async () => {
    authFetch.mockResolvedValue({ json: async () => payload() })
    await fetchAdminDashboardStats({ domains: ['general'] })
    await fetchAdminDashboardStats({ domains: ['general'] })
    expect(authFetch).toHaveBeenCalledTimes(1)

    await fetchAdminDashboardStats({ domains: ['general'], force: true })
    expect(authFetch).toHaveBeenCalledTimes(2)
  })

  it('sépare le cache de deux sélections de filtres différentes', async () => {
    authFetch.mockResolvedValue({ json: async () => payload() })
    await fetchAdminDashboardStats({ domains: ['general'], filters: { class: ['BA24'] } })
    await fetchAdminDashboardStats({ domains: ['general'], filters: { class: ['BA25'] } })
    expect(authFetch).toHaveBeenCalledTimes(2)
  })

  it('charge les options uniquement avec authFetch et valide leur contrat', async () => {
    const optionsPayload = {
      version: '1',
      domains: ['pfp'],
      options: { pfpTypes: [{ value: 'PFP2', label: 'PFP2' }] },
      applicability: { pfp: { domains: ['pfp'], metrics: ['places'] } },
    }
    authFetch.mockResolvedValue({ json: async () => optionsPayload })
    await expect(fetchAdminDashboardFilterOptions({ domains: ['pfp'] })).resolves.toEqual(optionsPayload)
    expect(authFetch).toHaveBeenCalledWith(
      'https://api.example.test/api/admin-dashboard/v1/filter-options?domains=pfp',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('préserve un vrai zéro et transforme une erreur en valeur indisponible', () => {
    const response = payload({
      general: {
        status: 'partial',
        metrics: {
          users: metric(0),
          roles: metric(null, {
            status: 'error',
            comparison: { status: 'unavailable' },
            error: 'UPSTREAM_QUERY_FAILED',
          }),
        },
      },
    })
    const configs = [
      { id: 'total_users', dataKey: 'users' },
      { id: 'total_roles', dataKey: 'roles' },
    ]
    const mapped = mapAdminDashboardKpis('general', configs, response)

    expect(mapped[0]).toMatchObject({ value: 0, status: 'ok' })
    expect(mapped[1]).toMatchObject({ value: null, status: 'error', error: 'UPSTREAM_QUERY_FAILED' })
  })

  it('mappe les clés métier du serveur vers les clés historiques de l’UI', () => {
    const response = payload({
      pfp: {
        status: 'ok',
        metrics: {
          students: metric(184),
          pfpInProgress: metric(12),
        },
      },
    })
    const mapped = mapAdminDashboardKpis('pfp', [
      { id: 'students_count', dataKey: 'etudiants' },
      { id: 'pfp_ongoing', dataKey: 'pfpEnCours' },
    ], response)

    expect(mapped.map((entry) => entry.value)).toEqual([184, 12])
    expect(mapped[0].previousValue).toBe(2)
  })

  it('rejette un contrat qui présente une erreur comme une valeur zéro', () => {
    const invalid = payload({
      general: {
        status: 'error',
        metrics: { users: metric(0, { status: 'error' }) },
      },
    })
    expect(() => validateAdminDashboardStatsResponse(invalid, ['general']))
      .toThrow('expose une valeur')
  })

  it('rejette une comparaison indisponible qui expose encore une valeur', () => {
    const invalid = payload({
      general: {
        status: 'partial',
        metrics: {
          users: metric(4, {
            comparison: {
              value: 2,
              status: 'unavailable',
              absoluteChange: null,
              percentChange: null,
              period: { key: 'month', timezone: 'Europe/Zurich' },
              error: 'HISTORY_UNAVAILABLE',
            },
          }),
        },
      },
    })

    expect(() => validateAdminDashboardStatsResponse(invalid, ['general']))
      .toThrow('expose une valeur')
  })
})
