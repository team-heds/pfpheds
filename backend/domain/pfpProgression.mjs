// Pure advisory model. Callers must establish source completeness before using nextLevel.
export function pfpLevel(value) {
  const match = /^PFP([1-4])(?:[AB])?$/.exec(String(value ?? '').trim().toUpperCase())
  if (match && (match[1] === '1' || !/[AB]$/.test(match[0]))) return Number(match[1])
  return /^[1-4]$/.test(String(value ?? '')) ? Number(value) : null
}

export function inspectPfpProgression(input = [], { historyComplete = false } = {}) {
  const issues = []
  const issue = (code, id = null) => issues.push({ code, id })
  const identities = new Map()
  const attempts = []
  for (const row of input) {
    const attempt = {
      ...row, id: row.id == null ? null : String(row.id), level: pfpLevel(row.level),
      outcome: ['passed', 'failed', 'stopped', 'pending'].includes(row.outcome) ? row.outcome : 'invalid',
      order: Number.isFinite(row.order) ? row.order : null,
      attemptNumber: null, needsReview: false
    }
    const signature = JSON.stringify([attempt.level, attempt.outcome, attempt.order, row.period ?? null, row.IDPlace ?? null, row.startDate ?? null, row.endDate ?? null])
    if (attempt.id && identities.has(attempt.id)) {
      const prior = identities.get(attempt.id)
      if (prior.signature === signature) continue
      prior.attempt.needsReview = true
      attempt.needsReview = true
      issue('conflicting_identity', attempt.id)
    } else if (attempt.id) identities.set(attempt.id, { signature, attempt })
    if (!attempt.id) { attempt.needsReview = true; issue('missing_identity') }
    if (!attempt.level) { attempt.needsReview = true; issue('missing_level', attempt.id) }
    if (attempt.outcome === 'invalid') { attempt.needsReview = true; issue('invalid_outcome', attempt.id) }
    attempts.push(attempt)
  }
  for (let level = 1; level <= 4; level++) {
    const group = attempts.filter(row => row.level === level)
    const ordered = [...group].sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity))
    const ambiguous = group.length > 1 && (group.some(row => row.order == null) || new Set(group.map(row => row.order)).size !== group.length)
    if (ambiguous) {
      issue('ambiguous_attempt_order')
      group.forEach(row => { row.needsReview = true })
    }
    ordered.forEach((row, index) => {
      if (!row.needsReview) row.attemptNumber = index + 1
      if (index > 0 && ordered[index - 1].outcome !== 'failed') {
        // An interruption, pending outcome or already-passed level needs a decision.
        row.needsReview = true
        row.attemptNumber = null
        issue('repeat_requires_decision', row.id)
      }
    })
  }
  // Resolve prerequisites in level order, independently of input order.
  for (const row of [...attempts].sort((a, b) => (a.level ?? 0) - (b.level ?? 0))) {
    if (row.level > 1 && (row.order == null || !attempts.some(previous =>
      previous.level === row.level - 1 && previous.outcome === 'passed' && !previous.needsReview &&
      previous.order != null && previous.order < row.order))) {
      row.needsReview = true
      issue('unproven_prerequisite', row.id)
    }
  }
  // A higher level never proves that the preceding level was passed.
  let validatedLevel = 0
  for (let level = 1; level <= 4; level++) {
    const passed = attempts.filter(row => row.level === level && row.outcome === 'passed' && !row.needsReview)
    if (!passed.length) break
    if (level > 1 && !passed.some(row => row.order != null && attempts.some(previous =>
      previous.level === level - 1 && previous.outcome === 'passed' && !previous.needsReview &&
      previous.order != null && previous.order < row.order))) break
    validatedLevel = level
  }
  attempts.forEach(row => {
    row.label = row.level ? `PFP${row.level}` : 'PFP à vérifier'
    if (!row.needsReview && row.attemptNumber === 2) row.label += ' bis'
    if (!row.needsReview && row.attemptNumber > 2) row.label += ` — tentative ${row.attemptNumber}`
  })
  if (!historyComplete) issue('incomplete_history')
  const unresolved = attempts.some(row => row.needsReview || row.outcome === 'pending' || row.outcome === 'stopped')
  return { attempts, issues, validatedLevel,
    nextLevel: historyComplete && !unresolved && issues.length === 0 && validatedLevel < 4 ? validatedLevel + 1 : null }
}
