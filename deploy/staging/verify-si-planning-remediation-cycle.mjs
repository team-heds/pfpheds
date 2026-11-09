import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const directory = new URL('./', import.meta.url)
const endpoint = (process.env.HEDS_STAGING_URL || 'http://127.0.0.1:8180').replace(/\/$/, '')
assert.ok(['https://test.hedsvs.ch', 'http://127.0.0.1:8180'].includes(endpoint), `Environnement refusé: ${endpoint}`)

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

const service = createClient(endpoint, env.STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})
const browserClient = createClient(endpoint, env.STAGING_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})
const email = `admin.si.remediation.${Date.now()}@example.invalid`
const password = `Test-${crypto.randomUUID()}!`
const slotId = 9639002
let userId = null
let historyId = null

async function api(path, init = {}) {
  const { data: sessionData } = await browserClient.auth.getSession()
  const response = await fetch(`${endpoint}/api/si/planning-remediations${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {})
    }
  })
  const payload = await response.json()
  assert.ok(response.ok, `${response.status}: ${JSON.stringify(payload)}`)
  return payload
}

try {
  const { data: created, error: createError } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  })
  if (createError) throw createError
  userId = created.user.id

  const { error: profileError } = await service.from('user_profiles').upsert({
    user_id: userId,
    email,
    role: 'AdminSoins',
    is_active: true,
    permissions: []
  })
  if (profileError) throw profileError

  const { error: slotError } = await service.from('planning_time_slots').insert({
    id: slotId,
    class_code: 'BAC99',
    week_number: 40,
    day: 'lundi',
    day_index: 0,
    module_code: 'HEDS25-639',
    course_title: 'Créneau de recette correction',
    teachers: ['Enseignant Test'],
    room: null,
    start_time: '08:00',
    end_time: '09:00'
  })
  if (slotError) throw slotError

  const { error: loginError } = await browserClient.auth.signInWithPassword({ email, password })
  if (loginError) throw loginError

  await api('/history?limit=5')
  const applied = await api('', {
    method: 'POST',
    body: JSON.stringify({
      slotId,
      category: 'room',
      expectedValue: { value: null },
      replacementValue: { value: 'A101' },
      reason: 'Salle vérifiée pendant la recette automatisée.'
    })
  })
  historyId = applied.remediation.historyId
  assert.ok(historyId)

  const { data: changed } = await service.from('planning_time_slots').select('room').eq('id', slotId).single()
  assert.equal(changed.room, 'A101')

  const reverted = await api(`/${historyId}/revert`, { method: 'POST' })
  assert.equal(reverted.remediation.status, 'reverted')
  const { data: restored } = await service.from('planning_time_slots').select('room').eq('id', slotId).single()
  assert.equal(restored.room, null)

  console.log(JSON.stringify({
    environment: 'test',
    authenticatedApi: true,
    applyAtomic: true,
    historyRecorded: true,
    revertRestoredExactValue: true,
    productionTouched: false
  }, null, 2))
} finally {
  await browserClient.auth.signOut().catch(() => {})
  if (historyId) await service.from('si_planning_remediation_history').delete().eq('id', historyId)
  await service.from('planning_time_slots').delete().eq('id', slotId)
  if (userId) {
    await service.from('user_profiles').delete().eq('user_id', userId)
    await service.auth.admin.deleteUser(userId)
  }
}
