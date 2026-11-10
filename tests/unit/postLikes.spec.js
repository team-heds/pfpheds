import { describe, expect, it, vi } from 'vitest'
import {
  createDoubleTapDetector,
  createLikeController,
  formatLikeCount,
  isInteractiveTarget
} from '@/service/postLikes'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('formatLikeCount', () => {
  it('écrit un compteur lisible', () => {
    expect(formatLikeCount(0)).toBe('0 j’aime')
    expect(formatLikeCount(1)).toBe('1 j’aime')
    expect(formatLikeCount(12)).toBe('12 j’aime')
    // Séparateur suisse des milliers (fr-CH) : 1'234.
    expect(formatLikeCount(1234)).toMatch(/^1['’\s]234 j’aime$/)
    expect(formatLikeCount(-3)).toBe('0 j’aime')
    expect(formatLikeCount(undefined)).toBe('0 j’aime')
  })
})

describe('createLikeController', () => {
  it('met à jour immédiatement puis confirme', async () => {
    const request = deferred()
    const like = vi.fn(() => request.promise)
    const onChange = vi.fn()
    const controller = createLikeController({ liked: false, count: 4, like, unlike: vi.fn(), onChange })

    const done = controller.toggle()
    expect(controller.getState()).toEqual({ liked: true, count: 5, pending: true })
    expect(like).toHaveBeenCalledTimes(1)

    request.resolve()
    await expect(done).resolves.toBe(true)
    expect(controller.getState()).toEqual({ liked: true, count: 5, pending: false })
    expect(onChange).toHaveBeenLastCalledWith({ liked: true, count: 5, pending: false })
  })

  it('retire le j’aime au second clic', async () => {
    const unlike = vi.fn(() => Promise.resolve())
    const controller = createLikeController({ liked: true, count: 1, like: vi.fn(), unlike })

    await controller.toggle()
    expect(unlike).toHaveBeenCalledTimes(1)
    expect(controller.getState()).toEqual({ liked: false, count: 0, pending: false })
  })

  it('annule proprement si le serveur refuse', async () => {
    const error = new Error('RLS')
    const onError = vi.fn()
    const controller = createLikeController({
      liked: false,
      count: 2,
      like: vi.fn(() => Promise.reject(error)),
      unlike: vi.fn(),
      onError
    })

    const done = controller.toggle()
    expect(controller.getState().liked).toBe(true)
    await expect(done).resolves.toBe(false)
    expect(controller.getState()).toEqual({ liked: false, count: 2, pending: false })
    expect(onError).toHaveBeenCalledWith(error)
  })

  it('n’envoie jamais deux requêtes en parallèle et garde l’état final', async () => {
    const first = deferred()
    const like = vi.fn(() => first.promise)
    const unlike = vi.fn(() => Promise.resolve())
    const controller = createLikeController({ liked: false, count: 0, like, unlike })

    const done = controller.toggle() // aimer
    controller.toggle() // retirer
    controller.toggle() // aimer
    controller.toggle() // retirer
    expect(controller.getState()).toEqual({ liked: false, count: 0, pending: true })
    expect(like).toHaveBeenCalledTimes(1)
    expect(unlike).not.toHaveBeenCalled()

    first.resolve()
    await done
    expect(unlike).toHaveBeenCalledTimes(1)
    expect(controller.getState()).toEqual({ liked: false, count: 0, pending: false })
  })

  it('n’envoie rien si on revient à l’état confirmé pendant l’envoi', async () => {
    const first = deferred()
    const like = vi.fn(() => first.promise)
    const unlike = vi.fn(() => Promise.resolve())
    const controller = createLikeController({ liked: false, count: 3, like, unlike })

    const done = controller.toggle()
    controller.toggle()
    controller.toggle()
    first.resolve()
    await done
    expect(like).toHaveBeenCalledTimes(1)
    expect(unlike).not.toHaveBeenCalled()
    expect(controller.getState()).toEqual({ liked: true, count: 4, pending: false })
  })

  it('le double-tap aime mais ne retire jamais', async () => {
    const like = vi.fn(() => Promise.resolve())
    const unlike = vi.fn(() => Promise.resolve())
    const controller = createLikeController({ liked: false, count: 0, like, unlike })

    await controller.like()
    await controller.like()
    expect(like).toHaveBeenCalledTimes(1)
    expect(unlike).not.toHaveBeenCalled()
    expect(controller.getState()).toEqual({ liked: true, count: 1, pending: false })
  })

  it('adopte les valeurs du serveur, sauf pendant un envoi', async () => {
    const request = deferred()
    const controller = createLikeController({ liked: false, count: 0, like: () => request.promise, unlike: vi.fn() })

    controller.sync({ liked: true, count: 7 })
    expect(controller.getState()).toEqual({ liked: true, count: 7, pending: false })

    const done = controller.toggle()
    controller.sync({ liked: true, count: 99 })
    expect(controller.getState().count).toBe(6)
    request.resolve()
    await done
  })

  it('ne descend jamais sous zéro', async () => {
    const controller = createLikeController({ liked: true, count: 0, like: vi.fn(), unlike: () => Promise.resolve() })
    await controller.toggle()
    expect(controller.getState().count).toBe(0)
  })
})

describe('createDoubleTapDetector', () => {
  it('reconnaît deux appuis rapprochés', () => {
    const detect = createDoubleTapDetector({ delay: 300, slop: 30 })
    expect(detect(1000, 10, 10)).toBe(false)
    expect(detect(1200, 15, 12)).toBe(true)
  })

  it('ignore deux appuis trop espacés ou trop éloignés', () => {
    const detect = createDoubleTapDetector({ delay: 300, slop: 30 })
    expect(detect(1000, 10, 10)).toBe(false)
    expect(detect(1400, 10, 10)).toBe(false)
    expect(detect(1500, 200, 10)).toBe(false)
  })

  it('un troisième appui recommence un nouveau geste', () => {
    const detect = createDoubleTapDetector()
    detect(0)
    expect(detect(100)).toBe(true)
    expect(detect(200)).toBe(false)
  })
})

describe('isInteractiveTarget', () => {
  it('protège les liens, vidéos et boutons', () => {
    const link = { closest: (selector) => (selector.includes('a,') ? {} : null) }
    expect(isInteractiveTarget(link)).toBe(true)
    expect(isInteractiveTarget({ closest: () => null })).toBe(false)
    expect(isInteractiveTarget(null)).toBe(false)
  })
})
