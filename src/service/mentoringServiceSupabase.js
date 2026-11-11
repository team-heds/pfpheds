/**
 * Mentorat entre étudiants : créneaux d'entraide, réservation, confirmation.
 *
 * Le navigateur ne décide ni de l'identité, ni des horaires autorisés, ni des points :
 * tout passe par les fonctions SQL de `20261111130000_gamification_mentoring.sql`.
 */
import { supabase } from '@/supabase'

export const MENTORING_XP = 30
export const MENTORING_WEEKLY_CAP = 2
export const MENTORING_CONFIRMATION_DAYS = 14
export const MENTORING_MAX_TAGS = 6
export const MENTORING_TAG_MAX_LENGTH = 30

export const MENTORING_SUGGESTED_TAGS = Object.freeze([
  'anatomie',
  'stages pfp',
  'examens',
  'organisation',
  'pratique',
  'vie étudiante',
])

const ERROR_MESSAGES = Object.freeze({
  mentoring_auth_required: 'Connectez-vous pour utiliser le mentorat.',
  mentoring_profile_required: 'Votre compte n’est pas actif. Contactez l’administration.',
  mentoring_invalid_period: 'Indiquez la date, l’heure de début et l’heure de fin.',
  mentoring_slot_in_past: 'Le créneau doit commencer dans le futur.',
  mentoring_slot_too_far: 'Le créneau doit avoir lieu dans les 6 prochains mois.',
  mentoring_invalid_duration: 'Un créneau dure entre 15 minutes et 4 heures.',
  mentoring_invalid_location: 'Indiquez un lieu (2 à 160 caractères).',
  mentoring_invalid_topics: 'Décrivez les sujets sur lesquels vous pouvez aider (3 à 500 caractères).',
  mentoring_invalid_note: 'La note est trop longue (500 caractères au maximum).',
  mentoring_invalid_tags: 'Utilisez au maximum 6 étiquettes de 30 caractères.',
  mentoring_invalid_message: 'Le message est trop long (500 caractères au maximum).',
  mentoring_too_many_slots: 'Vous avez déjà 20 créneaux à venir. Annulez-en un avant d’en proposer un autre.',
  mentoring_slot_overlap: 'Vous proposez déjà un créneau à cet horaire.',
  mentoring_slot_not_found: 'Ce créneau n’existe plus.',
  mentoring_own_slot: 'Vous ne pouvez pas réserver votre propre créneau.',
  mentoring_slot_started: 'Ce créneau a déjà commencé : il ne peut plus être réservé ni annulé.',
  mentoring_slot_taken: 'Ce créneau vient d’être réservé par quelqu’un d’autre.',
  mentoring_booking_not_found: 'Aucune réservation active pour ce créneau.',
  mentoring_session_not_finished: 'Vous pourrez confirmer la rencontre après l’heure de fin.',
  mentoring_confirmation_closed: 'Le délai de 14 jours pour confirmer cette rencontre est dépassé.',
  mentoring_admin_required: 'Seule l’administration peut retirer un créneau.',
})

const FALLBACK_ERROR = 'Le mentorat est momentanément indisponible. Réessayez dans un instant.'

/** Message en français pour une erreur renvoyée par les fonctions de mentorat. */
export function mentoringErrorMessage(error) {
  const raw = String(error?.message || error || '')
  const code = Object.keys(ERROR_MESSAGES).find((key) => raw.includes(key))
  return code ? ERROR_MESSAGES[code] : FALLBACK_ERROR
}

function toError(error) {
  const wrapped = new Error(mentoringErrorMessage(error))
  wrapped.cause = error
  return wrapped
}

async function call(name, params) {
  const { data, error } = await supabase.rpc(name, params)
  if (error) throw toError(error)
  return data
}

