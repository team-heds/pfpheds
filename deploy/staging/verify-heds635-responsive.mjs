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

const outputDirectory = path.resolve('artifacts/HEDS25-635')
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
  { name: 'ipad-portrait', width: 820, height: 1180 },
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

      await page.goto(`${base}${target.path}`, { waitUntil: 'domcontentloaded' })
      await page.getByRole('heading', { name: target.heading }).waitFor({ timeout: 30000 })
      await page.locator('.loading-container, .loading-state').first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {})
      await page.waitForTimeout(500)

      const overflow = await page.evaluate(() => ({
        viewport: window.innerWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth
      }))
      assert.ok(overflow.document <= overflow.viewport + 2, `${viewport.name}/${target.name}: débordement horizontal global`)
      assert.deepEqual(pageErrors, [], `${viewport.name}/${target.name}: erreur JavaScript`)

      if (viewport.width <= 896) {
        const menuButton = page.getByRole('button', { name: 'Menu administration' })
        await menuButton.waitFor({ state: 'visible' })
        const box = await menuButton.boundingBox()
        assert.ok(box && box.height >= 44, `${viewport.name}/${target.name}: cible tactile du menu trop petite`)
        await menuButton.click()
        await page.locator('#admin-sidebar-navigation.is-mobile-open').waitFor({ state: 'visible' })
        await page.getByRole('button', { name: 'Fermer le menu administration' }).click()
        await page.locator('#admin-sidebar-navigation.is-mobile-open').waitFor({ state: 'detached' })
      }

      if (['secretariat', 'rm', 'workload'].includes(target.name)) {
        await page.screenshot({
          path: path.join(outputDirectory, `${viewport.name}-${target.name}.png`),
          fullPage: true
        })
      }

      results.push({ viewport: viewport.name, route: target.name, overflow, pageErrors, blockedMutations })
      await page.close()
    }
    await context.close()
  }

  console.log(JSON.stringify({ environment: base, results }, null, 2))
} finally {
  await browser.close()
}

