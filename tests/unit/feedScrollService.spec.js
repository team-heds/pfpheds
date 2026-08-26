import { describe, expect, it, vi } from 'vitest'
import { readFeedScroll, restoreFeedScroll } from '@/service/feedScrollService'

describe('feedScrollService', () => {
  it('sauvegarde et restaure le propriétaire du scroll desktop', () => {
    const postsContainer = document.createElement('div')
    postsContainer.scrollTop = 420

    const saved = readFeedScroll({ isMobile: false, container: postsContainer })
    postsContainer.scrollTop = 0
    restoreFeedScroll({ isMobile: false, container: postsContainer, scrollTop: saved })

    expect(postsContainer.scrollTop).toBe(420)
  })

  it('utilise la fenêtre sur mobile', () => {
    const windowObject = { scrollY: 240, scrollTo: vi.fn() }

    const saved = readFeedScroll({ isMobile: true, windowObject })
    restoreFeedScroll({ isMobile: true, scrollTop: saved, windowObject })

    expect(windowObject.scrollTo).toHaveBeenCalledWith({ top: 240, behavior: 'auto' })
  })
})
