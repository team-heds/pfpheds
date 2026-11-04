import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'

const mocks = vi.hoisted(() => ({
  auth: null,
  badges: { getMyBadgeProgress: vi.fn() },
  challenges: { getUserActiveChallenges: vi.fn(), getUserChallengeHistory: vi.fn(), getUserChallengeStats: vi.fn() },
}))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('@/service/badgesService', () => ({ default: mocks.badges }))
vi.mock('@/service/challengesService', () => ({ default: mocks.challenges }))
vi.mock('vue-router', () => ({ useRouter: () => ({ go: vi.fn() }) }))
vi.mock('@/components/common/utils/Navbar.vue', () => ({ default: { template: '<nav />' } }))
vi.mock('@/components/gamification/BadgeCard.vue', () => ({
  default: { props: ['badge'], template: '<button data-testid="content-item" @click="$emit(\'click\', badge)">{{ badge.name }}</button>' },
}))
vi.mock('@/components/gamification/ChallengeCard.vue', () => ({
  default: { props: ['challenge'], template: '<button data-testid="content-item" @click="$emit(\'click\', challenge)">{{ challenge.name }}</button>' },
}))

import AchievementsPage from '@/components/gamification/AchievementsPage.vue'
import ChallengesPage from '@/components/gamification/ChallengesPage.vue'

const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
const item = account => ({
  id: `test-${account}`, name: `Objectif du compte ${account}`, description: 'Un objectif de test.',
  category: 'progression', rarity: 'common', xpBonus: 10, currentValue: 1, targetValue: 1,
  isUnlocked: true, icon: '🌟', color: '#FFD700', difficulty: 'EASY', progress: 1, target: 1,
  completed: false, reward: { xp: 10, badge: null, title: null },
})
const batch = (kind, account) => ({
  account, main: deferred(), history: deferred(), stats: deferred(),
  resolve() {
    this.main.resolve([item(account)])
    if (kind === 'challenges') {
      this.history.resolve([{ challengeId: `history-${account}`, challengeName: `Historique ${account}`, completedAt: '2026-11-01T12:00:00Z', reward: { xp: 10 } }])
      this.stats.resolve({ totalCompleted: 1, totalXPFromChallenges: 10, streakWeeks: 1 })
    }
  },
  reject() { this.main.reject(new Error(`Échec du compte ${account}`)) },
})

