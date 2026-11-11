import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { service, toastAdd, confirmRequire, push } = vi.hoisted(() => ({
  service: {
    listMyQuizzes: vi.fn(),
    canAuthorQuizzes: vi.fn(),
    listManagedQuizzes: vi.fn(),
    getManagedQuiz: vi.fn(),
    getResultsSummary: vi.fn(),
    setQuizStatus: vi.fn(),
    duplicateQuiz: vi.fn(),
    deleteQuiz: vi.fn(),
    reorderQuestions: vi.fn(),
    getQuestionImageUrl: vi.fn(async () => null),
  },
  toastAdd: vi.fn(),
  confirmRequire: vi.fn(),
  push: vi.fn(),
}))

vi.mock('@/supabase.js', () => ({ supabase: {} }))
vi.mock('@/service/quizService', async () => {
  const actual = await vi.importActual('@/service/quizService')
  return { ...actual, quizService: service }
})
vi.mock('@/components/common/utils/Navbar.vue', () => ({ default: { name: 'Navbar', template: '<nav />' } }))
vi.mock('@/stores/authStore', () => ({ useAuthStore: () => ({ user: { id: 'teacher-1' } }) }))
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: toastAdd }) }))
vi.mock('primevue/useconfirm', () => ({ useConfirm: () => ({ require: confirmRequire }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push, back: vi.fn() }), useRoute: () => ({ query: {} }) }))

import QuizListView from '@/views/apps/quiz/QuizListView.vue'
import QuizManageView from '@/views/apps/quiz/QuizManageView.vue'
import QuizEditorView from '@/views/apps/quiz/QuizEditorView.vue'

const stubs = {
  GamificationPageHeader: { props: ['title'], template: '<header><h1>{{ title }}</h1><slot name="actions" /></header>' },
  SelectButton: {
    props: ['modelValue', 'options'],
    emits: ['update:modelValue'],
    template: '<div><button v-for="option in options" :key="option.value" :data-value="option.value" @click="$emit(\'update:modelValue\', option.value)">{{ option.label }}</button></div>',
  },
  MultiSelect: true,
  Tag: { props: ['value'], template: '<span>{{ value }}</span>' },
}
const button = (wrapper, label) => wrapper.find(`button[label="${label}"]`)
const buttons = (wrapper, label) => wrapper.findAll(`button[label="${label}"]`)

const managed = (overrides = {}) => ({
  id: 'quiz-1', author_id: 'teacher-1', title: 'Anatomie de l’épaule', description: '', theme: 'Épaule',
  target_classes: ['BA24'], opens_at: null, closes_at: null, status: 'draft', question_count: 2, ...overrides,
})
const question = (id, prompt) => ({
  id, quiz_id: 'quiz-1', position: 0, kind: 'single', prompt, explanation: 'Parce que.', image_path: null,
  options: [{ id: 'a', label: 'A', correct: true }, { id: 'b', label: 'B', correct: false }],
})
const summary = {
  stats: { participants: 12, average_score: 1.5, average_percent: 75, perfect_count: 4, in_progress: 1 },
  questions: [{ question_id: 'q2', position: 1, prompt: 'Question deux', answers: 12, wrong: 6, wrong_percent: 50 }],
}

describe('page « Quiz » des étudiants', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    service.canAuthorQuizzes.mockResolvedValue(false)
    service.listMyQuizzes.mockResolvedValue([
      { id: 'q-todo', title: 'Genou', theme: 'Genou', description: '', question_count: 5, is_open: true, in_progress: false, first_score: null },
      { id: 'q-done', title: 'Épaule', theme: 'Épaule', description: '', question_count: 10, is_open: true, in_progress: false, first_score: 8, first_total: 10, first_duration_ms: 95_000, first_xp_awarded: 20 },
    ])
  })

  it('liste les quiz avec leur état et leur score, et filtre par état', async () => {
    const wrapper = mount(QuizListView, { global: { stubs } })
    await flushPromises()

    expect(wrapper.findAll('li')).toHaveLength(2)
    expect(wrapper.text()).toContain('À faire')
    expect(wrapper.text()).toContain('Terminé · 8/10')
    expect(wrapper.text()).toContain('8 / 10')
    expect(wrapper.text()).toContain('+20 XP')
    expect(button(wrapper, 'Commencer').exists()).toBe(true)
    expect(button(wrapper, 'Refaire pour s’entraîner').exists()).toBe(true)
    // Un étudiant ne voit pas l'accès à la gestion.
    expect(button(wrapper, 'Gérer les quiz').exists()).toBe(false)

    await wrapper.find('button[data-value="done"]').trigger('click')
    expect(wrapper.findAll('li')).toHaveLength(1)
    expect(wrapper.find('li').text()).toContain('Épaule')

    await wrapper.find('button[data-value="todo"]').trigger('click')
    expect(wrapper.find('li').text()).toContain('Genou')

    await button(wrapper, 'Commencer').trigger('click')
    expect(push).toHaveBeenCalledWith('/quiz/q-todo')
  })

  it('propose la gestion aux enseignants et admins', async () => {
    service.canAuthorQuizzes.mockResolvedValue(true)
    const wrapper = mount(QuizListView, { global: { stubs } })
    await flushPromises()
    expect(button(wrapper, 'Gérer les quiz').exists()).toBe(true)
  })
})

