import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const migration = readFileSync(
  resolve('supabase/migrations/20260825143000_secure_global_search_profiles.sql'),
  'utf8',
)

describe('HEDS25-589 Supabase migration', () => {
  it('limite la recherche aux profils autorisés sans exposer les emails', () => {
    expect(migration).toContain('public.app_can_view_user_profile(profile.user_id)')
    expect(migration).not.toMatch(/returns table[\s\S]*?email\s+text/i)
  })

  it('verrouille les RPC puis les accorde aux seuls utilisateurs authentifiés', () => {
    expect(migration).toContain('security definer')
    expect(migration).toContain('set search_path = pg_catalog, public')
    expect(migration).toContain('revoke all on function public.search_accessible_user_profiles')
    expect(migration).toContain('grant execute on function public.search_accessible_user_profiles(text, integer) to authenticated, service_role')
  })
})