describe.each([
  { kind: 'badges', component: AchievementsPage, noun: 'badges' },
  { kind: 'challenges', component: ChallengesPage, noun: 'défis' },
])('chargement isolé des $noun', ({ kind, component, noun }) => {
  let wrapper
  let requests
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.auth = reactive({ user: { id: 'A' } })
    requests = new Map()
    mocks.badges.getMyBadgeProgress.mockImplementation(() => requests.get(mocks.auth.user.id).main.promise)
    mocks.challenges.getUserActiveChallenges.mockImplementation(userId => requests.get(userId).main.promise)
    mocks.challenges.getUserChallengeHistory.mockImplementation(userId => requests.get(userId).history.promise)
    mocks.challenges.getUserChallengeStats.mockImplementation(userId => requests.get(userId).stats.promise)
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.restoreAllMocks()
  })

  const queue = account => {
    const pending = batch(kind, account)
    requests.set(account, pending)
    return pending
  }
  const open = () => {
    wrapper = mount(component, {
      global: {
        stubs: {
          GamificationPageHeader: { props: ['title'], template: '<h1>{{ title }}</h1>' },
          GamificationStatCard: { props: ['value', 'label'], template: '<p>{{ label }} : {{ value }}</p>' },
          Button: { props: ['label'], template: '<button>{{ label }}<slot /></button>' },
          Dialog: { props: ['visible', 'header'], template: '<section v-if="visible" role="dialog" :aria-label="header"><slot /></section>' },
        },
      },
    })
  }
  const requestCount = () => kind === 'badges'
    ? mocks.badges.getMyBadgeProgress.mock.calls.length
    : mocks.challenges.getUserActiveChallenges.mock.calls.length

  it.each(['resolve', 'reject'])('ignore une réponse A tardive (%s) après le chargement du compte B', async terminal => {
    const first = queue('A')
    open()
    const second = queue('B')
    mocks.auth.user = { id: 'B' }
    await nextTick()
    second.resolve()
    await flushPromises()
    expect(wrapper.text()).toContain('Objectif du compte B')
    first[terminal]()
    await flushPromises()
    expect(wrapper.text()).toContain('Objectif du compte B')
    expect(wrapper.text()).not.toContain('Objectif du compte A')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(console.error).not.toHaveBeenCalled()
    expect(requestCount()).toBe(2)
  })

  it('efface immédiatement les données et le détail ouvert lors du changement de compte', async () => {
    const first = queue('A')
    open()
    first.resolve()
    await flushPromises()
    await wrapper.get('[data-testid="content-item"]').trigger('click')
    expect(wrapper.get('[role="dialog"]').text()).toContain('Objectif du compte A')
    const second = queue('B')
    mocks.auth.user = { id: 'B' }
    await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Objectif du compte A')
    expect(wrapper.text()).not.toContain('Historique A')
    expect(wrapper.text()).toContain(`Chargement des ${noun}`)
    second.resolve()
    await flushPromises()
    expect(wrapper.text()).toContain('Objectif du compte B')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('garde le chargement de B quand A termine avant lui', async () => {
    const first = queue('A')
    open()
    const second = queue('B')
    mocks.auth.user = { id: 'B' }
    await nextTick()
    first.resolve()
    await flushPromises()
    expect(wrapper.text()).toContain(`Chargement des ${noun}`)
    expect(wrapper.findAll('[data-testid="content-item"]')).toHaveLength(0)
    second.resolve()
    await flushPromises()
    expect(wrapper.text()).toContain('Objectif du compte B')
  })

  it('vide la page à la déconnexion et ignore la lecture déjà en cours', async () => {
    const first = queue('A')
    open()
    mocks.auth.user = null
    await nextTick()
    expect(wrapper.text()).toContain(`Connectez-vous pour retrouver vos ${noun}`)
    first.resolve()
    await flushPromises()
    expect(wrapper.text()).not.toContain('Objectif du compte A')
    expect(wrapper.findAll('[data-testid="content-item"]')).toHaveLength(0)
    expect(requestCount()).toBe(1)
  })

  it('garde une erreur explicite, puis recharge correctement après Réessayer', async () => {
    const first = queue('A')
    open()
    first.reject()
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain(`Les ${noun} ne peuvent pas être chargés`)
    const retry = queue('A')
    const button = wrapper.findAll('button').find(node => node.text().trim() === 'Réessayer')
    expect(button).toBeTruthy()
    await button.trigger('click')
    expect(wrapper.text()).toContain(`Chargement des ${noun}`)
    retry.resolve()
    await flushPromises()
    expect(wrapper.text()).toContain('Objectif du compte A')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(requestCount()).toBe(2)
  })

  it('n’applique ni ne journalise une erreur après le démontage', async () => {
    const first = queue('A')
    open()
    wrapper.unmount()
    first.reject()
    mocks.auth.user = { id: 'B' }
    await flushPromises()
    expect(requestCount()).toBe(1)
    expect(console.error).not.toHaveBeenCalled()
  })

  if (kind === 'challenges') {
    it('ne publie pas un résultat partiel avant la fin de toutes les lectures', async () => {
      const pending = queue('A')
      open()
      pending.main.resolve([item('A')])
      await flushPromises()
      expect(wrapper.text()).toContain('Chargement des défis')
      expect(wrapper.findAll('[data-testid="content-item"]')).toHaveLength(0)
      pending.history.resolve([])
      pending.stats.resolve({ totalCompleted: 0, totalXPFromChallenges: 0, streakWeeks: 0 })
      await flushPromises()
      expect(wrapper.text()).toContain('Objectif du compte A')
    })
  }
})
