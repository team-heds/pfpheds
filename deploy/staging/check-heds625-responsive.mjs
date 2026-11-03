import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const credentials = JSON.parse(await fs.readFile(new URL('gamification-pilot-accounts.json', directory)))
const outputDirectory = path.resolve('artifacts/HEDS25-625')
await fs.mkdir(outputDirectory, { recursive: true })

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'tablet', width: 834, height: 1112 },
  { name: 'desktop', width: 1440, height: 1000 },
]

const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP test.hedsvs.ch 83.228.204.5'],
})
const results = []
try {
  for (const viewport of viewports) {
    const context = await browser.newContext({ viewport, httpCredentials: { ...gate, origin: base } })
    const page = await context.newPage()
    await page.goto(`${base}/home?redirect=${encodeURIComponent('/admin/dashboard-gamification')}`)
    await page.locator('input[type=email]').fill(credentials.accounts.admin.email)
    await page.locator('input[type=password]').fill(credentials.accounts.admin.password)
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
    await page.waitForURL((url) => url.pathname === '/admin/dashboard-gamification', { timeout: 20000 })
    await page.getByRole('heading', { name: 'État du système' }).waitFor()

    const layout = await page.evaluate(() => {
      const root = document.documentElement
      const smallTargetElements = [...document.querySelectorAll('.gamification-dashboard button')].filter((element) => {
        const rect = element.getBoundingClientRect()
        return rect.width > 0 && rect.height > 0 && (rect.width < 40 || rect.height < 40)
      })
      return {
        overflow: root.scrollWidth > root.clientWidth + 1,
        smallTargets: smallTargetElements.length,
        smallTargetDetails: smallTargetElements.map((element) => {
          const rect = element.getBoundingClientRect()
          return { text: element.textContent?.trim(), className: element.className, width: rect.width, height: rect.height }
        }),
      }
    })
    assert.equal(layout.overflow, false, `${viewport.name}: horizontal overflow`)
    assert.equal(layout.smallTargets, 0, `${viewport.name}: controls below 40px ${JSON.stringify(layout.smallTargetDetails)}`)
    await page.screenshot({ path: path.join(outputDirectory, `${viewport.name}.png`), fullPage: true })
    results.push({ ...viewport, ...layout })
    await context.close()
  }
} finally {
  await browser.close()
}

console.log(JSON.stringify({ responsiveVerified: true, results, outputDirectory }, null, 2))
