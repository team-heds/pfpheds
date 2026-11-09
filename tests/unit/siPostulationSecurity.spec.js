import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { SI_POSTULATION_ACCESS } from '@/config/siAccess'

const root = process.cwd()
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

describe('HEDS25-628 SI postulation access matrix', () => {
  it('does not let every authenticated user enter the postulation route', () => {
    const routes = read('src/router/routes/admin.js')
    const route = routes.match(/\{ path: '\/admin\/soins-infirmiers\/cours-postulation'.+\}/)?.[0] || ''

    expect(route).toContain('SI_POSTULATION_ACCESS')
    expect(route).not.toContain("'authenticated'")
    expect(SI_POSTULATION_ACCESS).toEqual(expect.arrayContaining(['admin', 'RMSoins', 'EnseignantSoins']))
    expect(SI_POSTULATION_ACCESS).not.toContain('authenticated')
  })

  it('ties browser votes to the Supabase user and the explicit teacher role', () => {
    const view = read('src/views/admin/soins-infirmiers/SIPostulationCoursesView.vue')

    expect(view).toContain("roleStore.perms.includes('EnseignantSoins')")
    expect(view).toContain("roleStore.can('AdminSoins')")
    expect(view).toContain('!canManageVotes.value')
    expect(view).not.toContain("const canVote = computed(() => Boolean(currentUserId.value) && roleStore.can('EnseignantSoins'))")
    expect(view).toContain("return !byId.error && byId.data?.id === authId ? authId : null")
    expect(view).not.toContain(".select('profile_id')")
  })

  it('replaces global vote reads with operation-specific RLS policies', () => {
    const migration = read('supabase/migrations/20260929094941_secure_si_postulation_votes.sql')

    expect(migration).toContain('drop policy if exists planning_slot_votes_select_auth')
    expect(migration).toContain('create policy planning_slot_votes_select_scoped')
    expect(migration).toContain('create policy planning_slot_votes_insert_own')
    expect(migration).toContain('create policy planning_slot_votes_update_own')
    expect(migration).toContain('create policy planning_slot_votes_delete_scoped')
    expect(migration).toContain('revoke all on table public.planning_slot_votes from anon, authenticated')
    expect(migration).not.toMatch(/for select[\s\S]{0,80}using \(true\)/i)
  })
})
