import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
vi.mock('@/supabase.js', () => ({ supabase: { auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) } } }))

import { getNavigationDestinations } from '@/composables/useNavigationDestinations'
import { findDestructiveStatements } from '../../scripts/supabase/schema-baseline-lib.mjs'

const source = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const migration = source('supabase/migrations/20261111120000_gamification_quizzes.sql')
const functionBody = (name) => {
  const start = migration.indexOf(`create or replace function ${name}(`)
  expect(start, `fonction ${name} absente`).toBeGreaterThan(-1)
  return migration.slice(start, migration.indexOf('$$;', start))
}

describe('plateforme de quiz : activation', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('reste désactivée par défaut et activée en production par le réglage versionné', () => {
    expect(source('.env.production.example')).toContain('VITE_GAMIFICATION_QUIZZES=false')
    expect(source('.env.supabase.example')).toContain('VITE_GAMIFICATION_QUIZZES=false')
    expect(JSON.parse(source('scripts/deployment/production-features.json')).VITE_GAMIFICATION_QUIZZES).toBe('true')
    expect(source('deploy/staging/build-current-test.mjs')).toContain("VITE_GAMIFICATION_QUIZZES: 'true'")
  })

  it('lit le réglage VITE_GAMIFICATION_QUIZZES', async () => {
    vi.stubEnv('VITE_GAMIFICATION_QUIZZES', 'true')
    expect((await import('@/config/gamificationFeatures')).gamificationFeatures.quizzes).toBe(true)
    vi.resetModules()
    vi.stubEnv('VITE_GAMIFICATION_QUIZZES', '')
    expect((await import('@/config/gamificationFeatures')).gamificationFeatures.quizzes).toBe(false)
  })

  it('protège les quatre routes : module activé et connexion requise', async () => {
    const names = ['QuizListView', 'QuizManageView', 'QuizEditorView', 'QuizPlayView']

    vi.stubEnv('VITE_GAMIFICATION_QUIZZES', 'false')
    let routes = (await import('@/router/routes/apps.js')).default
    for (const name of names) {
      const route = routes.find(entry => entry.name === name)
      expect(route.meta.requiresAuth).toBe(true)
      expect(route.beforeEnter()).toEqual({ path: '/outils', replace: true })
    }

    vi.resetModules()
    vi.stubEnv('VITE_GAMIFICATION_QUIZZES', 'true')
    routes = (await import('@/router/routes/apps.js')).default
    for (const name of names) expect(routes.find(entry => entry.name === name).beforeEnter()).toBe(true)
    expect(routes.find(entry => entry.name === 'QuizListView').path).toBe('/quiz')

    const dynamicRoutes = source('src/composables/useDynamicRoutes.js')
    for (const name of names) expect(dynamicRoutes).toContain(`'${name}'`)
  })

  it('ajoute l’entrée de navigation « Quiz » uniquement quand le module est activé', () => {
    const router = { resolve: to => ({ matched: [{ meta: { requiresAuth: true } }], meta: { requiresAuth: true }, name: to }) }
    const context = { router, userId: 'u1', profile: {}, isAuthenticated: true, can: () => false }

    const enabled = getNavigationDestinations({ ...context, features: { quizzes: true } })
    expect(enabled.find(item => item.key === 'quizzes')).toMatchObject({ to: '/quiz', label: 'Quiz', section: 'tools' })

    const disabled = getNavigationDestinations({ ...context, features: { quizzes: false } })
    expect(disabled.some(item => item.key === 'quizzes')).toBe(false)

    const tools = source('src/views/apps/tools/ToolsView.vue')
    expect(tools).toContain("{ to: '/quiz', icon: 'pi pi-question-circle', label: 'Quiz' }")
    expect(tools).toContain("outil.to !== '/quiz' || gamificationFeatures.quizzes")
  })
})

