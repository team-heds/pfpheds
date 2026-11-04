import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'

const mocks = vi.hoisted(() => ({
  getUserQuests: vi.fn(), subscribeToQuestUpdates: vi.fn(), unsubscribeFromQuestUpdates: vi.fn(), push: vi.fn(),
  auth: null,
}))
vi.mock('@/service/userQuestsService', () => ({ default: mocks }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))

import QuestsProfileCard from '@/components/gamification/QuestsProfileCard.vue'

const quest = (id, overrides = {}) => ({
  id, title: `Quête ${id}`, description: 'Une activité proposée.', difficulty: 'EASY',
  status: 'in_progress', progress: 40, xp_reward: 25, ...overrides,
})
const deferred = () => {
  let resolve, reject
  const promise = new Promise((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

describe('quêtes actives du profil', () => {
  let wrapper
  beforeEach(() => {
    vi.resetAllMocks()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-11-02T12:00:00Z'))
    mocks.auth = reactive({ user: { id: 'student-a' } })
    mocks.getUserQuests.mockResolvedValue([])
    mocks.subscribeToQuestUpdates.mockReturnValue(null)
  })
  afterEach(() => { wrapper?.unmount(); wrapper = null; vi.useRealTimers() })
  const render = props => { wrapper = mount(QuestsProfileCard, { props }); return wrapper }
  const titles = () => wrapper.findAll('.quest-title').map(node => node.text())

  it('charge le contrat du service et présente seulement les statuts actifs non échus, par avancement', async () => {
    const rows = Object.freeze([
      Object.freeze(quest('commencée', { progress: 55, end_date: '2026-11-03T12:00:00Z' })),
      Object.freeze(quest('future', { status: 'not_started', progress: 0 })),
      Object.freeze(quest('terminée', { status: 'completed', progress: 100 })),
      Object.freeze(quest('échue', { end_date: '2026-11-01T12:00:00Z' })),
      Object.freeze(quest('échec', { status: 'failed' })),
      Object.freeze(quest('presque', { status: undefined, userProgress: { status: 'in_progress' }, progress: 90 })),
      Object.freeze(quest('inconnue', { status: 'unknown' })),
    ])
    mocks.getUserQuests.mockResolvedValue(rows)
    render()
    expect(wrapper.get('[role="status"]').text()).toContain('Chargement des quêtes')
    await flushPromises()
    expect(mocks.getUserQuests).toHaveBeenCalledWith('student-a')
    expect(titles()).toEqual(['Quête presque', 'Quête commencée', 'Quête future'])
    expect(wrapper.get('.count-badge').text()).toBe('3')
    expect(wrapper.text()).toContain('Facile')
    expect(wrapper.text()).toContain('À commencer')
    expect(rows.map(row => row.id)).toEqual(['commencée', 'future', 'terminée', 'échue', 'échec', 'presque', 'inconnue'])
    await wrapper.get('.quest-item').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith('/quests')
  })

  it('affiche une erreur récupérable plutôt qu’une fausse absence et réessaie sans écrire de progression', async () => {
    mocks.getUserQuests.mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce([quest('retrouvée')])
    render()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Quêtes indisponibles')
    expect(wrapper.find('.empty-state').exists()).toBe(false)
    await wrapper.get('.retry-button').trigger('click')
    await flushPromises()
    expect(titles()).toEqual(['Quête retrouvée'])
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(mocks.getUserQuests).toHaveBeenCalledTimes(2)
  })

  it('distingue une liste vide confirmée d’un contrat invalide', async () => {
    mocks.getUserQuests.mockResolvedValueOnce(null)
    render()
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    mocks.getUserQuests.mockResolvedValueOnce([])
    await wrapper.get('.retry-button').trigger('click')
    await flushPromises()
    expect(wrapper.get('.empty-state').text()).toContain('Aucune quête active pour le moment')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    await wrapper.get('.empty-state button').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith('/quests')
  })

  it('ignore les anciennes réponses et erreurs quand le profil consulté change', async () => {
    const first = deferred(), second = deferred(), third = deferred()
    mocks.getUserQuests.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise).mockReturnValueOnce(third.promise)
    render({ userId: 'profile-first' })
    await wrapper.setProps({ userId: 'profile-second' })
    second.resolve([quest('seconde')])
    await flushPromises()
    first.resolve([quest('ancienne')])
    await flushPromises()
    expect(titles()).toEqual(['Quête seconde'])
    await wrapper.setProps({ userId: 'profile-third' })
    expect(wrapper.find('.quest-item').exists()).toBe(false)
    third.reject(new Error('third failed'))
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
  })

  it('ne laisse pas un échec tardif remplacer le nouveau profil chargé', async () => {
    const first = deferred(), second = deferred()
    mocks.getUserQuests.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    render({ userId: 'profile-first' })
    await wrapper.setProps({ userId: 'profile-second' })
    second.resolve([quest('seconde')])
    await flushPromises()
    first.reject(new Error('old offline'))
    await flushPromises()
    expect(titles()).toEqual(['Quête seconde'])
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('retire les données personnelles et invalide la réponse lors d’une déconnexion', async () => {
    const pending = deferred()
    mocks.getUserQuests.mockReturnValueOnce(pending.promise)
    render({ userId: 'student-a' })
    mocks.auth.user = null
    await flushPromises()
    pending.resolve([quest('ancienne')])
    await flushPromises()
    expect(wrapper.text()).toContain('Connectez-vous pour retrouver vos quêtes')
    expect(wrapper.find('.quest-item').exists()).toBe(false)
    expect(mocks.getUserQuests).toHaveBeenCalledTimes(1)
  })

  it('présente les quêtes d’un autre profil en lecture seule, sans détour vers le journal personnel', async () => {
    mocks.getUserQuests.mockResolvedValue([quest('consultée')])
    render({ userId: 'another-profile' })
    await flushPromises()
    expect(wrapper.get('h3').text()).toBe('Quêtes de ce profil')
    expect(wrapper.text()).toContain('lecture seule')
    expect(wrapper.find('button.quest-item').exists()).toBe(false)
    expect(wrapper.find('.journal-link').exists()).toBe(false)
    await wrapper.get('.quest-item').trigger('click')
    expect(mocks.push).not.toHaveBeenCalled()
  })

  it('garde les previews réactives et isolées du service sans considérer leurs lignes comme des statuts réels', async () => {
    render({ previewQuests: [{ id: 'preview', title: 'Exemple illustratif', progress: 65 }], previewLoading: true, houseColor: '#FFD700' })
    expect(wrapper.find('[role="status"]').exists()).toBe(true)
    await wrapper.setProps({ previewLoading: false })
    expect(titles()).toEqual(['Exemple illustratif'])
    expect(wrapper.get('[role="progressbar"]').attributes('aria-valuenow')).toBe('65')
    expect(wrapper.attributes('style')).toContain('--house-foreground: #111827')
    await wrapper.setProps({ previewQuests: [] })
    expect(wrapper.find('.empty-state').exists()).toBe(true)
    expect(mocks.getUserQuests).not.toHaveBeenCalled()
    expect(mocks.subscribeToQuestUpdates).not.toHaveBeenCalled()
  })

  it('retire une quête à son échéance et borne la progression et les récompenses manquantes', async () => {
    mocks.getUserQuests.mockResolvedValue([
      quest('finissante', { end_date: '2026-11-02T12:00:30Z', progress: 200 }),
      quest('restante', { progress: -10, xp_reward: 0, points: 100 }),
    ])
    render()
    await flushPromises()
    expect(wrapper.findAll('[role="progressbar"]').map(node => node.attributes('aria-valuenow'))).toEqual(['100', '0'])
    expect(wrapper.findAll('.quest-reward span').map(node => node.text())).toEqual(['25 XP', '0 XP'])
    await vi.advanceTimersByTimeAsync(60000)
    expect(titles()).toEqual(['Quête restante'])
    expect(wrapper.get('.quest-status').text()).toBe('En cours')
  })

  it('nettoie les abonnements et l’horloge et ignore les événements de l’ancien profil', async () => {
    const firstChannel = {}, secondChannel = {}
    const callbacks = []
    mocks.subscribeToQuestUpdates.mockImplementation((_userId, callback) => {
      callbacks.push(callback)
      return callbacks.length === 1 ? firstChannel : secondChannel
    })
    render({ userId: 'profile-first' })
    await flushPromises()
    await wrapper.setProps({ userId: 'profile-second' })
    await flushPromises()
    expect(mocks.unsubscribeFromQuestUpdates).toHaveBeenCalledWith(firstChannel)
    const requests = mocks.getUserQuests.mock.calls.length
    callbacks[0]()
    await flushPromises()
    expect(mocks.getUserQuests).toHaveBeenCalledTimes(requests)
    callbacks[1]()
    await flushPromises()
    expect(mocks.getUserQuests).toHaveBeenCalledTimes(requests + 1)
    wrapper.unmount()
    wrapper = null
    expect(mocks.unsubscribeFromQuestUpdates).toHaveBeenCalledWith(secondChannel)
    expect(vi.getTimerCount()).toBe(0)
  })
})
