import { describe, expect, it, vi } from 'vitest'
import { installServiceWorkerUpdateReload } from '@/service/serviceWorkerUpdates'

function createServiceWorker(controller) {
  const listeners = new Map()
  return {
    controller,
    addEventListener: vi.fn((event, handler) => listeners.set(event, handler)),
    removeEventListener: vi.fn((event) => listeners.delete(event)),
    dispatch(event) {
      listeners.get(event)?.()
    },
  }
}

describe('service worker update reload', () => {
  it('reloads an existing controlled tab exactly once when a new worker takes control', () => {
    const serviceWorker = createServiceWorker({ state: 'activated' })
    const reload = vi.fn()

    installServiceWorkerUpdateReload({ serviceWorker, reload })
    serviceWorker.dispatch('controllerchange')
    serviceWorker.dispatch('controllerchange')

    expect(reload).toHaveBeenCalledOnce()
  })

  it('does not reload when the first worker starts controlling a new installation', () => {
    const serviceWorker = createServiceWorker(null)
    const reload = vi.fn()

    installServiceWorkerUpdateReload({ serviceWorker, reload })
    serviceWorker.dispatch('controllerchange')

    expect(reload).not.toHaveBeenCalled()
  })

  it('returns a cleanup callback for the controller listener', () => {
    const serviceWorker = createServiceWorker({ state: 'activated' })
    const cleanup = installServiceWorkerUpdateReload({ serviceWorker, reload: vi.fn() })

    cleanup()

    expect(serviceWorker.removeEventListener).toHaveBeenCalledWith(
      'controllerchange',
      expect.any(Function),
    )
  })
})
