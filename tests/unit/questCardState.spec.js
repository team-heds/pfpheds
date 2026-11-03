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
const steps = () => [
  { id: 'step-post', step_order: 7, title: 'Publier un message', description: 'Publier ensuite sur le fil de test.', required: true },
  { id: 'step-profile', step_order: 2, title: 'Actualiser mon profil', description: 'Enregistrer son propre profil.', required: true },
]

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

  it('affiche les instructions ordonnées sans modifier les étapes reçues, puis leur validation serveur', async () => {
    const sourceSteps = steps()
    const wrapper = render({ steps: sourceSteps, current_step: 1, progress: 0 })
    await wrapper.get('.quest-card-compact').trigger('click')
    const section = wrapper.get('[aria-label="Étapes de la quête"]')
    const displayed = section.findAll('.quest-step')
    expect(displayed.map(step => step.get('h5').text())).toEqual(['Actualiser mon profil', 'Publier un message'])
    expect(sourceSteps.map(step => step.id)).toEqual(['step-post', 'step-profile'])
    expect(section.text()).toContain('Enregistrer son propre profil.')
    expect(section.text()).toContain('Publier ensuite sur le fil de test.')
    expect(section.get('.quest-steps-count').text()).toBe('1 / 2 validées')
    expect(displayed[0].text()).toContain('Validée')
    expect(displayed[0].classes()).toContain('step-completed')
    expect(displayed[1].attributes('aria-current')).toBe('step')
    expect(displayed[1].text()).toContain('Prochaine étape')
    expect(wrapper.emitted('start-quest')).toBeUndefined()
  })

  it('ne déduit aucune étape terminée du pourcentage, même à 100 %', async () => {
    const wrapper = render({ steps: steps(), current_step: 0, progress: 100 })
    await wrapper.get('.quest-card-compact').trigger('click')
    expect(wrapper.findAll('.step-completed')).toHaveLength(0)
    expect(wrapper.get('.quest-steps-count').text()).toBe('0 / 2 validées')
    expect(wrapper.get('[aria-current="step"]').text()).toContain('Actualiser mon profil')
  })

  it.each([undefined, null, '1', -1, 3, 0.5, Number.NaN])(
    'présente uniquement les instructions si le compte serveur est inconnu ou incohérent (%s)', async current_step => {
      const wrapper = render({ steps: steps(), current_step, progress: 100 })
      await wrapper.get('.quest-card-compact').trigger('click')
      expect(wrapper.findAll('.quest-step')).toHaveLength(2)
      expect(wrapper.findAll('.step-completed')).toHaveLength(0)
      expect(wrapper.find('[aria-current="step"]').exists()).toBe(false)
      expect(wrapper.find('.quest-steps-count').exists()).toBe(false)
    },
  )

  it('garde les étapes facultatives explicites sans inventer leur progression privée', async () => {
    const mixed = steps()
    mixed[0].required = false
    const wrapper = render({ steps: mixed, current_step: 1, progress: 100 })
    await wrapper.get('.quest-card-compact').trigger('click')
    expect(wrapper.get('.modal-steps').text()).toContain('Facultative')
    expect(wrapper.findAll('.step-completed')).toHaveLength(0)
    expect(wrapper.find('[aria-current="step"]').exists()).toBe(false)
    expect(wrapper.find('.quest-steps-count').exists()).toBe(false)
  })

  it('conserve les validations après réussite et ne propose plus de prochaine étape', async () => {
    const wrapper = render({ steps: steps(), current_step: 2, status: 'completed', progress: 100, end_date: '2026-10-30T12:00:00Z' })
    await wrapper.get('.quest-card-compact').trigger('click')
    expect(wrapper.findAll('.step-completed')).toHaveLength(2)
    expect(wrapper.get('.quest-steps-count').text()).toBe('2 / 2 validées')
    expect(wrapper.find('[aria-current="step"]').exists()).toBe(false)
    expect(wrapper.get('.modal-deadline.completed').text()).toBe('Quête terminée')
  })

  it('respecte showSteps et ne crée aucune liste vide', async () => {
    const wrapper = render({ steps: steps(), current_step: 0 })
    await wrapper.get('.quest-card-compact').trigger('click')
    expect(wrapper.find('.modal-steps').exists()).toBe(true)
    await wrapper.setProps({ showSteps: false })
    expect(wrapper.find('.modal-steps').exists()).toBe(false)
    await wrapper.setProps({ showSteps: true, quest: quest({ steps: [null] }) })
    expect(wrapper.find('.modal-steps').exists()).toBe(false)
  })
})
