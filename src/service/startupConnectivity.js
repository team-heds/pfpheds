import { ref } from 'vue'

/** Vrai quand l'application a démarré sans réseau : l'écran « Hors ligne » remplace les pages. */
export const startupOffline = ref(false)

const RECOVERY_INTERVAL_MS = 5000
const PROBE_TIMEOUT_MS = 3000
const NETWORK_ERROR = /failed to fetch|load failed|networkerror|network request failed/i
const CHUNK_ERROR = /dynamically imported module|importing a module script failed|unable to preload css/i

export function isNetworkFailure(error) {
  if (!error) return false
  if (error.name === 'AuthRetryableFetchError') return true
  return NETWORK_ERROR.test(String(error.message || ''))
}

export function isDeviceOffline(nav = window.navigator) {
  return nav?.onLine === false
}

/** Décide si un démarrage doit afficher l'écran « Hors ligne ». */
export function markStartupConnectivity(error = null, nav = window.navigator) {
  if (isDeviceOffline(nav) || isNetworkFailure(error)) startupOffline.value = true
  return startupOffline.value
}

export function bootstrapFailureMessage(error) {
  return error?.code === 'BOOTSTRAP_TIMEOUT'
    ? 'Le chargement a pris trop de temps.'
    : 'Le chargement a échoué.'
}

/** Un écran jamais visité n'est pas en cache : sans réseau, on affiche « Hors ligne ». */
export async function handleChunkLoadFailure(error, { probe = probeOrigin } = {}) {
  if (!CHUNK_ERROR.test(String(error?.message || ''))) return false
  if (await probe()) return false
  startupOffline.value = true
  return true
}

/** Toute réponse HTTP prouve que le site est joignable. */
export async function probeOrigin({
  fetcher = (...args) => window.fetch(...args),
  origin = window.location.origin,
  nav = window.navigator,
  timeoutMs = PROBE_TIMEOUT_MS,
} = {}) {
  if (isDeviceOffline(nav)) return false
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    await fetcher(origin, { method: 'HEAD', cache: 'no-store', signal: controller.signal })
    return true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * Surveille le retour du réseau et appelle `onRecovered` une seule fois.
 * `check()` permet au bouton « Réessayer » de lancer une vérification immédiate.
 */
export function watchConnectivityRecovery({
  onRecovered,
  probe = probeOrigin,
  win = window,
  doc = document,
  intervalMs = RECOVERY_INTERVAL_MS,
}) {
  let stopped = false
  let timer = null
  let pending = null

  const schedule = () => {
    clearTimeout(timer)
    if (stopped || doc.visibilityState === 'hidden') return
    timer = setTimeout(() => { void check() }, intervalMs)
  }

  const stop = () => {
    stopped = true
    clearTimeout(timer)
    win.removeEventListener('online', onSignal)
    doc.removeEventListener('visibilitychange', onSignal)
  }

  function check() {
    if (stopped) return Promise.resolve(false)
    if (pending) return pending
    pending = Promise.resolve(probe())
      .catch(() => false)
      .then((reachable) => {
        pending = null
        if (stopped) return false
        if (reachable) {
          stop()
          onRecovered()
          return true
        }
        schedule()
        return false
      })
    return pending
  }

  function onSignal() {
    if (doc.visibilityState === 'hidden') {
      clearTimeout(timer)
      return
    }
    void check()
  }

  win.addEventListener('online', onSignal)
  doc.addEventListener('visibilitychange', onSignal)
  schedule()
  return { check, stop }
}
