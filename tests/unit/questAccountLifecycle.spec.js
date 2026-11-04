import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'

const mocks = vi.hoisted(() => ({
  auth: null, getUserQuests: vi.fn(), getQuestStats: vi.fn(), startQuest: vi.fn(),
  push: vi.fn(), toast: vi.fn(),
}))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => mocks.auth }))
vi.mock('@/service/userQuestsService', () => ({ default: mocks }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: mocks.toast }) }))
vi.mock('@/components/common/utils/Navbar.vue', () => ({ default: { template: '<nav />' } }))
import QuestsPage from '@/components/gamification/QuestsPage.vue'

const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
const quest = account => ({
  id: `quest-${account}`, title: `Objectif du compte ${account}`, description: `Description ${account}`,
  type: 'story', difficulty: 'EASY', progress: 20, userProgress: { status: 'in_progress' },
})
const stats = { totalQuests: 1, completedQuests: 0, totalXPFromQuests: 0, averageProgress: 20 }
const batch = account => ({
  quests: deferred(), stats: deferred(),
  resolve() { this.quests.resolve([quest(account)]); this.stats.resolve(stats) },
  reject() { this.quests.reject(new Error(`Erreur privée ${account}`)); this.stats.resolve(stats) },
})
const Button = { props: ['label', 'disabled'], template: '<button :disabled="disabled">{{ label }}<slot /></button>' }
const QuestCard = {
  props: ['quest'], emits: ['view-details', 'start-quest'],
  template: '<article data-testid="quest-result">{{ quest.title }}<button data-testid="details" @click="$emit(\'view-details\', quest)">Voir</button><button data-testid="start" @click="$emit(\'start-quest\', quest.id)">Démarrer</button></article>',
}

