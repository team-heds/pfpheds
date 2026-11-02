import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const mocks = vi.hoisted(() => ({
  getUserQuests: vi.fn(), getQuestStats: vi.fn(), startQuest: vi.fn(),
  getHousesRanking: vi.fn(), push: vi.fn(), toast: vi.fn(),
}))
vi.mock('@/components/common/utils/Navbar.vue', () => ({ default: { template: '<nav />' } }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ user: { id: 'student-test' } }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push, go: vi.fn() }) }))
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: mocks.toast }) }))
vi.mock('@/service/userQuestsService', () => ({ default: mocks }))
vi.mock('@/service/gamificationServiceSupabase', () => ({ default: mocks }))

import QuestsPage from '@/components/gamification/QuestsPage.vue'
import HousesRankingPage from '@/components/gamification/HousesRankingPage.vue'

const Header = { props: ['title'], template: '<header><h1>{{ title }}</h1><slot name="actions" /></header>' }
const Button = { props: ['label', 'disabled'], template: '<button :disabled="disabled">{{ label }}<slot /></button>' }
const stats = { totalQuests: 1, completedQuests: 0, totalXPFromQuests: 0, averageProgress: 20 }
const quests = [{ id: 'q1', title: 'Objectif clinique', description: 'Réaliser une activité.', difficulty: 'EASY', type: 'story', progress: 20, userProgress: { status: 'in_progress' } }]
const ranking = (xp = 100, lastUpdated = '2026-11-01T10:00:00Z') => ({
  totalUsers: 4, lastUpdated,
  ranking: [{ name: 'elaris', displayName: 'Elaris', color: '#DC143C', motto: 'Clarifier, guider, apaiser', level: 1, levelName: 'Maison Naissante', totalXP: xp, totalMembers: 4, averageXP: xp / 4, averageLevel: 1, xpToNext: 2375 - xp, progressPercent: xp / 2375 * 100, position: 1 }],
})
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }

describe('chargement et reprise des écrans de gamification', () => {
  let wrapper
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.getUserQuests.mockResolvedValue(quests)
    mocks.getQuestStats.mockResolvedValue(stats)
    mocks.getHousesRanking.mockResolvedValue(ranking())
  })
  afterEach(() => { wrapper?.unmount(); wrapper = null; localStorage.clear(); vi.restoreAllMocks() })
  const open = component => {
    wrapper = mount(component, {
      global: { stubs: {
        Navbar: true, GamificationPageHeader: Header, Button,
        GamificationStatCard: { props: ['value', 'label'], template: '<article>{{ label }} : {{ value }}</article>' },
        QuestCard: { props: ['quest'], template: '<article class="quest-result">{{ quest.title }}</article>' },
        InputText: { props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
      } },
    })
    return wrapper
  }
  const click = async name => {
    const target = wrapper.findAll('button').find(button => (button.attributes('aria-label') || button.text()).trim() === name)
    expect(target, name).toBeTruthy()
    await target.trigger('click')
    await flushPromises()
  }

  it('annonce un chargement de quêtes au lieu de montrer prématurément un état vide', async () => {
    const pending = deferred()
    mocks.getUserQuests.mockReturnValue(pending.promise)
    open(QuestsPage)
    expect(wrapper.get('[role="status"]').attributes('aria-label')).toBe('Chargement des quêtes')
    expect(wrapper.text()).not.toContain('Aucune quête active')
    expect(wrapper.find('#quest-search').exists()).toBe(false)
    pending.resolve(quests)
    await flushPromises()
    expect(wrapper.get('.quest-result').text()).toBe('Objectif clinique')
    expect(wrapper.find('[role="status"]').exists()).toBe(false)
  })

  it('distingue une panne de liste d’un compte sans quête, puis reprend après Réessayer', async () => {
    mocks.getUserQuests.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(quests)
    open(QuestsPage)
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Les quêtes n’ont pas pu être chargées')
    expect(wrapper.text()).not.toContain('Aucune quête active')
    expect(wrapper.findAll('.quest-result')).toHaveLength(0)
    await click('Réessayer')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('.quest-result').text()).toBe('Objectif clinique')
    expect(mocks.startQuest).not.toHaveBeenCalled()
  })

  it('signale aussi une panne des statistiques au lieu d’afficher des faux zéros', async () => {
    mocks.getQuestStats.mockRejectedValueOnce(new Error('stats offline')).mockResolvedValue(stats)
    open(QuestsPage)
    await flushPromises()
    expect(mocks.getQuestStats).toHaveBeenCalledWith('student-test', { strict: true })
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    expect(wrapper.text()).not.toContain('Quêtes complétées :')
    await click('Réessayer')
    expect(wrapper.text()).toContain('Quêtes complétées : 0/1')
  })

  it('conserve la recherche lors d’une actualisation en erreur puis d’une reprise', async () => {
    open(QuestsPage)
    await flushPromises()
    await wrapper.get('#quest-search').setValue('clinique')
    mocks.getUserQuests.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(quests)
    await click('Actualiser les quêtes')
    expect(wrapper.find('[role="alert"]').exists()).toBe(true)
    await click('Réessayer')
    expect(wrapper.get('#quest-search').element.value).toBe('clinique')
    expect(wrapper.get('.quest-result').text()).toBe('Objectif clinique')
  })

  it('affiche un vrai état vide seulement après une réponse réussie sans quête', async () => {
    mocks.getUserQuests.mockResolvedValue([])
    mocks.getQuestStats.mockResolvedValue({ ...stats, totalQuests: 0 })
    open(QuestsPage)
    await flushPromises()
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Aucune quête active')
  })

  it('montre une erreur de classement récupérable sans inventer des statistiques', async () => {
    mocks.getHousesRanking.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(ranking())
    open(HousesRankingPage)
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Impossible de charger le classement')
    expect(wrapper.text()).not.toContain('0 Étudiants')
    expect(wrapper.text()).not.toContain('Mis à jour')
    await click('Réessayer')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('Elaris')
    expect(wrapper.text()).toContain('4 Étudiants')
  })

  it('conserve le dernier classement et sa date quand une actualisation échoue, puis charge le nouveau résultat', async () => {
    open(HousesRankingPage)
    await flushPromises()
    const previousDate = wrapper.get('.global-stats').text()
    mocks.getHousesRanking.mockRejectedValueOnce(new Error('offline')).mockResolvedValue(ranking(200, '2026-11-02T11:00:00Z'))
    await click('Actualiser le classement')
    expect(wrapper.get('[role="alert"]').text()).toContain('dernier classement disponible')
    expect(wrapper.get('.global-stats').text()).toBe(previousDate)
    expect(wrapper.get('.ranking-list .metric .value').text()).toBe('100')
    await click('Réessayer')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('.ranking-list .metric .value').text()).toBe('200')
    expect(mocks.getHousesRanking).toHaveBeenCalledTimes(3)
  })

  it('ne remplace pas un classement vide réussi par une attente sans fin', async () => {
    mocks.getHousesRanking.mockResolvedValue({ ranking: [], totalUsers: 0, lastUpdated: '2026-11-02T10:00:00Z' })
    open(HousesRankingPage)
    await flushPromises()
    expect(wrapper.get('[role="status"]').text()).toContain('Aucun classement disponible')
    expect(wrapper.find('[aria-busy="true"]').exists()).toBe(false)
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
  })

  it('ignore un cache mal formé et recharge le classement depuis le service', async () => {
    localStorage.setItem('houses_ranking', JSON.stringify({ data: { ranking: null }, timestamp: Date.now() }))
    open(HousesRankingPage)
    await flushPromises()
    expect(mocks.getHousesRanking).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Elaris')
  })

  it('utilise un cache récent du contrat actuel puis force le réseau lors de l’actualisation', async () => {
    localStorage.setItem('houses_ranking', JSON.stringify({ version: 2, data: ranking(50), timestamp: Date.now() }))
    open(HousesRankingPage)
    await flushPromises()
    expect(mocks.getHousesRanking).not.toHaveBeenCalled()
    expect(wrapper.get('.ranking-list .metric .value').text()).toBe('50')
    await click('Actualiser le classement')
    expect(mocks.getHousesRanking).toHaveBeenCalledTimes(1)
    expect(wrapper.get('.ranking-list .metric .value').text()).toBe('100')
  })
})
