import placeholderUrl from '@/assets/images/institution-placeholder.svg'

// Visuel neutre affiché quand une institution n'a pas de photo, ou quand sa photo ne se charge pas.
export const INSTITUTION_PLACEHOLDER = placeholderUrl

/** Première photo d'une institution, sinon le visuel neutre. */
export function institutionImageOf(institution) {
  const images = institution?.ImageURL
  if (Array.isArray(images)) {
    const first = images.find((url) => typeof url === 'string' && url.trim())
    if (first) return first
  } else if (typeof images === 'string' && images.trim()) {
    return images
  }
  return INSTITUTION_PLACEHOLDER
}

/** À brancher sur @error d'une <img> : remplace une photo cassée par le visuel neutre, une seule fois. */
export function showInstitutionPlaceholder(event) {
  const img = event?.target
  if (!img || img.dataset.placeholderApplied) return
  img.dataset.placeholderApplied = 'true'
  img.src = INSTITUTION_PLACEHOLDER
}
