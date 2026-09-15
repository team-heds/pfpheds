import { PFP_TYPES, formatAcademicYear, getTargetClass, requireAcademicYear } from './academicPeriod'
import { getReconciliationMetric, reconcileOfferProposals } from '@/service/offerProposalMatchingService'

const clean = value => typeof value === 'string' ? value.trim() : ''

// Pure preparation report. It never opens a session or persists assignments.
export function inspectOfferCapacity({
  year,
  pfpType,
  institutions,
  places,
  sourcesComplete = false,
  studentsToPlace = null,
  existingAssignments = 0
}) {
  const canonicalYear = requireAcademicYear(year)
  if (!PFP_TYPES.includes(pfpType)) throw new Error('Type PFP invalide.')
  if (!Array.isArray(institutions) || !Array.isArray(places)) {
    throw new Error('Les sources institutions et places sont requises.')
  }
  if (studentsToPlace !== null && (!Number.isInteger(studentsToPlace) || studentsToPlace < 0)) {
    throw new Error('Nombre d’étudiants à placer invalide.')
  }
  if (!Number.isInteger(existingAssignments) || existingAssignments < 0) {
    throw new Error('Nombre d’affectations existantes invalide.')
  }

  const reconciliation = reconcileOfferProposals({
    institutions,
    places,
    years: [canonicalYear],
    pfpTypes: [pfpType]
  })
  const issues = reconciliation.anomalies.map(anomaly => ({
    severity: 'blocked',
    code: anomaly.type,
    ...anomaly
  }))
  if (sourcesComplete !== true) issues.push({ severity: 'blocked', code: 'incomplete_sources' })
  if (studentsToPlace === null) issues.push({ severity: 'blocked', code: 'missing_population_size' })

  let offered = 0
  let proposed = 0
  let institutionsWithOffers = 0
  for (const institution of reconciliation.institutions) {
    const metric = getReconciliationMetric(institution, canonicalYear, pfpType)
    offered += metric.offers
    proposed += metric.proposals
    if (metric.offers > 0) {
      institutionsWithOffers += 1
      const source = institutions.find(row => String(row?.InstitutionId ?? row?.id ?? '').trim() === institution.institutionId)
      if (!clean(source?.Name ?? source?.name)) {
        issues.push({ severity: 'blocked', code: 'missing_institution_name', institutionId: institution.institutionId })
      }
    }
  }

  if (offered === 0) issues.push({ severity: 'blocked', code: 'empty_offer_capacity' })
  if (existingAssignments > offered) {
    issues.push({ severity: 'blocked', code: 'assignments_exceed_capacity' })
  }
  const available = Math.max(0, offered - existingAssignments)
  if (studentsToPlace !== null && available < studentsToPlace) {
    issues.push({ severity: 'blocked', code: 'capacity_shortfall', missing: studentsToPlace - available })
  }
  if (proposed > offered) {
    issues.push({ severity: 'blocked', code: 'proposals_exceed_capacity', excess: proposed - offered })
  } else if (proposed !== offered) {
    issues.push({ severity: 'warning', code: 'proposal_capacity_difference', difference: proposed - offered })
  }

  const issueCounts = {}
  issues.forEach(({ code }) => { issueCounts[code] = (issueCounts[code] || 0) + 1 })
  return {
    campaign: {
      year: canonicalYear,
      academicYear: formatAcademicYear(canonicalYear),
      pfpType,
      targetClass: getTargetClass(canonicalYear, pfpType)
    },
    offersReady: !issues.some(issue => issue.severity === 'blocked'),
    campaignReady: false,
    summary: {
      institutions: reconciliation.totals.institutions,
      institutionsWithOffers,
      places: reconciliation.totals.places,
      studentsToPlace,
      existingAssignments,
      offered,
      available,
      proposed,
      remainingAfterPlacement: studentsToPlace === null ? null : Math.max(0, available - studentsToPlace),
      issueCounts
    },
    issues
  }
}
