import { supabase } from '@/supabase'

export const BADGE_ACTIONS = Object.freeze([
  { label: 'Connexion quotidienne', value: 'LOGIN' },
  { label: 'Mise à jour du profil', value: 'PROFILE_UPDATE' },
  { label: 'Publication créée', value: 'POST' }
])

const SUPPORTED_ACTIONS = new Set(BADGE_ACTIONS.map(({ value }) => value))

export const readBadgeCondition = (conditions = {}) => {
  if (conditions.total_xp) {
    return { type: 'total_xp', target: Number(conditions.total_xp), actionType: null }
  }
  if (conditions.level) {
    return { type: 'level', target: Number(conditions.level), actionType: null }
  }
  if (conditions.action_count) {
    const nested = typeof conditions.action_count === 'object' ? conditions.action_count : conditions
    return {
      type: 'action_count',
      target: Number(nested.count || conditions.count || 0),
      actionType: String(nested.action_type || conditions.action_type || '').toUpperCase()
    }
  }
  return { type: 'unsupported', target: 0, actionType: null }
}

export const formatBadgeCondition = (condition) => {
  if (condition.type === 'total_xp') return `Atteindre ${condition.target} XP`
  if (condition.type === 'level') return `Atteindre le niveau ${condition.target}`
  if (condition.type === 'action_count') {
    const action = BADGE_ACTIONS.find(({ value }) => value === condition.actionType)?.label
      || condition.actionType
    return `${action} · ${condition.target} fois`
  }
  return 'Condition non supportée'
}

const normalizeBadge = (badge, unlockedCount = 0) => {
  const condition = readBadgeCondition(badge.conditions)
  return {
    ...badge,
    points: Number(badge.xp_bonus || 0),
    xpBonus: Number(badge.xp_bonus || 0),
    category: badge.conditions?.category || 'general',
    condition,
    conditionLabel: formatBadgeCondition(condition),
    active: Boolean(badge.is_active),
    createdAt: badge.created_at,
    unlockedCount
  }
}

class AdminBadgesService {
  async getBadges() {
    const [{ data: badges, error: badgesError }, { data: awards, error: awardsError }] = await Promise.all([
      supabase
        .from('badges')
        .select('id,name,description,icon,rarity,xp_bonus,conditions,is_active,created_at')
        .order('created_at', { ascending: false }),
      supabase.from('user_badges').select('badge_id')
    ])
    if (badgesError) throw badgesError
    if (awardsError) throw awardsError

    const counts = (awards || []).reduce((result, { badge_id: badgeId }) => {
      result.set(badgeId, (result.get(badgeId) || 0) + 1)
      return result
    }, new Map())

    return (badges || []).map((badge) => normalizeBadge(badge, counts.get(badge.id) || 0))
  }

  toPayload(badgeData) {
    const target = Number(badgeData.conditionTarget)
    if (!['total_xp', 'level', 'action_count'].includes(badgeData.conditionType)) {
      throw new Error('Sélectionnez une condition supportée.')
    }
    if (!Number.isInteger(target) || target <= 0) {
      throw new Error('La valeur cible doit être un entier positif.')
    }

    const conditions = { category: badgeData.category || 'general' }
    if (badgeData.conditionType === 'action_count') {
      const actionType = String(badgeData.actionType || '').toUpperCase()
      if (!SUPPORTED_ACTIONS.has(actionType)) {
        throw new Error('Cette action n’est pas supportée par le moteur sécurisé.')
      }
      Object.assign(conditions, { action_count: true, action_type: actionType, count: target })
    } else {
      conditions[badgeData.conditionType] = target
    }

    return {
      name: String(badgeData.name || '').trim(),
      description: String(badgeData.description || '').trim(),
      icon: String(badgeData.icon || 'pi pi-star').trim(),
      rarity: badgeData.rarity,
      xp_bonus: Number(badgeData.xpBonus || 0),
      conditions,
      is_active: badgeData.isActive !== false
    }
  }

  async createBadge(badgeData) {
    const { data, error } = await supabase
      .from('badges')
      .insert(this.toPayload(badgeData))
      .select()
      .single()
    if (error) throw error
    return normalizeBadge(data)
  }

  async updateBadge(badgeId, badgeData) {
    const { data, error } = await supabase
      .from('badges')
      .update(this.toPayload(badgeData))
      .eq('id', badgeId)
      .select()
      .single()
    if (error) throw error
    return normalizeBadge(data)
  }

  async deactivateBadge(badgeId) {
    const { error } = await supabase.from('badges').update({ is_active: false }).eq('id', badgeId)
    if (error) throw error
    return true
  }

  async previewCatalogAlignment() {
    const { data, error } = await supabase.rpc('preview_gamification_catalog_alignment')
    if (error) throw error
    return data
  }
}

export default new AdminBadgesService()
