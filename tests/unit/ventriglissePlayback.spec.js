import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { getVentriglisseOverviewCamera } from '@/domain/games/ventriglissePlayback'
import bipAudioUrl from '@/components/games/assets/bip.wav?url'
import goAudioUrl from '@/components/games/assets/go.wav?url'
import slideAudioUrl from '@/components/games/assets/slide.wav?url'
import finishAudioUrl from '@/components/games/assets/finish.wav?url'

const mocks = vi.hoisted(() => ({
  webgl: false, hidden: false, systemMotion: false,
  textureLoad: vi.fn(), avatarLoad: vi.fn(), renderers: [], textures: [], observers: [], motionListeners: new Set(),
}))
vi.mock('@/components/common/utils/Navbar.vue', () => ({ default: { template: '<nav />' } }))
vi.mock('three', async importOriginal => {
  const actual = await importOriginal()
  class TestRenderer {
    constructor({ canvas }) {
      this.domElement = canvas
      this.renders = []
      this.dispose = vi.fn()
      mocks.renderers.push(this)
    }
    setPixelRatio() {}
    setSize() {}
    render(scene, camera) { this.renders.push({ position: camera.position.toArray(), scene, camera }) }
  }
  class TestTextureLoader {
    async loadAsync(url) {
      await mocks.textureLoad(url)
      const texture = new actual.Texture()
      texture.dispose = vi.fn()
      mocks.textures.push(texture)
      return texture
    }
  }
  return { ...actual, WebGLRenderer: TestRenderer, TextureLoader: TestTextureLoader }
})
vi.mock('three/examples/jsm/loaders/GLTFLoader.js', () => ({
  GLTFLoader: class { loadAsync(url) { return mocks.avatarLoad(url) } },
}))

import Ventriglisse3D from '@/components/games/Ventriglisse3D.vue'

const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }
const mountOptions = { global: { stubs: { Transition: { props: ['name'], template: '<slot />' } } } }

