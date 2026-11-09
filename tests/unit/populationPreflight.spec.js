import { describe, expect, it, vi } from 'vitest'
import { inspectPfpPopulation } from '../../src/domain/pfp/populationPreflight'

function snapshot() {
  return {
    year: '2026-2027', pfpType: 'PFP2', sourcesComplete: true,
    profiles: [{ user_id: 'synthetic-1', classe: 'BA25', is_active: true }],
    physioStudents: [{ user_id: 'synthetic-1', class: 'BA25', repondant_hes: 'Example Tutor' }],
    respondents: [{ first_name: 'Example', last_name: 'Tutor', is_active: true }]
  }
}

describe('local PFP population preflight', () => {
  it('resolves BA25/PFP2/2027 without authorizing campaign opening', () => {
    const report = inspectPfpPopulation(snapshot())
    expect(report.campaign).toEqual({ year: '2027', academicYear: '2026-2027', pfpType: 'PFP2', targetClass: 'BA25' })
    expect(report.populationReady).toBe(true)
    expect(report.campaignReady).toBe(false)
    expect(report.summary.targetCount).toBe(1)
    expect(report.summary.expectedCount).toBe(null)
  })

  it('does not silently prefer the physio class when sources disagree', () => {
    const input = snapshot()
    input.profiles[0].classe = 'BA24'
    const report = inspectPfpPopulation(input)
    expect(report.populationReady).toBe(false)
    expect(report.summary.targetCount).toBe(1)
    expect(report.summary.unresolved).toBe(1)
    expect(report.summary.issueCounts.conflicting_classes).toBe(1)
  })

  it('keeps an unexplained missing class unresolved, not excluded', () => {
    const input = snapshot()
    delete input.profiles[0].classe
    delete input.physioStudents[0].class
    const report = inspectPfpPopulation(input)
    expect(report.summary.excluded).toBe(0)
    expect(report.summary.unresolved).toBe(1)
    expect(report.summary.issueCounts.missing_class).toBe(1)
  })

  it('reconciles unique students with candidates, exclusions and unresolved cases', () => {
    const input = snapshot()
    input.profiles.push({ user_id: 'synthetic-2', classe: 'BA24' }, { user_id: 'synthetic-3', classe: 'BA25' })
    const { summary, excluded } = inspectPfpPopulation(input)
    expect(summary.uniqueStudents).toBe(summary.candidates + summary.excluded + summary.unresolved)
    expect(summary).toMatchObject({ uniqueStudents: 3, candidates: 1, excluded: 1, unresolved: 1 })
    expect(excluded[0].reason).toBe('outside_target_class')
  })

  it('deduplicates by user ID but blocks duplicated source records', () => {
    const input = snapshot()
    input.profiles.push({ ...input.profiles[0] })
    const { summary, populationReady } = inspectPfpPopulation(input)
    expect(summary.uniqueStudents).toBe(1)
    expect(summary.issueCounts.duplicate_profile).toBe(1)
    expect(populationReady).toBe(false)
  })

  it.each([
    ['', 'missing_respondent'],
    ['Unknown Tutor', 'unknown_respondent']
  ])('flags respondent value %s', (value, code) => {
    const input = snapshot()
    input.physioStudents[0].repondant_hes = value
    expect(inspectPfpPopulation(input).summary.issueCounts[code]).toBe(1)
  })

  it('does not guess between homonymous respondents', () => {
    const input = snapshot()
    input.respondents.push({ ...input.respondents[0] })
    expect(inspectPfpPopulation(input).summary.issueCounts.ambiguous_respondent).toBe(1)
  })

  it('requires a verified active respondent, with whitespace/case normalization only', () => {
    const input = snapshot()
    input.physioStudents[0].repondant_hes = ' example   TUTOR '
    expect(inspectPfpPopulation(input).populationReady).toBe(true)
    input.respondents[0].is_active = false
    expect(inspectPfpPopulation(input).summary.issueCounts.inactive_or_unverified_respondent).toBe(1)
  })

  it('accepts a respondent pair only when both members are known and active', () => {
    const input = snapshot()
    input.physioStudents[0].repondant_hes = 'Example Tutor / Second Tutor'
    input.respondents.push({ first_name: 'Second', last_name: 'Tutor', is_active: true })
    expect(inspectPfpPopulation(input).populationReady).toBe(true)

    input.respondents[1].is_active = false
    expect(inspectPfpPopulation(input).summary.issueCounts.inactive_or_unverified_respondent).toBe(1)

    input.respondents.pop()
    expect(inspectPfpPopulation(input).summary.issueCounts.unknown_respondent).toBe(1)
  })

  it('never considers missing, empty or incomplete sources ready', () => {
    const input = snapshot()
    expect(() => inspectPfpPopulation({ ...input, profiles: undefined })).toThrow()
    expect(inspectPfpPopulation({ ...input, sourcesComplete: undefined }).populationReady).toBe(false)
    expect(inspectPfpPopulation({ ...input, profiles: [], physioStudents: [] }).populationReady).toBe(false)
    input.profiles.push({ classe: 'BA25' })
    expect(inspectPfpPopulation(input).summary.unidentifiedRows).toBe(1)
  })

  it('checks a supplied expected count without hardcoding a cohort size', () => {
    const input = snapshot()
    expect(inspectPfpPopulation({ ...input, expectedCount: 1 }).populationReady).toBe(true)
    expect(inspectPfpPopulation({ ...input, expectedCount: 2 }).summary.issueCounts.unexpected_population_count).toBe(1)
    expect(() => inspectPfpPopulation({ ...input, expectedCount: -1 })).toThrow()
    expect(() => inspectPfpPopulation({ ...input, year: '2026-2028' })).toThrow()
    expect(() => inspectPfpPopulation({ ...input, pfpType: 'PFP9' })).toThrow()
  })

  it('is deterministic, does not mutate the snapshot and makes no network calls', () => {
    const input = snapshot()
    const freeze = value => {
      Object.values(value).forEach(child => { if (child && typeof child === 'object') freeze(child) })
      return Object.freeze(value)
    }
    freeze(input)
    const network = vi.fn(() => { throw new Error('Network forbidden') })
    vi.stubGlobal('fetch', network)
    try {
      expect(inspectPfpPopulation(input)).toEqual(inspectPfpPopulation(input))
      expect(network).not.toHaveBeenCalled()
    } finally { vi.unstubAllGlobals() }
  })
})
