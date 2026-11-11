/**
 * Plateforme de quiz.
 *
 * Côté étudiant, tout passe par des fonctions serveur : les bonnes réponses ne sont renvoyées
 * qu'après la réponse, le score, la durée et les points sont calculés par le serveur.
 * Côté enseignant/admin, la création passe par les tables protégées par leurs règles d'accès.
 */

import { supabase } from '../supabase.js'

export const QUIZ_IMAGE_BUCKET = 'quiz-images'
export const QUIZ_CLASSES = Object.freeze(['BA24', 'BA25', 'BA26'])
export const QUIZ_THEME_SUGGESTIONS = Object.freeze([
  'Épaule', 'Coude', 'Poignet et main', 'Hanche', 'Genou', 'Cheville et pied',
  'Rachis', 'Neuro', 'Cardio-respi', 'Pédiatrie', 'Gériatrie',
])
export const QUIZ_MIN_OPTIONS = 2
export const QUIZ_MAX_OPTIONS = 6
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const IMAGE_MAX_BYTES = 5 * 1024 * 1024
const OPTION_IDS = 'abcdefghijklmnopqrstuvwxyz'

const ERROR_MESSAGES = [
  [/Authentication required/i, 'Votre session a expiré. Reconnectez-vous pour continuer.'],
  [/Insufficient privileges|row-level security|permission denied/i, 'Vous n’avez pas les droits pour cette action.'],
  [/quiz_questions_options_check/i, 'Chaque question doit avoir 2 à 6 réponses, dont au moins une juste (une seule en choix unique).'],
  [/quizzes_title_length/i, 'Le titre doit contenir entre 3 et 120 caractères.'],
  [/quizzes_window_check/i, 'La date de fermeture doit être après la date d’ouverture.'],
  [/quiz_questions_prompt_length/i, 'L’énoncé doit contenir entre 3 et 1000 caractères.'],
  [/Failed to fetch|NetworkError|network/i, 'Connexion impossible. Vérifiez votre réseau puis réessayez.'],
]

/** Message lisible à partir d'une erreur Supabase (les messages métier du serveur sont déjà en français). */
export function quizErrorMessage(error, fallback = 'Une erreur est survenue. Réessayez.') {
  const raw = String(error?.message || error || '')
  for (const [pattern, message] of ERROR_MESSAGES) {
    if (pattern.test(raw)) return message
  }
  // P0001 / P0002 : messages métier écrits par les fonctions de quiz.
  if (['P0001', 'P0002'].includes(error?.code) && raw) return raw
  return fallback
}

function unwrap({ data, error }) {
  if (error) throw error
  return data
}

/** État d'un quiz pour la personne connectée. */
export function quizState(quiz) {
  if (quiz?.first_score !== null && quiz?.first_score !== undefined) return 'done'
  if (quiz?.in_progress) return 'in_progress'
  if (quiz && quiz.is_open === false) return 'closed'
  return 'todo'
}

export function formatQuizDuration(durationMs) {
  const totalSeconds = Math.max(0, Math.round(Number(durationMs || 0) / 1000))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return minutes > 0 ? `${minutes} min ${String(seconds).padStart(2, '0')} s` : `${seconds} s`
}

export function nextOptionId(options = []) {
  const used = new Set(options.map(option => option.id))
  return [...OPTION_IDS].find(letter => !used.has(letter)) || `o${options.length + 1}`
}

export function emptyQuestion(position = 0) {
  return {
    id: null,
    position,
    kind: 'single',
    prompt: '',
    explanation: '',
    image_path: null,
    options: [
      { id: 'a', label: '', correct: true },
      { id: 'b', label: '', correct: false },
    ],
  }
}

