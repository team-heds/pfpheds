import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { inspectOfferCapacity } from '../../src/domain/pfp/offerCapacityPreflight.js'
import { getAcademicYearKeys } from '../../src/domain/pfp/academicPeriod.js'

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

export function countExistingAssignments(rows, { year, pfpType }) {
  const acceptedYears = new Set(getAcademicYearKeys(year))
  const assignedUsers = new Set()
  for (const row of rows) {
    if (clean(row.pfp_type).toUpperCase() !== pfpType) continue
    if (!acceptedYears.has(clean(row.year))) continue
    if (!clean(row.assigned_place_id)) continue
    const userId = clean(row.user_id)
    if (userId) assignedUsers.add(userId)
  }
  return assignedUsers.size
}

export async function inspectOfferCapacitySnapshotFiles({
  institutionsPath,
  placesPath,
  assignmentsPath,
  year = '2027',
  pfpType = 'PFP2',
  studentsToPlace,
  exportsComplete = false
}) {
  const [institutions, places, assignments] = await Promise.all([
    readJsonArray(institutionsPath, 'institutions'),
    readJsonArray(placesPath, 'places'),
    readJsonArray(assignmentsPath, 'student_result_vote')
  ])
  const report = inspectOfferCapacity({
    year,
    pfpType,
    institutions: institutions.rows,
    places: places.rows,
    studentsToPlace,
    existingAssignments: countExistingAssignments(assignments.rows, { year, pfpType }),
    sourcesComplete: exportsComplete
  })
  return {
    sources: [institutions.source, places.source, assignments.source],
    campaign: report.campaign,
    exportsComplete: exportsComplete === true,
    offersReady: report.offersReady,
    campaignReady: false,
    summary: report.summary
  }
}

function option(args, name) {
  return args.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3)
}

async function main() {
  const args = process.argv.slice(2)
  const students = Number(option(args, 'students'))
  const input = {
    institutionsPath: option(args, 'institutions'),
    placesPath: option(args, 'places'),
    assignmentsPath: option(args, 'assignments'),
    year: option(args, 'year') || '2027',
    pfpType: (option(args, 'pfp') || 'PFP2').toUpperCase(),
    studentsToPlace: students,
    exportsComplete: args.includes('--exports-complete')
  }
  if (!input.institutionsPath || !input.placesPath || !input.assignmentsPath || !Number.isInteger(students) || students < 0) {
    throw new Error('Usage: npm run pfp:inspect-offers -- --institutions=... --places=... --assignments=... --students=63 [--year=2027] [--pfp=PFP2] [--exports-complete]')
  }
  process.stdout.write(`${JSON.stringify(await inspectOfferCapacitySnapshotFiles(input), null, 2)}\n`)
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
if (isMain) main().catch(error => {
  process.stderr.write(`${error.message}\n`)
  process.exitCode = 1
})
