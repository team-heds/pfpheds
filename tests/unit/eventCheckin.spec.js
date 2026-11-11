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
vi.mock('vue-router', () => ({
  useRoute: () => route,
  useRouter: () => ({ push, replace, back: vi.fn() }),
}))
vi.mock('@/config/gamificationFeatures', () => ({
  gamificationFeatures: { userJourney: true, eventCheckin: true },
}))
vi.mock('@/components/common/utils/Navbar.vue', () => ({ default: { template: '<nav />' } }))

import {
  attendanceToCsv,
  buildScanUrl,
  configureEventCheckin,
  describeScanResult,
  extractScanCode,
  redeemScanCode,
} from '@/service/eventCheckinService'
import ScanCodeView from '@/views/apps/scan/ScanCodeView.vue'
import EventCheckinPanel from '@/components/events/EventCheckinPanel.vue'

const read = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const TOKEN = '0123456789abcdef0123456789abcdef'

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
  InputNumber: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template: '<input type="number" :value="modelValue" @input="$emit(\'update:modelValue\', Number($event.target.value))" />',
  },
  GamificationPageHeader: { template: '<header />' },
  QrCodeScanner: { template: '<div class="scanner-stub" />' },
  EventCheckinPresenter: { props: ['visible'], template: '<div class="presenter-stub" :data-visible="visible" />' },
}

describe('codes de scan', () => {
  it('construit le lien du QR code vers la page de scan', () => {
    expect(buildScanUrl(TOKEN, 'https://hedsvs.ch')).toBe(`https://hedsvs.ch/scan?c=${TOKEN}`)
  })

  it('reconnaît le lien de la plateforme, le jeton brut et le code court', () => {
    expect(extractScanCode(`https://hedsvs.ch/scan?c=${TOKEN}`)).toBe(TOKEN)
    expect(extractScanCode(TOKEN.toUpperCase())).toBe(TOKEN)
    expect(extractScanCode(' abc-234 ')).toBe('ABC234')
    expect(extractScanCode('https://hedsvs.ch/scan?c=abc234')).toBe('ABC234')
  })

  it('refuse les QR codes étrangers et les saisies invalides', () => {
    expect(extractScanCode('https://exemple.ch/promo')).toBeNull()
    expect(extractScanCode(`https://hedsvs.ch/autre?c=${TOKEN}`)).toBeNull()
    expect(extractScanCode('javascript:alert(1)')).toBeNull()
    expect(extractScanCode('ABC10O')).toBeNull() // 0, 1, O et I n'existent pas dans les codes courts
    expect(extractScanCode('')).toBeNull()
  })
})

describe('validation côté serveur', () => {
  beforeEach(() => vi.clearAllMocks())

  it('envoie uniquement le code : ni utilisateur, ni points, ni événement', async () => {
    rpc.mockResolvedValue({ data: { status: 'ok', xp_gained: 30 }, error: null })

    await expect(redeemScanCode(`https://hedsvs.ch/scan?c=${TOKEN}`)).resolves.toMatchObject({ status: 'ok' })
    expect(rpc).toHaveBeenCalledTimes(1)
    expect(rpc).toHaveBeenCalledWith('redeem_scan_code', { p_code: TOKEN })
  })

  it('n’appelle pas le serveur pour un QR code étranger', async () => {
    await expect(redeemScanCode('https://exemple.ch')).resolves.toEqual({ status: 'foreign' })
    expect(rpc).not.toHaveBeenCalled()
  })

  it('transforme une panne réseau en message, sans exception', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'network' } })
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await redeemScanCode(TOKEN)
    expect(result).toEqual({ status: 'error' })
    expect(describeScanResult(result).title).toBe('Validation impossible')
  })

  it('règle les points de l’événement par la fonction serveur', async () => {
    rpc.mockResolvedValue({ data: { xp_reward: 45 }, error: null })
    await configureEventCheckin('event-1', 45.4)
    expect(rpc).toHaveBeenCalledWith('configure_event_checkin', { p_event_id: 'event-1', p_xp_reward: 45 })
  })
})

