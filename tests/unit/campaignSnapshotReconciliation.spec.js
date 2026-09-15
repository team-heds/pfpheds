import { describe, expect, it } from 'vitest'
import { reconcileRosterSnapshot, requireTableColumns } from '../../scripts/pfp/reconcile-campaign-snapshot.mjs'

function snapshot() {
  return {
    exportsComplete: true,
    rosterEntries: [
      { row: 4, familyName: 'PrivateFamily', givenName: 'PrivateGiven', respondent: 'Hes Tutor' }
    ],
    profiles: [
      { user_id: 'synthetic-1', family_name: 'PrivateFamily', forname: 'PrivateGiven', classe: 'BA25', is_active: true, role: 'EtudiantPhysio', permissions: [] }
    ],
    physioRows: [
      { user_id: 'synthetic-1', class: 'BA25', repondant_hes: 'Hes Tutor', year: '2027' }
    ],
    respondents: [
      { first_name: 'Hes', last_name: 'Tutor', is_active: true }
    ]
  }
}

describe('local campaign snapshot reconciliation', () => {
  it('matches an exhaustive snapshot exactly without authorizing the campaign', () => {
    const report = reconcileRosterSnapshot(snapshot())
    expect(report.campaign).toMatchObject({ year: '2027', academicYear: '2026-2027', pfpType: 'PFP2', targetClass: 'BA25' })
    expect(report).toMatchObject({ exportsComplete: true, identityReady: true, populationReady: true, campaignReady: false })
    expect(report.summary).toMatchObject({ rosterEntries: 1, exactMatches: 1, unmatchedRosterRows: 0, respondentDifferences: 0 })
  })

  it('requires an explicit assertion that all three exports are complete', () => {
    const input = snapshot()
    input.exportsComplete = false
    const report = reconcileRosterSnapshot(input)
    expect(report.identityReady).toBe(false)
    expect(report.populationReady).toBe(false)
    expect(report.summary.issueCounts.incomplete_sources).toBe(1)
  })

  it('reports only workbook row numbers for unmatched and ambiguous identities', () => {
    let input = snapshot()
    input.profiles = []
    let report = reconcileRosterSnapshot(input)
    expect(report.summary.unmatchedRosterRows).toBe(1)
    expect(report.issueRows.roster_unmatched_profile).toEqual([4])
    input = snapshot()
    input.profiles.push({ ...input.profiles[0], user_id: 'synthetic-2' })
    report = reconcileRosterSnapshot(input)
    expect(report.summary.ambiguousRosterRows).toBe(1)
    expect(report.issueRows.roster_ambiguous_profile).toEqual([4])
  })

  it('blocks a respondent that differs between the workbook and StudentsPhysio', () => {
    const input = snapshot()
    input.physioRows[0].repondant_hes = 'Other Tutor'
    input.respondents.push({ first_name: 'Other', last_name: 'Tutor', is_active: true })
    const report = reconcileRosterSnapshot(input)
    expect(report.populationReady).toBe(false)
    expect(report.summary.respondentDifferences).toBe(1)
    expect(report.issueRows.respondent_differs_from_workbook).toEqual([4])
  })

  it('uses only the canonical campaign year from the annual StudentsPhysio history', () => {
    const input = snapshot()
    input.physioRows.unshift({
      user_id: 'synthetic-1', class: 'BA24', repondant_hes: 'Former Tutor', year: '2026'
    })
    const report = reconcileRosterSnapshot(input)
    expect(report.populationReady).toBe(true)
    expect(report.summary).toMatchObject({ physioRows: 2, campaignPhysioRows: 1, respondentDifferences: 0 })
    expect(report.summary.issueCounts.duplicate_physio).toBeUndefined()
    expect(report.summary.issueCounts.conflicting_classes).toBeUndefined()
    expect(report.summary.issueCounts.conflicting_respondents).toBeUndefined()
  })

  it('finds BA25 profiles absent from the reference roster', () => {
    const input = snapshot()
    input.profiles.push({
      user_id: 'synthetic-2', family_name: 'Outside', forname: 'Roster', classe: 'BA25', is_active: true, role: 'EtudiantPhysio', permissions: []
    })
    const report = reconcileRosterSnapshot(input)
    expect(report.identityReady).toBe(false)
    expect(report.summary.ba25ProfilesOutsideRoster).toBe(1)
    expect(report.summary.issueCounts.ba25_profile_not_in_roster).toBe(1)
  })

  it('keeps inactive and conflicting class records blocked by the shared population audit', () => {
    const input = snapshot()
    input.profiles[0].is_active = false
    input.physioRows[0].class = 'BA24'
    const report = reconcileRosterSnapshot(input)
    expect(report.populationReady).toBe(false)
    expect(report.summary.issueCounts).toMatchObject({ inactive_profile: 1, conflicting_classes: 1 })
  })

  it('never counts a staff profile as an extra BA25 student', () => {
    const input = snapshot()
    input.profiles.push({
      user_id: 'staff-1', family_name: 'Staff', forname: 'Member', classe: 'BA25',
      is_active: true, role: 'admin', permissions: ['EtudiantPhysio']
    })
    const report = reconcileRosterSnapshot(input)
    expect(report.summary.studentProfileRows).toBe(1)
    expect(report.summary.ba25ProfilesOutsideRoster).toBe(0)
    expect(report.populationReady).toBe(true)
  })

  it('does not mutate any supplied records', () => {
    const input = snapshot()
    const before = structuredClone(input)
    reconcileRosterSnapshot(input)
    expect(input).toEqual(before)
  })

  it('does not expose names or user IDs in the generated report', () => {
    const output = JSON.stringify(reconcileRosterSnapshot(snapshot()))
    expect(output).not.toContain('synthetic-1')
    expect(output).not.toContain('PrivateFamily')
    expect(output).not.toContain('PrivateGiven')
    expect(output).not.toContain('Hes Tutor')
  })

  it('requires the expected export columns while accepting supported aliases', () => {
    expect(() => requireTableColumns(
      ['user_id', 'Nom', 'Prénom', 'class', 'is_active', 'role', 'permissions'],
      [['user_id'], ['family_name', 'nom'], ['forname', 'prénom'], ['classe', 'class'], ['is_active'], ['role'], ['permissions']],
      'user_profiles'
    )).not.toThrow()
    expect(() => requireTableColumns(
      ['user_id', 'family_name'],
      [['user_id'], ['family_name'], ['forname']],
      'user_profiles'
    )).toThrow(/forname/)
  })
})
