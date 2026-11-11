import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const selects = []
const respond = { fn: () => ({ data: [], error: null }) }

vi.mock('../../src/supabase.js', () => ({
  supabase: {
    from: vi.fn((table) => {
      const state = { table, columns: '' }
      const query = {
        select: vi.fn((columns) => { state.columns = columns; return query }),
        eq: vi.fn(() => query),
        or: vi.fn(() => query),
        order: vi.fn(() => query),
        then: (resolvePromise) => {
          selects.push(state)
          return Promise.resolve(respond.fn(state)).then(resolvePromise)
        },
      }
      return query
    }),
  },
}))

import challengesService, { challengeActionUrl } from '../../src/service/challengesService.js'
import ChallengeCard from '../../src/components/gamification/ChallengeCard.vue'

const source = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const wordChallenge = {
  id: 'w46', name: 'Mot de la semaine', description: 'Trouve le mot de la semaine physio en 6 essais.',
  target_value: 1, action_type: 'word_of_week', xp_reward: 0, week_number: 46, year: 2026,
  start_date: '2026-11-09', end_date: '2026-11-15', is_active: true, status: 'active', action_url: '/mot-de-la-semaine',
}

describe('défis — lien d’action facultatif', () => {
  beforeEach(() => {
    selects.length = 0
    respond.fn = () => ({ data: [], error: null })
  })

  it('n’accepte que des adresses internes de la plateforme', () => {
    expect(challengeActionUrl('/mot-de-la-semaine')).toBe('/mot-de-la-semaine')
    expect(challengeActionUrl(' /quiz?id=12 ')).toBe('/quiz?id=12')
    for (const value of ['https://exemple.ch', '//exemple.ch', 'mot-de-la-semaine', 'javascript:alert(1)', '/a b', '', null, undefined, 12]) {
      expect(challengeActionUrl(value)).toBeNull()
    }
  })

  it('lit le lien, la progression et l’état du défi « Mot de la semaine » depuis le serveur', async () => {
    respond.fn = ({ table }) => (table === 'challenges'
      ? { data: [wordChallenge, { ...wordChallenge, id: 'c1', name: 'Autre', action_type: 'daily_login', action_url: null }], error: null }
      : { data: [{ challenge_id: 'w46', current_value: 1, completed: true, completed_at: '2026-11-11T10:00:00' }], error: null })

    const [word, other] = await challengesService.getUserActiveChallenges('user-1')

    expect(word).toMatchObject({ name: 'Mot de la semaine', actionUrl: '/mot-de-la-semaine', icon: '🔤', category: 'apprentissage', target: 1, progress: 1, completed: true, reward: { xp: 0 } })
    expect(other.actionUrl).toBeNull()
    expect(selects.every((call) => call.columns.includes('action_url'))).toBe(true)
  })

  it('charge les défis sans lien tant que la colonne n’existe pas en base', async () => {
    respond.fn = ({ table, columns }) => {
      if (columns.includes('action_url')) return { data: null, error: { code: '42703', message: 'column challenges.action_url does not exist' } }
      return table === 'challenges' ? { data: [{ ...wordChallenge, action_url: undefined }], error: null } : { data: [], error: null }
    }

    const result = await challengesService.getUserActiveChallenges('user-1')

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({ name: 'Mot de la semaine', actionUrl: null, completed: false })
  })

  it('ne masque pas une autre erreur de lecture', async () => {
    respond.fn = () => ({ data: null, error: { message: 'permission denied' } })
    await expect(challengesService.getUserActiveChallenges('user-1')).rejects.toMatchObject({ message: 'permission denied' })
  })

  it('annonce sur la carte qu’elle mène au défi, tant qu’il reste à faire', () => {
    const challenge = (overrides = {}) => ({
      id: 'w46', name: 'Mot de la semaine', description: 'Trouve le mot.', difficulty: 'EASY', icon: '🔤', category: 'apprentissage',
      target: 1, progress: 0, completed: false, reward: { xp: 0, badge: null, title: null }, endDate: '2099-11-15T23:59:59.999',
      actionUrl: '/mot-de-la-semaine', ...overrides,
    })

    let card = mount(ChallengeCard, { props: { challenge: challenge() } })
    expect(card.get('.challenge-action').text()).toBe('Faire ce défi')
    expect(card.get('.challenge-card').attributes('aria-label')).toBe('Faire le défi Mot de la semaine')
    expect(card.text()).not.toContain('XP')

    card = mount(ChallengeCard, { props: { challenge: challenge({ completed: true, progress: 1 }) } })
    expect(card.find('.challenge-action').exists()).toBe(false)
    expect(card.get('.challenge-card').attributes('aria-label')).toBe('Voir le défi Mot de la semaine')

    card = mount(ChallengeCard, { props: { challenge: challenge({ actionUrl: null }) } })
    expect(card.find('.challenge-action').exists()).toBe(false)
  })

  it('mène au lien depuis l’accueil et depuis la page des défis', () => {
    const sidebar = source('src/components/gamification/QuestsSidebarCard.vue')
    expect(sidebar).toContain('@click="openChallenge(challenge)"')
    expect(sidebar).toContain('if (challenge?.actionUrl && !challenge.completed) router.push(challenge.actionUrl)')
    // Avec des quêtes ouvertes, le défi à faire qui porte un lien reste visible.
    expect(sidebar).toContain('activeChallenges.value.filter((challenge) => challenge.actionUrl && !challenge.completed).slice(0, 1)')
    const page = source('src/components/gamification/ChallengesPage.vue')
    expect(page).toContain('@click="openChallenge(challenge)"')
    expect(page).toContain('if (challenge?.actionUrl && !challenge.completed) router.push(challenge.actionUrl)')
  })
})

