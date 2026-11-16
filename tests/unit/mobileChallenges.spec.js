import fs from 'node:fs'
import path from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  service: {
    getUserActiveChallenges: vi.fn(),
    getUserChallengeHistory: vi.fn(),
    getUserChallengeStats: vi.fn(),
  },
  push: vi.fn(),
  open: vi.fn(),
  auth: null,
}))

vi.mock('@/supabase', () => ({ supabase: {} }))
vi.mock('@/supabase.js', () => ({ supabase: {} }))
vi.mock('@/service/challengesService', () => ({ default: mocks.service }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/mobile/shell/useMobileShell', () => ({ useMobileShell: () => ({ open: mocks.open, close: vi.fn(), goBack: vi.fn() }) }))

import MobileChallengesScreen from '@/mobile/challenges/MobileChallengesScreen.vue'
import {
  challengeSummary,
  challengeTarget,
  formatXp,
  progressLabel,
  progressPercent,
  shortDate,
  sortChallenges,
} from '@/mobile/challenges/challengeHelpers'
import { OVERLAYS, canRestoreOverlay } from '@/mobile/shell/overlayRegistry'

const challenge = (id, extra = {}) => ({
  id,
  name: `Défi ${id}`,
  description: 'Fais quelque chose',
  icon: '🎯',
  target: 4,
  progress: 0,
  completed: false,
  reward: { xp: 20 },
  difficulty: 'EASY',
  category: 'engagement',
  startDate: '2026-11-09',
  endDate: '2026-12-06T23:59:59.999',
  ...extra,
})

describe('écran Défis : calculs', () => {
  it('borne la progression et affiche « fait / objectif »', () => {
    expect(progressPercent(challenge(1, { progress: 1 }))).toBe(25)
    expect(progressPercent(challenge(1, { progress: 9 }))).toBe(100)
    expect(progressPercent(challenge(1, { target: 0 }))).toBe(0)
    expect(progressPercent(challenge(1, { completed: true }))).toBe(100)
    expect(progressLabel(challenge(1, { progress: 9 }))).toBe('4 / 4')
    expect(progressLabel(challenge(1, { completed: true, progress: 1 }))).toBe('4 / 4')
  })

  it('met les défis à faire en tête, les plus avancés d’abord, les réussis à la fin', () => {
    const sorted = sortChallenges([
      challenge('a', { completed: true }),
      challenge('b', { progress: 1 }),
      challenge('c', { progress: 3 }),
      challenge('d'),
    ])
    expect(sorted.map((item) => item.id)).toEqual(['c', 'b', 'd', 'a'])
  })

  it('résume la période et formate les nombres', () => {
    expect(challengeSummary([challenge(1, { completed: true }), challenge(2)])).toEqual({ done: 1, total: 2, percent: 50 })
    expect(challengeSummary([])).toEqual({ done: 0, total: 0, percent: 0 })
    expect(formatXp(65)).toBe('65')
    expect(formatXp(1250)).toMatch(/^1[.,]3 k$/)
    expect(shortDate('2026-11-12T10:00:00Z', new Date('2026-11-16'))).toMatch(/12 nov/)
    expect(shortDate('2025-11-12T10:00:00Z', new Date('2026-11-16'))).toMatch(/2025/)
    expect(shortDate(null)).toBe('')
  })

  it('un défi à faire avec un lien y mène ; réussi, il ouvre sa fiche', () => {
    expect(challengeTarget(challenge(1, { actionUrl: '/quiz' }))).toBe('/quiz')
    expect(challengeTarget(challenge(1, { actionUrl: '/quiz', completed: true }))).toBe(null)
    expect(challengeTarget(challenge(1))).toBe(null)
  })
})

describe('écran Défis : affichage', () => {
  let online = true

  beforeEach(() => {
    mocks.auth = reactive({ user: { id: 'u1' } })
    mocks.service.getUserActiveChallenges.mockResolvedValue([
      challenge('a', { completed: true }),
      challenge('b', { progress: 2, actionUrl: '/mot-de-la-semaine' }),
    ])
    mocks.service.getUserChallengeHistory.mockResolvedValue([
      { challengeId: 'a', challengeName: 'Défi a', completedAt: '2026-11-12T10:00:00Z', reward: { xp: 20 } },
    ])
    mocks.service.getUserChallengeStats.mockResolvedValue({ totalCompleted: 3, totalXPFromChallenges: 65 })
    online = true
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    mocks.push.mockReset()
    mocks.open.mockReset()
  })

  it('montre des squelettes, puis la liste triée et le résumé', async () => {
    const wrapper = mount(MobileChallengesScreen)
    expect(wrapper.findAll('.m-skeleton').length).toBeGreaterThan(0)
    expect(wrapper.text()).not.toMatch(/Chargement/)
    await flushPromises()
    const names = wrapper.findAll('.m-defis__name').map((el) => el.text())
    expect(names).toEqual(['Défi b', 'Défi a'])
    expect(wrapper.find('.m-defis__count').text()).toMatch(/1\s*sur 2 défis réussis/)
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('50')
    expect(wrapper.text()).toContain('Réussis récemment')
    expect(wrapper.findAll('.m-skeleton')).toHaveLength(0)
  })

  it('un défi avec lien ouvre le jeu ; un défi réussi ouvre sa fiche en panneau du bas', async () => {
    const wrapper = mount(MobileChallengesScreen)
    await flushPromises()
    const rows = wrapper.findAll('.m-defis__row')
    await rows[0].trigger('click')
    expect(mocks.push).toHaveBeenCalledWith('/mot-de-la-semaine')
    await rows[1].trigger('click')
    expect(mocks.open).toHaveBeenCalledWith('defi', { challenge: expect.objectContaining({ id: 'a' }) })
    expect(OVERLAYS.defi).toBeTruthy()
    expect(canRestoreOverlay('defi')).toBe(false)
  })

  it('sans défi : état vide avec une action', async () => {
    mocks.service.getUserActiveChallenges.mockResolvedValue([])
    mocks.service.getUserChallengeHistory.mockResolvedValue([])
    const wrapper = mount(MobileChallengesScreen)
    await flushPromises()
    expect(wrapper.text()).toContain('Aucun défi en cours')
    await wrapper.find('.m-state .m-ghost-button').trigger('click')
    expect(mocks.service.getUserActiveChallenges).toHaveBeenCalledTimes(2)
  })

  it('erreur : message et « Réessayer » qui recharge', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.service.getUserActiveChallenges.mockRejectedValueOnce(new Error('boom'))
    const wrapper = mount(MobileChallengesScreen)
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('Les défis ne se chargent pas')
    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.m-defis__name')).toHaveLength(2)
  })

  it('hors ligne : le dit, puis se recharge seul au retour du réseau', async () => {
    online = false
    const wrapper = mount(MobileChallengesScreen, { attachTo: document.body })
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('Pas de connexion')
    expect(mocks.service.getUserActiveChallenges).not.toHaveBeenCalled()
    online = true
    window.dispatchEvent(new Event('online'))
    await flushPromises()
    expect(wrapper.findAll('.m-defis__name')).toHaveLength(2)
    wrapper.unmount()
  })

  it('la page d’ordinateur n’est téléchargée sur téléphone que si elle s’affiche', () => {
    const routes = fs.readFileSync(path.resolve(__dirname, '../../src/router/routes/profiles.js'), 'utf8')
    expect(routes).toMatch(/path: '\/challenges', component: loadWhenShown\(/)
    const shell = fs.readFileSync(path.resolve(__dirname, '../../src/mobile/shell/MobileAppShell.vue'), 'utf8')
    expect(shell).toMatch(/ChallengesPage: \{ component: MobileChallengesScreen/)
  })
})
