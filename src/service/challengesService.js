import { supabase } from '../supabase.js'

export const CHALLENGE_TYPES = { XP_GAIN: 'xp_gain', LOGIN_STREAK: 'login_streak', QUIZ_COMPLETE: 'quiz_complete', BADGE_UNLOCK: 'badge_unlock', SOCIAL_INTERACTION: 'social_interaction', EXPLORATION: 'exploration' }
export const CHALLENGE_DIFFICULTY = {
  EASY: { name: 'Facile', color: '#22C55E', xpMultiplier: 1, icon: '🟢' }, MEDIUM: { name: 'Moyen', color: '#F59E0B', xpMultiplier: 1.5, icon: '🟡' },
  HARD: { name: 'Difficile', color: '#EF4444', xpMultiplier: 2, icon: '🔴' }, LEGENDARY: { name: 'Légendaire', color: '#8B5CF6', xpMultiplier: 3, icon: '🟣' },
}

const difficultyFor = (target) => target >= 1000 ? 'LEGENDARY' : target >= 100 ? 'HARD' : target >= 10 ? 'MEDIUM' : 'EASY'
const icons = { xp_gain: '⭐', login_streak: '📅', quiz_complete: '📚', badge_unlock: '🏅', social_interaction: '🤝', exploration: '🗺️' }
const categories = { xp_gain: 'progression', login_streak: 'engagement', quiz_complete: 'apprentissage', badge_unlock: 'collection', social_interaction: 'social', exploration: 'exploration' }

const normalizeChallenge = (challenge, progress = null) => {
  if (!challenge) return null
  const target = Number(challenge.target_value || 0)
  return { ...challenge, challengeId: challenge.id, challengeName: challenge.name, type: challenge.action_type, difficulty: difficultyFor(target), target, reward: { xp: Number(challenge.xp_reward || 0), badge: challenge.badge_reward || null, title: null }, icon: icons[challenge.action_type] || '🎯', category: categories[challenge.action_type] || 'progression', weekNumber: challenge.week_number, startDate: challenge.start_date, endDate: challenge.end_date, progress: Number(progress?.current_value || 0), completed: Boolean(progress?.completed), completedAt: progress?.completed_at || null, completed_at: progress?.completed_at || null }
}

const getActiveChallenges = async () => {
  const today = new Date().toISOString().slice(0, 10)
  const { data, error } = await supabase.from('challenges').select('id,name,description,target_value,action_type,xp_reward,badge_reward,week_number,year,start_date,end_date,is_active,created_at').eq('is_active', true).or(`start_date.is.null,start_date.lte.${today}`).or(`end_date.is.null,end_date.gte.${today}`).order('start_date', { ascending: true })
  if (error) throw error
  return data || []
}

const getUserProgress = async (userId, completed = null) => {
  let query = supabase.from('user_challenge_progress').select('challenge_id,current_value,completed,completed_at,challenge:challenges(id,name,description,target_value,action_type,xp_reward,badge_reward,week_number,year,start_date,end_date,is_active,created_at)').eq('user_id', userId)
  if (completed !== null) query = query.eq('completed', completed)
  const { data, error } = await query.order('completed_at', { ascending: false, nullsFirst: false })
  if (error) throw error
  return data || []
}

export const getUserActiveChallenges = async (userId) => {
  if (!userId) return []
  const [challenges, progressRows] = await Promise.all([getActiveChallenges(), getUserProgress(userId)])
  const progressByChallenge = new Map(progressRows.map((row) => [row.challenge_id, row]))
  return challenges.map((challenge) => normalizeChallenge(challenge, progressByChallenge.get(challenge.id)))
}

export const getUserChallengeHistory = async (userId, limit = 20) => {
  if (!userId) return []
  const rows = await getUserProgress(userId, true)
  return rows.slice(0, limit).map((row) => normalizeChallenge(row.challenge, row)).filter(Boolean)
}

export const getUserChallengeStats = async (userId) => {
  const history = await getUserChallengeHistory(userId, 500)
  const toWeekStart = (item) => {
    if (item.year && item.weekNumber) {
      const januaryFourth = new Date(Date.UTC(item.year, 0, 4))
      const januaryFourthDay = januaryFourth.getUTCDay() || 7
      return januaryFourth.getTime() - (januaryFourthDay - 1) * 86400000 + (item.weekNumber - 1) * 7 * 86400000
    }
    if (item.startDate) {
      const start = new Date(`${item.startDate}T00:00:00Z`)
      const startDay = start.getUTCDay() || 7
      start.setUTCDate(start.getUTCDate() - startDay + 1)
      return start.getTime()
    }
    return null
  }
  const weekStarts = [...new Set(history.map(toWeekStart).filter((value) => value !== null))].sort((a, b) => b - a)
  let streakWeeks = 0
  const currentMonday = new Date()
  const day = currentMonday.getUTCDay() || 7
  currentMonday.setUTCDate(currentMonday.getUTCDate() - day + 1)
  currentMonday.setUTCHours(0, 0, 0, 0)
  if (weekStarts[0] && currentMonday.getTime() - weekStarts[0] <= 7 * 86400000) {
    streakWeeks = 1
    for (let index = 1; index < weekStarts.length; index += 1) {
      if (weekStarts[index - 1] - weekStarts[index] !== 7 * 86400000) break
      streakWeeks += 1
    }
  }
  return { totalCompleted: history.length, totalXPFromChallenges: history.reduce((total, item) => total + (item.reward?.xp || 0), 0), streakWeeks }
}

const serverManagedOnly = () => { throw new Error('La progression des défis est gérée uniquement par le moteur Supabase sécurisé.') }
export const updateChallengeProgress = serverManagedOnly
export const completeChallenge = serverManagedOnly
export const generateWeeklyChallenges = serverManagedOnly

export default { CHALLENGE_TYPES, CHALLENGE_DIFFICULTY, getUserActiveChallenges, getUserChallengeHistory, getUserChallengeStats, updateChallengeProgress, completeChallenge, generateWeeklyChallenges }
