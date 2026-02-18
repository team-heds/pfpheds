import { ref, onUnmounted } from 'vue'

/**
 * Composable pour déclencher un rechargement de données avec debounce.
 *
 * Évite les appels multiples rapprochés (ex. après plusieurs mutations)
 * et nettoie automatiquement le timer au démontage du composant.
 *
 * @param {Function} reloadFn - Fonction (sync ou async) à appeler pour recharger les données
 * @param {Object}  [options]
 * @param {number}  [options.delay=400] - Délai par défaut en ms
 * @returns {{ scheduleRefresh: (delay?: number) => void, cancelRefresh: () => void }}
 *
 * @example
 * const { scheduleRefresh } = useAutoRefresh(() => loadPublishedAssignments())
 * // après une mutation :
 * scheduleRefresh()      // recharge après 400 ms (défaut)
 * scheduleRefresh(200)   // recharge après 200 ms
 */
export function useAutoRefresh(reloadFn, options = {}) {
  const defaultDelay = options.delay ?? 400
  const timeout = ref(null)

  const cancelRefresh = () => {
    if (timeout.value) {
      clearTimeout(timeout.value)
      timeout.value = null
    }
  }

  const scheduleRefresh = (delay = defaultDelay) => {
    cancelRefresh()
    timeout.value = setTimeout(() => {
      reloadFn()
    }, delay)
  }

  onUnmounted(cancelRefresh)

  return { scheduleRefresh, cancelRefresh }
}
