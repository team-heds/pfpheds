import { defineStore } from 'pinia'
import { supabase } from '@/supabase.js'
import gamificationServiceSupabase from '@/service/gamificationServiceSupabase'
import badgesService from '@/service/badgesService'
import challengesService from '@/service/challengesService'
import { gamificationFeatures } from '@/config/gamificationFeatures'

const settle = async (label, promise, fallback) => {
  try {
    return await promise
  } catch (error) {
    console.warn(`[Profil] ${label} indisponible:`, error?.message || error)
    return fallback
  }
}

/**
 * Données de l'onglet Profil : identité, progression, série, défis, badges.
 * Chaque bloc est indépendant : un bloc en panne n'empêche pas d'afficher les autres.
 */
export const useMobileProfileStore = defineStore('mobileProfile', {
  state: () => ({
    /** Vue ouverte dans l'onglet : 'pfp' (formation pratique) ou 'progress'. */
    view: 'pfp',
    userId: null,
    profile: null,
    stats: null,
    streak: null,
    challenges: [],
    badges: [],
    loading: false,
    loaded: false,
    failed: false,
    loadedAt: 0,
  }),
  actions: {
    async load(userId, { force = false } = {}) {
      if (!userId || this.loading) return
      if (userId !== this.userId) {
        this.$reset()
        this.userId = userId
      } else if (!force && this.loaded && Date.now() - this.loadedAt < 60 * 1000) {
        return
      }
      this.loading = true
      this.failed = false
      const journey = gamificationFeatures.userJourney
      const collections = journey && gamificationFeatures.badgesChallenges
      try {
        const profileRequest = supabase
          .from('user_profiles')
          .select('display_name, forname, family_name, email, avatar_url')
          .eq('user_id', userId)
          .maybeSingle()
        const [profileResult, stats, streak, challenges, badges] = await Promise.all([
          profileRequest,
          journey ? settle('Progression', gamificationServiceSupabase.getUserGamificationData(userId, { refresh: true }), null) : null,
          journey ? settle('Série', gamificationServiceSupabase.getMyLoginStreak(), null) : null,
          collections ? settle('Défis', challengesService.getUserActiveChallenges(userId), []) : [],
          collections ? settle('Badges', badgesService.getUserBadges(userId), []) : [],
        ])
        if (userId !== this.userId) return
        if (profileResult.error) throw profileResult.error
        this.profile = profileResult.data || null
        this.stats = stats
          ? {
              level: stats.current_level || stats.niveau || 1,
              xp: stats.total_xp ?? stats.xp ?? 0,
              house: stats.house_name || stats.maison || null,
            }
          : null
        this.streak = streak
        this.challenges = challenges || []
        this.badges = badges || []
        this.loaded = true
        this.loadedAt = Date.now()
      } catch (error) {
        console.error('[Profil] Chargement impossible:', error)
        this.failed = !this.loaded
      } finally {
        this.loading = false
      }
    },
    setAvatar(url) {
      this.profile = { ...(this.profile || {}), avatar_url: url }
    },
  },
})