describe('confort de lecture du Ventriglisse', () => {
  let wrapper
  let frames
  let nextFrameId
  let played
  let pauseSpy
  let playSpy

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'Date', 'performance'] })
    vi.setSystemTime(new Date('2026-11-03T12:00:00Z'))
    vi.clearAllMocks()
    Object.assign(mocks, { webgl: false, hidden: false, systemMotion: false, renderers: [], textures: [], observers: [] })
    mocks.motionListeners.clear()
    mocks.textureLoad.mockResolvedValue(undefined)
    mocks.avatarLoad.mockImplementation(async () => ({ scene: new THREE.Group() }))
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => mocks.webgl ? { getExtension: () => ({ loseContext() {} }) } : null)
    vi.spyOn(document, 'hidden', 'get').mockImplementation(() => mocks.hidden)
    vi.stubGlobal('matchMedia', vi.fn(() => ({
      matches: mocks.systemMotion,
      addEventListener: (_event, listener) => mocks.motionListeners.add(listener),
      removeEventListener: (_event, listener) => mocks.motionListeners.delete(listener),
    })))
    vi.stubGlobal('ResizeObserver', class {
      constructor() { this.observe = vi.fn(); this.disconnect = vi.fn(); mocks.observers.push(this) }
    })
    frames = new Map()
    nextFrameId = 0
    vi.stubGlobal('requestAnimationFrame', vi.fn(callback => { frames.set(++nextFrameId, callback); return nextFrameId }))
    vi.stubGlobal('cancelAnimationFrame', vi.fn(id => frames.delete(id)))
    played = []
    playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(function () { played.push(this); return Promise.resolve() })
    pauseSpy = vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {})
  })

  afterEach(async () => {
    wrapper?.unmount()
    wrapper = null
    await flushPromises()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  const open = async () => {
    wrapper = mount(Ventriglisse3D, mountOptions)
    await flushPromises()
    return wrapper
  }
  const button = label => wrapper.findAll('button').find(node => node.text().trim() === label)
  const click = async label => { expect(button(label), label).toBeTruthy(); await button(label).trigger('click'); await flushPromises() }
  const step = async (milliseconds = 100) => {
    vi.advanceTimersByTime(milliseconds)
    const callbacks = [...frames.values()]
    frames.clear()
    callbacks.forEach(callback => callback(performance.now()))
    await nextTick()
  }
  const begin = async () => { await click('Lancer la course'); vi.advanceTimersByTime(3050); await nextTick() }
  const distances = () => wrapper.findAll('.progress-person > span:last-child').map(node => parseFloat(node.text()))
  const scores = () => wrapper.findAll('.scoreboard li b').map(node => parseInt(node.text(), 10))
  const soundButton = () => wrapper.find('[role="switch"][aria-label*="effets sonores"]')
  const audio = name => wrapper.findAll('audio').find(node => node.attributes('src').includes(name)).element

  it('charge quatre sons WAV valides avec les URLs résolues par le bundler', async () => {
    await open()
    const sounds = [
      ['bip', bipAudioUrl], ['go', goAudioUrl], ['slide', slideAudioUrl], ['finish', finishAudioUrl],
    ]
    const elements = wrapper.findAll('audio')
    expect(elements).toHaveLength(sounds.length)
    sounds.forEach(([name, url], index) => {
      expect(elements[index].attributes('src')).toBe(url)
      expect(url).toMatch(new RegExp(`${name}\\.wav(?:\\?.*)?$`))
      const bytes = readFileSync(resolve(dirname(fileURLToPath(import.meta.url)), `../../src/components/games/assets/${name}.wav`))
      expect(bytes.length).toBeGreaterThan(44)
      expect(bytes.toString('ascii', 0, 4)).toBe('RIFF')
      expect(bytes.toString('ascii', 8, 12)).toBe('WAVE')
      expect(bytes.readUInt32LE(4)).toBe(bytes.length - 8)
    })
    expect(elements[2].attributes('loop')).toBeDefined()
    expect(elements.filter(node => node.attributes('loop') !== undefined)).toHaveLength(1)
  })

  it('préserve le décompte et son délai restant pendant une pause, sans lancer une autre manche', async () => {
    await open()
    await click('Lancer la course')
    vi.advanceTimersByTime(500)
    await click('Pause')
    expect(wrapper.get('.countdown-number').text()).toBe('3')
    expect(button('Lancer la course').attributes('disabled')).toBeDefined()
    vi.advanceTimersByTime(10000)
    await nextTick()
    expect(wrapper.get('.countdown-number').text()).toBe('3')
    expect(frames.size).toBe(0)
    await click('Reprendre')
    vi.advanceTimersByTime(199)
    await nextTick()
    expect(wrapper.get('.countdown-number').text()).toBe('3')
    vi.advanceTimersByTime(1)
    await nextTick()
    expect(wrapper.get('.countdown-number').text()).toBe('2')
    expect(wrapper.get('#race-title').text()).toBe('Manche 1')
    expect(scores()).toEqual([0, 0, 0, 0])
  })

  it('conserve aussi une pause dans le délai entre GO et le départ', async () => {
    await open()
    await click('Lancer la course')
    vi.advanceTimersByTime(2900)
    await click('Pause')
    vi.advanceTimersByTime(1000)
    await click('Reprendre')
    vi.advanceTimersByTime(149)
    expect(frames.size).toBe(0)
    vi.advanceTimersByTime(1)
    expect(frames.size).toBe(1)
    expect(wrapper.get('#race-title').text()).toBe('Manche 1')
  })

  it('fige les distances, reprend sans saut de temps et ne compte les scores qu’une fois', async () => {
    await open()
    await begin()
    await step()
    const beforePause = distances()
    await click('Pause')
    await step(10000)
    expect(distances()).toEqual(beforePause)
    await click('Reprendre')
    await step(100)
    distances().forEach((distance, index) => {
      expect(distance).toBeGreaterThan(beforePause[index])
      expect(distance - beforePause[index]).toBeLessThan(4)
    })
    let lastCallback
    for (let count = 0; count < 100 && !wrapper.find('.results-panel').exists(); count += 1) {
      lastCallback = [...frames.values()][0]
      await step(250)
    }
    expect(wrapper.get('.results-panel').text()).toContain('Victoire')
    expect(scores()).toEqual([4, 3, 2, 1])
    lastCallback?.(performance.now())
    await step(250)
    expect(scores()).toEqual([4, 3, 2, 1])
    expect(wrapper.get('#race-title').text()).toBe('Manche 1')
    expect(frames.size).toBe(0)
  })

  it('met la course en pause quand l’onglet est masqué et attend une reprise explicite', async () => {
    await open()
    await begin()
    await step()
    const initial = distances()
    mocks.hidden = true
    document.dispatchEvent(new Event('visibilitychange'))
    await nextTick()
    expect(wrapper.get('.race-toolbar p').text()).toContain('changement d’onglet')
    await step(10000)
    expect(distances()).toEqual(initial)
    mocks.hidden = false
    document.dispatchEvent(new Event('visibilitychange'))
    await nextTick()
    expect(button('Reprendre')).toBeTruthy()
    await step(1000)
    expect(distances()).toEqual(initial)
    await click('Reprendre')
    await step()
    expect(distances()).not.toEqual(initial)
  })

  it('ignore un callback de la course d’avant la pause même s’il est livré après la reprise', async () => {
    await open()
    await begin()
    const stale = [...frames.values()][0]
    await click('Pause')
    await click('Reprendre')
    const before = distances()
    stale(performance.now())
    await nextTick()
    expect(distances()).toEqual(before)
    expect(frames.size).toBe(1)
  })

  it('ne détourne pas les touches de saisie et propose un raccourci sur la piste seulement', async () => {
    await open()
    await begin()
    await wrapper.get('input').trigger('keydown', { key: 'p', code: 'KeyP' })
    expect(button('Pause')).toBeTruthy()
    const stage = wrapper.get('.race-stage')
    expect(stage.attributes('tabindex')).toBe('0')
    expect(stage.attributes('aria-describedby')).toBe('race-shortcuts')
    await stage.trigger('keydown', { key: 'p', code: 'KeyP' })
    expect(button('Reprendre')).toBeTruthy()
    await stage.trigger('keydown', { key: 'p', code: 'KeyP', repeat: true })
    expect(button('Reprendre')).toBeTruthy()
    await stage.trigger('keydown', { key: ' ', code: 'Space' })
    expect(button('Pause')).toBeTruthy()
  })

  it('verrouille immédiatement la préparation pour qu’un double clic ne crée qu’une manche', async () => {
    await open()
    const start = button('Lancer la course').element
    start.click()
    start.click()
    await flushPromises()
    expect(wrapper.get('#race-title').text()).toBe('Manche 1')
    vi.advanceTimersByTime(3050)
    expect(frames.size).toBe(1)
  })

  it('arrête le son immédiatement et ne relance que la glissade quand il est réactivé', async () => {
    await open()
    await begin()
    const slide = audio('slide')
    const go = audio('go.')
    const slidePlays = played.filter(item => item === slide).length
    const goPlays = played.filter(item => item === go).length
    expect(soundButton().attributes('aria-checked')).toBe('true')
    await soundButton().trigger('click')
    expect(soundButton().attributes('aria-checked')).toBe('false')
    expect(pauseSpy.mock.instances).toContain(slide)
    await soundButton().trigger('click')
    await flushPromises()
    expect(played.filter(item => item === slide)).toHaveLength(slidePlays + 1)
    expect(played.filter(item => item === go)).toHaveLength(goPlays)
    expect(soundButton().attributes('aria-checked')).toBe('true')
    for (let count = 0; count < 100 && !wrapper.find('.results-panel').exists(); count += 1) await step(250)
    await flushPromises()
    expect(played).toContain(audio('finish'))
    expect(soundButton().attributes('aria-checked')).toBe('true')
  })

  it('neutralise une lecture audio qui se résout après la désactivation du son', async () => {
    const pending = deferred()
    playSpy.mockImplementation(function () { played.push(this); return this.src.includes('slide') ? pending.promise : Promise.resolve() })
    await open()
    await begin()
    const slide = audio('slide')
    await soundButton().trigger('click')
    const pauses = pauseSpy.mock.instances.filter(item => item === slide).length
    pending.resolve()
    await flushPromises()
    expect(pauseSpy.mock.instances.filter(item => item === slide).length).toBe(pauses + 1)
    expect(soundButton().attributes('aria-checked')).toBe('false')
  })

  it('n’arrête pas la nouvelle glissade si une ancienne promesse audio se résout après la reprise', async () => {
    const pending = deferred()
    let firstSlide = true
    playSpy.mockImplementation(function () {
      played.push(this)
      if (this.src.includes('slide') && firstSlide) { firstSlide = false; return pending.promise }
      return Promise.resolve()
    })
    await open()
    await begin()
    const slide = audio('slide')
    await click('Pause')
    await click('Reprendre')
    const pauses = pauseSpy.mock.instances.filter(item => item === slide).length
    pending.resolve()
    await flushPromises()
    expect(pauseSpy.mock.instances.filter(item => item === slide)).toHaveLength(pauses)
  })

  it('reprend la préférence système, permet le mode manuel et garde la caméra fixe pendant la course', async () => {
    mocks.webgl = true
    mocks.systemMotion = true
    await open()
    expect(wrapper.get('[aria-label="Limiter les mouvements"]').attributes('aria-checked')).toBe('true')
    await begin()
    const renderer = mocks.renderers.at(-1)
    const overview = renderer.renders.at(-1).position
    await step(100)
    await step(100)
    expect(renderer.renders.at(-1).position).toEqual(overview)
    expect(distances().some(distance => distance > 0)).toBe(true)
    await wrapper.get('[aria-label="Limiter les mouvements"]').trigger('click')
    await step(100)
    expect(renderer.renders.at(-1).position).not.toEqual(overview)
    mocks.motionListeners.forEach(listener => listener({ matches: true }))
    await nextTick()
    expect(renderer.renders.at(-1).position).toEqual(overview)
    expect(wrapper.classes()).toContain('reduced-motion')
  })

  it('ne démarre ni décompte ni observateur tardif après démontage pendant le chargement des textures', async () => {
    mocks.webgl = true
    const pending = deferred()
    mocks.textureLoad.mockReturnValue(pending.promise)
    wrapper = mount(Ventriglisse3D, mountOptions)
    await nextTick()
    wrapper.unmount()
    wrapper = null
    pending.resolve()
    await flushPromises()
    vi.advanceTimersByTime(10000)
    expect(mocks.renderers).toHaveLength(0)
    expect(mocks.observers).toHaveLength(0)
    expect(mocks.avatarLoad).not.toHaveBeenCalled()
    expect(mocks.textures).toHaveLength(5)
    expect(mocks.textures.every(texture => texture.dispose.mock.calls.length === 1)).toBe(true)
    expect(frames.size).toBe(0)
    expect(mocks.motionListeners.size).toBe(0)
    expect(played).toHaveLength(0)
  })

  it('annule le lancement asynchrone d’une nouvelle manche si la page est quittée', async () => {
    mocks.webgl = true
    await open()
    const pending = deferred()
    mocks.textureLoad.mockReturnValue(pending.promise)
    button('Lancer la course').element.click()
    await nextTick()
    wrapper.unmount()
    wrapper = null
    pending.resolve()
    await flushPromises()
    vi.advanceTimersByTime(10000)
    expect(frames.size).toBe(0)
    expect(played).toHaveLength(0)
    expect(mocks.observers).toHaveLength(1)
    expect(mocks.observers[0].disconnect).toHaveBeenCalledOnce()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('annule les callbacks et tous les sons lors du démontage en course', async () => {
    await open()
    await begin()
    const stale = [...frames.values()][0]
    const audios = wrapper.findAll('audio').map(node => node.element)
    wrapper.unmount()
    wrapper = null
    const playCount = played.length
    stale(performance.now())
    vi.advanceTimersByTime(10000)
    expect(frames.size).toBe(0)
    expect(played).toHaveLength(playCount)
    audios.forEach(element => expect(pauseSpy.mock.instances).toContain(element))
    expect(mocks.motionListeners.size).toBe(0)
  })
})

describe('caméra fixe du mouvement réduit', () => {
  it.each([0.45, 0.9, 1.6, 2.4])('cadre la piste entière dans les deux axes pour un ratio %s', aspect => {
    const overview = getVentriglisseOverviewCamera(120, 26, aspect)
    const verticalHalfAngle = 54 * Math.PI / 360
    const horizontalHalfAngle = Math.atan(Math.tan(verticalHalfAngle) * aspect)
    const occupiedHalfAngle = Math.asin(overview.radius / overview.distance)
    expect(occupiedHalfAngle).toBeLessThan(verticalHalfAngle)
    expect(occupiedHalfAngle).toBeLessThan(horizontalHalfAngle)
    expect(overview.targetZ).toBe(-56)
    expect(Math.hypot(overview.y, overview.z - overview.targetZ)).toBeCloseTo(overview.distance)
  })
})
