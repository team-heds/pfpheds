// Thème clair ou sombre : deux feuilles de style, dont une seule est active.
// Même mécanisme que le bouton de thème de la barre d'ordinateur.

const links = (doc) => Array.from(doc.querySelectorAll('link[data-theme-link="heds"]'))

export function currentScheme(doc = document) {
  const light = links(doc).find((link) => link.dataset.themeScheme === 'light')
  return light && !light.disabled && light.media !== 'not all' ? 'light' : 'dim'
}

/** Active le thème demandé ; retourne le thème réellement en service. */
export function applyScheme(scheme, doc = document, win = window) {
  const all = links(doc)
  const target = all.find((link) => link.dataset.themeScheme === scheme)
  // En production le thème sombre est intégré à la feuille principale :
  // il suffit alors de désactiver la feuille claire.
  if (!target && scheme !== 'dim') return currentScheme(doc)
  all.forEach((link) => {
    const active = link === target
    link.disabled = !active
    link.media = active ? 'all' : 'not all'
  })
  win.dispatchEvent(new CustomEvent('heds:theme-change', { detail: { scheme } }))
  return currentScheme(doc)
}
