// Une même erreur affichée plusieurs fois, ou une rafale d'erreurs au chargement d'une
// page, ne laisse qu'un seul message à l'écran.
const SAME_MESSAGE_MS = 6000
const DEFAULT_VISIBLE_MS = 6000

export function installToastDedupe(bus, now = () => Date.now()) {
  const original = bus.emit
  const seen = new Map()
  let errorVisibleUntil = -Infinity

  bus.emit = (event, message, ...rest) => {
    if (event === 'add' && message?.severity === 'error') {
      const time = now()
      const key = `${message.summary || ''}|${message.detail || ''}`
      // Une nouvelle erreur attend que la précédente ait disparu.
      if (time - (seen.get(key) ?? -Infinity) < SAME_MESSAGE_MS || time < errorVisibleUntil) return undefined
      seen.set(key, time)
      errorVisibleUntil = time + (Number(message.life) > 0 ? Number(message.life) : DEFAULT_VISIBLE_MS)
    }
    return original.call(bus, event, message, ...rest)
  }

  return () => { bus.emit = original }
}
