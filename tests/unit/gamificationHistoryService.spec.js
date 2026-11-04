import { beforeEach, describe, expect, it, vi } from 'vitest'

const query = {
  select: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
  in: vi.fn(),
}

vi.mock('@/supabase', () => ({
  supabase: { from: vi.fn(() => query) },
}))

const { supabase } = await import('@/supabase')
const { getGamificationHistory, presentGamificationHistoryItem } = await import('@/service/gamificationHistoryService.js')

describe('gamificationHistoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    query.select.mockReturnValue(query)
    query.eq.mockReturnValue(query)
    query.order.mockReturnValue(query)
    query.range.mockResolvedValue({ data: [], count: 0, error: null })
    query.in.mockResolvedValue({ data: [], error: null })
  })

  it('présente les actions connues sans exposer les clés techniques', () => {
    const item = presentGamificationHistoryItem({
      id: 'history-1', action: 'LOGIN', amount: 5, occurred_at: '2026-09-22T08:00:00Z',
      total_xp_after: 105, event_key: 'login:2026-09-22', metadata: { secret: true },
    })

    expect(item).toMatchObject({ label: 'Connexion quotidienne', points: 5, totalAfter: 105 })
    expect(item).not.toHaveProperty('event_key')
    expect(item).not.toHaveProperty('metadata')
    expect(item).not.toHaveProperty('action')
  })

  it('utilise un libellé neutre pour une action inconnue', () => {
    const item = presentGamificationHistoryItem({ id: 'history-2', action: 'INTERNAL_EVENT', amount: 3 })
    expect(item.label).toBe('Progression gamification')
    expect(item.detail).not.toContain('INTERNAL_EVENT')
  })

  it('pagine la lecture et ne sélectionne aucun champ technique sensible', async () => {
    query.range.mockResolvedValue({
      data: [{ id: 'history-1', action: 'LOGIN', amount: 5, occurred_at: '2026-09-22T08:00:00Z' }],
      count: 21,
      error: null,
    })

    const result = await getGamificationHistory('user-1', { page: 2, pageSize: 10 })

    expect(supabase.from).toHaveBeenCalledWith('xp_history')
    expect(query.select).toHaveBeenCalledWith(
      'id,amount,action,source_type,source_id,total_xp_after,occurred_at',
      { count: 'exact' },
    )
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(query.range).toHaveBeenCalledWith(10, 19)
    expect(result).toMatchObject({ page: 2, pageSize: 10, total: 21, hasMore: true })
  })

  it('résout le nom sûr de l’objet lié sans renvoyer son identifiant', async () => {
    query.range.mockResolvedValue({
      data: [{ id: 'history-1', action: 'BADGE_UNLOCK', amount: 20, source_type: 'badge', source_id: 'badge-1' }],
      count: 1,
      error: null,
    })
    query.in.mockResolvedValue({ data: [{ id: 'badge-1', name: 'Premier pas' }], error: null })

    const result = await getGamificationHistory('user-1')

    expect(result.items[0].linkedObject).toEqual({ type: 'Badge', name: 'Premier pas' })
    expect(result.items[0]).not.toHaveProperty('source_id')
  })

  it('refuse une lecture sans utilisateur', async () => {
    await expect(getGamificationHistory(null)).rejects.toThrow('Un utilisateur est requis')
  })
})
