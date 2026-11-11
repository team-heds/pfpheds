import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import InfinityScroll from '@/components/social/library/InfinityScroll.vue'
import { findPageScroller } from '@/utils/pageScroller'

function setScrollSize(element, { scrollTop, clientHeight, scrollHeight }) {
  Object.defineProperty(element, 'clientHeight', { configurable: true, value: clientHeight })
  Object.defineProperty(element, 'scrollHeight', { configurable: true, value: scrollHeight })
  element.scrollTop = scrollTop
}

describe('défilement du fil sur téléphone', () => {
  it('retrouve le bloc qui défile réellement, sinon la fenêtre', () => {
    const scroller = document.createElement('div')
    scroller.style.overflowY = 'auto'
    const wrapper = document.createElement('div')
    const feed = document.createElement('div')
    wrapper.appendChild(feed)
    scroller.appendChild(wrapper)
    document.body.appendChild(scroller)

    expect(findPageScroller(feed)).toBe(scroller)
    expect(findPageScroller(scroller)).toBe(window)
    scroller.remove()
  })

  it('charge la suite quand le bloc principal de la page approche du bas', async () => {
    const scroller = document.createElement('div')
    scroller.style.overflowY = 'auto'
    const host = document.createElement('div')
    scroller.appendChild(host)
    document.body.appendChild(scroller)

    const wrapper = mount(InfinityScroll, { props: { scrollTarget: 'page' }, attachTo: host })

    setScrollSize(scroller, { scrollTop: 100, clientHeight: 800, scrollHeight: 5000 })
    scroller.dispatchEvent(new Event('scroll'))
    expect(wrapper.emitted('load-more')).toBeUndefined()

    setScrollSize(scroller, { scrollTop: 4000, clientHeight: 800, scrollHeight: 5000 })
    scroller.dispatchEvent(new Event('scroll'))
    expect(wrapper.emitted('load-more')).toHaveLength(1)

    wrapper.unmount()
    scroller.remove()
  })

  it('ne relance pas de chargement pendant qu’un chargement est en cours', () => {
    const scroller = document.createElement('div')
    scroller.style.overflowY = 'scroll'
    const host = document.createElement('div')
    scroller.appendChild(host)
    document.body.appendChild(scroller)

    const wrapper = mount(InfinityScroll, { props: { scrollTarget: 'page', loading: true }, attachTo: host })
    setScrollSize(scroller, { scrollTop: 4200, clientHeight: 800, scrollHeight: 5000 })
    scroller.dispatchEvent(new Event('scroll'))
    expect(wrapper.emitted('load-more')).toBeUndefined()

    wrapper.unmount()
    scroller.remove()
  })
})
