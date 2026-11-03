import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { chromium } from 'playwright'

const base = 'https://test.hedsvs.ch'
const access = JSON.parse(await fs.readFile(new URL('gamification-pilot-accounts.json', import.meta.url)))
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', import.meta.url)))
const student = access.accounts.student

assert.ok(student?.email, 'Compte étudiant de vérification absent')

const browser = await chromium.launch({ headless: true })
try {
  const context = await browser.newContext({
    serviceWorkers: 'block',
    httpCredentials: { username: gate.username, password: gate.password, origin: base },
  })
  const page = await context.newPage()
  const pageErrors = []
  const authRequests = []
  const authResponses = []
  const profileResponses = []
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('request', (request) => {
    if (!request.url().includes('/auth/v1/token')) return
    const body = request.postDataJSON()
    authRequests.push({
      emailPresent: Boolean(body?.email),
      passwordLength: typeof body?.password === 'string' ? body.password.length : 0,
    })
  })
  page.on('response', async (response) => {
    if (response.url().includes('/auth/v1/token')) {
      const body = await response.json().catch(() => ({}))
      authResponses.push({ status: response.status(), message: body?.msg || body?.message || body?.error_description || null })
    }
    if (response.url().includes('/rest/v1/user_profiles')) {
      const body = await response.json().catch(() => ({}))
      profileResponses.push({
        method: response.request().method(),
        status: response.status(),
        message: body?.message || body?.details || null,
      })
    }
  })

  await page.goto(`${base}/home`)
  const emailInput = page.locator('#auth-email')
  const passwordInput = page.locator('#auth-password input')
  await emailInput.waitFor({ state: 'visible' })
  await passwordInput.waitFor({ state: 'visible' })
  await emailInput.fill(student.email)
  await passwordInput.click()
  await passwordInput.pressSequentially(student.password)
  assert.equal(await emailInput.inputValue(), student.email)
  assert.equal((await passwordInput.inputValue()).length, student.password.length)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  const navigated = await page
    .waitForURL((url) => url.pathname !== '/home', { timeout: 20_000 })
    .then(() => true)
    .catch(() => false)
  if (!navigated) {
    const visibleMessage = await page.locator('body').innerText()
    throw new Error(`Connexion au compte pilote impossible: ${visibleMessage.slice(0, 500)}; requête=${JSON.stringify(authRequests)}; réponse=${JSON.stringify(authResponses)}`)
  }

  const userId = student.userId
  assert.ok(userId, 'Identifiant de session introuvable')

  await page.goto(`${base}/profile/${userId}`)
  const city = page.getByLabel('Ville', { exact: true })
  const language = page.getByLabel('Langue préférée', { exact: true })
  const canton = page.getByLabel('Canton d’origine', { exact: true })
  await city.waitFor({ state: 'visible', timeout: 20_000 })

  const previousCity = await city.inputValue()
  const previousLanguage = await language.textContent()
  const previousCanton = await canton.textContent()

  await city.fill('Sion')
  await language.click()
  await page.getByRole('option', { name: 'Français', exact: true }).click()
  await canton.click()
  await page.getByRole('option', { name: 'Valais (VS)', exact: true }).click()
  await page.getByRole('button', { name: 'Sauvegarder le profil', exact: true }).click()
  const saved = await page.getByText('Profil mis à jour avec succès', { exact: true }).first()
    .waitFor({ timeout: 15_000 })
    .then(() => true)
    .catch(() => false)
  if (!saved) {
    const visibleMessage = await page.locator('body').innerText()
    throw new Error(`Sauvegarde du profil impossible: ${visibleMessage.slice(-700)}; réponses=${JSON.stringify(profileResponses)}`)
  }

  await page.reload()
  await page.getByLabel('Ville', { exact: true }).waitFor({ state: 'visible', timeout: 20_000 })
  assert.equal(await page.getByLabel('Ville', { exact: true }).inputValue(), 'Sion')
  assert.match(await page.getByLabel('Langue préférée', { exact: true }).textContent(), /Français/)
  assert.match(await page.getByLabel('Canton d’origine', { exact: true }).textContent(), /Valais/)
  assert.deepEqual(pageErrors, [])

  console.log(JSON.stringify({
    ownProfileEditable: true,
    cityPersisted: true,
    preferredLanguagePersisted: true,
    cantonOfOriginPersisted: true,
    previousValuesRecorded: Boolean(previousCity || previousLanguage || previousCanton),
    pageErrors,
    secretsPrinted: false,
  }, null, 2))
} finally {
  await browser.close()
}
