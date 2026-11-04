import fs from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const directory = new URL('./', import.meta.url)
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

const endpoint = process.env.HEDS_STAGING_URL || 'http://localhost:8180'
const credentialsFile = new URL('gamification-pilot-accounts.json', directory)
const accountDefinitions = [
  {
    key: 'admin',
    email: 'admin.gamification.pilot@example.invalid',
    forname: 'Admin',
    familyName: 'Pilote',
    displayName: 'TEST ADMIN GAMIFICATION',
    role: 'admin',
    permissions: ['admin'],
  },
  {
    key: 'student',
    email: 'student.gamification.pilot@example.invalid',
    forname: 'Étudiant',
    familyName: 'Pilote',
    displayName: 'TEST ÉTUDIANT GAMIFICATION',
    role: 'etudiant',
    permissions: ['student'],
  },
]

if (!env.STAGING_SERVICE_ROLE_KEY) {
  throw new Error('STAGING_SERVICE_ROLE_KEY is unavailable')
}

const supabase = createClient(endpoint, env.STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

let saved = { url: 'https://test.hedsvs.ch', accounts: {} }
try {
  saved = JSON.parse(await fs.readFile(credentialsFile, 'utf8'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
})
if (listError) throw listError

for (const definition of accountDefinitions) {
  let user = usersPage.users.find(item => item.email === definition.email)
  let password = saved.accounts?.[definition.key]?.password

  if (!password) password = randomBytes(24).toString('base64url')

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: definition.email,
      password,
      email_confirm: true,
      user_metadata: {
        forname: definition.forname,
        family_name: definition.familyName,
      },
    })
    if (error) throw error
    user = data.user
  } else if (!saved.accounts?.[definition.key]?.password) {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      password,
      email_confirm: true,
    })
    if (error) throw error
  }

  const { error: profileError } = await supabase.from('user_profiles').upsert({
    user_id: user.id,
    email: definition.email,
    forname: definition.forname,
    family_name: definition.familyName,
    display_name: definition.displayName,
    role: definition.role,
    is_active: true,
    permissions: definition.permissions,
  })
  if (profileError) throw profileError

  saved.accounts[definition.key] = {
    email: definition.email,
    password,
    userId: user.id,
  }
}

await fs.writeFile(credentialsFile, `${JSON.stringify(saved, null, 2)}\n`, {
  mode: 0o600,
})
await fs.chmod(credentialsFile, 0o600)

console.log(JSON.stringify({
  accountsReady: accountDefinitions.length,
  roles: accountDefinitions.map(account => account.key),
  credentialsFile: 'deploy/staging/gamification-pilot-accounts.json',
  secretsPrinted: false,
  emailsSent: false,
}))
