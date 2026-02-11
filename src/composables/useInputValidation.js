/**
 * Composable pour la validation et l'assainissement des entrées utilisateur.
 * Centralise les règles de validation pour éviter les injections et les données invalides.
 */

/**
 * Valide un email
 * @param {string} email
 * @returns {{ valid: boolean, message: string }}
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'L\'adresse email est requise.' }
  }

  const trimmed = email.trim()

  if (trimmed.length > 254) {
    return { valid: false, message: 'L\'adresse email est trop longue.' }
  }

  // RFC 5322 simplified
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: 'L\'adresse email n\'est pas valide.' }
  }

  return { valid: true, message: '' }
}

/**
 * Valide un mot de passe
 * @param {string} password
 * @param {Object} options
 * @param {number} options.minLength - Longueur minimale (défaut: 6)
 * @returns {{ valid: boolean, message: string }}
 */
export function validatePassword(password, options = {}) {
  const { minLength = 6 } = options

  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Le mot de passe est requis.' }
  }

  if (password.length < minLength) {
    return { valid: false, message: `Le mot de passe doit contenir au moins ${minLength} caractères.` }
  }

  if (password.length > 128) {
    return { valid: false, message: 'Le mot de passe est trop long (max 128 caractères).' }
  }

  return { valid: true, message: '' }
}

/**
 * Assainit une chaîne de texte pour éviter les injections basiques
 * (pour les champs texte simples, pas le HTML — utiliser useSanitize.js pour le HTML)
 * @param {string} input
 * @param {Object} options
 * @param {number} options.maxLength - Longueur max (défaut: 500)
 * @returns {string}
 */
export function sanitizeText(input, options = {}) {
  const { maxLength = 500 } = options

  if (!input || typeof input !== 'string') return ''

  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Supprimer les chevrons HTML basiques
}

/**
 * Valide et assainit un paramètre d'URL / ID
 * @param {string} id
 * @returns {{ valid: boolean, sanitized: string }}
 */
export function validateId(id) {
  if (!id || typeof id !== 'string') {
    return { valid: false, sanitized: '' }
  }

  // UUID ou ID numérique uniquement
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const numericRegex = /^\d+$/
  const alphanumericRegex = /^[a-zA-Z0-9_-]+$/

  const trimmed = id.trim()

  if (uuidRegex.test(trimmed) || numericRegex.test(trimmed) || alphanumericRegex.test(trimmed)) {
    return { valid: true, sanitized: trimmed }
  }

  return { valid: false, sanitized: '' }
}
