import { beforeEach, describe, expect, it, vi } from 'vitest'

const { calls, control, supabaseMock } = vi.hoisted(() => {
  const calls = []
  const control = { rpc: {}, rows: [{ id: 'row-1' }], error: null, uploadError: null }
  const builder = (table) => {
    const chain = {
      select: vi.fn(() => chain),
      insert: vi.fn((row) => { calls.push(['insert', table, row]); return chain }),
      update: vi.fn((row) => { calls.push(['update', table, row]); return chain }),
      delete: vi.fn(() => { calls.push(['delete', table]); return chain }),
      eq: vi.fn((column, value) => { calls.push(['eq', table, column, value]); return chain }),
      order: vi.fn(() => chain),
      single: vi.fn(async () => ({ data: control.rows[0] ?? null, error: control.error })),
      maybeSingle: vi.fn(async () => ({ data: control.rows[0] ?? null, error: control.error })),
      then: (resolve, reject) => Promise.resolve({ data: control.rows, error: control.error }).then(resolve, reject),
    }
    return chain
  }
  const supabaseMock = {
    rpc: vi.fn(async (name, args) => {
      calls.push(['rpc', name, args])
      return control.rpc[name] ?? { data: null, error: null }
    }),
    from: vi.fn(builder),
    auth: { getSession: vi.fn(async () => ({ data: { session: { user: { id: 'teacher-1' } } } })) },
    storage: {
      from: vi.fn((bucket) => ({
        upload: vi.fn(async (path, file, options) => {
          calls.push(['upload', bucket, path, options])
          return { error: control.uploadError }
        }),
        createSignedUrl: vi.fn(async (path, seconds) => {
          calls.push(['sign', bucket, path, seconds])
          return { data: { signedUrl: `https://signed.test/${path}` }, error: null }
        }),
      })),
    },
  }
  return { calls, control, supabaseMock }
})

vi.mock('@/supabase.js', () => ({ supabase: supabaseMock }))

import {
  quizService,
  quizState,
  quizErrorMessage,
  formatQuizDuration,
  validateQuestion,
  emptyQuestion,
  nextOptionId,
} from '@/service/quizService'

const validQuestion = () => ({
  id: null,
  position: 2,
  kind: 'single',
  prompt: ' Quel nerf innerve le deltoïde ? ',
  explanation: ' Le nerf axillaire. ',
  image_path: null,
  options: [
    { id: 'a', label: ' Nerf axillaire ', correct: true },
    { id: 'b', label: 'Nerf radial', correct: false },
  ],
})

