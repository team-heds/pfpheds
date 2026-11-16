import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const mocks = vi.hoisted(() => ({
  nextQuestion: vi.fn(),
  answer: vi.fn(),
  getQuestionImageUrl: vi.fn(async () => null),
}))
vi.mock('@/supabase.js', () => ({ supabase: { auth: { onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) } } }))
vi.mock('@/service/quizDuelService', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    quizDuelService: {
      ...actual.quizDuelService,
      nextQuestion: mocks.nextQuestion,
      answer: mocks.answer,
      getQuestionImageUrl: mocks.getQuestionImageUrl,
    },
  }
})

import { findDestructiveStatements } from '../../scripts/supabase/schema-baseline-lib.mjs'
import { buildQuickTiles } from '@/mobile/search/searchHelpers'
import { tabForPath } from '@/mobile/shell/tabs'
import {
  duelErrorMessage,
  duelResultLabel,
  duelStatusText,
  formatDuelTime,
  formatTimeLeft,
  groupDuels,
} from '@/service/quizDuelService'
import QuizDuelPlay from '@/views/apps/quiz/QuizDuelPlay.vue'

const source = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const migrationPath = 'supabase/migrations/20261116163000_gamification_quiz_duel.sql'
const migration = source(migrationPath)
const functionBody = (name) => {
  const start = migration.indexOf(`create or replace function ${name}(`)
  expect(start, `fonction ${name} absente`).toBeGreaterThan(-1)
  return migration.slice(start, migration.indexOf('$$;', start))
}

describe('duel de quiz : activation', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('reste désactivé par défaut, activé en production et sur le site de test', () => {
    expect(source('.env.production.example')).toContain('VITE_GAMIFICATION_QUIZ_DUEL=false')
    expect(source('.env.supabase.example')).toContain('VITE_GAMIFICATION_QUIZ_DUEL=false')
    expect(JSON.parse(source('scripts/deployment/production-features.json')).VITE_GAMIFICATION_QUIZ_DUEL).toBe('true')
    expect(source('deploy/staging/build-current-test.mjs')).toContain("VITE_GAMIFICATION_QUIZ_DUEL: 'true'")
  })

  it('lit le réglage VITE_GAMIFICATION_QUIZ_DUEL', async () => {
    vi.stubEnv('VITE_GAMIFICATION_QUIZ_DUEL', 'true')
    expect((await import('@/config/gamificationFeatures')).gamificationFeatures.quizDuel).toBe(true)
    vi.resetModules()
    vi.stubEnv('VITE_GAMIFICATION_QUIZ_DUEL', 'false')
    expect((await import('@/config/gamificationFeatures')).gamificationFeatures.quizDuel).toBe(false)
  })

  it('protège la page /duels par le réglage et la range dans l’onglet Recherche', async () => {
    const routes = (await import('@/router/routes/apps')).default
    const route = routes.find(entry => entry.name === 'QuizDuelView')
    expect(route.path).toBe('/duels')
    expect(route.meta.requiresAuth).toBe(true)
    expect(source('src/router/routes/apps.js')).toContain("name: 'QuizDuelView', beforeEnter: featureGuard('quizDuel')")
    expect(source('src/composables/useDynamicRoutes.js')).toContain("'QuizDuelView'")
    expect(tabForPath('/duels')).toBe('search')
  })

  it('ajoute une tuile d’accès rapide mobile seulement si le réglage est actif', () => {
    expect(buildQuickTiles({ features: { quizDuel: true } }).some(tile => tile.to === '/duels')).toBe(true)
    expect(buildQuickTiles({ features: { quizDuel: false } }).some(tile => tile.to === '/duels')).toBe(false)
  })

  it('affiche la carte du duel dans l’espace jeux', () => {
    const hub = source('src/views/apps/tools/GameView.vue')
    expect(hub).toContain('v-if="gamificationFeatures.quizDuel"')
    expect(hub).toContain('<QuizDuelHubCard />')
  })
})

