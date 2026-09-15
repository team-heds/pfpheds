import { PFP_TYPES, formatAcademicYear, getTargetClass, readAcademicCapacity, requireAcademicYear } from './academicPeriod.js'
import { getReconciliationMetric, reconcileOfferProposals } from '../../service/offerProposalMatchingService.js'

const clean = value => typeof value === 'string' ? value.trim() : ''
const identifier = value => String(value ?? '').trim()

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

  const hiddenInstitutionIds = new Set(institutions
    .filter(institution => institution?.is_hidden === true)
    .map(institution => identifier(institution?.InstitutionId ?? institution?.id))
    .filter(Boolean))
  const eligibleInstitutions = institutions.filter(institution => institution?.is_hidden !== true)
  const eligibleInstitutionIds = new Set(eligibleInstitutions
    .map(institution => identifier(institution?.InstitutionId ?? institution?.id))
    .filter(Boolean))
  // `selectedOut` is a legacy, campaign-agnostic PFP4 assignment marker. It is
  // not keyed by academic year or PFP type, so it cannot safely withdraw a
  // place from a PFP2 campaign. Keep it visible in the report without using it
  // as a capacity filter.
  const legacySelectedOutPlaces = places.filter(place => place?.selectedOut === true)
  const placesAtHiddenInstitutions = places.filter(place =>
    hiddenInstitutionIds.has(identifier(place?.InstitutionId)))
  const eligiblePlaces = places.filter(place =>
    !hiddenInstitutionIds.has(identifier(place?.InstitutionId)))
  const reconciliation = reconcileOfferProposals({
    institutions: eligibleInstitutions,
    places: eligiblePlaces,
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

  for (const place of eligiblePlaces) {
    const placeId = identifier(place?.PlaceId ?? place?.id)
    const institutionId = identifier(place?.InstitutionId)
    if (!placeId || !eligibleInstitutionIds.has(institutionId)) continue
    const offer = readAcademicCapacity(place?.[pfpType], canonicalYear)
    const proposal = readAcademicCapacity(place?.[`${pfpType.toLowerCase()}_proposition`], canonicalYear)
    if (offer.error || proposal.error) continue
    if (proposal.value > offer.value) {
      issues.push({
        severity: 'blocked',
        code: 'place_proposals_exceed_capacity',
        placeId,
        institutionId,
        excess: proposal.value - offer.value
      })
    } else if (proposal.value < offer.value) {
      issues.push({
        severity: 'warning',
        code: 'place_proposal_capacity_difference',
        placeId,
        institutionId,
        difference: proposal.value - offer.value
      })
    }
  }

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
      hiddenInstitutions: hiddenInstitutionIds.size,
      institutionsWithOffers,
      places: reconciliation.totals.places,
      legacySelectedOutPlaces: legacySelectedOutPlaces.length,
      placesAtHiddenInstitutions: placesAtHiddenInstitutions.length,
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
