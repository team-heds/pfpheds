import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const outputDirectory = path.resolve('artifacts/gamification-ui-audit')
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const credentials = JSON.parse(
  await fs.readFile(new URL('gamification-pilot-accounts.json', directory))
)
const student = credentials.accounts.student
const pages = [
  { name: 'quests', path: '/quests' },
  { name: 'challenges', path: '/challenges' },
  { name: 'achievements', path: '/achievements' },
  { name: 'ranking', path: '/houses/ranking' },
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
      reducedMotion: 'reduce',
      httpCredentials: { ...gate, origin: base },
    })
    const page = await context.newPage()
    const diagnostics = { pageErrors: [], consoleErrors: [], failedResponses: [] }
    page.on('pageerror', error => diagnostics.pageErrors.push(error.message))
    page.on('console', message => {
      if (message.type() !== 'error') return
      if (message.location().url.startsWith('https://jnn-pa.googleapis.com/')) return
      diagnostics.consoleErrors.push(message.text())
    })
    page.on('response', response => {
      const url = new URL(response.url())
      if (url.origin === base && response.status() >= 400) {
        diagnostics.failedResponses.push({ status: response.status(), path: url.pathname })
      }
    })

    await page.goto(`${base}/home?redirect=${encodeURIComponent('/quests')}`)
    await page.locator('input[type=email]').fill(student.email)
    await page.locator('input[type=password]').fill(student.password)
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
    await page.waitForURL(url => url.pathname === '/quests', { timeout: 25000 })

    for (const target of pages) {
      await page.goto(base + target.path)
      await page.waitForLoadState('networkidle').catch(() => {})
      await page.locator('body').waitFor({ state: 'visible' })

      const metrics = await page.evaluate(() => {
        const visible = element => {
          const rect = element.getBoundingClientRect()
          const style = getComputedStyle(element)
          return rect.width > 0 && rect.height > 0
            && style.visibility !== 'hidden' && style.display !== 'none'
        }
        const controls = [...document.querySelectorAll(
          'button, a[href], input, select, textarea, [role="button"], [tabindex="0"]'
        )].filter(visible)
        const smallTargets = controls.flatMap(element => {
          const rect = element.getBoundingClientRect()
          if (rect.width >= 44 && rect.height >= 44) return []
          return [{
            tag: element.tagName,
            text: element.textContent?.trim().slice(0, 60) || '',
            ariaLabel: element.getAttribute('aria-label'),
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          }]
        })
        const unnamedControls = controls.filter(element => {
          if (element.matches('input, select, textarea')) return false
          return !(element.getAttribute('aria-label') || element.textContent?.trim() || element.getAttribute('title'))
        }).length
        const unlabeledFieldDetails = [...document.querySelectorAll('input, select, textarea')]
          .filter(visible)
          .filter(element => {
            const id = element.id
            return !(element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')
              || (id && document.querySelector(`label[for="${CSS.escape(id)}"]`)))
          })
          .map(element => ({
            tag: element.tagName,
            id: element.id,
            type: element.getAttribute('type'),
            placeholder: element.getAttribute('placeholder'),
            className: element.className,
          }))
        const headingLevels = [...document.querySelectorAll('h1, h2, h3, h4, h5, h6')]
          .filter(visible)
          .map(element => Number(element.tagName.slice(1)))
        const headingSkips = headingLevels.reduce((count, level, index) => (
          index > 0 && level > headingLevels[index - 1] + 1 ? count + 1 : count
        ), 0)
        return {
          title: document.title,
          bodyLength: document.body.innerText.trim().length,
          horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
          controlCount: controls.length,
          smallTargets,
          unnamedControls,
          unlabeledFields: unlabeledFieldDetails.length,
          unlabeledFieldDetails,
          headingLevels,
          headingSkips,
          missingAltImages: [...document.querySelectorAll('img')].filter(image => !image.hasAttribute('alt')).length,
        }
      })

      const screenshot = path.join(outputDirectory, `${target.name}-${viewport.name}.png`)
      await page.screenshot({ path: screenshot, fullPage: true })
      results.push({ viewport: viewport.name, route: target.path, screenshot, ...metrics })
    }

    results.push({ viewport: viewport.name, diagnostics })
    await context.close()
  }
} finally {
  await browser.close()
}

console.log(JSON.stringify({
  audit: 'gamification-ui',
  environment: base,
  results,
  containsPersonalData: false,
  secretsPrinted: false,
}, null, 2))
