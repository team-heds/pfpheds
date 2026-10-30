import { supabase } from '@/supabase'

const BADGE_FIELDS = 'id,name,description,icon,rarity,xp_bonus,conditions,is_active,created_at'

class AdminBadgesService {
  async getBadges() {
    const { data, error } = await supabase
      .from('badges')
      .select(BADGE_FIELDS)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getUnlockCounts() {
    const { data, error } = await supabase
      .from('user_badges')
      .select('badge_id')

    if (error) throw error
    return (data || []).reduce((counts, row) => {
      counts[row.badge_id] = (counts[row.badge_id] || 0) + 1
      return counts
    }, {})
  }

  async createBadge(badge) {
    const { data, error } = await supabase
      .from('badges')
      .insert(this.toDatabasePayload(badge))
      .select(BADGE_FIELDS)
      .single()

    if (error) throw error
    return data
  }

  async updateBadge(id, badge) {
    const { data, error } = await supabase
      .from('badges')
      .update(this.toDatabasePayload(badge))
      .eq('id', id)
      .select(BADGE_FIELDS)
      .single()

    if (error) throw error
    return data
  }

  async setBadgeActive(id, isActive) {
    const { data, error } = await supabase
      .from('badges')
      .update({ is_active: isActive })
      .eq('id', id)
      .select(BADGE_FIELDS)
      .single()

    if (error) throw error
    return data
  }

  toDatabasePayload(badge) {
    const category = badge.category || 'general'
    const conditions = { category }

    if (badge.condition_type === 'total_xp') {
      conditions.total_xp = Number(badge.condition_value)
    } else if (badge.condition_type === 'level') {
      conditions.level = Number(badge.condition_value)
    } else if (badge.condition_type === 'action_count') {
      conditions.action_count = true
      conditions.count = Number(badge.condition_value)
      conditions.action_type = badge.action_type
    }

    return {
      name: badge.name.trim(),
      description: badge.description?.trim() || null,
      icon: badge.icon?.trim() || 'pi pi-star',
      rarity: badge.rarity,
      xp_bonus: Number(badge.xp_bonus),
      conditions,
      is_active: Boolean(badge.is_active)
    }
  }
}

export default new AdminBadgesService()
