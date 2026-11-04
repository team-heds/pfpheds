import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium } from 'playwright'

const publicBase = 'https://test.hedsvs.ch'
const base = (process.env.HEDS_TEST_UI_URL || publicBase).replace(/\/$/, '')
const apiBase = (process.env.HEDS_STAGING_URL || publicBase).replace(/\/$/, '')
assert.ok([publicBase, 'http://localhost:5181'].includes(base), `Interface refusée: ${base}`)
assert.ok([publicBase, 'http://localhost:8180'].includes(apiBase), `API refusée: ${apiBase}`)
const directory = new URL('./', import.meta.url)
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

assert.equal(access.url, publicBase, 'Les comptes doivent appartenir à test.hedsvs.ch')
assert.ok(env.STAGING_ANON_KEY, 'La clé anon de test est requise')

async function createSession(account) {
  const response = await fetch(`${apiBase}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: env.STAGING_ANON_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: account.email, password: account.password }),
  })
  assert.equal(response.status, 200, `La session ${account.role} doit pouvoir être créée`)
  return response.json()
}

const roleScenarios = [
  {
    key: 'rm',
    allowed: [
      ['/admin/dashboard-rm', 'Dashboard RM Soins Infirmiers'],
      ['/admin/soins-infirmiers/cours-postulation', 'Cours en postulation (SI)'],
    ],
    denied: ['/admin/soins-infirmiers/dashboard'],
  },
  {
    key: 'teacher',
    allowed: [
      ['/admin/soins-infirmiers/dashboard-enseignant', 'Dashboard Enseignant'],
      ['/admin/soins-infirmiers/cours-postulation', 'Cours en postulation (SI)'],
    ],
    denied: ['/admin/dashboard-rm', '/admin/soins-infirmiers/dashboard'],
  },
]

const browser = await chromium.launch({ headless: true })
const results = []

try {
  for (const scenario of roleScenarios) {
    const account = access.accounts[scenario.key]
    const session = await createSession(account)
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1000 },
      serviceWorkers: 'block',
      ...(base === publicBase ? { httpCredentials: { ...gate, origin: base } } : {}),
    })
    await context.addInitScript(authSession => {
      window.localStorage.setItem('supabase.auth.token', JSON.stringify(authSession))
    }, session)

    for (const [routePath, heading] of scenario.allowed) {
      const page = await context.newPage()
      const pageErrors = []
      const serverErrors = []
      const blockedMutations = []
      page.on('pageerror', error => pageErrors.push(error.message))
      page.on('response', response => {
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
      await page.getByText(heading, { exact: true }).first().waitFor({ state: 'visible', timeout: 30000 })
      await page.locator('.loading-container, .loading-state').first()
        .waitFor({ state: 'hidden', timeout: 30000 })
        .catch(() => {})

      assert.deepEqual(pageErrors, [], `${scenario.key}/${routePath}: erreur JavaScript`)
      assert.deepEqual(serverErrors, [], `${scenario.key}/${routePath}: erreur serveur`)
      assert.deepEqual(blockedMutations, [], `${scenario.key}/${routePath}: écriture inattendue au chargement`)
      results.push({ role: account.role, route: routePath, allowed: true })
      await page.close()
    }

    for (const routePath of scenario.denied) {
      const page = await context.newPage()
      await page.goto(`${base}${routePath}`, { waitUntil: 'domcontentloaded' })
      await page.waitForURL(url => url.pathname !== routePath, { timeout: 30000 })
      assert.equal(new URL(page.url()).pathname, '/access', `${scenario.key}/${routePath}: accès attendu refusé`)
      results.push({ role: account.role, route: routePath, allowed: false, redirectedTo: '/access' })
      await page.close()
    }

    await context.close()
  }

  console.log(JSON.stringify({
    environment: 'test',
    baseUrl: base,
    apiBaseUrl: apiBase,
    results,
    mutationsPerformed: false,
    productionTouched: false,
  }, null, 2))
} finally {
  await browser.close()
}
