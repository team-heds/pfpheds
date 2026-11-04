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
const accounts = JSON.parse(await fs.readFile(new URL('test-accounts.json', directory), 'utf8'))
const account = accounts.find(item => item.email === 'admin.test@example.invalid')
assert.ok(account?.email && account?.password, 'Compte admin.test incomplet')

const service = createClient(endpoint, env.STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})
const browser = createClient(endpoint, env.STAGING_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const { data: listed, error: listError } = await service.auth.admin.listUsers({ page: 1, perPage: 1000 })
if (listError) throw listError
let authUser = listed.users.find(user => user.email?.toLowerCase() === account.email.toLowerCase())
if (authUser) {
  const { data, error } = await service.auth.admin.updateUserById(authUser.id, {
    password: account.password,
    email_confirm: true
  })
  if (error) throw error
  authUser = data.user
} else {
  const { data, error } = await service.auth.admin.createUser({
    email: account.email,
    password: account.password,
    email_confirm: true
  })
  if (error) throw error
  authUser = data.user
}

const { error: upsertError } = await service.from('user_profiles').upsert({
  user_id: authUser.id,
  email: account.email,
  role: 'admin',
  is_active: true,
  permissions: ['admin', 'AdminSoins', 'page2.access']
})
if (upsertError) throw upsertError

const { data: profile, error: profileError } = await service
  .from('user_profiles')
  .select('role,is_active,permissions')
  .eq('user_id', authUser.id)
  .single()
if (profileError) throw profileError
assert.equal(profile.is_active, true)
assert.ok(
  String(profile.role || '').toLowerCase() === 'admin' ||
  (Array.isArray(profile.permissions) && profile.permissions.some(value => ['admin', 'AdminSoins', 'page2.access'].includes(value))),
  'Le compte admin.test ne possède pas les droits administrateur attendus'
)

const { error: loginError } = await browser.auth.signInWithPassword({
  email: account.email,
  password: account.password
})
if (loginError) throw loginError
await browser.auth.signOut()

console.log(JSON.stringify({
  environment: 'test',
  account: account.email,
  passwordRealigned: true,
  loginVerified: true,
  productionTouched: false
}, null, 2))
