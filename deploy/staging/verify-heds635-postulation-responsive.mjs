import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const access = JSON.parse(await fs.readFile(new URL('si-uat-accounts.json', directory)))

const outputDirectory = path.resolve('artifacts/HEDS25-635/postulation-responsive')
await fs.mkdir(outputDirectory, { recursive: true })

const viewports = [
  { name: 'desktop', width: 1440, height: 1000, compact: false },
  { name: 'ipad', width: 820, height: 1180, compact: true },
  { name: 'mobile', width: 390, height: 844, compact: true }
]

const browser = await chromium.launch({ headless: true })

const results = []

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport,
      serviceWorkers: 'block',
      httpCredentials: { ...gate, origin: base }
    })
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

    await page.goto(`${base}/home?redirect=${encodeURIComponent('/admin/soins-infirmiers/cours-postulation')}`, { waitUntil: 'domcontentloaded' })
    await page.locator('input[type=email]').fill(access.accounts.rm.email)
    await page.locator('input[type=password]').fill(access.accounts.rm.password)
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
    await page.waitForURL(url => url.pathname === '/admin/soins-infirmiers/cours-postulation', { timeout: 30000 })
    await page.getByRole('heading', { name: 'Cours en postulation (SI)' }).waitFor({ timeout: 30000 })
    await page.locator('.table-card').waitFor({ state: 'visible', timeout: 30000 })
    await page.waitForTimeout(900)

    const metrics = await page.evaluate(() => {
      const desktop = document.querySelector('.desktop-results')
      const compact = document.querySelector('.compact-results')
      const firstAction = document.querySelector('.slot-card__actions .p-button')
      return {
        viewportWidth: window.innerWidth,
        documentWidth: document.documentElement.scrollWidth,
        desktopDisplay: desktop ? getComputedStyle(desktop).display : null,
        compactDisplay: compact ? getComputedStyle(compact).display : null,
        compactCards: document.querySelectorAll('.slot-card').length,
        actionHeight: firstAction?.getBoundingClientRect().height || 0
      }
    })

    assert.ok(metrics.documentWidth <= metrics.viewportWidth + 2, `${viewport.name}: débordement horizontal global`)
    if (viewport.compact) {
      assert.equal(metrics.desktopDisplay, 'none', `${viewport.name}: la table desktop doit être masquée`)
      assert.notEqual(metrics.compactDisplay, 'none', `${viewport.name}: la liste compacte doit être visible`)
      assert.ok(metrics.compactCards > 0, `${viewport.name}: aucun créneau compact affiché`)
      assert.ok(metrics.actionHeight >= 44, `${viewport.name}: cible tactile inférieure à 44 px`)
    } else {
      assert.notEqual(metrics.desktopDisplay, 'none', 'desktop: la table doit être visible')
      assert.equal(metrics.compactDisplay, 'none', 'desktop: la liste compacte doit être masquée')
    }
    assert.deepEqual(pageErrors, [], `${viewport.name}: erreur JavaScript`)
    assert.deepEqual(blockedMutations, [], `${viewport.name}: mutation inattendue`)

    const screenshot = path.join(outputDirectory, `${viewport.name}.png`)
    await page.screenshot({ path: screenshot, fullPage: true })
    results.push({ viewport: viewport.name, metrics, screenshot })
    await context.close()
  }

  console.log(JSON.stringify({ environment: base, productionTouched: false, results }, null, 2))
} finally {
  await browser.close()
}
