import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'

const mocks = vi.hoisted(() => ({
  auth: null,
  features: { userJourney: true, badgesChallenges: true, gamesHub: true, houseQuiz: true },
  gamification: vi.fn(), history: vi.fn(), quests: vi.fn(), questStats: vi.fn(),
  allBadges: vi.fn(), earnedBadges: vi.fn(), challenges: vi.fn(), challengeStats: vi.fn(),
  profile: vi.fn(), from: vi.fn(), push: vi.fn(),
}))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('@/config/gamificationFeatures', () => ({ gamificationFeatures: mocks.features }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push, back: vi.fn() }) }))
vi.mock('@/components/common/utils/Navbar.vue', () => ({ default: { template: '<nav />' } }))
vi.mock('@/supabase.js', () => ({ supabase: { from: mocks.from } }))
vi.mock('@/service/gamificationServiceSupabase', () => ({
  default: { getUserGamificationData: mocks.gamification },
  HES_HOUSES: {
    harmonis: { name: 'Harmonis', color: '#2E8B57', motto: 'L’équilibre soigne', icon: 'pi pi-plus' },
    elaris: { name: 'Elaris', color: '#DC143C', motto: 'Clarifier, guider, apaiser', icon: 'pi pi-sun' },
    doloris: { name: 'Doloris', color: '#FFD700', motto: 'Comprendre la douleur, c’est soigner', icon: 'pi pi-heart' },
    solencia: { name: 'Solencia', color: '#4169E1', motto: 'Apaiser pour mieux guérir', icon: 'pi pi-moon' },
  },
}))
vi.mock('@/service/gamificationHistoryService', () => ({ getGamificationHistory: mocks.history }))
vi.mock('@/service/userQuestsService', () => ({ default: { getUserQuests: mocks.quests, getQuestStats: mocks.questStats } }))
vi.mock('@/service/badgesService', () => ({ default: { getAllBadges: mocks.allBadges, getUserBadges: mocks.earnedBadges } }))
vi.mock('@/service/challengesService', () => ({ default: { getUserActiveChallenges: mocks.challenges, getUserChallengeStats: mocks.challengeStats } }))

import GamificationProfilePage from '@/components/gamification/GamificationProfilePage.vue'

const quest = (id, title, progress, overrides = {}) => ({
  id, title, progress, status: 'in_progress', description: `Étapes de ${title}`,
  xp_reward: 20, end_date: '2099-11-02T12:00:00Z', ...overrides,
})
const historyItem = (id, label) => ({
  id, label, detail: `Détail de ${label}`, icon: 'pi pi-star', points: 5,
  occurredAt: '2026-11-02T10:00:00Z', totalAfter: 505, linkedObject: null,
})
const historyPage = items => ({ items, page: 1, pageSize: 10, total: items.length, hasMore: false })
const deferred = () => { let resolve; const promise = new Promise(done => { resolve = done }); return { promise, resolve } }

