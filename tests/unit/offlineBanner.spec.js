import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import OfflineBanner from '@/components/common/utils/OfflineBanner.vue'

let visibility = 'visible'

function setVisibility(state) {
  visibility = state
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('bannière de connexion : rythme des vérifications', () => {
  let fetchMock
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    visibility = 'visible'
    vi.spyOn(document, 'visibilityState', 'get').mockImplementation(() => visibility)
    fetchMock = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetchMock)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.useRealTimers()
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('vérifie une fois par minute quand la connexion va bien', async () => {
    wrapper = mount(OfflineBanner)
    expect(fetchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(59_000)
    expect(fetchMock).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(1_000)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(60_000)
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('ne fait aucune requête quand la page est cachée, et revérifie au retour', async () => {
    wrapper = mount(OfflineBanner)
    setVisibility('hidden')

    await vi.advanceTimersByTimeAsync(10 * 60_000)
    expect(fetchMock).not.toHaveBeenCalled()

    setVisibility('visible')
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('accélère après un échec, affiche la bannière, puis revient au rythme normal', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    wrapper = mount(OfflineBanner)

    await vi.advanceTimersByTimeAsync(60_000)
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await vi.advanceTimersByTimeAsync(5_000)
    expect(fetchMock).toHaveBeenCalledTimes(2)

    await vi.advanceTimersByTimeAsync(2_500)
    expect(wrapper.text()).toContain('Connexion Internet perdue')

    // Prochaine vérification rapide : 5 s après le 2e échec (t = 70 s).
    fetchMock.mockResolvedValue({ ok: true })
    await vi.advanceTimersByTimeAsync(2_500)
    expect(wrapper.text()).toContain('Connexion rétablie')

    const callsAfterRecovery = fetchMock.mock.calls.length
    await vi.advanceTimersByTimeAsync(59_000)
    expect(fetchMock).toHaveBeenCalledTimes(callsAfterRecovery)
    await vi.advanceTimersByTimeAsync(1_000)
    expect(fetchMock).toHaveBeenCalledTimes(callsAfterRecovery + 1)
  })
})
