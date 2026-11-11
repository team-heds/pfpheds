import { beforeEach, describe, expect, it, vi } from 'vitest'

const backend = vi.hoisted(() => ({ rpc: vi.fn(), from: vi.fn() }))
vi.mock('@/supabase', () => ({ supabase: backend }))

import {
  combineDateAndTime,
  describeConfirmation,
  filterSlots,
  groupSlotsByDay,
  mentoringErrorMessage,
  mentoringService,
  mySlotPhase,
  normalizeTags,
  slotFilterOptions,
  validateSlotDraft,
} from '@/service/mentoringServiceSupabase'

const at = (iso) => new Date(iso)
const slot = (overrides = {}) => ({
  slot_id: 's1',
  starts_at: '2026-11-20T09:00:00',
  ends_at: '2026-11-20T10:00:00',
  tags: ['anatomie'],
  mentor_classe: 'BA24',
  is_booked: false,
  booked_by_me: false,
  ...overrides,
})

describe('mentorat : appels au serveur', () => {
  beforeEach(() => {
    backend.rpc.mockReset()
    backend.from.mockReset()
  })

  it('propose un créneau sans jamais envoyer d’identité ni de points', async () => {
    backend.rpc.mockResolvedValue({ data: 'slot-id', error: null })
    const id = await mentoringService.createSlot({
      start: at('2026-11-20T09:00:00Z'),
      end: at('2026-11-20T10:00:00Z'),
      location: 'Cafétéria HEdS',
      topics: 'Anatomie',
      tags: ['Anatomie', ' anatomie ', 'Examens', ''],
      note: '  ',
    })

    expect(id).toBe('slot-id')
    expect(backend.rpc).toHaveBeenCalledWith('create_mentoring_slot', {
      p_starts_at: '2026-11-20T09:00:00.000Z',
      p_ends_at: '2026-11-20T10:00:00.000Z',
      p_location: 'Cafétéria HEdS',
      p_topics: 'Anatomie',
      p_tags: ['anatomie', 'examens'],
      p_note: null,
    })
    const params = JSON.stringify(backend.rpc.mock.calls[0][1])
    expect(params).not.toMatch(/user|mentor_id|xp/i)
  })

  it('réserve, annule et confirme par l’identifiant du créneau seulement', async () => {
    backend.rpc.mockResolvedValue({ data: null, error: null })
    await mentoringService.bookSlot('s1', '  Bonjour ')
    await mentoringService.cancelBooking('s1')
    await mentoringService.cancelSlot('s1')
    await mentoringService.adminRemoveSlot('s1', 'Hors sujet')

    expect(backend.rpc.mock.calls).toEqual([
      ['book_mentoring_slot', { p_slot_id: 's1', p_message: 'Bonjour' }],
      ['cancel_mentoring_booking', { p_slot_id: 's1' }],
      ['cancel_mentoring_slot', { p_slot_id: 's1' }],
      ['admin_remove_mentoring_slot', { p_slot_id: 's1', p_reason: 'Hors sujet' }],
    ])

    backend.rpc.mockResolvedValue({ data: { status: 'completed', xp_gained: 30 }, error: null })
    expect(await mentoringService.confirmSession('s1')).toEqual({ status: 'completed', xp_gained: 30 })
    expect(backend.rpc).toHaveBeenLastCalledWith('confirm_mentoring_session', { p_slot_id: 's1' })
  })

  it('traduit les refus du serveur en messages compréhensibles', async () => {
    backend.rpc.mockResolvedValue({ data: null, error: { message: 'mentoring_slot_taken' } })
    await expect(mentoringService.bookSlot('s1')).rejects.toThrow('Ce créneau vient d’être réservé par quelqu’un d’autre.')

    expect(mentoringErrorMessage({ message: 'mentoring_own_slot' })).toContain('votre propre créneau')
    expect(mentoringErrorMessage({ message: 'mentoring_session_not_finished' })).toContain('après l’heure de fin')
    expect(mentoringErrorMessage({ message: 'permission denied for table x' })).toContain('momentanément indisponible')
  })

  it('ne lit que ses propres notifications de mentorat', async () => {
    const query = {}
    for (const method of ['select', 'eq', 'like', 'order']) query[method] = vi.fn(() => query)
    query.limit = vi.fn().mockResolvedValue({ data: [{ id: 'n1' }], error: null })
    backend.from.mockReturnValue(query)

    expect(await mentoringService.listNotifications('user-1')).toEqual([{ id: 'n1' }])
    expect(backend.from).toHaveBeenCalledWith('push_outbox')
    expect(query.eq).toHaveBeenCalledWith('user_id', 'user-1')
    expect(query.like).toHaveBeenCalledWith('url', '/mentorat%')
    expect(await mentoringService.listNotifications(null)).toEqual([])
  })
})

