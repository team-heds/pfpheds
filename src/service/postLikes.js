// Logique pure des « J'aime » du fil (sans Vue ni Supabase), testée unitairement.

const countFormatter = new Intl.NumberFormat('fr-CH')

/** « 1 j'aime », « 12 j'aime », « 1 234 j'aime ». */
export function formatLikeCount(count) {
  const safe = Math.max(0, Number(count) || 0)
  return `${countFormatter.format(safe)} j’aime`
}

/**
 * Gère l'état d'un cœur avec mise à jour optimiste.
 *
 * - L'affichage change tout de suite ; le serveur suit.
 * - Les clics rapides ne lancent jamais deux requêtes en parallèle : on envoie
 *   seulement l'état final voulu, une requête à la fois.
 * - Si le serveur refuse, on revient au dernier état confirmé et onError est appelé.
 */
export function createLikeController({ liked = false, count = 0, like, unlike, onChange, onError } = {}) {
  let confirmed = { liked: Boolean(liked), count: Math.max(0, Number(count) || 0) }
  let state = { ...confirmed }
  let desired = confirmed.liked
  let running = null

  const snapshot = () => ({ ...state, pending: running !== null })
  const emit = () => onChange?.(snapshot())
  const step = (value, next) => Math.max(0, value + (next ? 1 : -1))

  async function flush() {
    try {
      while (desired !== confirmed.liked) {
        const target = desired
        try {
          await (target ? like() : unlike())
        } catch (error) {
          desired = confirmed.liked
          state = { ...confirmed }
          onError?.(error)
          return false
        }
        confirmed = { liked: target, count: step(confirmed.count, target) }
      }
      return true
    } finally {
      running = null
      emit()
    }
  }

  function setLiked(next) {
    if (next === state.liked) return running || Promise.resolve(true)
    desired = next
    state = { liked: next, count: step(state.count, next) }
    if (!running) running = flush()
    emit()
    return running
  }

  return {
    /** Clic sur le cœur : aimer ou retirer. */
    toggle: () => setLiked(!state.liked),
    /** Double-tap : aimer seulement, ne retire jamais. */
    like: () => setLiked(true),
    /** Nouvelles valeurs du serveur (rechargement) : ignorées pendant un envoi. */
    sync({ liked: serverLiked, count: serverCount }) {
      if (running) return
      confirmed = { liked: Boolean(serverLiked), count: Math.max(0, Number(serverCount) || 0) }
      state = { ...confirmed }
      desired = confirmed.liked
      emit()
    },
    getState: snapshot
  }
}

/**
 * Détecte deux appuis rapprochés (temps et position) pour le double-tap tactile.
 * Retourne une fonction (temps, x, y) => true quand l'appui complète un double-tap.
 */
export function createDoubleTapDetector({ delay = 300, slop = 30 } = {}) {
  let last = null
  return (time, x = 0, y = 0) => {
    if (last && time - last.time <= delay && Math.hypot(x - last.x, y - last.y) <= slop) {
      last = null
      return true
    }
    last = { time, x, y }
    return false
  }
}

const INTERACTIVE_SELECTOR = 'a, button, input, textarea, select, video, audio, iframe, embed, [role="button"]'

/** Le double-tap ne doit pas voler les gestes des liens, vidéos ou lecteurs intégrés. */
export function isInteractiveTarget(target) {
  return Boolean(target?.closest?.(INTERACTIVE_SELECTOR))
}
