import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { useAutoRefresh } from '@/composables/useAutoRefresh'

describe('useAutoRefresh', () => {
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { vi.useRealTimers() })

  const mountWithAutoRefresh = (reloadFn, options) => {
    let result
    const Comp = defineComponent({
      setup() {
        result = useAutoRefresh(reloadFn, options)
        return {}
      },
      template: '<div />'
    })
    const wrapper = mount(Comp)
    return { wrapper, ...result }
  }

  it('appelle reloadFn après le délai par défaut (400ms)', () => {
    const reload = vi.fn()
    const { scheduleRefresh } = mountWithAutoRefresh(reload)

    scheduleRefresh()
    expect(reload).not.toHaveBeenCalled()

    vi.advanceTimersByTime(400)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('appelle reloadFn après un délai personnalisé', () => {
    const reload = vi.fn()
    const { scheduleRefresh } = mountWithAutoRefresh(reload)

    scheduleRefresh(200)
    vi.advanceTimersByTime(199)
    expect(reload).not.toHaveBeenCalled()

    vi.advanceTimersByTime(1)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('utilise le délai par défaut des options', () => {
    const reload = vi.fn()
    const { scheduleRefresh } = mountWithAutoRefresh(reload, { delay: 100 })

    scheduleRefresh()
    vi.advanceTimersByTime(100)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('annule le timer précédent (debounce)', () => {
    const reload = vi.fn()
    const { scheduleRefresh } = mountWithAutoRefresh(reload)

    scheduleRefresh()
    vi.advanceTimersByTime(200)
    scheduleRefresh() // reset le timer
    vi.advanceTimersByTime(200)
    expect(reload).not.toHaveBeenCalled()

    vi.advanceTimersByTime(200)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('cancelRefresh empêche l\'appel', () => {
    const reload = vi.fn()
    const { scheduleRefresh, cancelRefresh } = mountWithAutoRefresh(reload)

    scheduleRefresh()
    vi.advanceTimersByTime(200)
    cancelRefresh()
    vi.advanceTimersByTime(300)
    expect(reload).not.toHaveBeenCalled()
  })

  it('nettoie le timer au démontage du composant', () => {
    const reload = vi.fn()
    let result
    const Comp = defineComponent({
      setup() {
        result = useAutoRefresh(reload)
        return {}
      },
      template: '<div />'
    })
    const wrapper = mount(Comp)

    result.scheduleRefresh()
    wrapper.unmount()
    vi.advanceTimersByTime(500)
    expect(reload).not.toHaveBeenCalled()
  })

  it('gère plusieurs appels rapides (seul le dernier compte)', () => {
    const reload = vi.fn()
    const { scheduleRefresh } = mountWithAutoRefresh(reload)

    scheduleRefresh()
    scheduleRefresh()
    scheduleRefresh()
    scheduleRefresh()

    vi.advanceTimersByTime(400)
    expect(reload).toHaveBeenCalledTimes(1)
  })

  it('permet des appels successifs après le délai', () => {
    const reload = vi.fn()
    const { scheduleRefresh } = mountWithAutoRefresh(reload)

    scheduleRefresh()
    vi.advanceTimersByTime(400)
    expect(reload).toHaveBeenCalledTimes(1)

    scheduleRefresh()
    vi.advanceTimersByTime(400)
    expect(reload).toHaveBeenCalledTimes(2)
  })
})
