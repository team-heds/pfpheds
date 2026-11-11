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

  it('se place sous un message de l’application affiché au même coin, puis remonte', async () => {
    const toast = document.createElement('div')
    toast.className = 'p-toast p-toast-top-right'
    const message = document.createElement('div')
    message.className = 'p-toast-message'
    message.getBoundingClientRect = () => ({ bottom: 108 })
    toast.appendChild(message)
    document.body.appendChild(toast)

    const wrapper = mount(GamificationNotification, {
      props: { userId: 'student-1', realtimeEnabled: false, autoHide: false },
      global: { stubs: { Button: true } }
    })
    const offset = () => wrapper.get('.gamification-notifications').element.style.getPropertyValue('--toast-offset')

    expect(offset()).toBe('0px')
    window.dispatchEvent(new CustomEvent('gamification:notification', {
      detail: { type: 'streak', title: 'Série de 7 jours !', message: 'Bravo', xpGain: 20 }
    }))
    await nextTick()
    expect(offset()).toBe('108px')

    toast.remove()
    vi.advanceTimersByTime(250)
    await nextTick()
    expect(offset()).toBe('0px')

    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
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

    // Animation d'entrée, masquage automatique et suivi de position sous les messages de l'application.
    expect(vi.getTimerCount()).toBe(3)
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})
