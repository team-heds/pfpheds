import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { defineComponent, h, ref } from 'vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { HIDE_AFTER, createScrollHider } from '@/mobile/shell/scrollHider'
import { useMobileShellStore } from '@/mobile/shell/mobileShellStore'
import { useMobileImmersive } from '@/mobile/shell/useMobileImmersive'
import MobileTabBar from '@/mobile/shell/MobileTabBar.vue'
import { buildTabs } from '@/mobile/shell/tabs'
import appRoutes from '@/router/routes/apps'

const LONG = { scrollHeight: 4000, clientHeight: 700 }
const at = (scrollTop, size = LONG) => ({ scrollTop, ...size })

describe('barre d’onglets : masquage au défilement', () => {
  it('ne se cache pas au premier pixel, mais après 48 px vers le bas', () => {
    const hider = createScrollHider()
    expect(HIDE_AFTER).toBe(48)
    expect(hider.update(at(20))).toBe(false)
    expect(hider.update(at(40))).toBe(false)
    expect(hider.update(at(47))).toBe(false)
    expect(hider.update(at(49))).toBe(true)
  })

  it('réapparaît dès qu’on remonte, puis se recache après 48 px de descente', () => {
    const hider = createScrollHider()
    hider.update(at(100))
    expect(hider.update(at(300))).toBe(true)
    expect(hider.update(at(297))).toBe(true) // petit tremblement du doigt : ignoré
    expect(hider.update(at(280))).toBe(false)
    expect(hider.update(at(300))).toBe(false)
    expect(hider.update(at(330))).toBe(true)
  })

  it('réapparaît en haut de la liste', () => {
    const hider = createScrollHider()
    hider.update(at(100))
    hider.update(at(400))
    expect(hider.update(at(5))).toBe(false)
  })

  it('reste visible sur un écran trop court pour défiler vraiment', () => {
    const hider = createScrollHider()
    const short = { scrollHeight: 800, clientHeight: 700 }
    hider.update(at(10, short))
    expect(hider.update(at(100, short))).toBe(false)
  })
})

describe('barre d’onglets : état partagé', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('se cache pendant le défilement, une tâche plein écran ou avec le clavier', () => {
    const store = useMobileShellStore()
    expect(store.tabBarHidden).toBe(false)
    store.setBarsHidden(true)
    expect(store.tabBarHidden).toBe(true)
    store.setBarsHidden(false)
    store.enterImmersive()
    expect(store.tabBarHidden).toBe(true)
    store.leaveImmersive()
    store.setKeyboardOpen(true)
    expect(store.tabBarHidden).toBe(true)
    store.setKeyboardOpen(false)
    expect(store.tabBarHidden).toBe(false)
  })

  it('revient quand on change d’écran', () => {
    const store = useMobileShellStore()
    store.syncRoute({ fullPath: '/feed', path: '/feed', hash: '' })
    store.setBarsHidden(true)
    store.syncRoute({ fullPath: '/institution', path: '/institution', hash: '' })
    expect(store.barsHidden).toBe(false)
  })

  it('un écran déclare sa tâche plein écran, et la libère en partant', async () => {
    const store = useMobileShellStore()
    const playing = ref(false)
    const Game = defineComponent({ setup() { useMobileImmersive(() => playing.value); return () => h('div') } })
    const wrapper = mount(Game)
    expect(store.immersiveCount).toBe(0)
    playing.value = true
    await wrapper.vm.$nextTick()
    expect(store.immersiveCount).toBe(1)
    wrapper.unmount()
    expect(store.immersiveCount).toBe(0)
  })

  it('le scanner et la partie de quiz sont des tâches plein écran', () => {
    const byName = Object.fromEntries(appRoutes.map((route) => [route.name, route]))
    expect(byName.ScanCode.meta.mobileImmersive).toBe(true)
    expect(byName.QuizPlayView.meta.mobileImmersive).toBe(true)
  })
})

describe('barre d’onglets : affichage', () => {
  it('glisse sous le bord quand elle est cachée et demande à revenir au clavier', async () => {
    const wrapper = mount(MobileTabBar, { props: { tabs: buildTabs('u1'), active: 'home', hidden: true } })
    expect(wrapper.classes()).toContain('is-hidden')
    await wrapper.trigger('focusin')
    expect(wrapper.emitted('reveal')).toHaveLength(1)
    await wrapper.setProps({ hidden: false })
    expect(wrapper.classes()).not.toContain('is-hidden')
  })
})
