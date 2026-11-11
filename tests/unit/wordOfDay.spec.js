import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import PrimeVue from 'primevue/config'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  getMyWordOfDay: vi.fn(),
  submitMyWordOfDayGuess: vi.fn(),
  features: { userJourney: true, ventriglisse: false, dailyWheel: false, romRunner: false, wordOfDay: true },
}))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mocks.push }) }))
vi.mock('@/config/gamificationFeatures', () => ({ gamificationFeatures: mocks.features }))
vi.mock('@/components/common/utils/Navbar.vue', () => ({ default: { template: '<nav />' } }))
vi.mock('@/components/gamification/daily/DailyWheelWidget.vue', () => ({ default: { template: '<section />' } }))
vi.mock('@/service/gamificationServiceSupabase', () => ({
  default: { getMyWordOfDay: mocks.getMyWordOfDay, submitMyWordOfDayGuess: mocks.submitMyWordOfDayGuess },
}))

import WordOfDayView from '@/views/apps/tools/WordOfDayView.vue'
import GameView from '@/views/apps/tools/GameView.vue'
import {
  KEYBOARD_ROWS, describeAttempt, letterStates, nextWordLabel, normalizeLetter, weekRangeLabel, weeksLabel,
} from '@/components/games/word-of-day/wordOfDay'

const source = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const migration = source('supabase/migrations/20261111110000_gamification_word_of_day.sql')
const weekMigration = source('supabase/migrations/20261112100000_gamification_word_of_week.sql')

const state = (overrides = {}) => ({
  eligible: true,
  period: 'week',
  play_date: '2026-11-09',
  week_start: '2026-11-09',
  week_end: '2026-11-15',
  next_word_at: '2026-11-15T23:00:00+00:00',
  word_length: 5,
  max_attempts: 6,
  attempts: [],
  status: 'in_progress',
  xp_awarded: 0,
  solution: null,
  stats: { played: 4, won: 3, win_rate: 75, current_streak: 2, best_streak: 3 },
  ...overrides,
})