describe('journal de quêtes isolé par compte', () => {
  let wrapper
  let requests
  const queue = account => { const pending = batch(account); requests.set(account, pending); return pending }
  const open = () => {
    wrapper = mount(QuestsPage, {
      global: { stubs: {
        GamificationPageHeader: { props: ['title'], template: '<header><h1>{{ title }}</h1><slot name="actions" /></header>' },
        GamificationStatCard: { props: ['value', 'label'], template: '<p>{{ label }} : {{ value }}</p>' },
        QuestCard, Button, Skeleton: true, Divider: true, Paginator: true, Chip: true,
        InputText: { props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
        Dropdown: { props: ['modelValue', 'options', 'inputId'], emits: ['update:modelValue'], template: '<select :id="inputId" :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="option in options" :key="option.value" :value="option.value">{{ option.label }}</option></select>' },
        Dialog: { props: ['visible'], template: '<section v-if="visible" role="dialog"><slot name="header" /><slot /></section>' },
      } },
    })
  }
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'log').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.auth = reactive({ user: { id: 'A' } })
    requests = new Map()
    mocks.getUserQuests.mockImplementation(id => requests.get(id).quests.promise)
    mocks.getQuestStats.mockImplementation(id => requests.get(id).stats.promise)
  })
  afterEach(() => { wrapper?.unmount(); wrapper = null; vi.restoreAllMocks() })

  it.each(['resolve', 'reject'])('ignore la réponse tardive de A (%s) après le chargement de B', async terminal => {
    const a = queue('A'); open()
    const b = queue('B'); mocks.auth.user = { id: 'B' }
    b.resolve(); await flushPromises()
    expect(wrapper.text()).toContain('Objectif du compte B')
    a[terminal](); await flushPromises()
    expect(wrapper.text()).toContain('Objectif du compte B')
    expect(wrapper.text()).not.toContain('Objectif du compte A')
    expect(wrapper.find('[role="alert"]').exists()).toBe(false)
    expect(mocks.toast).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
    expect(mocks.getUserQuests.mock.calls.map(([id]) => id)).toEqual(['A', 'B'])
  })

  it('ferme le détail et réinitialise les filtres personnels avant d’afficher le compte suivant', async () => {
    const a = queue('A'); open(); a.resolve(); await flushPromises()
    await wrapper.get('#quest-search').setValue('Objectif')
    await wrapper.get('#quest-difficulty').setValue('EASY')
    await wrapper.get('#quest-type').setValue('story')
    await wrapper.get('[data-testid="details"]').trigger('click')
    expect(wrapper.get('[role="dialog"]').text()).toContain('Objectif du compte A')
    const b = queue('B'); mocks.auth.user = { id: 'B' }; await nextTick()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Objectif du compte A')
    expect(wrapper.get('[aria-label="Chargement des quêtes"]').exists()).toBe(true)
    b.resolve(); await flushPromises()
    expect(wrapper.text()).toContain('Objectif du compte B')
    expect(wrapper.get('#quest-search').element.value).toBe('')
    expect(wrapper.get('#quest-difficulty').element.value).toBe('all')
    expect(wrapper.get('#quest-type').element.value).toBe('all')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('conserve le chargement de B lorsque la requête de A se termine avant elle', async () => {
    const a = queue('A'); open()
    const b = queue('B'); mocks.auth.user = { id: 'B' }
    a.resolve(); await flushPromises()
    expect(wrapper.get('[aria-label="Chargement des quêtes"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="quest-result"]')).toHaveLength(0)
    b.resolve(); await flushPromises()
    expect(wrapper.text()).toContain('Objectif du compte B')
  })

  it.each(['resolve', 'reject'])('vide la page à la déconnexion et ignore une lecture A terminée (%s)', async terminal => {
    const a = queue('A'); open()
    mocks.auth.user = null; await nextTick()
    expect(wrapper.text()).toContain('Connectez-vous pour retrouver vos quêtes.')
    expect(mocks.push).toHaveBeenCalledWith('/home')
    a[terminal](); await flushPromises()
    expect(wrapper.text()).not.toContain('Objectif du compte A')
    expect(wrapper.findAll('[data-testid="quest-result"]')).toHaveLength(0)
    expect(mocks.getUserQuests).toHaveBeenCalledTimes(1)
    expect(mocks.toast).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('ne relance pas une lecture pour une simple mise à jour du même profil', async () => {
    const a = queue('A'); open(); a.resolve(); await flushPromises()
    mocks.auth.user = { id: 'A', display_name: 'Nouveau nom' }; await nextTick()
    expect(mocks.getUserQuests).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('Objectif du compte A')
  })

  it('ne publie aucun résultat partiel lorsque seules les quêtes sont arrivées', async () => {
    const a = queue('A'); open()
    a.quests.resolve([quest('A')]); await flushPromises()
    expect(wrapper.get('[aria-label="Chargement des quêtes"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-testid="quest-result"]')).toHaveLength(0)
    a.stats.resolve(stats); await flushPromises()
    expect(wrapper.text()).toContain('Objectif du compte A')
  })

  it.each(['resolve', 'reject'])('ignore la fin du démarrage d’une quête A (%s) après le passage à B', async terminal => {
    const a = queue('A'); open(); a.resolve(); await flushPromises()
    const start = deferred(); mocks.startQuest.mockReturnValue(start.promise)
    await wrapper.get('[data-testid="start"]').trigger('click')
    expect(mocks.startQuest).toHaveBeenCalledWith('A', 'quest-A')
    const b = queue('B'); mocks.auth.user = { id: 'B' }; b.resolve(); await flushPromises()
    start[terminal](terminal === 'reject' ? new Error('Erreur de démarrage A') : undefined)
    await flushPromises()
    expect(mocks.getUserQuests.mock.calls.map(([id]) => id)).toEqual(['A', 'B'])
    expect(wrapper.text()).toContain('Objectif du compte B')
    expect(mocks.toast).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('continue de recharger et confirmer un démarrage pour le compte courant', async () => {
    const a = queue('A'); open(); a.resolve(); await flushPromises()
    const refreshed = queue('A')
    mocks.startQuest.mockResolvedValueOnce(undefined)
    await wrapper.get('[data-testid="start"]').trigger('click')
    await flushPromises()
    expect(mocks.startQuest).toHaveBeenCalledWith('A', 'quest-A')
    expect(mocks.getUserQuests.mock.calls.map(([id]) => id)).toEqual(['A', 'A'])
    expect(mocks.toast).not.toHaveBeenCalled()
    refreshed.resolve(); await flushPromises()
    expect(wrapper.text()).toContain('Objectif du compte A')
    expect(mocks.toast).toHaveBeenCalledWith(expect.objectContaining({ severity: 'success' }))
  })

  it('ignore un événement de l’ancienne carte avant sa suppression du DOM', async () => {
    const a = queue('A'); open(); a.resolve(); await flushPromises()
    const previousCard = wrapper.findComponent(QuestCard)
    const b = queue('B'); mocks.auth.user = { id: 'B' }
    // The auth watcher runs synchronously; Vue removes the old DOM next tick.
    previousCard.vm.$emit('start-quest', 'quest-A')
    previousCard.vm.$emit('view-details', quest('A'))
    await nextTick()
    expect(mocks.startQuest).not.toHaveBeenCalled()
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
    b.resolve(); await flushPromises()
    expect(wrapper.text()).toContain('Objectif du compte B')
    expect(wrapper.find('[role="dialog"]').exists()).toBe(false)
  })

  it('ignore une lecture échouée après le démontage et ne recharge pas un nouveau compte', async () => {
    const a = queue('A'); open(); wrapper.unmount()
    mocks.auth.user = { id: 'B' }; a.reject(); await flushPromises()
    expect(mocks.getUserQuests).toHaveBeenCalledTimes(1)
    expect(mocks.toast).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('ignore la fin d’un démarrage après le démontage', async () => {
    const a = queue('A'); open(); a.resolve(); await flushPromises()
    const start = deferred(); mocks.startQuest.mockReturnValue(start.promise)
    await wrapper.get('[data-testid="start"]').trigger('click')
    wrapper.unmount(); start.reject(new Error('Fin après démontage')); await flushPromises()
    expect(mocks.getUserQuests).toHaveBeenCalledTimes(1)
    expect(mocks.toast).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  })
})
