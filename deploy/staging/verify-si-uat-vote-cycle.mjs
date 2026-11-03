import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const directory = new URL('./', import.meta.url)
const endpoint = (process.env.HEDS_STAGING_URL || 'https://test.hedsvs.ch').replace(/\/$/, '')
const allowedEndpoints = new Set(['https://test.hedsvs.ch', 'http://localhost:8180'])
if (!allowedEndpoints.has(endpoint)) throw new Error(`Environnement refusé: ${endpoint}`)

const env = Object.fromEntries(
  (await fs.readFile(new URL('.env', directory), 'utf8'))
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const separator = line.indexOf('=')
      return [line.slice(0, separator), line.slice(separator + 1)]
    })
)
const saved = JSON.parse(await fs.readFile(new URL('si-uat-accounts.json', directory), 'utf8'))
assert.equal(saved.url, endpoint, 'Les comptes doivent correspondre à la base de test ciblée')

function client(key) {
  return createClient(endpoint, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function signIn(account) {
  const supabase = client(env.STAGING_ANON_KEY)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  })
  if (error) throw error
  assert.equal(data.user.id, account.userId)
  return supabase
}

const service = client(env.STAGING_SERVICE_ROLE_KEY)
const teacher = await signIn(saved.accounts.teacher)
const rm = await signIn(saved.accounts.rm)
const teacherId = saved.accounts.teacher.userId

const { data: slots, error: slotsError } = await service
  .from('planning_time_slots')
  .select('id,module_code,teachers')
  .eq('module_code', saved.moduleAssignment.moduleCode)
  .limit(1000)
if (slotsError) throw slotsError
const slot = slots?.find(item => Array.isArray(item.teachers)
  && item.teachers.some(value => String(value).toLowerCase().includes('postul')))
assert.ok(slot?.id, 'Un créneau de postulation attribué au RM de recette est requis')

let cleanupRequired = false
try {
  const { error: staleCleanupError } = await service
    .from('planning_slot_votes')
    .delete()
    .eq('slot_id', slot.id)
    .eq('teacher_id', teacherId)
  if (staleCleanupError) throw staleCleanupError

  const { data: beforeRows, error: beforeError } = await rm
    .from('planning_slot_votes')
    .select('slot_id,teacher_id')
    .eq('slot_id', slot.id)
  if (beforeError) throw beforeError

  const { error: insertError } = await teacher
    .from('planning_slot_votes')
    .insert({ slot_id: slot.id, teacher_id: teacherId })
  if (insertError) throw insertError
  cleanupRequired = true

  const { data: teacherRows, error: teacherReadError } = await teacher
    .from('planning_slot_votes')
    .select('slot_id,teacher_id')
    .eq('slot_id', slot.id)
  if (teacherReadError) throw teacherReadError
  assert.equal(teacherRows.length, 1, 'L’enseignant doit voir exactement son vote')
  assert.equal(teacherRows[0].teacher_id, teacherId)

  const { data: rmRows, error: rmReadError } = await rm
    .from('planning_slot_votes')
    .select('slot_id,teacher_id')
    .eq('slot_id', slot.id)
  if (rmReadError) throw rmReadError
  assert.equal(rmRows.length, beforeRows.length + 1, 'Le RM doit voir le nouveau vote sur son module')
  assert.ok(rmRows.some(row => row.teacher_id === teacherId), 'Le RM ne voit pas le vote de recette')

  const { error: deleteError } = await teacher
    .from('planning_slot_votes')
    .delete()
    .eq('slot_id', slot.id)
    .eq('teacher_id', teacherId)
  if (deleteError) throw deleteError
  cleanupRequired = false

  const { data: afterRows, error: afterError } = await rm
    .from('planning_slot_votes')
    .select('slot_id,teacher_id')
    .eq('slot_id', slot.id)
  if (afterError) throw afterError
  assert.equal(afterRows.length, beforeRows.length, 'Le retrait doit restaurer le nombre de votes initial')
  assert.ok(!afterRows.some(row => row.teacher_id === teacherId), 'Le vote de recette doit être supprimé')

  console.log(JSON.stringify({
    environment: 'test',
    moduleCode: saved.moduleAssignment.moduleCode,
    slotId: slot.id,
    initialVoteCount: beforeRows.length,
    voteCreatedByTeacher: true,
    voteVisibleToAssignedRm: true,
    voteRemovedByTeacher: true,
    finalVoteCount: afterRows.length,
    testResidue: false,
    productionTouched: false,
  }, null, 2))
} finally {
  if (cleanupRequired) {
    await service
      .from('planning_slot_votes')
      .delete()
      .eq('slot_id', slot.id)
      .eq('teacher_id', teacherId)
  }
  await Promise.allSettled([teacher.auth.signOut(), rm.auth.signOut()])
}
