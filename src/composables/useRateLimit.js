import { ref } from 'vue'

/**
 * Composable pour limiter le nombre de tentatives d'une action (login, reset password, etc.)
 * Protège contre le brute-force côté client.
 *
 * @param {Object} options
 * @param {number} options.maxAttempts - Nombre max de tentatives avant blocage (défaut: 5)
 * @param {number} options.lockoutDuration - Durée du blocage en ms (défaut: 60000 = 1 min)
 * @param {number} options.windowDuration - Fenêtre de temps pour compter les tentatives en ms (défaut: 300000 = 5 min)
 * @returns {Object}
 */
export function useRateLimit(options = {}) {
  const {
    maxAttempts = 5,
    lockoutDuration = 60_000,
    windowDuration = 300_000,
  } = options

  const attempts = ref([])
  const lockedUntil = ref(null)
  const remainingAttempts = ref(maxAttempts)

  /**
   * Vérifie si l'action est actuellement bloquée
   * @returns {boolean}
   */
  function isLocked() {
    if (lockedUntil.value && Date.now() < lockedUntil.value) {
      return true
    }
    if (lockedUntil.value && Date.now() >= lockedUntil.value) {
      // Lockout expiré, reset
      lockedUntil.value = null
      attempts.value = []
      remainingAttempts.value = maxAttempts
    }
    return false
  }

  /**
   * Temps restant avant déblocage (en secondes)
   * @returns {number}
   */
  function getLockoutRemaining() {
    if (!lockedUntil.value) return 0
    const remaining = Math.ceil((lockedUntil.value - Date.now()) / 1000)
    return Math.max(0, remaining)
  }

  /**
   * Enregistre une tentative. Retourne true si l'action est autorisée, false si bloquée.
   * @returns {boolean}
   */
  function recordAttempt() {
    if (isLocked()) return false

    const now = Date.now()

    // Nettoyer les tentatives hors de la fenêtre
    attempts.value = attempts.value.filter(t => now - t < windowDuration)

    // Ajouter la nouvelle tentative
    attempts.value.push(now)
    remainingAttempts.value = Math.max(0, maxAttempts - attempts.value.length)

    // Vérifier si on dépasse le max
    if (attempts.value.length >= maxAttempts) {
      lockedUntil.value = now + lockoutDuration
      remainingAttempts.value = 0
      return false
    }

    return true
  }

  /**
   * Réinitialise le compteur (ex: après un login réussi)
   */
  function reset() {
    attempts.value = []
    lockedUntil.value = null
    remainingAttempts.value = maxAttempts
  }

  return {
    isLocked,
    getLockoutRemaining,
    recordAttempt,
    reset,
    remainingAttempts,
    lockedUntil,
  }
}
