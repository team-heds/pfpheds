import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  features: { userJourney: true, ventriglisse: true, dailyWheel: false, romRunner: false },
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/config/gamificationFeatures', () => ({ gamificationFeatures: mocks.features }))
vi.mock('@/components/common/utils/Navbar.vue', () => ({ default: { template: '<nav />' } }))
vi.mock('@/components/gamification/daily/DailyWheelWidget.vue', () => ({ default: { template: '<section data-testid="daily-wheel">Roue quotidienne</section>' } }))

import GameView from '@/views/apps/tools/GameView.vue'

describe('parcours de l’espace jeux', () => {
  let wrapper
  beforeEach(() => {
    vi.clearAllMocks()
    Object.assign(mocks.features, { userJourney: true, ventriglisse: true, dailyWheel: false, romRunner: false })
  })
  afterEach(() => { wrapper?.unmount(); wrapper = null })
  const render = () => { wrapper = mount(GameView, { global: { plugins: [[PrimeVue, { unstyled: true }]], stubs: { Button: false } } }); return wrapper }
  const button = label => wrapper.findAll('button').find(node => node.text().trim() === label)

  it('présente un vrai titre et rejoint la progression depuis le retour commun', async () => {
    render()
    expect(wrapper.findAll('h1')).toHaveLength(1)
    expect(wrapper.get('h1').text()).toBe('Espace jeux')
    expect(wrapper.get('#ventriglisse-title').element.tagName).toBe('H2')
    await button('Retour').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith({ name: 'GamificationProfileSelf' })
  })

  it('conserve le Ventriglisse activé, ses règles de session et son accès existant sans promettre de XP', async () => {
    render()
    expect(wrapper.text()).toContain('2–6 joueurs')
    expect(wrapper.text()).toContain('Course locale')
    expect(wrapper.text()).toContain('Aucun XP')
    expect(wrapper.find('[data-testid="daily-wheel"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('ROM RUNNER')
    await button('Jouer').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith('/ventriglisse3d')
  })

  it('explique l’absence de jeux et propose un retour utile sans afficher de fausse carte jouable', async () => {
    Object.assign(mocks.features, { ventriglisse: false })
    render()
    expect(wrapper.get('.games-empty').text()).toContain('Aucun jeu disponible pour le moment')
    expect(wrapper.find('.ventriglisse-card').exists()).toBe(false)
    expect(button('Jouer')).toBeUndefined()
    await button('Voir ma progression').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith({ name: 'GamificationProfileSelf' })
  })

  it('revient aux outils lorsque le parcours de progression n’est pas activé', async () => {
    Object.assign(mocks.features, { userJourney: false, ventriglisse: false })
    render()
    expect(button('Voir ma progression')).toBeUndefined()
    await button('Revenir aux outils').trigger('click')
    await button('Retour').trigger('click')
    expect(mocks.push.mock.calls).toEqual([['/outils'], ['/outils']])
  })

  it('respecte aussi les activations indépendantes de la roue et de ROM Runner', async () => {
    Object.assign(mocks.features, { ventriglisse: false, dailyWheel: true, romRunner: true })
    render()
    expect(wrapper.find('.games-empty').exists()).toBe(false)
    expect(wrapper.find('.ventriglisse-card').exists()).toBe(false)
    expect(wrapper.find('[data-testid="daily-wheel"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('ROM RUNNER')
    await button('JOUER').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith('/rom-runner')
  })
})
