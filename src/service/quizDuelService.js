/**
 * Duel de quiz : deux joueurs, les 5 mêmes questions, 48 heures pour jouer.
 *
 * Tout passe par des fonctions serveur : tirage des questions, chronomètre, correction et
 * points sont décidés par la base. Le navigateur ne reçoit la correction qu'une fois le duel
 * clos (les deux ont joué, ou forfait).
 */

import { supabase } from '../supabase.js'
import { quizService } from './quizService.js'

export const DUEL_QUESTION_COUNT = 5
export const DUEL_TIME_LIMIT_MS = 20000
export const DUEL_DAILY_REWARD_CAP = 3

const ERROR_MESSAGES = {
  duel_not_player: 'Les duels sont réservés aux joueurs de la gamification.',
  duel_not_enough_questions: 'Pas assez de questions disponibles pour ce thème.',
  duel_no_opponent: 'Aucun adversaire disponible pour le moment dans une autre maison. Réessayez plus tard ou défiez quelqu’un par son nom.',
  duel_self: 'Vous ne pouvez pas vous défier vous-même.',
  duel_opponent_unavailable: 'Cette personne ne participe pas à la gamification.',
  duel_already_open: 'Un duel est déjà en cours avec cette personne.',
  duel_daily_limit: 'Vous avez lancé 10 duels en 24 heures : réessayez plus tard.',
  duel_too_many_open: 'Vous avez déjà 5 duels lancés en attente : attendez qu’ils se terminent.',
  duel_invalid_theme: 'Ce thème n’existe pas.',
  duel_not_found: 'Ce duel est introuvable.',
  duel_closed: 'Ce duel est terminé.',
  duel_expired: 'Le délai de 48 heures est dépassé.',
  duel_already_started: 'Vous avez déjà accepté ce duel : il n’est plus possible de le refuser.',
  duel_question_not_shown: 'Cette question n’est pas encore affichée.',
  duel_empty_answer: 'Choisissez au moins une réponse.',
  duel_unknown_answer: 'Réponse inconnue pour cette question.',
  duel_single_answer: 'Une seule réponse est attendue.',
}

/** Code métier renvoyé par le serveur (ex. « duel_closed »), sinon null. */
export function duelErrorCode(error) {
  const raw = String(error?.message || error || '')
  const match = raw.match(/\bduel_[a-z_]+\b/)
  return match && ERROR_MESSAGES[match[0]] ? match[0] : null
}

/** Message lisible à partir d'une erreur Supabase. */
export function duelErrorMessage(error, fallback = 'Une erreur est survenue. Réessayez.') {
  const code = duelErrorCode(error)
  if (code === 'duel_not_enough_questions') {
    const available = Number.parseInt(error?.details, 10)
    if (Number.isFinite(available)) {
      return available === 0
        ? 'Aucune question disponible pour ce thème.'
        : `Seulement ${available} question${available > 1 ? 's' : ''} disponible${available > 1 ? 's' : ''} pour ce thème (il en faut ${DUEL_QUESTION_COUNT}).`
    }
  }
  if (code) return ERROR_MESSAGES[code]
  const raw = String(error?.message || error || '')
  if (/Authentication required|JWT/i.test(raw)) return 'Votre session a expiré. Reconnectez-vous pour continuer.'
  if (/Failed to fetch|NetworkError|network/i.test(raw)) return 'Connexion impossible. Vérifiez votre réseau puis réessayez.'
  if (/Could not find the function|schema cache/i.test(raw)) return 'Les duels ne sont pas encore disponibles sur ce serveur.'
  return fallback
}

function unwrap({ data, error }) {
  if (error) throw error
  return data
}

/** Temps lisible (« 12,4 s », « 1 min 05 s »). */
export function formatDuelTime(ms) {
  const value = Math.max(0, Number(ms) || 0)
  if (value < 60000) {
    return `${new Intl.NumberFormat('fr-CH', { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value / 1000)} s`
  }
  const totalSeconds = Math.round(value / 1000)
  return `${Math.floor(totalSeconds / 60)} min ${String(totalSeconds % 60).padStart(2, '0')} s`
}

