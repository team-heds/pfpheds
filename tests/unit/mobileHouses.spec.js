import fs from 'node:fs'
import path from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { reactive } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  service: {
    getHousesRanking: vi.fn(),
    getHouseDetailedStats: vi.fn(),
    getUserGamificationData: vi.fn().mockResolvedValue({ house_name: 'Solencia' }),
    getHouseInfo: vi.fn((key) => ({ name: key.charAt(0).toUpperCase() + key.slice(1), motto: 'Devise', description: 'Description', color: '#4169E1' })),
  },
  push: vi.fn(),
  auth: null,
  route: { params: { houseName: 'solencia' } },
}))

vi.mock('@/supabase', () => ({ supabase: {} }))
vi.mock('@/supabase.js', () => ({ supabase: {} }))
vi.mock('@/service/gamificationServiceSupabase', () => ({ default: mocks.service }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }), useRoute: () => mocks.route }))

import MobileHousesRankingScreen from '@/mobile/houses/MobileHousesRankingScreen.vue'
import MobileHouseScreen from '@/mobile/houses/MobileHouseScreen.vue'
import { formatNumber, gapToNext, houseKey, houseProgress, houseVisual, updatedLabel, userHouseKey } from '@/mobile/houses/houseHelpers'

const house = (name, position, totalXP, extra = {}) => ({
  name,
  displayName: name.charAt(0).toUpperCase() + name.slice(1),
  color: '#4169E1',
  level: 2,
  levelName: 'Maison Émergente',
  totalXP,
  totalMembers: 20,
  xpToNext: 500,
  progressPercent: 40,
  position,
  ...extra,
})

const RANKING = {
  ranking: [house('harmonis', 1, 4000), house('solencia', 2, 3200), house('elaris', 3, 2000), house('doloris', 4, 900)],
  totalUsers: 80,
  lastUpdated: new Date().toISOString(),
}

describe('maisons : calculs', () => {
  it('reconnaît la maison d’un compte, quelle que soit l’écriture', () => {
    expect(houseKey('Solencia')).toBe('solencia')
    expect(houseKey('sol')).toBe('solencia')
    expect(houseKey('inconnue')).toBe(null)
    expect(userHouseKey({ user_metadata: { maison: 'Harmonis' } })).toBe('harmonis')
    expect(userHouseKey(null)).toBe(null)
    expect(houseVisual('elaris').crest).toBeTruthy()
    expect(houseVisual('gamemaster')).toBe(null)
  })

  it('va chercher la maison dans les données de progression si le compte ne la porte pas', async () => {
    const { fetchUserHouseKey } = await import('@/mobile/houses/houseHelpers')
    const service = { getUserGamificationData: vi.fn().mockResolvedValue({ house_name: 'Elaris' }) }
    expect(await fetchUserHouseKey(service, { id: 'u1' })).toBe('elaris')
    expect(await fetchUserHouseKey(service, { id: 'u1', user_metadata: { maison: 'Doloris' } })).toBe('doloris')
    expect(await fetchUserHouseKey({ getUserGamificationData: vi.fn().mockRejectedValue(new Error('x')) }, { id: 'u1' })).toBe(null)
    expect(await fetchUserHouseKey(service, null)).toBe(null)
  })

  it('progression, écart avec la maison devant et date relative', () => {
    expect(houseProgress(house('a', 1, 0, { progressPercent: 42.6 }))).toBe(43)
    expect(houseProgress(house('a', 1, 0, { xpToNext: 0 }))).toBe(100)
    expect(gapToNext(RANKING.ranking, 'solencia')).toBe(800)
    expect(gapToNext(RANKING.ranking, 'harmonis')).toBe(null)
    expect(formatNumber(12340).replace(/\s/g, ' ')).toMatch(/12.340/)
    const now = new Date('2026-11-16T12:00:00Z')
    expect(updatedLabel('2026-11-16T11:59:40Z', now)).toBe('à l’instant')
    expect(updatedLabel('2026-11-16T11:55:00Z', now)).toBe('il y a 5 min')
    expect(updatedLabel('2026-11-14T12:00:00Z', now)).toBe('il y a 2 jours')
  })
})

