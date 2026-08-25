import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const migrationPath = resolve(
  process.cwd(),
  'supabase/migrations/20260825144046_resolve_legacy_profile_ids.sql'
)
const migration = readFileSync(migrationPath, 'utf8')

describe('resolve legacy profile migration', () => {
  it('résout les identifiants historiques sans contourner les autorisations', () => {
    expect(migration).toContain('(select auth.uid()) is not null')
    expect(migration).toContain('profile.firebase_id = btrim(p_target_identifier)')
    expect(migration).toContain('public.app_can_view_user_profile(profile.user_id)')
  })

  it('ne rend pas la fonction accessible aux visiteurs anonymes', () => {
    expect(migration).toContain(
      'revoke all on function public.resolve_accessible_user_profile_id(text) from public, anon'
    )
    expect(migration).toContain(
      'grant execute on function public.resolve_accessible_user_profile_id(text) to authenticated, service_role'
    )
  })
})
