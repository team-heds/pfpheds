import { supabase } from '../supabase.js'

const POLL_INTERVAL = 30_000

class GamificationService {
  constructor() {
    this.listeners = new Map()
  }

  async getUnifiedStats() {
    const today = new Date().toISOString().slice(0, 10)
    const [profilesResult, gamificationResult, challengesResult, activeChallengesResult, questsResult, completedQuestsResult, badgesResult, awardedBadgesResult, housesResult, logsResult] = await Promise.all([
      supabase.from('user_profiles').select('user_id', { count: 'exact', head: true }),
      supabase.from('gamification_data').select('user_id', { count: 'exact', head: true }),
      supabase.from('challenges').select('id', { count: 'exact', head: true }),
      supabase.from('challenges').select('id', { count: 'exact', head: true }).eq('is_active', true).or(`start_date.is.null,start_date.lte.${today}`).or(`end_date.is.null,end_date.gte.${today}`),
      supabase.from('quests').select('id', { count: 'exact', head: true }),
      supabase.from('user_quest_progress').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('badges').select('id', { count: 'exact', head: true }),
      supabase.from('user_badges').select('badge_id', { count: 'exact', head: true }),
      supabase.from('houses').select('id,name,motto,color,description,total_xp,member_count,level'),
      supabase.from('xp_history').select('id,user_id,amount,action,description,created_at').order('created_at', { ascending: false }).limit(50)
    ])

    const results = [profilesResult, gamificationResult, challengesResult, activeChallengesResult, questsResult, completedQuestsResult, badgesResult, awardedBadgesResult, housesResult, logsResult]
    const failed = results.find(({ error }) => error)
    if (failed) throw failed.error

    const houses = Object.fromEntries((housesResult.data || []).map((house) => [house.id, {
      ...house,
      memberCount: Number(house.member_count || 0),
      totalXP: Number(house.total_xp || 0),
      averageLevel: Number(house.level || 1)
    }]))
    return {
      totalUsers: profilesResult.count || 0,
      gamificationUsers: gamificationResult.count || 0,
      totalChallenges: challengesResult.count || 0,
      activeChallenges: activeChallengesResult.count || 0,
      totalQuests: questsResult.count || 0,
      completedQuests: completedQuestsResult.count || 0,
      totalBadges: badgesResult.count || 0,
      awardedBadges: awardedBadgesResult.count || 0,
      totalHouses: Object.keys(houses).length,
      houses,
      recentLogs: this.formatXPHistory(logsResult.data || []),
      rawData: { houses },
      lastUpdated: new Date().toISOString()
    }
  }

  async getUserGamificationData(userId) {
    if (!userId) return null

    const [profileResult, gamificationResult, challengeProgressResult, questProgressResult, badgeResult, xpHistoryResult] = await Promise.all([
      supabase.from('user_profiles').select('user_id,email,forname,family_name,display_name,avatar_url,house_id,login_streak').eq('user_id', userId).maybeSingle(),
      supabase.from('gamification_data').select('user_id,total_xp,current_level,house_id,house_points').eq('user_id', userId).maybeSingle(),
      supabase.from('user_challenge_progress').select('completed').eq('user_id', userId),
      supabase.from('user_quest_progress').select('status').eq('user_id', userId),
      supabase.from('user_badges').select('earned_at,notified,badge:badges(id,name,description,icon,rarity,xp_bonus,conditions,is_active)').eq('user_id', userId).order('earned_at', { ascending: false }),
      supabase.from('xp_history').select('id,user_id,amount,action,description,created_at').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
    ])

    const results = [profileResult, gamificationResult, challengeProgressResult, questProgressResult, badgeResult, xpHistoryResult]
    const failed = results.find(({ error }) => error)
    if (failed) throw failed.error

    const profile = profileResult.data || {}
    const data = gamificationResult.data || {}
    const totalXP = Number(data.total_xp || 0)
    const level = this.calculateLevel(totalXP)
    const badges = (badgeResult.data || []).filter((row) => row.badge).map((row) => {
      const badge = row.badge
      const category = badge.conditions?.category || badge.conditions?.type || 'general'
      return {
        ...badge,
        color: badge.conditions?.color || '#64748B',
        category,
        unlockedAt: row.earned_at,
        unlocked_at: row.earned_at
      }
    })
    const houseId = data.house_id || profile.house_id || null

    return {
      ...profile,
      displayName: profile.display_name || [profile.forname, profile.family_name].filter(Boolean).join(' ') || profile.email || 'Utilisateur',
      photoURL: profile.avatar_url || null,
      gamification: {
        maison: houseId,
        xp: totalXP,
        totalXP,
        niveau: level,
        loginStreak: profile.login_streak || 0,
        badges,
        quests: [],
        challenges: [],
        stats: {
          totalXP,
          level,
          challengesCompleted: (challengeProgressResult.data || []).filter((progress) => progress.completed).length,
          questsCompleted: (questProgressResult.data || []).filter((progress) => progress.status === 'completed').length,
          badgesEarned: badges.length
        }
      },
      recentActivity: this.formatXPHistory(xpHistoryResult.data || [])
    }
  }

