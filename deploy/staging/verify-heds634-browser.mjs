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
const outputDirectory = path.resolve('artifacts/HEDS25-634')
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

const routes = [
  {
    name: 'secretariat',
    path: '/admin/soins-infirmiers/dashboard',
    readyText: 'Qualité des données planning'
  },
  {
    name: 'rm',
    path: '/admin/dashboard-rm',
    readyText: 'Mes Modules'
  },
  {
    name: 'teacher-preview',
    path: '/admin/soins-infirmiers/dashboard',
    readyText: 'Enseignants SI',
    openTeacherPreview: true
  }
]

const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP test.hedsvs.ch 83.228.204.5']
})

const results = []

try {
  for (const target of routes) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      serviceWorkers: 'block',
      httpCredentials: { ...gate, origin: base }
    })
    await context.addInitScript(authSession => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify(authSession))
    }, session)
    const page = await context.newPage()
    const pageErrors = []
    const failedRequests = []
    const consoleErrors = []
    const failedResponses = []
    const blockedMutations = []
    const planningRequests = []

    page.on('pageerror', error => pageErrors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })
    page.on('response', response => {
      if (response.status() >= 400) failedResponses.push({
        status: response.status(),
        path: new URL(response.url()).pathname
      })
    })
    page.on('requestfailed', request => failedRequests.push({
      path: new URL(request.url()).pathname,
      error: request.failure()?.errorText
    }))
    page.on('request', request => {
      const url = new URL(request.url())
      if (url.pathname === '/rest/v1/planning_time_slots' && request.method() === 'GET') {
        planningRequests.push(`${url.pathname}${url.search}`)
      }
    })

    await page.route('**/rest/v1/**', async route => {
      const pathname = new URL(route.request().url()).pathname
      const readOnlyRpc = pathname === '/rest/v1/rpc/api_my_permissions'
      if (!readOnlyRpc && !['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
        blockedMutations.push(`${route.request().method()} ${pathname}`)
        return route.abort()
      }
      await route.fallback()
    })

    await page.goto(`${base}${target.path}`)
    await page.waitForURL(url => url.pathname === target.path, { timeout: 25000 })
    try {
      await page.getByText(target.readyText, { exact: false }).first().waitFor({ timeout: 12000 })
    } catch (error) {
      const diagnosticScreenshot = path.join(outputDirectory, `${target.name}-diagnostic.png`)
      await page.screenshot({ path: diagnosticScreenshot, fullPage: true })
      console.error(JSON.stringify({
        dashboard: target.name,
        currentUrl: page.url(),
        body: (await page.locator('body').innerText()).slice(0, 1200),
        pageErrors,
        consoleErrors,
        failedResponses,
        failedRequests,
        blockedMutations,
        planningRequests: planningRequests.length,
        diagnosticScreenshot
      }, null, 2))
      throw error
    }
    await page.locator('.loading-container').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {})
    await page.waitForTimeout(1000)

    const initialPlanningRequests = planningRequests.length
    assert.ok(initialPlanningRequests >= 1, `${target.name}: aucune lecture planning_time_slots`)
    assert.ok(initialPlanningRequests <= 2, `${target.name}: plus de deux pages planning_time_slots`)

    if (target.openTeacherPreview) {
      planningRequests.length = 0
      await page.locator('.teacher-item').first().getByRole('button', { name: 'Profil', exact: true }).click()
      await page.waitForURL(url => url.pathname === '/admin/soins-infirmiers/dashboard-enseignant', { timeout: 20000 })
      await page.getByText('Profil enseignant ciblé', { exact: true }).waitFor({ timeout: 30000 })
      await page.locator('.loading-container').waitFor({ state: 'detached', timeout: 30000 }).catch(() => {})
      await page.waitForTimeout(500)
      assert.equal(planningRequests.length, 0, 'teacher-preview: le cache partagé doit éviter une nouvelle lecture planning')
    }
    assert.deepEqual(pageErrors, [], `${target.name}: erreur JavaScript`)

    const screenshot = path.join(outputDirectory, `${target.name}.png`)
    await page.screenshot({ path: screenshot, fullPage: true })
    results.push({
      dashboard: target.name,
      initialPlanningRequests,
      planningRequests: planningRequests.length,
      pageErrors,
      failedRequests,
      blockedMutations,
      screenshot
    })
    await context.close()
  }

  console.log(JSON.stringify({ environment: base, results }, null, 2))
} finally {
  await browser.close()
}
