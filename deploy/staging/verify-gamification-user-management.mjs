import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { chromium } from 'playwright'
import { createClient } from '@supabase/supabase-js'

const base = 'https://test.hedsvs.ch'
const apiEndpoint = process.env.HEDS_STAGING_URL || 'http://localhost:8180'
const directory = new URL('./', import.meta.url)
const gate = JSON.parse(await fs.readFile(new URL('web-access.json', directory)))
const credentials = JSON.parse(await fs.readFile(new URL('gamification-pilot-accounts.json', directory)))
const env = Object.fromEntries(
  (await fs.readFile(new URL('.env', directory), 'utf8'))
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const separator = line.indexOf('=')
      return [line.slice(0, separator), line.slice(separator + 1)]
    })
)

if (!env.STAGING_ANON_KEY || !env.STAGING_SERVICE_ROLE_KEY) {
  throw new Error('Staging Supabase keys unavailable')
}

const service = createClient(apiEndpoint, env.STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const admin = createClient(apiEndpoint, env.STAGING_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const student = credentials.accounts.student
const observations = { pageErrors: [], failedResponses: [] }
const mutation = { xpAdded: false, houseChanged: false }

const { error: signInError } = await admin.auth.signInWithPassword({
  email: credentials.accounts.admin.email,
  password: credentials.accounts.admin.password,
})
if (signInError) throw signInError

const readState = async () => {
  const { data: gamification, error: gamificationError } = await service
    .from('gamification_data')
    .select('user_id,email,total_xp,current_level,house_id')
    .eq('user_id', student.userId)
    .single()
  if (gamificationError) throw gamificationError

  const { data: profile, error: profileError } = await service
    .from('user_profiles')
    .select('display_name,house_id')
    .eq('user_id', student.userId)
    .single()
  if (profileError) throw profileError

  return { gamification, profile }
}

const baseline = await readState()
assert.equal(baseline.gamification.house_id, baseline.profile.house_id)
assert.ok(baseline.gamification.house_id, 'Pilot student must have an original house for reversible testing')

const { data: houses, error: housesError } = await service
  .from('houses')
  .select('id,name')
  .in('name', ['Harmonis', 'Elaris', 'Doloris', 'Solencia'])
if (housesError) throw housesError

const originalHouse = houses.find(house => house.id === baseline.gamification.house_id)
const targetHouse = houses.find(house => house.id !== baseline.gamification.house_id)
assert.ok(originalHouse && targetHouse, 'Reversible house pair unavailable')

const cleanup = async () => {
  const failures = []
  if (mutation.houseChanged) {
    const { error } = await admin.rpc('admin_assign_user_gamification_house', {
      p_user_id: student.userId,
      p_house_id: baseline.gamification.house_id,
    })
    if (error) failures.push(`house:${error.message}`)
    else mutation.houseChanged = false
  }

  if (mutation.xpAdded) {
    const { error } = await admin.rpc('admin_adjust_user_gamification_xp', {
      p_user_id: student.userId,
      p_amount: -1,
      p_reason: '[TEST] Annulation du contrôle interface utilisateurs',
      p_adjustment_id: crypto.randomUUID(),
    })
    if (error) failures.push(`xp:${error.message}`)
    else mutation.xpAdded = false
  }

  if (failures.length) throw new Error(`Synthetic cleanup failed: ${failures.join(' | ')}`)
}

const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP test.hedsvs.ch 83.228.204.5'],
})

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    httpCredentials: { username: gate.username, password: gate.password, origin: base },
  })
  const page = await context.newPage()
  page.on('pageerror', error => observations.pageErrors.push(error.message))
  page.on('response', response => {
    const url = new URL(response.url())
    if (url.origin === base && response.status() >= 400 && url.pathname !== '/favicon.ico') {
      observations.failedResponses.push({ status: response.status(), path: url.pathname })
    }
  })

  await page.goto(`${base}/home?redirect=${encodeURIComponent('/admin/gamification/users?house=Elaris')}`)
  await page.locator('input[type=email]').fill(credentials.accounts.admin.email)
  await page.locator('input[type=password]').fill(credentials.accounts.admin.password)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/admin/gamification/users', { timeout: 25000 })
  await page.getByText('Chargement des utilisateurs...').waitFor({ state: 'hidden', timeout: 30000 })

  // Le filtre piloté par l'URL doit être actif et ne laisser apparaître que la maison demandée.
  const cards = page.locator('.surface-card')
  assert.ok(await cards.count() > 0, 'Elaris filter returned no users')
  for (let index = 0; index < await cards.count(); index += 1) {
    await expectText(cards.nth(index), 'Elaris')
  }
  await page.screenshot({ path: '/tmp/gamification-users-elaris-desktop.png', fullPage: true })

  assert.equal(await page.getByRole('button', { name: 'Réinitialiser le mot de passe' }).count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Ajouter Points', exact: true }).count(), 0)

  // Rechercher le compte pilote puis exercer les deux actions administratives réelles.
  await page.goto(`${base}/admin/gamification/users`)
  await page.getByText('Chargement des utilisateurs...').waitFor({ state: 'hidden', timeout: 30000 })
  await page.getByLabel('Rechercher un utilisateur').fill(student.email)
  const pilotCard = page.locator('.surface-card').filter({ hasText: student.email }).first()
  await pilotCard.waitFor({ state: 'visible', timeout: 10000 })

  await pilotCard.getByRole('button', { name: 'Ajouter des XP', exact: true }).click()
  let dialog = page.getByRole('dialog', { name: 'Ajouter des XP' })
  await dialog.locator('#user-xp-amount').fill('1')
  await dialog.locator('#user-xp-reason').fill('[TEST] Contrôle interface utilisateurs')
  await dialog.getByRole('button', { name: 'Confirmer l’ajout d’XP', exact: true }).click()
  await page.getByText(/Points ajoutés/).waitFor({ timeout: 15000 })
  mutation.xpAdded = true

  let changed = await readState()
  assert.equal(changed.gamification.total_xp, baseline.gamification.total_xp + 1)

  await page.getByLabel('Rechercher un utilisateur').fill(student.email)
  const refreshedCard = page.locator('.surface-card').filter({ hasText: student.email }).first()
  await refreshedCard.getByRole('button', { name: /Changer la maison de/ }).click()
  dialog = page.getByRole('dialog', { name: 'Changer la maison' })
  await dialog.getByLabel('Nouvelle maison de l’utilisateur').click()
  await page.getByRole('option', { name: targetHouse.name, exact: true }).click()
  await dialog.getByRole('button', { name: 'Enregistrer la maison', exact: true }).click()
  await page.getByText('Maison modifiée', { exact: true }).waitFor({ timeout: 15000 })
  mutation.houseChanged = true

  changed = await readState()
  assert.equal(changed.gamification.house_id, targetHouse.id)
  assert.equal(changed.profile.house_id, targetHouse.id)

  // Contrôle mobile du même écran et des actions exposées.
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(`${base}/admin/gamification/users`)
  await page.getByText('Chargement des utilisateurs...').waitFor({ state: 'hidden', timeout: 30000 })
  await page.getByLabel('Rechercher un utilisateur').fill(student.email)
  await page.locator('.surface-card').filter({ hasText: student.email }).first().waitFor()
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), true)
  const mobileLayout = await page.evaluate(() => {
    const content = document.querySelector('.admin-content')?.getBoundingClientRect()
    const header = document.querySelector('.admin-gamification-page-header')?.getBoundingClientRect()
    return {
      contentLeft: content?.left,
      contentRight: content?.right,
      contentWidth: content?.width,
      headerRight: header?.right,
      viewportWidth: window.innerWidth,
    }
  })
  assert.ok(mobileLayout.contentLeft <= 32, `Admin content starts outside mobile viewport: ${JSON.stringify(mobileLayout)}`)
  assert.ok(mobileLayout.contentWidth >= 326, `Admin content is too narrow on mobile: ${JSON.stringify(mobileLayout)}`)
  assert.ok(mobileLayout.contentRight <= mobileLayout.viewportWidth, `Admin content is clipped: ${JSON.stringify(mobileLayout)}`)
  await page.screenshot({ path: '/tmp/gamification-users-mobile.png', fullPage: true })

  assert.deepEqual(observations.pageErrors, [])
  assert.deepEqual(observations.failedResponses, [])
  await context.close()

  await cleanup()
  const restored = await readState()
  assert.equal(restored.gamification.total_xp, baseline.gamification.total_xp)
  assert.equal(restored.gamification.house_id, baseline.gamification.house_id)
  assert.equal(restored.profile.house_id, baseline.profile.house_id)

  console.log(JSON.stringify({
    environment: 'test.hedsvs.ch',
    houseFilter: 'passed',
    xpAdjustment: 'passed-and-reversed',
    houseAssignment: `${originalHouse.name} -> ${targetHouse.name} -> ${originalHouse.name}`,
    profileHouseSynchronized: true,
    mobileOverflow: false,
    screenshots: ['/tmp/gamification-users-elaris-desktop.png', '/tmp/gamification-users-mobile.png'],
    cleanup: 'passed',
    productionTouched: false,
    secretsPrinted: false,
  }, null, 2))
} finally {
  await browser.close()
  if (mutation.xpAdded || mutation.houseChanged) await cleanup()
}

async function expectText(locator, expected) {
  const text = await locator.innerText()
  assert.ok(text.includes(expected), `Expected ${JSON.stringify(expected)} in ${JSON.stringify(text)}`)
}
