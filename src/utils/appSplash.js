// Écran de chargement d'index.html (#app-splash) : il couvre la page jusqu'au
// premier rendu de l'application, puis s'efface en fondu court (aucun fondu si
// la personne a demandé moins de mouvement).

const FADE_MS = 200

export function hideAppSplash({ doc = typeof document === 'undefined' ? null : document, win = typeof window === 'undefined' ? null : window } = {}) {
  const splash = doc?.getElementById('app-splash')
  if (!splash) return false
  const reduced = Boolean(win?.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  if (reduced) {
    splash.remove()
    return true
  }
  const remove = () => splash.remove()
  // Après le premier dessin de l'application, pour qu'aucune page blanche n'apparaisse.
  const raf = win?.requestAnimationFrame?.bind(win) || ((callback) => setTimeout(callback, 16))
  raf(() => {
    splash.classList.add('is-leaving')
    splash.addEventListener('transitionend', remove, { once: true })
    // Filet de sécurité si la transition ne se termine jamais (onglet en arrière-plan).
    setTimeout(remove, FADE_MS + 150)
  })
  return true
}
