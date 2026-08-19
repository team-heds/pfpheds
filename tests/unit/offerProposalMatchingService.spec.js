import { describe, expect, it } from 'vitest'
import {
  getAcademicYearKeys,
  getReconciliationMetric,
  reconcileOfferProposals
} from '@/service/offerProposalMatchingService'

const institutions = [
  { InstitutionId: 10, Name: 'Institution A' },
  { InstitutionId: '20', Name: 'Institution B' }
]

describe('offerProposalMatchingService', () => {
  it('supports calendar and academic year keys', () => {
    expect(getAcademicYearKeys('2026')).toEqual(['2026', '2025-2026'])
    expect(getAcademicYearKeys('legacy')).toEqual(['legacy'])
  })

  it('aggregates multiple sites with the same canonical institution id', () => {
    const result = reconcileOfferProposals({
      institutions,
      years: ['2026'],
      pfpTypes: ['PFP1A'],
      places: [
        { PlaceId: 1, InstitutionId: 10, PFP1A: { 2026: 2 }, pfp1a_proposition: { 2026: 1 } },
        { PlaceId: 2, InstitutionId: '10', PFP1A: { '2025-2026': 3 }, pfp1a_proposition: { '2025-2026': 4 } }
      ]
    })

    const institution = result.institutions.find(item => item.institutionId === '10')
    expect(institution.placeCount).toBe(2)
    expect(getReconciliationMetric(institution, '2026', 'PFP1A')).toEqual({
      offers: 5,
      proposals: 5,
      difference: 0,
      hasOffer: true,
      hasProposal: true
    })
  })

  it('does not let duplicate places distort totals', () => {
    const result = reconcileOfferProposals({
      institutions,
      years: ['2026'],
      pfpTypes: ['PFP2'],
      places: [
        { PlaceId: 'same', InstitutionId: 10, PFP2: { 2026: 2 } },
        { PlaceId: 'same', InstitutionId: 10, PFP2: { 2026: 99 } }
      ]
    })

    expect(getReconciliationMetric(result.institutions[0], '2026', 'PFP2').offers).toBe(2)
    expect(result.anomalies).toContainEqual(expect.objectContaining({ type: 'duplicate_place_id', placeId: 'same' }))
  })

  it('reports orphan and invalid data without attaching it to another institution', () => {
    const result = reconcileOfferProposals({
      institutions,
      years: ['2026'],
      pfpTypes: ['PFP3'],
      places: [
        { PlaceId: 'missing', InstitutionId: '', PFP3: { 2026: 3 } },
        { PlaceId: 'unknown', InstitutionId: 999, PFP3: { 2026: 4 } },
        { PlaceId: 'invalid', InstitutionId: 20, PFP3: { 2026: 'abc' } }
      ]
    })

    expect(result.totals.places).toBe(1)
    expect(result.anomalies.map(item => item.type)).toEqual(expect.arrayContaining([
      'missing_place_institution_id',
      'unknown_institution_id',
      'invalid_metric_value'
    ]))
    expect(getReconciliationMetric(result.institutions[1], '2026', 'PFP3').offers).toBe(0)
  })

  it('keeps institutions with no proposal identifiable across all five PFP types', () => {
    const result = reconcileOfferProposals({
      institutions,
      years: ['2026'],
      places: [{ PlaceId: 1, InstitutionId: 10, PFP4: { 2026: 1 } }]
    })

    expect(result.institutions).toHaveLength(2)
    expect(getReconciliationMetric(result.institutions[0], '2026', 'PFP4').hasProposal).toBe(false)
    expect(getReconciliationMetric(result.institutions[1], '2026', 'PFP1B').hasProposal).toBe(false)
  })

  it('flags conflicting values when both supported year keys disagree', () => {
    const result = reconcileOfferProposals({
      institutions,
      years: ['2026'],
      pfpTypes: ['PFP1A'],
      places: [{ PlaceId: 1, InstitutionId: 10, PFP1A: { 2026: 1, '2025-2026': 2 } }]
    })

    expect(result.anomalies).toContainEqual(expect.objectContaining({
      type: 'conflicting_year_values',
      placeId: '1',
      institutionId: '10'
    }))
    expect(getReconciliationMetric(result.institutions[0], '2026', 'PFP1A').offers).toBe(0)
  })
})