describe('parcours du profil gamification', () => {
  let wrapper
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.auth = reactive({ user: { id: 'student-a', email: 'student-a@example.invalid' } })
    Object.assign(mocks.features, { userJourney: true, badgesChallenges: true, gamesHub: true, houseQuiz: true })
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.gamification.mockResolvedValue({ maison: 'Doloris', niveau: 3, xp: 500 })
    mocks.profile.mockImplementation(async id => ({ data: { display_name: id === 'student-b' ? 'Béatrice Test' : 'Alice Test' }, error: null }))
    mocks.from.mockImplementation(table => {
      if (table !== 'user_profiles') throw new Error(`Unexpected table ${table}`)
      let id
      const query = { select: () => query, eq: (_field, value) => { id = value; return query }, maybeSingle: () => mocks.profile(id) }
      return query
    })
    mocks.quests.mockResolvedValue([])
    mocks.questStats.mockResolvedValue({ totalQuests: 0, completedQuests: 0, totalXPFromQuests: 0 })
    mocks.history.mockResolvedValue(historyPage([]))
    mocks.allBadges.mockResolvedValue([])
    mocks.earnedBadges.mockResolvedValue([])
    mocks.challenges.mockResolvedValue([])
    mocks.challengeStats.mockResolvedValue({ totalCompleted: 0, totalXPFromChallenges: 0 })
  })
  afterEach(() => { wrapper?.unmount(); wrapper = null; vi.restoreAllMocks(); vi.useRealTimers() })

  const open = async (props = {}) => {
    wrapper = mount(GamificationProfilePage, {
      props,
      global: { stubs: {
        Navbar: true,
        GamificationPageHeader: { props: ['title', 'description'], template: '<header><h1>{{ title }}</h1><p>{{ description }}</p></header>' },
        RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
        BadgeCard: { props: ['badge'], template: '<article>{{ badge.name }}</article>' },
        ChallengeCard: { props: ['challenge'], template: '<article>{{ challenge.name }}</article>' },
        DetailModal: true,
      } },
    })
    await flushPromises()
    return wrapper
  }
  const section = label => wrapper.get(`section[aria-labelledby="${label}-title"]`)
  const stat = label => wrapper.findAll('.quick-stats > div').find(item => item.get('p').text() === label).get('span').text()
  const clickButton = async (root, label) => {
    const button = root.findAll('button').find(item => item.text().trim() === label)
    expect(button, label).toBeTruthy()
    await button.trigger('click')
    await flushPromises()
  }

  it('présente l’identité, la maison, les XP et une prochaine quête active réellement en cours', async () => {
    mocks.quests.mockResolvedValue([
      quest('expired', 'Ancienne quête', 99, { end_date: '2000-01-01T00:00:00Z' }),
      quest('completed', 'Quête déjà réussie', 100, { status: 'completed' }),
      quest('first', 'Préparer une activité', 20),
      quest('next', 'Poursuivre le cas clinique', 70),
    ])
    mocks.questStats.mockResolvedValue({ totalQuests: 4, completedQuests: 1 })
    await open()
    expect(wrapper.get('#profile-name').text()).toBe('Alice Test')
    expect(wrapper.get('.house-summary').text()).toContain('Doloris')
    expect(wrapper.get('.progress-heading').text()).toContain('500 XP')
    expect(wrapper.get('.level-chip').text()).toBe('Niveau 3')
    expect(wrapper.get('.next-step h3').text()).toBe('Poursuivre le cas clinique')
    expect(wrapper.get('.next-step [role="progressbar"]').attributes('aria-valuenow')).toBe('70')
    expect(wrapper.get('.next-step a').attributes('href')).toBe('/quests')
    expect(wrapper.get('.next-step a').text()).toContain('Poursuivre ma quête')
    expect(stat('Quêtes actives')).toBe('2')
    expect(section('quests').text()).not.toContain('Ancienne quête')
    expect(mocks.gamification).toHaveBeenCalledWith('student-a', { strict: true, refresh: true })
    expect(mocks.questStats).toHaveBeenCalledWith('student-a', { strict: true })
  })

  it('garde l’historique dans un détail natif accessible avec ses vrais mouvements', async () => {
    mocks.history.mockResolvedValue(historyPage([historyItem('h1', 'Connexion quotidienne')]))
    await open()
    const history = wrapper.get('details.history-section')
    expect(history.find('summary').exists()).toBe(true)
    expect(history.get('summary').text()).toContain('Historique de vos points')
    expect(history.attributes('open')).toBeUndefined()
    expect(history.get('ol li').text()).toContain('Connexion quotidienne')
    expect(history.get('ol li').text()).toContain('+5 XP')
    expect(mocks.history).toHaveBeenCalledWith('student-a', { page: 1, pageSize: 10 })
  })

  it.each([
    ['quests', 'Quêtes actives', 'Réessayer les quêtes', 'Aucune quête active'],
    ['badges', 'Badges obtenus', 'Réessayer les badges', 'Aucun badge obtenu'],
    ['challenges', 'Défis réussis', 'Réessayer les défis', 'Aucun défi actif'],
  ])('signale une panne de %s sans faux zéro et reprend sa section indépendamment', async (name, metric, button, emptyMessage) => {
    if (name === 'quests') mocks.questStats.mockRejectedValueOnce(new Error('offline'))
    if (name === 'badges') mocks.allBadges.mockRejectedValueOnce(new Error('offline'))
    if (name === 'challenges') mocks.challenges.mockRejectedValueOnce(new Error('offline'))
    await open()
    expect(wrapper.get('#profile-name').text()).toBe('Alice Test')
    expect(stat(metric)).toBe('—')
    expect(section(name).find('[role="alert"]').exists()).toBe(true)
    expect(section(name).text()).not.toContain(emptyMessage)
    await clickButton(section(name), button)
    expect(section(name).find('[role="alert"]').exists()).toBe(false)
    expect(stat(metric)).toBe('0')
    expect(section(name).text()).toContain(emptyMessage)
    expect(mocks.gamification).toHaveBeenCalledTimes(1)
  })

  it('distingue une panne du profil principal d’un nouveau compte sans XP et permet une reprise', async () => {
    mocks.gamification.mockRejectedValueOnce(new Error('offline'))
    await open()
    expect(wrapper.get('[role="alert"]').text()).toContain('Le profil n’a pas pu être chargé')
    expect(wrapper.find('.profile-summary').exists()).toBe(false)
    expect(wrapper.find('.quick-stats').exists()).toBe(false)
    await clickButton(wrapper, 'Réessayer')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(wrapper.get('#profile-name').text()).toBe('Alice Test')
    expect(wrapper.get('.progress-heading').text()).toContain('500 XP')
    expect(mocks.gamification).toHaveBeenCalledTimes(2)
  })

  it('ignore les quêtes et mouvements du profil A arrivant après le passage au profil B', async () => {
    const oldQuests = deferred()
    const oldHistory = deferred()
    mocks.quests.mockImplementation(id => id === 'student-a' ? oldQuests.promise : Promise.resolve([quest('qb', 'Objectif de Béatrice', 20)]))
    mocks.history.mockImplementation(id => id === 'student-a' ? oldHistory.promise : Promise.resolve(historyPage([historyItem('hb', 'Gain de Béatrice')])) )
    await open({ id: 'student-a' })
    await wrapper.setProps({ id: 'student-b' })
    await flushPromises()
    expect(wrapper.get('#profile-name').text()).toBe('Béatrice Test')
    expect(section('quests').text()).toContain('Objectif de Béatrice')
    oldQuests.resolve([quest('qa', 'Ancien objectif Alice', 90)])
    oldHistory.resolve(historyPage([historyItem('ha', 'Ancien gain Alice')]))
    await flushPromises()
    expect(wrapper.text()).not.toContain('Ancien objectif Alice')
    expect(wrapper.text()).not.toContain('Ancien gain Alice')
    expect(wrapper.get('.history-list').text()).toContain('Gain de Béatrice')
    expect(wrapper.get('#profile-name').text()).toBe('Béatrice Test')
  })

  it('la consultation administrative affiche la cible sans les actions personnelles de navigation', async () => {
    mocks.auth.user.id = 'administrator'
    await open({ id: 'student-b' })
    expect(wrapper.get('h1').text()).toBe('Progression du profil')
    expect(wrapper.get('#profile-name').text()).toBe('Béatrice Test')
    expect(wrapper.text()).toContain('Consultation administrative en lecture seule')
    expect(wrapper.find('.next-step').exists()).toBe(false)
    expect(wrapper.find('nav[aria-label="Explorer la gamification"]').exists()).toBe(false)
    expect(wrapper.find('a[href="/quests"]').exists()).toBe(false)
    expect(wrapper.find('a[href="/hes-house-quiz"]').exists()).toBe(false)
    expect(mocks.gamification).toHaveBeenCalledWith('student-b', expect.any(Object))
  })

  it('efface le contexte ancien lorsque l’acteur change même si l’identifiant consulté reste identique', async () => {
    mocks.auth.user.id = 'administrator-a'
    const oldQuests = deferred()
    const oldHistory = deferred()
    const nextProfile = deferred()
    mocks.quests.mockReturnValueOnce(oldQuests.promise).mockResolvedValue([quest('qb2', 'Objectif actualisé', 10)])
    mocks.history.mockReturnValueOnce(oldHistory.promise).mockResolvedValue(historyPage([historyItem('hb2', 'Gain actualisé')]))
    await open({ id: 'student-b' })
    expect(wrapper.get('#profile-name').text()).toBe('Béatrice Test')
    mocks.gamification.mockReturnValueOnce(nextProfile.promise)
    mocks.auth.user.id = 'administrator-b'
    await nextTick()
    expect(wrapper.find('#profile-name').exists()).toBe(false)
    expect(wrapper.text()).toContain('Chargement du profil')
    nextProfile.resolve({ maison: 'Doloris', niveau: 3, xp: 600 })
    await flushPromises()
    oldQuests.resolve([quest('old-actor', 'Objectif ancien acteur', 99)])
    oldHistory.resolve(historyPage([historyItem('old-actor-history', 'Gain ancien acteur')]))
    await flushPromises()
    expect(wrapper.text()).not.toContain('Objectif ancien acteur')
    expect(wrapper.text()).not.toContain('Gain ancien acteur')
    expect(section('quests').text()).toContain('Objectif actualisé')
    expect(wrapper.get('.history-list').text()).toContain('Gain actualisé')
    expect(wrapper.get('.progress-heading').text()).toContain('600 XP')
  })

  it('ne met pas en avant une quête dont la date limite est passée', async () => {
    mocks.quests.mockResolvedValue([quest('expired', 'Objectif terminé hier', 95, { end_date: '2000-01-01T00:00:00Z' })])
    await open()
    expect(wrapper.get('.next-step h3').text()).toBe('Choisissez votre prochain objectif')
    expect(wrapper.get('.next-step').text()).not.toContain('Objectif terminé hier')
    expect(stat('Quêtes actives')).toBe('0')
  })

  it.each([true, false])('respecte l’activation du questionnaire et des jeux (%s)', async enabled => {
    mocks.features.gamesHub = enabled
    mocks.features.houseQuiz = enabled
    mocks.gamification.mockResolvedValue({ maison: null, niveau: 1, xp: 0 })
    await open()
    expect(wrapper.find('a[href="/game"]').exists()).toBe(enabled)
    expect(wrapper.find('a[href="/hes-house-quiz"]').exists()).toBe(enabled)
    expect(wrapper.findAll('button').some(button => button.text().includes('Découvrir ma maison'))).toBe(enabled)
  })

  it('masque les collections et leurs requêtes lorsque leur fonctionnalité est désactivée', async () => {
    mocks.features.badgesChallenges = false
    await open()
    expect(wrapper.find('a[href="/achievements"]').exists()).toBe(false)
    expect(wrapper.find('a[href="/challenges"]').exists()).toBe(false)
    expect(mocks.allBadges).not.toHaveBeenCalled()
    expect(mocks.challenges).not.toHaveBeenCalled()
  })
})
