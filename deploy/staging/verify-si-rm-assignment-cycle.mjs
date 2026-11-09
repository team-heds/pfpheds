import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const directory = new URL('./', import.meta.url)
const endpoint = (process.env.HEDS_STAGING_URL || 'https://test.hedsvs.ch').replace(/\/$/, '')
assert.ok(['https://test.hedsvs.ch', 'http://localhost:8180'].includes(endpoint), `Environnement refusé: ${endpoint}`)
const startedAt = new Date().toISOString()
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
assert.equal(saved.url, 'https://test.hedsvs.ch', 'Les comptes doivent provenir de la base de test')

function client(key) {
  return createClient(endpoint, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

async function signIn(account) {
  const supabase = client(env.STAGING_ANON_KEY)
  const { data, error } = await supabase.auth.signInWithPassword({
    email: account.email,
    password: account.password
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
assert.ok(slot?.id, 'Un créneau de postulation de recette est requis')

let assignmentId = null
try {
  await service.from('planning_slot_votes').delete().eq('slot_id', slot.id).eq('teacher_id', teacherId)

  const { error: voteError } = await teacher
    .from('planning_slot_votes')
    .insert({ slot_id: slot.id, teacher_id: teacherId })
  if (voteError) throw voteError

  const { data: assignment, error: assignmentError } = await rm.rpc('assign_si_postulation_teachers', {
    p_slot_id: slot.id,
    p_teacher_ids: [teacherId]
  })
  if (assignmentError) throw assignmentError
  assignmentId = assignment.assignment_id
  assert.ok(assignmentId)

  const { data: assignedSlot, error: assignedSlotError } = await service
    .from('planning_time_slots')
    .select('teachers')
    .eq('id', slot.id)
    .single()
  if (assignedSlotError) throw assignedSlotError
  assert.ok(assignedSlot.teachers.includes(saved.accounts.teacher.email))

  const { count: votesAfterAssignment, error: assignedVotesError } = await service
    .from('planning_slot_votes')
    .select('*', { count: 'exact', head: true })
    .eq('slot_id', slot.id)
  if (assignedVotesError) throw assignedVotesError
  assert.equal(votesAfterAssignment, 0)

  const { data: undoResult, error: undoError } = await rm.rpc('undo_si_postulation_assignment', {
    p_assignment_id: assignmentId
  })
  if (undoError) throw undoError
  assert.equal(undoResult.status, 'undone')
  assert.equal(undoResult.restored_voter_count, 1)

  const { data: restoredSlot, error: restoredSlotError } = await service
    .from('planning_time_slots')
    .select('teachers')
    .eq('id', slot.id)
    .single()
  if (restoredSlotError) throw restoredSlotError
  assert.deepEqual(restoredSlot.teachers, slot.teachers)

  const { data: restoredVotes, error: restoredVotesError } = await service
    .from('planning_slot_votes')
    .select('teacher_id')
    .eq('slot_id', slot.id)
    .eq('teacher_id', teacherId)
  if (restoredVotesError) throw restoredVotesError
  assert.equal(restoredVotes.length, 1)

  console.log(JSON.stringify({
    environment: 'test',
    moduleCode: saved.moduleAssignment.moduleCode,
    slotId: slot.id,
    rmAssignmentSecured: true,
    votesClearedAtomically: true,
    undoRestoredTeachers: true,
    undoRestoredVotes: true,
    productionTouched: false
  }, null, 2))
} finally {
  await service.from('planning_slot_votes').delete().eq('slot_id', slot.id).eq('teacher_id', teacherId)
  if (assignmentId) {
    await service.from('si_postulation_assignment_history').delete().eq('id', assignmentId)
  }
  await service.from('planning_history').delete().eq('slot_id', slot.id).gte('changed_at', startedAt)
  await Promise.allSettled([teacher.auth.signOut(), rm.auth.signOut()])
}
