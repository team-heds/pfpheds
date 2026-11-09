import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

const removeChannel = vi.fn()
const channel = vi.fn()

vi.mock('@/supabase', () => ({
  supabase: { channel, removeChannel }
}))

const { default: GamificationNotification } = await import(
  '@/components/gamification/notifications/GamificationNotification.vue'
)

describe('GamificationNotification immediate events', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows an RPC badge immediately without Realtime and deduplicates it', async () => {
    const wrapper = mount(GamificationNotification, {
      props: {
        userId: 'student-1',
        realtimeEnabled: false,
        autoHide: false
      },
      global: {
        stubs: { Button: true }
      }
    })

    const detail = {
      type: 'badge',
      title: 'Nouveau badge obtenu !',
      message: 'Premier post',
      xpGain: 10,
      dedupeKey: 'badge:badge-1'
    }

    window.dispatchEvent(new CustomEvent('gamification:notification', { detail }))
    window.dispatchEvent(new CustomEvent('gamification:notification', { detail }))
    await nextTick()

    expect(wrapper.text()).toContain('Nouveau badge obtenu !')
    expect(wrapper.text()).toContain('Premier post')
    expect(wrapper.text()).toContain('+10 XP')
    expect(wrapper.findAll('.notification-toast')).toHaveLength(1)
    expect(channel).not.toHaveBeenCalled()

    wrapper.unmount()
  })

  it('clears every pending animation and dismissal timer on unmount', async () => {
    const wrapper = mount(GamificationNotification, {
      props: {
        userId: 'student-1',
        realtimeEnabled: false,
        hideDelay: 5000
      },
      global: {
        stubs: { Button: true }
      }
    })

    window.dispatchEvent(new CustomEvent('gamification:notification', {
      detail: {
        type: 'quest',
        title: 'Quête terminée !',
        message: 'Parcours validé'
      }
    }))
    await nextTick()

    expect(vi.getTimerCount()).toBe(2)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