/** Temps restant avant l'expiration (« 47 h », « 35 min »). */
export function formatTimeLeft(expiresAt, now = Date.now()) {
  const left = new Date(expiresAt).getTime() - now
  if (!Number.isFinite(left) || left <= 0) return 'délai écoulé'
  const minutes = Math.floor(left / 60000)
  if (minutes < 60) return `${Math.max(1, minutes)} min`
  return `${Math.floor(minutes / 60)} h`
}

const RESULT_LABELS = {
  win: 'Victoire',
  loss: 'Défaite',
  draw: 'Égalité',
  declined: 'Refusé',
  expired: 'Expiré',
}

/** Libellé du résultat d'un duel terminé, vu par la personne connectée. */
export function duelResultLabel(duel) {
  const outcome = duel?.outcome
  if (!outcome) return ''
  const label = RESULT_LABELS[outcome.result] || ''
  return outcome.forfeit && ['win', 'loss'].includes(outcome.result) ? `${label} par forfait` : label
}

/** Classe les duels en trois listes : à jouer, en attente de l'adversaire, terminés. */
export function groupDuels(duels = []) {
  const groups = { toPlay: [], waiting: [], done: [] }
  for (const duel of duels) {
    if (duel?.state === 'to_play') groups.toPlay.push(duel)
    else if (duel?.state === 'done') groups.done.push(duel)
    else if (duel) groups.waiting.push(duel)
  }
  return groups
}

/** Phrase d'état d'un duel en cours. */
export function duelStatusText(duel, now = Date.now()) {
  if (!duel) return ''
  if (duel.state === 'to_play') {
    if (duel.needs_response) return `Défi reçu · ${formatTimeLeft(duel.expires_at, now)} pour répondre`
    if (duel.my_started) return `Duel commencé (${duel.my_answered}/${DUEL_QUESTION_COUNT}) · à terminer`
    return duel.opponent_finished
      ? `L’adversaire a joué · ${formatTimeLeft(duel.expires_at, now)} pour jouer`
      : `${formatTimeLeft(duel.expires_at, now)} pour jouer`
  }
  if (duel.state === 'waiting') {
    return `En attente de l’adversaire · ${formatTimeLeft(duel.expires_at, now)}`
  }
  if (duel.state === 'closing') return 'Délai écoulé · résultat en cours'
  return duelResultLabel(duel)
}

export const quizDuelService = {
  /** Bilan, thèmes, duels en cours et terminés. */
  async getOverview() {
    return unwrap(await supabase.rpc('get_my_quiz_duels'))
  },

  /** Joueurs dont le nom contient la recherche (2 caractères minimum). */
  async searchOpponents(query) {
    const term = String(query || '').trim()
    if (term.length < 2) return []
    return unwrap(await supabase.rpc('search_quiz_duel_opponents', { p_query: term })) || []
  },

  /** Lance un duel ; opponentId null = adversaire au hasard dans une autre maison. */
  async createDuel({ opponentId = null, theme = null } = {}) {
    return unwrap(await supabase.rpc('create_quiz_duel', {
      p_opponent_id: opponentId || null,
      p_theme: theme || null,
    }))
  },

  async respond(duelId, accept) {
    return unwrap(await supabase.rpc('respond_quiz_duel', { p_duel_id: duelId, p_accept: Boolean(accept) }))
  },

  /** Question suivante (lance le chronomètre côté serveur) ou { done: true }. */
  async nextQuestion(duelId) {
    return unwrap(await supabase.rpc('next_quiz_duel_question', { p_duel_id: duelId }))
  },

  async answer(duelId, position, selected) {
    return unwrap(await supabase.rpc('answer_quiz_duel_question', {
      p_duel_id: duelId,
      p_position: position,
      p_selected: selected,
    }))
  },

  /** Détail d'un duel, avec la correction quand il est clos et que l'on a joué. */
  async getDuel(duelId) {
    return unwrap(await supabase.rpc('get_quiz_duel', { p_duel_id: duelId }))
  },

  getQuestionImageUrl(path) {
    return quizService.getQuestionImageUrl(path)
  },
}

export default quizDuelService
