import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import * as XLSX from 'xlsx'

const clean = value => String(value ?? '').trim()
const normalized = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toUpperCase()

function locateRoster(rows, expectedCount) {
  if (!Array.isArray(rows)) throw new Error('Feuille Excel invalide.')
  const headerIndex = rows.findIndex(row => normalized(row?.[0]) === 'NOM' && normalized(row?.[1]) === 'PRENOM')
  if (headerIndex < 0) throw new Error('Colonnes Nom et Prénom introuvables.')
  const headers = rows[headerIndex] || []
  const respondentColumns = headers
    .map((value, index) => ({ value: normalized(value), index }))
    .filter(entry => entry.value.includes('REPONDANT'))
  if (!respondentColumns.length) throw new Error('Colonne Répondant HES introuvable.')
  const respondentColumn = respondentColumns.at(-1).index
  const title = rows.slice(0, headerIndex).flat().map(clean).find(Boolean) || ''
  const titleCount = title.match(/\((\d+)\s+[ée]tudiant/i)
  const resolvedExpected = expectedCount ?? (titleCount ? Number(titleCount[1]) : null)
  if (!Number.isInteger(resolvedExpected) || resolvedExpected < 0) {
    throw new Error('Effectif attendu introuvable ou invalide.')
  }

  const rosterStartIndex = rows.findIndex((row, index) =>
    index > headerIndex && clean(row?.[0]) && clean(row?.[1]))
  if (rosterStartIndex < 0) throw new Error('Première ligne étudiante introuvable.')
  return {
    respondentColumn,
    expectedCount: resolvedExpected,
    rosterStartIndex,
    rosterRows: rows.slice(rosterStartIndex, rosterStartIndex + resolvedExpected)
  }
}

export function extractRosterEntries(rows, { expectedCount = null } = {}) {
  const located = locateRoster(rows, expectedCount)
  return located.rosterRows.map((row, offset) => ({
    row: located.rosterStartIndex + offset + 1,
    familyName: clean(row?.[0]),
    givenName: clean(row?.[1]),
    respondent: clean(row?.[located.respondentColumn])
  }))
}

export function inspectRosterRows(rows, { sheetName = '', expectedCount = null } = {}) {
  const located = locateRoster(rows, expectedCount)
  const { respondentColumn, rosterStartIndex, rosterRows } = located
  const resolvedExpected = located.expectedCount
  const issues = []
  const seen = new Set()
  let completeIdentities = 0
  let respondentsPresent = 0
  rosterRows.forEach((row, offset) => {
    const familyName = clean(row?.[0])
    const givenName = clean(row?.[1])
    if (!familyName || !givenName) {
      issues.push({ code: 'incomplete_identity', row: rosterStartIndex + offset + 1 })
      return
    }
    completeIdentities += 1
    const key = normalized(`${familyName}|${givenName}`)
    if (seen.has(key)) issues.push({ code: 'duplicate_name', row: rosterStartIndex + offset + 1 })
    seen.add(key)
    if (clean(row?.[respondentColumn])) respondentsPresent += 1
    else issues.push({ code: 'missing_respondent', row: rosterStartIndex + offset + 1 })
  })
  if (rosterRows.length !== resolvedExpected) issues.push({ code: 'truncated_roster' })

  const issueCounts = {}
  issues.forEach(({ code }) => { issueCounts[code] = (issueCounts[code] || 0) + 1 })
  return {
    sheetName,
    expectedCount: resolvedExpected,
    rosterRows: rosterRows.length,
    completeIdentities,
    uniqueNames: seen.size,
    respondentsPresent,
    respondentsMissing: resolvedExpected - respondentsPresent,
    respondentColumn: XLSX.utils.encode_col(respondentColumn),
    rosterStartRow: rosterStartIndex + 1,
    rosterEndRow: rosterStartIndex + resolvedExpected,
    workbookRosterReady: issues.length === 0,
    identityReady: false,
    campaignReady: false,
    issueCounts
  }
}

export async function inspectCampaignRosterWorkbook(filePath, { sheetName = 'Répartition CPT BA 25', expectedCount = null } = {}) {
  const { source, report } = await loadCampaignRosterWorkbook(filePath, { sheetName, expectedCount })
  return { source, ...report }
}

export async function loadCampaignRosterWorkbook(filePath, { sheetName = 'Répartition CPT BA 25', expectedCount = null } = {}) {
  const bytes = await readFile(filePath)
  const workbook = XLSX.read(bytes, { type: 'buffer', dense: true })
  const sheet = workbook.Sheets[sheetName]
  if (!sheet) throw new Error(`Feuille introuvable : ${sheetName}`)
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' })
  return {
    source: { fileName: path.basename(filePath), sha256: createHash('sha256').update(bytes).digest('hex') },
    report: inspectRosterRows(rows, { sheetName, expectedCount }),
    entries: extractRosterEntries(rows, { expectedCount })
  }
}

async function main() {
  const args = process.argv.slice(2)
  const filePath = args.find(arg => !arg.startsWith('--'))
  if (!filePath) throw new Error('Usage: npm run pfp:inspect-roster -- <fichier.xlsx> [--sheet=Nom] [--expected=63]')
  const sheetName = args.find(arg => arg.startsWith('--sheet='))?.slice('--sheet='.length)
  const expectedText = args.find(arg => arg.startsWith('--expected='))?.slice('--expected='.length)
  const report = await inspectCampaignRosterWorkbook(filePath, {
    ...(sheetName ? { sheetName } : {}),
    ...(expectedText ? { expectedCount: Number(expectedText) } : {})
  })
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) main().catch(error => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
