import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

const realtime = vi.hoisted(() => ({ subscriptions: [], removeChannel: vi.fn() }))
vi.mock('@/supabase', () => ({
  supabase: {
    channel: vi.fn(name => {
      const channel = { name, callback: null }
      channel.on = vi.fn((_event, filter, callback) => { channel.callback = callback; channel.filter = filter; return channel })
      channel.subscribe = vi.fn(() => channel)
      realtime.subscriptions.push(channel)
      return channel
    }),
    removeChannel: realtime.removeChannel,
  },
}))
vi.mock('@/service/badgesService', () => ({
  BADGE_RARITY: {
    common: { name: 'Commun', color: '#9E9E9E', glow: false },
    rare: { name: 'Rare', color: '#FF9800', glow: true },
    legendary: { name: 'Légendaire', color: '#9C27B0', glow: true },
  },
}))

import BadgeCard from '@/components/gamification/BadgeCard.vue'
import AchievementNotification from '@/components/gamification/AchievementNotification.vue'
import GamificationNotification from '@/components/gamification/notifications/GamificationNotification.vue'

const badge = overrides => ({ id: 'badge-1', name: 'Premier pas', description: 'Une activité accomplie.', rarity: 'rare', icon: '🌟', color: '#FFD700', xpBonus: 10, ...overrides })
const wrappers = []
const render = (component, options = {}) => {
  const wrapper = mount(component, {
    ...options,
    global: { stubs: { Teleport: true, TransitionGroup: { template: '<div><slot /></div>' } }, ...options.global },
  })
  wrappers.push(wrapper)
  return wrapper
}
const immediate = detail => window.dispatchEvent(new CustomEvent('gamification:notification', { detail }))
const gain = (userId, sourceId = 'badge-1') => ({ user_id: userId, id: `xp-${sourceId}`, amount: 10, action: 'BADGE_UNLOCKED', source_id: sourceId, description: 'Badge gagné' })

