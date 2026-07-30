import { ref, watch } from 'vue'

/**
 * Composable pour debouncer une valeur réactive.
 * Utile pour les champs de recherche/filtre afin d'éviter des appels excessifs.
 *
 * @param {import('vue').Ref} source - La ref à debouncer
 * @param {number} delay - Délai en ms (défaut: 300)
 * @returns {import('vue').Ref} - La valeur debouncée
 *
 * @example
 * const search = ref('')
 * const debouncedSearch = useDebounce(search, 400)
 * // debouncedSearch se met à jour 400ms après le dernier changement de search
 */
export function useDebounce(source, delay = 300) {
  const debounced = ref(source.value)
  let timeout = null

  watch(source, (newVal) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => {
      debounced.value = newVal
    }, delay)
  })

  return debounced
}

/**
 * Crée une fonction debouncée.
 * Utile pour debouncer des callbacks (ex: appels API).
 *
 * @param {Function} fn - La fonction à debouncer
 * @param {number} delay - Délai en ms (défaut: 300)
 * @returns {Function} - La fonction debouncée
 *
 * @example
 * const debouncedFetch = useDebounceFn(() => fetchResults(query.value), 500)
 */
export function useDebounceFn(fn, delay = 300) {
  let timeout = null

  const debouncedFn = (...args) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), delay)
  }

  debouncedFn.cancel = () => {
    if (timeout) {
      clearTimeout(timeout)
      timeout = null
    }
  }

  return debouncedFn
}
