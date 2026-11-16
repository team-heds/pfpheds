// Barre d'onglets qui se cache au défilement, selon les règles de l'application
// mobile (documentation/docs/frontend/mobile-app-rules.md, section 2) :
// - se cache après 48 px de défilement continu vers le bas, jamais au premier pixel ;
// - réapparaît dès qu'on remonte, ou en haut de la liste ;
// - ne se cache pas sur un écran trop court pour défiler vraiment.

export const HIDE_AFTER = 48
const TOP_ZONE = 8
const UP_JITTER = 4

export function createScrollHider({ hideAfter = HIDE_AFTER, minExtra = 160 } = {}) {
  let lastTop = 0
  let downSince = null
  let hidden = false

  return {
    /** Nouvelle position ; retourne vrai si la barre doit être cachée. */
    update({ scrollTop, scrollHeight, clientHeight }) {
      const top = Math.max(0, scrollTop)
      const delta = top - lastTop
      lastTop = top
      const scrollable = scrollHeight - clientHeight > minExtra
      if (!scrollable || top <= TOP_ZONE) {
        downSince = null
        hidden = false
      } else if (delta < -UP_JITTER) {
        downSince = null
        hidden = false
      } else if (delta > 0) {
        if (downSince === null) downSince = top - delta
        if (top - downSince >= hideAfter) hidden = true
      }
      return hidden
    },
    reset() {
      lastTop = 0
      downSince = null
      hidden = false
    },
  }
}