describe('écran Classement des maisons', () => {
  let online = true
  beforeEach(() => {
    // La maison n'est pas dans le compte : elle vient des données de progression.
    mocks.auth = reactive({ user: { id: 'u1', user_metadata: {} } })
    mocks.service.getHousesRanking.mockResolvedValue(RANKING)
    online = true
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => online)
  })
  afterEach(() => {
    vi.restoreAllMocks()
    mocks.push.mockReset()
  })

  it('squelettes, puis ta maison en tête et le classement complet', async () => {
    const wrapper = mount(MobileHousesRankingScreen)
    expect(wrapper.findAll('.m-skeleton').length).toBeGreaterThan(0)
    await flushPromises()
    const mine = wrapper.find('.m-houses__mine')
    expect(mine.text()).toContain('Ta maison · 2e place')
    expect(mine.text()).toContain('Solencia')
    expect(mine.text()).toMatch(/800 XP derrière la maison devant/)
    expect(wrapper.findAll('.m-houses__row')).toHaveLength(4)
    expect(wrapper.find('.m-houses__row.is-mine').attributes('aria-label')).toMatch(/ta maison/)
    expect(wrapper.find('.m-houses__foot').text()).toMatch(/80 étudiants · mis à jour à l’instant/)
  })

  it('toucher une maison ouvre sa fiche', async () => {
    const wrapper = mount(MobileHousesRankingScreen)
    await flushPromises()
    await wrapper.findAll('.m-houses__row')[2].trigger('click')
    expect(mocks.push).toHaveBeenCalledWith('/houses/elaris/stats')
  })

  it('erreur : message et « Réessayer »', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.service.getHousesRanking.mockRejectedValueOnce(new Error('boom'))
    const wrapper = mount(MobileHousesRankingScreen)
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('Le classement ne se charge pas')
    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.m-houses__row')).toHaveLength(4)
  })

  it('hors ligne, puis rechargement seul au retour du réseau', async () => {
    online = false
    const wrapper = mount(MobileHousesRankingScreen, { attachTo: document.body })
    await flushPromises()
    expect(wrapper.text()).toContain('Pas de connexion')
    online = true
    window.dispatchEvent(new Event('online'))
    await flushPromises()
    expect(wrapper.findAll('.m-houses__row')).toHaveLength(4)
    wrapper.unmount()
  })
})

describe('écran fiche d’une maison', () => {
  beforeEach(() => {
    mocks.auth = reactive({ user: { id: 'u1', user_metadata: { maison: 'Solencia' } } })
    mocks.route = { params: { houseName: 'solencia' } }
    vi.spyOn(navigator, 'onLine', 'get').mockImplementation(() => true)
  })
  afterEach(() => vi.restoreAllMocks())

  it('niveau, chiffres et membres, avec la personne connectée repérée', async () => {
    mocks.service.getHouseDetailedStats.mockResolvedValue({
      totalXP: 3200,
      totalMembers: 2,
      averageXP: 1600,
      averageLevel: 2.5,
      membersHidden: false,
      houseLevel: { niveau: 2, name: 'Maison Émergente', xpRequired: 2375, xpToNext: 2738 },
      members: [
        { userId: 'u2', displayName: 'alice', niveau: 3, totalXP: 2000 },
        { userId: 'u1', displayName: 'moi', niveau: 2, totalXP: 1200 },
      ],
    })
    const wrapper = mount(MobileHouseScreen)
    expect(wrapper.find('h1').text()).toBe('Solencia')
    await flushPromises()
    expect(wrapper.text()).toContain('Ta maison')
    expect(mocks.service.getHouseDetailedStats).toHaveBeenCalledWith('solencia')
    expect(wrapper.find('.m-house__level').text()).toBe('Maison Émergente')
    expect(wrapper.find('[role="progressbar"]').attributes('aria-valuenow')).toBe('23') // (3200 − 2375) / 3563
    expect(wrapper.find('.m-house__members .is-me').text()).toContain('moi (toi)')
    expect(wrapper.find('.m-house__facts').text()).toContain('Niveau moyen')
  })

  it('pour un étudiant, sans détail des membres : seulement les totaux', async () => {
    mocks.service.getHouseDetailedStats.mockResolvedValue({
      totalXP: 3200, totalMembers: 20, averageXP: 160, averageLevel: null, membersHidden: true, members: [],
      houseLevel: { niveau: 2, name: 'Maison Émergente', xpRequired: 2375, xpToNext: 2738 },
    })
    const wrapper = mount(MobileHouseScreen)
    await flushPromises()
    expect(wrapper.find('.m-house__members').exists()).toBe(false)
    expect(wrapper.find('.m-house__facts').text()).not.toContain('Niveau moyen')
    expect(wrapper.find('.m-house__facts').text()).toContain('20')
  })

  it('erreur : message et « Réessayer »', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.service.getHouseDetailedStats.mockRejectedValueOnce(new Error('boom')).mockResolvedValue({ totalXP: 1, totalMembers: 1, averageXP: 1, members: [], houseLevel: { niveau: 1, name: 'Maison Naissante', xpRequired: 0, xpToNext: 2374 } })
    const wrapper = mount(MobileHouseScreen)
    await flushPromises()
    expect(wrapper.find('[role="alert"]').text()).toContain('ne se chargent pas')
    await wrapper.find('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(wrapper.find('.m-house__level').text()).toBe('Maison Naissante')
  })

  it('les pages d’ordinateur ne sont téléchargées sur téléphone que si elles s’affichent', () => {
    const routes = fs.readFileSync(path.resolve(__dirname, '../../src/router/routes/profiles.js'), 'utf8')
    expect(routes).toMatch(/path: '\/houses\/:houseName\/stats', component: loadWhenShown\(/)
    expect(routes).toMatch(/path: '\/houses\/ranking', component: loadWhenShown\(/)
    const shell = fs.readFileSync(path.resolve(__dirname, '../../src/mobile/shell/MobileAppShell.vue'), 'utf8')
    expect(shell).toMatch(/HousesRankingPage: \{ component: MobileHousesRankingScreen/)
    expect(shell).toMatch(/HouseStatsPage: \{ component: MobileHouseScreen/)
  })
})
