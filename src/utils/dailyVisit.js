// Connexion du jour : comptée dès que l'étudiant utilise la plateforme, même s'il est
// resté connecté (sans repasser par le formulaire). Le serveur n'accepte qu'un gain par
// jour civil (Europe/Zurich) ; ce garde local évite seulement des appels inutiles.

const STORAGE_KEY = 'gamification:daily-visit'

/** Jour civil à Zurich, au format AAAA-MM-JJ. */
export function zurichDay(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Zurich' }).format(now)
}

const readMark = (storage) => {
  try {
    return JSON.parse(storage?.getItem(STORAGE_KEY) || 'null')
  } catch {
    return null
  }
}

/** Vrai si la journée de cet utilisateur n'a pas encore été envoyée depuis ce navigateur. */
export function needsDailyVisit(userId, storage, now = new Date()) {
  if (!userId) return false
  const mark = readMark(storage)
  return !(mark && mark.userId === userId && mark.day === zurichDay(now))
}

function markDailyVisit(userId, storage, now) {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify({ userId, day: zurichDay(now) }))
  } catch {
    // Stockage indisponible (navigation privée) : le serveur dédoublonne de toute façon.
  }
}

const browserStorage = () => {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

let inFlight = null

/**
 * Envoie la connexion du jour une fois par jour et par utilisateur.
 * `onLogin` est l'action gamification existante (gamificationIntegration.onLogin).
 */
export async function recordDailyVisit({ userId, onLogin, storage = browserStorage(), now = new Date(), details = {} }) {
  if (!needsDailyVisit(userId, storage, now) || typeof onLogin !== 'function') return null
  if (inFlight) return inFlight
  inFlight = (async () => {
    try {
      const result = await onLogin(userId, details)
      // Marqué seulement si le serveur a répondu (gain, doublon ou public restreint).
      if (result && result.success !== false) markDailyVisit(userId, storage, now)
      return result
    } catch {
      return null
    } finally {
      inFlight = null
    }
  })()
  return inFlight
}
