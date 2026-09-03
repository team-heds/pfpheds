/**
 * Source unique de vérité pour le thème clair/sombre HEdS.
 *
 * Centralise :
 * - la validation du schéma de couleur (uniquement "dim" ou "light")
 * - la synchronisation de l'attribut data-theme sur <html>
 * - la synchronisation de layoutConfig.colorScheme (état partagé existant)
 * - la persistance dans localStorage
 * - le remplacement de la feuille CSS #theme-link
 *
 * Toute UI (SwitchColor, AppDarkAndLightMode, AppConfig) doit utiliser
 * exclusivement ce composable plutôt que de manipuler #theme-link directement.
 */
import { useLayout } from '@/layout/composables/layout'

export const COLOR_SCHEMES = ['dim', 'light']
export const DEFAULT_COLOR_SCHEME = 'dim'
const STORAGE_KEY = 'colorScheme'

const { layoutConfig } = useLayout()

/**
 * Ramène toute valeur invalide vers le thème par défaut (dim).
 * @param {unknown} value
 * @returns {'dim' | 'light'}
 */
export function normalizeColorScheme(value) {
  return COLOR_SCHEMES.includes(value) ? value : DEFAULT_COLOR_SCHEME
}

/**
 * Lit la préférence enregistrée par l'utilisateur, si elle existe et est valide.
 * @returns {'dim' | 'light' | null}
 */
export function readStoredColorScheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return COLOR_SCHEMES.includes(stored) ? stored : null
  } catch {
    // localStorage indisponible (navigation privée stricte, quota, etc.)
    return null
  }
}

function persistColorScheme(scheme) {
  try {
    localStorage.setItem(STORAGE_KEY, scheme)
  } catch {
    // Échec silencieux : la préférence ne persistera pas, mais l'UI reste fonctionnelle.
  }
}

function applyDataTheme(scheme) {
  document.documentElement.setAttribute('data-theme', scheme)
}

/**
 * Récupère les deux <link data-theme-link="heds"> présents dans le DOM
 * (un par variante, voir index.html). Renvoie null si introuvable
 * (ex. environnement de test sans le head HTML attendu).
 * @param {'dim' | 'light'} scheme
 * @returns {HTMLLinkElement | null}
 */
function getThemeLinkElement(scheme) {
  return document.querySelector(`link[data-theme-link="heds"][data-theme-scheme="${scheme}"]`)
}

function activateLink(link) {
  link.media = 'all'
  link.disabled = false
}

function deactivateLink(link) {
  link.media = 'not all'
  link.disabled = true
}

// Jeton incrémental permettant d'ignorer les callbacks obsolètes lorsque
// l'utilisateur bascule le thème plusieurs fois rapidement : seule la
// dernière demande en cours doit pouvoir modifier l'état applicatif.
let pendingSwapToken = 0

/**
 * Remplace la feuille CSS active sans jamais laisser la page sans style :
 * la nouvelle feuille est activée seulement une fois chargée avec succès,
 * puis l'ancienne est désactivée. En cas d'échec de chargement, le thème
 * actuel est conservé et rien n'est modifié (data-theme, layoutConfig,
 * localStorage restent sur l'ancien schéma).
 * @param {'dim' | 'light'} scheme
 * @returns {Promise<boolean>} true si la bascule a réussi
 */
function swapThemeLink(scheme) {
  const token = ++pendingSwapToken
  const previous = normalizeColorScheme(layoutConfig.colorScheme.value)

  if (scheme === previous) {
    return Promise.resolve(true)
  }

  const nextLink = getThemeLinkElement(scheme)
  const previousLink = getThemeLinkElement(previous)

  if (!nextLink) {
    // Pas de <link> correspondant dans le DOM : on ne peut pas garantir
    // l'absence de flash, on abandonne sans toucher à l'état existant.
    return Promise.resolve(false)
  }

  const isStale = () => token !== pendingSwapToken

  const finalizeSuccess = () => {
    if (isStale()) return false
    activateLink(nextLink)
    if (previousLink) deactivateLink(previousLink)
    return true
  }

  // Un lien désactivé peut déjà être chargé, mais `link.sheet` n'est pas
  // toujours fiable dans ce cas (notamment après une première bascule).
  // L'événement `load` n'est alors pas rejoué : on l'active directement et le
  // navigateur utilise la feuille déjà chargée ou la charge normalement.
  if (nextLink.sheet || nextLink.disabled || nextLink.media === 'not all') {
    return Promise.resolve(finalizeSuccess())
  }

  return new Promise((resolve) => {
    const onLoad = () => {
      cleanup()
      resolve(finalizeSuccess())
    }
    const onError = () => {
      cleanup()
      // Échec de chargement : on conserve le thème actuel, aucun changement d'état.
      resolve(false)
    }
    const cleanup = () => {
      nextLink.removeEventListener('load', onLoad)
      nextLink.removeEventListener('error', onError)
    }

    nextLink.addEventListener('load', onLoad)
    nextLink.addEventListener('error', onError)
  })
}

/**
 * Applique un schéma de couleur : data-theme, layoutConfig et localStorage.
 * @param {'dim' | 'light'} scheme
 */
function applyColorSchemeState(scheme) {
  applyDataTheme(scheme)
  layoutConfig.colorScheme.value = scheme
  persistColorScheme(scheme)
}

/**
 * À appeler le plus tôt possible (idéalement avant le montage de Vue) pour
 * éviter tout flash du mauvais thème. Ne touche pas au localStorage puisque
 * la préférence est simplement relue, pas modifiée.
 * @returns {'dim' | 'light'} le schéma appliqué
 */
export function initializeColorScheme() {
  const stored = readStoredColorScheme()
  const scheme = normalizeColorScheme(stored)

  applyDataTheme(scheme)
  layoutConfig.colorScheme.value = scheme

  return scheme
}

/**
 * Définit explicitement le schéma de couleur actif. La feuille CSS est
 * échangée sans rupture visuelle (voir swapThemeLink) : si le chargement
 * échoue, le thème actuel est conservé et la promesse résout false.
 * @param {string} newScheme
 * @returns {Promise<'dim' | 'light'>} le schéma effectivement actif après résolution
 */
export async function setColorScheme(newScheme) {
  const scheme = normalizeColorScheme(newScheme)
  const current = normalizeColorScheme(layoutConfig.colorScheme.value)

  if (scheme === current) {
    return current
  }

  const succeeded = await swapThemeLink(scheme)

  if (succeeded) {
    applyColorSchemeState(scheme)
    return scheme
  }

  return current
}

/**
 * Bascule entre les deux thèmes disponibles.
 * @returns {Promise<'dim' | 'light'>}
 */
export function toggleColorScheme() {
  const current = normalizeColorScheme(layoutConfig.colorScheme.value)
  const next = current === 'dim' ? 'light' : 'dim'
  return setColorScheme(next)
}

/**
 * Composable Vue exposant l'état réactif et les actions de thème.
 */
export function useColorScheme() {
  return {
    colorScheme: layoutConfig.colorScheme,
    initializeColorScheme,
    setColorScheme,
    toggleColorScheme,
  }
}
