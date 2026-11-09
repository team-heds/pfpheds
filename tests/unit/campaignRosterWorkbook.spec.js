import { describe, expect, it } from 'vitest'
import { inspectRosterRows } from '../../scripts/pfp/inspect-campaign-roster.mjs'

const rows = () => [
  ['Répartition CPT étudiant.e.s BA 25 (2 étudiant.e.s)'],
  ['Nom', 'Prénom', 'Répondant historique', '', '', 'Répondant HES'],
  ['', '', '', '', 'Bemerkungen'],
  ['Example-A', 'Student-A', 'Old Tutor', '', '', 'Current Tutor'],
  ['Example-B', 'Student-B', '', '', '', 'Second Tutor'],
  ['', '', '2 Etudiant-e-s'],
  ['Current', 'Tutor']
]

describe('campaign roster workbook inspection', () => {
  it('uses the announced roster length and ignores the trailing respondent summary', () => {
    const report = inspectRosterRows(rows(), { sheetName: 'BA25' })
    expect(report).toMatchObject({
      expectedCount: 2,
      rosterRows: 2,
      completeIdentities: 2,
      uniqueNames: 2,
      respondentsPresent: 2,
      respondentColumn: 'F',
      rosterStartRow: 4,
      rosterEndRow: 5,
      workbookRosterReady: true,
      identityReady: false,
      campaignReady: false
    })
  })

  it('uses the last respondent column as the current source', () => {
    const input = rows()
    input[3][5] = ''
    const report = inspectRosterRows(input)
    expect(report.respondentsPresent).toBe(1)
    expect(report.respondentsMissing).toBe(1)
    expect(report.issueCounts.missing_respondent).toBe(1)
    expect(report.workbookRosterReady).toBe(false)
  })

  it('blocks duplicate and incomplete roster identities', () => {
    const input = rows()
    input[4][0] = ' example-a '
    input[4][1] = 'STUDENT-A'
    let report = inspectRosterRows(input)
    expect(report.issueCounts.duplicate_name).toBe(1)
    input[4][1] = ''
    report = inspectRosterRows(input)
    expect(report.issueCounts.incomplete_identity).toBe(1)
  })

  it('allows an explicit expected count when the title has none', () => {
    const input = rows()
    input[0][0] = 'Répartition BA25'
    expect(inspectRosterRows(input, { expectedCount: 2 }).expectedCount).toBe(2)
    expect(() => inspectRosterRows(input)).toThrow(/Effectif attendu/)
  })

  it('rejects sheets without the required headers', () => {
    expect(() => inspectRosterRows([])).toThrow(/Nom et Prénom/)
    const input = rows()
    input[1][5] = 'Suivi'
    input[1][2] = 'Historique'
    expect(() => inspectRosterRows(input)).toThrow(/Répondant HES/)
  })
})
