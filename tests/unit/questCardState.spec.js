import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import QuestCard from '@/components/gamification/QuestCard.vue'

const NOW = new Date('2026-11-02T12:00:00Z')
const quest = overrides => ({
  id: 'test-quest', title: 'Objectif de test', description: 'Une activité de test.',
  difficulty: 'EASY', type: 'story', status: 'in_progress', progress: 50,
  xp_reward: 20, end_date: '2026-11-03T12:00:00Z', ...overrides,
})
const dialog = {
  props: ['visible'],
  template: '<section v-if="visible" role="dialog"><slot name="header"/><slot/><slot name="footer"/></section>',
}

describe('états affichés des quêtes', () => {
  const wrappers = []
  const render = overrides => {
    const wrapper = mount(QuestCard, {
      props: { quest: quest(overrides), houseColor: '#FFD700' },
      global: { stubs: { Dialog: dialog } },
    })
    wrappers.push(wrapper)
    return wrapper
  }
  beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(NOW) })
  afterEach(() => { wrappers.splice(0).forEach(wrapper => wrapper.unmount()); vi.useRealTimers() })

  it.each(['2026-10-30T12:00:00Z', '2026-11-03T12:00:00Z'])(
    'garde une quête terminée réussie quelle que soit son échéance (%s)', async end_date => {
      const wrapper = render({ status: 'completed', progress: 100, end_date, completed_at: '2026-10-29T09:15:00Z' })
      const card = wrapper.get('.quest-card-compact')
      expect(card.classes()).toContain('quest-completed')
      expect(card.classes()).not.toContain('quest-expired')
      expect(card.classes()).not.toContain('quest-expiring-soon')
      expect(card.attributes('aria-label')).toContain('Terminée')
      expect(card.text()).toContain('Terminée le 29')
      expect(wrapper.find('.deadline-warning-compact').exists()).toBe(false)
      await card.trigger('click')
      const modal = wrapper.get('[role="dialog"]')
      expect(modal.text()).toContain('Quête terminée le 29')
      expect(modal.text()).not.toMatch(/Expirée|a expiré|Temps restant|Se termine dans|Quête expirée/)
      expect(modal.find('.modal-deadline.completed').exists()).toBe(true)
      expect(modal.find('.expired-notice').exists()).toBe(false)
      await vi.advanceTimersByTimeAsync(180000)
      expect(wrapper.emitted('quest-expired')).toBeUndefined()
    },
  )

  it('ne confond pas la date limite avec la date de réussite quand celle-ci manque', async () => {
    const wrapper = render({ status: 'completed', progress: 100, completed_at: null })
    expect(wrapper.get('.quest-completion-compact').text()).toBe('Terminée')
    await wrapper.get('.quest-card-compact').trigger('click')
    expect(wrapper.get('.modal-deadline.completed').text()).toBe('Quête terminée')
  })

  it('présente une quête échue avec un statut et un détail cohérents, sans signal répété', async () => {
    const wrapper = render({ end_date: '2026-11-01T12:00:00Z' })
    const card = wrapper.get('.quest-card-compact')
    expect(card.classes()).toContain('quest-expired')
    expect(card.attributes('aria-label')).toContain('Expirée')
    expect(card.text()).toContain('Expirée le')
    await card.trigger('click')
    expect(wrapper.get('.modal-badge.status').text()).toContain('Expirée')
    expect(wrapper.get('.expired-notice').text()).toContain('Quête expirée')
    await vi.advanceTimersByTimeAsync(180000)
    expect(wrapper.emitted('quest-expired')).toBeUndefined()
  })

  it('signale une seule fois le passage de la date limite et arrête l’urgence après une réussite serveur', async () => {
    const initial = quest({ end_date: '2026-11-02T12:00:30Z' })
    const wrapper = render(initial)
    expect(wrapper.get('.quest-card-compact').classes()).toContain('quest-expiring-soon')
    expect(wrapper.get('.quest-card-compact').attributes('aria-label')).toContain('En cours')
    await vi.advanceTimersByTimeAsync(60000)
    expect(wrapper.get('.quest-card-compact').classes()).toContain('quest-expired')
    expect(wrapper.emitted('quest-expired')).toEqual([['test-quest']])
    await vi.advanceTimersByTimeAsync(180000)
    expect(wrapper.emitted('quest-expired')).toHaveLength(1)
    await wrapper.setProps({ quest: { ...initial, status: 'completed', progress: 100, completed_at: '2026-11-02T12:00:20Z' } })
    expect(wrapper.get('.quest-card-compact').classes()).toContain('quest-completed')
    expect(wrapper.get('.quest-card-compact').classes()).not.toContain('quest-expired')
    expect(wrapper.find('.deadline-warning-compact').exists()).toBe(false)
    await vi.advanceTimersByTimeAsync(60000)
    expect(wrapper.emitted('quest-expired')).toHaveLength(1)
  })

  it.each([null, 'pas-une-date'])(
    'ne fabrique pas d’échéance ni d’expiration avec une date absente ou invalide (%s)', async end_date => {
      const wrapper = render({ end_date })
      expect(wrapper.find('.quest-deadline-compact').exists()).toBe(false)
      expect(wrapper.get('.quest-card-compact').classes()).not.toContain('quest-expired')
      await wrapper.get('.quest-card-compact').trigger('click')
      expect(wrapper.find('.modal-deadline').exists()).toBe(false)
      expect(wrapper.text()).not.toContain('Invalid Date')
      await vi.advanceTimersByTimeAsync(180000)
      expect(wrapper.emitted('quest-expired')).toBeUndefined()
    },
  )

  it('conserve l’expiration explicite renvoyée par le serveur', () => {
    const wrapper = render({ status: 'failed', end_date: null })
    expect(wrapper.get('.quest-card-compact').classes()).toContain('quest-expired')
    expect(wrapper.get('.quest-card-compact').attributes('aria-label')).toContain('Expirée')
  })

  it.each([['EASY', 'Facile'], ['MEDIUM', 'Moyen'], ['HARD', 'Difficile'], ['EPIC', 'Épique'], ['LEGENDARY', 'Légendaire'], ['expert', 'Expert']])(
    'affiche le libellé de difficulté %s dans le détail', async (difficulty, label) => {
      const wrapper = render({ difficulty })
      await wrapper.get('.quest-card-compact').trigger('click')
      expect(wrapper.get('.modal-badge.difficulty').text()).toContain(label)
    },
  )

  it('rend une icône PrimeIcons dans la carte et le détail, en conservant les emojis', async () => {
    const wrapper = render({ icon: 'pi pi-home' })
    expect(wrapper.get('.quest-icon-small i').classes()).toContain('pi-home')
    expect(wrapper.get('.quest-icon-small').text()).not.toContain('pi pi-home')
    await wrapper.get('.quest-card-compact').trigger('click')
    expect(wrapper.get('.modal-icon i').classes()).toContain('pi-home')
    await wrapper.setProps({ quest: quest({ icon: '🧭' }) })
    expect(wrapper.get('.quest-icon-small .icon-emoji').text()).toBe('🧭')
    expect(wrapper.get('.modal-icon .icon-emoji-large').text()).toBe('🧭')
  })
})
