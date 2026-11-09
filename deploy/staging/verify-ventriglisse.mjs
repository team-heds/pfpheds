import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const outputDirectory = path.resolve('artifacts/ventriglisse')
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory), 'utf8'))
const credentials = JSON.parse(await fs.readFile(new URL('gamification-pilot-accounts.json', directory), 'utf8'))
const account = credentials.accounts.student
const diagnostics = { pageErrors: [], consoleErrors: [], failedResponses: [], forbiddenHosts: [] }
const avatarResponses = []

await fs.mkdir(outputDirectory, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  args: [
    '--host-resolver-rules=MAP test.hedsvs.ch 83.228.204.5',
    '--enable-webgl',
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
  ],
})

const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  reducedMotion: 'reduce',
  httpCredentials: { ...gate, origin: base },
})
const page = await context.newPage()

page.on('pageerror', (error) => diagnostics.pageErrors.push(error.message))
page.on('console', (message) => {
  if (message.type() === 'error') diagnostics.consoleErrors.push(message.text())
})
page.on('response', (response) => {
  const url = new URL(response.url())
  if (/\/(fille|garcon)-[^/]+\.glb$/.test(url.pathname)) avatarResponses.push({ path: url.pathname, status: response.status() })
  if (url.origin === base && response.status() >= 400) {
    diagnostics.failedResponses.push({ status: response.status(), path: url.pathname })
  }
})
page.on('request', (request) => {
  const hostname = new URL(request.url()).hostname
  if (/firebase|readyplayer/i.test(hostname) || ['api2.hedsvs.ch', 'www.hedsvs.ch'].includes(hostname)) {
    diagnostics.forbiddenHosts.push(hostname)
  }
})

try {
  await page.goto(`${base}/home?redirect=${encodeURIComponent('/game')}`)
  await page.locator('input[type=email]').fill(account.email)
  await page.locator('input[type=password]').fill(account.password)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await page.waitForURL((url) => url.pathname === '/game', { timeout: 25000 })

  await page.getByRole('heading', { name: 'Ventriglisse 3D' }).waitFor()
  await page.getByRole('button', { name: 'Jouer' }).click()
  await page.waitForURL((url) => url.pathname === '/ventriglisse3d')
  await page.locator('canvas[aria-label*="Ventriglisse"]').waitFor()
  await page.waitForFunction(() => {
    const launch = document.querySelector('.race-toolbar .primary-button')
    return launch && !launch.disabled && !document.querySelector('.avatar-loading')
  }, null, { timeout: 20000 })
  assert.equal(await page.locator('.scene-error, .model-warning').count(), 0)
  assert.equal(avatarResponses.filter(({ status }) => status === 200).length, 2)
  await page.screenshot({ path: path.join(outputDirectory, 'desktop-ready.png'), fullPage: true })

  assert.deepEqual(await page.locator('select').first().locator('option').allTextContents(), ['Fille', 'Garçon'])

  const soundSwitch = page.getByRole('switch', { name: 'Désactiver les effets sonores' })
  await soundSwitch.click()
  await page.getByRole('button', { name: 'Ajouter' }).click()
  await page.getByLabel('Couloir 5').fill('Pilote 5')
  await page.getByLabel('Personnage').nth(4).selectOption('fille')
  await page.getByRole('button', { name: 'Appliquer' }).click()
  await page.getByRole('button', { name: 'Lancer la course' }).click()
  await page.locator('.results-panel').waitFor({ timeout: 60000 })

  const ranking = await page.locator('.ranking-list li').allTextContents()
  assert.equal(ranking.length, 5)
  assert.ok(ranking.every((entry) => /m$/.test(entry.trim())))
  assert.match(await page.locator('.race-toolbar').innerText(), /remporte la manche/)

  await page.screenshot({ path: path.join(outputDirectory, 'desktop-results.png'), fullPage: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${base}/ventriglisse3d`)
  await page.locator('canvas[aria-label*="Ventriglisse"]').waitFor()
  const mobile = await page.evaluate(() => {
    const visible = (element) => {
      const rect = element.getBoundingClientRect()
      const style = getComputedStyle(element)
      return rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden'
    }
    const controls = [...document.querySelectorAll('button, input, [role="switch"]')].filter(visible)
    return {
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      smallControls: controls.filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width < 44 || rect.height < 44
      }).length,
      canvas: document.querySelector('canvas')?.getBoundingClientRect().toJSON(),
    }
  })
  assert.equal(mobile.overflow, false)
  assert.equal(mobile.smallControls, 0)
  assert.ok(mobile.canvas.width > 300 && mobile.canvas.height >= 360)
  await page.screenshot({ path: path.join(outputDirectory, 'mobile-ready.png'), fullPage: true })

  assert.deepEqual(diagnostics, { pageErrors: [], consoleErrors: [], failedResponses: [], forbiddenHosts: [] })
  console.log(JSON.stringify({
    environment: base,
    ventriglisse: 'passed',
    participantCount: ranking.length,
    deterministicLocalRace: true,
    xpWrites: 0,
    mobile,
    diagnostics,
    screenshots: [
      path.join(outputDirectory, 'desktop-ready.png'),
      path.join(outputDirectory, 'desktop-results.png'),
      path.join(outputDirectory, 'mobile-ready.png'),
    ],
    containsPersonalData: false,
    secretsPrinted: false,
  }, null, 2))
} finally {
  await browser.close()
}
