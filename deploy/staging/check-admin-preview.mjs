import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
const base = 'https://test.hedsvs.ch'
const access = JSON.parse(await fs.readFile(new URL('real-test-access.json', import.meta.url)))
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', import.meta.url)))
const build = process.argv[2]
const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({ serviceWorkers: 'block', httpCredentials: { username: gate.username, password: gate.password, origin: base } })
  await context.route('**/*', route => new URL(route.request().url()).origin === base ? route.fallback() : route.abort())
  if (build) await context.route(base + '/**', async route => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname
    if (/^\/(auth|rest|api|storage|realtime)\//.test(pathname)) return route.continue()
    const file = request.isNavigationRequest() ? 'index.html' : decodeURIComponent(pathname).replace(/^\//, '')
    const target = path.resolve(build, 'dist', file)
    if (!target.startsWith(path.resolve(build, 'dist') + path.sep)) return route.abort()
    try { await fs.access(target); await route.fulfill({ path: target }) } catch { await route.continue() }
  })
  const page = await context.newPage()
  page.on('requestfailed', request => console.log(JSON.stringify({ failedPath: new URL(request.url()).pathname, failure: request.failure()?.errorText })))
  page.on('pageerror', error => console.log(JSON.stringify({ pageError: error.message })))
  page.on('response', async response => {
    if (response.url().includes('/rest/v1/votation_sessions')) {
      const body = await response.json().catch(() => null)
      console.log(JSON.stringify({ sessionHttp: response.status(), sessions: Array.isArray(body) ? body.map(item => ({ status: item.status, pfp: item.pfp_type })) : null }))
    }
  })
  await page.goto(base + '/home')
  await page.locator('input[type=email]').fill(access.verificationAccounts.find(item => item.role === 'admin').email)
  await page.locator('input[type=password]').fill(access.password)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await page.waitForURL(url => url.pathname !== '/home')
  const mutations = []
  await page.route('**/rest/v1/**', async route => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(route.request().method()) && /student_votes|votation_sessions|upsert_student_vote/.test(route.request().url())) {
      mutations.push(new URL(route.request().url()).pathname)
      return route.abort()
    }
    await route.fallback()
  })
  await page.goto(base + '/votation')
  await page.getByRole('heading', { name: 'Aperçu admin — lecture seule', exact: true }).waitFor()
  await page.locator('#admin-votation-session').waitFor({ state: 'visible' })
  await page.waitForLoadState('networkidle')
  console.log(JSON.stringify({ previewText: await page.getByRole('region', { name: 'Aperçu administrateur' }).innerText() }))
  await page.waitForFunction(() => {
    const select = document.querySelector('#admin-votation-session')
    return select && !select.disabled && select.options.length > 0
  })
  await page.getByRole('heading', { name: 'Votation PFP2', exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: /Envoyer mon vote|Mettre à jour mon vote/ }).count(), 0)
  assert.equal(await page.locator('input[type=radio]:enabled').count(), 0)
  const summary = await page.locator('.header-subtitle').innerText()
  assert.match(summary, /64 capacités proposées/)
  await page.getByRole('button', { name: 'Actualiser', exact: true }).click()
  await page.getByRole('heading', { name: 'Votation PFP2', exact: true }).waitFor()
  assert.equal(mutations.length, 0)
  console.log(JSON.stringify({ mode: build ? 'candidate' : 'published', adminPreview: true, summary, campaigns: await page.locator('#admin-votation-session option').allTextContents(), enabledVoteControls: 0, mutations: 0 }))
} finally { await browser.close() }
