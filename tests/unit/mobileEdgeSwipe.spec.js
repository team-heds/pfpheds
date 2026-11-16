import { mount } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import { EDGE_ZONE, createEdgeSwipe, startsInHorizontalArea } from '@/mobile/shell/edgeSwipe'
import { isInstalledIosApp, useEdgeSwipeBack } from '@/mobile/shell/useEdgeSwipeBack'

const WIDTH = 375

describe('retour par glissement : décision du geste', () => {
  it('ne commence que dans la bande du bord gauche', () => {
    const swipe = createEdgeSwipe({ width: WIDTH })
    expect(EDGE_ZONE).toBe(24)
    expect(swipe.start({ x: 30, y: 300, t: 0 })).toBe(false)
    expect(swipe.move({ x: 200, y: 300, t: 50 }).state).toBe('idle')
    expect(swipe.start({ x: 8, y: 300, t: 0 })).toBe(true)
  })

  it('laisse défiler la page quand le doigt part vers le bas', () => {
    const swipe = createEdgeSwipe({ width: WIDTH })
    swipe.start({ x: 6, y: 300, t: 0 })
    expect(swipe.move({ x: 10, y: 330, t: 30 }).state).toBe('cancel')
    expect(swipe.move({ x: 120, y: 330, t: 60 }).state).toBe('idle')
    expect(swipe.end().commit).toBe(false)
  })

  it('suit le doigt de côté et revient au-delà d’un tiers de l’écran', () => {
    const swipe = createEdgeSwipe({ width: WIDTH })
    swipe.start({ x: 4, y: 300, t: 0 })
    expect(swipe.move({ x: 8, y: 301, t: 16 }).state).toBe('idle')
    expect(swipe.move({ x: 60, y: 304, t: 200 })).toEqual({ state: 'drag', dx: 56 })
    swipe.move({ x: 180, y: 306, t: 900 })
    expect(swipe.end()).toEqual({ engaged: true, commit: true })
  })

  it('revient en place sur un glissement court et lent', () => {
    const swipe = createEdgeSwipe({ width: WIDTH })
    swipe.start({ x: 4, y: 300, t: 0 })
    swipe.move({ x: 40, y: 300, t: 300 })
    swipe.move({ x: 80, y: 300, t: 900 })
    expect(swipe.end()).toEqual({ engaged: true, commit: false })
  })

  it('revient aussi sur un lancer rapide', () => {
    const swipe = createEdgeSwipe({ width: WIDTH })
    swipe.start({ x: 4, y: 300, t: 0 })
    swipe.move({ x: 30, y: 300, t: 20 })
    swipe.move({ x: 90, y: 300, t: 60 })
    expect(swipe.end().commit).toBe(true)
  })

  it('ne capte pas un glissement posé dans une zone qui défile de côté ou sur la carte', () => {
    const root = document.createElement('div')
    const map = document.createElement('div')
    map.className = 'leaflet-container'
    const tile = document.createElement('span')
    map.appendChild(tile)
    const plain = document.createElement('p')
    root.append(map, plain)
    document.body.appendChild(root)
    expect(startsInHorizontalArea(tile, root)).toBe(true)
    expect(startsInHorizontalArea(plain, root)).toBe(false)
    root.remove()
  })
})

function touch(type, x, y, t) {
  const event = new Event(type, { bubbles: true, cancelable: true })
  const point = { clientX: x, clientY: y }
  Object.defineProperty(event, 'touches', { value: type === 'touchend' || type === 'touchcancel' ? [] : [point] })
  Object.defineProperty(event, 'changedTouches', { value: [point] })
  Object.defineProperty(event, 'timeStamp', { value: t })
  return event
}

function mountWith({ standalone = true, enabled = true } = {}) {
  const onBack = vi.fn()
  const screen = document.createElement('section')
  const win = {
    innerWidth: WIDTH,
    navigator: { standalone },
    matchMedia: () => ({ matches: false }),
  }
  const Host = defineComponent({
    setup() {
      const rootRef = ref(null)
      useEdgeSwipeBack(rootRef, { enabled: () => enabled, target: () => screen, onBack, win })
      return () => h('div', { ref: rootRef }, [h('p', { class: 'content' }, 'contenu')])
    },
  })
  const wrapper = mount(Host, { attachTo: document.body })
  return { wrapper, onBack, screen, content: wrapper.find('.content').element }
}

describe('retour par glissement : dans la coque', () => {
  it('n’existe que dans l’application installée sur iPhone', () => {
    expect(isInstalledIosApp({ navigator: { standalone: true } })).toBe(true)
    expect(isInstalledIosApp({ navigator: {} })).toBe(false)
    const { wrapper, onBack, content } = mountWith({ standalone: false })
    content.dispatchEvent(touch('touchstart', 4, 300, 0))
    content.dispatchEvent(touch('touchmove', 250, 300, 400))
    content.dispatchEvent(touch('touchend', 250, 300, 500))
    expect(onBack).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('fait suivre le doigt à l’écran puis revient en arrière', () => {
    vi.useFakeTimers()
    const { wrapper, onBack, screen, content } = mountWith()
    content.dispatchEvent(touch('touchstart', 4, 300, 0))
    const move = touch('touchmove', 200, 304, 400)
    content.dispatchEvent(move)
    expect(move.defaultPrevented).toBe(true)
    expect(screen.style.transform).toBe('translateX(196px)')
    content.dispatchEvent(touch('touchend', 200, 304, 500))
    expect(onBack).toHaveBeenCalledTimes(1)
    expect(screen.style.transform).toBe('translateX(100%)')
    vi.advanceTimersByTime(400)
    expect(screen.style.transform).toBe('')
    vi.useRealTimers()
    wrapper.unmount()
  })

  it('ne fait rien à la racine d’un onglet, ni quand le système interrompt le geste', () => {
    const root = mountWith({ enabled: false })
    root.content.dispatchEvent(touch('touchstart', 4, 300, 0))
    root.content.dispatchEvent(touch('touchmove', 250, 300, 400))
    root.content.dispatchEvent(touch('touchend', 250, 300, 500))
    expect(root.onBack).not.toHaveBeenCalled()
    root.wrapper.unmount()

    const stacked = mountWith()
    stacked.content.dispatchEvent(touch('touchstart', 4, 300, 0))
    stacked.content.dispatchEvent(touch('touchmove', 250, 300, 400))
    stacked.content.dispatchEvent(touch('touchcancel', 250, 300, 500))
    expect(stacked.onBack).not.toHaveBeenCalled()
    expect(stacked.screen.style.transform).toBe('translateX(0)')
    stacked.wrapper.unmount()
  })
})
