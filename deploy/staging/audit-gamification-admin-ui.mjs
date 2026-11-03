import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const credentials = JSON.parse(await fs.readFile(new URL('gamification-pilot-accounts.json', directory)))
const outputDirectory = path.resolve('artifacts/gamification-admin-ui')
const routes = [
  { name: 'quests', path: '/admin/gamification/quests' },
  { name: 'challenges', path: '/admin/gamification/challenges' },
  { name: 'badges', path: '/admin/gamification/badges' },
  { name: 'houses', path: '/admin/gamification/houses' },
]
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 1000 },
]

await fs.mkdir(outputDirectory, { recursive: true })
const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP test.hedsvs.ch 83.228.204.5'],
})
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

    await page.goto(`${base}/home?redirect=${encodeURIComponent(routes[0].path)}`)
    await page.locator('input[type=email]').fill(credentials.accounts.admin.email)
    await page.locator('input[type=password]').fill(credentials.accounts.admin.password)
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
    await page.waitForURL(url => url.pathname === routes[0].path, { timeout: 20000 })

    for (const route of routes) {
      await page.goto(base + route.path)
      await page.waitForFunction(() => (document.body?.innerText || '').trim().length > 80, null, { timeout: 15000 })
      await page.waitForLoadState('networkidle').catch(() => {})

      const metrics = await page.evaluate(() => {
        const visible = element => {
          const style = window.getComputedStyle(element)
          const rect = element.getBoundingClientRect()
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
        }
        const controls = [...document.querySelectorAll('button, a[href], input, select, textarea, [role="button"]')].filter(visible)
        const smallTargets = controls.filter(element => {
          const rect = element.getBoundingClientRect()
          return rect.width < 44 || rect.height < 44
        }).map(element => {
          const rect = element.getBoundingClientRect()
          return { tag: element.tagName, text: element.textContent?.trim().slice(0, 60), width: Math.round(rect.width), height: Math.round(rect.height) }
        }).slice(0, 20)
        const unnamedButtons = [...document.querySelectorAll('button')].filter(visible).filter(button => {
          return !(button.getAttribute('aria-label') || button.textContent?.trim() || button.getAttribute('title'))
        }).length
        const headings = [...document.querySelectorAll('h1, h2, h3')].filter(visible).map(heading => ({ level: Number(heading.tagName[1]), text: heading.textContent?.trim().slice(0, 80) }))
        return {
          overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          smallTargets,
          unnamedButtons,
          headings,
        }
      })

      const screenshot = path.join(outputDirectory, `${route.name}-${viewport.name}.png`)
      await page.screenshot({ path: screenshot, fullPage: true })
      results.push({ viewport: viewport.name, route: route.path, screenshot, pageErrors: [...pageErrors], ...metrics })
    }
    await context.close()
  }
} finally {
  await browser.close()
}

console.log(JSON.stringify({ results, secretsPrinted: false }, null, 2))