/** Contrôle une question avant envoi ; renvoie un message d'erreur ou null. */
export function validateQuestion(question) {
  const prompt = String(question?.prompt || '').trim()
  if (prompt.length < 3) return 'Écrivez l’énoncé de la question (3 caractères au minimum).'
  const options = question?.options || []
  if (options.length < QUIZ_MIN_OPTIONS || options.length > QUIZ_MAX_OPTIONS) {
    return 'Une question comporte entre 2 et 6 réponses.'
  }
  if (options.some(option => !String(option.label || '').trim())) return 'Chaque réponse doit avoir un texte.'
  const correct = options.filter(option => option.correct).length
  if (correct === 0) return 'Indiquez au moins une bonne réponse.'
  if (question.kind === 'single' && correct !== 1) return 'En choix unique, une seule réponse peut être juste.'
  return null
}

function questionPayload(question) {
  return {
    position: Number(question.position) || 0,
    kind: question.kind === 'multiple' ? 'multiple' : 'single',
    prompt: String(question.prompt || '').trim(),
    explanation: String(question.explanation || '').trim(),
    image_path: question.image_path || null,
    options: (question.options || []).map(option => ({
      id: option.id,
      label: String(option.label || '').trim(),
      correct: Boolean(option.correct),
    })),
  }
}

function quizPayload(quiz) {
  return {
    title: String(quiz.title || '').trim(),
    description: String(quiz.description || '').trim(),
    theme: String(quiz.theme || '').trim(),
    target_classes: [...(quiz.target_classes || [])],
    opens_at: quiz.opens_at ? new Date(quiz.opens_at).toISOString() : null,
    closes_at: quiz.closes_at ? new Date(quiz.closes_at).toISOString() : null,
  }
}

const QUIZ_COLUMNS = 'id, author_id, title, description, theme, target_classes, opens_at, closes_at, status, published_at, created_at, updated_at'
const QUESTION_COLUMNS = 'id, quiz_id, position, kind, prompt, explanation, image_path, options'

