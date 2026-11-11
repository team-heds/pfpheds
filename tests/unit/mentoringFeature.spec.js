import { afterEach, describe, expect, it, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

vi.mock('@/supabase', () => ({ supabase: {} }))

const source = (path) => readFileSync(resolve(process.cwd(), path), 'utf8')
const migration = () => source('supabase/migrations/20261111130000_gamification_mentoring.sql')

describe('module Mentorat : activation', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('reste fermé tant que le réglage n’est pas activé', async () => {
    vi.stubEnv('VITE_GAMIFICATION_MENTORING', 'false')
    let routes = (await import('@/router/routes/profiles.js')).default
    let route = routes.find((item) => item.name === 'MentoringView')
    expect(route.path).toBe('/mentorat')
    expect(route.meta.requiresAuth).toBe(true)
    expect(route.beforeEnter()).toEqual({ path: '/outils', replace: true })

    vi.resetModules()
    vi.stubEnv('VITE_GAMIFICATION_MENTORING', 'true')
    routes = (await import('@/router/routes/profiles.js')).default
    route = routes.find((item) => item.name === 'MentoringView')
    expect(route.beforeEnter()).toBe(true)
  })

  it('est activé en production et désactivé par défaut ailleurs', () => {
    const production = JSON.parse(source('scripts/deployment/production-features.json'))
    expect(production.VITE_GAMIFICATION_MENTORING).toBe('true')
    expect(source('.env.production.example')).toContain('VITE_GAMIFICATION_MENTORING=false')
    expect(source('src/config/gamificationFeatures.js')).toContain('mentoring: isEnabled(import.meta.env.VITE_GAMIFICATION_MENTORING)')
  })

  it('n’apparaît dans la navigation que si le module est activé', async () => {
    vi.doMock('@/stores/authStore', () => ({ useAuthStore: () => ({}) }))
    vi.doMock('@/stores/userStore', () => ({ useUserStore: () => ({}) }))
    vi.doMock('@/stores/role', () => ({ useRoleStore: () => ({}) }))
    const { getNavigationDestinations } = await import('@/composables/useNavigationDestinations')
    const router = {
      resolve: (to) => ({ name: 'Any', matched: [{ meta: { requiresAuth: true } }], meta: { requiresAuth: true }, path: to }),
    }
    const context = { router, userId: 'u1', profile: {}, permissions: [], isAuthenticated: true, can: () => false }

    const keys = (features) => getNavigationDestinations({ ...context, features }).map((item) => item.key)
    expect(keys({ mentoring: false })).not.toContain('mentoring')
    expect(keys({ mentoring: true })).toContain('mentoring')
    expect(source('src/components/social/library/LeftSidebar.vue')).toContain('v-if="mentoringEnabled"')
  })
})

describe('module Mentorat : contrat de la migration', () => {
  it('active la RLS et interdit toute écriture directe du navigateur', () => {
    const sql = migration()
    expect(sql).toContain('alter table public.mentoring_slots enable row level security')
    expect(sql).toContain('alter table public.mentoring_bookings enable row level security')
    expect(sql).toContain('revoke all on table public.mentoring_slots from public, anon, authenticated')
    expect(sql).toContain('revoke all on table public.mentoring_bookings from public, anon, authenticated')
    expect(sql).not.toMatch(/grant\s+[^;]*(insert|update|delete)[^;]*on table public\.mentoring_/i)
    expect(sql).not.toMatch(/to anon/i)
  })

  it('réserve le détail d’une réservation au mentor et à l’étudiant', () => {
    const sql = migration()
    expect(sql).toContain('using (mentee_id = (select auth.uid()) or mentor_id = (select auth.uid()))')
    const publicList = sql.slice(sql.indexOf('function public.get_mentoring_slots()'), sql.indexOf('function public.get_my_mentoring_slots()'))
    expect(publicList).not.toMatch(/message|mentee_id\s*,/)
  })

  it('garantit une seule réservation par créneau et des points décidés par le serveur', () => {
    const sql = migration()
    expect(sql).toMatch(/create unique index if not exists mentoring_bookings_one_active_per_slot[\s\S]*where status = 'active'/)
    expect(sql).toContain('for update')
    expect(sql).toContain('gamification_private.is_rollout_member(p_user_id)')
    expect(sql).toContain('if v_rewarded >= 2 then')
    expect(sql).toMatch(/gamification_award_xp_internal\(\s*p_user_id,\s*'MENTORING_SESSION',\s*30,/)
    expect(sql).toContain("'mentoring:' || p_booking_id::text")
    expect(sql).toContain('if v_booking.mentor_confirmed_at is null or v_booking.mentee_confirmed_at is null then')
  })

  it('ne redéfinit aucune fonction existante et ne supprime rien', () => {
    const sql = migration()
    const functions = [...sql.matchAll(/create or replace function ([\w.]+)\(/g)].map((match) => match[1])
    expect(functions.length).toBeGreaterThan(0)
    for (const name of functions) expect(name).toMatch(/mentoring/)
    expect(sql).not.toMatch(/^\s*drop\s/im)
  })

  it('versionne un test d’isolation transactionnel', () => {
    const test = source('supabase/tests/gamification_mentoring_isolation.sql')
    expect(test).toContain('begin;')
    expect(test).toContain('rollback;')
    expect(test).toContain('set local role authenticated;')
    expect(test).toContain('third party reads % booking rows')
    expect(test).toContain('weekly cap not applied')
  })
})
