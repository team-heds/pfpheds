import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const access = JSON.parse(await fs.readFile(new URL('real-test-access.json', directory)))
const env = Object.fromEntries(
  (await fs.readFile(new URL('.env', directory), 'utf8'))
    .trim()
    .split('\n')
    .map(line => {
      const separator = line.indexOf('=')
      return [line.slice(0, separator), line.slice(separator + 1)]
    })
)

const outputDirectory = path.resolve('artifacts/HEDS25-638')
await fs.mkdir(outputDirectory, { recursive: true })

const authResponse = await fetch(`${base}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: {
    apikey: env.STAGING_ANON_KEY,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    email: access.verificationAccounts[0].email,
    password: access.password
  })
})
assert.equal(authResponse.status, 200, 'La session admin test doit pouvoir être créée')
const session = await authResponse.json()

const viewports = [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
]

const routes = [
  { name: 'secretariat', path: '/admin/soins-infirmiers/dashboard', heading: 'Dashboard Secrétariat — Soins Infirmiers' },
  { name: 'rm', path: '/admin/dashboard-rm', heading: 'Dashboard RM Soins Infirmiers' },
  { name: 'daily', path: '/admin/soins-infirmiers/planning-journalier', heading: 'Vue Journalière — Gestion des Salles' },
  { name: 'workload', path: '/admin/soins-infirmiers/feuille-de-charges', heading: 'Feuille de charges — Enseignants SI' },
  { name: 'postulation', path: '/admin/soins-infirmiers/cours-postulation', heading: 'Cours en postulation (SI)' }
]

const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP test.hedsvs.ch 83.228.204.5']
})

const results = []

async function preparePage(context) {
  const page = await context.newPage()
  const pageErrors = []
  const blockedMutations = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.route('**/rest/v1/**', async route => {
    const pathname = new URL(route.request().url()).pathname
    const readOnlyRpc = pathname === '/rest/v1/rpc/api_my_permissions'
    if (!readOnlyRpc && !['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
      blockedMutations.push(`${route.request().method()} ${pathname}`)
      return route.abort()
    }
    await route.fallback()
  })
  return { page, pageErrors, blockedMutations }
}

async function assertVisualFoundation(page, viewportName, routeName, pageErrors) {
  await page.locator('.si-page-header').waitFor({ state: 'visible', timeout: 30000 })
  await page.locator('.si-admin-screen').waitFor({ state: 'visible', timeout: 30000 })
  await page.locator('.loading-container, .loading-state').first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(650)

  const metrics = await page.evaluate(() => {
    const screen = document.querySelector('.si-admin-screen')
    const header = document.querySelector('.si-page-header')
    return {
      viewport: window.innerWidth,
      document: document.documentElement.scrollWidth,
      body: document.body.scrollWidth,
      screenWidth: screen?.getBoundingClientRect().width || 0,
      headerRadius: header ? getComputedStyle(header).borderRadius : ''
    }
  })

  assert.ok(metrics.document <= metrics.viewport + 2, `${viewportName}/${routeName}: débordement horizontal global`)
  assert.ok(metrics.screenWidth > 0, `${viewportName}/${routeName}: socle SI absent`)
  assert.notEqual(metrics.headerRadius, '0px', `${viewportName}/${routeName}: en-tête non stylé`)
  assert.deepEqual(pageErrors, [], `${viewportName}/${routeName}: erreur JavaScript`)
  return metrics
}

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport,
      serviceWorkers: 'block',
      httpCredentials: { ...gate, origin: base }
    })
    await context.addInitScript(authSession => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify(authSession))
    }, session)

    for (const target of routes) {
      const { page, pageErrors, blockedMutations } = await preparePage(context)
      await page.goto(`${base}${target.path}`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: target.heading }).waitFor({ timeout: 30000 })
      const metrics = await assertVisualFoundation(page, viewport.name, target.name, pageErrors)
      const screenshot = path.join(outputDirectory, `${viewport.name}-${target.name}.png`)
      await page.screenshot({ path: screenshot, fullPage: true })
      results.push({ viewport: viewport.name, route: target.name, metrics, blockedMutations, screenshot })
      await page.close()
    }

    const { page, pageErrors, blockedMutations } = await preparePage(context)
    await page.goto(`${base}/admin/soins-infirmiers/dashboard`, { waitUntil: 'domcontentloaded' })
    await page.locator('.teacher-item').first().getByRole('button', { name: 'Profil', exact: true }).waitFor({ timeout: 30000 })
    await page.locator('.teacher-item').first().getByRole('button', { name: 'Profil', exact: true }).click()
    await page.waitForURL(url => url.pathname === '/admin/soins-infirmiers/dashboard-enseignant', { timeout: 20000 })
    await page.getByText('Profil enseignant ciblé', { exact: true }).waitFor({ timeout: 30000 })
    const metrics = await assertVisualFoundation(page, viewport.name, 'teacher', pageErrors)
    const heroBackground = await page.locator('.hero-card').evaluate(element => getComputedStyle(element).backgroundImage)
    assert.equal(heroBackground, 'none', `${viewport.name}/teacher: l'ancien dégradé est encore actif`)
    const screenshot = path.join(outputDirectory, `${viewport.name}-teacher.png`)
    await page.screenshot({ path: screenshot, fullPage: true })
    results.push({ viewport: viewport.name, route: 'teacher', metrics, heroBackground, blockedMutations, screenshot })
    await page.close()
    await context.close()
  }

  console.log(JSON.stringify({ environment: base, results }, null, 2))
} finally {
  await browser.close()
}