  async getHouseData(houseId) {
    if (!houseId) return null
    const { data, error } = await supabase
      .from('houses')
      .select('id,name,motto,color,description,total_xp,member_count,level')
      .eq('id', houseId)
      .maybeSingle()
    if (error) throw error
    return data
  }

  calculateLevel(xp = 0) {
    return Math.min(20, Math.max(1, Math.floor(Math.sqrt(Math.max(0, Number(xp) || 0) / 100)) + 1))
  }

  getDefaultStats() {
    return {
      totalUsers: 0,
      gamificationUsers: 0,
      totalChallenges: 0,
      activeChallenges: 0,
      totalQuests: 0,
      completedQuests: 0,
      totalBadges: 0,
      totalHouses: 0,
      houses: {},
      recentLogs: [],
      rawData: { challenges: [], quests: [], houses: {} },
      lastUpdated: new Date().toISOString()
    }
  }

  async getRecentLogs(limit = 20) {
    const { data, error } = await supabase
      .from('xp_history')
      .select('id,user_id,amount,action,description,created_at')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw error
    return this.formatXPHistory(data || [])
  }

  async getActivitySummary() {
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)
    const weekAgo = new Date(now)
    weekAgo.setDate(weekAgo.getDate() - 7)
    const [todayResult, weekResult, activeUsersResult] = await Promise.all([
      supabase.from('xp_history').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
      supabase.from('xp_history').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
      supabase.from('user_profiles').select('user_id', { count: 'exact', head: true }).gte('last_login', weekAgo.toISOString())
    ])
    const failed = [todayResult, weekResult, activeUsersResult].find(({ error }) => error)
    if (failed) throw failed.error
    return {
      todayActivities: todayResult.count || 0,
      weekActivities: weekResult.count || 0,
      activeUsers: activeUsersResult.count || 0
    }
  }

  formatXPHistory(rows) {
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      action: 'xp_gained',
      sourceAction: row.action,
      amount: row.amount,
      description: row.description || `+${row.amount} XP`,
      timestamp: row.created_at ? new Date(row.created_at).getTime() : null
    }))
  }

  subscribeToStats(callback) {
    return this.subscribe('stats', async () => callback(await this.getUnifiedStats()))
  }

  subscribeToActivity(callback, limit = 20) {
    return this.subscribe('activity', async () => {
      const [logs, summary] = await Promise.all([this.getRecentLogs(limit), this.getActivitySummary()])
      callback(logs, summary)
    })
  }

  subscribeToUser(userId, callback) {
    if (!userId) return null
    return this.subscribe(`user_${userId}`, async () => callback(await this.getUserGamificationData(userId)))
  }

  subscribe(key, callback) {
    const listenerId = `${key}_${Date.now()}_${Math.random().toString(36).slice(2)}`
    let running = false
    const refresh = async () => {
      if (running) return
      running = true
      try {
        await callback()
      } catch (error) {
        console.error('[GamificationService] Erreur de mise à jour Supabase:', error)
      } finally {
        running = false
      }
    }
    const interval = setInterval(refresh, POLL_INTERVAL)
    this.listeners.set(listenerId, () => clearInterval(interval))
    refresh()
    return listenerId
  }

  unsubscribe(listenerId) {
    const unsubscribe = this.listeners.get(listenerId)
    if (unsubscribe) {
      unsubscribe()
      this.listeners.delete(listenerId)
    }
  }

  cleanup() {
    this.listeners.forEach((unsubscribe) => unsubscribe())
    this.listeners.clear()
  }
}

const gamificationService = new GamificationService()
export default gamificationService
