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

if (!env.STAGING_SERVICE_ROLE_KEY) throw new Error('Staging service key unavailable')

const service = createClient(apiEndpoint, env.STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const runId = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
const names = {
  quest: `[TEST] Quête administration ${runId}`,
  challenge: `[TEST] Défi administration ${runId}`,
  badge: `[TEST] Badge administration ${runId}`,
}
const created = { quest: null, challenge: null, badge: null }
const observations = { pageErrors: [], failedResponses: [] }

const browser = await chromium.launch({
  headless: true,
  args: ['--host-resolver-rules=MAP test.hedsvs.ch 83.228.204.5'],
})

const selectOption = async (dialog, inputId, option) => {
  await dialog.locator(`#${inputId}`).click()
  await dialog.page().getByRole('option', { name: option, exact: true }).click()
}

const readSingle = async (table, column, value, fields) => {
  const { data, error } = await service.from(table).select(fields).eq(column, value).single()
  if (error) throw error
  return data
}

const cardFor = (page, text) => page.locator('.surface-card').filter({ hasText: text }).first()

const cleanup = async () => {
  const attempts = [
    ['quests', created.quest],
    ['challenges', created.challenge],
    ['badges', created.badge],
  ]
  const failures = []
  for (const [table, id] of attempts) {
    if (!id) continue
    const { error } = await service.from(table).delete().eq('id', id)
    if (error) failures.push(`${table}:${error.message}`)
  }
  if (failures.length) throw new Error(`Synthetic cleanup failed: ${failures.join(' | ')}`)
}

try {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    httpCredentials: { username: gate.username, password: gate.password, origin: base },
  })
  const page = await context.newPage()
  page.on('pageerror', error => observations.pageErrors.push(error.message))
  page.on('response', response => {
    const url = new URL(response.url())
    if (url.origin === base && response.status() >= 400) {
      observations.failedResponses.push({ status: response.status(), path: url.pathname })
    }
  })

  await page.goto(`${base}/home?redirect=${encodeURIComponent('/admin/gamification/quests')}`)
  await page.locator('input[type=email]').fill(credentials.accounts.admin.email)
  await page.locator('input[type=password]').fill(credentials.accounts.admin.password)
  await page.getByRole('button', { name: 'Se connecter', exact: true }).click()
  await page.waitForURL(url => url.pathname === '/admin/gamification/quests', { timeout: 25000 })

  // Quête : créer, modifier, archiver.
  await page.getByRole('button', { name: 'Nouvelle Quête', exact: true }).click()
  let dialog = page.getByRole('dialog').last()
  await dialog.getByLabel('Titre de la Quête *').fill(names.quest)
  await dialog.getByLabel('Description Détaillée *').fill('Scénario synthétique de validation de l’administration.')
  await selectOption(dialog, 'quest-type', 'Secondaire')
  await dialog.getByRole('button', { name: 'Créer', exact: true }).click()
  await page.getByText('Quête créée avec succès', { exact: true }).waitFor({ timeout: 15000 })
  let row = await readSingle('quests', 'title', names.quest, 'id,title,status')
  created.quest = row.id
  assert.equal(row.status, 'draft')

  let card = cardFor(page, names.quest)
  await card.getByRole('button', { name: `Modifier la quête ${names.quest}` }).click()
  dialog = page.getByRole('dialog').last()
  const editedQuest = `${names.quest} — modifiée`
  await dialog.getByLabel('Titre de la Quête *').fill(editedQuest)
  await dialog.getByRole('button', { name: 'Modifier', exact: true }).click()
  await page.getByText('Quête modifiée avec succès', { exact: true }).waitFor({ timeout: 15000 })
  row = await readSingle('quests', 'id', created.quest, 'id,title,status')
  assert.equal(row.title, editedQuest)
  card = cardFor(page, editedQuest)
  await card.getByRole('button', { name: `Archiver la quête ${editedQuest}` }).click()
  await page.getByRole('dialog').last().getByRole('button', { name: 'Archiver', exact: true }).click()
  await page.getByText('Quête archivée avec historique conservé', { exact: true }).waitFor({ timeout: 15000 })
  row = await readSingle('quests', 'id', created.quest, 'id,status')
  assert.equal(row.status, 'archived')

  // Défi : créer, modifier, archiver.
  await page.goto(`${base}/admin/gamification/challenges`)
  await page.getByRole('button', { name: 'Nouveau Défi', exact: true }).click()
  dialog = page.getByRole('dialog').last()
  await dialog.getByLabel('Titre *').fill(names.challenge)
  await dialog.getByLabel('Description *').fill('Scénario synthétique de validation du formulaire Défi.')
  await selectOption(dialog, 'challenge-action-type', 'Publication')
  await dialog.getByRole('button', { name: 'Créer', exact: true }).click()
  await page.getByText('Défi créé avec succès', { exact: true }).waitFor({ timeout: 15000 })
  row = await readSingle('challenges', 'name', names.challenge, 'id,name,status')
  created.challenge = row.id
  assert.equal(row.status, 'draft')

  card = cardFor(page, names.challenge)
  await card.getByRole('button', { name: `Modifier le défi ${names.challenge}` }).click()
  dialog = page.getByRole('dialog').last()
  const editedChallenge = `${names.challenge} — modifié`
  await dialog.getByLabel('Titre *').fill(editedChallenge)
  await dialog.getByRole('button', { name: 'Modifier', exact: true }).click()
  await page.getByText('Défi modifié avec succès', { exact: true }).waitFor({ timeout: 15000 })
  row = await readSingle('challenges', 'id', created.challenge, 'id,name,status')
  assert.equal(row.name, editedChallenge)
  card = cardFor(page, editedChallenge)
  await card.getByRole('button', { name: `Archiver le défi ${editedChallenge}` }).click()
  await page.getByRole('dialog').last().getByRole('button', { name: 'Archiver', exact: true }).click()
  await page.getByText('Défi archivé avec succès', { exact: true }).waitFor({ timeout: 15000 })
  row = await readSingle('challenges', 'id', created.challenge, 'id,status')
  assert.equal(row.status, 'archived')

  // Badge : créer, modifier, désactiver.
  await page.goto(`${base}/admin/gamification/badges`)
  await page.getByRole('button', { name: 'Nouveau Badge', exact: true }).click()
  dialog = page.getByRole('dialog').last()
  await dialog.getByLabel('Nom *').fill(names.badge)
  await dialog.getByLabel('Description *').fill('Scénario synthétique de validation du formulaire Badge.')
  await selectOption(dialog, 'badge-category', 'Participation')
  await selectOption(dialog, 'badge-rarity', 'Commun')
  await dialog.getByRole('button', { name: 'Créer', exact: true }).click()
  await page.getByText('Badge créé avec succès', { exact: true }).waitFor({ timeout: 15000 })
  row = await readSingle('badges', 'name', names.badge, 'id,name,is_active')
  created.badge = row.id
  assert.equal(row.is_active, true)

  card = cardFor(page, names.badge)
  await card.getByRole('button', { name: `Modifier le badge ${names.badge}` }).click()
  dialog = page.getByRole('dialog').last()
  const editedBadge = `${names.badge} — modifié`
  await dialog.getByLabel('Nom *').fill(editedBadge)
  await dialog.getByRole('button', { name: 'Modifier', exact: true }).click()
  await page.getByText('Badge modifié avec succès', { exact: true }).waitFor({ timeout: 15000 })
  row = await readSingle('badges', 'id', created.badge, 'id,name,is_active')
  assert.equal(row.name, editedBadge)
  card = cardFor(page, editedBadge)
  await card.getByRole('button', { name: `Désactiver le badge ${editedBadge}` }).click()
  await page.getByRole('dialog').last().getByRole('button', { name: 'Désactiver', exact: true }).click()
  await page.getByText('Badge désactivé, historique conservé', { exact: true }).waitFor({ timeout: 15000 })
  row = await readSingle('badges', 'id', created.badge, 'id,is_active')
  assert.equal(row.is_active, false)

  assert.deepEqual(observations.pageErrors, [])
  assert.deepEqual(observations.failedResponses, [])
  await context.close()

  await cleanup()
  created.quest = null
  created.challenge = null
  created.badge = null

  console.log(JSON.stringify({
    environment: 'test.hedsvs.ch',
    quest: ['create', 'update', 'archive'],
    challenge: ['create', 'update', 'archive'],
    badge: ['create', 'update', 'deactivate'],
    cleanup: 'passed',
    productionTouched: false,
    secretsPrinted: false,
  }, null, 2))
} finally {
  await browser.close()
  if (created.quest || created.challenge || created.badge) await cleanup()
}
