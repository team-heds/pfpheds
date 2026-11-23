export const NOTIFICATION_NAVIGATE = 'NOTIFICATION_NAVIGATE'

/** Seuls les liens internes au site sont ouverts (protection contre l'hameçonnage). */
export function resolveNotificationUrl(rawUrl, origin) {
  try {
    const parsed = new URL(rawUrl || '/', origin)
    return parsed.origin === origin ? `${parsed.pathname}${parsed.search}${parsed.hash}` : '/'
  } catch {
    return '/'
  }
}

export const isInternalPath = (value) => typeof value === 'string' && /^\/(?![/\\])/.test(value)

const clientPath = (client, origin) => resolveNotificationUrl(client.url, origin)

/**
 * Montre la page de la notification : fenêtre déjà sur cette page, sinon fenêtre ouverte de
 * l'application (le routeur change de page sans recharger), sinon nouvelle fenêtre.
 */
export async function openNotificationTarget({ rawUrl, origin, clientsApi }) {
  const url = resolveNotificationUrl(rawUrl, origin)
  const windows = await clientsApi.matchAll({ type: 'window', includeUncontrolled: true })
  const sameOrigin = windows.filter((client) => new URL(client.url).origin === origin)

  const exact = sameOrigin.find((client) => clientPath(client, origin) === url)
  if (exact) return exact.focus()

  const current = sameOrigin.find((client) => client.focused) || sameOrigin[0]
  if (current) {
    current.postMessage({ type: NOTIFICATION_NAVIGATE, url })
    return current.focus()
  }
  return clientsApi.openWindow(url)
}
