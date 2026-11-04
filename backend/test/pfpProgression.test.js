const test = require('node:test')
const assert = require('node:assert/strict')
const modulePromise = import('../domain/pfpProgression.mjs')
const row = (id, level, outcome, order) => ({ id, level, outcome, order })

test('either PFP1 period validates the same level', async () => {
  const { inspectPfpProgression } = await modulePromise
  for (const level of ['PFP1A', 'PFP1B']) {
    const result = inspectPfpProgression([row('a', level, 'passed', 1)], { historyComplete: true })
    assert.equal(result.validatedLevel, 1)
    assert.equal(result.nextLevel, 2)
    assert.equal(result.attempts[0].label, 'PFP1')
  }
})
test('failed attempts remain separate and bis can validate the level', async () => {
  const { inspectPfpProgression } = await modulePromise
  const input = [row('b', 1, 'passed', 2), row('a', 1, 'failed', 1)]
  const result = inspectPfpProgression(input, { historyComplete: true })
  assert.equal(result.attempts[0].label, 'PFP1 bis')
  assert.equal(result.nextLevel, 2)
  assert.equal(input[0].label, undefined)
})
test('multiple repeats have an explicit attempt number', async () => {
  const { inspectPfpProgression } = await modulePromise
  const result = inspectPfpProgression([row('a', 1, 'failed', 1), row('b', 1, 'failed', 2), row('c', 1, 'pending', 3)])
  assert.equal(result.attempts[2].label, 'PFP1 — tentative 3')
  assert.equal(result.nextLevel, null)
})
test('stopped, pending, missing and contradictory histories never authorize advancement', async () => {
  const { inspectPfpProgression } = await modulePromise
  for (const outcome of ['stopped', 'pending', 'unknown']) {
    const result = inspectPfpProgression([row('a', 1, outcome, 1)], { historyComplete: true })
    assert.equal(result.nextLevel, null)
    assert.equal(result.validatedLevel, 0)
  }
  assert.equal(inspectPfpProgression([row('a', 1, 'passed', 1)]).nextLevel, null)
  const conflict = inspectPfpProgression([row('a', 1, 'failed', 1), row('a', 1, 'passed', 1)], { historyComplete: true })
  assert.equal(conflict.attempts.length, 2)
  assert.equal(conflict.nextLevel, null)
})
test('deduplicates only proven identical identities', async () => {
  const { inspectPfpProgression } = await modulePromise
  const a = row('a', 1, 'passed', 1)
  assert.equal(inspectPfpProgression([a, a]).attempts.length, 1)
  assert.equal(inspectPfpProgression([row(null, 1, 'passed', 1), row(null, 1, 'passed', 1)]).attempts.length, 2)
})
test('does not order attempts by input position or infer preceding validation', async () => {
  const { inspectPfpProgression } = await modulePromise
  const tied = inspectPfpProgression([row('a', 1, 'failed', 1), row('b', 1, 'passed', 1)])
  assert.ok(tied.attempts.every(a => a.needsReview))
  const pfp2 = inspectPfpProgression([row('a', 2, 'passed', 1)], { historyComplete: true })
  assert.equal(pfp2.validatedLevel, 0)
  assert.equal(pfp2.nextLevel, null)
})
test('an interruption is not an automatic repeat decision', async () => {
  const { inspectPfpProgression } = await modulePromise
  const result = inspectPfpProgression([row('a', 1, 'stopped', 1), row('b', 1, 'pending', 2)])
  assert.equal(result.attempts[1].label, 'PFP1')
  assert.equal(result.attempts[1].needsReview, true)
})
test('validates a complete progression independently of input ordering', async () => {
  const { inspectPfpProgression } = await modulePromise
  const result = inspectPfpProgression([row('c', 3, 'passed', 3), row('a', 1, 'passed', 1), row('b', 2, 'passed', 2)], { historyComplete: true })
  assert.equal(result.validatedLevel, 3)
  assert.equal(result.nextLevel, 4)
  const impossible = inspectPfpProgression([row('c', 3, 'passed', 3), row('b', 2, 'passed', 1), row('a', 1, 'passed', 2)], { historyComplete: true })
  assert.equal(impossible.validatedLevel, 1)
  assert.equal(impossible.nextLevel, null)
  assert.equal(impossible.attempts[0].needsReview, true)
})
