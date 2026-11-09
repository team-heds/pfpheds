const clean = value => typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : ''

export const normalizeRespondentName = value => clean(value).normalize('NFC').toLocaleLowerCase('fr-CH')

export const splitRespondentNames = value => clean(value)
  .split(/\s*\/\s*/)
  .map(clean)
  .filter(Boolean)

export const respondentLabelIncludes = (label, respondentName) => {
  const expected = normalizeRespondentName(respondentName)
  if (!expected) return false
  return splitRespondentNames(label).some(name => normalizeRespondentName(name) === expected)
}
