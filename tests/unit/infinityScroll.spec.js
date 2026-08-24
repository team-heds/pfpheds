import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import InfinityScroll from '@/components/social/library/InfinityScroll.vue'

describe('InfinityScroll', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('déclenche la pagination sur le parent desktop', async () => {
    const host = document.createElement('div')
    document.body.appendChild(host)
    const wrapper = mount(InfinityScroll, { attachTo: host })
    const parent = wrapper.element.parentElement

    Object.defineProperties(parent, {
      scrollTop: { configurable: true, value: 551 },
      clientHeight: { configurable: true, value: 400 },
      scrollHeight: { configurable: true, value: 1000 }
    })
    parent.dispatchEvent(new Event('scroll'))

    expect(wrapper.emitted('load-more')).toHaveLength(1)
    wrapper.unmount()
    host.remove()
  })

  it('déclenche la pagination sur la fenêtre mobile', async () => {
    const wrapper = mount(InfinityScroll, {
      props: { scrollTarget: 'window' }
    })
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(551)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(400)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(1000)

    window.dispatchEvent(new Event('scroll'))

    expect(wrapper.emitted('load-more')).toHaveLength(1)
    wrapper.unmount()
  })

  it('ne déclenche pas une seconde page pendant un chargement', () => {
    const wrapper = mount(InfinityScroll, {
      props: { scrollTarget: 'window', loading: true }
    })
    vi.spyOn(window, 'scrollY', 'get').mockReturnValue(1000)
    vi.spyOn(window, 'innerHeight', 'get').mockReturnValue(800)
    vi.spyOn(document.documentElement, 'scrollHeight', 'get').mockReturnValue(1200)

    window.dispatchEvent(new Event('scroll'))

    expect(wrapper.emitted('load-more')).toBeUndefined()
    wrapper.unmount()
  })
})
