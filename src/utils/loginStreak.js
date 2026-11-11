// Série de connexions : mise en forme des données renvoyées par la RPC get_my_login_streak.
// Le calcul (série, paliers, XP) est fait par le serveur ; ce fichier ne fait qu'afficher.

const toCount = (value) => Math.max(0, Math.trunc(Number(value) || 0))

const normalizeMilestone = (milestone) => ({
  days: toCount(milestone?.days),
  xp: toCount(milestone?.xp_amount),
  badgeId: milestone?.badge_id || null,
  badgeName: milestone?.badge_name || null,
  reached: Boolean(milestone?.reached),
  reachedToday: Boolean(milestone?.reached_today),
  eventKey: milestone?.event_key || null,
})

/** Réponse du serveur → objet d'affichage. `null` si le compte n'est pas un joueur. */
export function normalizeLoginStreak(raw) {
  if (!raw || typeof raw !== 'object' || raw.is_player !== true) return null
  const next = raw.next_milestone
  return {
    current: toCount(raw.current_streak),
    best: toCount(raw.best_streak),
    loggedInToday: Boolean(raw.logged_in_today),
    academicYear: raw.academic_year || null,
    nextMilestone: next && toCount(next.days) > 0
      ? { days: toCount(next.days), xp: toCount(next.xp_amount), daysRemaining: toCount(next.days_remaining) }
      : null,
    milestones: (Array.isArray(raw.milestones) ? raw.milestones : [])
      .map(normalizeMilestone)
      .filter((milestone) => milestone.days > 0)
      .sort((a, b) => a.days - b.days),
  }
}

export const formatStreakDays = (days) => {
  const count = toCount(days)
  return `${count} jour${count > 1 ? 's' : ''}`
}

/** « 12 jours de suite » */
export const streakLabel = (days) => {
  const count = toCount(days)
  return count > 0 ? `${formatStreakDays(count)} de suite` : 'Aucune série en cours'
}

/** Part de la série en cours vers le prochain palier, de 0 à 100. */
export const nextMilestoneProgress = (streak) => {
  const target = streak?.nextMilestone?.days
  if (!target) return 100
  return Math.min(100, Math.max(0, Math.round((toCount(streak.current) / target) * 100)))
}

/** Phrase sur le prochain palier. */
export const nextMilestoneLabel = (streak) => {
  const next = streak?.nextMilestone
  if (!next) return 'Tous les paliers de cette année sont atteints.'
  return `Encore ${formatStreakDays(next.daysRemaining)} avant le palier des ${next.days} jours (+${next.xp} XP)`
}

/**
 * Notification d'un palier, pour GamificationNotification.
 * La même clé sert au passage immédiat et au journal temps réel : un palier n'est annoncé qu'une fois.
 */
export const loginStreakNotification = ({ days, xp, eventKey, userId }) => ({
  ...(userId ? { userId } : {}),
  type: 'streak',
  title: `Série de ${toCount(days)} jours !`,
  message: `Vous vous êtes connecté·e ${toCount(days)} jours de suite.`,
  xpGain: toCount(xp) || null,
  dedupeKey: eventKey ? `streak:${eventKey}` : null,
})

/** Notification à partir d'une ligne du journal d'XP (action LOGIN_STREAK). */
export const loginStreakNotificationFromLog = (log) => {
  const eventKey = log?.event_key || null
  const days = toCount(String(eventKey || '').split(':').pop())
  if (!days) return null
  return loginStreakNotification({ days, xp: log?.amount, eventKey })
}

/** Notifications des paliers passés aujourd'hui. */
export const todaysStreakNotifications = (streak, userId) => (streak?.milestones || [])
  .filter((milestone) => milestone.reachedToday)
  .map((milestone) => loginStreakNotification({
    days: milestone.days,
    xp: milestone.xp,
    eventKey: milestone.eventKey,
    userId,
  }))
