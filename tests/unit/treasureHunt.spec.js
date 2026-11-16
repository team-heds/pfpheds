import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const { rpc, push, replace, route } = vi.hoisted(() => ({
  rpc: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(() => Promise.resolve()),
  route: { path: '/scan', query: {} },
}))

vi.mock('@/supabase', () => ({ supabase: { rpc } }))
vi.mock('@/supabase.js', () => ({ supabase: { rpc } }))
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push, replace, back: vi.fn() }),
}))
vi.mock('@/config/gamificationFeatures', () => ({
  gamificationFeatures: { userJourney: true, eventCheckin: true, treasureHunt: true },
}))
vi.mock('@/components/common/utils/Navbar.vue', () => ({ default: { template: '<nav />' } }))

import { describeScanResult } from '@/service/eventCheckinService'
import {
  describeTreasureResult,
  formatHuntPeriod,
  moveItem,
  progressLabel,
  progressPercent,
  retryHint,
  saveTreasureHunt,
  treasureErrorMessage,
} from '@/service/treasureHuntService'
import { buildQuickTiles } from '@/mobile/search/searchHelpers'
import TreasureHuntPlayView from '@/views/apps/treasure/TreasureHuntPlayView.vue'
import ScanCodeView from '@/views/apps/scan/ScanCodeView.vue'

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const TOKEN = '0123456789abcdef0123456789abcdef'
const HUNT_ID = '9eb300ec-2efc-441f-ac8e-1219d1a38deb'
const hunt = { id: HUNT_ID, title: 'Chasse de rentrée' }

const stubs = {
  Button: {
    props: ['label', 'disabled'],
    emits: ['click'],
    template: '<button type="button" :disabled="disabled" @click="$emit(\'click\')">{{ label }}</button>',
  },
  InputText: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
  Tag: { props: ['value'], template: '<span class="tag">{{ value }}</span>' },
  GamificationPageHeader: { props: ['title'], template: '<header>{{ title }}<slot name="actions" /></header>' },
  QrCodeScanner: { template: '<div class="scanner-stub" />' },
}

describe('messages de scan de la chasse au trésor', () => {
  it('annonce les points de l’étape et la progression', () => {
    const message = describeScanResult({
      status: 'ok', kind: 'treasure_hunt', hunt, step: { name: 'Bibliothèque', position: 1 },
      found: 1, total: 3, xp_gained: 10, bonus_xp: 0, completed: false,
    })
    expect(message.success).toBe(true)
    expect(message.title).toBe('Étape trouvée : +10 XP')
    expect(message.detail).toContain('Bibliothèque : 1 sur 3 trouvée.')
    expect(message.huntId).toBe(HUNT_ID)
    expect(message.eventTitle).toBe('Chasse de rentrée')
  })

  it('annonce le bonus quand toutes les étapes sont trouvées', () => {
    const message = describeTreasureResult({
      status: 'ok', kind: 'treasure_hunt', hunt, found: 3, total: 3, xp_gained: 20, bonus_xp: 20, completed: true,
    })
    expect(message.icon).toBe('pi pi-trophy')
    expect(message.detail).toContain('bonus de +20 XP')
    expect(message.xp).toBe(40)
  })

  it.each([
    ['already', 'Étape déjà trouvée'],
    ['code_revoked', 'QR code désactivé'],
    ['not_eligible', 'Chasse réservée à d’autres classes'],
    ['hunt_not_started', 'Chasse pas encore commencée'],
    ['hunt_ended', 'Chasse terminée'],
    ['hunt_unavailable', 'Chasse indisponible'],
  ])('traduit le statut %s', (status, title) => {
    expect(describeScanResult({ status, kind: 'treasure_hunt', hunt }).title).toBe(title)
  })

  it('explique l’ordre imposé', () => {
    const message = describeScanResult({ status: 'order_required', kind: 'treasure_hunt', hunt, expected_position: 2 })
    expect(message.success).toBe(false)
    expect(message.detail).toContain('trouvez d’abord l’étape 2')
  })

  it('garde les messages de présence pour les autres codes', () => {
    expect(describeScanResult({ status: 'already', kind: 'event_attendance' }).title).toBe('Présence déjà enregistrée')
    expect(describeScanResult({ status: 'invalid' }).title).toBe('Code non reconnu')
  })

  it('indique l’heure à laquelle réessayer après trop de codes faux', () => {
    const retryAt = new Date(2026, 10, 16, 14, 35).toISOString()
    expect(retryHint(retryAt)).toBe('Vous pourrez réessayer vers 14:35.')
    expect(describeScanResult({ status: 'rate_limited', retry_at: retryAt }).detail).toBe('Vous pourrez réessayer vers 14:35.')
    expect(retryHint(null)).toBe('Patientez avant de réessayer.')
  })
})

