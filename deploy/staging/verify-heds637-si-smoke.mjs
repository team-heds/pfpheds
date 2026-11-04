import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const publicBase = 'https://test.hedsvs.ch'
const base = (process.env.HEDS_TEST_UI_URL || publicBase).replace(/\/$/, '')
const apiBase = (process.env.HEDS_STAGING_URL || publicBase).replace(/\/$/, '')
assert.ok([publicBase, 'http://localhost:5181'].includes(base), `Interface refusée: ${base}`)
assert.ok([publicBase, 'http://localhost:8180'].includes(apiBase), `API refusée: ${apiBase}`)
const directory = new URL('./', import.meta.url)
const evidenceDirectory = fileURLToPath(new URL('../../artifacts/SI-SPRINT-368-UAT/', import.meta.url))
await fs.mkdir(evidenceDirectory, { recursive: true })
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

const adminAccount = access.verificationAccounts.find(account => account.role === 'admin')
assert.ok(adminAccount?.email, 'Un compte administrateur de test est requis')

const authResponse = await fetch(`${apiBase}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: env.STAGING_ANON_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: adminAccount.email, password: access.password })
})
assert.equal(authResponse.status, 200, 'La session administrateur test doit pouvoir être créée')
const session = await authResponse.json()

const routes = [
  ['/admin/soins-infirmiers/dashboard', 'Dashboard Secrétariat — Soins Infirmiers'],
  ['/admin/dashboard-rm', 'Dashboard RM Soins Infirmiers'],
  ['/admin/soins-infirmiers/planning-journalier', 'Vue Journalière — Gestion des Salles'],
  ['/admin/soins-infirmiers/feuille-de-charges', 'Feuille de charges — Enseignants SI'],
  ['/admin/soins-infirmiers/qualite-planning', 'Contrôle qualité du planning SI'],
  ['/admin/soins-infirmiers/cours-postulation', 'Cours en postulation (SI)']
]

function redactRuntimeSecrets(value) {
  return String(value || '')
    .replace(/([?&]apikey=)[^&\s']+/gi, '$1[redacted]')
    .replace(/(Bearer\s+)[A-Za-z0-9._-]+/gi, '$1[redacted]')
}

async function waitForBusinessReadiness(page, routePath) {
  if (routePath === '/admin/soins-infirmiers/dashboard') {
    await page.waitForFunction(() => {
      const heading = Array.from(document.querySelectorAll('h3'))
        .find(element => element.textContent?.includes('Enseignants SI'))
      const match = heading?.textContent?.match(/Enseignants SI\s*\((\d+)\)/)
      return Number(match?.[1] || 0) > 0
    }, null, { timeout: 30000 })
    return
  }

  if (routePath === '/admin/soins-infirmiers/feuille-de-charges') {
    await page.waitForFunction(() => document.body.innerText.includes('2026-2027'), null, { timeout: 30000 })
    await page.locator('.stats-row').waitFor({ state: 'visible', timeout: 30000 })
    return
  }

  if (routePath === '/admin/soins-infirmiers/planning-journalier') {
    await page.waitForFunction(() => document.body.innerText.includes('2026-2027'), null, { timeout: 30000 })
    await page.locator('.stats-row').waitFor({ state: 'visible', timeout: 30000 })
    return
  }

  if (routePath === '/admin/soins-infirmiers/qualite-planning') {
    await page.waitForFunction(() => {
      const body = document.body.innerText
      return body.includes('2026-2027') &&
        body.includes('1912 créneaux') &&
        body.includes('263') &&
        body.includes('831') &&
        body.includes('1715') &&
        body.includes('7')
    }, null, { timeout: 30000 })
    await page.getByText('Mode diagnostic — lecture seule').waitFor({ timeout: 30000 })
    return
  }

  if (routePath === '/admin/soins-infirmiers/cours-postulation') {
    await page.waitForFunction(() => {
      const match = document.body.innerText.match(/(\d+) créneaux postulation/)
      return Number(match?.[1] || 0) > 0
    }, null, { timeout: 30000 })
  }
}

const browser = await chromium.launch({ headless: true })

const results = []

try {
  const anonymousContext = await browser.newContext({
    serviceWorkers: 'block',
    ...(base === publicBase ? { httpCredentials: { ...gate, origin: base } } : {})
  })
  const anonymousPage = await anonymousContext.newPage()
  await anonymousPage.goto(`${base}${routes[0][0]}`, { waitUntil: 'domcontentloaded' })
  await anonymousPage.waitForFunction(path => window.location.pathname !== path, routes[0][0], { timeout: 20000 })
  assert.notEqual(new URL(anonymousPage.url()).pathname, routes[0][0], 'Une visite anonyme ne doit pas rester sur le dashboard SI')
  results.push({ actor: 'anonymous', protectedRouteDenied: true })
  await anonymousContext.close()

  for (const [routePath, heading] of routes) {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      serviceWorkers: 'block',
      ...(base === publicBase ? { httpCredentials: { ...gate, origin: base } } : {})
    })
    await context.addInitScript(authSession => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify(authSession))
    }, session)

    const page = await context.newPage()
    const pageErrors = []
    const consoleErrors = []
    const requestFailures = []
    const clientErrors = []
    const serverErrors = []
    const blockedMutations = []

    page.on('pageerror', error => pageErrors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') consoleErrors.push(redactRuntimeSecrets(message.text()))
    })
    page.on('requestfailed', request => {
      requestFailures.push({ method: request.method(), url: request.url(), error: request.failure()?.errorText || '' })
    })
    page.on('response', response => {
      if (response.status() >= 400 && response.status() < 500) {
        clientErrors.push({ status: response.status(), method: response.request().method(), path: new URL(response.url()).pathname })
      }
      if (response.status() >= 500) {
        serverErrors.push({ status: response.status(), path: new URL(response.url()).pathname })
      }
    })
    await page.route('**/rest/v1/**', async route => {
      const request = route.request()
      const pathname = new URL(request.url()).pathname
      const readOnlyRpc = pathname === '/rest/v1/rpc/api_my_permissions'
      if (!readOnlyRpc && !['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
        blockedMutations.push(`${request.method()} ${pathname}`)
        return route.abort()
      }
      await route.fallback()
    })

    await page.goto(`${base}${routePath}`, { waitUntil: 'domcontentloaded' })
    await page.waitForURL(url => url.pathname === routePath, { timeout: 30000 })
    await page.getByRole('heading', { name: heading }).waitFor({ timeout: 30000 })
    await page.locator('.loading-container, .loading-state').first()
      .waitFor({ state: 'hidden', timeout: 30000 })
      .catch(() => {})
    await waitForBusinessReadiness(page, routePath)

    if (routePath === '/admin/soins-infirmiers/cours-postulation') {
      assert.equal(
        await page.getByRole('button', { name: 'Voter ce cours' }).count(),
        0,
        'Le compte administrateur ne doit pas pouvoir voter comme un enseignant SI'
      )
    }

    assert.deepEqual(pageErrors, [], `${routePath}: erreur JavaScript`)
    assert.deepEqual(serverErrors, [], `${routePath}: erreur serveur`)
    assert.deepEqual(blockedMutations, [], `${routePath}: l'ouverture de l'écran a tenté une écriture`)
    const screenshot = path.join(
      evidenceDirectory,
      `admin-${routePath.split('/').filter(Boolean).at(-1)}.png`
    )
    await page.screenshot({ path: screenshot, fullPage: true })
    results.push({
      actor: 'admin',
      path: routePath,
      heading,
      pageErrors,
      consoleErrors,
      requestFailures,
      clientErrors,
      serverErrors,
      blockedMutations,
      screenshot
    })
    await context.close()
  }

  const mobileRoute = '/admin/soins-infirmiers/qualite-planning'
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    serviceWorkers: 'block',
    ...(base === publicBase ? { httpCredentials: { ...gate, origin: base } } : {})
  })
  await mobileContext.addInitScript(authSession => {
    window.localStorage.setItem('supabase.auth.token', JSON.stringify(authSession))
  }, session)
  const mobilePage = await mobileContext.newPage()
  const mobilePageErrors = []
  const mobileServerErrors = []
  const mobileBlockedMutations = []
  mobilePage.on('pageerror', error => mobilePageErrors.push(error.message))
  mobilePage.on('response', response => {
    if (response.status() >= 500) {
      mobileServerErrors.push({ status: response.status(), path: new URL(response.url()).pathname })
    }
  })
  await mobilePage.route('**/rest/v1/**', async route => {
    const request = route.request()
    const pathname = new URL(request.url()).pathname
    const readOnlyRpc = pathname === '/rest/v1/rpc/api_my_permissions'
    if (!readOnlyRpc && !['GET', 'HEAD', 'OPTIONS'].includes(request.method())) {
      mobileBlockedMutations.push(`${request.method()} ${pathname}`)
      return route.abort()
    }
    await route.fallback()
  })
  await mobilePage.goto(`${base}${mobileRoute}`, { waitUntil: 'domcontentloaded' })
  await mobilePage.waitForURL(url => url.pathname === mobileRoute, { timeout: 30000 })
  await waitForBusinessReadiness(mobilePage, mobileRoute)
  const hasViewportOverflow = await mobilePage.evaluate(() =>
    document.documentElement.scrollWidth > window.innerWidth + 1
  )
  assert.equal(hasViewportOverflow, false, 'Le diagnostic ne doit pas créer de débordement horizontal global sur mobile')
  assert.deepEqual(mobilePageErrors, [], 'Diagnostic mobile: erreur JavaScript')
  assert.deepEqual(mobileServerErrors, [], 'Diagnostic mobile: erreur serveur')
  assert.deepEqual(mobileBlockedMutations, [], 'Diagnostic mobile: écriture réseau détectée')
  const mobileScreenshot = path.join(evidenceDirectory, 'admin-qualite-planning-mobile.png')
  await mobilePage.screenshot({ path: mobileScreenshot, fullPage: true })
  results.push({
    actor: 'admin-mobile',
    path: mobileRoute,
    viewport: '390x844',
    hasViewportOverflow,
    pageErrors: mobilePageErrors,
    serverErrors: mobileServerErrors,
    blockedMutations: mobileBlockedMutations,
    screenshot: mobileScreenshot
  })
  await mobileContext.close()

  console.log(JSON.stringify({ environment: 'test', baseUrl: base, apiBaseUrl: apiBase, results }, null, 2))
} finally {
  await browser.close()
}
