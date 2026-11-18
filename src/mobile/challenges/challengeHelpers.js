// Calculs de l'écran Défis de l'application mobile, sans accès aux données.

const DIFFICULTY_LABELS = { EASY: 'Facile', MEDIUM: 'Moyen', HARD: 'Difficile', LEGENDARY: 'Légendaire' }
const CATEGORY_LABELS = {
  progression: 'Progression',
  engagement: 'Engagement',
  apprentissage: 'Apprentissage',
  collection: 'Collection',
  social: 'Social',
  exploration: 'Exploration',
}

export const difficultyLabel = (value) => DIFFICULTY_LABELS[value] || value || ''
export const categoryLabel = (value) => CATEGORY_LABELS[value] || value || ''

/** Avancement d'un défi en pour cent, borné entre 0 et 100. */
export function progressPercent(challenge) {
  const target = Number(challenge?.target || 0)
  if (challenge?.completed) return 100
  if (!target) return 0
  return Math.max(0, Math.min(100, Math.round((Number(challenge.progress || 0) / target) * 100)))
}

/** « 3 / 5 », borné à l'objectif. */
export function progressLabel(challenge) {
  const target = Number(challenge?.target || 0)
  const done = challenge?.completed ? target : Math.min(Number(challenge?.progress || 0), target)
  return `${done} / ${target}`
}

/** Défis à faire d'abord (les plus avancés en tête), puis les défis réussis. */
export function sortChallenges(list = []) {
  return list
    .map((challenge, index) => ({ challenge, index }))
    .sort((a, b) => {
      if (Boolean(a.challenge.completed) !== Boolean(b.challenge.completed)) return a.challenge.completed ? 1 : -1
      const byProgress = progressPercent(b.challenge) - progressPercent(a.challenge)
      return byProgress || a.index - b.index
    })
    .map(({ challenge }) => challenge)
}

/** Résumé de la période : défis réussis, total et pourcentage. */
export function challengeSummary(list = []) {
  const total = list.length
  const done = list.filter((challenge) => challenge.completed).length
  return { done, total, percent: total ? Math.round((done / total) * 100) : 0 }
}

/** Un défi à faire qui porte un lien (jeu, quiz…) y mène directement. */
export const challengeTarget = (challenge) => (challenge?.actionUrl && !challenge.completed ? challenge.actionUrl : null)

/** « 1,2 k » au-delà de mille. */
export function formatXp(value) {
  const number = Number(value || 0)
  if (number >= 1000) return `${(number / 1000).toLocaleString('fr-CH', { maximumFractionDigits: 1 })} k`
  return String(number)
}

/** « 12 nov. » ; l'année seulement si elle n'est pas l'année en cours. */
export function shortDate(value, now = new Date()) {
  const date = value ? new Date(value) : null
  if (!date || Number.isNaN(date.getTime())) return ''
  const options = { day: 'numeric', month: 'short' }
  if (date.getFullYear() !== now.getFullYear()) options.year = 'numeric'
  return date.toLocaleDateString('fr-CH', options)
}
