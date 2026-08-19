export function installServiceWorkerUpdateReload({
  serviceWorker = globalThis.navigator?.serviceWorker,
  reload = () => globalThis.location?.reload(),
} = {}) {
  if (!serviceWorker?.addEventListener) return () => {}

  // A controller at startup means the document belongs to an older deployed
  // release. Reload exactly once when the new worker takes control so the
  // document and its lazy chunks always come from the same build.
  const controlledAtStartup = Boolean(serviceWorker.controller)
  let reloadStarted = false
  const handleControllerChange = () => {
    if (!controlledAtStartup || reloadStarted) return
    reloadStarted = true
    reload()
  }

  serviceWorker.addEventListener('controllerchange', handleControllerChange)
  return () => serviceWorker.removeEventListener?.('controllerchange', handleControllerChange)
}