describe('messages de résultat', () => {
  it('annonce les points gagnés', () => {
    const message = describeScanResult({ status: 'ok', xp_gained: 30, event: { title: 'Conférence' } })
    expect(message).toMatchObject({ success: true, severity: 'success', title: 'Présence enregistrée : +30 XP', eventTitle: 'Conférence' })
  })

  it('confirme la présence sans points pour un compte hors gamification', () => {
    const message = describeScanResult({ status: 'ok', xp_gained: 0 })
    expect(message.title).toBe('Présence enregistrée')
    expect(message.detail).toContain('ne vous rapporte pas de points')
  })

  it.each([
    ['expired', 'Code expiré'],
    ['already', 'Présence déjà enregistrée'],
    ['event_ended', 'Événement terminé'],
    ['event_not_started', 'Événement pas encore commencé'],
    ['event_unavailable', 'Événement indisponible'],
    ['invalid', 'Code non reconnu'],
    ['rate_limited', 'Trop d’essais'],
    ['foreign', 'QR code non reconnu'],
  ])('explique le refus « %s »', (status, title) => {
    expect(describeScanResult({ status }).title).toBe(title)
  })

  it('retombe sur un message générique pour un statut inconnu', () => {
    expect(describeScanResult({ status: 'inattendu' }).title).toBe('Validation impossible')
    expect(describeScanResult(null).title).toBe('Validation impossible')
  })
})

describe('export de la liste des présents', () => {
  it('produit un CSV lisible par Excel et neutralise les formules', () => {
    const csv = attendanceToCsv([
      { display_name: 'Paul "Polo" Joueur', classe: 'BA25', redeemed_at: null, method: 'qr', xp_awarded: 30 },
      { display_name: '=HYPERLINK("x")', classe: null, redeemed_at: null, method: 'code', xp_awarded: 0 },
    ])
    const lines = csv.split('\r\n')
    expect(lines[0]).toBe('"Nom";"Classe";"Heure de validation";"Mode";"Points attribués"')
    expect(lines[1]).toBe('"Paul ""Polo"" Joueur";"BA25";"";"QR code";"30"')
    expect(lines[2]).toBe('"\'=HYPERLINK(""x"")";"";"";"Code saisi";"0"')
  })
})

describe('page de scan', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.query = {}
  })

  const mountView = () => mount(ScanCodeView, { global: { stubs } })

  it('valide automatiquement le code du lien puis le retire de l’adresse', async () => {
    route.query = { c: TOKEN }
    rpc.mockImplementation((name) => Promise.resolve({
      data: name === 'redeem_scan_code'
        ? { status: 'ok', xp_gained: 30, event: { title: 'Conférence de rentrée' } }
        : [],
      error: null,
    }))

    const wrapper = mountView()
    await flushPromises()

    expect(replace).toHaveBeenCalledWith({ path: '/scan' })
    expect(rpc).toHaveBeenCalledWith('redeem_scan_code', { p_code: TOKEN })
    expect(wrapper.get('[role="status"].scan-result').text()).toContain('Présence enregistrée : +30 XP')
    expect(wrapper.text()).toContain('Conférence de rentrée')
  })

  it('affiche un refus clair pour un code expiré', async () => {
    route.query = { c: TOKEN }
    rpc.mockImplementation((name) => Promise.resolve({
      data: name === 'redeem_scan_code' ? { status: 'expired' } : [],
      error: null,
    }))

    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.get('[role="alert"].scan-result').text()).toContain('Code expiré')
  })

  it('n’ouvre l’appareil photo qu’à la demande et propose la saisie du code court', async () => {
    rpc.mockResolvedValue({ data: [], error: null })
    const wrapper = mountView()
    await flushPromises()

    expect(wrapper.find('.scanner-stub').exists()).toBe(false)
    await wrapper.findAll('button').find((button) => button.text() === 'Scanner un QR code').trigger('click')
    expect(wrapper.find('.scanner-stub').exists()).toBe(true)

    await wrapper.get('#scan-short-code').setValue('abc')
    await wrapper.get('form').trigger('submit')
    expect(wrapper.get('#scan-short-code-error').text()).toContain('6 lettres ou chiffres')
    expect(rpc).not.toHaveBeenCalledWith('redeem_scan_code', expect.anything())

    await wrapper.get('#scan-short-code').setValue('abc 234')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(rpc).toHaveBeenCalledWith('redeem_scan_code', { p_code: 'ABC234' })
  })

  it('liste les présences de la personne connectée', async () => {
    rpc.mockResolvedValue({
      data: [
        { event_id: 'e1', title: 'Atelier épaule', lieu: 'Salle 12', start_date: '2026-11-12T09:00:00Z', xp_awarded: 30 },
        { event_id: 'e2', title: 'Conférence', lieu: null, start_date: '2026-11-10T09:00:00Z', xp_awarded: 0 },
      ],
      error: null,
    })
    const wrapper = mountView()
    await flushPromises()

    const items = wrapper.findAll('.attendance-list li')
    expect(items).toHaveLength(2)
    expect(items[0].text()).toContain('Atelier épaule')
    expect(items[0].text()).toContain('+30 XP')
    expect(items[1].text()).toContain('Présent·e')
  })
})

