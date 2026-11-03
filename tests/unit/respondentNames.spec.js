import { describe, expect, it } from 'vitest'
import { normalizeRespondentName, respondentLabelIncludes, splitRespondentNames } from '../../src/domain/pfp/respondentNames'

describe('respondent names', () => {
  it('splits a composite label while preserving both display names', () => {
    expect(splitRespondentNames('  Marie Curie / Albert Einstein  ')).toEqual(['Marie Curie', 'Albert Einstein'])
  })

  it('matches either member of a pair with normalized case and whitespace', () => {
    const label = 'Marie Curie / Albert Einstein'
    expect(respondentLabelIncludes(label, ' marie   CURIE ')).toBe(true)
    expect(respondentLabelIncludes(label, 'Albert Einstein')).toBe(true)
    expect(respondentLabelIncludes(label, 'Other Tutor')).toBe(false)
  })

  it('normalizes composed Unicode names consistently', () => {
    expect(normalizeRespondentName('  Renée  Exemple ')).toBe('renée exemple')
  })
})
