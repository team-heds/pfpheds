import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const directory = new URL('./', import.meta.url)
const access = JSON.parse(await fs.readFile(new URL('real-test-access.json', directory)))
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const sql = (query) => execFileSync('ssh', [
  '-o', 'BatchMode=yes', 'heds-vps',
  'sudo -n docker exec -i pfpheds-staging-db-1 psql -X -v ON_ERROR_STOP=1 -U postgres -d staging -At',
], { input: query, encoding: 'utf8' }).trim()
const studentEmail = sql(`
  SELECT u.email
  FROM votation_sessions session
  CROSS JOIN LATERAL jsonb_array_elements_text(COALESCE(session.priority_user_ids, '[]'::jsonb)) priority(user_id)
  JOIN auth.users u ON u.id::text = priority.user_id
  WHERE session.status = 'open' AND session.pfp_type = 'PFP2'
  ORDER BY session.created_at DESC
  LIMIT 1;
`)

assert.ok(studentEmail, 'Aucun compte étudiant prioritaire disponible pour le contrôle')

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    httpCredentials: { username: gate.username, password: gate.password, origin: base },
  })
  const page = await context.newPage()
  const pageErrors = []
  page.on('pageerror', (error) => pageErrors.push(error.message))

  await page.goto(`${base}/home`)
  await page.locator('input[type=email]').fill(studentEmail)
  await page.locator('input[type=password]').fill(access.password)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await page.waitForURL((url) => url.pathname !== '/home', { timeout: 20_000 })
  await page.goto(`${base}/votation/PFP2`)
  await page.locator('.votation-container, .pi-lock').first().waitFor({ timeout: 20_000 })
  await page.waitForLoadState('networkidle').catch(() => {})

  const state = await page.evaluate(() => {
    for (const element of document.querySelectorAll('*')) {
      let component = element.__vueParentComponent
      while (component) {
        if (component.type?.name === 'VotationGenericView') {
          const view = component.proxy
          return {
            targetPFP: view.targetPFP,
            missingCriteria: [...(view.pfp4MissingCriteria || [])],
            sectionsEnabled: view.hasPfp4Sections,
            rows: (view.expandedPFPData || []).slice(0, 12).map((row) => ({
              section: row.pfp4Section || null,
              covered: row.pfp4CoveredCount || 0,
            })),
          }
        }
        component = component.parent
      }
    }
    return null
  })

  assert.ok(state, 'Vue de votation introuvable')
  assert.equal(state.targetPFP, 'PFP2')
  assert.equal(pageErrors.length, 0, `Erreurs navigateur: ${pageErrors.join('; ')}`)
  if (state.missingCriteria.length > 0 && state.rows.length > 0) {
    assert.equal(state.sectionsEnabled, true, 'Le tri par critères PFP2 doit être actif')
    const order = { high: 0, medium: 1, other: 2 }
    const scores = state.rows.map((row) => order[row.section] ?? 2)
    assert.deepEqual(scores, [...scores].sort((left, right) => left - right))
  }

  console.log(JSON.stringify({
    targetPFP: state.targetPFP,
    missingCriteriaCount: state.missingCriteria.length,
    sectionsEnabled: state.sectionsEnabled,
    firstSections: state.rows.map((row) => row.section),
    pageErrors,
    secretsPrinted: false,
  }, null, 2))
} finally {
  await browser.close()
}