/** Étiquettes nettoyées comme le fait le serveur : minuscules, sans doublon ni vide. */
export function normalizeTags(tags) {
  const seen = new Set()
  for (const tag of tags || []) {
    const clean = String(tag || '').trim().toLowerCase()
    if (clean) seen.add(clean)
  }
  return [...seen]
}

/** Assemble une date et une heure locales (« 14:30 ») en instant ISO, ou null si invalide. */
export function combineDateAndTime(date, time) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(String(time || '').trim())
  if (!(date instanceof Date) || Number.isNaN(date.getTime()) || !match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (hours > 23 || minutes > 59) return null
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0)
}

/** Contrôle local du formulaire (confort) ; le serveur refait tous les contrôles. */
export function validateSlotDraft(draft, now = new Date()) {
  const errors = {}
  const start = combineDateAndTime(draft?.date, draft?.startTime)
  const end = combineDateAndTime(draft?.date, draft?.endTime)
  if (!start) errors.start = 'Indiquez la date et l’heure de début.'
  else if (start <= now) errors.start = 'Le créneau doit commencer dans le futur.'
  if (!end) errors.end = 'Indiquez l’heure de fin.'
  else if (start) {
    const minutes = (end - start) / 60000
    if (minutes < 15 || minutes > 240) errors.end = 'Un créneau dure entre 15 minutes et 4 heures.'
  }
  const location = String(draft?.location || '').trim()
  if (location.length < 2 || location.length > 160) errors.location = 'Indiquez un lieu (2 à 160 caractères).'
  const topics = String(draft?.topics || '').trim()
  if (topics.length < 3 || topics.length > 500) errors.topics = 'Décrivez les sujets (3 à 500 caractères).'
  const tags = normalizeTags(draft?.tags)
  if (tags.length > MENTORING_MAX_TAGS || tags.some((tag) => tag.length > MENTORING_TAG_MAX_LENGTH)) {
    errors.tags = 'Au maximum 6 étiquettes de 30 caractères.'
  }
  if (String(draft?.note || '').trim().length > 500) errors.note = 'La note est limitée à 500 caractères.'
  return { valid: Object.keys(errors).length === 0, errors, start, end, location, topics, tags }
}

const sameDay = (a, b) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** Filtres de la liste publique : sujet (étiquette), classe du mentor, date, créneaux pris. */
export function filterSlots(slots, { tag = null, classe = null, date = null, includeBooked = false } = {}) {
  return (slots || []).filter((slot) => {
    if (!includeBooked && slot.is_booked && !slot.booked_by_me) return false
    if (tag && !(slot.tags || []).includes(tag)) return false
    if (classe && slot.mentor_classe !== classe) return false
    if (date && !sameDay(new Date(slot.starts_at), date)) return false
    return true
  })
}

/** Valeurs proposées dans les filtres, tirées des créneaux affichables. */
export function slotFilterOptions(slots) {
  const tags = new Set()
  const classes = new Set()
  for (const slot of slots || []) {
    for (const tag of slot.tags || []) tags.add(tag)
    if (slot.mentor_classe) classes.add(slot.mentor_classe)
  }
  const sort = (values) => [...values].sort((a, b) => a.localeCompare(b, 'fr'))
  return { tags: sort(tags), classes: sort(classes) }
}

/** Regroupe des créneaux triés par jour (clé locale AAAA-MM-JJ). */
export function groupSlotsByDay(slots) {
  const groups = []
  for (const slot of slots || []) {
    const start = new Date(slot.starts_at)
    const key = [start.getFullYear(), String(start.getMonth() + 1).padStart(2, '0'), String(start.getDate()).padStart(2, '0')].join('-')
    const last = groups[groups.length - 1]
    if (last && last.key === key) last.slots.push(slot)
    else groups.push({ key, date: start, slots: [slot] })
  }
  return groups
}

/**
 * Étape d'un de « mes créneaux » :
 * open, expired, upcoming, in_progress, to_confirm, waiting_other, completed,
 * confirmation_closed, booking_cancelled, cancelled, removed.
 */
