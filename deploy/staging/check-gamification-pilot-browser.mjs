import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const credentials = JSON.parse(
  await fs.readFile(new URL('gamification-pilot-accounts.json', directory))
)

const cases = [
  {
    role: 'admin',
    account: credentials.accounts.admin,
    paths: [
      '/admin/gamification/badges',
      '/admin/dashboard-gamification',
      '/admin/gamification/houses',
      '/admin/gamification/users',
      '/admin/gamification/quests',
      '/admin/gamification/challenges',
      `/gamification-profile/${credentials.accounts.student.userId}`,
    ],
  },
  {
    role: 'student',
    account: credentials.accounts.student,
    paths: [
      `/gamification-profile/${credentials.accounts.student.userId}`,
      '/quests',
      '/challenges',
      '/achievements',
      '/houses/ranking',
    ],
  },
]

const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP test.hedsvs.ch 83.228.204.5'],
})
const results = []
const isForbiddenHost = hostname => (
  /firebase/i.test(hostname)
  || [
    'identitytoolkit.googleapis.com',
    'securetoken.googleapis.com',
    'firebasestorage.googleapis.com',
  ].includes(hostname)
  || /\.firebaseio\.com$/i.test(hostname)
  || hostname === 'api2.hedsvs.ch'
  || hostname === 'www.hedsvs.ch'
)
try {
  for (const testCase of cases) {
    const context = await browser.newContext({
      httpCredentials: {
        username: gate.username,
        password: gate.password,
        origin: base,
      },
    })
    const page = await context.newPage()
    const forbiddenConnections = []
    const failedResponses = []
    const failureReads = []
    const pageErrors = []
    const firebaseConsoleMessages = []
    const consoleFailures = []
    const externalFailures = []

    page.on('pageerror', error => {
      pageErrors.push(error.stack || error.message)
    })
    page.on('console', message => {
      if (/firebase/i.test(message.text())) {
        firebaseConsoleMessages.push({ type: message.type(), text: message.text() })
      }
      if (message.type() === 'error' || message.type() === 'warning') {
        consoleFailures.push({ type: message.type(), text: message.text() })
      }
    })

    page.on('request', request => {
      const url = new URL(request.url())
      if (isForbiddenHost(url.hostname)) {
        forbiddenConnections.push({
          hostname: url.hostname,
          path: url.pathname,
          resourceType: request.resourceType(),
        })
      }
    })
    page.on('response', response => {
      const url = new URL(response.url())
      if (response.status() >= 400) {
        externalFailures.push({ status: response.status(), hostname: url.hostname, path: url.pathname })
      }
      if (url.origin === base && response.status() >= 400) {
        failureReads.push((async () => {
          const body = await response.text().catch(() => '')
          failedResponses.push({
            status: response.status(),
            path: url.pathname,
            query: url.search,
            body: body.slice(0, 500),
          })
        })())
      }
    })

    const initialPath = testCase.paths[0]
    await page.goto(`${base}/home?redirect=${encodeURIComponent(initialPath)}`)
    await page.locator('input[type=email]').waitFor({ timeout: 15000 }).catch(async () => {
      const body = (await page.locator('body').innerText().catch(() => '')).slice(0, 1200)
      throw new Error(`Login form unavailable at ${page.url()}: ${body}`)
    })
    await page.locator('input[type=email]').fill(testCase.account.email)
    await page.locator('input[type=password]').fill(testCase.account.password)
    await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
    await page.waitForURL(url => url.pathname === initialPath, { timeout: 20000 })

    const visited = []
    for (const path of testCase.paths) {
      await page.goto(base + path)
      await page.waitForLoadState('networkidle').catch(() => {})
      const currentPath = new URL(page.url()).pathname
      assert.equal(currentPath, path, `${testCase.role} redirected from ${path}`)
      // Lazy Vue routes can finish their network work before the async view is
      // committed to the DOM. Wait for meaningful route content instead of
      // sampling the transient empty router outlet.
      await page.waitForFunction(
        () => (document.body?.innerText || '').trim().length > 50,
        null,
        { timeout: 10000 }
      ).catch(() => {})
      const bodyText = (await page.locator('body').innerText()).trim()
      const appHtml = await page.locator('#app').innerHTML().catch(() => '')
      assert.ok(
        bodyText.length > 50,
        `${testCase.role} rendered an empty page at ${path}; page errors: ${pageErrors.join(' | ') || 'none'}; console: ${JSON.stringify(consoleFailures.slice(-5))}; responses: ${JSON.stringify(externalFailures.slice(-8))}; app: ${appHtml.slice(0, 500)}`
      )
      visited.push(path)
      if (path === '/admin/dashboard-gamification') {
        await page.waitForTimeout(2000)
        const dashboardText = await page.locator('body').innerText()
        await Promise.all(failureReads)
        assert.match(dashboardText, /État du système/, `Console unavailable; failed responses: ${JSON.stringify(failedResponses)}`)
        await page.getByRole('heading', { name: 'Règles XP' }).waitFor()
        await page.getByText('Aucun ajout manuel d’XP ici').waitFor()
        await page.getByText('Événements refusés', { exact: true }).waitFor()
      }
      if (path.startsWith('/gamification-profile/')) {
        await page.getByRole('heading', { name: 'Historique de vos points' }).waitFor()
      }
    }

    let legacyChallengeRedirect = null
    if (testCase.role === 'admin') {
      await page.goto(`${base}/admin/defis`)
      await page.waitForLoadState('networkidle').catch(() => {})
      legacyChallengeRedirect = new URL(page.url()).pathname
      assert.equal(legacyChallengeRedirect, '/admin/gamification/challenges')
    }

    await Promise.all(failureReads)
    assert.deepEqual(forbiddenConnections, [])
    assert.deepEqual(failedResponses, [])
    assert.deepEqual(pageErrors, [])
    assert.deepEqual(firebaseConsoleMessages, [])
    results.push({ role: testCase.role, login: true, visited, legacyChallengeRedirect })
    await context.close()
  }
} finally {
  await browser.close()
}

console.log(JSON.stringify({
  browserVerified: true,
  accounts: results,
  forbiddenConnections: 0,
  failedResponses: 0,
  secretsPrinted: false,
}, null, 2))
