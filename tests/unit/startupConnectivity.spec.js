import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  bootstrapFailureMessage,
  isNetworkFailure,
  markStartupConnectivity,
  startupOffline,
  watchConnectivityRecovery,
} from '@/service/startupConnectivity'
import { createNavigationHandler } from '@/utils/navigationFallback'

describe('démarrage sans réseau', () => {
  beforeEach(() => { startupOffline.value = false })

  it('reconnaît une erreur réseau et ignore une erreur métier', () => {
    expect(isNetworkFailure(new TypeError('Failed to fetch'))).toBe(true)
    expect(isNetworkFailure({ name: 'AuthRetryableFetchError', message: '' })).toBe(true)
    expect(isNetworkFailure(new Error('JWT expired'))).toBe(false)
  })

  it('active l’écran si l’appareil est hors ligne, même sans erreur', () => {
    expect(markStartupConnectivity(null, { onLine: false })).toBe(true)
  })

  it('n’active pas l’écran pour une erreur métier en ligne', () => {
    expect(markStartupConnectivity(new Error('JWT expired'), { onLine: true })).toBe(false)
  })

  it('n’annonce un délai dépassé que pour un vrai délai', () => {
    expect(bootstrapFailureMessage({ code: 'BOOTSTRAP_TIMEOUT' })).toContain('trop de temps')
    expect(bootstrapFailureMessage(new Error('x'))).toBe('Le chargement a échoué.')
  })
})

describe('retour du réseau', () => {
  let watcher

  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => {
    watcher?.stop()
    vi.useRealTimers()
  })

  it('recharge une seule fois quand le site redevient joignable', async () => {
    const onRecovered = vi.fn()
    const probe = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true)
    watcher = watchConnectivityRecovery({ onRecovered, probe, intervalMs: 1000 })

    await vi.advanceTimersByTimeAsync(1000)
    expect(onRecovered).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1000)
    window.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(3000)

    expect(onRecovered).toHaveBeenCalledTimes(1)
    expect(probe).toHaveBeenCalledTimes(2)
  })

  it('vérifie aussitôt à l’événement online', async () => {
    const onRecovered = vi.fn()
    watcher = watchConnectivityRecovery({ onRecovered, probe: vi.fn().mockResolvedValue(true), intervalMs: 60000 })

    window.dispatchEvent(new Event('online'))
    await vi.advanceTimersByTimeAsync(0)

    expect(onRecovered).toHaveBeenCalledTimes(1)
  })
})

describe('navigation du service worker', () => {
  const shell = { id: 'shell' }

  it('garde la réponse du réseau ou du cache de page', async () => {
    const page = { id: 'page' }
    const handler = createNavigationHandler({
      strategy: { handle: vi.fn().mockResolvedValue(page) },
      matchShell: vi.fn().mockResolvedValue(shell),
    })
    await expect(handler({})).resolves.toBe(page)
  })

  it('sert la coque pour une page jamais visitée hors ligne', async () => {
    const handler = createNavigationHandler({
      strategy: { handle: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) },
      matchShell: vi.fn().mockResolvedValue(shell),
    })
    await expect(handler({})).resolves.toBe(shell)
  })

  it('laisse remonter l’erreur si la coque manque', async () => {
    const failure = new TypeError('Failed to fetch')
    const handler = createNavigationHandler({
      strategy: { handle: vi.fn().mockRejectedValue(failure) },
      matchShell: vi.fn().mockResolvedValue(undefined),
    })
    await expect(handler({})).rejects.toBe(failure)
  })
})
