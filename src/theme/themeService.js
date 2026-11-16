// Thème de la plateforme : un seul réglage pour tous les boutons, les graphiques
// et la carte.
//
// - Trois choix : sombre (par défaut), clair, automatique (suit le téléphone ou
//   l'ordinateur, `prefers-color-scheme`, et réagit à son changement).
// - Le choix est gardé dans le navigateur et appliqué avant le premier rendu par
//   le petit script d'index.html (même clé, même logique) : pas de flash.
// - Deux feuilles : le thème sombre (intégré à la feuille principale en
//   production) et le thème clair, un <link data-theme-scheme="light"> activé à
//   la demande. Activé, il est placé en dernier dans <head> pour l'emporter sur
//   la feuille principale chargée après lui.
// - Chaque changement émet `heds:theme-change` ({ scheme, preference }) et met à
//   jour la couleur de la barre d'état (`theme-color`).

export const THEME_STORAGE_KEY = 'heds.theme'
export const THEME_PREFERENCES = ['dim', 'light', 'auto']
export const DEFAULT_PREFERENCE = 'dim'
export const THEME_COLORS = { dim: '#0B213F', light: '#ffffff' }
export const THEME_EVENT = 'heds:theme-change'
const LIGHT_QUERY = '(prefers-color-scheme: light)'

const defaultWin = () => (typeof window === 'undefined' ? null : window)

const links = (doc) => Array.from(doc?.querySelectorAll('link[data-theme-link="heds"]') || [])

export function normalizePreference(value) {
  return THEME_PREFERENCES.includes(value) ? value : DEFAULT_PREFERENCE
}

/** Choix enregistré (« dim » si rien, ou si le navigateur refuse le stockage). */
export function readPreference(win = defaultWin()) {
  try {
    return normalizePreference(win?.localStorage?.getItem(THEME_STORAGE_KEY))
  } catch {
    return DEFAULT_PREFERENCE
  }
}

/** Thème réellement affiché pour un choix : « light » ou « dim ». */
export function resolveScheme(preference, win = defaultWin()) {
  const choice = normalizePreference(preference)
  if (choice === 'auto') return win?.matchMedia?.(LIGHT_QUERY).matches ? 'light' : 'dim'
  return choice
}

/** Thème affiché en ce moment, lu dans la page. */
export function currentScheme(doc = defaultWin()?.document) {
  const attribute = doc?.documentElement?.dataset?.theme
  if (attribute === 'light' || attribute === 'dim') return attribute
  const light = links(doc).find((link) => link.dataset.themeScheme === 'light')
  return light && !light.disabled && light.media !== 'not all' ? 'light' : 'dim'
}

export const isDarkScheme = (doc) => currentScheme(doc) !== 'light'

/** Affiche un thème (« light » ou « dim ») sans toucher au choix enregistré. */
export function applyScheme(scheme, { doc = defaultWin()?.document, win = defaultWin(), preference = null } = {}) {
  if (!doc) return 'dim'
  const target = scheme === 'light' ? 'light' : 'dim'
  for (const link of links(doc)) {
    const active = link.dataset.themeScheme === target
    link.disabled = !active
    link.media = active ? 'all' : 'not all'
    // Après la feuille principale, sinon le thème sombre qu'elle contient l'emporte.
    if (active && target === 'light' && doc.head && link.parentNode === doc.head && doc.head.lastElementChild !== link) {
      doc.head.appendChild(link)
    }
  }
  doc.documentElement.dataset.theme = target
  doc.documentElement.style.colorScheme = target === 'light' ? 'light' : 'dark'
  const meta = doc.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute('content', THEME_COLORS[target])
  const CustomEventCtor = win?.CustomEvent || (typeof CustomEvent === 'undefined' ? null : CustomEvent)
  if (win?.dispatchEvent && CustomEventCtor) {
    win.dispatchEvent(new CustomEventCtor(THEME_EVENT, { detail: { scheme: target, preference: preference || readPreference(win) } }))
  }
  return target
}

let systemQuery = null
let systemListener = null

function followSystem(win, enabled) {
  if (systemQuery && systemListener) {
    if (systemQuery.removeEventListener) systemQuery.removeEventListener('change', systemListener)
    else systemQuery.removeListener?.(systemListener)
  }
  systemQuery = null
  systemListener = null
  if (!enabled || !win?.matchMedia) return
  systemQuery = win.matchMedia(LIGHT_QUERY)
  systemListener = () => applyScheme(resolveScheme('auto', win), { doc: win.document, win, preference: 'auto' })
  if (systemQuery.addEventListener) systemQuery.addEventListener('change', systemListener)
  else systemQuery.addListener?.(systemListener)
}

/** Enregistre un choix (« dim », « light », « auto ») et l'applique. Retourne le thème affiché. */
export function setPreference(preference, win = defaultWin()) {
  const choice = normalizePreference(preference)
  try {
    win?.localStorage?.setItem(THEME_STORAGE_KEY, choice)
  } catch {
    // Navigation privée ou stockage bloqué : le choix vaut pour cette visite.
  }
  followSystem(win, choice === 'auto')
  return applyScheme(resolveScheme(choice, win), { doc: win?.document, win, preference: choice })
}

/** Au démarrage : applique le choix enregistré et suit le système s'il est automatique. */
export function initTheme(win = defaultWin()) {
  const choice = readPreference(win)
  followSystem(win, choice === 'auto')
  return applyScheme(resolveScheme(choice, win), { doc: win?.document, win, preference: choice })
}

/** Passe du sombre au clair ou inversement (bouton à deux états). */
export function toggleScheme(win = defaultWin()) {
  return setPreference(currentScheme(win?.document) === 'light' ? 'dim' : 'light', win)
}
