import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const access = JSON.parse(await fs.readFile(new URL('real-test-access.json', directory)))
const env = Object.fromEntries(
  (await fs.readFile(new URL('.env', directory), 'utf8'))
    .trim()
    .split('\n')
    .map(line => {
      const separator = line.indexOf('=')
      return [line.slice(0, separator), line.slice(separator + 1)]
    })
)

const authResponse = await fetch(`${base}/auth/v1/token?grant_type=password`, {
  method: 'POST',
  headers: { apikey: env.STAGING_ANON_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: access.verificationAccounts[0].email, password: access.password })
})
assert.equal(authResponse.status, 200, 'La session admin test doit pouvoir être créée')
const session = await authResponse.json()

const routes = [
  { name: 'secretariat', path: '/admin/soins-infirmiers/dashboard', heading: 'Dashboard Secrétariat — Soins Infirmiers' },
  { name: 'rm', path: '/admin/dashboard-rm', heading: 'Dashboard RM Soins Infirmiers' },
  { name: 'daily', path: '/admin/soins-infirmiers/planning-journalier', heading: 'Vue Journalière — Gestion des Salles' },
  { name: 'workload', path: '/admin/soins-infirmiers/feuille-de-charges', heading: 'Feuille de charges — Enseignants SI' },
  { name: 'postulation', path: '/admin/soins-infirmiers/cours-postulation', heading: 'Cours en postulation (SI)' }
]

const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP test.hedsvs.ch 83.228.204.5']
})

async function newPage(viewport) {
  const context = await browser.newContext({
    viewport,
    serviceWorkers: 'block',
    httpCredentials: { ...gate, origin: base }
  })
  await context.addInitScript(authSession => {
    window.localStorage.setItem('supabase.auth.token', JSON.stringify(authSession))
  }, session)
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', error => pageErrors.push(error.message))
  await page.route('**/rest/v1/**', async route => {
    const pathname = new URL(route.request().url()).pathname
    const readOnlyRpc = pathname === '/rest/v1/rpc/api_my_permissions'
    if (!readOnlyRpc && !['GET', 'HEAD', 'OPTIONS'].includes(route.request().method())) return route.abort()
    await route.fallback()
  })
  return { context, page, pageErrors }
}

async function openRoute(page, target) {
  await page.goto(`${base}${target.path}`, { waitUntil: 'domcontentloaded' })
  await page.getByRole('heading', { name: target.heading }).waitFor({ timeout: 30000 })
  await page.locator('.loading-container, .loading-state').first().waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {})
  await page.waitForTimeout(400)
}

const results = []

try {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 1000 },
    { name: 'mobile', width: 390, height: 844 }
  ]) {
    for (const target of routes) {
      const { context, page, pageErrors } = await newPage(viewport)
      await openRoute(page, target)

      const unnamedButtons = await page.locator('button:visible').evaluateAll(buttons => buttons
        .filter(button => !button.disabled)
        .filter(button => {
          const visibleText = (button.innerText || '').trim()
          return !visibleText && !button.getAttribute('aria-label') && !button.getAttribute('aria-labelledby') && !button.title
        })
        .map(button => button.outerHTML.slice(0, 220)))
      assert.deepEqual(unnamedButtons, [], `${viewport.name}/${target.name}: bouton sans nom accessible`)

      const positiveTabIndexes = await page.locator('[tabindex]').evaluateAll(elements => elements
        .map(element => Number(element.getAttribute('tabindex')))
        .filter(value => value > 0))
      assert.deepEqual(positiveTabIndexes, [], `${viewport.name}/${target.name}: tabindex positif`)

      if (target.name === 'daily') {
        for (const id of ['si-daily-week', 'si-daily-day', 'si-daily-class']) {
          assert.equal(await page.locator(`label[for="${id}"]`).count(), 1, `label absent pour ${id}`)
        }
      }
      if (target.name === 'workload') {
        for (const id of ['si-workload-semester', 'si-workload-teacher', 'si-workload-class', 'si-workload-module', 'si-workload-type']) {
          assert.equal(await page.locator(`label[for="${id}"]`).count(), 1, `label absent pour ${id}`)
        }
      }
      if (target.name === 'postulation') {
        assert.equal(await page.locator('label[for="si-postulation-search"]').count(), 1, 'label absent pour la recherche postulation')
      }

      if (target.name === 'secretariat') {
        const shortcut = page.locator('a.shortcut-card[href="/admin/soins-infirmiers/planning-journalier"]')
        await page.locator('body').click({ position: { x: 1, y: 1 } })
        let shortcutReached = false
        for (let step = 0; step < 80; step += 1) {
          await page.keyboard.press('Tab')
          shortcutReached = await shortcut.evaluate(element => element === document.activeElement)
          if (shortcutReached) break
        }
        assert.equal(shortcutReached, true, 'le raccourci doit être atteignable avec Tab')
        const focusStyle = await shortcut.evaluate(element => {
          const style = getComputedStyle(element)
          return {
            focusVisible: element.matches(':focus-visible'),
            outlineWidth: style.outlineWidth,
          }
        })
        assert.equal(focusStyle.focusVisible, true, 'le raccourci doit utiliser :focus-visible')
        assert.ok(Number.parseFloat(focusStyle.outlineWidth) >= 2, 'le raccourci doit avoir un focus visible')
        await page.keyboard.press('Enter')
        await page.waitForURL(url => url.pathname === '/admin/soins-infirmiers/planning-journalier')
        await page.getByRole('heading', { name: 'Vue Journalière — Gestion des Salles' }).waitFor()
        const titleFocused = await page.getByRole('heading', { name: 'Vue Journalière — Gestion des Salles' }).evaluate(element => element === document.activeElement)
        assert.equal(titleFocused, true, 'le titre de destination doit recevoir le focus')
      }

      if (viewport.name === 'mobile') {
        const menuButton = page.getByRole('button', { name: 'Menu administration', exact: true })
        await menuButton.focus()
        await page.keyboard.press('Enter')
        await page.locator('#admin-sidebar-navigation.is-mobile-open').waitFor({ state: 'visible' })
        const focusInsideMenu = await page.evaluate(() => Boolean(document.activeElement?.closest('#admin-sidebar-navigation')))
        assert.equal(focusInsideMenu, true, 'le focus doit entrer dans le tiroir mobile')
        await page.keyboard.press('Escape')
        await page.locator('#admin-sidebar-navigation.is-mobile-open').waitFor({ state: 'detached' })
        assert.equal(await menuButton.evaluate(element => element === document.activeElement), true, 'Échap doit rendre le focus au bouton du menu')
      }

      assert.deepEqual(pageErrors, [], `${viewport.name}/${target.name}: erreur JavaScript`)
      results.push({ viewport: viewport.name, route: target.name, unnamedButtons: unnamedButtons.length, pageErrors })
      await context.close()
    }
  }

  console.log(JSON.stringify({ environment: base, results }, null, 2))
} finally {
  await browser.close()
}
