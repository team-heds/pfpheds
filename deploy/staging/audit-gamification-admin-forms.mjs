import fs from 'node:fs/promises'
import path from 'node:path'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const credentials = JSON.parse(await fs.readFile(new URL('gamification-pilot-accounts.json', directory)))
const outputDirectory = path.resolve('artifacts/gamification-admin-forms')
const cases = [
  { name: 'quest', path: '/admin/gamification/quests', button: 'Nouvelle Quête' },
  { name: 'challenge', path: '/admin/gamification/challenges', button: 'Nouveau Défi' },
  { name: 'badge', path: '/admin/gamification/badges', button: 'Nouveau Badge' },
]
const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 1000 },
]
const readOnlyRpcPaths = new Set(['/rest/v1/rpc/api_my_permissions'])

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
    const mutations = []
    page.on('pageerror', error => pageErrors.push(error.message))
    page.on('request', request => {
      const method = request.method()
      const requestPath = new URL(request.url()).pathname
      if (
        !['GET', 'HEAD', 'OPTIONS'].includes(method)
        && request.url().includes('/rest/v1/')
        && !readOnlyRpcPaths.has(requestPath)
      ) {
        mutations.push({ method, path: requestPath })
      }
    })

    await page.goto(`${base}/home?redirect=${encodeURIComponent(cases[0].path)}`)
    await page.locator('input[type=email]').fill(credentials.accounts.admin.email)
    await page.locator('input[type=password]').fill(credentials.accounts.admin.password)
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
    await page.waitForURL(url => url.pathname === cases[0].path, { timeout: 20000 })

    for (const testCase of cases) {
      mutations.length = 0
      pageErrors.length = 0
      await page.goto(base + testCase.path)
      await page.getByRole('button', { name: testCase.button, exact: true }).waitFor({ timeout: 15000 })
      await page.getByRole('button', { name: testCase.button, exact: true }).click()
      const dialog = page.getByRole('dialog').last()
      await dialog.waitFor({ timeout: 10000 })

      const metrics = await dialog.evaluate((element) => {
        const visible = node => {
          const style = window.getComputedStyle(node)
          const rect = node.getBoundingClientRect()
          return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0
        }
        const rect = element.getBoundingClientRect()
        const controls = [...element.querySelectorAll('input, textarea, select')].filter(visible)
        const unlabeledFields = controls.filter(control => {
          if (control.getAttribute('aria-label') || control.getAttribute('aria-labelledby')) return false
          if (control.id && element.querySelector(`label[for="${CSS.escape(control.id)}"]`)) return false
          return true
        }).map(control => ({ tag: control.tagName, type: control.getAttribute('type'), id: control.id }))
        const unnamedButtons = [...element.querySelectorAll('button')].filter(visible).filter(button => {
          return !(button.getAttribute('aria-label') || button.textContent?.trim() || button.getAttribute('title'))
        }).length
        return {
          insideViewport: rect.left >= -1 && rect.right <= window.innerWidth + 1,
          dialogWidth: Math.round(rect.width),
          dialogScrollWidth: element.scrollWidth,
          dialogClientWidth: element.clientWidth,
          controlCount: controls.length,
          unlabeledFields,
          unnamedButtons,
        }
      })

      const screenshot = path.join(outputDirectory, `${testCase.name}-${viewport.name}.png`)
      await page.screenshot({ path: screenshot, fullPage: true })
      await page.getByRole('button', { name: 'Annuler', exact: true }).last().click()
      await dialog.waitFor({ state: 'hidden' })

      assert.deepEqual(mutations, [], `${testCase.name}/${viewport.name}: unexpected database write`)
      results.push({ form: testCase.name, viewport: viewport.name, screenshot, pageErrors: [...pageErrors], mutations: [], ...metrics })
    }
    await context.close()
  }
} finally {
  await browser.close()
}

console.log(JSON.stringify({ results, secretsPrinted: false }, null, 2))