describe('plateforme de quiz : garanties de la migration', () => {
  const tables = ['quizzes', 'quiz_questions', 'quiz_attempts', 'quiz_attempt_answers', 'quiz_attempt_results']

  it('est additive : aucune instruction destructive, aucune exception au garde-fou', () => {
    expect(findDestructiveStatements(migration)).toEqual([])
    expect(source('supabase/schema-guard-allowlist.json')).not.toContain('20261111120000_gamification_quizzes')
  })

  it('ne redéfinit aucune fonction existante du moteur (marqueurs de release inchangés)', () => {
    const redefined = [...migration.matchAll(/create or replace function ([a-z_.]+)\(/g)].map(match => match[1])
    expect(redefined.length).toBeGreaterThan(10)
    for (const name of redefined) {
      expect(name, name).toMatch(/quiz/)
    }
  })

  it('active la RLS sur toutes les tables et retire tout accès anonyme', () => {
    for (const table of tables) {
      expect(migration).toContain(`alter table public.${table} enable row level security;`)
      expect(migration).toContain(`revoke all on table public.${table} from public, anon, authenticated;`)
    }
    expect(migration).not.toMatch(/to anon\b/)
    expect(migration).not.toMatch(/grant [^;]*\banon\b/)
  })

  it('réserve l’écriture des tentatives, réponses et résultats aux fonctions serveur', () => {
    for (const table of ['quiz_attempts', 'quiz_attempt_answers', 'quiz_attempt_results']) {
      expect(migration).toContain(`grant select on table public.${table} to authenticated;`)
      expect(migration).not.toMatch(new RegExp(`grant [^;]*(insert|update|delete)[^;]*on table public\\.${table}\\b`))
    }
    // Ni l'auteur ni l'état de publication ne sont choisis à la création.
    expect(migration).toContain('grant insert (title, description, theme, target_classes, opens_at, closes_at)\n  on table public.quizzes to authenticated;')
  })

  it('ne laisse lire les questions (et leurs bonnes réponses) qu’à qui gère le quiz', () => {
    const policies = [...migration.matchAll(/create policy (quiz_questions_\w+)\s+on public\.quiz_questions for (\w+)/g)]
    expect(policies.map(match => match[2]).sort()).toEqual(['delete', 'insert', 'select', 'update'])
    for (const [, name] of policies) expect(name).toMatch(/managers$/)
  })

  it('n’envoie les bonnes réponses qu’après l’enregistrement de la réponse', () => {
    const publicQuestions = functionBody('gamification_private.quiz_public_questions')
    expect(publicQuestions).not.toContain("'correct'")
    expect(publicQuestions).not.toContain('explanation')

    const answer = functionBody('public.answer_quiz_question')
    expect(answer.indexOf('insert into public.quiz_attempt_answers'))
      .toBeLessThan(answer.indexOf('gamification_private.quiz_answer_feedback('))
    expect(answer).toContain('on conflict (attempt_id, question_id) do nothing')

    // La correction lit toujours une réponse enregistrée.
    expect(functionBody('gamification_private.quiz_answer_feedback')).toContain('from public.quiz_attempt_answers aa')
  })

  it('attribue les points côté serveur : première tentative, joueurs seulement, 20 ou 40 XP', () => {
    const finish = functionBody('public.finish_quiz_attempt')
    expect(finish).toContain('v_is_first := v_attempt.attempt_number = 1;')
    expect(finish).toContain('gamification_private.is_rollout_member(v_user_id)')
    expect(finish).toContain('rc.rewards_enabled')
    expect(finish).toContain("case when v_score = v_total then 'QUIZ_PERFECT' else 'QUIZ_COMPLETE' end")
    expect(finish).toContain('public.gamification_award_xp_internal(')
    expect(finish).toContain("'quiz:' || v_quiz.id::text")
    expect(finish).toContain('clock_timestamp()')
    expect(migration).toContain("('QUIZ_COMPLETE', 'gamification-quiz-v1', 20, 'complete_quiz', 'event', null, true)")
    expect(migration).toContain("('QUIZ_PERFECT', 'gamification-quiz-v1', 40, 'perfect_quiz', 'event', null, true)")
  })

  it('classe sur la première tentative, au score puis au temps', () => {
    const leaderboard = functionBody('public.get_quiz_leaderboard')
    expect(leaderboard).toContain('rank() over (order by r.score desc, r.duration_ms asc)')
    expect(leaderboard).toContain('r.is_ranked')
    expect(migration).toContain('constraint quiz_attempt_results_ranked_check check (is_first or not is_ranked)')
  })

  it('ferme les fonctions aux anonymes et garde les fonctions internes privées', () => {
    for (const signature of [
      'get_my_quizzes()', 'start_quiz_attempt(uuid)', 'answer_quiz_question(uuid, uuid, text[])',
      'finish_quiz_attempt(uuid)', 'get_quiz_leaderboard(uuid, integer)', 'get_quiz_results_summary(uuid)',
      'duplicate_quiz(uuid)',
    ]) {
      expect(migration).toContain(`revoke all on function public.${signature} from public, anon;`)
      expect(migration).toContain(`grant execute on function public.${signature} to authenticated;`)
    }
    const internal = [...migration.matchAll(/create or replace function (gamification_private\.\w+)\(/g)]
    expect(internal.length).toBe(5)
    expect(migration.match(/revoke all on function gamification_private\.\w+\([^)]*\) from public, anon, authenticated;/g)).toHaveLength(5)
  })

  it('fournit un quiz d’exemple de 10 questions, en brouillon, sans rien modifier d’existant', () => {
    const demo = source('scripts/supabase/quiz-demo-epaule.sql')
    expect(demo).toContain("'draft'")
    expect(findDestructiveStatements(demo)).toEqual([])
    const questions = [...demo.matchAll(/\(v_quiz, (\d+), '(single|multiple)',/g)]
    expect(questions.map(match => Number(match[1]))).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    for (const options of demo.matchAll(/'(\[\{"id"[\s\S]*?\])'/g)) {
      const parsed = JSON.parse(options[1].replace(/''/g, "'"))
      expect(parsed.length).toBeGreaterThanOrEqual(2)
      expect(parsed.length).toBeLessThanOrEqual(6)
      expect(parsed.some(option => option.correct)).toBe(true)
    }
  })
})
