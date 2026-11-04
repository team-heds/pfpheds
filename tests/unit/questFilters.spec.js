import { DOMWrapper, flushPromises, mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import PrimeVue from 'primevue/config'
import Chip from 'primevue/chip'
import Dropdown from 'primevue/dropdown'
import Paginator from 'primevue/paginator'
import VirtualScrollerStyle from 'primevue/virtualscroller/style'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getUserQuests: vi.fn(),
  getQuestStats: vi.fn(),
  startQuest: vi.fn(),
  push: vi.fn(),
  toast: vi.fn(),
}))

vi.mock('@/service/userQuestsService', () => ({ default: mocks }))
vi.mock('@/components/common/utils/Navbar.vue', () => ({ default: { name: 'Navbar', template: '<nav />' } }))
vi.mock('@/stores/authStore', () => ({
  useAuthStore: () => ({ user: { id: 'student-quest-filters', user_metadata: { house: 'Harmonis' } } }),
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: mocks.toast }) }))

import QuestsPage from '@/components/gamification/QuestsPage.vue'

const QuestCard = defineComponent({
  name: 'QuestCard',
  props: ['quest'],
  emits: ['view-details', 'start-quest', 'click'],
  template: '<article data-testid="quest-result">{{ quest.title ?? "Sans titre" }}</article>',
})

const quest = (id, title, difficulty, type, progress, status = 'in_progress', description = '') => Object.freeze({
  id, title, difficulty, type, progress, description, userProgress: Object.freeze({ status }),
})

const smallDataset = () => Object.freeze([
  quest('z', 'Zulu lecture', 'EASY', 'story', 10),
  quest('a', 'Alpha pratique', 'HARD', 'exploration', 20),
  quest('b', 'Bravo terrain', 'HARD', 'story', 0, 'not_started'),
  quest('c', 'Charlie lecture', 'EASY', 'exploration', 0, 'not_started'),
  quest('d', 'Delta ancien', 'HARD', 'exploration', 100, 'completed'),
])

