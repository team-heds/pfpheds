import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const base = 'https://test.hedsvs.ch'
const apiEndpoint = process.env.HEDS_STAGING_URL || 'http://localhost:8180'
const batchKey = 'heds25-617-pilot-v1'
const directory = new URL('./', import.meta.url)
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const credentials = JSON.parse(
  await fs.readFile(new URL('gamification-pilot-accounts.json', directory))
)
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

if (!env.STAGING_SERVICE_ROLE_KEY) throw new Error('Staging service key unavailable')

const service = createClient(apiEndpoint, env.STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const student = credentials.accounts.student
const admin = credentials.accounts.admin
const postMarker = `TEST PILOTE HUMAIN ${new Date().toISOString()}`

const assetUuid = kind => {
  const hash = createHash('md5').update(`${batchKey}:${kind}`).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

const { data: originalProfile, error: originalProfileError } = await service
  .from('user_profiles')
  .select('city,preferred_language,canton_of_origin')
  .eq('user_id', student.userId)
  .single()
if (originalProfileError) throw originalProfileError

let createdPostId = null
const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP test.hedsvs.ch 83.228.204.5'],
})

const browserObservations = {
  forbiddenConnections: [],
  failedResponses: [],
  pageErrors: [],
  consoleErrors: [],
}

const isForbiddenHost = hostname => (
  /firebase/i.test(hostname)
  || [
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'firebasestorage.googleapis.com',
  ].includes(hostname)
  || /\.firebaseio\.com$/i.test(hostname)
  || hostname === 'api2.hedsvs.ch'
  || hostname === 'www.hedsvs.ch'
)

const attachDiagnostics = page => {
  page.on('pageerror', error => browserObservations.pageErrors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') {
      const location = message.location()
      if (location.url.startsWith('https://jnn-pa.googleapis.com/')) return
      browserObservations.consoleErrors.push({
        text: message.text(),
        location,
        pageUrl: page.url(),
      })
    }
  })
  page.on('request', request => {
    const url = new URL(request.url())
    if (isForbiddenHost(url.hostname)) {
      browserObservations.forbiddenConnections.push({
        hostname: url.hostname,
        path: url.pathname,
      })
    }
  })
  page.on('response', response => {
    const url = new URL(response.url())
    if (url.origin === base && response.status() >= 400) {
      browserObservations.failedResponses.push({ status: response.status(), path: url.pathname })
    }
  })
}

const newContext = () => browser.newContext({
  viewport: { width: 1440, height: 1000 },
  httpCredentials: {
    username: gate.username,
    password: gate.password,
    origin: base,
  },
})

const login = async (page, account, redirect) => {
  await page.goto(`${base}/home?redirect=${encodeURIComponent(redirect)}`)
  await page.locator('input[type=email]').fill(account.email)
  await page.locator('input[type=password]').fill(account.password)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await page.waitForURL(url => url.pathname === redirect, { timeout: 25000 })
  await page.waitForLoadState('networkidle').catch(() => {})
}

const meaningfulPage = async (page, path, heading = null) => {
  await page.goto(base + path)
  await page.waitForLoadState('networkidle').catch(() => {})
  assert.equal(new URL(page.url()).pathname, path)
  if (heading) await page.getByRole('heading', { name: heading }).waitFor({ timeout: 15000 })
  const body = (await page.locator('body').innerText()).trim()
  assert.ok(body.length > 50, `Empty route: ${path}`)
  return body
}

const responsiveObservation = async (page, path, width, height) => {
  await page.setViewportSize({ width, height })
  await meaningfulPage(page, path)
  return page.evaluate(() => {
    const root = document.documentElement
    const controls = [...document.querySelectorAll('button, a, input, select, [role="button"]')]
      .filter(element => {
        const style = getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0
      })
      .map(element => element.getBoundingClientRect())
    return {
      overflow: root.scrollWidth > root.clientWidth + 1,
      undersizedControls: controls.filter(rect => rect.width < 40 || rect.height < 40).length,
    }
  })
}