describe('service de quiz', () => {
  beforeEach(() => {
    calls.length = 0
    control.rpc = {}
    control.rows = [{ id: 'row-1' }]
    control.error = null
    control.uploadError = null
  })

  it('passe par les fonctions serveur pour jouer : démarrage, réponse, fin, classement', async () => {
    control.rpc.get_my_quizzes = { data: [{ id: 'quiz-1' }], error: null }
    control.rpc.answer_quiz_question = { data: { is_correct: true, correct_option_ids: ['a'] }, error: null }

    expect(await quizService.listMyQuizzes()).toEqual([{ id: 'quiz-1' }])
    await quizService.startAttempt('quiz-1')
    const feedback = await quizService.answerQuestion('attempt-1', 'question-1', ['a'])
    await quizService.finishAttempt('attempt-1')
    await quizService.getLeaderboard('quiz-1')

    expect(feedback.is_correct).toBe(true)
    expect(calls).toEqual([
      ['rpc', 'get_my_quizzes', undefined],
      ['rpc', 'start_quiz_attempt', { p_quiz_id: 'quiz-1' }],
      ['rpc', 'answer_quiz_question', { p_attempt_id: 'attempt-1', p_question_id: 'question-1', p_selected: ['a'] }],
      ['rpc', 'finish_quiz_attempt', { p_attempt_id: 'attempt-1' }],
      ['rpc', 'get_quiz_leaderboard', { p_quiz_id: 'quiz-1', p_limit: 50 }],
    ])
    // Aucune lecture directe des tables côté joueur : les bonnes réponses restent sur le serveur.
    expect(supabaseMock.from).not.toHaveBeenCalled()
  })

  it('n’envoie jamais de score, de durée ni de points : seul le serveur les calcule', async () => {
    await quizService.finishAttempt('attempt-1')
    const [, , args] = calls.at(-1)
    expect(Object.keys(args)).toEqual(['p_attempt_id'])
  })

  it('propage les erreurs du serveur', async () => {
    control.rpc.start_quiz_attempt = { data: null, error: { code: 'P0001', message: 'Ce quiz n\'est pas ouvert actuellement' } }
    await expect(quizService.startAttempt('quiz-1')).rejects.toMatchObject({ code: 'P0001' })
  })

  it('calcule l’état d’un quiz pour l’étudiant', () => {
    expect(quizState({ first_score: null, in_progress: false, is_open: true })).toBe('todo')
    expect(quizState({ first_score: null, in_progress: true, is_open: true })).toBe('in_progress')
    expect(quizState({ first_score: 0, in_progress: false, is_open: true })).toBe('done')
    expect(quizState({ first_score: null, in_progress: false, is_open: false })).toBe('closed')
  })

  it('formate les durées', () => {
    expect(formatQuizDuration(42_400)).toBe('42 s')
    expect(formatQuizDuration(125_000)).toBe('2 min 05 s')
    expect(formatQuizDuration(undefined)).toBe('0 s')
  })

  it('contrôle une question avant envoi', () => {
    expect(validateQuestion(validQuestion())).toBeNull()
    expect(validateQuestion({ ...validQuestion(), prompt: ' a ' })).toMatch(/énoncé/)
    expect(validateQuestion({ ...validQuestion(), options: [{ id: 'a', label: 'Seule', correct: true }] })).toMatch(/2 et 6/)
    expect(validateQuestion({ ...validQuestion(), options: Array.from({ length: 7 }, (_, i) => ({ id: `o${i}`, label: 'x', correct: i === 0 })) })).toMatch(/2 et 6/)
    expect(validateQuestion({ ...validQuestion(), options: [{ id: 'a', label: 'A', correct: false }, { id: 'b', label: 'B', correct: false }] })).toMatch(/bonne réponse/)
    expect(validateQuestion({ ...validQuestion(), options: [{ id: 'a', label: 'A', correct: true }, { id: 'b', label: 'B', correct: true }] })).toMatch(/une seule/)
    expect(validateQuestion({ ...validQuestion(), kind: 'multiple', options: [{ id: 'a', label: 'A', correct: true }, { id: 'b', label: 'B', correct: true }] })).toBeNull()
    expect(validateQuestion({ ...validQuestion(), options: [{ id: 'a', label: 'A', correct: true }, { id: 'b', label: ' ', correct: false }] })).toMatch(/texte/)
  })

  it('prépare une question vide valide et des identifiants de réponse libres', () => {
    const question = emptyQuestion(3)
    expect(question.position).toBe(3)
    expect(question.options).toHaveLength(2)
    expect(question.options.filter(option => option.correct)).toHaveLength(1)
    expect(nextOptionId([{ id: 'a' }, { id: 'c' }])).toBe('b')
  })

  it('crée un quiz sans jamais envoyer l’auteur ni l’état', async () => {
    await quizService.createQuiz({ title: ' Épaule ', theme: 'Épaule', author_id: 'pirate', status: 'published' })
    const [, table, row] = calls.find(call => call[0] === 'insert')
    expect(table).toBe('quizzes')
    expect(row).toEqual({ title: 'Épaule', description: '', theme: 'Épaule', target_classes: [], opens_at: null, closes_at: null })
  })

  it('publie et dépublie par le seul champ d’état', async () => {
    await quizService.setQuizStatus('quiz-1', 'published')
    await quizService.setQuizStatus('quiz-1', 'n’importe quoi')
    const updates = calls.filter(call => call[0] === 'update').map(call => call[2])
    expect(updates).toEqual([{ status: 'published' }, { status: 'draft' }])
  })

  it('enregistre une question nettoyée, et refuse une question invalide sans appel réseau', async () => {
    await quizService.saveQuestion('quiz-1', validQuestion())
    const [, table, row] = calls.find(call => call[0] === 'insert')
    expect(table).toBe('quiz_questions')
    expect(row).toMatchObject({
      quiz_id: 'quiz-1',
      position: 2,
      kind: 'single',
      prompt: 'Quel nerf innerve le deltoïde ?',
      explanation: 'Le nerf axillaire.',
      options: [{ id: 'a', label: 'Nerf axillaire', correct: true }, { id: 'b', label: 'Nerf radial', correct: false }],
    })

    calls.length = 0
    await expect(quizService.saveQuestion('quiz-1', { ...validQuestion(), prompt: '' })).rejects.toThrow(/énoncé/)
    expect(calls).toEqual([])
  })

  it('met à jour une question existante sans changer son quiz', async () => {
    await quizService.saveQuestion('quiz-1', { ...validQuestion(), id: 'question-9' })
    const [, table, row] = calls.find(call => call[0] === 'update')
    expect(table).toBe('quiz_questions')
    expect(row).not.toHaveProperty('quiz_id')
    expect(calls).toContainEqual(['eq', 'quiz_questions', 'id', 'question-9'])
  })

  it('réordonne les questions selon l’ordre de la liste', async () => {
    await quizService.reorderQuestions(['q-b', 'q-a', 'q-c'])
    expect(calls.filter(call => call[0] === 'update').map(call => call[2])).toEqual([
      { position: 0 }, { position: 1 }, { position: 2 },
    ])
    expect(calls.filter(call => call[0] === 'eq').map(call => call[3])).toEqual(['q-b', 'q-a', 'q-c'])
  })

  it('signale une suppression ou un déplacement refusés par les règles d’accès', async () => {
    control.rows = []
    await expect(quizService.deleteQuiz('quiz-1')).rejects.toThrow('Insufficient privileges')
    await expect(quizService.deleteQuestion('question-1')).rejects.toThrow('Insufficient privileges')
    await expect(quizService.reorderQuestions(['q-a'])).rejects.toThrow('Insufficient privileges')
  })

  it('duplique et lit les résultats par les fonctions serveur', async () => {
    control.rpc.duplicate_quiz = { data: 'quiz-2', error: null }
    expect(await quizService.duplicateQuiz('quiz-1')).toBe('quiz-2')
    await quizService.getResultsSummary('quiz-1')
    expect(calls).toContainEqual(['rpc', 'get_quiz_results_summary', { p_quiz_id: 'quiz-1' }])
  })

  it('demande au serveur si la personne peut créer des quiz', async () => {
    control.rpc.app_is_quiz_author = { data: true, error: null }
    expect(await quizService.canAuthorQuizzes()).toBe(true)
    control.rpc.app_is_quiz_author = { data: null, error: { message: 'boom' } }
    expect(await quizService.canAuthorQuizzes()).toBe(false)
  })

  it('dépose une image dans le dossier de l’auteur et refuse les autres fichiers', async () => {
    const image = new File(['x'], 'epaule.png', { type: 'image/png' })
    const path = await quizService.uploadQuestionImage(image)
    expect(path).toMatch(/^teacher-1\/[0-9a-f-]{36}\.png$/)
    expect(calls.at(-1)).toEqual(['upload', 'quiz-images', path, { contentType: 'image/png', upsert: false }])

    calls.length = 0
    await expect(quizService.uploadQuestionImage(new File(['x'], 'cours.pdf', { type: 'application/pdf' }))).rejects.toThrow(/JPEG, PNG ou WebP/)
    const tooBig = new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'grand.jpg', { type: 'image/jpeg' })
    await expect(quizService.uploadQuestionImage(tooBig)).rejects.toThrow(/5 Mo/)
    expect(calls).toEqual([])
  })

  it('traduit les erreurs techniques et garde les messages métier du serveur', () => {
    expect(quizErrorMessage({ message: 'new row violates row-level security policy for table "quizzes"' })).toMatch(/droits/)
    expect(quizErrorMessage({ code: 'P0001', message: 'Ce quiz n\'est pas ouvert actuellement' })).toBe('Ce quiz n\'est pas ouvert actuellement')
    expect(quizErrorMessage({ message: 'violates check constraint "quiz_questions_options_check"' })).toMatch(/2 à 6 réponses/)
    expect(quizErrorMessage({ message: 'inconnu' }, 'Secours')).toBe('Secours')
  })
})
