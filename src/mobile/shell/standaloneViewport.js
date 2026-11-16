/**
 * Hauteur de l'application installée sur iPhone.
 *
 * Avec la barre d'état transparente (`black-translucent`) et `viewport-fit=cover`,
 * iOS annonce parfois une fenêtre plus courte que l'écran, de la hauteur de la barre
 * d'état : une coque ancrée en bas (`position: fixed; inset: 0`) s'arrête alors avant le
 * bord et laisse une bande vide sous la barre d'onglets. En application installée,
 * l'application occupe tout l'écran : on prend donc la hauteur de l'écran.
 *
 * Seulement pour l'application installée sur iPhone ou iPad (`navigator.standalone`) :
 * sur Android, `screen.height` compte aussi la barre de navigation du système.
 */
export function standaloneScreenHeight(win) {
  if (!win || win.navigator?.standalone !== true) return null
  const { screen } = win
  const width = Number(win.innerWidth) || 0
  const height = Number(win.innerHeight) || 0
  if (!screen?.width || !screen?.height || !height) return null

  const landscape = width > height
  const screenHeight = landscape
    ? Math.min(screen.width, screen.height)
    : Math.max(screen.width, screen.height)

  // Rien à corriger quand la fenêtre annonce déjà toute la hauteur de l'écran.
  return screenHeight > height + 1 ? screenHeight : null
}

/**
 * Pose `--app-height` sur la racine du document quand iOS annonce une fenêtre trop
 * courte, et la tient à jour (rotation, retour au premier plan). Avec `?diagnostic-ecran`
 * dans l'adresse, affiche les mesures pour les comparer sur un vrai téléphone.
 * Renvoie la fonction qui retire les écouteurs.
 */
export function installStandaloneViewportFix(win = typeof window !== 'undefined' ? window : null, doc = win?.document) {
  if (!win || !doc?.documentElement) return () => {}
  const root = doc.documentElement
  const diagnostic = /[?&]diagnostic-ecran\b/.test(win.location?.search || '')
  let panel = null

  const apply = () => {
    const height = standaloneScreenHeight(win)
    if (height) root.style.setProperty('--app-height', `${height}px`)
    else root.style.removeProperty('--app-height')

    if (!diagnostic) return
    if (!panel) {
      panel = doc.createElement('pre')
      panel.setAttribute('aria-live', 'polite')
      panel.style.cssText = 'position:fixed;top:60px;left:8px;z-index:99999;margin:0;padding:8px 10px;border-radius:8px;background:rgba(0,0,0,.82);color:#fff;font:12px/1.4 monospace;pointer-events:none'
      doc.body?.appendChild(panel)
    }
    const probe = doc.createElement('div')
    probe.style.cssText = 'position:fixed;top:0;left:0;padding:env(safe-area-inset-top) 0 env(safe-area-inset-bottom);visibility:hidden'
    doc.body?.appendChild(probe)
    const styles = win.getComputedStyle?.(probe)
    const shell = doc.querySelector('.app-shell')
    panel.textContent = [
      `installée : ${win.navigator?.standalone === true ? 'oui' : 'non'}`,
      `écran : ${win.screen?.width} × ${win.screen?.height}`,
      `fenêtre : ${win.innerWidth} × ${win.innerHeight}`,
      `zone visible : ${Math.round(win.visualViewport?.height || 0)}`,
      `zones sûres : haut ${styles?.paddingTop} / bas ${styles?.paddingBottom}`,
      `hauteur appliquée : ${height ? `${height}px` : 'aucune'}`,
      `coque : ${shell ? Math.round(shell.getBoundingClientRect().bottom) : '?'} px (bas)`,
    ].join('\n')
    probe.remove()
  }

  apply()
  const onChange = () => win.requestAnimationFrame ? win.requestAnimationFrame(apply) : apply()
  win.addEventListener?.('resize', onChange)
  win.addEventListener?.('orientationchange', onChange)
  win.addEventListener?.('pageshow', onChange)
  doc.addEventListener?.('visibilitychange', onChange)
  return () => {
    win.removeEventListener?.('resize', onChange)
    win.removeEventListener?.('orientationchange', onChange)
    win.removeEventListener?.('pageshow', onChange)
    doc.removeEventListener?.('visibilitychange', onChange)
    panel?.remove()
  }
}
