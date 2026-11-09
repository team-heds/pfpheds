import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const credentials = JSON.parse(await fs.readFile(new URL('gamification-pilot-accounts.json', directory)))
const outputDirectory = path.resolve('artifacts/HEDS25-633')
await fs.mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP test.hedsvs.ch 83.228.204.5']
})

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    serviceWorkers: 'block',
    httpCredentials: { ...gate, origin: base }
  })
  const page = await context.newPage()
  const pageErrors = []
  const failedRequests = []
  const mutations = []

  page.on('pageerror', error => pageErrors.push(error.message))
  page.on('requestfailed', request => failedRequests.push({
    path: new URL(request.url()).pathname,
    error: request.failure()?.errorText
  }))
  await page.route('**/rest/v1/**', async route => {
    const pathname = new URL(route.request().url()).pathname
    const readOnlyRpc = pathname === '/rest/v1/rpc/api_my_permissions'
    if (!readOnlyRpc && !['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) {
      mutations.push(`${route.request().method()} ${pathname}`)
      return route.abort()
    }
    await route.fallback()
  })

  await page.goto(`${base}/home?redirect=${encodeURIComponent('/admin/soins-infirmiers/cours-postulation')}`)
  await page.locator('input[type=email]').fill(credentials.accounts.admin.email)
  await page.locator('input[type=password]').fill(credentials.accounts.admin.password)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/admin/soins-infirmiers/cours-postulation', { timeout: 20000 })
  await page.getByText('65 créneaux postulation', { exact: true }).waitFor({ timeout: 20000 })

  const firstRows = page.locator('.p-datatable-tbody > tr')
  assert.equal(await firstRows.count(), 20)
  assert.notEqual((await firstRows.first().locator('td').nth(1).innerText()).trim(), '')
  assert.notEqual((await firstRows.first().locator('td').nth(3).innerText()).trim(), '—')

  const search = page.getByPlaceholder('Rechercher un cours, module ou une classe...')
  await search.fill('Communication avec la personne ayant un trouble du spectre de la schizophrénie')
  await page.getByText('Lien unique déduit', { exact: true }).waitFor()
  const matchingRows = await page.locator('.p-datatable-tbody > tr').count()
  assert.ok(matchingRows >= 1)
  assert.deepEqual(pageErrors, [])

  await page.screenshot({ path: path.join(outputDirectory, 'cours-postulation.png'), fullPage: true })
  console.log(JSON.stringify({
    environment: base,
    authenticatedAdmin: true,
    postulationCount: 65,
    matchingCourseRows: matchingRows,
    inferredCourseLinkVisible: true,
    pageErrors,
    failedRequests,
    blockedMutations: mutations,
    screenshot: path.join(outputDirectory, 'cours-postulation.png')
  }, null, 2))
} finally {
  await browser.close()
}