describe('mot de la semaine physio — liste de mots côté serveur', () => {
  const rows = [...migration.matchAll(/^ {2}\('([^']+)', '((?:[^']|'')+)', '((?:[^']|'')+)', '((?:[^']|'')+)'\),?$/gm)]
    .map(([, word, display, definition, theme]) => ({ word, display, definition: definition.replace(/''/g, "'"), theme }))

  it('contient au moins 200 termes uniques de 5 à 9 lettres sans accents', () => {
    expect(rows.length).toBeGreaterThanOrEqual(200)
    expect(new Set(rows.map((row) => row.word)).size).toBe(rows.length)
    for (const row of rows) expect(row.word).toMatch(/^[A-Z]{5,9}$/)
  })

  it('affiche chaque terme avec ses accents et une courte définition', () => {
    for (const row of rows) {
      expect(row.display.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase()).toBe(row.word)
      expect(row.definition.length).toBeGreaterThanOrEqual(10)
      expect(row.definition.length).toBeLessThanOrEqual(300)
      expect(row.theme.length).toBeGreaterThan(3)
    }
    expect(rows.find((row) => row.word === 'FEMUR').display).toBe('Fémur')
    expect(rows.find((row) => row.word === 'DELTOIDE').display).toBe('Deltoïde')
  })

  it('ne livre aucun mot au navigateur', () => {
    const shipped = [
      'src/views/apps/tools/WordOfDayView.vue',
      'src/components/games/word-of-day/wordOfDay.js',
      'src/components/games/word-of-day/WordOfDayHubCard.vue',
    ].map(source).join('\n').toUpperCase()
    for (const word of ['SCAPULA', 'DELTOIDE', 'CALCANEUS', 'RHOMBOIDE', 'OLECRANE']) {
      expect(shipped).not.toContain(word)
    }
  })
})

describe('mot de la semaine physio — garde-fous de la migration', () => {
  it('garde les tables hors de portée du navigateur, avec RLS', () => {
    for (const table of ['word_of_day_words', 'word_of_day_schedule', 'word_of_day_guesses']) {
      expect(migration).toContain(`alter table gamification_private.${table} enable row level security;`)
      expect(migration).toContain(`revoke all on gamification_private.${table} from public, anon, authenticated;`)
    }
    expect(migration).not.toMatch(/grant\s+(select|insert|all)[^;]*word_of_day/i)
  })

  it('réserve le jeu aux joueurs connectés et décide les points côté serveur', () => {
    expect(migration).toContain('revoke all on function public.get_my_word_of_day() from public, anon;')
    expect(migration).toContain('revoke all on function public.submit_my_word_of_day_guess(text) from public, anon;')
    expect(migration.match(/gamification_private\.is_rollout_member\(v_user_id\)/g)).toHaveLength(2)
    expect(migration).toContain("at time zone 'Europe/Zurich'")
    expect(migration).toContain('public.gamification_award_xp_internal(')
    // Le jeu ne passe pas par le moteur d'actions appelable depuis le navigateur.
    expect(migration).not.toContain('action_rules')
    expect(weekMigration).not.toContain('action_rules')
  })

  it('passe à un mot par semaine sans rien supprimer ni ouvrir au navigateur', () => {
    // Semaine du lundi au dimanche, heure de Zurich.
    expect(weekMigration).toContain("select date_trunc('week', p_at at time zone 'Europe/Zurich')::date;")
    // 30 XP, +15 XP en 3 essais ou moins, une clé d'événement par semaine.
    expect(weekMigration).toContain('v_amount := 30 + case when v_attempt_count + 1 <= 3 then 15 else 0 end;')
    expect(weekMigration).toContain("'word-of-week:' || v_week::text")
    // Pas de second gain pour qui a déjà été payé cette semaine (anciens mots du jour compris).
    expect(weekMigration).toContain("'word-of-day:' || (p_week + d)::text")
    expect(weekMigration).toMatch(/and not exists \(\s+select 1 from public\.xp_history xh/)
    // Le mot déjà tiré et les essais déjà joués sont repris à l'application.
    expect(weekMigration.trim().endsWith('select gamification_private.word_of_day_adopt_daily_rows();')).toBe(true)
    expect(weekMigration).not.toMatch(/\b(delete\s+from|drop\s+|truncate\s+)/i)
    expect(weekMigration).not.toMatch(/grant\s+(select|insert|update|delete|all)\b/i)
    expect(weekMigration.match(/grant execute on function/g)).toHaveLength(1)
    expect(weekMigration).toContain('grant execute on function public.submit_my_word_of_day_guess(text) to authenticated;')
    for (const helper of [
      'word_of_day_week_start(timestamptz)', 'word_of_day_event_keys(date)', 'word_of_day_adopt_daily_rows()',
      'word_of_day_ensure(date)', 'word_of_day_state(uuid)',
    ]) {
      expect(weekMigration).toContain(`revoke all on function gamification_private.${helper} from public, anon, authenticated;`)
    }
    expect(weekMigration).toMatch(/'solution', case\s+when v_status = 'in_progress' then null/)
  })

  it('ne révèle la solution qu’une fois la partie terminée', () => {
    expect(migration).toMatch(/'solution', case\s+when v_status = 'in_progress' then null/)
  })
})

describe('mot de la semaine physio — aides d’affichage', () => {
  it('normalise les lettres saisies au clavier', () => {
    expect(normalizeLetter('é')).toBe('E')
    expect(normalizeLetter('ç')).toBe('C')
    expect(normalizeLetter('z')).toBe('Z')
    expect(normalizeLetter('1')).toBe('')
    expect(normalizeLetter('Enter')).toBe('')
    expect(normalizeLetter(' ')).toBe('')
  })

  it('garde le meilleur indice connu pour chaque lettre du clavier', () => {
    const marks = letterStates([
      { guess: 'TIBIA', feedback: 'APAAC' },
      { guess: 'IMAGE', feedback: 'CAPAA' },
    ])
    expect(marks).toMatchObject({ T: 'A', I: 'C', B: 'A', A: 'C', M: 'A', G: 'A', E: 'A' })
  })

  it('décrit un essai sans s’appuyer sur la couleur', () => {
    expect(describeAttempt({ guess: 'TOTAL', feedback: 'CPAPP' }, 1))
      .toBe('Essai 2 : T bien placée, O mal placée, T absente, A mal placée, L mal placée')
  })

  it('écrit la semaine en cours et le jour du mot suivant', () => {
    expect(weekRangeLabel('2026-11-09')).toBe('du 9 au 15 novembre')
    expect(weekRangeLabel('2026-11-30')).toBe('du 30 novembre au 6 décembre')
    expect(weekRangeLabel('2026-12-28')).toBe('du 28 décembre au 3 janvier')
    expect(nextWordLabel('2026-11-09')).toBe('lundi 16 novembre')
    expect(nextWordLabel('2026-12-28')).toBe('lundi 4 janvier')
    expect(weekRangeLabel('')).toBe('')
    expect(nextWordLabel(undefined)).toBe('')
    expect(weeksLabel(1)).toBe('1 semaine')
    expect(weeksLabel(3)).toBe('3 semaines')
  })

  it('propose les 26 lettres sur le clavier à l’écran', () => {
    expect([...KEYBOARD_ROWS.join('')].sort().join('')).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ')
  })
})

describe('mot de la semaine physio — partie', () => {
  let wrapper
  const render = async () => {
    wrapper = mount(WordOfDayView, {
      attachTo: document.body,
      global: { plugins: [[PrimeVue, { unstyled: true }]] },
    })
    await flushPromises()
    return wrapper
  }
  const key = (label) => wrapper.findAll('.wod-key').find((node) => node.attributes('aria-label') === label)
  const press = async (value) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true }))
    await flushPromises()
  }
  const currentLetters = () => wrapper.findAll('.wod-row.is-current .wod-tile__letter').map((node) => node.text()).join('')

  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocks.getMyWordOfDay.mockResolvedValue(state())
  })
  afterEach(() => {
    wrapper?.unmount()
    wrapper = null
    vi.restoreAllMocks()
  })

  it('affiche la grille de la semaine, sa durée de validité, le récapitulatif personnel et les règles', async () => {
    await render()
    expect(wrapper.get('h1').text()).toBe('Mot de la semaine physio')
    expect(wrapper.findAll('.wod-row')).toHaveLength(6)
    expect(wrapper.findAll('.wod-row')[0].findAll('.wod-tile')).toHaveLength(5)
    expect(wrapper.get('#wod-game-title').text()).toBe('Semaine du 9 au 15 novembre')
    expect(wrapper.get('.wod-game__validity').text()).toBe('Mot valable jusqu’à dimanche soir. Prochain mot : lundi 16 novembre.')
    expect(wrapper.get('.wod-game__head').text()).toContain('6 essais restants')
    const stats = wrapper.get('.wod-stats').text()
    expect(stats).toContain('Parties jouées4')
    expect(stats).toContain('Taux de réussite75 %')
    expect(stats).toContain('Série en cours2 semaines')
    expect(wrapper.text()).toContain('30 XP si vous trouvez le mot, 15 XP de plus en 3 essais ou moins')
    expect(wrapper.text()).toContain('Une partie par semaine')
    expect(wrapper.text()).not.toMatch(/mot du jour|demain/i)
  })

  it('accepte le clavier physique et le clavier à l’écran, accents compris', async () => {
    await render()
    await press('f')
    await press('é')
    await key('M').trigger('click')
    await press('1')
    expect(currentLetters()).toBe('FEM')
    await press('Backspace')
    expect(currentLetters()).toBe('FE')
    await key('Effacer la dernière lettre').trigger('click')
    expect(currentLetters()).toBe('F')
    expect(wrapper.get('.wod-row.is-current').attributes('aria-label')).toBe('Essai 1, en cours : lettres saisies F')
  })

  it('n’envoie pas un essai incomplet et l’annonce', async () => {
    await render()
    await press('f')
    await press('Enter')
    expect(mocks.submitMyWordOfDayGuess).not.toHaveBeenCalled()
    const status = wrapper.get('.wod-message')
    expect(status.attributes('role')).toBe('status')
    expect(status.attributes('aria-live')).toBe('polite')
    expect(status.text()).toBe('Il manque 4 lettres.')
  })

  it('laisse le serveur évaluer l’essai et double chaque couleur d’un repère lisible', async () => {
    mocks.submitMyWordOfDayGuess.mockResolvedValue(state({ attempts: [{ guess: 'MUFLE', feedback: 'PPPAP' }] }))
    await render()
    for (const letter of 'mufle') await press(letter)
    await press('Enter')

    expect(mocks.submitMyWordOfDayGuess).toHaveBeenCalledWith('MUFLE')
    const row = wrapper.findAll('.wod-row')[0]
    expect(row.attributes('aria-label')).toBe('Essai 1 : M mal placée, U mal placée, F mal placée, L absente, E mal placée')
    expect(row.findAll('.wod-tile.is-present')).toHaveLength(4)
    expect(row.findAll('.wod-tile.is-absent')).toHaveLength(1)
    expect(row.findAll('.wod-tile__mark')).toHaveLength(5)
    expect(key('L, absente').classes()).toContain('is-absent')
    expect(key('M, mal placée').find('.wod-key__mark').exists()).toBe(true)
    expect(wrapper.get('.wod-message').text()).toContain('Essai 1 : M mal placée')
    expect(wrapper.find('.wod-result').exists()).toBe(false)
    expect(currentLetters()).toBe('')
  })

  it('reprend une partie commencée', async () => {
    mocks.getMyWordOfDay.mockResolvedValue(state({
      attempts: [{ guess: 'TIBIA', feedback: 'AAAAA' }, { guess: 'MUFLE', feedback: 'PPPAP' }],
    }))
    await render()
    expect(wrapper.findAll('.wod-row')[1].attributes('aria-label')).toContain('Essai 2 : M mal placée')
    expect(wrapper.findAll('.wod-row')[2].classes()).toContain('is-current')
    expect(wrapper.get('.wod-game__head').text()).toContain('4 essais restants')
    expect(wrapper.get('.wod-message').text()).toBe('Partie reprise : 2 essais déjà joués.')
  })

  it('révèle le mot, sa définition et les XP attribués par le serveur une fois le mot trouvé', async () => {
    mocks.submitMyWordOfDayGuess.mockResolvedValue(state({
      attempts: [{ guess: 'FEMUR', feedback: 'CCCCC' }],
      status: 'won',
      xp_awarded: 45,
      solution: { word: 'Fémur', definition: 'Os de la cuisse.', theme: 'Os et repères osseux' },
      stats: { played: 5, won: 4, win_rate: 80, current_streak: 3, best_streak: 3 },
    }))
    await render()
    for (const letter of 'femur') await press(letter)
    await press('Enter')

    const result = wrapper.get('.wod-result')
    expect(result.text()).toContain('Trouvé en 1 essai')
    expect(result.text()).toContain('+45 XP pour vous et pour votre maison')
    expect(result.text()).toContain('Fémur')
    expect(result.text()).toContain('Os de la cuisse.')
    expect(result.text()).toContain('Le mot de la semaine')
    expect(result.text()).toContain('Un nouveau mot vous attend lundi 16 novembre.')
    expect(wrapper.find('.wod-keyboard').exists()).toBe(false)
    expect(wrapper.get('.wod-message').text()).toBe('Bravo, mot trouvé en 1 essai : Fémur. Vous gagnez 45 XP.')
    expect(wrapper.get('.wod-stats').text()).toContain('Série en cours3 semaines')

    await press('a')
    await press('Enter')
    expect(mocks.submitMyWordOfDayGuess).toHaveBeenCalledTimes(1)
  })

  it('montre la solution sans XP quand les six essais sont épuisés', async () => {
    mocks.getMyWordOfDay.mockResolvedValue(state({
      attempts: Array.from({ length: 6 }, () => ({ guess: 'TIBIA', feedback: 'AAAAA' })),
      status: 'lost',
      solution: { word: 'Fémur', definition: 'Os de la cuisse.', theme: 'Os et repères osseux' },
    }))
    await render()
    const result = wrapper.get('.wod-result')
    expect(result.text()).toContain('Ce sera pour la semaine prochaine')
    expect(result.text()).toContain('Fémur')
    expect(result.text()).not.toContain('XP')
    expect(wrapper.get('.wod-game__head').text()).toContain('partie terminée')
  })

  it('relit la partie auprès du serveur quand un essai est refusé', async () => {
    mocks.submitMyWordOfDayGuess.mockRejectedValue(new Error('Invalid guess'))
    await render()
    mocks.getMyWordOfDay.mockResolvedValue(state({ play_date: '2026-11-16', week_start: '2026-11-16', week_end: '2026-11-22', word_length: 6 }))
    for (const letter of 'femur') await press(letter)
    await press('Enter')

    expect(mocks.getMyWordOfDay).toHaveBeenCalledTimes(2)
    expect(wrapper.findAll('.wod-row')[0].findAll('.wod-tile')).toHaveLength(6)
    expect(wrapper.get('.wod-message').text()).toBe('Un nouveau mot de la semaine est disponible. La partie recommence.')
    expect(wrapper.get('#wod-game-title').text()).toBe('Semaine du 16 au 22 novembre')
  })

  it('explique que le jeu est réservé aux joueurs', async () => {
    mocks.getMyWordOfDay.mockResolvedValue({ eligible: false, reason: 'audience_restricted' })
    await render()
    expect(wrapper.text()).toContain('Jeu réservé aux joueurs')
    expect(wrapper.find('.wod-board').exists()).toBe(false)
    await press('a')
    expect(mocks.submitMyWordOfDayGuess).not.toHaveBeenCalled()
  })

  it('propose de réessayer quand le chargement échoue', async () => {
    mocks.getMyWordOfDay.mockRejectedValueOnce(new Error('réseau'))
    await render()
    expect(wrapper.text()).toContain('Le mot de la semaine n’a pas pu être chargé')
    await wrapper.findAll('button')
      .find((node) => node.attributes('label') === 'Réessayer' || node.text().includes('Réessayer'))
      .trigger('click')
    await flushPromises()
    expect(wrapper.find('.wod-board').exists()).toBe(true)
  })
})