describe('gestion des quiz', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    service.canAuthorQuizzes.mockResolvedValue(true)
    service.listManagedQuizzes.mockResolvedValue([managed()])
  })

  it('refuse l’accès à qui ne peut pas créer de quiz', async () => {
    service.canAuthorQuizzes.mockResolvedValue(false)
    const wrapper = mount(QuizManageView, { global: { stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('Accès réservé')
    expect(service.listManagedQuizzes).not.toHaveBeenCalled()
  })

  it('publie, duplique et demande confirmation avant de supprimer', async () => {
    service.setQuizStatus.mockResolvedValue(managed({ status: 'published' }))
    service.duplicateQuiz.mockResolvedValue('quiz-2')
    service.deleteQuiz.mockResolvedValue(true)
    const wrapper = mount(QuizManageView, { global: { stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('Brouillon')
    expect(wrapper.text()).toContain('BA24')

    await button(wrapper, 'Publier').trigger('click')
    await flushPromises()
    expect(service.setQuizStatus).toHaveBeenCalledWith('quiz-1', 'published')
    expect(wrapper.text()).toContain('Publié')
    expect(button(wrapper, 'Dépublier').exists()).toBe(true)

    await button(wrapper, 'Dupliquer').trigger('click')
    await flushPromises()
    expect(service.duplicateQuiz).toHaveBeenCalledWith('quiz-1')

    await button(wrapper, 'Supprimer').trigger('click')
    expect(service.deleteQuiz).not.toHaveBeenCalled()
    expect(confirmRequire).toHaveBeenCalledTimes(1)
    await confirmRequire.mock.calls[0][0].accept()
    await flushPromises()
    expect(service.deleteQuiz).toHaveBeenCalledWith('quiz-1')
    expect(wrapper.text()).toContain('Aucun quiz pour le moment')
  })
})

describe('éditeur de quiz', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    service.getResultsSummary.mockResolvedValue(summary)
    service.reorderQuestions.mockResolvedValue(true)
  })

  it('réordonne les questions et affiche les résultats', async () => {
    service.getManagedQuiz.mockResolvedValue({ ...managed(), questions: [question('q1', 'Question un'), question('q2', 'Question deux')] })
    const wrapper = mount(QuizEditorView, { props: { id: 'quiz-1' }, global: { stubs } })
    await flushPromises()

    expect(wrapper.findAll('ol li').map(item => item.text())).toEqual([
      expect.stringContaining('1. Question un'),
      expect.stringContaining('2. Question deux'),
    ])

    await wrapper.find('button[aria-label="Descendre la question 1"]').trigger('click')
    await flushPromises()
    expect(service.reorderQuestions).toHaveBeenCalledWith(['q2', 'q1'])
    expect(wrapper.findAll('ol li')[0].text()).toContain('1. Question deux')

    expect(wrapper.text()).toContain('Participants')
    expect(wrapper.text()).toContain('12')
    expect(wrapper.text()).toContain('Questions les plus ratées')
    expect(wrapper.text()).toContain('50 %')
  })

  it('remet l’ordre précédent si l’enregistrement échoue', async () => {
    service.reorderQuestions.mockRejectedValue(new Error('row-level security'))
    service.getManagedQuiz.mockResolvedValue({ ...managed(), questions: [question('q1', 'Question un'), question('q2', 'Question deux')] })
    const wrapper = mount(QuizEditorView, { props: { id: 'quiz-1' }, global: { stubs } })
    await flushPromises()
    await wrapper.find('button[aria-label="Descendre la question 1"]').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('ol li')[0].text()).toContain('1. Question un')
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }))
  })

  it('fige les questions d’un quiz publié', async () => {
    service.getManagedQuiz.mockResolvedValue({ ...managed({ status: 'published' }), questions: [question('q1', 'Question un')] })
    const wrapper = mount(QuizEditorView, { props: { id: 'quiz-1' }, global: { stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('ses questions sont figées')
    expect(button(wrapper, 'Ajouter une question').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button[aria-label="Modifier la question 1"]').attributes('disabled')).toBeDefined()
    expect(wrapper.find('button[aria-label="Supprimer la question 1"]').attributes('disabled')).toBeDefined()
    expect(button(wrapper, 'Repasser en brouillon').exists()).toBe(true)
  })

  it('empêche de publier un quiz sans question', async () => {
    service.getManagedQuiz.mockResolvedValue({ ...managed(), questions: [] })
    const wrapper = mount(QuizEditorView, { props: { id: 'quiz-1' }, global: { stubs } })
    await flushPromises()
    expect(buttons(wrapper, 'Publier')[0].attributes('disabled')).toBeDefined()
    expect(wrapper.text()).toContain('Ajoutez-en au moins une')
  })

  it('signale un quiz introuvable ou d’un autre enseignant', async () => {
    service.getManagedQuiz.mockResolvedValue(null)
    const wrapper = mount(QuizEditorView, { props: { id: 'quiz-x' }, global: { stubs } })
    await flushPromises()
    expect(wrapper.text()).toContain('vous n’avez pas le droit de le modifier')
  })
})