export const quizService = {
  // ----- Étudiants -------------------------------------------------------------------------

  async listMyQuizzes() {
    return unwrap(await supabase.rpc('get_my_quizzes')) || []
  },

  /** Ouvre (ou reprend) une tentative ; les questions arrivent sans les bonnes réponses. */
  async startAttempt(quizId) {
    return unwrap(await supabase.rpc('start_quiz_attempt', { p_quiz_id: quizId }))
  },

  /** Enregistre une réponse définitive et renvoie la correction et l'explication. */
  async answerQuestion(attemptId, questionId, selected) {
    return unwrap(await supabase.rpc('answer_quiz_question', {
      p_attempt_id: attemptId,
      p_question_id: questionId,
      p_selected: selected,
    }))
  },

  /** Termine la tentative : score, durée, rang et points calculés par le serveur. */
  async finishAttempt(attemptId) {
    return unwrap(await supabase.rpc('finish_quiz_attempt', { p_attempt_id: attemptId }))
  },

  async getLeaderboard(quizId, limit = 50) {
    return unwrap(await supabase.rpc('get_quiz_leaderboard', { p_quiz_id: quizId, p_limit: limit })) || []
  },

  // ----- Enseignants et admins -------------------------------------------------------------

  /** La personne connectée peut-elle créer des quiz ? (vérifié par le serveur) */
  async canAuthorQuizzes() {
    const { data, error } = await supabase.rpc('app_is_quiz_author')
    return !error && data === true
  },

  /** Quiz que la personne peut gérer : les siens, ou tous pour un admin. */
  async listManagedQuizzes() {
    const quizzes = unwrap(await supabase
      .from('quizzes')
      .select(`${QUIZ_COLUMNS}, quiz_questions(count)`)
      .order('updated_at', { ascending: false })) || []
    return quizzes.map(({ quiz_questions: counts, ...quiz }) => ({
      ...quiz,
      question_count: counts?.[0]?.count ?? 0,
    }))
  },

  async getManagedQuiz(quizId) {
    const quiz = unwrap(await supabase.from('quizzes').select(QUIZ_COLUMNS).eq('id', quizId).maybeSingle())
    if (!quiz) return null
    const questions = unwrap(await supabase
      .from('quiz_questions')
      .select(QUESTION_COLUMNS)
      .eq('quiz_id', quizId)
      .order('position', { ascending: true })
      .order('id', { ascending: true })) || []
    return { ...quiz, questions }
  },

  async createQuiz(quiz) {
    return unwrap(await supabase.from('quizzes').insert(quizPayload(quiz)).select(QUIZ_COLUMNS).single())
  },

  async updateQuiz(quizId, quiz) {
    return unwrap(await supabase.from('quizzes').update(quizPayload(quiz)).eq('id', quizId).select(QUIZ_COLUMNS).single())
  },

  /** Publie (status = 'published') ou repasse en brouillon (status = 'draft'). */
  async setQuizStatus(quizId, status) {
    return unwrap(await supabase
      .from('quizzes')
      .update({ status: status === 'published' ? 'published' : 'draft' })
      .eq('id', quizId)
      .select(QUIZ_COLUMNS)
      .single())
  },

  async deleteQuiz(quizId) {
    const deleted = unwrap(await supabase.from('quizzes').delete().eq('id', quizId).select('id')) || []
    if (deleted.length === 0) throw new Error('Insufficient privileges')
    return true
  },

  async duplicateQuiz(quizId) {
    return unwrap(await supabase.rpc('duplicate_quiz', { p_quiz_id: quizId }))
  },

  /** Crée ou met à jour une question (quiz en brouillon uniquement). */
  async saveQuestion(quizId, question) {
    const problem = validateQuestion(question)
    if (problem) throw new Error(problem)
    const payload = questionPayload(question)
    if (question.id) {
      return unwrap(await supabase.from('quiz_questions').update(payload).eq('id', question.id).select(QUESTION_COLUMNS).single())
    }
    return unwrap(await supabase.from('quiz_questions').insert({ ...payload, quiz_id: quizId }).select(QUESTION_COLUMNS).single())
  },

  async deleteQuestion(questionId) {
    const deleted = unwrap(await supabase.from('quiz_questions').delete().eq('id', questionId).select('id')) || []
    if (deleted.length === 0) throw new Error('Insufficient privileges')
    return true
  },

  /** Enregistre le nouvel ordre : la position suit l'ordre de la liste d'identifiants. */
  async reorderQuestions(questionIds) {
    const results = await Promise.all(questionIds.map((id, position) => supabase
      .from('quiz_questions')
      .update({ position })
      .eq('id', id)
      .select('id')))
    for (const result of results) {
      if (result.error) throw result.error
      if (!result.data?.length) throw new Error('Insufficient privileges')
    }
    return true
  },

  async getResultsSummary(quizId) {
    return unwrap(await supabase.rpc('get_quiz_results_summary', { p_quiz_id: quizId }))
  },

  // ----- Images ----------------------------------------------------------------------------

  /** Dépose une image de question dans le dossier de l'auteur ; renvoie son chemin. */
  async uploadQuestionImage(file) {
    if (!file || !IMAGE_TYPES.includes(file.type)) throw new Error('Image au format JPEG, PNG ou WebP attendue.')
    if (file.size > IMAGE_MAX_BYTES) throw new Error('L’image ne doit pas dépasser 5 Mo.')
    const { data: sessionData } = await supabase.auth.getSession()
    const userId = sessionData?.session?.user?.id
    if (!userId) throw new Error('Authentication required')
    const extension = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }[file.type]
    const path = `${userId}/${crypto.randomUUID()}.${extension}`
    const { error } = await supabase.storage.from(QUIZ_IMAGE_BUCKET).upload(path, file, {
      contentType: file.type,
      upsert: false,
    })
    if (error) throw error
    return path
  },

  /** Adresse temporaire d'affichage d'une image de question (bucket privé). */
  async getQuestionImageUrl(path) {
    if (!path) return null
    const { data, error } = await supabase.storage.from(QUIZ_IMAGE_BUCKET).createSignedUrl(path, 3600)
    return error ? null : data?.signedUrl || null
  },
}

export default quizService
