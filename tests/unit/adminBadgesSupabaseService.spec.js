import { beforeEach, describe, expect, it, vi } from 'vitest'

const { from, rpc, queries } = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
  queries: []
}))

const makeQuery = (table) => {
  const state = { table, action: 'select', payload: null }
  const query = {
    select: vi.fn(() => query),
    order: vi.fn(() => query),
    insert: vi.fn((payload) => { state.action = 'insert'; state.payload = payload; return query }),
    update: vi.fn((payload) => { state.action = 'update'; state.payload = payload; return query }),
    eq: vi.fn(() => query),
    single: vi.fn(() => Promise.resolve({
      data: { id: 'badge-1', ...state.payload, created_at: '2026-09-21T10:00:00Z' },
      error: null
    })),
    then: (resolvePromise) => {
      queries.push(state)
      const data = table === 'badges'
        ? [{ id: 'badge-1', name: 'Premier post', xp_bonus: 15, rarity: 'common', conditions: { action_count: true, action_type: 'POST', count: 1 }, is_active: true }]
        : [{ badge_id: 'badge-1' }, { badge_id: 'badge-1' }]
      return Promise.resolve({ data, error: null }).then(resolvePromise)
    }
  }
  return query
}

vi.mock('@/supabase', () => ({
  supabase: {
    from: (...args) => from(...args),
    rpc
  }
}))

import adminBadgesService, {
  formatBadgeCondition,
  readBadgeCondition
} from '@/service/adminBadgesService'

describe('adminBadgesService Supabase', () => {
  beforeEach(() => {
    queries.length = 0
    from.mockReset()
    from.mockImplementation((table) => makeQuery(table))
    rpc.mockReset()
  })

  it('normalise les conditions et compte les attributions', async () => {
    const badges = await adminBadgesService.getBadges()

    expect(badges[0]).toMatchObject({
      id: 'badge-1',
      unlockedCount: 2,
      active: true,
      condition: { type: 'action_count', actionType: 'POST', target: 1 }
    })
    expect(badges[0].conditionLabel).toContain('Publication créée')
  })

  it('produit uniquement le format de condition compris par le moteur', () => {
    expect(adminBadgesService.toPayload({
      name: 'Profil prêt',
      description: 'Compléter son profil',
      category: 'debut',
      rarity: 'common',
      xpBonus: 10,
      conditionType: 'action_count',
      conditionTarget: 1,
      actionType: 'PROFILE_UPDATE'
    }).conditions).toEqual({
      category: 'debut',
      action_count: true,
      action_type: 'PROFILE_UPDATE',
      count: 1
    })

    expect(() => adminBadgesService.toPayload({
      conditionType: 'action_count',
      conditionTarget: 1,
      actionType: 'COMMENT_CREATE'
    })).toThrow(/pas supportée/)
  })

  it('désactive un badge au lieu de le supprimer', async () => {
    await expect(adminBadgesService.deactivateBadge('badge-1')).resolves.toBe(true)
    const update = queries.find(({ table, action }) => table === 'badges' && action === 'update')
    expect(update.payload).toEqual({ is_active: false })
    expect(from).not.toHaveBeenCalledWith('firebase')
  })

  it('charge le diagnostic agrégé sans écriture', async () => {
    rpc.mockResolvedValue({ data: { unsupported_active_badges: 0, write_performed: false }, error: null })
    await expect(adminBadgesService.previewCatalogAlignment()).resolves.toMatchObject({
      unsupported_active_badges: 0,
      write_performed: false
    })
    expect(rpc).toHaveBeenCalledWith('preview_gamification_catalog_alignment')
  })

  it('lit aussi les anciennes conditions imbriquées sans les publier', () => {
    const condition = readBadgeCondition({ action_count: { action_type: 'POST', count: 10 } })
    expect(condition).toEqual({ type: 'action_count', actionType: 'POST', target: 10 })
    expect(formatBadgeCondition(condition)).toBe('Publication créée · 10 fois')
  })
})
