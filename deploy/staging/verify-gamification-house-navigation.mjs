import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const credentials = JSON.parse(await fs.readFile(new URL('gamification-pilot-accounts.json', directory)))
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
  const errors = []
  page.on('pageerror', error => errors.push(error.message))

  await page.goto(`${base}/home?redirect=${encodeURIComponent('/admin/gamification/houses')}`)
  await page.locator('input[type=email]').fill(credentials.accounts.admin.email)
  await page.locator('input[type=password]').fill(credentials.accounts.admin.password)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/admin/gamification/houses', { timeout: 25000 })
  await page.getByRole('heading', { name: 'Classement des maisons HES' }).waitFor({ timeout: 15000 })
  console.log('houses-ready')

  const detailsButton = page.getByRole('button', { name: /Voir les détails de la maison/ }).first()
  const detailsLabel = await detailsButton.getAttribute('aria-label')
  const displayName = detailsLabel.replace('Voir les détails de la maison ', '')
  await detailsButton.click()
  await page.waitForURL(url => /^\/houses\/[^/]+\/stats$/.test(url.pathname), { timeout: 15000 })
  const statsPath = new URL(page.url()).pathname
  console.log(`details-ready:${statsPath}`)

  await page.goto(`${base}/admin/gamification/houses`)
  await page.getByRole('heading', { name: 'Classement des maisons HES' }).waitFor({ timeout: 15000 })
  console.log('houses-reloaded')
  const membersButton = page.getByRole('button', { name: /Voir les membres de la maison/ }).first()
  const membersLabel = await membersButton.getAttribute('aria-label')
  const membersDisplayName = membersLabel.replace('Voir les membres de la maison ', '')
  await membersButton.click()
  await page.waitForURL(url => url.pathname === '/admin/gamification/users' && Boolean(url.searchParams.get('house')), { timeout: 15000 })
  const membersUrl = new URL(page.url())
  const selectedHouse = membersUrl.searchParams.get('house')
  assert.equal(selectedHouse.toLowerCase(), membersDisplayName.toLowerCase())
  console.log(`members-route-ready:${selectedHouse}`)
  await page.locator('.p-dropdown-label').filter({ hasText: membersDisplayName }).first().waitFor({ timeout: 60000 })
  assert.deepEqual(errors, [])

  console.log(JSON.stringify({
    details: statsPath,
    members: `${membersUrl.pathname}?house=${selectedHouse}`,
    selectedFilter: membersDisplayName,
    productionTouched: false,
  }, null, 2))
  await context.close()
} finally {
  await browser.close()
}
