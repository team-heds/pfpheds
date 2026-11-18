// Retour par glissement depuis le bord gauche (geste d'iOS), pour l'application
// installée sur iPhone : elle n'a ni bouton retour du navigateur ni geste du
// système. Ce module ne touche pas à la page : il dit seulement, à chaque
// mouvement du doigt, s'il faut suivre le glissement et s'il faut revenir.

/** Largeur de la bande du bord gauche où le geste peut commencer. */
export const EDGE_ZONE = 24
/** Déplacement à partir duquel on sait si le doigt part de côté ou vers le bas. */
const DECIDE_AFTER = 10
/** Part de la largeur de l'écran à dépasser pour revenir en lâchant le doigt. */
const COMMIT_RATIO = 0.35
/** Lancer rapide (px/ms) qui suffit pour revenir, même sur une courte distance. */
const FLING_SPEED = 0.5
const FLING_MIN = 40

export function createEdgeSwipe({ width, edge = EDGE_ZONE } = {}) {
  let origin = null
  let engaged = false
  let dx = 0
  let last = null
  let speed = 0

  const reset = () => {
    origin = null
    engaged = false
    dx = 0
    last = null
    speed = 0
  }

  return {
    /** Doigt posé. Retourne vrai si le geste peut commencer ici. */
    start({ x, y, t }) {
      reset()
      if (x > edge) return false
      origin = { x, y }
      last = { x, t }
      return true
    },

    /**
     * Doigt déplacé. `idle` : on ne sait pas encore ; `cancel` : le doigt part
     * vers le haut ou le bas, le défilement normal reprend ; `drag` : l'écran
     * suit le doigt de `dx` pixels.
     */
    move({ x, y, t }) {
      if (!origin) return { state: 'idle', dx: 0 }
      const moveX = x - origin.x
      const moveY = y - origin.y
      if (!engaged) {
        if (Math.abs(moveY) > DECIDE_AFTER && Math.abs(moveY) >= moveX) {
          reset()
          return { state: 'cancel', dx: 0 }
        }
        if (moveX <= DECIDE_AFTER) return { state: 'idle', dx: 0 }
        engaged = true
      }
      if (t > last.t) speed = (x - last.x) / (t - last.t)
      last = { x, t }
      dx = Math.max(0, moveX)
      return { state: 'drag', dx }
    },

    /** Doigt levé. `commit` : revenir à l'écran précédent. */
    end() {
      const result = {
        engaged,
        commit: engaged && (dx > width * COMMIT_RATIO || (speed > FLING_SPEED && dx > FLING_MIN)),
      }
      reset()
      return result
    },

    get engaged() {
      return engaged
    },
  }
}

/** Le doigt est-il posé dans une zone qui défile de côté (carrousel, carte, curseur) ? */
export function startsInHorizontalArea(target, root) {
  for (let el = target; el && el !== root && el.nodeType === 1; el = el.parentElement) {
    if (el.matches?.('.leaflet-container, input[type="range"], [data-no-edge-swipe]')) return true
    const style = el.ownerDocument?.defaultView?.getComputedStyle?.(el)
    const overflowX = style?.overflowX
    if ((overflowX === 'auto' || overflowX === 'scroll') && el.scrollWidth > el.clientWidth + 1) return true
  }
  return false
}
