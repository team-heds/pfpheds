import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const { rpc, getUser } = vi.hoisted(() => ({
  rpc: vi.fn(),
  getUser: vi.fn(),
}))

vi.mock('@/supabase', () => ({
  supabase: { rpc, auth: { getUser } },
}))

import { useDailyWheelStore } from '@/stores/dailyWheelStore'

describe('roue quotidienne Supabase', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
    getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } })
  })

  it('envoie uniquement le spin et l’option au validateur serveur', async () => {
    rpc.mockResolvedValue({ data: { correct: true, xp_added: 10 }, error: null })
    const store = useDailyWheelStore()

    await expect(store.submitQuizAnswer('spin-1', 'sion')).resolves.toMatchObject({ correct: true })
    expect(rpc).toHaveBeenCalledWith('submit_daily_wheel_quiz', {
      p_spin_id: 'spin-1',
      p_answer_id: 'sion',
    })
  })

  it('conserve le quiz en attente afin de pouvoir le reprendre après rechargement', async () => {
    rpc.mockResolvedValue({
      data: {
        can_spin: false,
        last_spin_id: 'spin-pending',
        last_result_type: 'QUIZ_EASY',
        quiz_status: 'pending',
        last_result: { question: { prompt: 'Question', options: { a: 'A' } } },
      },
      error: null,
    })
    const store = useDailyWheelStore()

    await store.checkStatus()

    expect(store.canSpin).toBe(false)
    expect(store.lastSpinId).toBe('spin-pending')
    expect(store.lastResultType).toBe('QUIZ_EASY')
    expect(store.quizStatus).toBe('pending')
  })

  it('ne décide jamais la correction ou le montant XP dans le navigateur', () => {
    const modal = readFileSync(
      resolve(process.cwd(), 'src/components/gamification/daily/DailyWheelModal.vue'),
      'utf8',
    )
    const migration = readFileSync(
      resolve(process.cwd(), 'supabase/migrations/20260831171500_secure_daily_wheel_quiz.sql'),
      'utf8',
    )

    expect(modal).not.toMatch(/handleQuizAnswer\((true|false)\)/)
    expect(modal).not.toContain('Simulation MVP')
    expect(migration).toContain("statement_timestamp() at time zone 'Europe/Zurich'")
    expect(migration).toContain('on conflict (user_id, spin_date) do nothing')
    expect(migration).toContain("'daily-wheel-quiz:' || v_spin.id::text")
    expect(migration).toContain("where feature_key = 'daily_wheel'")
    expect(migration).toContain("raise exception 'FEATURE_DISABLED'")
    expect(migration).toContain('revoke all on public.daily_wheel_spins from anon, authenticated')
    expect(migration).toContain('grant select on public.daily_wheel_spins to authenticated')
  })
})
