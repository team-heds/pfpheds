import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { inspectEligibility } from '../../src/domain/pfp/eligibilityPreflight.js'
import { CRITERIA_KEYS } from '../../src/composables/helpers/computePriorityScore.js'
import { getTargetClass, normalizeAcademicYear, requireAcademicYear } from '../../src/domain/pfp/academicPeriod.js'

const clean = value => String(value ?? '').trim()

async function readJsonArray(filePath, label) {
  const bytes = await readFile(filePath)
  const rows = JSON.parse(bytes.toString('utf8'))
  if (!Array.isArray(rows)) throw new Error(`${label}: un tableau JSON est requis.`)
  return {
    rows,
    source: {
      fileName: path.basename(filePath),
      sha256: createHash('sha256').update(bytes).digest('hex')
    }
  }
}

function counts(values) {
  const result = {}
  values.filter(Boolean).forEach(value => { result[value] = (result[value] || 0) + 1 })
  return result
}

export async function inspectEligibilitySnapshotFiles({
  physioPath,
  resultsPath,
  placesPath,
  year = '2027',
  pfpType = 'PFP2',
  exportsComplete = false
}) {
  const [physio, results, places] = await Promise.all([
    readJsonArray(physioPath, 'StudentsPhysio'),
    readJsonArray(resultsPath, 'student_result_vote'),
    readJsonArray(placesPath, 'places')
  ])
  const canonicalYear = requireAcademicYear(year)
  const targetClass = getTargetClass(canonicalYear, pfpType)
  const campaignPhysioRows = physio.rows.filter(row =>
    normalizeAcademicYear(row.year) === canonicalYear && clean(row.class).toUpperCase() === targetClass)
  const candidates = campaignPhysioRows.map(row => ({ userId: row.user_id }))
  const report = inspectEligibility({
    year: canonicalYear,
    pfpType,
    candidates,
    physioRows: campaignPhysioRows,
    resultRows: results.rows,
    places: places.rows,
    manualExclusions: [],
    sourcesComplete: exportsComplete
  })
  const auditedRows = [...report.eligible, ...report.excluded, ...report.unresolved]
  const scores = auditedRows.map(row => row.basePriorityScore).filter(Number.isFinite)
  return {
    sources: [physio.source, results.source, places.source],
    campaign: { year: canonicalYear, academicYear: `${Number(canonicalYear) - 1}-${canonicalYear}`, pfpType, targetClass },
    exportsComplete: exportsComplete === true,
    eligibilityReady: report.eligibilityReady,
    campaignReady: false,
    summary: {
      ...report.summary,
      physioRows: physio.rows.length,
      campaignPhysioRows: campaignPhysioRows.length,
      resultRows: results.rows.length,
      places: places.rows.length,
      priorityReasonCounts: counts(auditedRows.flatMap(row => row.priorityReasons)),
      missingCriteriaCounts: Object.fromEntries(CRITERIA_KEYS.map(criterion => [
        criterion,
        auditedRows.filter(row => row.missingCriteria.includes(criterion)).length
      ])),
      basePriorityScore: {
        minimum: scores.length ? Math.min(...scores) : null,
        maximum: scores.length ? Math.max(...scores) : null
      }
    }
  }
}

function option(args, name) {
  return args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
}

async function main() {
  const args = process.argv.slice(2)
  const input = {
    physioPath: option(args, 'physio'),
    resultsPath: option(args, 'results'),
    placesPath: option(args, 'places'),
    year: option(args, 'year') || '2027',
    pfpType: (option(args, 'pfp') || 'PFP2').toUpperCase(),
    exportsComplete: args.includes('--exports-complete')
  }
  if (!input.physioPath || !input.resultsPath || !input.placesPath) {
    throw new Error('Usage: npm run pfp:inspect-eligibility -- --physio=... --results=... --places=... [--year=2027] [--pfp=PFP2] [--exports-complete]')
  }
  process.stdout.write(`${JSON.stringify(await inspectEligibilitySnapshotFiles(input), null, 2)}\n`)
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) main().catch(error => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
