import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const phase = process.argv[2] || 'before'
const accountKey = process.argv[3] || 'student'
const outputDirectory = path.resolve('artifacts', 'votation-frontend')
const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const credentials = JSON.parse(await fs.readFile(new URL('gamification-pilot-accounts.json', directory)))
const account = credentials.accounts[accountKey]
if (!account) throw new Error(`Compte de capture inconnu: ${accountKey}`)
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'desktop', width: 1440, height: 1000 },
]

await fs.mkdir(outputDirectory, { recursive: true })
const browser = await chromium.launch({ headless: true })
const results = []

try {
  for (const viewport of viewports) {
    const context = await browser.newContext({
      viewport,
      httpCredentials: { username: gate.username, password: gate.password, origin: base },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))
    await page.goto(`${base}/home?redirect=${encodeURIComponent('/votation')}`)
    await page.locator('input[type=email]').fill(account.email)
    await page.locator('input[type=password]').fill(account.password)
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
    await page.waitForURL(url => url.pathname === '/votation', { timeout: 20000 })
    await page.locator('.votation-container, .pi-lock').first().waitFor({ timeout: 20000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    const metrics = await page.evaluate(() => {
      const root = document.querySelector('.votation-container') || document.body
      const visible = element => {
        const style = window.getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.visibility !== 'hidden' && style.display !== 'none' && rect.width > 0 && rect.height > 0
      }
      const interactive = [...root.querySelectorAll('button, a[href], input, select, [role="button"], [tabindex="0"]')].filter(visible)
      return {
        pathname: location.pathname,
        title: root.querySelector('h1, h2')?.textContent?.trim() || null,
        scrollWidth: root.scrollWidth,
        clientWidth: root.clientWidth,
        scrollHeight: root.scrollHeight,
        clientHeight: root.clientHeight,
        tables: root.querySelectorAll('table').length,
        radioButtons: root.querySelectorAll('input[type=radio]').length,
        smallTargets: interactive.flatMap(element => {
          const rect = element.getBoundingClientRect()
          return rect.width < 44 || rect.height < 44
            ? [{ tag: element.tagName, className: String(element.className), width: Math.round(rect.width), height: Math.round(rect.height) }]
            : []
        }).slice(0, 30),
      }
    })
    const screenshot = path.join(outputDirectory, `${phase}-${accountKey}-${viewport.name}.png`)
    await page.screenshot({ path: screenshot, fullPage: true })
    results.push({ viewport, screenshot, pageErrors, ...metrics })
    await context.close()
  }
} finally {
  await browser.close()
}

console.log(JSON.stringify({ phase, accountKey, results, secretsPrinted: false }, null, 2))
