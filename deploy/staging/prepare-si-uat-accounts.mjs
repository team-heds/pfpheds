import fs from 'node:fs/promises'
import { randomBytes } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const directory = new URL('./', import.meta.url)
const allowedEndpoints = new Set([
  'https://test.hedsvs.ch',
  'http://localhost:8180',
])
const endpoint = (process.env.HEDS_STAGING_URL || 'https://test.hedsvs.ch').replace(/\/$/, '')

if (!allowedEndpoints.has(endpoint)) {
  throw new Error(`Refus de cibler un environnement non-test: ${endpoint}`)
}

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

if (!env.STAGING_SERVICE_ROLE_KEY) {
  throw new Error('STAGING_SERVICE_ROLE_KEY est indisponible')
}

const credentialsFile = new URL('si-uat-accounts.json', directory)
const accountDefinitions = [
  {
    key: 'rm',
    email: 'rm.si.uat@example.invalid',
    forname: 'RM',
    familyName: 'Recette SI',
    displayName: 'TEST RM SOINS',
    role: 'RMSoins',
    permissions: ['RMSoins'],
  },
  {
    key: 'teacher',
    email: 'teacher.si.uat@example.invalid',
    forname: 'Enseignant',
    familyName: 'Recette SI',
    displayName: 'TEST ENSEIGNANT SOINS',
    role: 'EnseignantSoins',
    permissions: ['EnseignantSoins'],
  },
]

const supabase = createClient(endpoint, env.STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})

let saved = { url: endpoint, accounts: {}, moduleAssignment: null }
try {
  saved = JSON.parse(await fs.readFile(credentialsFile, 'utf8'))
  if (saved.url !== endpoint) {
    throw new Error(`Le fichier de recette appartient à un autre environnement: ${saved.url}`)
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}

const { data: usersPage, error: listError } = await supabase.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
})
if (listError) throw listError

for (const definition of accountDefinitions) {
  if (!definition.email.endsWith('@example.invalid')) {
    throw new Error(`Adresse de recette non sûre: ${definition.key}`)
  }

  let user = usersPage.users.find(item => item.email === definition.email)
  let password = saved.accounts?.[definition.key]?.password
  if (!password) password = randomBytes(24).toString('base64url')

  const authAttributes = {
    email: definition.email,
    email_confirm: true,
    user_metadata: {
      forname: definition.forname,
      family_name: definition.familyName,
    },
    app_metadata: {
      role: definition.role,
      permissions: definition.permissions,
      test_account: true,
    },
  }

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      ...authAttributes,
      password,
    })
    if (error) throw error
    user = data.user
  } else {
    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      ...authAttributes,
      ...(!saved.accounts?.[definition.key]?.password ? { password } : {}),
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

  if (definition.key === 'teacher') {
    const { error: teacherProfileError } = await supabase.from('profiles').upsert({
      id: user.id,
      name: definition.displayName,
      role: 'enseignant',
    })
    if (teacherProfileError) throw teacherProfileError
  }

  saved.accounts[definition.key] = {
    email: definition.email,
    password,
    userId: user.id,
    role: definition.role,
  }
}

const { data: slots, error: slotsError } = await supabase
  .from('planning_time_slots')
  .select('id,module_code,teachers')
  .not('module_code', 'is', null)
  .limit(10000)
if (slotsError) throw slotsError

const postulationCounts = new Map()
for (const slot of slots || []) {
  const isPostulation = Array.isArray(slot.teachers)
    && slot.teachers.some(value => String(value).toLowerCase().includes('postul'))
  if (!isPostulation || !slot.module_code) continue
  postulationCounts.set(slot.module_code, (postulationCounts.get(slot.module_code) || 0) + 1)
}

const preferredModuleCode = saved.moduleAssignment?.moduleCode
  || [...postulationCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0]
if (!preferredModuleCode) {
  throw new Error('Aucun module avec créneau de postulation trouvé sur la base de test')
}

const { data: moduleRow, error: moduleError } = await supabase
  .from('modules')
  .select('id,code,coordinateur')
  .eq('code', preferredModuleCode)
  .single()
if (moduleError) throw moduleError

const rmEmail = accountDefinitions.find(account => account.key === 'rm').email
const currentCoordinator = String(moduleRow.coordinateur || '').trim()
const alreadyAssigned = currentCoordinator.toLowerCase().includes(rmEmail.toLowerCase())
const originalCoordinateur = saved.moduleAssignment?.originalCoordinateur ?? moduleRow.coordinateur

if (!alreadyAssigned) {
  const coordinateur = currentCoordinator ? `${currentCoordinator}, ${rmEmail}` : rmEmail
  const { error: assignmentError } = await supabase
    .from('modules')
    .update({ coordinateur })
    .eq('id', moduleRow.id)
  if (assignmentError) throw assignmentError
}

saved.url = endpoint
saved.moduleAssignment = {
  moduleId: moduleRow.id,
  moduleCode: moduleRow.code,
  originalCoordinateur,
  rmEmail,
}

await fs.writeFile(credentialsFile, `${JSON.stringify(saved, null, 2)}\n`, { mode: 0o600 })
await fs.chmod(credentialsFile, 0o600)

console.log(JSON.stringify({
  environment: 'test',
  accountsReady: accountDefinitions.length,
  roles: accountDefinitions.map(account => account.role),
  moduleAssigned: moduleRow.code,
  postulationSlots: postulationCounts.get(moduleRow.code) || 0,
  credentialsFile: 'deploy/staging/si-uat-accounts.json',
  secretsPrinted: false,
  emailsSent: false,
  productionTouched: false,
}))