let studentResults
let adminResults
try {
  const studentContext = await newContext()
  const studentPage = await studentContext.newPage()
  attachDiagnostics(studentPage)
  await login(studentPage, student, `/gamification-profile/${student.userId}`)

  await studentPage.getByRole('heading', { name: 'Historique de vos points' }).waitFor()
  const initialProfileText = await studentPage.locator('body').innerText()
  assert.match(initialProfileText, /Mon profil gamification/)

  await meaningfulPage(studentPage, `/profile/${student.userId}`, 'Informations personnelles')
  const city = studentPage.getByLabel('Ville')
  await city.fill('Sion — pilote gamification')
  const profileRewardResponse = studentPage.waitForResponse(response => (
    response.request().method() === 'POST'
    && new URL(response.url()).pathname.endsWith('/rest/v1/rpc/record_my_gamification_action')
    && response.request().postData()?.includes('PROFILE_UPDATE')
  ))
  await studentPage.getByRole('button', { name: 'Sauvegarder le profil' }).click()
  const profileReward = await profileRewardResponse
  assert.equal(profileReward.status(), 200)
  const profileRewardResult = await profileReward.json()
  assert.equal(profileRewardResult.awarded, true)
  await studentPage.getByText('Profil mis à jour avec succès').first().waitFor({ timeout: 15000 })

  await meaningfulPage(studentPage, '/feed')
  await studentPage.getByText('Exprime-toi...', { exact: true }).click()
  const editor = studentPage.locator('[contenteditable="true"][aria-label="Exprime-toi..."]')
  await editor.waitFor({ timeout: 10000 })
  await editor.fill(postMarker)
  const postRewardResponse = studentPage.waitForResponse(response => (
    response.request().method() === 'POST'
    && new URL(response.url()).pathname.endsWith('/rest/v1/rpc/record_my_gamification_action')
    && response.request().postData()?.includes('POST')
  ))
  await studentPage.getByRole('button', { name: 'Publier' }).click()
  const postReward = await postRewardResponse
  assert.equal(postReward.status(), 200)
  const postRewardResult = await postReward.json()
  assert.equal(postRewardResult.awarded, true)
  const unlockedBadges = Array.isArray(postRewardResult.badges_unlocked)
    ? postRewardResult.badges_unlocked
    : []
  assert.ok(
    unlockedBadges.some(badge => badge.id === assetUuid('badge-post')),
    'The publication response did not immediately return the unlocked pilot badge'
  )
  const immediateBadgeToast = studentPage.locator('.notification-toast').filter({
    hasText: 'TEST — Première publication',
  })
  await immediateBadgeToast.waitFor({ timeout: 10000 })
  assert.match(await immediateBadgeToast.innerText(), /Nouveau badge obtenu\s*!/)
  assert.equal(await immediateBadgeToast.count(), 1)
  await studentPage.getByText(postMarker, { exact: false }).waitFor({ timeout: 15000 })

  const { data: createdPost, error: createdPostError } = await service
    .from('posts')
    .select('id')
    .eq('user_id', student.userId)
    .eq('content', `<p>${postMarker}</p>`)
    .maybeSingle()
  if (createdPostError) throw createdPostError
  if (!createdPost) {
    const fallback = await service
      .from('posts')
      .select('id,content')
      .eq('user_id', student.userId)
      .ilike('content', `%${postMarker}%`)
      .limit(1)
      .maybeSingle()
    if (fallback.error) throw fallback.error
    createdPostId = fallback.data?.id || null
  } else {
    createdPostId = createdPost.id
  }
  assert.ok(createdPostId, 'The UI publication was not persisted')

  const profileText = await meaningfulPage(
    studentPage,
    `/gamification-profile/${student.userId}`,
    'Historique de vos points'
  )
  await meaningfulPage(studentPage, '/quests')
  await studentPage.getByRole('tab', { name: /Historique/ }).click()
  await studentPage.getByText('TEST — Premiers pas dans ma maison').waitFor({ timeout: 10000 })
  const questsText = await studentPage.locator('body').innerText()
  const challengesText = await meaningfulPage(studentPage, '/challenges')
  const achievementsText = await meaningfulPage(studentPage, '/achievements')
  await meaningfulPage(studentPage, '/houses/ranking')

  assert.match(profileText, /Connexion quotidienne/)
  assert.match(profileText, /Profil complété/)
  assert.match(profileText, /Publication créée/)
  assert.match(questsText, /TEST — Premiers pas dans ma maison/)
  assert.match(challengesText, /TEST — Publication vérifiée/)
  assert.match(achievementsText, /TEST — Première publication/)

  const mobile = await responsiveObservation(
    studentPage,
    `/gamification-profile/${student.userId}`,
    390,
    844
  )
  const tablet = await responsiveObservation(
    studentPage,
    `/gamification-profile/${student.userId}`,
    834,
    1112
  )
  assert.equal(mobile.overflow, false)
  assert.equal(tablet.overflow, false)

  studentResults = {
    login: true,
    profileUpdate: true,
    publication: true,
    historyLabels: true,
    questVisible: true,
    challengeVisible: true,
    badgeVisible: true,
    immediateBadgeNotification: true,
    duplicateBadgeNotifications: false,
    rankingVisible: true,
    mobile,
    tablet,
  }
  await studentContext.close()

  const adminContext = await newContext()
  const adminPage = await adminContext.newPage()
  attachDiagnostics(adminPage)
  await login(adminPage, admin, '/admin/dashboard-gamification')
  await adminPage.getByText('État du système', { exact: true }).waitFor({ timeout: 20000 })
  const dashboardText = await adminPage.locator('body').innerText()
  assert.match(dashboardText, /État du système/)
  assert.match(dashboardText, /Règles XP/)
  assert.match(dashboardText, /Événements refusés/)
  assert.match(dashboardText, /Aucun ajout manuel d’XP ici/)

  const adminProfileText = await meaningfulPage(
    adminPage,
    `/gamification-profile/${student.userId}`,
    'Historique de vos points'
  )
  assert.match(adminProfileText, /Connexion quotidienne/)
  assert.match(adminProfileText, /Profil complété/)
  assert.match(adminProfileText, /Publication créée/)

  adminResults = {
    dashboard: true,
    rulesVisible: true,
    rejectedEventsVisible: true,
    noManualXpControl: true,
    studentHistoryVisible: true,
  }
  await adminContext.close()

  const { data: gamification, error: gamificationError } = await service
    .from('gamification_data')
    .select('total_xp,current_level,house_points')
    .eq('user_id', student.userId)
    .single()
  if (gamificationError) throw gamificationError

  const { data: events, error: eventsError } = await service
    .from('xp_history')
    .select('amount,action,event_key')
    .eq('user_id', student.userId)
  if (eventsError) throw eventsError

  const { data: questProgress, error: questProgressError } = await service
    .from('user_quest_progress')
    .select('status,progress,current_step')
    .eq('user_id', student.userId)
    .eq('quest_id', assetUuid('quest'))
    .single()
  if (questProgressError) throw questProgressError

  const ledgerTotal = events.reduce((sum, event) => sum + Number(event.amount || 0), 0)
  assert.equal(gamification.total_xp, ledgerTotal)
  assert.equal(gamification.house_points, ledgerTotal)
  assert.ok(events.some(event => event.action === 'LOGIN'))
  assert.ok(events.some(event => event.action === 'PROFILE_UPDATE'))
  assert.ok(events.some(event => event.action === 'POST'))
  assert.equal(new Set(events.map(event => event.event_key)).size, events.length)
  assert.equal(questProgress.status, 'completed')
  assert.equal(questProgress.progress, 100)

  assert.deepEqual(browserObservations.forbiddenConnections, [])
  assert.deepEqual(browserObservations.failedResponses, [])
  assert.deepEqual(browserObservations.pageErrors, [])
  assert.deepEqual(browserObservations.consoleErrors, [])

  console.log(JSON.stringify({
    humanPilotSimulation: 'passed',
    student: studentResults,
    admin: adminResults,
    dataConsistency: {
      totalXp: gamification.total_xp,
      currentLevel: gamification.current_level,
      housePoints: gamification.house_points,
      ledgerTotal,
      eventCount: events.length,
      uniqueEventKeys: true,
      questCompleted: true,
    },
    browserDiagnostics: {
      forbiddenConnections: 0,
      failedResponses: 0,
      pageErrors: 0,
      consoleErrors: 0,
    },
    containsPersonalData: false,
    secretsPrinted: false,
  }, null, 2))
} finally {
  await browser.close()
  if (createdPostId) {
    const { error } = await service.from('posts').delete().eq('id', createdPostId)
    if (error) console.error('Pilot post cleanup failed')
  }
  const { error: restoreError } = await service
    .from('user_profiles')
    .update(originalProfile)
    .eq('user_id', student.userId)
  if (restoreError) console.error('Pilot profile cleanup failed')
}
