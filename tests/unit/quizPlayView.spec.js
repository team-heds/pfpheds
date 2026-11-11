import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

const { service, toastAdd, push } = vi.hoisted(() => ({
  service: {
    listMyQuizzes: vi.fn(),
    startAttempt: vi.fn(),
    answerQuestion: vi.fn(),
    finishAttempt: vi.fn(),
    getLeaderboard: vi.fn(),
    getQuestionImageUrl: vi.fn(async () => null),
  },
  toastAdd: vi.fn(),
  push: vi.fn(),
}))

vi.mock('@/service/quizService', async () => {
  const actual = await vi.importActual('@/service/quizService')
  return { ...actual, quizService: service }
})
vi.mock('@/supabase.js', () => ({ supabase: {} }))
vi.mock('@/components/common/utils/Navbar.vue', () => ({ default: { name: 'Navbar', template: '<nav />' } }))
vi.mock('primevue/usetoast', () => ({ useToast: () => ({ add: toastAdd }) }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push }), useRoute: () => ({ query: {} }) }))

import QuizPlayView from '@/views/apps/quiz/QuizPlayView.vue'

const quiz = {
  id: 'quiz-1', title: 'Anatomie de l’épaule', description: 'Dix questions', theme: 'Épaule',
  is_open: true, question_count: 2, in_progress: false, first_score: null,
}
const questions = [
  { id: 'q1', position: 0, kind: 'single', prompt: 'Quel nerf innerve le deltoïde ?', image_path: null,
    options: [{ id: 'a', label: 'Nerf axillaire' }, { id: 'b', label: 'Nerf radial' }] },
  { id: 'q2', position: 1, kind: 'multiple', prompt: 'Quels muscles sont rotateurs latéraux ?', image_path: null,
    options: [{ id: 'a', label: 'Infra-épineux' }, { id: 'b', label: 'Petit rond' }, { id: 'c', label: 'Subscapulaire' }] },
]

const mountView = () => mount(QuizPlayView, {
  props: { id: 'quiz-1' },
  global: {
    stubs: {
      Navbar: true,
      GamificationPageHeader: { props: ['title'], template: '<h1>{{ title }}</h1>' },
      ProgressBar: true,
    },
  },
})
const button = (wrapper, label) => wrapper.find(`button[label="${label}"]`)