describe('filtres du journal de quêtes', () => {
  let wrapper

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    // VirtualScroller injects this CSS even in unstyled mode; keep its behavior
    // while avoiding jsdom's unsupported @layer parser.
    vi.spyOn(VirtualScrollerStyle, 'loadStyle').mockImplementation(() => ({}))
  })

  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    document.body.innerHTML = ''
    vi.restoreAllMocks()
  })

  async function openPage(dataset = smallDataset()) {
    mocks.getUserQuests.mockResolvedValue(dataset)
    mocks.getQuestStats.mockResolvedValue({
      totalQuests: dataset.length,
      completedQuests: dataset.filter(item => item.userProgress.status === 'completed').length,
      totalXPFromQuests: 0,
      averageProgress: 0,
    })
    wrapper = mount(QuestsPage, {
      attachTo: document.body,
      global: {
        // Keep real controls and overlays; jsdom does not parse PrimeVue CSS layers.
        plugins: [[PrimeVue, { unstyled: true }]],
        stubs: {
          Navbar: true,
          GamificationPageHeader: { template: '<h1>Journal de quêtes</h1>' },
          GamificationStatCard: true,
          QuestCard,
          InputText: false,
          Dropdown: false,
          Chip: false,
          Button: false,
          Paginator: false,
          Dialog: {
            props: ['visible'],
            template: '<section v-if="visible" role="dialog"><slot name="header" /><slot /><slot name="footer" /></section>',
          },
        },
      },
    })
    await flushPromises()
    return dataset
  }

  const titles = () => wrapper.findAll('[data-testid="quest-result"]').map(item => item.text())
  const chipLabels = () => wrapper.findAllComponents(Chip).map(item => item.props('label'))
  const button = label => wrapper.findAll('button').find(item => item.text().trim() === label)

  async function choose(id, label) {
    await wrapper.get(`#${id}`).trigger('click')
    await flushPromises()
    const option = [...document.querySelectorAll('[role="option"]')].find(item => item.getAttribute('aria-label') === label)
    expect(option, `Option ${label}`).toBeTruthy()
    await new DOMWrapper(option).trigger('click')
    await flushPromises()
  }

  async function removeChip(label) {
    const chip = wrapper.findAllComponents(Chip).find(item => item.props('label') === label)
    expect(chip, label).toBeTruthy()
    await chip.get('[data-pc-section="removeicon"]').trigger('click')
    await flushPromises()
  }

  async function nextPage() {
    await wrapper.findComponent(Paginator).get('button[aria-label="Next Page"]').trigger('click')
    await flushPromises()
  }

  it('retire chaque filtre réel sans perdre les autres critères ni afficher les valeurs internes', async () => {
    await openPage()
    expect(chipLabels()).toEqual([])
    await choose('quest-difficulty', 'Difficile')
    await choose('quest-type', 'Exploration')
    expect(titles()).toEqual(['Alpha pratique'])
    expect(chipLabels()).toEqual(['Difficulté : Difficile', 'Type : Exploration'])

    await removeChip('Difficulté : Difficile')
    expect(chipLabels()).toEqual(['Type : Exploration'])
    expect(titles()).toEqual(['Alpha pratique', 'Charlie lecture'])
    expect(wrapper.get('#quest-difficulty').text()).toBe('Toutes difficultés')

    await removeChip('Type : Exploration')
    expect(chipLabels()).toEqual([])
    expect(titles()).toHaveLength(4)
    expect(wrapper.get('#quest-type').text()).toBe('Tous les types')
    expect(wrapper.text()).not.toContain('Aucune quête trouvée')
    expect(mocks.startQuest).not.toHaveBeenCalled()
  })

  it('conserve la recherche quand les puces sont retirées et efface ensuite tous les critères', async () => {
    await openPage()
    await wrapper.get('#quest-search').setValue('lecture')
    expect(chipLabels()).toEqual([])
    await choose('quest-difficulty', 'Facile')
    await choose('quest-type', 'Exploration')
    expect(titles()).toEqual(['Charlie lecture'])
    await removeChip('Type : Exploration')
    expect(titles()).toEqual(['Zulu lecture', 'Charlie lecture'])
    await removeChip('Difficulté : Facile')
    expect(wrapper.get('#quest-search').element.value).toBe('lecture')
    expect(titles()).toEqual(['Zulu lecture', 'Charlie lecture'])
    expect(chipLabels()).toEqual([])
    await button('Tout effacer').trigger('click')
    await flushPromises()
    expect(wrapper.get('#quest-search').element.value).toBe('')
    expect(titles()).toHaveLength(4)
    expect(button('Tout effacer')).toBeUndefined()
  })

  it('revient aux résultats de l’onglet après avoir sélectionné Toutes difficultés dans la liste', async () => {
    await openPage()
    await choose('quest-difficulty', 'Difficile')
    expect(titles()).toHaveLength(2)
    await choose('quest-difficulty', 'Toutes difficultés')
    expect(chipLabels()).toEqual([])
    expect(titles()).toHaveLength(4)
  })

  it('traite une sélection effacée par le composant comme une absence de filtre', async () => {
    await openPage()
    await choose('quest-type', 'Exploration')
    wrapper.findAllComponents(Dropdown).find(item => item.props('inputId') === 'quest-type').vm.$emit('update:modelValue', null)
    await flushPromises()
    expect(chipLabels()).toEqual([])
    expect(titles()).toHaveLength(4)
    expect(wrapper.text()).not.toContain('Aucune quête trouvée')
  })

  it('réinitialise la pagination après sélection, retrait, recherche et changement de tri', async () => {
    const dataset = Object.freeze(Array.from({ length: 26 }, (_, index) => quest(
      `${index + 1}`, `Quête ${String(index + 1).padStart(2, '0')}`, 'EASY', index < 14 ? 'exploration' : 'story', 0,
    )))
    await openPage(dataset)
    await nextPage()
    expect(wrapper.text()).toContain('Page 2/3')
    await choose('quest-type', 'Exploration')
    expect(wrapper.text()).toContain('Page 1/2')
    expect(titles()[0]).toBe('Quête 01')
    await nextPage()
    expect(titles()).toEqual(['Quête 13', 'Quête 14'])
    await removeChip('Type : Exploration')
    expect(wrapper.text()).toContain('Page 1/3')
    await nextPage()
    await choose('quest-sort', 'Nom (Z-A)')
    expect(wrapper.text()).toContain('Page 1/3')
    expect(titles()[0]).toBe('Quête 26')
    await nextPage()
    await wrapper.get('#quest-search').setValue('Quête 2')
    expect(wrapper.text()).toContain('Page 1/1')
    expect(titles()).toHaveLength(7)
  })

  it('trie l’onglet Toutes sans modifier le tableau source ni ses règles d’inclusion', async () => {
    const dataset = await openPage()
    const initialIds = dataset.map(item => item.id)
    await wrapper.findAll('[role="tab"]').find(item => item.text().startsWith('Toutes')).trigger('click')
    await flushPromises()
    expect(titles()[0]).toBe('Delta ancien')
    await choose('quest-sort', 'Nom (A-Z)')
    expect(titles()).toEqual(['Alpha pratique', 'Bravo terrain', 'Charlie lecture', 'Delta ancien', 'Zulu lecture'])
    expect(dataset.map(item => item.id)).toEqual(initialIds)
    await wrapper.findAll('[role="tab"]').find(item => item.text().startsWith('Historique')).trigger('click')
    expect(titles()).toEqual(['Delta ancien'])
  })

  it('recherche et trie les quêtes dont le titre ou la description est absent', async () => {
    await openPage(Object.freeze([
      quest('no-title', null, 'EASY', 'story', 0, 'in_progress', 'Physiothérapie'),
      quest('no-description', 'Physiothérapie pratique', 'EASY', 'story', 0, 'in_progress', null),
      quest('empty', undefined, 'EASY', 'story', 0, 'in_progress', undefined),
    ]))
    await wrapper.get('#quest-search').setValue('physiothérapie')
    expect(titles()).toEqual(['Sans titre', 'Physiothérapie pratique'])
    await choose('quest-sort', 'Nom (A-Z)')
    expect(titles()).toHaveLength(2)
    expect(mocks.toast).not.toHaveBeenCalled()
  })

  it('ouvre le détail demandé par une carte avec son titre et sa difficulté lisible, sans démarrer la quête', async () => {
    const dataset = await openPage()
    const selectedQuest = dataset.find(item => item.id === 'z')
    const card = wrapper.findAllComponents(QuestCard).find(item => item.props('quest').id === selectedQuest.id)
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)

    card.vm.$emit('view-details', selectedQuest)
    await flushPromises()

    const dialog = wrapper.get('[role="dialog"]')
    expect(dialog.get('h2').text()).toBe('Zulu lecture')
    expect(dialog.text()).toContain('Facile')
    expect(dialog.text()).not.toContain('Inconnu')
    expect(mocks.startQuest).not.toHaveBeenCalled()
  })
})
