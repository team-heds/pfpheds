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

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

/** Contenu de la publication du feed associée à un événement : le texte saisi n'est jamais interprété comme du HTML. */
export function buildFeedPostContent(event, formattedDate) {
  const location = event.lieu ? ` · ${escapeHtml(event.lieu)}` : ''
  return `<p><strong>${escapeHtml(event.title)}</strong></p><p>${escapeHtml(formattedDate)}${location}</p><p>${escapeHtml(event.description)}</p><p><a href="/events">Répondre à l’événement</a></p>`
}
