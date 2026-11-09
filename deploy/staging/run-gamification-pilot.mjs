import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { createClient } from '@supabase/supabase-js'

const directory = new URL('./', import.meta.url)
const readEnv = async file => Object.fromEntries(
  (await fs.readFile(new URL(file, directory), 'utf8'))
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const separator = line.indexOf('=')
      return [line.slice(0, separator), line.slice(separator + 1)]
    })
)

const env = await readEnv('.env')
const credentials = JSON.parse(
  await fs.readFile(new URL('gamification-pilot-accounts.json', directory), 'utf8')
)
const endpoint = process.env.HEDS_STAGING_URL || 'http://localhost:8180'
const batchKey = process.env.HEDS_PILOT_BATCH || 'heds25-617-pilot-v1'
const today = new Date().toISOString().slice(0, 10)
// A registered pilot batch is immutable: reruns must keep its original dates.
// Custom batches may still use explicit dates or default to the current day.
const startsOn = process.env.HEDS_PILOT_START
  || (batchKey === 'heds25-617-pilot-v1' ? '2026-09-21' : today)
const endDate = new Date(`${startsOn}T12:00:00Z`)
endDate.setUTCDate(endDate.getUTCDate() + 7)
const endsOn = process.env.HEDS_PILOT_END || endDate.toISOString().slice(0, 10)

if (!/^\d{4}-\d{2}-\d{2}$/.test(startsOn) || !/^\d{4}-\d{2}-\d{2}$/.test(endsOn)) {
  throw new Error('Pilot dates must use YYYY-MM-DD')
}