describe('passage d’un quiz', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    service.listMyQuizzes.mockResolvedValue([quiz])
    service.getLeaderboard.mockResolvedValue([])
    service.startAttempt.mockResolvedValue({ attempt_id: 'attempt-1', attempt_number: 1, is_first: true, questions, answers: [] })
  })

  it('pose les questions une à une, corrige après validation, puis affiche le résultat du serveur', async () => {
    service.answerQuestion
      .mockResolvedValueOnce({ question_id: 'q1', selected: ['a'], is_correct: true, correct_option_ids: ['a'], explanation: 'Nerf axillaire, C5-C6.' })
      .mockResolvedValueOnce({ question_id: 'q2', selected: ['a', 'c'], is_correct: false, correct_option_ids: ['a', 'b'], explanation: 'Infra-épineux et petit rond.' })
    service.finishAttempt.mockResolvedValue({
      score: 1, total: 2, perfect: false, duration_ms: 65_000, is_first: true, counts_for_ranking: true, xp_awarded: 20, rank: 3, participants: 12,
    })

    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.text()).toContain('Seule cette première tentative compte')

    await button(wrapper, 'Commencer le quiz').trigger('click')
    await flushPromises()
    expect(service.startAttempt).toHaveBeenCalledWith('quiz-1')
    expect(wrapper.text()).toContain('Question 1 sur 2')
    expect(wrapper.text()).toContain('Quel nerf innerve le deltoïde ?')
    // Une seule question à l'écran, sans correction ni explication avant la réponse.
    expect(wrapper.text()).not.toContain('Quels muscles sont rotateurs latéraux ?')
    expect(wrapper.text()).not.toContain('Nerf axillaire, C5-C6.')
    expect(button(wrapper, 'Valider ma réponse').attributes('disabled')).toBeDefined()

    await wrapper.find('input[type="radio"][value="a"]').setValue()
    await button(wrapper, 'Valider ma réponse').trigger('click')
    await flushPromises()
    expect(service.answerQuestion).toHaveBeenCalledWith('attempt-1', 'q1', ['a'])
    expect(wrapper.text()).toContain('Bonne réponse')
    expect(wrapper.text()).toContain('Nerf axillaire, C5-C6.')
    // La réponse est définitive : les choix sont verrouillés.
    expect(wrapper.find('fieldset').attributes('disabled')).toBeDefined()

    await button(wrapper, 'Question suivante').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Question 2 sur 2')
    expect(wrapper.text()).toContain('Plusieurs réponses possibles')

    await wrapper.find('input[type="checkbox"][value="a"]').setValue(true)
    await wrapper.find('input[type="checkbox"][value="c"]').setValue(true)
    await button(wrapper, 'Valider ma réponse').trigger('click')
    await flushPromises()
    expect(service.answerQuestion).toHaveBeenLastCalledWith('attempt-1', 'q2', ['a', 'c'])
    expect(wrapper.text()).toContain('Mauvaise réponse')
    expect(wrapper.text()).toContain('Votre réponse, fausse')

    await button(wrapper, 'Voir mon résultat').trigger('click')
    await flushPromises()
    expect(service.finishAttempt).toHaveBeenCalledWith('attempt-1')
    expect(wrapper.text()).toContain('1 / 2')
    expect(wrapper.text()).toContain('1 min 05 s')
    expect(wrapper.text()).toContain('+20 XP')
    expect(wrapper.text()).toContain('3 sur 12')
    expect(toastAdd).toHaveBeenCalledWith(expect.objectContaining({ summary: '+20 XP' }))
    expect(service.getLeaderboard).toHaveBeenCalledTimes(2)
  })

  it('reprend une tentative en cours à la première question sans réponse', async () => {
    service.listMyQuizzes.mockResolvedValue([{ ...quiz, in_progress: true }])
    service.startAttempt.mockResolvedValue({
      attempt_id: 'attempt-1', attempt_number: 1, is_first: true, resumed: true, questions,
      answers: [{ question_id: 'q1', selected: ['b'], is_correct: false, correct_option_ids: ['a'], explanation: '' }],
    })

    const wrapper = mountView()
    await flushPromises()
    await button(wrapper, 'Reprendre').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Question 2 sur 2')
  })

  it('présente une nouvelle tentative comme un entraînement sans points', async () => {
    service.listMyQuizzes.mockResolvedValue([{ ...quiz, first_score: 2, first_total: 2, first_duration_ms: 30_000 }])
    service.startAttempt.mockResolvedValue({ attempt_id: 'attempt-2', attempt_number: 2, is_first: false, questions: [questions[0]], answers: [] })
    service.answerQuestion.mockResolvedValue({ question_id: 'q1', selected: ['a'], is_correct: true, correct_option_ids: ['a'], explanation: '' })
    service.finishAttempt.mockResolvedValue({
      score: 1, total: 1, perfect: true, duration_ms: 9_000, is_first: false, counts_for_ranking: false, xp_awarded: 0, rank: null, participants: 12,
    })

    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.text()).toContain('ne changent ni le classement ni les points')
    await button(wrapper, 'Refaire pour s’entraîner').trigger('click')
    await flushPromises()
    await wrapper.find('input[type="radio"][value="a"]').setValue()
    await button(wrapper, 'Valider ma réponse').trigger('click')
    await flushPromises()
    await button(wrapper, 'Voir mon résultat').trigger('click')
    await flushPromises()
    expect(wrapper.text()).toContain('Tentative d’entraînement')
    expect(wrapper.text()).not.toContain('XP')
    expect(toastAdd).not.toHaveBeenCalled()
  })

  it('affiche le classement avec nom, maison et rang', async () => {
    service.getLeaderboard.mockResolvedValue([
      { rank: 1, user_id: 'u1', display_name: 'Alice Martin', house_name: 'Elaris', house_color: '#DC143C', score: 2, total: 2, duration_ms: 40_000, is_me: false },
      { rank: 2, user_id: 'u2', display_name: 'Bruno Rey', house_name: 'Harmonis', house_color: '#2E8B57', score: 2, total: 2, duration_ms: 55_000, is_me: true },
    ])
    const wrapper = mountView()
    await flushPromises()
    const rows = wrapper.findAll('tbody tr')
    expect(rows).toHaveLength(2)
    expect(rows[0].text()).toContain('Alice Martin')
    expect(rows[0].text()).toContain('Elaris')
    expect(rows[1].classes()).toContain('is-me')
    expect(rows[1].text()).toContain('(vous)')
  })

  it('explique qu’un quiz d’une autre classe ou dépublié n’est pas disponible', async () => {
    service.listMyQuizzes.mockResolvedValue([])
    const wrapper = mountView()
    await flushPromises()
    expect(wrapper.text()).toContain('n’est pas destiné à votre classe')
    expect(service.startAttempt).not.toHaveBeenCalled()
  })
})