describe('mot de la semaine physio — activation', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
    Object.assign(mocks.features, { wordOfDay: true })
  })

  it('ajoute une entrée dans l’espace jeux, masquée quand le module est désactivé', async () => {
    let hub = mount(GameView, { global: { plugins: [[PrimeVue, { unstyled: true }]] } })
    expect(hub.get('#word-of-day-title').text()).toBe('Mot de la semaine physio')
    await hub.get('button[aria-label="Jouer au mot de la semaine physio"]').trigger('click')
    expect(mocks.push).toHaveBeenCalledWith('/mot-de-la-semaine')
    hub.unmount()

    Object.assign(mocks.features, { wordOfDay: false })
    hub = mount(GameView, { global: { plugins: [[PrimeVue, { unstyled: true }]] } })
    expect(hub.find('#word-of-day-title').exists()).toBe(false)
    expect(hub.get('.games-empty').text()).toContain('Aucun jeu disponible pour le moment')
    hub.unmount()
  })

  it('protège la route par le réglage du module et l’authentification', () => {
    const routes = source('src/router/routes/apps.js')
    expect(routes).toContain("path: '/mot-de-la-semaine'")
    expect(routes).toContain("name: 'WordOfDayView', beforeEnter: featureGuard('wordOfDay'), meta: { requiresAuth: true, title: 'Mot de la semaine physio' }")
    // L'ancienne adresse renvoie vers la nouvelle.
    expect(routes).toContain("{ path: '/mot-du-jour', redirect: to => ({ path: '/mot-de-la-semaine', query: to.query, hash: to.hash }) }")
    expect(source('src/composables/useDynamicRoutes.js')).toContain("'WordOfDayView'")
    expect(source('src/views/apps/tools/GameView.vue')).toContain('v-if="gamificationFeatures.wordOfDay"')
  })

  it('lit le réglage VITE_GAMIFICATION_WORD_OF_DAY, activé en production et sur le site de test', () => {
    expect(source('src/config/gamificationFeatures.js'))
      .toContain('wordOfDay: isEnabled(import.meta.env.VITE_GAMIFICATION_WORD_OF_DAY)')
    const production = JSON.parse(source('scripts/deployment/production-features.json'))
    expect(production.VITE_GAMIFICATION_WORD_OF_DAY).toBe('true')
    expect(production.VITE_GAMIFICATION_GAMES_HUB).toBe('true')
    expect(source('deploy/staging/build-current-test.mjs')).toContain("VITE_GAMIFICATION_WORD_OF_DAY: 'true'")
    expect(source('.env.production.example')).toContain('VITE_GAMIFICATION_WORD_OF_DAY=false')
  })
})
