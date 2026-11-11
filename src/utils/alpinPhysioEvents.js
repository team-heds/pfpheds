// Fonctions pures de l'espace de gestion Alp'in Physio (sans accès réseau, testables).

const pad = (value) => String(value).padStart(2, '0')

/**
 * Convertit une date enregistrée (UTC) vers la valeur attendue par un champ
 * <input type="datetime-local">, exprimée dans le fuseau du navigateur.
 * `toISOString()` ne convient pas : il renvoie l'heure UTC et décale donc
 * l'événement d'une ou deux heures à chaque enregistrement.
 */
export function toLocalInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/** Convertit la valeur d'un champ datetime-local (heure locale) en date UTC pour l'API. */
export function toApiDate(value) {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

/**
 * Résume l'occupation d'un événement à partir du nombre de places et du
 * nombre de réponses « présent ». Sans nombre de places, il n'y a pas de limite.
 */
export function describePlaces({ capacity, going_count: goingCount } = {}) {
  const taken = Math.max(0, Number(goingCount) || 0)
  const total = Number(capacity)
  if (!Number.isInteger(total) || total <= 0) {
    return { limited: false, taken, total: null, remaining: null, full: false, label: String(taken) }
  }
  const remaining = Math.max(0, total - taken)
  return { limited: true, taken, total, remaining, full: remaining === 0, label: `${taken}/${total}` }
}
