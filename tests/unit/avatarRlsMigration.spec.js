import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('migration RLS avatar', () => {
  it("limite l'UPDATE du profil à son propriétaire", () => {
    const migrationPath = resolve(
      'supabase/migrations/20260824134735_allow_users_to_update_own_avatar.sql'
    )
    const sql = readFileSync(migrationPath, 'utf8')

    expect(sql).toContain('FOR UPDATE')
    expect(sql).toContain('TO authenticated')
    expect(sql).toMatch(/USING\s*\([\s\S]*\(SELECT auth\.uid\(\)\) = user_id[\s\S]*app_is_privileged/i)
    expect(sql).toMatch(/WITH CHECK\s*\([\s\S]*\(SELECT auth\.uid\(\)\) = user_id[\s\S]*app_is_privileged/i)
    expect(sql).toContain('DROP POLICY IF EXISTS "user_profiles_admin_update"')
    expect(sql).not.toMatch(/USING\s*\(true\)/i)
  })

  it("versionne un test transactionnel propriétaire contre autre utilisateur", () => {
    const testPath = resolve('supabase/tests/avatar_rls_isolation.sql')
    const sql = readFileSync(testPath, 'utf8')

    expect(sql).toContain('BEGIN;')
    expect(sql).toContain('ROLLBACK;')
    expect(sql).toContain('SET LOCAL ROLE authenticated;')
    expect(sql).toContain('WHERE user_id = auth.uid()')
    expect(sql).toContain("WHERE user_id = current_setting('heds_test.other_uid')::uuid")
    expect(sql).toContain('IF own_updates <> 1')
    expect(sql).toContain('IF other_updates <> 0')
  })
})
