import { describe, expect, it } from 'vitest'
import { inspectEligibility } from '../../src/domain/pfp/eligibilityPreflight'

function snapshot() {
  return {
    year: '2026-2027', pfpType: 'PFP2', sourcesComplete: true,
    candidates: [{ userId: 'student-1' }],
    physioRows: [{ user_id: 'student-1', sae: false, cas_particulier: false, lese: false, pfp_valided: [] }],
    resultRows: [], manualExclusions: [],
    places: [{ PlaceId: 'place-1', MSQ: true, FR: true }]
  }
}

describe('local PFP eligibility preflight', () => {
  it('produces a deterministic base score without authorizing the campaign', () => {
    const report = inspectEligibility(snapshot())
    expect(report).toMatchObject({ year: '2027', pfpType: 'PFP2', eligibilityReady: true, campaignReady: false })
    expect(report.summary).toMatchObject({ candidates: 1, eligible: 1, excluded: 0, unresolved: 0 })
    expect(report.eligible[0]).toMatchObject({ basePriorityScore: 65, requiresPriorityReview: false })
  })

  it('excludes an existing assignment with either supported year spelling', () => {
    for (const year of ['2027', '2026-2027']) {
      const input = snapshot()
      input.resultRows = [{ user_id: 'student-1', pfp_type: 'PFP2', year, assigned_place_id: 'place-1' }]
      const report = inspectEligibility(input)
      expect(report.summary.excluded).toBe(1)
      expect(report.excluded[0].reason).toBe('existing_assignment')
    }
  })

  it('requires a reason for a manual exclusion', () => {
    const input = snapshot()
    input.manualExclusions = ['student-1']
    let report = inspectEligibility(input)
    expect(report.excluded[0]).toMatchObject({ reason: 'manual_exclusion', explanation: '' })
    expect(report.summary.issueCounts.missing_exclusion_reason).toBe(1)
    input.manualExclusions = [{ userId: 'student-1', reason: 'Décision métier test' }]
    report = inspectEligibility(input)
    expect(report.eligibilityReady).toBe(true)
    expect(report.excluded[0].explanation).toBe('Décision métier test')
  })

  it('identifies SAE and special cases for human priority review', () => {
    const input = snapshot()
    input.physioRows[0].sae = true
    input.physioRows[0].cas_particulier = 'true'
    const report = inspectEligibility(input)
    expect(report.summary.priorityReviews).toBe(1)
    expect(report.eligible[0].priorityReasons).toEqual(['sae', 'special_case'])
    expect(report.eligible[0].basePriorityScore).toBe(85)
  })

  it('sends legacy lese flags and previous random assignments to human priority review', () => {
    const input = snapshot()
    input.physioRows[0].lese = true
    input.resultRows = [{
      user_id: 'student-1', pfp_type: 'PFP1B', year: '2026', assigned_place_id: 'place-1', assigned_rank: 99
    }]
    const row = inspectEligibility(input).eligible[0]
    expect(row.requiresPriorityReview).toBe(true)
    expect(row.priorityReasons).toEqual(['legacy_lese', 'previous_random_assignment'])
    expect(row.basePriorityScore).toBe(65)
  })

  it('combines validated stages and results while deduplicating completed places', () => {
    const input = snapshot()
    input.physioRows[0].pfp_valided = [{ PlaceId: 'place-1' }]
    input.resultRows = [{ user_id: 'student-1', pfp_type: 'PFP1A', year: '2026', assigned_place_id: 'place-1', pfp_validee: true }]
    const row = inspectEligibility(input).eligible[0]
    expect(row.completedStageCount).toBe(1)
    expect(row.missingCriteria).not.toContain('MSQ')
    expect(row.missingCriteria).not.toContain('FR')
  })

  it('blocks missing profiles, duplicate profiles and malformed stage histories', () => {
    let input = snapshot()
    input.physioRows = []
    expect(inspectEligibility(input).summary.issueCounts.missing_physio).toBe(1)
    input = snapshot()
    input.physioRows.push({ ...input.physioRows[0] })
    expect(inspectEligibility(input).summary.issueCounts.duplicate_physio).toBe(1)
    input = snapshot()
    input.physioRows[0].pfp_valided = '{broken'
    expect(inspectEligibility(input).summary.issueCounts.invalid_validated_stages).toBe(1)
  })

  it('does not treat non-empty false strings as true', () => {
    let input = snapshot()
    input.physioRows[0].sae = 'false'
    input.physioRows[0].cas_particulier = 'false'
    input.physioRows[0].lese = 'false'
    expect(inspectEligibility(input).eligible[0].requiresPriorityReview).toBe(false)
    input.physioRows[0].sae = 'yes'
    expect(inspectEligibility(input).summary.issueCounts.invalid_sae).toBe(1)
    input = snapshot()
    input.physioRows[0].lese = 'yes'
    expect(inspectEligibility(input).summary.issueCounts.invalid_lese).toBe(1)
  })

  it('reconciles each identified candidate into exactly one outcome', () => {
    const input = snapshot()
    input.candidates.push({ userId: 'student-2' }, { userId: 'student-3' })
    input.physioRows.push(
      { user_id: 'student-2', sae: false, cas_particulier: false },
      { user_id: 'student-3', sae: false, cas_particulier: false }
    )
    input.manualExclusions.push({ userId: 'student-2', reason: 'Test' })
    input.resultRows.push({ user_id: 'student-3', pfp_type: 'PFP2', year: '2027', assigned_place_id: 'place-1' })
    const { summary } = inspectEligibility(input)
    expect(summary.candidates).toBe(summary.eligible + summary.excluded + summary.unresolved)
  })

  it('rejects incomplete or invalid campaign inputs', () => {
    const input = snapshot()
    expect(inspectEligibility({ ...input, sourcesComplete: false }).eligibilityReady).toBe(false)
    expect(() => inspectEligibility({ ...input, pfpType: 'PFP9' })).toThrow()
    expect(() => inspectEligibility({ ...input, candidates: null })).toThrow()
  })

  it('does not mutate the supplied snapshot', () => {
    const input = snapshot()
    const before = structuredClone(input)
    inspectEligibility(input)
    expect(input).toEqual(before)
  })
})
