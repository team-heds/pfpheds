import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const phase = process.argv[2] || 'capture'
const outputDirectory = path.resolve('artifacts', 'HEDS25-623')
const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const credentials = JSON.parse(
  await fs.readFile(new URL('gamification-pilot-accounts.json', directory))
)
const account = credentials.accounts.student
const pathName = `/gamification-profile/${account.userId}`
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
      httpCredentials: {
        username: gate.username,
        password: gate.password,
        origin: base,
      },
      reducedMotion: 'reduce',
    })
    const page = await context.newPage()
    const pageErrors = []
    page.on('pageerror', error => pageErrors.push(error.message))

    await page.goto(`${base}/home?redirect=${encodeURIComponent(pathName)}`)
    await page.locator('input[type=email]').fill(account.email)
    await page.locator('input[type=password]').fill(account.password)
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
    await page.waitForURL(url => url.pathname === pathName, { timeout: 20000 })
    await page.locator('.profile-summary, .error-state').first().waitFor({ timeout: 20000 })
    await page.waitForLoadState('networkidle').catch(() => {})
    const toastClose = page.locator('.p-toast-close-button').first()
    if (await toastClose.isVisible().catch(() => false)) await toastClose.click()

    const metrics = await page.evaluate(() => {
      const visible = element => {
        const style = window.getComputedStyle(element)
        const rect = element.getBoundingClientRect()
        return style.visibility !== 'hidden' && style.display !== 'none'
          && rect.width > 0 && rect.height > 0
      }
      const profile = document.querySelector('.gamification-profile-page')
      const interactive = [...(profile || document).querySelectorAll(
        'button, a[href], input, select, textarea, [role="button"], [tabindex="0"]'
      )].filter(visible)
      const smallTargets = interactive.flatMap(element => {
        const rect = element.getBoundingClientRect()
        return rect.width < 44 || rect.height < 44
          ? [{ tag: element.tagName, className: element.className, width: Math.round(rect.width), height: Math.round(rect.height) }]
          : []
      })
      const overflowElements = [...(profile || document).querySelectorAll('*')].flatMap(element => {
        const rect = element.getBoundingClientRect()
        return rect.right > document.documentElement.clientWidth + 1 || rect.left < -1
          ? [{ tag: element.tagName, className: element.className, left: Math.round(rect.left), right: Math.round(rect.right) }]
          : []
      }).slice(0, 20)
      return {
        documentOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        profileScrollHeight: profile?.scrollHeight || 0,
        profileClientHeight: profile?.clientHeight || 0,
        headerDisplay: profile?.querySelector('.game-header')
          ? window.getComputedStyle(profile.querySelector('.game-header')).display
          : null,
        interactiveCount: interactive.length,
        smallTargets,
        overflowElements,
      }
    })

    const screenshot = path.join(outputDirectory, `${phase}-${viewport.name}.png`)
    await page.locator('.gamification-profile-page').screenshot({ path: screenshot })
    results.push({ viewport, screenshot, pageErrors, ...metrics })
    await context.close()
  }
} finally {
  await browser.close()
}

console.log(JSON.stringify({ phase, results, secretsPrinted: false }, null, 2))
