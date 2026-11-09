import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'

const directory = new URL('./', import.meta.url)
const endpoint = (process.env.HEDS_STAGING_URL || 'http://127.0.0.1:8180').replace(/\/$/, '')
assert.equal(endpoint, 'http://127.0.0.1:8180', 'Cette recette doit utiliser le tunnel de test')

const env = Object.fromEntries((await fs.readFile(new URL('.env', directory), 'utf8'))
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('#'))
  .map(line => {
    const separator = line.indexOf('=')
    return [line.slice(0, separator), line.slice(separator + 1)]
  }))

const service = createClient(endpoint, env.STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})
const student = createClient(endpoint, env.STAGING_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})
const email = `student.si.remediation.${Date.now()}@example.invalid`
const password = `Test-${crypto.randomUUID()}!`
let userId = null

async function expectForbidden(path, init = {}) {
  const { data: sessionData } = await student.auth.getSession()
  const response = await fetch(`${endpoint}/api/si/planning-remediations${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${sessionData.session.access_token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {})
    }
  })
  const payload = await response.json()
  assert.equal(response.status, 403, `${init.method || 'GET'} ${path} devait être refusé: ${JSON.stringify(payload)}`)
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
    role: 'EtudiantSoins',
    is_active: true,
    permissions: []
  })
  if (profileError) throw profileError

  const { error: loginError } = await student.auth.signInWithPassword({ email, password })
  if (loginError) throw loginError

  await expectForbidden('/history?limit=5')
  await expectForbidden('', {
    method: 'POST',
    body: JSON.stringify({
      slotId: 4560,
      category: 'course',
      expectedValue: { id: null },
      replacementValue: { id: crypto.randomUUID() },
      reason: 'Cette tentative étudiante doit être refusée.'
    })
  })
  await expectForbidden(`/${crypto.randomUUID()}/revert`, { method: 'POST' })

  console.log(JSON.stringify({
    environment: 'test',
    role: 'EtudiantSoins',
    historyDenied: true,
    applyDenied: true,
    revertDenied: true,
    productionTouched: false
  }, null, 2))
} finally {
  await student.auth.signOut().catch(() => {})
  if (userId) {
    await service.from('user_profiles').delete().eq('user_id', userId)
    await service.auth.admin.deleteUser(userId)
  }
}