beforeEach(() => {
  vi.useFakeTimers()
  realtime.subscriptions.length = 0
  vi.clearAllMocks()
})
afterEach(() => {
  wrappers.splice(0).forEach(wrapper => wrapper.unmount())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('consultation et nouveau gain de badge', () => {
  it('ne rejoue aucune célébration en montant ou consultant un badge historique', async () => {
    const wrapper = render(BadgeCard, { props: { badge: badge(), isUnlocked: true } })
    expect(wrapper.get('.badge-card').classes()).not.toContain('celebrating')
    expect(wrapper.find('.new-badge-indicator').exists()).toBe(false)
    await wrapper.get('.badge-card').trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    expect(wrapper.get('.badge-card').classes()).not.toContain('celebrating')
    wrapper.unmount()
    const second = render(BadgeCard, { props: { badge: badge(), isUnlocked: true } })
    expect(second.get('.badge-card').classes()).not.toContain('celebrating')
  })

  it('réserve la présentation Nouveau au signal explicite d’un badge acquis', async () => {
    const wrapper = render(BadgeCard, { props: { badge: badge(), isUnlocked: false, isNewlyUnlocked: true } })
    expect(wrapper.find('.new-badge-indicator').exists()).toBe(false)
    await wrapper.setProps({ isUnlocked: true })
    expect(wrapper.get('.badge-card').classes()).toContain('celebrating')
    expect(wrapper.get('.new-badge-indicator').text()).toContain('NOUVEAU')
    await wrapper.setProps({ isNewlyUnlocked: false })
    expect(wrapper.get('.badge-card').classes()).not.toContain('celebrating')
  })

  it('rend les icônes PrimeIcons et conserve les emojis', async () => {
    const wrapper = render(BadgeCard, { props: { badge: badge({ icon: 'pi pi-home' }), isUnlocked: true } })
    expect(wrapper.get('.badge-icon i').classes()).toContain('pi-home')
    expect(wrapper.get('.badge-icon').text()).not.toContain('pi pi-home')
    await wrapper.setProps({ badge: badge({ icon: '🌟' }) })
    expect(wrapper.get('.badge-icon').text()).toBe('🌟')
  })
})

describe('notification explicite de nouveau badge', () => {
  it('dédoublonne un même badge même après fermeture, puis accepte un nouveau badge', async () => {
    const wrapper = render(AchievementNotification, { props: { userId: 'A' } })
    expect(wrapper.vm.showAchievementNotification(badge())).toBe(1)
    expect(wrapper.vm.showAchievementNotification(badge())).toBeNull()
    await flushPromises()
    expect(wrapper.findAll('.achievement-notification')).toHaveLength(1)
    await wrapper.get('.close-btn').trigger('click')
    expect(wrapper.vm.showAchievementNotification(badge())).toBeNull()
    wrapper.vm.showAchievementNotification(badge({ id: 'badge-2', name: 'Deuxième pas' }))
    await flushPromises()
    expect(wrapper.findAll('.achievement-notification')).toHaveLength(1)
    expect(wrapper.text()).toContain('Deuxième pas')
  })

  it('isole les gains et les minuteries lors d’un changement de compte et au démontage', async () => {
    const wrapper = render(AchievementNotification, { props: { userId: 'A' } })
    wrapper.vm.showAchievementNotification(badge())
    await flushPromises()
    expect(vi.getTimerCount()).toBe(1)
    await wrapper.setProps({ userId: 'B' })
    expect(wrapper.findAll('.achievement-notification')).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
    expect(wrapper.vm.showAchievementNotification(badge())).not.toBeNull()
    await flushPromises()
    wrapper.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('borne la file visible et ne lance aucun son par défaut ou en mouvement réduit', async () => {
    const AudioContext = vi.fn()
    vi.stubGlobal('AudioContext', AudioContext)
    vi.stubGlobal('matchMedia', () => ({ matches: true }))
    const wrapper = render(AchievementNotification, { props: { soundEnabled: true } })
    for (let index = 0; index < 5; index += 1) wrapper.vm.showAchievementNotification(badge({ id: `badge-${index}` }))
    await flushPromises()
    expect(wrapper.findAll('.achievement-notification')).toHaveLength(3)
    expect(vi.getTimerCount()).toBe(3)
    expect(AudioContext).not.toHaveBeenCalled()
    wrapper.vm.dismissAllNotifications()
    expect(vi.getTimerCount()).toBe(0)
    await wrapper.setProps({ soundEnabled: false })
    vi.stubGlobal('matchMedia', () => ({ matches: false }))
    wrapper.vm.showAchievementNotification(badge({ id: 'sans-son' }))
    expect(AudioContext).not.toHaveBeenCalled()
  })

  it('affiche l’icône fournie et ne prétend pas attribuer un bonus inexistant', async () => {
    const wrapper = render(AchievementNotification)
    wrapper.vm.showAchievementNotification(badge({ icon: 'pi pi-home', xpBonus: 0 }))
    await flushPromises()
    expect(wrapper.get('.badge-icon-large i').classes()).toContain('pi-home')
    expect(wrapper.find('.xp-bonus').exists()).toBe(false)
  })
})

describe('isolation du centre global de gamification', () => {
  it('dédoublonne le gain immédiat et son journal Realtime sans récompenser de nouveau', async () => {
    const wrapper = render(GamificationNotification, { props: { userId: 'A', autoHide: false } })
    immediate({ userId: 'A', type: 'badge', title: 'Badge obtenu', dedupeKey: 'badge:badge-1' })
    realtime.subscriptions[0].callback({ new: gain('A') })
    await flushPromises()
    expect(wrapper.findAll('.notification-toast')).toHaveLength(1)
    expect(wrapper.text()).toContain('Badge obtenu')
  })

  it('vide l’ancien compte et ignore ses callbacks retardés, même après réabonnement', async () => {
    const wrapper = render(GamificationNotification, { props: { userId: 'A', showCenter: true } })
    const oldChannel = realtime.subscriptions[0]
    oldChannel.callback({ new: gain('A') })
    await flushPromises()
    expect(wrapper.findAll('.notification-toast')).toHaveLength(1)
    await wrapper.setProps({ userId: 'B' })
    expect(wrapper.findAll('.notification-toast')).toHaveLength(0)
    expect(wrapper.text()).toContain('Aucune notification')
    expect(vi.getTimerCount()).toBe(0)
    oldChannel.callback({ new: gain('B') })
    immediate({ userId: 'A', type: 'badge', title: 'Ancien compte', dedupeKey: 'badge:badge-1' })
    immediate({ userId: null, type: 'badge', title: 'Sans identité' })
    await flushPromises()
    expect(wrapper.findAll('.notification-toast')).toHaveLength(0)
    realtime.subscriptions[1].callback({ new: gain('B') })
    await flushPromises()
    expect(wrapper.findAll('.notification-toast')).toHaveLength(1)
    wrapper.unmount()
    oldChannel.callback({ new: gain('B', 'late') })
    expect(vi.getTimerCount()).toBe(0)
    expect(realtime.removeChannel).toHaveBeenCalledTimes(2)
  })

  it('ignore les anciens callbacks après désactivation Realtime et respecte la déconnexion', async () => {
    const wrapper = render(GamificationNotification, { props: { userId: 'A' } })
    const oldChannel = realtime.subscriptions[0]
    await wrapper.setProps({ realtimeEnabled: false })
    oldChannel.callback({ new: gain('A') })
    await flushPromises()
    expect(wrapper.findAll('.notification-toast')).toHaveLength(0)
    immediate({ userId: 'A', type: 'badge', title: 'Gain RPC' })
    await flushPromises()
    expect(wrapper.findAll('.notification-toast')).toHaveLength(1)
    await wrapper.setProps({ userId: null })
    expect(wrapper.vm.notify({ title: 'Anonyme' })).toBeNull()
    immediate({ type: 'badge', title: 'Ancien événement sans identité' })
    await flushPromises()
    expect(wrapper.findAll('.notification-toast')).toHaveLength(0)
    expect(vi.getTimerCount()).toBe(0)
  })

  it('conserve les anciens appels de présentation sans marqueur d’identité pour le compte actif', async () => {
    const wrapper = render(GamificationNotification, { props: { userId: 'A', realtimeEnabled: false, autoHide: false } })
    immediate({ type: 'badge', title: 'Compatibilité', dedupeKey: 'badge:legacy' })
    await flushPromises()
    expect(wrapper.findAll('.notification-toast')).toHaveLength(1)
  })
})
