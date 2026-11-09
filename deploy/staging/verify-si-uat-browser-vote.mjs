import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { createClient } from '@supabase/supabase-js'
import { chromium } from 'playwright'

const base = process.env.HEDS_TEST_UI_URL || 'https://test.hedsvs.ch'
const apiBase = process.env.HEDS_STAGING_URL || base
const directory = new URL('./', import.meta.url)
const outputDirectory = path.resolve('artifacts/SI-SPRINT-368-UAT')
await fs.mkdir(outputDirectory, { recursive: true })

const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const access = JSON.parse(await fs.readFile(new URL('si-uat-accounts.json', directory)))
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
if (!process.env.HEDS_TEST_UI_URL && !process.env.HEDS_STAGING_URL) assert.equal(access.url, base)

const service = createClient(apiBase, env.STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const teacherId = access.accounts.teacher.userId

async function createSession(account) {
  const response = await fetch(`${apiBase}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: env.STAGING_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: account.email, password: account.password }),
  })
  assert.equal(response.status, 200, `Connexion impossible pour ${account.role}`)
  return response.json()
}

async function cleanTestVotes(slotId = null) {
  let query = service.from('planning_slot_votes').delete().eq('teacher_id', teacherId)
  if (slotId) query = query.eq('slot_id', slotId)
  const { error } = await query
  if (error) throw error
}

async function openPostulation(context) {
  const page = await context.newPage()
  const pageErrors = []
  const serverErrors = []
  const failedRequests = []
  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('response', response => {
    if (response.status() >= 400) {
      serverErrors.push({ status: response.status(), path: new URL(response.url()).pathname })
    }
  })
  page.on('requestfailed', request => {
    failedRequests.push({
      method: request.method(),
      path: new URL(request.url()).pathname,
      error: request.failure()?.errorText || 'unknown'
    })
  })
  await page.goto(`${base}/admin/soins-infirmiers/cours-postulation`, { waitUntil: 'domcontentloaded' })
  await page.waitForURL(url => url.pathname === '/admin/soins-infirmiers/cours-postulation', { timeout: 30000 })
  try {
    await page.getByText('Cours en postulation (SI)', { exact: true }).first().waitFor({ timeout: 30000 })
  } catch (error) {
    const diagnosticScreenshot = path.join(outputDirectory, 'diagnostic-postulation-access.png')
    await page.screenshot({ path: diagnosticScreenshot, fullPage: true })
    console.error(JSON.stringify({
      diagnostic: 'postulation_access_failed',
      url: page.url(),
      title: await page.title(),
      body: (await page.locator('body').innerText()).slice(0, 1200),
      pageErrors,
      serverErrors,
      failedRequests,
      screenshot: diagnosticScreenshot
    }, null, 2))
    throw error
  }
  await page.locator('#si-postulation-search').fill(access.moduleAssignment.moduleCode)
  const rows = page.locator('tbody tr')
  await rows.first().waitFor({ state: 'visible', timeout: 30000 })
  return { page, rows, pageErrors, serverErrors, failedRequests }
}

function createContext(browser, session) {
  return browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'block',
    httpCredentials: { ...gate, origin: base },
    storageState: undefined,
  }).then(async context => {
    await context.addInitScript(authSession => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify(authSession))
    }, session)
    return context
  })
}

const teacherSession = await createSession(access.accounts.teacher)
const rmSession = await createSession(access.accounts.rm)
const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP test.hedsvs.ch 83.228.204.5'],
})

let testedSlotId = null
const evidence = []

try {
  await cleanTestVotes()

  const teacherContext = await createContext(browser, teacherSession)
  const teacherView = await openPostulation(teacherContext)
  const teacherRow = teacherView.rows.first()
  await teacherRow.getByRole('button', { name: 'Voter ce cours' }).click()
  await teacherRow.getByRole('button', { name: 'Retirer vote' }).waitFor({ timeout: 20000 })
  await teacherView.page.getByText('Vote enregistré', { exact: true }).first().waitFor({ timeout: 10000 })

  const { data: createdVotes, error: createdVotesError } = await service
    .from('planning_slot_votes')
    .select('slot_id,teacher_id')
    .eq('teacher_id', teacherId)
  if (createdVotesError) throw createdVotesError
  assert.equal(createdVotes.length, 1, 'Le clic enseignant doit créer exactement un vote')
  testedSlotId = createdVotes[0].slot_id

  const { data: slot, error: slotError } = await service
    .from('planning_time_slots')
    .select('id,module_code,class_code,week_number,day,day_index,start_time,end_time')
    .eq('id', testedSlotId)
    .single()
  if (slotError) throw slotError
  const { count: visibleVoteCount, error: voteCountError } = await service
    .from('planning_slot_votes')
    .select('*', { count: 'exact', head: true })
    .eq('slot_id', testedSlotId)
  if (voteCountError) throw voteCountError

  const teacherScreenshot = path.join(outputDirectory, '01-teacher-vote-recorded.png')
  await teacherView.page.screenshot({ path: teacherScreenshot, fullPage: true })
  evidence.push(teacherScreenshot)

  const planningView = await openPostulation(teacherContext)
  const planningRow = planningView.rows.first()
  await planningRow.getByRole('button', { name: 'Voir planning' }).click()
  await planningView.page.waitForURL(url => url.pathname === '/admin/planning/weekly', { timeout: 30000 })
  const planningUrl = new URL(planningView.page.url())
  assert.equal(planningUrl.searchParams.get('slotId'), String(testedSlotId))
  assert.equal(planningUrl.searchParams.get('week'), String(slot.week_number))
  assert.equal(planningUrl.searchParams.get('moduleCode'), slot.module_code)
  await planningView.page.getByText('Planification Hebdomadaire', { exact: true }).first().waitFor({ timeout: 30000 })
  const highlightedPlanningRow = planningView.page.locator('tr.highlighted-row').first()
  await highlightedPlanningRow.waitFor({ state: 'visible', timeout: 30000 })
  const highlightedText = await highlightedPlanningRow.innerText()
  assert.ok(highlightedText.includes(String(slot.start_time).slice(0, 5)),
    'Le créneau surligné doit correspondre à l’horaire demandé')
  assert.equal(await planningView.page.getByRole('button', { name: 'Ajouter un créneau' }).count(), 0,
    'Un enseignant ne doit pas voir les actions de gestion du planning')
  assert.equal(await planningView.page.locator('th').filter({ hasText: 'Actions' }).count(), 0,
    'La colonne de gestion doit rester masquée en lecture seule')
  const planningScreenshot = path.join(outputDirectory, '02-teacher-weekly-planning-read-only.png')
  await planningView.page.screenshot({ path: planningScreenshot, fullPage: true })
  evidence.push(planningScreenshot)
  assert.deepEqual(planningView.pageErrors, [], 'Erreur JavaScript pendant l’ouverture du planning')
  assert.deepEqual(planningView.serverErrors, [], 'Erreur serveur pendant l’ouverture du planning')

  const rmContext = await createContext(browser, rmSession)
  const rmView = await openPostulation(rmContext)
  const dayLabel = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Distance'][Number(slot.day_index)] || slot.day
  const timeRange = `${slot.start_time || '--:--'} - ${slot.end_time || '--:--'}`
  const rmRow = rmView.rows
    .filter({ hasText: String(slot.class_code || '') })
    .filter({ hasText: String(dayLabel || '') })
    .filter({ hasText: timeRange })
    .first()
  await rmRow.waitFor({ state: 'visible', timeout: 20000 })
  const rmHeaders = await rmView.page.locator('thead th').allTextContents()
  const votesColumnIndex = rmHeaders.findIndex(header => header.trim().startsWith('Votes'))
  assert.notEqual(votesColumnIndex, -1, 'La colonne Votes doit être présente dans la vue RM')
  await rmRow.locator('td').nth(votesColumnIndex).getByText(String(visibleVoteCount), { exact: true }).waitFor({ timeout: 10000 })
  const rmScreenshot = path.join(outputDirectory, '03-rm-sees-teacher-vote.png')
  await rmView.page.screenshot({ path: rmScreenshot, fullPage: true })
  evidence.push(rmScreenshot)
  assert.deepEqual(rmView.pageErrors, [], 'Erreur JavaScript pendant le parcours RM')
  assert.deepEqual(rmView.serverErrors, [], 'Erreur serveur pendant le parcours RM')

  const removeVoteButton = teacherRow.getByRole('button', { name: 'Retirer vote' })
  await removeVoteButton.waitFor({ state: 'visible', timeout: 30000 })
  await removeVoteButton.click()
  await teacherRow.getByRole('button', { name: 'Voter ce cours' }).waitFor({ timeout: 20000 })
  await teacherView.page.getByText('Vote retiré', { exact: true }).first().waitFor({ timeout: 10000 })

  const { count: residueCount, error: residueError } = await service
    .from('planning_slot_votes')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', teacherId)
  if (residueError) throw residueError
  assert.equal(residueCount, 0, 'Le vote de recette doit être retiré')

  const removedScreenshot = path.join(outputDirectory, '04-teacher-vote-removed.png')
  await teacherView.page.screenshot({ path: removedScreenshot, fullPage: true })
  evidence.push(removedScreenshot)
  assert.deepEqual(teacherView.pageErrors, [], 'Erreur JavaScript pendant le vote enseignant')
  assert.deepEqual(teacherView.serverErrors, [], 'Erreur serveur pendant le vote enseignant')

  await Promise.all([teacherContext.close(), rmContext.close()])
  console.log(JSON.stringify({
    environment: 'test',
    baseUrl: base,
    apiBaseUrl: apiBase,
    voteCreatedFromBrowser: true,
    voteVisibleToAssignedRm: true,
    planningTargetMatched: true,
    planningReadOnlyForTeacher: true,
    voteRemovedFromBrowser: true,
    testResidue: false,
    evidence,
    productionTouched: false,
  }, null, 2))
} finally {
  await cleanTestVotes(testedSlotId)
  await browser.close()
}