describe('outils de la chasse', () => {
  it('écrit la progression', () => {
    expect(progressLabel(3, 8)).toBe('3 sur 8 trouvées')
    expect(progressLabel(1, 8)).toBe('1 sur 8 trouvée')
    expect(progressPercent(3, 8)).toBe(38)
    expect(progressPercent(0, 0)).toBe(0)
  })

  it('écrit la période', () => {
    const period = formatHuntPeriod(new Date(2026, 10, 16, 8, 0), new Date(2026, 10, 30, 18, 0))
    expect(period).toBe('Du 16 novembre à 08:00 au 30 novembre à 18:00')
  })

  it('déplace une étape sans sortir de la liste', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c'])
    expect(moveItem(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c'])
  })

  it('ne montre que les refus rédigés par le serveur', () => {
    expect(treasureErrorMessage({ code: 'P0001', message: 'Une étape rapporte entre 5 et 50 XP.' })).toBe('Une étape rapporte entre 5 et 50 XP.')
    expect(treasureErrorMessage({ code: '42501', message: 'permission denied' })).toBe('L’opération a échoué. Réessayez.')
  })

  it('envoie les dates au serveur au format ISO', async () => {
    rpc.mockResolvedValueOnce({ data: { id: HUNT_ID }, error: null })
    await saveTreasureHunt({ title: 'Test', starts_at: new Date('2026-11-16T08:00:00Z'), ends_at: new Date('2026-11-30T18:00:00Z'), target_classes: ['BA25'], ordered: true })
    expect(rpc).toHaveBeenLastCalledWith('save_treasure_hunt', expect.objectContaining({
      p_hunt_id: null, p_starts_at: '2026-11-16T08:00:00.000Z', p_target_classes: ['BA25'], p_ordered: true,
    }))
  })

  it('a sa tuile dans l’accès rapide mobile quand le module est actif', () => {
    expect(buildQuickTiles({ features: { treasureHunt: true } }).some((tile) => tile.to === '/chasse-au-tresor')).toBe(true)
    expect(buildQuickTiles({ features: {} }).some((tile) => tile.key === 'treasure')).toBe(false)
  })
})

describe('écran de jeu', () => {
  const detail = {
    found: true,
    can_manage: false,
    hunt: { id: HUNT_ID, title: 'Chasse de rentrée', description: '', state: 'open', ordered: true, completion_bonus: 20, starts_at: '2026-11-16T08:00:00Z', ends_at: '2026-11-30T18:00:00Z' },
    steps: [
      { position: 1, name: 'Bibliothèque', hint: 'Là où dorment les livres.', found: true, locked: false, xp_reward: 10, xp_awarded: 10 },
      { position: 2, name: null, hint: 'Là où l’on prend un café.', found: false, locked: false, xp_reward: 15 },
      { position: 3, name: null, hint: null, found: false, locked: true, xp_reward: 20 },
    ],
    completed_at: null,
    ranking: { player_count: 1, me: { rank: 1, found: 1, points: 10 }, players: [{ rank: 1, name: 'Paul J.', found: 1, points: 10, is_me: true }], houses: [{ name: 'Harmonis', points: 10, players: 1, color: '#10b981' }] },
  }

  beforeEach(() => {
    rpc.mockReset()
    push.mockReset()
  })

  it('montre la progression, les indices dévoilés et le classement', async () => {
    rpc.mockResolvedValue({ data: detail, error: null })
    const wrapper = mount(TreasureHuntPlayView, { props: { id: HUNT_ID }, global: { stubs } })
    await flushPromises()

    expect(rpc).toHaveBeenCalledWith('get_treasure_hunt', { p_hunt_id: HUNT_ID })
    expect(wrapper.text()).toContain('1 sur 3 trouvée')
    expect(wrapper.text()).toContain('Étape 1 · Bibliothèque')
    expect(wrapper.text()).toContain('Là où l’on prend un café.')
    expect(wrapper.text()).toContain('Indice révélé après l’étape précédente.')
    expect(wrapper.text()).toContain('Harmonis')
    expect(wrapper.text()).toContain('Paul J. (vous)')
  })

  it('valide un code saisi et recharge la progression', async () => {
    rpc.mockImplementation((name) => Promise.resolve({
      data: name === 'redeem_scan_code'
        ? { status: 'ok', kind: 'treasure_hunt', hunt, step: { name: 'Cafétéria', position: 2 }, found: 2, total: 3, xp_gained: 15 }
        : detail,
      error: null,
    }))
    const wrapper = mount(TreasureHuntPlayView, { props: { id: HUNT_ID }, global: { stubs } })
    await flushPromises()

    await wrapper.find('input').setValue('abc-234')
    await wrapper.find('form').trigger('submit')
    await flushPromises()

    expect(rpc).toHaveBeenCalledWith('redeem_scan_code', { p_code: 'ABC234' })
    expect(wrapper.text()).toContain('Étape trouvée : +15 XP')
    expect(rpc.mock.calls.filter(([name]) => name === 'get_treasure_hunt')).toHaveLength(2)
  })

  it('n’ouvre pas le scanner sur une chasse terminée', async () => {
    rpc.mockResolvedValue({ data: { ...detail, hunt: { ...detail.hunt, state: 'ended' } }, error: null })
    const wrapper = mount(TreasureHuntPlayView, { props: { id: HUNT_ID }, global: { stubs } })
    await flushPromises()
    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).toContain('Cette chasse est terminée')
  })
})

