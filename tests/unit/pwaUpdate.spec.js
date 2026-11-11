import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { watchForAppUpdate } from '@/utils/pwaUpdate'

function eventTarget(extra = {}) {
  const listeners = new Map()
  return {
    ...extra,
    addEventListener(type, handler) { listeners.set(type, [...(listeners.get(type) || []), handler]) },
    removeEventListener(type, handler) { listeners.set(type, (listeners.get(type) || []).filter(item => item !== handler)) },
    emit(type) { (listeners.get(type) || []).forEach(handler => handler({ type })) },
    count(type) { return (listeners.get(type) || []).length },
  }
}

function setup({ controlled = true, waiting = null } = {}) {
  const registration = eventTarget({ waiting, installing: null, update: vi.fn(() => Promise.resolve()) })
  const container = eventTarget({ controller: controlled ? {} : null, ready: Promise.resolve(registration) })
  const doc = eventTarget({ visibilityState: 'visible' })
  const reload = vi.fn()
  const onUpdateReady = vi.fn()
  let time = 0
  const watcher = watchForAppUpdate({ onUpdateReady, container, doc, reload, now: () => time })
  return { registration, container, doc, reload, onUpdateReady, watcher, advance: (ms) => { time += ms } }
}

const flush = () => Promise.resolve().then(() => Promise.resolve())

describe('mise à jour de l’application installée', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('annonce une version déjà en attente à l’ouverture', async () => {
    const waiting = { postMessage: vi.fn() }
    const { onUpdateReady } = setup({ waiting })
    await flush()
    expect(onUpdateReady).toHaveBeenCalledTimes(1)
  })

  it('annonce une version qui finit de s’installer pendant l’utilisation', async () => {
    const { registration, onUpdateReady } = setup()
    await flush()
    const worker = eventTarget({ state: 'installing', postMessage: vi.fn() })
    registration.installing = worker
    registration.emit('updatefound')
    expect(onUpdateReady).not.toHaveBeenCalled()

    worker.state = 'installed'
    worker.emit('statechange')
    expect(onUpdateReady).toHaveBeenCalledTimes(1)
  })

  it('n’annonce rien lors de la toute première installation', async () => {
    const { onUpdateReady } = setup({ controlled: false, waiting: { postMessage: vi.fn() } })
    await flush()
    expect(onUpdateReady).not.toHaveBeenCalled()
  })

  it('active la nouvelle version à la demande puis recharge une seule fois', async () => {
    const waiting = { postMessage: vi.fn() }
    const { container, reload, watcher } = setup({ waiting })
    await flush()

    container.emit('controllerchange')
    expect(reload).not.toHaveBeenCalled()

    watcher.applyUpdate()
    expect(waiting.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
    container.emit('controllerchange')
    vi.advanceTimersByTime(5000)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('recharge quand même si le navigateur ne signale pas le changement', async () => {
    const { reload, watcher } = setup({ waiting: { postMessage: vi.fn() } })
    await flush()
    watcher.applyUpdate()
    expect(reload).not.toHaveBeenCalled()
    vi.advanceTimersByTime(4000)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('cherche une mise à jour au retour au premier plan, au plus toutes les 15 minutes', async () => {
    const { registration, doc, advance } = setup()
    await flush()

    advance(5 * 60 * 1000)
    doc.emit('visibilitychange')
    expect(registration.update).not.toHaveBeenCalled()

    advance(11 * 60 * 1000)
    doc.emit('visibilitychange')
    expect(registration.update).toHaveBeenCalledTimes(1)
  })

  it('ne fait rien sans service worker et se désabonne proprement', async () => {
    expect(() => watchForAppUpdate({ container: undefined }).applyUpdate()).not.toThrow()

    const { container, doc, watcher } = setup()
    await flush()
    watcher.stop()
    expect(container.count('controllerchange')).toBe(0)
    expect(doc.count('visibilitychange')).toBe(0)
  })
})