export function mySlotPhase(row, now = new Date()) {
  if (row.slot_status === 'removed') return 'removed'
  if (row.slot_status === 'cancelled') return 'cancelled'
  if (row.booking_status === 'cancelled') return 'booking_cancelled'
  const start = new Date(row.starts_at)
  const end = new Date(row.ends_at)
  if (!row.booking_id) return now < start ? 'open' : 'expired'
  if (now < start) return 'upcoming'
  if (now < end) return 'in_progress'
  if (row.completed_at) return 'completed'
  if (row.my_confirmed_at) return 'waiting_other'
  const deadline = new Date(end.getTime() + MENTORING_CONFIRMATION_DAYS * 86400000)
  return now > deadline ? 'confirmation_closed' : 'to_confirm'
}

/** Explication du résultat d'une confirmation, pour le message affiché. */
export function describeConfirmation(result) {
  if (result?.status !== 'completed') {
    return {
      severity: 'info',
      summary: 'Confirmation enregistrée',
      detail: 'Les points seront attribués dès que l’autre personne aura confirmé la rencontre.',
    }
  }
  const xp = Number(result.xp_gained || 0)
  if (xp > 0) {
    return {
      severity: 'success',
      summary: `Rencontre confirmée : +${xp} XP`,
      detail: 'Ces points comptent aussi pour votre maison.',
    }
  }
  const reasons = {
    weekly_cap: `Rencontre confirmée. Vous avez déjà ${MENTORING_WEEKLY_CAP} rencontres récompensées cette semaine-là : pas de points supplémentaires.`,
    not_player: 'Rencontre confirmée. Votre compte ne participe pas au jeu des maisons : aucun point n’est attribué.',
    rewards_disabled: 'Rencontre confirmée. Les récompenses sont actuellement suspendues.',
  }
  return {
    severity: 'info',
    summary: 'Rencontre confirmée',
    detail: reasons[result.reason] || 'Rencontre confirmée, sans points supplémentaires.',
  }
}

export const mentoringService = {
  /** Créneaux à venir (libres ou pris), sans aucun détail de réservation. */
  async listSlots() {
    return (await call('get_mentoring_slots')) || []
  },

  /** Mes créneaux proposés et réservés, avec le détail privé. */
  async listMySlots() {
    return (await call('get_my_mentoring_slots')) || []
  },

  async createSlot({ start, end, location, topics, tags = [], note = '' }) {
    return call('create_mentoring_slot', {
      p_starts_at: start.toISOString(),
      p_ends_at: end.toISOString(),
      p_location: location,
      p_topics: topics,
      p_tags: normalizeTags(tags),
      p_note: String(note || '').trim() || null,
    })
  },

  async bookSlot(slotId, message = '') {
    return call('book_mentoring_slot', {
      p_slot_id: slotId,
      p_message: String(message || '').trim() || null,
    })
  },

  async cancelBooking(slotId) {
    return call('cancel_mentoring_booking', { p_slot_id: slotId })
  },

  async cancelSlot(slotId) {
    return call('cancel_mentoring_slot', { p_slot_id: slotId })
  },

  /** Renvoie { status: 'waiting_other' | 'completed', xp_gained, reason, ... }. */
  async confirmSession(slotId) {
    return (await call('confirm_mentoring_session', { p_slot_id: slotId })) || {}
  },

  async adminRemoveSlot(slotId, reason = '') {
    return call('admin_remove_mentoring_slot', {
      p_slot_id: slotId,
      p_reason: String(reason || '').trim() || null,
    })
  },

  /** Dernières notifications de mentorat reçues (système de notifications existant). */
  async listNotifications(userId, limit = 5) {
    if (!userId) return []
    const { data, error } = await supabase
      .from('push_outbox')
      .select('id, title, body, created_at')
      .eq('user_id', userId)
      .like('url', '/mentorat%')
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) return []
    return data || []
  },
}

export default mentoringService