describe('page de scan', () => {
  it('propose d’ouvrir la chasse après un QR code de la chasse au trésor', async () => {
    route.query = { c: TOKEN }
    rpc.mockImplementation((name) => Promise.resolve({
      data: name === 'redeem_scan_code'
        ? { status: 'ok', kind: 'treasure_hunt', hunt, step: { name: 'Bibliothèque', position: 1 }, found: 1, total: 3, xp_gained: 10 }
        : [],
      error: null,
    }))
    const wrapper = mount(ScanCodeView, { global: { stubs } })
    await flushPromises()

    expect(wrapper.text()).toContain('Étape trouvée : +10 XP')
    const button = wrapper.findAll('button').find((item) => item.text() === 'Voir la chasse')
    expect(button).toBeTruthy()
    await button.trigger('click')
    expect(push).toHaveBeenCalledWith(`/chasse-au-tresor/${HUNT_ID}`)
    route.query = {}
  })
})

describe('garde-fous du module', () => {
  const migration = read('supabase/migrations/20261116100000_gamification_treasure_hunt.sql')

  it('est branché derrière son réglage, désactivé en production tant que la migration n’y est pas', () => {
    expect(read('src/config/gamificationFeatures.js')).toContain('treasureHunt: isEnabled(import.meta.env.VITE_GAMIFICATION_TREASURE_HUNT)')
    expect(JSON.parse(read('scripts/deployment/production-features.json')).VITE_GAMIFICATION_TREASURE_HUNT).toBe('false')
    const routes = read('src/router/routes/apps.js')
    for (const path of ['/chasse-au-tresor', '/chasse-au-tresor/gestion', '/chasse-au-tresor/gestion/:id', '/chasse-au-tresor/gestion/:id/impression', '/chasse-au-tresor/:id']) {
      expect(routes).toContain(`path: '${path}'`)
    }
    expect(routes.match(/featureGuard\('treasureHunt'\)/g)).toHaveLength(5)
  })

  it('réutilise les codes génériques et protège ses tables', () => {
    expect(migration).not.toMatch(/create table if not exists gamification_private\.\w*codes/)
    expect(migration).toContain("'treasure_hunt'")
    for (const table of ['treasure_hunts', 'treasure_hunt_steps', 'treasure_hunt_completions']) {
      expect(migration).toContain(`alter table gamification_private.${table} enable row level security;`)
      expect(migration).toContain(`revoke all on gamification_private.${table} from public, anon, authenticated;`)
    }
    expect(migration).not.toMatch(/grant\s+[^;]*\bto\s+anon/i)
  })

  it('donne les points côté serveur, une fois par étape, et limite les codes inconnus', () => {
    expect(migration).toContain('public.gamification_award_xp_internal(')
    expect(migration).toContain("'treasure-hunt-complete:' || v_hunt.id::text")
    expect(migration).toContain("a.outcome = 'invalid'")
    expect(migration).toContain("interval '1 hour'")
  })
})