describe('bloc présence de la fiche événement', () => {
  beforeEach(() => vi.clearAllMocks())

  const mountPanel = () => mount(EventCheckinPanel, {
    props: { event: { id: 'event-1', title: 'Conférence' } },
    global: { stubs },
  })

  it('réserve le bouton du QR code aux organisateurs désignés par le serveur', async () => {
    rpc.mockResolvedValue({ data: { found: true, can_manage: false, state: 'open', my_attendance: null }, error: null })
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.text()).not.toContain('Afficher le QR code de présence')
    expect(wrapper.text()).toContain('Scanner un QR code')
  })

  it('enregistre les points modifiés avant d’afficher le QR code', async () => {
    rpc.mockImplementation((name) => Promise.resolve({
      data: name === 'get_event_checkin_overview'
        ? { found: true, can_manage: true, state: 'open', xp_reward: 30, attendee_count: 2 }
        : { xp_reward: 50 },
      error: null,
    }))
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.text()).toContain('2 présents')
    await wrapper.get('input[type="number"]').setValue(50)
    await wrapper.findAll('button').find((button) => button.text() === 'Afficher le QR code de présence').trigger('click')
    await flushPromises()

    expect(rpc).toHaveBeenCalledWith('configure_event_checkin', { p_event_id: 'event-1', p_xp_reward: 50 })
    expect(wrapper.get('.presenter-stub').attributes('data-visible')).toBe('true')
  })

  it('reste discret quand le module n’est pas installé côté serveur', async () => {
    rpc.mockResolvedValue({ data: null, error: { message: 'function does not exist' } })
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const wrapper = mountPanel()
    await flushPromises()

    expect(wrapper.find('section').exists()).toBe(false)
  })
})

describe('garde-fous du module', () => {
  const migration = read('supabase/migrations/20261111140000_gamification_event_checkin.sql')

  it('est branché derrière son réglage, activé en production', () => {
    expect(read('src/config/gamificationFeatures.js')).toContain('eventCheckin: isEnabled(import.meta.env.VITE_GAMIFICATION_EVENT_CHECKIN)')
    expect(JSON.parse(read('scripts/deployment/production-features.json')).VITE_GAMIFICATION_EVENT_CHECKIN).toBe('true')
    expect(read('src/router/routes/apps.js')).toContain("path: '/scan'")
    expect(read('src/router/routes/apps.js')).toContain("beforeEnter: featureGuard('eventCheckin')")
  })

  it('ne laisse aucun accès direct aux tables et active la RLS partout', () => {
    for (const table of ['event_checkin_settings', 'scan_codes', 'scan_redemptions', 'scan_attempts']) {
      expect(migration).toContain(`alter table gamification_private.${table} enable row level security;`)
      expect(migration).toContain(`revoke all on gamification_private.${table} from public, anon, authenticated;`)
    }
    expect(migration).not.toMatch(/grant\s+[^;]*\bto\s+anon/i)
  })

  it('attribue les points par le moteur serveur, réservés aux joueurs', () => {
    expect(migration).toContain('public.gamification_award_xp_internal(')
    expect(migration).toContain('gamification_private.is_rollout_member(v_user_id)')
    expect(migration).toContain("'event-checkin:' || v_event.id::text")
    expect(migration).toContain('constraint scan_redemptions_once_per_subject unique (subject_key, user_id)')
    expect(migration).toContain("check (kind in ('event_attendance', 'treasure_hunt'))")
  })

  it('ne calcule aucun point dans le navigateur', () => {
    for (const file of [
      'src/service/eventCheckinService.js',
      'src/views/apps/scan/ScanCodeView.vue',
      'src/components/events/EventCheckinPresenter.vue',
      'src/components/scan/QrCodeScanner.vue',
    ]) {
      const source = read(file)
      expect(source).not.toContain('record_my_gamification_action')
      expect(source).not.toMatch(/from\(['"](xp_history|gamification_data)['"]\)/)
    }
  })

  it('autorise l’appareil photo sur le site lui-même dans la configuration versionnée', () => {
    expect(read('firebase.json')).toContain('camera=(self)')
  })
})
