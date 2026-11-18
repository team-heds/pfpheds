// Partage d'une publication du fil.
// Il n'existe pas de page par publication : le lien mène au fil (comme sur
// téléphone). L'ancien lien /posts/<id> aboutissait à une page 404.

export function postShareUrl(origin = window.location.origin) {
  return `${String(origin).replace(/\/+$/, '')}/feed`
}

/**
 * Ouvre la feuille de partage du système quand elle existe, sinon copie le
 * texte et le lien. Renvoie 'shared', 'cancelled', 'copied' ou 'unavailable'.
 */
export async function sharePostLink({ title, text, url }, nav = globalThis.navigator) {
  if (nav?.share) {
    try {
      await nav.share({ title, text, url })
      return 'shared'
    } catch (error) {
      if (error?.name === 'AbortError') return 'cancelled'
    }
  }
  try {
    await nav.clipboard.writeText(text ? `${text}\n${url}` : url)
    return 'copied'
  } catch {
    return 'unavailable'
  }
}
