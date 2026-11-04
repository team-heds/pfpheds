import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import * as XLSX from 'xlsx'
import { inspectPfpPopulation } from '../../src/domain/pfp/populationPreflight.js'
import { normalizeAcademicYear, requireAcademicYear } from '../../src/domain/pfp/academicPeriod.js'
import { isStudentProfile } from '../../src/utils/userAudience.js'
import { loadCampaignRosterWorkbook } from './inspect-campaign-roster.mjs'

const clean = value => String(value ?? '').replace(/^\uFEFF/, '').trim()
const normalized = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').toUpperCase()
const nameKey = (familyName, givenName) => normalized(`${familyName}|${givenName}`)

function booleanValue(value) {
  if (value === true || value === 1 || normalized(value) === 'TRUE') return true
  if (value === false || value === 0 || value == null || clean(value) === '' || normalized(value) === 'FALSE') return false
  return null
}

function pick(row, aliases) {
  const entries = new Map(Object.entries(row || {}).map(([key, value]) => [normalized(key), value]))
  for (const alias of aliases) if (entries.has(normalized(alias))) return entries.get(normalized(alias))
  return undefined
}

export function reconcileRosterSnapshot({
  rosterEntries,
  profiles,
  physioRows,
  respondents,
  exportsComplete = false,
  year = '2027',
  pfpType = 'PFP2'
}) {
  for (const source of [rosterEntries, profiles, physioRows, respondents]) {
    if (!Array.isArray(source)) throw new Error('Toutes les sources locales sont requises.')
  }
  const issues = []
  const issueRows = {}
  const flag = (code, row = null) => {
    issues.push(code)
    if (row !== null) {
      if (!issueRows[code]) issueRows[code] = []
      issueRows[code].push(row)
    }
  }
  // Keep inactive student accounts visible for the population audit, while excluding staff roles.
  const canonicalYear = requireAcademicYear(year)
  const campaignPhysioRows = physioRows.filter(row => normalizeAcademicYear(row.year) === canonicalYear)
  const studentProfiles = profiles.filter(profile => isStudentProfile({ ...profile, is_active: true }))
  const profileByName = new Map()
  studentProfiles.forEach(profile => {
    const key = nameKey(profile.family_name, profile.forname)
    if (!key || key === '|') return
    if (!profileByName.has(key)) profileByName.set(key, [])
    profileByName.get(key).push(profile)
  })

  const matchedProfiles = []
  const workbookRespondentByUser = new Map()
  const workbookRowByUser = new Map()
  const matchedUserIds = new Set()
  rosterEntries.forEach(entry => {
    const matches = profileByName.get(nameKey(entry.familyName, entry.givenName)) || []
    if (!matches.length) return flag('roster_unmatched_profile', entry.row)
    if (matches.length > 1) return flag('roster_ambiguous_profile', entry.row)
    const profile = matches[0]
    const userId = clean(profile.user_id)
    if (!userId) return flag('profile_missing_user_id', entry.row)
    if (matchedUserIds.has(userId)) return flag('profile_reused_for_roster', entry.row)
    matchedUserIds.add(userId)
    matchedProfiles.push(profile)
    workbookRespondentByUser.set(userId, entry.respondent)
    workbookRowByUser.set(userId, entry.row)
  })

  const matchedPhysio = campaignPhysioRows.filter(row => matchedUserIds.has(clean(row.user_id)))
  const physioByUser = new Map()
  matchedPhysio.forEach(row => {
    const userId = clean(row.user_id)
    if (!physioByUser.has(userId)) physioByUser.set(userId, [])
    physioByUser.get(userId).push(row)
  })
  workbookRespondentByUser.forEach((workbookRespondent, userId) => {
    const rows = physioByUser.get(userId) || []
    if (rows.length === 1 && normalized(rows[0].repondant_hes) !== normalized(workbookRespondent)) {
      flag('respondent_differs_from_workbook', workbookRowByUser.get(userId) ?? null)
    }
  })

  const population = inspectPfpPopulation({
    year,
    pfpType,
    profiles: matchedProfiles,
    physioStudents: matchedPhysio,
    respondents,
    sourcesComplete: exportsComplete,
    expectedCount: rosterEntries.length
  })
  const matchedBa25Ids = new Set(matchedProfiles
    .filter(profile => normalized(profile.classe) === population.campaign.targetClass)
    .map(profile => clean(profile.user_id)))
  const ba25ProfilesOutsideRoster = studentProfiles.filter(profile =>
    normalized(profile.classe) === population.campaign.targetClass && !matchedBa25Ids.has(clean(profile.user_id))).length
  for (let index = 0; index < ba25ProfilesOutsideRoster; index += 1) flag('ba25_profile_not_in_roster')

  const ownIssueCounts = {}
  issues.forEach(code => { ownIssueCounts[code] = (ownIssueCounts[code] || 0) + 1 })
  const exactMatches = matchedProfiles.length
  const identityReady = exportsComplete === true && exactMatches === rosterEntries.length && issues.length === 0
  return {
    campaign: population.campaign,
    exportsComplete: exportsComplete === true,
    identityReady,
    populationReady: identityReady && population.populationReady,
    campaignReady: false,
    summary: {
      rosterEntries: rosterEntries.length,
      profileRows: profiles.length,
      studentProfileRows: studentProfiles.length,
      physioRows: physioRows.length,
      campaignPhysioRows: campaignPhysioRows.length,
      respondentRows: respondents.length,
      exactMatches,
      unmatchedRosterRows: ownIssueCounts.roster_unmatched_profile || 0,
      ambiguousRosterRows: ownIssueCounts.roster_ambiguous_profile || 0,
      respondentDifferences: ownIssueCounts.respondent_differs_from_workbook || 0,
      ba25ProfilesOutsideRoster,
      population: population.summary,
      issueCounts: Object.fromEntries([...new Set([
        ...Object.keys(population.summary.issueCounts),
        ...Object.keys(ownIssueCounts)
      ])].map(code => [code, (population.summary.issueCounts[code] || 0) + (ownIssueCounts[code] || 0)]))
    },
    issueRows
  }
}

