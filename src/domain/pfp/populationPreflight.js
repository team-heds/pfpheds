import { formatAcademicYear, getTargetClass, requireAcademicYear } from './academicPeriod.js'
import { normalizeRespondentName, splitRespondentNames } from './respondentNames.js'

const clean = value => typeof value === 'string' ? value.trim() : ''
const normalized = value => clean(value).normalize('NFC').replace(/\s+/g, ' ').toUpperCase()

// Pure snapshot inspection: no database, storage, logging or notification dependency.
// The caller must supply both complete student sources, before merging their classes.
export function inspectPfpPopulation({ year, pfpType, profiles, physioStudents, respondents,
  sourcesComplete = false, expectedCount = null }) {
  const canonicalYear = requireAcademicYear(year)
  const targetClass = getTargetClass(canonicalYear, pfpType)
  if (!targetClass) throw new Error('Type PFP invalide.')
  for (const source of [profiles, physioStudents, respondents]) {
    if (!Array.isArray(source)) throw new Error('Les trois sources de population sont requises.')
  }
  if (expectedCount !== null && (!Number.isInteger(expectedCount) || expectedCount < 0)) {
    throw new Error('Effectif attendu invalide.')
  }

  const issues = []
  const addIssue = (code, details = {}) => issues.push({ code, ...details })
  if (sourcesComplete !== true) addIssue('incomplete_sources')
  const people = new Map()
  const ingest = (rows, source) => rows.forEach((row, index) => {
    const userId = clean(row?.user_id)
    if (!userId) {
      addIssue('missing_user_id', { source, rowIndex: index })
      return
    }
    if (!people.has(userId)) people.set(userId, { profiles: [], physio: [] })
    people.get(userId)[source].push(row)
  })
  ingest(profiles, 'profiles')
  ingest(physioStudents, 'physio')

  const respondentNames = new Map()
  respondents.forEach(row => {
    if (!clean(row?.first_name) || !clean(row?.last_name)) return
    const name = normalizeRespondentName(`${row.first_name} ${row.last_name}`)
    if (!respondentNames.has(name)) respondentNames.set(name, [])
    respondentNames.get(name).push(row)
  })

  const candidates = []
  const excluded = []
  const unresolved = []
  for (const [userId, rows] of [...people.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const profileClasses = [...new Set(rows.profiles.map(row => normalized(row.classe)).filter(Boolean))]
    const physioClasses = [...new Set(rows.physio.map(row => normalized(row.class)).filter(Boolean))]
    const classes = [...new Set([...profileClasses, ...physioClasses])]
    if (classes.length && !classes.includes(targetClass)) {
      excluded.push({ userId, reason: 'outside_target_class', classes })
      continue
    }
    const rowIssues = []
    const flag = code => { rowIssues.push(code); addIssue(code, { userId }) }
    if (!classes.length) flag('missing_class')
    if (classes.length > 1) flag('conflicting_classes')
    if (rows.profiles.length === 0) flag('missing_profile')
    if (rows.physio.length === 0) flag('missing_physio')
    if (rows.profiles.length > 1) flag('duplicate_profile')
    if (rows.physio.length > 1) flag('duplicate_physio')
    if (rows.profiles.some(row => row.is_active === false)) flag('inactive_profile')

    const labels = [...new Set(rows.physio.map(row => clean(row.repondant_hes)).filter(Boolean))]
    if (!labels.length) flag('missing_respondent')
    else if (labels.length > 1) flag('conflicting_respondents')
    else {
      const names = [...new Set(splitRespondentNames(labels[0]).map(normalizeRespondentName))]
      if (!names.length) flag('missing_respondent')
      else {
        const matchesByName = names.map(name => respondentNames.get(name) || [])
        if (matchesByName.some(matches => !matches.length)) flag('unknown_respondent')
        else if (matchesByName.some(matches => matches.length > 1)) flag('ambiguous_respondent')
        else if (matchesByName.some(matches => matches[0].is_active !== true)) flag('inactive_or_unverified_respondent')
      }
    }
    const entry = { userId, profileClasses, physioClasses, issues: rowIssues }
    if (rowIssues.length) unresolved.push(entry)
    else candidates.push(entry)
  }

  // Count class membership before resolving anomalies; do not disguise an anomaly as exclusion.
  const targetCount = candidates.length + unresolved.filter(row =>
    [...row.profileClasses, ...row.physioClasses].includes(targetClass)).length
  if (targetCount === 0) addIssue('empty_target_population')
  if (expectedCount !== null && targetCount !== expectedCount) addIssue('unexpected_population_count')
  const issueCounts = {}
  issues.forEach(({ code }) => { issueCounts[code] = (issueCounts[code] || 0) + 1 })
  return {
    campaign: { year: canonicalYear, academicYear: formatAcademicYear(canonicalYear), pfpType, targetClass },
    populationReady: issues.length === 0,
    // Population validation alone never authorizes votes or confirms eligibility.
    campaignReady: false,
    summary: {
      uniqueStudents: people.size, targetCount, expectedCount,
      candidates: candidates.length, excluded: excluded.length, unresolved: unresolved.length,
      unidentifiedRows: issueCounts.missing_user_id || 0, issueCounts
    },
    candidates, excluded, unresolved, issues
  }
}
