import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createFeedRealtimeController } from '@/service/feedRealtimeController'

describe('feedRealtimeController', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('ne lance aucun polling lorsque Realtime est connecté', () => {
    const refresh = vi.fn()
    const controller = createFeedRealtimeController({ refresh })

    controller.handleStatus('SUBSCRIBED')
    vi.advanceTimersByTime(90000)

    expect(refresh).not.toHaveBeenCalled()
    expect(controller.isFallbackActive()).toBe(false)
  })

  it('active un seul polling de secours après une erreur et l’arrête à la reconnexion', () => {
    const refresh = vi.fn()
    const controller = createFeedRealtimeController({ refresh })

    controller.handleStatus('CHANNEL_ERROR')
    controller.handleStatus('TIMED_OUT')
    vi.advanceTimersByTime(60000)
    expect(refresh).toHaveBeenCalledTimes(2)

    controller.handleStatus('SUBSCRIBED')
    vi.advanceTimersByTime(60000)
    expect(refresh).toHaveBeenCalledTimes(2)
  })

  it('ignore un statut CLOSED reçu après le démontage', () => {
    const refresh = vi.fn()
    const controller = createFeedRealtimeController({ refresh })

    controller.stop()
    controller.handleStatus('CLOSED')
    vi.advanceTimersByTime(60000)

    expect(refresh).not.toHaveBeenCalled()
    expect(controller.isFallbackActive()).toBe(false)
  })
})