describe('mentorat : formulaire', () => {
  const now = at('2026-11-11T12:00:00')
  const draft = (overrides = {}) => ({
    date: new Date(2026, 10, 20),
    startTime: '09:00',
    endTime: '10:00',
    location: 'Cafétéria HEdS',
    topics: 'Anatomie du membre inférieur',
    tags: ['Anatomie'],
    note: '',
    ...overrides,
  })

  it('assemble la date et l’heure locales', () => {
    expect(combineDateAndTime(new Date(2026, 10, 20), '14:30')).toEqual(new Date(2026, 10, 20, 14, 30))
    expect(combineDateAndTime(new Date(2026, 10, 20), '25:00')).toBeNull()
    expect(combineDateAndTime(null, '14:30')).toBeNull()
  })

  it('accepte un créneau complet et nettoie les étiquettes', () => {
    const check = validateSlotDraft(draft({ tags: ['Anatomie', 'anatomie', ' Examens '] }), now)
    expect(check.valid).toBe(true)
    expect(check.tags).toEqual(['anatomie', 'examens'])
    expect(normalizeTags(['', '  ', 'PFP'])).toEqual(['pfp'])
  })

  it('refuse un créneau passé, trop court, trop long ou incomplet', () => {
    expect(validateSlotDraft(draft({ date: new Date(2026, 10, 10) }), now).errors.start).toBeTruthy()
    expect(validateSlotDraft(draft({ endTime: '09:10' }), now).errors.end).toBeTruthy()
    expect(validateSlotDraft(draft({ endTime: '14:00' }), now).errors.end).toBeTruthy()
    expect(validateSlotDraft(draft({ endTime: '08:00' }), now).errors.end).toBeTruthy()
    expect(validateSlotDraft(draft({ location: ' ' }), now).errors.location).toBeTruthy()
    expect(validateSlotDraft(draft({ topics: 'a' }), now).errors.topics).toBeTruthy()
    expect(validateSlotDraft(draft({ tags: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] }), now).errors.tags).toBeTruthy()
  })
})

describe('mentorat : liste et filtres', () => {
  const slots = [
    slot(),
    slot({ slot_id: 's2', starts_at: '2026-11-20T14:00:00', tags: ['examens'], mentor_classe: 'BA25' }),
    slot({ slot_id: 's3', starts_at: '2026-11-21T09:00:00', is_booked: true }),
    slot({ slot_id: 's4', starts_at: '2026-11-22T09:00:00', is_booked: true, booked_by_me: true, mentor_classe: null }),
  ]

  it('montre par défaut les créneaux libres et ceux que j’ai réservés', () => {
    expect(filterSlots(slots).map((item) => item.slot_id)).toEqual(['s1', 's2', 's4'])
    expect(filterSlots(slots, { includeBooked: true })).toHaveLength(4)
  })

  it('filtre par sujet, classe du mentor et date', () => {
    expect(filterSlots(slots, { tag: 'examens' }).map((item) => item.slot_id)).toEqual(['s2'])
    expect(filterSlots(slots, { classe: 'BA24' }).map((item) => item.slot_id)).toEqual(['s1'])
    expect(filterSlots(slots, { date: new Date(2026, 10, 20) }).map((item) => item.slot_id)).toEqual(['s1', 's2'])
    expect(slotFilterOptions(slots)).toEqual({ tags: ['anatomie', 'examens'], classes: ['BA24', 'BA25'] })
  })

  it('regroupe les créneaux par jour', () => {
    const days = groupSlotsByDay(slots)
    expect(days.map((day) => day.key)).toEqual(['2026-11-20', '2026-11-21', '2026-11-22'])
    expect(days[0].slots).toHaveLength(2)
  })
})

describe('mentorat : étapes de mes créneaux', () => {
  const row = (overrides = {}) => ({
    slot_status: 'booked',
    booking_id: 'b1',
    booking_status: 'active',
    starts_at: '2026-11-20T09:00:00',
    ends_at: '2026-11-20T10:00:00',
    my_confirmed_at: null,
    completed_at: null,
    ...overrides,
  })

  it('suit le créneau de la réservation à la confirmation', () => {
    expect(mySlotPhase(row({ slot_status: 'open', booking_id: null, booking_status: null }), at('2026-11-19T09:00:00'))).toBe('open')
    expect(mySlotPhase(row({ slot_status: 'open', booking_id: null, booking_status: null }), at('2026-11-21T09:00:00'))).toBe('expired')
    expect(mySlotPhase(row(), at('2026-11-19T09:00:00'))).toBe('upcoming')
    expect(mySlotPhase(row(), at('2026-11-20T09:30:00'))).toBe('in_progress')
    expect(mySlotPhase(row(), at('2026-11-20T10:01:00'))).toBe('to_confirm')
    expect(mySlotPhase(row({ my_confirmed_at: '2026-11-20T10:05:00' }), at('2026-11-20T11:00:00'))).toBe('waiting_other')
    expect(mySlotPhase(row({ completed_at: '2026-11-20T10:05:00' }), at('2026-11-20T11:00:00'))).toBe('completed')
    expect(mySlotPhase(row(), at('2026-12-10T09:00:00'))).toBe('confirmation_closed')
  })

  it('distingue les annulations et les retraits', () => {
    expect(mySlotPhase(row({ slot_status: 'cancelled' }))).toBe('cancelled')
    expect(mySlotPhase(row({ slot_status: 'removed' }))).toBe('removed')
    expect(mySlotPhase(row({ slot_status: 'open', booking_status: 'cancelled' }))).toBe('booking_cancelled')
  })

  it('explique le résultat d’une confirmation', () => {
    expect(describeConfirmation({ status: 'waiting_other' }).detail).toContain('dès que l’autre personne')
    expect(describeConfirmation({ status: 'completed', xp_gained: 30 }).summary).toBe('Rencontre confirmée : +30 XP')
    expect(describeConfirmation({ status: 'completed', xp_gained: 0, reason: 'weekly_cap' }).detail).toContain('2 rencontres récompensées')
    expect(describeConfirmation({ status: 'completed', xp_gained: 0, reason: 'not_player' }).detail).toContain('aucun point')
  })
})
