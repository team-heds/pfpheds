import { supabase } from '../supabase.js'

export const BADGE_CATEGORIES = {
  debut: { name: 'Démarrage', icon: '🌟', color: '#4CAF50' }, social: { name: 'Social', icon: '👥', color: '#FF9800' },
  academique: { name: 'Académique', icon: '🎓', color: '#3F51B5' }, progression: { name: 'Progression', icon: '📈', color: '#9C27B0' },
  competition: { name: 'Compétition', icon: '🏆', color: '#FFC107' }, engagement: { name: 'Engagement', icon: '🔥', color: '#F44336' },
  loyaute: { name: 'Loyauté', icon: '🛡️', color: '#607D8B' }, special: { name: 'Spécial', icon: '✨', color: '#E91E63' },
  general: { name: 'Général', icon: '🏅', color: '#64748B' },
}

export const BADGE_RARITY = {
  common: { name: 'Commun', color: '#9E9E9E', glow: false }, uncommon: { name: 'Peu Commun', color: '#4CAF50', glow: false },
  rare: { name: 'Rare', color: '#FF9800', glow: true }, epic: { name: 'Épique', color: '#7C3AED', glow: true },
  legendary: { name: 'Légendaire', color: '#9C27B0', glow: true },
}

const normalizeBadge = (badge, earnedAt = null) => {
  if (!badge) return null
  const conditions = badge.conditions || {}
  const category = conditions.category || conditions.type || 'general'
  return { ...badge, category, color: conditions.color || BADGE_RARITY[badge.rarity]?.color || BADGE_CATEGORIES[category]?.color || '#64748B', xpBonus: Number(badge.xp_bonus || 0), unlockedAt: earnedAt, unlocked_at: earnedAt }
}

export const getAllBadges = async () => {
  const { data, error } = await supabase.from('badges').select('id,name,description,icon,rarity,xp_bonus,conditions,is_active,created_at').eq('is_active', true).order('created_at', { ascending: true })
  if (error) throw error
  return (data || []).map((badge) => normalizeBadge(badge))
}

export const getUserBadges = async (userId) => {
  if (!userId) return []
  const { data, error } = await supabase.from('user_badges').select('earned_at,notified,badge:badges(id,name,description,icon,rarity,xp_bonus,conditions,is_active,created_at)').eq('user_id', userId).order('earned_at', { ascending: false })
  if (error) throw error
  return (data || []).filter((row) => row.badge?.is_active !== false).map((row) => normalizeBadge(row.badge, row.earned_at)).filter(Boolean)
}

export const getUserBadgeHistory = async (userId) => getUserBadges(userId)

export const calculateBadgeStats = (userBadges, totalPossible = 0) => {
  const badges = Array.isArray(userBadges) ? userBadges : Object.values(userBadges || {})
  const byRarity = {}, byCategory = {}
  for (const badge of badges) {
    byRarity[badge.rarity] = (byRarity[badge.rarity] || 0) + 1
    byCategory[badge.category] = (byCategory[badge.category] || 0) + 1
  }
  return { totalBadges: badges.length, totalPossible, completionPercentage: totalPossible > 0 ? Math.round((badges.length / totalPossible) * 100) : 0, byRarity, byCategory, totalXPFromBadges: badges.reduce((total, badge) => total + (badge.xpBonus || 0), 0) }
}

const serverManagedOnly = () => { throw new Error('Les badges sont attribués uniquement par le moteur Supabase sécurisé.') }
export const checkUnlockedBadges = serverManagedOnly
export const unlockBadge = serverManagedOnly
export const autoCheckAndUnlockBadges = serverManagedOnly
export const checkAndUnlockActionBadges = serverManagedOnly

export default { BADGE_CATEGORIES, BADGE_RARITY, getAllBadges, getUserBadges, getUserBadgeHistory, calculateBadgeStats, checkUnlockedBadges, unlockBadge, autoCheckAndUnlockBadges, checkAndUnlockActionBadges }