describe('duel de quiz : garanties de la migration', () => {
  const tables = ['quiz_duels', 'quiz_duel_responses', 'quiz_duel_steps', 'quiz_duel_answers', 'quiz_duel_outcomes']

  it('est additive : aucune instruction destructive, aucune exception de garde-fou', () => {
    expect(findDestructiveStatements(migration)).toEqual([])
    expect(source('supabase/schema-guard-allowlist.json')).not.toContain('20261116163000_gamification_quiz_duel')
  })

  it('ne redéfinit aucune fonction existante', () => {
    const names = [...migration.matchAll(/create or replace function ([\w.]+)\(/g)].map(match => match[1])
    for (const name of names) expect(name, name).toMatch(/quiz_duel/)
    for (const other of ['supabase/migrations/20261111120000_gamification_quizzes.sql', 'scripts/supabase/release-237-migration-markers.sql']) {
      const text = source(other)
      for (const name of names) expect(text, `${name} dans ${other}`).not.toContain(name.split('.').pop())
    }
  })

  it('active la RLS partout et ferme l’écriture au navigateur', () => {
    for (const table of tables) {
      expect(migration).toContain(`alter table public.${table} enable row level security;`)
      expect(migration).toContain(`revoke all on table public.${table} from public, anon, authenticated;`)
    }
    expect(migration).not.toMatch(/grant (insert|update|delete)[^;]* on table public\.quiz_duel/)
    // Réponses et chronomètres jamais lisibles directement.
    expect(migration).not.toMatch(/grant select on table public\.quiz_duel_(answers|steps)/)
  })

  it('n’envoie aucune correction avant la fin du duel', () => {
    const next = functionBody('public.next_quiz_duel_question')
    expect(next).not.toMatch(/'correct'|explanation/)
    const answer = functionBody('public.answer_quiz_duel_question')
    const returned = answer.slice(answer.lastIndexOf('return jsonb_build_object'))
    expect(returned).not.toMatch(/is_correct|correct_option|explanation/)
    const detail = functionBody('public.get_quiz_duel')
    expect(detail).toContain("(v_summary ->> 'state') = 'done' and (v_summary ->> 'my_answered')::integer >= 5")
    expect(detail).toContain("v_show_opponent := (v_summary -> 'outcome' ->> 'reason') = 'completed'")
  })

  it('mesure le temps côté serveur et compte faux une réponse hors délai', () => {
    const answer = functionBody('public.answer_quiz_duel_question')
    expect(answer).toContain('v_now timestamptz := clock_timestamp()')
    expect(answer).toContain('v_timed_out := v_elapsed > v_limit_ms + v_grace_ms')
    expect(migration).toContain("'time_limit_ms', 20000")
  })

  it('attribue 15 / 5 / 8 XP par la fonction centrale, 3 duels récompensés par jour au plus', () => {
    const settle = functionBody('gamification_private.quiz_duel_settle')
    expect(settle).toContain("'QUIZ_DUEL_WIN', 15")
    expect(settle).toContain("'QUIZ_DUEL_LOSS', 5")
    expect(settle).toContain("'QUIZ_DUEL_DRAW', 8")
    const reward = functionBody('gamification_private.quiz_duel_reward')
    expect(reward).toContain('public.gamification_award_xp_internal(')
    expect(reward).toContain('if v_rewarded >= 3 then')
    expect(reward).toContain('gamification_private.is_rollout_member(p_user_id)')
    expect(reward).toContain('rewards_enabled')
    expect(migration).toContain("(reason = 'completed' or (challenger_xp = 0 and opponent_xp = 0))")
  })

  it('prévient l’adversaire par la file de notifications existante', () => {
    expect(functionBody('gamification_private.quiz_duel_notify')).toContain('insert into public.push_outbox (user_id, title, body, url)')
    expect(functionBody('public.create_quiz_duel')).toContain('gamification_private.quiz_duel_notify(')
  })

  it('ne tire que des questions de quiz publiés, déjà ouverts, hors quiz des joueurs', () => {
    const pool = functionBody('gamification_private.quiz_duel_question_pool')
    expect(pool).toContain("q.status = 'published'")
    expect(pool).toContain('q.opens_at is null or q.opens_at <= now()')
    expect(pool).toContain('not (q.author_id = any (p_players))')
  })

  it('a son test SQL d’isolation', () => {
    const test = source('supabase/tests/gamification_quiz_duel_isolation.sql')
    expect(test).toContain('rollback;')
    expect(test).toContain('duel answers and steps must not be readable from the browser')
  })
})

describe('duel de quiz : aides d’affichage', () => {
  it('classe les duels à jouer, en attente et terminés', () => {
    const groups = groupDuels([
      { id: 1, state: 'to_play' }, { id: 2, state: 'waiting' }, { id: 3, state: 'done' }, { id: 4, state: 'closing' },
    ])
    expect(groups.toPlay.map(d => d.id)).toEqual([1])
    expect(groups.waiting.map(d => d.id)).toEqual([2, 4])
    expect(groups.done.map(d => d.id)).toEqual([3])
  })

  it('explique clairement le manque de questions', () => {
    expect(duelErrorMessage({ message: 'duel_not_enough_questions', details: '3' }))
      .toBe('Seulement 3 questions disponibles pour ce thème (il en faut 5).')
    expect(duelErrorMessage({ message: 'duel_not_enough_questions', details: '0' }))
      .toBe('Aucune question disponible pour ce thème.')
    expect(duelErrorMessage({ message: 'duel_closed' })).toBe('Ce duel est terminé.')
    expect(duelErrorMessage({ message: 'boom' }, 'Autre')).toBe('Autre')
  })

  it('formate temps et résultats', () => {
    expect(formatDuelTime(12400)).toBe('12,4 s')
    expect(formatDuelTime(65000)).toBe('1 min 05 s')
    expect(formatTimeLeft('2026-11-16T12:00:00Z', Date.parse('2026-11-16T10:30:00Z'))).toBe('1 h')
    expect(formatTimeLeft('2026-11-16T12:00:00Z', Date.parse('2026-11-16T13:00:00Z'))).toBe('délai écoulé')
    expect(duelResultLabel({ outcome: { result: 'win', forfeit: true } })).toBe('Victoire par forfait')
    expect(duelResultLabel({ outcome: { result: 'draw' } })).toBe('Égalité')
    expect(duelStatusText({ state: 'to_play', needs_response: true, expires_at: '2026-11-16T12:00:00Z' }, Date.parse('2026-11-16T11:30:00Z')))
      .toBe('Défi reçu · 30 min pour répondre')
  })
})

describe('duel de quiz : écran de jeu', () => {
  const question = (position) => ({
    done: false,
    position,
    total: 5,
    time_limit_ms: 20000,
    remaining_ms: 20000,
    question: {
      kind: 'single',
      prompt: `Question ${position}`,
      image_path: null,
      options: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Bêta' }],
    },
  })

  beforeEach(() => {
    vi.useFakeTimers()
    mocks.nextQuestion.mockReset()
    mocks.answer.mockReset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const mountPlay = () => mount(QuizDuelPlay, {
    props: { duelId: 'duel-1' },
    global: { plugins: [PrimeVue], stubs: { Transition: true, TransitionGroup: true } },
  })

  it('envoie la réponse choisie puis passe à la suite, sans afficher de correction', async () => {
    mocks.nextQuestion
      .mockResolvedValueOnce(question(1))
      .mockResolvedValueOnce({ done: true, duel: { id: 'duel-1', state: 'waiting' } })
    mocks.answer.mockResolvedValue({ position: 1, finished: true })

    const wrapper = mountPlay()
    await flushPromises()
    expect(wrapper.text()).toContain('Question 1 sur 5')
    expect(wrapper.text()).toContain('20 s')

    await wrapper.find('input[value="b"]').setValue(true)
    await wrapper.find('button').trigger('click')
    await flushPromises()

    expect(mocks.answer).toHaveBeenCalledWith('duel-1', 1, ['b'])
    expect(wrapper.emitted('finished')[0][0]).toEqual({ id: 'duel-1', state: 'waiting' })
    expect(wrapper.text()).not.toMatch(/Bonne réponse|Mauvaise réponse/)
  })

  it('à la fin du temps sans réponse, laisse le serveur compter la question et enchaîne', async () => {
    mocks.nextQuestion
      .mockResolvedValueOnce(question(1))
      .mockResolvedValueOnce(question(2))
    const wrapper = mountPlay()
    await flushPromises()

    await vi.advanceTimersByTimeAsync(20200)
    expect(wrapper.text()).toContain('Temps écoulé')
    expect(mocks.answer).not.toHaveBeenCalled()

    await vi.advanceTimersByTimeAsync(3600)
    await flushPromises()
    expect(mocks.nextQuestion).toHaveBeenCalledTimes(2)
    expect(wrapper.text()).toContain('Question 2 sur 5')
  })
})