describe('défi « Mot de la semaine » — garde-fous côté serveur', () => {
  const migration = source('supabase/migrations/20261112110000_gamification_challenge_action_link.sql')
  const script = source('scripts/supabase/gamification-defi-mot-de-la-semaine.sql')

  it('ajoute un lien générique limité aux adresses internes, sans rien supprimer', () => {
    expect(migration).toContain('add column if not exists action_url text;')
    expect(migration).toContain("check (action_url is null or action_url ~ '^/[A-Za-z0-9][A-Za-z0-9/_.?=&#-]{0,198}$')")
    expect(migration).not.toMatch(/\b(delete\s+from|drop\s+|truncate\s+)/i)
    expect(migration).not.toMatch(/\bgrant\b/i)
  })

  it('coche le défi depuis les parties gagnées, sans verser d’XP', () => {
    expect(migration).toContain("('WORD_OF_WEEK', 'gamification-word-v1', 30, 'word_of_week', 'week', 1, true)")
    expect(migration).toContain('after insert or update of play_date on gamification_private.word_of_day_guesses')
    expect(migration).toContain('when (new.is_correct)')
    expect(migration).not.toContain('gamification_award_xp_internal(')
    expect(migration).not.toContain('xp_history')
    for (const helper of ['word_of_day_mark_challenge(uuid, date)', 'word_of_day_guess_marks_challenge()']) {
      expect(migration).toContain(`revoke all on function gamification_private.${helper} from public, anon, authenticated;`)
    }
    // Le navigateur ne peut pas déclencher cette action lui-même.
    expect(source('src/service/gamificationIntegration.js')).not.toContain('WORD_OF_WEEK')
  })

  it('crée un défi par semaine sans récompense propre, avec le lien vers le jeu', () => {
    expect(script).toContain("'word_of_week', 1, 0,")
    expect(script).toContain("w.lundi, w.lundi + 6, false, 'scheduled', '/mot-de-la-semaine'")
    expect(script).toContain("where c.name = 'Mot de la semaine' and c.start_date = w.lundi")
    expect(script).not.toMatch(/\b(delete\s+from|drop\s+|truncate\s+|update\s+public)/i)
    expect(source('src/router/routes/apps.js')).toContain("path: '/mot-de-la-semaine'")
  })
})
