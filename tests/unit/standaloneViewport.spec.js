import { describe, expect, it } from 'vitest'
import { installStandaloneViewportFix, standaloneScreenHeight } from '@/mobile/shell/standaloneViewport'

const fakeWindow = ({ standalone = true, innerWidth = 375, innerHeight = 768, screen = { width: 375, height: 812 } } = {}) => ({
  navigator: { standalone },
  innerWidth,
  innerHeight,
  screen,
})

describe('hauteur de l’application installée sur iPhone', () => {
  it('prend la hauteur de l’écran quand iOS annonce une fenêtre trop courte', () => {
    expect(standaloneScreenHeight(fakeWindow())).toBe(812)
  })

  it('ne change rien quand la fenêtre a déjà la hauteur de l’écran', () => {
    expect(standaloneScreenHeight(fakeWindow({ innerHeight: 812 }))).toBeNull()
  })

  it('ne touche pas au navigateur ni à Android (pas d’application installée iOS)', () => {
    expect(standaloneScreenHeight(fakeWindow({ standalone: false }))).toBeNull()
    expect(standaloneScreenHeight({ ...fakeWindow(), navigator: {} })).toBeNull()
  })

  it('prend le petit côté de l’écran en paysage', () => {
    expect(standaloneScreenHeight(fakeWindow({ innerWidth: 812, innerHeight: 340 }))).toBe(375)
  })

  it('pose puis retire --app-height sur la racine du document', () => {
    const props = new Map()
    const listeners = new Map()
    const doc = {
      documentElement: { style: { setProperty: (k, v) => props.set(k, v), removeProperty: k => props.delete(k) } },
      addEventListener: (type, fn) => listeners.set(`doc:${type}`, fn),
      removeEventListener: type => listeners.delete(`doc:${type}`),
    }
    const win = {
      ...fakeWindow(),
      location: { search: '' },
      addEventListener: (type, fn) => listeners.set(type, fn),
      removeEventListener: type => listeners.delete(type),
    }
    const remove = installStandaloneViewportFix(win, doc)
    expect(props.get('--app-height')).toBe('812px')

    win.innerHeight = 812
    listeners.get('resize')()
    expect(props.has('--app-height')).toBe(false)

    remove()
    expect(listeners.size).toBe(0)
  })
})
