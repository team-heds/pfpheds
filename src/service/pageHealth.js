import { reactive } from 'vue'

// Échecs serveur ou réseau survenus depuis l'arrivée sur la page. Une page restée
// presque vide après un échec reçoit un message commun avec « Réessayer ».
export const pageHealth = reactive({ failures: 0 })

export function resetPageHealth() {
  pageHealth.failures = 0
}

export function trackedFetch(fetcher = (...args) => window.fetch(...args)) {
  return (...args) => fetcher(...args).then(
    (response) => {
      if (response?.status >= 500) pageHealth.failures += 1
      return response
    },
    (error) => {
      if (error?.name !== 'AbortError') pageHealth.failures += 1
      throw error
    },
  )
}

const CHROME = 'nav, header, [role="navigation"], .p-toast, .error-fallback, .sr-only, script, style'

/** Texte réellement affiché par la page, sans la barre de navigation. */
export function pageTextLength(root) {
  if (!root) return 0
  const clone = root.cloneNode(true)
  clone.querySelectorAll(CHROME).forEach((node) => node.remove())
  return (clone.textContent || '').replace(/\s+/g, ' ').trim().length
}
