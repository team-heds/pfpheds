export const OFFER_PROPOSAL_PFP_TYPES = ['PFP1A', 'PFP1B', 'PFP2', 'PFP3', 'PFP4']

const canonicalId = value => String(value ?? '').trim()

export function getAcademicYearKeys(year) {
  const normalized = canonicalId(year)
  const numericYear = Number(normalized)
  if (!normalized || !Number.isInteger(numericYear)) return normalized ? [normalized] : []
  return [normalized, `${numericYear - 1}-${numericYear}`]
}

function readMetric(place, field, year, context, anomalies) {
  const source = place?.[field]
  if (source == null || source === '') return 0

  if (typeof source !== 'object' || Array.isArray(source)) {
    anomalies.push({ type: 'invalid_metric_container', ...context, field })
    return 0
  }

  const populatedValues = getAcademicYearKeys(year)
    .filter(key => Object.prototype.hasOwnProperty.call(source, key))
    .map(key => ({ key, value: source[key] }))
    .filter(entry => entry.value !== null && entry.value !== '')

  if (populatedValues.length === 0) return 0

  const distinctValues = new Set(populatedValues.map(entry => String(entry.value)))
  if (distinctValues.size > 1) {
    anomalies.push({ type: 'conflicting_year_values', ...context, field, keys: populatedValues.map(entry => entry.key) })
    return 0
  }

  const value = Number(populatedValues[0].value)
  if (!Number.isFinite(value) || value < 0) {
    anomalies.push({ type: 'invalid_metric_value', ...context, field, year: canonicalId(year) })
    return 0
  }

  return value
}

function createMetrics(years, pfpTypes) {
  return Object.fromEntries(years.map(year => [
    canonicalId(year),
    Object.fromEntries(pfpTypes.map(pfp => [pfp, {
      offers: 0,
      proposals: 0,
      difference: 0,
      hasOffer: false,
      hasProposal: false
    }]))
  ]))
}

export function reconcileOfferProposals({
  institutions = [],
  places = [],
  years = [],
  pfpTypes = OFFER_PROPOSAL_PFP_TYPES
} = {}) {
  const normalizedYears = [...new Set(years.map(canonicalId).filter(Boolean))]
  const normalizedPfpTypes = [...new Set(pfpTypes.map(canonicalId).filter(Boolean))]
  const anomalies = []
  const institutionMap = new Map()

  for (const institution of institutions) {
    const institutionId = canonicalId(institution?.InstitutionId ?? institution?.id)
    if (!institutionId) {
      anomalies.push({ type: 'missing_institution_primary_key' })
      continue
    }
    if (institutionMap.has(institutionId)) {
      anomalies.push({ type: 'duplicate_institution_id', institutionId })
      continue
    }
    institutionMap.set(institutionId, {
      ...institution,
      InstitutionId: institutionId,
      institutionId,
      institutionName: institution.Name || institution.name || 'Institution sans nom',
      placeCount: 0,
      metrics: createMetrics(normalizedYears, normalizedPfpTypes)
    })
  }

  const seenPlaceIds = new Set()
  for (const place of places) {
    const placeId = canonicalId(place?.PlaceId ?? place?.id)
    const institutionId = canonicalId(place?.InstitutionId)

    if (!placeId) {
      anomalies.push({ type: 'missing_place_id', institutionId: institutionId || null })
      continue
    }
    if (seenPlaceIds.has(placeId)) {
      anomalies.push({ type: 'duplicate_place_id', placeId, institutionId: institutionId || null })
      continue
    }
    seenPlaceIds.add(placeId)

    if (!institutionId) {
      anomalies.push({ type: 'missing_place_institution_id', placeId })
      continue
    }

    const institution = institutionMap.get(institutionId)
    if (!institution) {
      anomalies.push({ type: 'unknown_institution_id', placeId, institutionId })
      continue
    }

    institution.placeCount += 1
    for (const year of normalizedYears) {
      for (const pfp of normalizedPfpTypes) {
        const context = { placeId, institutionId, pfp }
        const metric = institution.metrics[year][pfp]
        metric.offers += readMetric(place, pfp, year, context, anomalies)
        metric.proposals += readMetric(place, `${pfp.toLowerCase()}_proposition`, year, context, anomalies)
      }
    }
  }

  const reconciledInstitutions = [...institutionMap.values()]
  for (const institution of reconciledInstitutions) {
    for (const year of normalizedYears) {
      for (const pfp of normalizedPfpTypes) {
        const metric = institution.metrics[year][pfp]
        metric.difference = metric.proposals - metric.offers
        metric.hasOffer = metric.offers > 0
        metric.hasProposal = metric.proposals > 0
      }
    }
  }

  return {
    institutions: reconciledInstitutions,
    anomalies,
    totals: {
      institutions: reconciledInstitutions.length,
      places: reconciledInstitutions.reduce((total, institution) => total + institution.placeCount, 0),
      anomalies: anomalies.length
    }
  }
}

export function getReconciliationMetric(institution, year, pfp) {
  return institution?.metrics?.[canonicalId(year)]?.[pfp] || {
    offers: 0,
    proposals: 0,
    difference: 0,
    hasOffer: false,
    hasProposal: false
  }
}
