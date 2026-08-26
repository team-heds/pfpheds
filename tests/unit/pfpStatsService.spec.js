import { beforeEach, describe, expect, it, vi } from 'vitest'

const { fromMock } = vi.hoisted(() => ({ fromMock: vi.fn() }))

vi.mock('@/supabase', () => ({ supabase: { from: fromMock } }))

import { clearPfpCohortStatsCache, createEmptyPfpStats, getPfpCohortStats } from '@/service/pfpStatsService'
import { SUPABASE_SELECTS } from '@/service/supabaseContracts'

describe('pfpStatsService PFP1B', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearPfpCohortStatsCache()
  })

  it('retourne toujours les deux cohortes avec des objets indépendants', () => {
    const stats = createEmptyPfpStats()
    stats.PFP1A.byCantons.VD = { total: 1 }

    expect(stats.PFP1B).toEqual({
      total: 0,
      assigned: 0,
      available: 0,
      byCantons: {},
      topCantons: []
    })
  })

  it('calcule PFP1A et PFP1B depuis JSONB ou JSON sérialisé', async () => {
    fromMock.mockImplementation((table) => ({
      select: vi.fn((selection) => {
        if (table === 'places') {
          expect(selection).toBe(SUPABASE_SELECTS.pfpStatsPlaces)
          return Promise.resolve({
            data: [
              { PlaceId: 'p1', InstitutionId: 'i1', PFP1A: { 2026: 2 }, PFP1B: { 2026: 3 } },
              { PlaceId: 'p2', InstitutionId: 'i1', PFP1A: null, PFP1B: '{"2026":"4"}' }
            ],
            error: null
          })
        }
        expect(selection).toBe(SUPABASE_SELECTS.pfpStatsInstitutions)
        return Promise.resolve({ data: [{ InstitutionId: 'i1', Canton: 'FR' }], error: null })
      })
    }))

    const stats = await getPfpCohortStats()

    expect(stats.PFP1A.total).toBe(2)
    expect(stats.PFP1B.total).toBe(7)
    expect(stats.PFP1B.available).toBe(7)
    expect(stats.PFP1B.topCantons).toMatchObject([{ label: 'FR', value: 7 }])
  })

  it('signale explicitement une erreur de lecture au lieu de fabriquer des zéros', async () => {
    fromMock.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: null, error: { message: 'column missing' } })
    })

    await expect(getPfpCohortStats()).rejects.toThrow('Impossible de charger les places PFP')
  })

  it('partage une lecture simultanée entre les deux widgets de cohorte', async () => {
    let resolvePlaces
    const places = new Promise((resolve) => { resolvePlaces = resolve })
    fromMock.mockImplementation((table) => ({
      select: vi.fn(() => table === 'places'
        ? places
        : Promise.resolve({ data: [], error: null })),
    }))

    const first = getPfpCohortStats()
    const second = getPfpCohortStats()
    expect(fromMock).toHaveBeenCalledTimes(1)
    resolvePlaces({ data: [], error: null })

    await expect(Promise.all([first, second])).resolves.toHaveLength(2)
    expect(fromMock).toHaveBeenCalledTimes(1)
  })
})
