import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'

const migration = readFileSync(path.resolve(process.cwd(), 'supabase/migrations/20261126120000_secure_si_teacher_workload.sql'), 'utf8')
const isolationTest = readFileSync(path.resolve(process.cwd(), 'supabase/tests/si_teacher_workload_isolation.sql'), 'utf8')

describe('SI teacher workload access contract', () => {
  it('exposes a zero-argument RPC scoped by auth.uid and an active teacher role', () => {
    expect(migration).toMatch(/get_my_si_workload_slots\(\)/)
    expect(migration).toMatch(/current_user_id\s+uuid\s*:=\s*\(select auth\.uid\(\)\)/i)
    expect(migration).toMatch(/public\.app_is_si_teacher\(\)/)
    expect(migration).toMatch(/revoke all on function public\.get_my_si_workload_slots\(\) from public, anon/i)
    expect(migration).toMatch(/grant execute on function public\.get_my_si_workload_slots\(\) to authenticated, service_role/i)
    expect(migration).not.toMatch(/get_my_si_workload_slots\([^)]*p_[^)]*\)/i)
  })

  it('removes direct anonymous and authenticated SELECT access to planning slots', () => {
    expect(migration).toMatch(/revoke select on table public\.planning_time_slots from anon, authenticated/i)
    expect(migration).toMatch(/grant select on table public\.planning_time_slots to service_role/i)
  })

  it('checks that another teacher row is hidden and non-teachers are denied in SQL isolation coverage', () => {
    expect(isolationTest).toContain('where id = 9641002')
    expect(isolationTest).toContain('teacher one received teacher two slot')
    expect(isolationTest).toContain('non-teacher was able to call personal workload RPC')
  })
})
