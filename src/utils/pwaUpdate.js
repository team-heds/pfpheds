// Mise à jour de l'application installée (PWA).
// Le service worker d'une nouvelle version s'installe en arrière-plan puis
// attend. On le signale à l'utilisateur, qui décide du moment : l'activation
// est toujours suivie d'un rechargement complet de la page.

const UPDATE_CHECK_INTERVAL_MS = 15 * 60 * 1000
const RELOAD_FALLBACK_MS = 4000

/**
 * Surveille l'arrivée d'une nouvelle version.
 * @returns {{ applyUpdate: () => void, checkForUpdate: () => void, stop: () => void }}
 */
export function watchForAppUpdate({
  onUpdateReady,
  container = window.navigator?.serviceWorker,
  doc = window.document,
  reload = () => window.location.reload(),
  now = () => Date.now(),
} = {}) {
  const noop = { applyUpdate() {}, checkForUpdate() {}, stop() {} }
  if (!container) return noop

  let registration = null
  let waitingWorker = null
  let lastCheck = now()
  let reloadRequested = false
  let reloaded = false
  let stopped = false

  const reloadOnce = () => {
    if (reloaded) return
    reloaded = true
    reload()
  }

  const announce = (worker) => {
    // Sans page déjà contrôlée, c'est une première installation : rien à annoncer.
    if (stopped || !worker || !container.controller) return
    waitingWorker = worker
    onUpdateReady?.()
  }

  const trackInstalling = (worker) => {
    if (!worker) return
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') announce(worker)
    })
  }

  const onControllerChange = () => {
    // Ne recharge que si l'utilisateur a demandé la mise à jour.
    if (reloadRequested) reloadOnce()
  }

  const checkForUpdate = () => {
    if (stopped || !registration) return
    lastCheck = now()
    registration.update().catch(() => {})
  }

  const onVisibilityChange = () => {
    // Une application installée reste ouverte des jours : on vérifie au retour au premier plan.
    if (doc?.visibilityState === 'visible' && now() - lastCheck >= UPDATE_CHECK_INTERVAL_MS) checkForUpdate()
  }

  container.addEventListener('controllerchange', onControllerChange)
  doc?.addEventListener('visibilitychange', onVisibilityChange)

  Promise.resolve(container.ready).then((ready) => {
    if (stopped || !ready) return
    registration = ready
    if (registration.waiting) announce(registration.waiting)
    trackInstalling(registration.installing)
    registration.addEventListener('updatefound', () => trackInstalling(registration.installing))
  }).catch(() => {})

  return {
    applyUpdate() {
      if (!waitingWorker) return
      reloadRequested = true
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      // Filet de sécurité si le navigateur ne signale pas le changement.
      setTimeout(reloadOnce, RELOAD_FALLBACK_MS)
    },
    checkForUpdate,
    stop() {
      stopped = true
      container.removeEventListener('controllerchange', onControllerChange)
      doc?.removeEventListener('visibilitychange', onVisibilityChange)
    },
  }
}
