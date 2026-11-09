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
if (saved.url !== endpoint) throw new Error('Les identifiants ne correspondent pas à cet environnement')
if (!env.STAGING_ANON_KEY) throw new Error('STAGING_ANON_KEY est indisponible')

const expected = {
  rm: { role: 'RMSoins', teacher: false, manager: true, canManageAssignedSlot: true },
  teacher: { role: 'EnseignantSoins', teacher: true, manager: false, canManageAssignedSlot: false },
}

const service = createClient(endpoint, env.STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const { data: assignedSlot, error: slotError } = await service
  .from('planning_time_slots')
  .select('id,module_code,teachers')
  .eq('module_code', saved.moduleAssignment.moduleCode)
  .limit(1000)
if (slotError) throw slotError
const postulationSlot = assignedSlot?.find(slot => Array.isArray(slot.teachers)
  && slot.teachers.some(value => String(value).toLowerCase().includes('postul')))
if (!postulationSlot) throw new Error('Aucun créneau de postulation pour le module de recette')

const results = []
for (const [key, expectation] of Object.entries(expected)) {
  const account = saved.accounts[key]
  const client = createClient(endpoint, env.STAGING_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: signIn, error: signInError } = await client.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  })
  if (signInError || !signIn.user) throw signInError || new Error(`Connexion impossible: ${key}`)

  const { data: profile, error: profileError } = await client
    .from('user_profiles')
    .select('role,permissions,is_active')
    .eq('user_id', signIn.user.id)
    .single()
  if (profileError) throw profileError

  const { data: isTeacher, error: teacherError } = await client.rpc('app_is_si_postulation_teacher')
  if (teacherError) throw teacherError
  const { data: isManager, error: managerError } = await client.rpc('app_is_si_postulation_manager')
  if (managerError) throw managerError
  const { data: canManage, error: manageError } = await client.rpc('app_can_manage_si_postulation_slot', {
    p_slot_id: postulationSlot.id,
  })
  if (manageError) throw manageError

  const actual = {
    role: profile.role,
    active: profile.is_active,
    teacher: isTeacher,
    manager: isManager,
    canManageAssignedSlot: canManage,
  }
  if (actual.role !== expectation.role
    || actual.active !== true
    || actual.teacher !== expectation.teacher
    || actual.manager !== expectation.manager
    || actual.canManageAssignedSlot !== expectation.canManageAssignedSlot) {
    throw new Error(`Matrice d'accès incorrecte pour ${key}: ${JSON.stringify(actual)}`)
  }

  await client.auth.signOut()
  results.push({ key, ...actual })
}

console.log(JSON.stringify({
  environment: 'test',
  moduleCode: saved.moduleAssignment.moduleCode,
  slotChecked: postulationSlot.id,
  accounts: results,
  passwordsPrinted: false,
  mutationPerformed: false,
  productionTouched: false,
}, null, 2))