async function readTable(filePath) {
  const bytes = await readFile(filePath)
  const workbook = XLSX.read(bytes, { type: 'buffer', dense: true })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  if (!sheet) throw new Error(`Fichier vide : ${path.basename(filePath)}`)
  const matrix = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: null })
  return {
    source: { fileName: path.basename(filePath), sha256: createHash('sha256').update(bytes).digest('hex') },
    headers: matrix[0] || [],
    rows: XLSX.utils.sheet_to_json(sheet, { raw: true, defval: null })
  }
}

export function requireTableColumns(headers, required, label) {
  const available = new Set(headers.map(normalized))
  const missing = required
    .filter(aliases => !aliases.some(alias => available.has(normalized(alias))))
    .map(aliases => aliases[0])
  if (missing.length) throw new Error(`${label}: colonnes manquantes (${missing.join(', ')}).`)
}

export async function reconcileCampaignSnapshotFiles({ workbookPath, profilesPath, physioPath, respondentsPath, exportsComplete = false }) {
  const [roster, profilesFile, physioFile, respondentsFile] = await Promise.all([
    loadCampaignRosterWorkbook(workbookPath),
    readTable(profilesPath),
    readTable(physioPath),
    readTable(respondentsPath)
  ])
  requireTableColumns(profilesFile.headers, [
    ['user_id'], ['family_name', 'last_name', 'nom'], ['forname', 'first_name', 'prénom', 'prenom'],
    ['classe', 'class'], ['is_active'], ['role'], ['permissions']
  ], 'user_profiles')
  requireTableColumns(physioFile.headers, [
    ['user_id'], ['class', 'classe'], ['repondant_hes'], ['year', 'annee', 'année']
  ], 'StudentsPhysio')
  requireTableColumns(respondentsFile.headers, [
    ['first_name', 'forname', 'prénom', 'prenom'], ['last_name', 'family_name', 'nom'], ['is_active']
  ], 'RepondantPhysioHES')
  const profiles = profilesFile.rows.map(row => ({
    user_id: pick(row, ['user_id']),
    family_name: pick(row, ['family_name', 'last_name', 'nom']),
    forname: pick(row, ['forname', 'first_name', 'prénom', 'prenom']),
    classe: pick(row, ['classe', 'class']),
    is_active: booleanValue(pick(row, ['is_active'])),
    role: pick(row, ['role']),
    permissions: pick(row, ['permissions'])
  }))
  const physioRows = physioFile.rows.map(row => ({
    user_id: pick(row, ['user_id']),
    class: pick(row, ['class', 'classe']),
    repondant_hes: pick(row, ['repondant_hes']),
    year: pick(row, ['year', 'annee', 'année'])
  }))
  const respondents = respondentsFile.rows.map(row => ({
    first_name: pick(row, ['first_name', 'forname', 'prénom', 'prenom']),
    last_name: pick(row, ['last_name', 'family_name', 'nom']),
    is_active: booleanValue(pick(row, ['is_active']))
  }))
  return {
    sources: [roster.source, profilesFile.source, physioFile.source, respondentsFile.source],
    workbook: roster.report,
    ...reconcileRosterSnapshot({ rosterEntries: roster.entries, profiles, physioRows, respondents, exportsComplete })
  }
}

function option(args, name) {
  return args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
}

async function main() {
  const args = process.argv.slice(2)
  const input = {
    workbookPath: option(args, 'workbook'),
    profilesPath: option(args, 'profiles'),
    physioPath: option(args, 'physio'),
    respondentsPath: option(args, 'respondents'),
    exportsComplete: args.includes('--exports-complete')
  }
  if (!input.workbookPath || !input.profilesPath || !input.physioPath || !input.respondentsPath) {
    throw new Error('Usage: npm run pfp:reconcile-snapshot -- --workbook=... --profiles=... --physio=... --respondents=... [--exports-complete]')
  }
  process.stdout.write(`${JSON.stringify(await reconcileCampaignSnapshotFiles(input), null, 2)}\n`)
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) main().catch(error => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
