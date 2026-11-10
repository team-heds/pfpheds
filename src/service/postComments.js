// Logique pure des commentaires du fil (sans Vue ni Supabase), testée unitairement.

export const MAX_COMMENT_LENGTH = 1000

const countFormatter = new Intl.NumberFormat('fr-CH')
const dayMonth = new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'long' })
const dayMonthYear = new Intl.DateTimeFormat('fr-CH', { day: 'numeric', month: 'long', year: 'numeric' })
const fullDate = new Intl.DateTimeFormat('fr-CH', { dateStyle: 'long', timeStyle: 'short' })

const MINUTE = 60 * 1000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY

function toTime(value) {
  if (value instanceof Date) return value.getTime()
  if (typeof value === 'number') return value
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? null : parsed
}

/** « à l'instant », « il y a 5 min », « il y a 3 h », « il y a 2 j », « il y a 3 sem », puis la date. */
export function formatRelativeTime(value, now = Date.now()) {
  const time = toTime(value)
  if (time == null) return ''
  const diff = Math.max(0, now - time)
  if (diff < MINUTE) return 'à l’instant'
  if (diff < HOUR) return `il y a ${Math.floor(diff / MINUTE)} min`
  if (diff < DAY) return `il y a ${Math.floor(diff / HOUR)} h`
  if (diff < WEEK) return `il y a ${Math.floor(diff / DAY)} j`
  if (diff < 5 * WEEK) return `il y a ${Math.floor(diff / WEEK)} sem`
  const date = new Date(time)
  return date.getFullYear() === new Date(now).getFullYear() ? dayMonth.format(date) : dayMonthYear.format(date)
}

/** Date complète, pour l'infobulle et l'attribut datetime. */
export function formatFullDate(value) {
  const time = toTime(value)
  return time == null ? '' : fullDate.format(new Date(time))
}

/** « Voir le commentaire », « Voir les 12 commentaires ». */
export function formatViewCommentsLabel(count) {
  const safe = Math.max(0, Number(count) || 0)
  if (safe <= 1) return 'Voir le commentaire'
  return `Voir les ${countFormatter.format(safe)} commentaires`
}

/** « 1 réponse », « 3 réponses ». */
export function formatRepliesLabel(count) {
  const safe = Math.max(0, Number(count) || 0)
  return `${countFormatter.format(safe)} ${safe > 1 ? 'réponses' : 'réponse'}`
}

/** Texte prêt à l'envoi : espaces de bord retirés ; '' si rien d'utile. */
export function normalizeCommentText(text) {
  return String(text ?? '').trim()
}

/** Raison du refus côté client, ou null si le texte peut partir. */
export function validateCommentText(text) {
  const clean = normalizeCommentText(text)
  if (!clean) return 'Écrivez un commentaire avant de publier.'
  if (clean.length > MAX_COMMENT_LENGTH) {
    return `Votre commentaire dépasse ${countFormatter.format(MAX_COMMENT_LENGTH)} caractères.`
  }
  return null
}

const byDate = (a, b) => {
  const diff = (toTime(a.created_at) ?? 0) - (toTime(b.created_at) ?? 0)
  return diff || String(a.id).localeCompare(String(b.id))
}

/**
 * Fils de discussion : commentaires de premier niveau du plus ancien au plus récent,
 * chacun avec ses réponses dans le même ordre. Une réponse dont le parent manque
 * reste visible au premier niveau.
 */
export function buildCommentThreads(comments) {
  const list = [...(comments || [])].sort(byDate)
  const topIds = new Set(list.filter((c) => !c.parent_id).map((c) => c.id))
  const threads = []
  const byId = new Map()
  list.forEach((comment) => {
    if (!comment.parent_id || !topIds.has(comment.parent_id)) {
      const thread = { ...comment, replies: [] }
      byId.set(comment.id, thread)
      threads.push(thread)
    }
  })
  list.forEach((comment) => {
    if (comment.parent_id && topIds.has(comment.parent_id)) byId.get(comment.parent_id).replies.push(comment)
  })
  return threads
}

/** Une réponse vise toujours un commentaire de premier niveau (un seul niveau, comme Instagram). */
export function resolveReplyTarget(comment) {
  if (!comment) return null
  return { parentId: comment.parent_id || comment.id, mention: comment.display_name || '' }
}

/** Ajoute ou remplace des commentaires (par id). */
export function upsertComments(list, items) {
  const byId = new Map((list || []).map((c) => [c.id, c]))
  ;(items || []).forEach((item) => byId.set(item.id, { ...byId.get(item.id), ...item }))
  return [...byId.values()].sort(byDate)
}

/** Retire un commentaire et ses réponses ; retourne la nouvelle liste et ce qui a été retiré. */
export function removeCommentTree(list, id) {
  const removed = []
  const kept = []
  ;(list || []).forEach((comment) => {
    if (comment.id === id || comment.parent_id === id) removed.push(comment)
    else kept.push(comment)
  })
  return { list: kept, removed }
}
