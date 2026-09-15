import { describe, expect, it } from 'vitest'
import { inspectOfferCapacity } from '../../src/domain/pfp/offerCapacityPreflight'
import { countExistingAssignments } from '../../scripts/pfp/inspect-offer-capacity-snapshot.mjs'

function snapshot() {
  return {
    year: '2026-2027',
    pfpType: 'PFP2',
    sourcesComplete: true,
    studentsToPlace: 2,
    institutions: [{ InstitutionId: 'i1', Name: 'Institution test' }],
    places: [
      { PlaceId: 'p1', InstitutionId: 'i1', PFP2: { 2027: 2 }, pfp2_proposition: { '2026-2027': 2 } }
    ]
  }
}

describe('local PFP offer and capacity preflight', () => {
  it('reconciles PFP2 BA25 capacities without authorizing campaign opening', () => {
    const report = inspectOfferCapacity(snapshot())
    expect(report.campaign).toEqual({ year: '2027', academicYear: '2026-2027', pfpType: 'PFP2', targetClass: 'BA25' })
    expect(report.offersReady).toBe(true)
    expect(report.campaignReady).toBe(false)
    expect(report.summary).toMatchObject({ offered: 2, proposed: 2, available: 2, studentsToPlace: 2, remainingAfterPlacement: 0 })
  })

  it('subtracts existing assignments from capacity before measuring the need', () => {
    const report = inspectOfferCapacity({ ...snapshot(), studentsToPlace: 2, existingAssignments: 1 })
    expect(report.offersReady).toBe(false)
    expect(report.summary.available).toBe(1)
    expect(report.summary.issueCounts.capacity_shortfall).toBe(1)
    expect(report.issues).toContainEqual(expect.objectContaining({ code: 'capacity_shortfall', missing: 1 }))
  })

  it('blocks contradictory year aliases instead of choosing one silently', () => {
    const input = snapshot()
    input.places[0].PFP2 = { 2027: 2, '2026-2027': 3 }
    const report = inspectOfferCapacity(input)
    expect(report.offersReady).toBe(false)
    expect(report.summary.issueCounts.conflicting_year_values).toBe(1)
    expect(report.summary.offered).toBe(0)
  })

  it('blocks invalid and fractional capacities', () => {
    for (const value of [-1, 1.5, 'abc']) {
      const input = snapshot()
      input.places[0].PFP2 = { 2027: value }
      expect(inspectOfferCapacity(input).summary.issueCounts.invalid_metric_value).toBe(1)
    }
  })

  it('requires a named institution for every positive offer', () => {
    const input = snapshot()
    delete input.institutions[0].Name
    const report = inspectOfferCapacity(input)
    expect(report.offersReady).toBe(false)
    expect(report.summary.issueCounts.missing_institution_name).toBe(1)
  })

  it('distinguishes an under-proposal warning from over-capacity blocking', () => {
    const input = snapshot()
    input.places[0].pfp2_proposition = { 2027: 1 }
    let report = inspectOfferCapacity(input)
    expect(report.offersReady).toBe(true)
    expect(report.summary.issueCounts.proposal_capacity_difference).toBe(1)
    input.places[0].pfp2_proposition = { 2027: 3 }
    report = inspectOfferCapacity(input)
    expect(report.offersReady).toBe(false)
    expect(report.summary.issueCounts.proposals_exceed_capacity).toBe(1)
  })

  it('does not claim readiness without exhaustive sources and a population size', () => {
    const input = snapshot()
    delete input.sourcesComplete
    input.studentsToPlace = null
    const report = inspectOfferCapacity(input)
    expect(report.offersReady).toBe(false)
    expect(report.summary.issueCounts).toMatchObject({ incomplete_sources: 1, missing_population_size: 1 })
  })

  it('rejects invalid inputs before producing a report', () => {
    const input = snapshot()
    expect(() => inspectOfferCapacity({ ...input, year: '2026-2028' })).toThrow()
    expect(() => inspectOfferCapacity({ ...input, pfpType: 'PFP9' })).toThrow()
    expect(() => inspectOfferCapacity({ ...input, places: null })).toThrow()
    expect(() => inspectOfferCapacity({ ...input, studentsToPlace: 1.5 })).toThrow()
    expect(() => inspectOfferCapacity({ ...input, existingAssignments: -1 })).toThrow()
  })

  it('does not mutate its input snapshot', () => {
    const input = snapshot()
    const before = structuredClone(input)
    inspectOfferCapacity(input)
    expect(input).toEqual(before)
  })

  it('counts assigned students only once across canonical academic-year aliases', () => {
    const rows = [
      { user_id: 'student-1', pfp_type: 'PFP2', year: '2027', assigned_place_id: 'place-1' },
      { user_id: 'student-1', pfp_type: 'PFP2', year: '2026-2027', assigned_place_id: 'place-1' },
      { user_id: 'student-2', pfp_type: 'PFP2', year: '2027', assigned_place_id: null },
      { user_id: 'student-3', pfp_type: 'PFP3', year: '2027', assigned_place_id: 'place-2' },
      { user_id: 'student-4', pfp_type: 'PFP2', year: '2026', assigned_place_id: 'place-3' }
    ]
    expect(countExistingAssignments(rows, { year: '2026-2027', pfpType: 'PFP2' })).toBe(1)
  })

  it('does not count withdrawn places or places belonging to hidden institutions', () => {
    const input = snapshot()
    input.institutions.push({ InstitutionId: 'i2', Name: 'Hidden', is_hidden: true })
    input.places.push(
      { PlaceId: 'p2', InstitutionId: 'i1', PFP2: { 2027: 10 }, selectedOut: true },
      { PlaceId: 'p3', InstitutionId: 'i2', PFP2: { 2027: 10 } }
    )
    const report = inspectOfferCapacity(input)
    expect(report.summary).toMatchObject({
      offered: 2,
      hiddenInstitutions: 1,
      withdrawnPlaces: 1,
      placesAtHiddenInstitutions: 1
    })
  })
})
