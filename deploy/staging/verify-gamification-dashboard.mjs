import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const credentials = JSON.parse(await fs.readFile(new URL('gamification-pilot-accounts.json', directory)))
const observations = { pageErrors: [], failedResponses: [], consoleRpcs: [] }

const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP test.hedsvs.ch 83.228.204.5'],
})

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    httpCredentials: { username: gate.username, password: gate.password, origin: base },
  })
  const page = await context.newPage()
  page.on('pageerror', error => observations.pageErrors.push(error.message))
  page.on('request', request => {
    const url = new URL(request.url())
    if (url.pathname.includes('/rpc/preview_gamification_')) observations.consoleRpcs.push(url.pathname)
  })
  page.on('response', response => {
    const url = new URL(response.url())
    if (url.origin === base && response.status() >= 400 && url.pathname !== '/favicon.ico') {
      observations.failedResponses.push({ status: response.status(), path: url.pathname })
    }
  })

  await page.goto(`${base}/home?redirect=${encodeURIComponent('/admin/dashboard-gamification')}`)
  await page.locator('input[type=email]').fill(credentials.accounts.admin.email)
  await page.locator('input[type=password]').fill(credentials.accounts.admin.password)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/admin/dashboard-gamification', { timeout: 25000 })
  await page.getByRole('heading', { name: 'État du système' }).waitFor({ timeout: 30000 })
  await page.getByRole('heading', { name: 'Qualité des données' }).waitFor()

  const initialRpcCount = observations.consoleRpcs.length
  const weekStatsResponse = page.waitForResponse(response => {
    const url = new URL(response.url())
    return url.pathname.endsWith('/api/admin-dashboard/v1/stats')
      && url.searchParams.get('domains') === 'gamification'
      && url.searchParams.get('period') === 'week'
      && response.status() === 200
  }, { timeout: 15000 })
  await page.getByRole('button', { name: 'Semaine', exact: true }).click()
  const weekPayload = await (await weekStatsResponse).json()
  assert.equal(weekPayload.version, '1')
  assert.equal(weekPayload.domains?.gamification?.status, 'ok')
  assert.equal(observations.consoleRpcs.length, initialRpcCount, 'Changing period reloaded period-independent RPCs')

  const kpiCards = page.locator('.kpi-card[role="button"]')
  assert.equal(await kpiCards.count(), 4)
  assert.equal(await page.locator('.kpi-card[role="button"] button').count(), 0, 'Nested interactive control in KPI card')

  const challengeCard = page.getByRole('button', { name: /Défis Actifs.*Ouvrir les détails/ })
  await challengeCard.focus()
  await challengeCard.press('Enter')
  await page.waitForURL(url => url.pathname === '/admin/gamification/challenges', { timeout: 10000 })
  await page.getByRole('heading', { name: 'Gestion des défis' }).waitFor({ timeout: 15000 })

  assert.deepEqual(observations.pageErrors, [])
  assert.deepEqual(observations.failedResponses, [])

  console.log(JSON.stringify({
    environment: 'test.hedsvs.ch',
    source: 'Supabase test database',
    periodChange: 'month-to-week-passed',
    periodPayloadStatus: weekPayload.domains.gamification.status,
    periodIndependentRpcReloads: 0,
    kpiNavigation: 'challenges-passed',
    nestedInteractiveControls: 0,
    productionTouched: false,
    secretsPrinted: false,
  }, null, 2))
} finally {
  await browser.close()
}