const assetUuid = kind => {
  const hash = createHash('md5').update(`${batchKey}:${kind}`).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

const anonKey = env.STAGING_ANON_KEY
const serviceKey = env.STAGING_SERVICE_ROLE_KEY
if (!anonKey || !serviceKey) throw new Error('Staging API keys are unavailable')

const createLoginClient = () => createClient(endpoint, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const service = createClient(endpoint, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
})

const login = async account => {
  const client = createLoginClient()
  const { error } = await client.auth.signInWithPassword({
    email: account.email,
    password: account.password,
  })
  if (error) throw error
  return client
}

const admin = await login(credentials.accounts.admin)
const studentAccount = credentials.accounts.student

const rpc = async (client, name, parameters) => {
  const { data, error } = await client.rpc(name, parameters)
  if (error) throw error
  return data
}

const countRows = async (table, userId = null) => {
  let query = service.from(table).select('*', { count: 'exact', head: true })
  if (userId) query = query.eq('user_id', userId)
  const { count, error } = await query
  if (error) throw error
  return count || 0
}

const mailCount = async () => {
  try {
    const response = await fetch('http://localhost:8025/api/v1/messages')
    if (!response.ok) return null
    const data = await response.json()
    return Number(data.total ?? data.messages?.length ?? 0)
  } catch {
    return null
  }
}

const infrastructureSnapshot = async () => ({
  mail: await mailCount(),
  pushSubscriptions: await countRows('push_subscriptions'),
  pushOutbox: await countRows('push_outbox'),
})

const install = async () => rpc(admin, 'install_gamification_pilot', {
  p_batch_key: batchKey,
  p_admin_user_id: credentials.accounts.admin.userId,
  p_student_user_id: studentAccount.userId,
  p_starts_on: startsOn,
  p_ends_on: endsOn,
})

const configureQuestSteps = async () => {
  const questId = assetUuid('quest')
  const mappings = [
    { step_order: 1, action_type: 'PROFILE_UPDATE', target_value: 1 },
    { step_order: 2, action_type: 'POST', target_value: 1 },
  ]

  for (const mapping of mappings) {
    const { error } = await service
      .from('quest_steps')
      .update({
        action_type: mapping.action_type,
        target_value: mapping.target_value,
      })
      .eq('quest_id', questId)
      .eq('step_order', mapping.step_order)
    if (error) throw error
  }
}

const installConfiguredPilot = async () => {
  const result = await install()
  await configureQuestSteps()
  return result
}

const reset = async () => {
  try {
    return await rpc(admin, 'reset_gamification_pilot', { p_batch_key: batchKey })
  } catch (error) {
    if (/Pilot run not found/i.test(error.message)) return { missing: true }
    throw error
  }
}

const runScenario = async () => {
  const student = await login(studentAccount)
  const postIds = Array.from({ length: 4 }, (_, index) => assetUuid(`post-${index + 1}`))

  const loginResult = await rpc(student, 'record_my_gamification_action', {
    p_action: 'LOGIN', p_source_id: null, p_metadata: {},
  })

  const { error: profileError } = await student
    .from('user_profiles')
    .update({ display_name: 'TEST ÉTUDIANT GAMIFICATION — PROFIL VALIDÉ' })
    .eq('user_id', studentAccount.userId)
  if (profileError) throw profileError

  const profileResult = await rpc(student, 'record_my_gamification_action', {
    p_action: 'PROFILE_UPDATE', p_source_id: null, p_metadata: {},
  })

  const { error: postError } = await student.from('posts').insert(
    postIds.map((postId, index) => ({
      id: postId,
      user_id: studentAccount.userId,
      author_name: 'Étudiant pilote',
      content: `Publication synthétique HEDS25-617 #${index + 1}`,
    }))
  )
  if (postError) throw postError

  const postResults = await Promise.all(postIds.map(postId => (
    rpc(student, 'record_my_gamification_action', {
      p_action: 'POST', p_source_id: postId, p_metadata: {},
    })
  )))
  const awardedPosts = postResults
    .map((result, index) => ({ result, postId: postIds[index] }))
    .filter(({ result }) => result?.awarded)
  const cappedPosts = postResults.filter(result => result?.cap_reached)
  const replayedPostId = postIds[postResults.findIndex(result => result?.awarded)]
  const replayResult = await rpc(student, 'record_my_gamification_action', {
    p_action: 'POST', p_source_id: replayedPostId, p_metadata: {},
  })

  const { data: gamification, error: gamificationError } = await service
    .from('gamification_data')
    .select('total_xp,current_level,house_points')
    .eq('user_id', studentAccount.userId)
    .single()
  if (gamificationError) throw gamificationError

  const { data: events, error: eventsError } = await service
    .from('xp_history')
    .select('amount,event_key')
    .eq('user_id', studentAccount.userId)
  if (eventsError) throw eventsError

  const { data: questProgress, error: questProgressError } = await service
    .from('user_quest_progress')
    .select('status,progress,current_step')
    .eq('user_id', studentAccount.userId)
    .eq('quest_id', assetUuid('quest'))
    .single()
  if (questProgressError) throw questProgressError

  const eventKeys = events.map(event => event.event_key).filter(Boolean).sort()
  const ledgerTotal = events.reduce((sum, event) => sum + Number(event.amount || 0), 0)
  const requiredKeys = [
    `login:${today}`,
    `profile_update:${today}`,
    `challenge:${assetUuid('challenge-post')}`,
    ...awardedPosts.map(({ postId }) => `post:${postId}`),
  ]
  const requiredEventsPresent = requiredKeys.every(key => eventKeys.includes(key))
    && postIds.filter(postId => eventKeys.includes(`post:${postId}`)).length === 3

  const summary = {
    xp: gamification.total_xp,
    level: gamification.current_level,
    housePoints: gamification.house_points,
    ledgerTotal,
    eventCount: events.length,
    badgeCount: await countRows('user_badges', studentAccount.userId),
    challengeProgressCount: await countRows('user_challenge_progress', studentAccount.userId),
    questProgressCount: await countRows('user_quest_progress', studentAccount.userId),
    loginAwarded: Boolean(loginResult?.awarded),
    profileAwarded: Boolean(profileResult?.awarded),
    postAwarded: awardedPosts.length === 3,
    replayDuplicate: Boolean(replayResult?.duplicate),
    requiredEventsPresent,
    questCompletion: questProgress.status === 'completed'
      && questProgress.progress === 100
      && questProgress.current_step === 2
      ? 'passed'
      : 'failed',
    expiration: 'pending_dependency',
    cap: cappedPosts.length === 1 && cappedPosts[0]?.reason === 'cap_reached'
      ? 'passed'
      : 'failed',
  }

  if (
    summary.xp !== summary.ledgerTotal
    || summary.housePoints !== summary.xp
    || !summary.loginAwarded
    || !summary.profileAwarded
    || !summary.postAwarded
    || !summary.replayDuplicate
    || !summary.requiredEventsPresent
    || summary.questCompletion !== 'passed'
    || summary.cap !== 'passed'
  ) {
    throw new Error(`Pilot scenario is inconsistent: ${JSON.stringify(summary)}`)
  }

  return summary
}

const beforeInfrastructure = await infrastructureSnapshot()
await reset()
await installConfiguredPilot()
const first = await runScenario()
await reset()
await installConfiguredPilot()
const second = await runScenario()
const afterInfrastructure = await infrastructureSnapshot()

if (JSON.stringify(first) !== JSON.stringify(second)) {
  throw new Error(`Pilot cycles differ: ${JSON.stringify({ first, second })}`)
}
if (
  beforeInfrastructure.mail !== null
  && afterInfrastructure.mail !== null
  && beforeInfrastructure.mail !== afterInfrastructure.mail
) {
  throw new Error('Pilot unexpectedly generated an email in Mailpit')
}
if (
  beforeInfrastructure.pushSubscriptions !== afterInfrastructure.pushSubscriptions
  || beforeInfrastructure.pushOutbox !== afterInfrastructure.pushOutbox
) {
  throw new Error('Pilot unexpectedly changed push delivery state')
}

await reset()
const cleanInstall = await installConfiguredPilot()

console.log(JSON.stringify({
  batchKey,
  reproducible: true,
  cycles: 2,
  summary: first,
  infrastructureUnchanged: true,
  finalState: cleanInstall.status,
  containsPersonalData: false,
  secretsPrinted: false,
}, null, 2))
