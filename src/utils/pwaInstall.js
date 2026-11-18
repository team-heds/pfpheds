// Aides pour l'invitation d'installation de l'application (PWA).
const DISMISSED_KEY = 'heds.pwa-install.dismissed-at'
const DISMISS_DURATION_MS = 30 * 24 * 60 * 60 * 1000

/** Vrai quand l'application est déjà ouverte depuis l'écran d'accueil. */
export function isStandaloneDisplay(win = window) {
  return win.navigator?.standalone === true
    || Boolean(win.matchMedia?.('(display-mode: standalone)')?.matches)
}

/** iPhone, iPod et iPad (y compris l'iPad qui s'annonce comme un Mac). */
export function isIosDevice(win = window) {
  const { userAgent = '', platform = '', maxTouchPoints = 0 } = win.navigator || {}
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

export function wasInstallPromptDismissed(storage = window.localStorage, now = Date.now()) {
  try {
    const dismissedAt = Number(storage.getItem(DISMISSED_KEY))
    return Number.isFinite(dismissedAt) && dismissedAt > 0 && now - dismissedAt < DISMISS_DURATION_MS
  } catch {
    return false
  }
}

export function markInstallPromptDismissed(storage = window.localStorage, now = Date.now()) {
  try {
    storage.setItem(DISMISSED_KEY, String(now))
  } catch {
    // Stockage indisponible (navigation privée) : l'invitation reviendra simplement.
  }
}

/**
 * L'invitation d'installation n'apparaît qu'une fois connecté, hors des pages
 * de connexion et plein écran : sur iPhone, elle recouvrait le bouton
 * « Se connecter » et s'affichait aussi aux visiteurs des pages publiques.
 */
export function isInstallPromptAllowed(userId, routeMeta = {}) {
  const meta = routeMeta || {}
  return Boolean(userId)
    && userId !== 'guest-user'
    && meta.hideMobileNav !== true
    && meta.immersive !== true
}
