const test = require('node:test')
const assert = require('node:assert/strict')
const { normalizePfpRequest } = require('../middleware/pfpAcademicPeriod')

async function validate(body) {
  const req = { body }
  let status
  let response
  let continued = false
  const res = {
    status(value) { status = value; return this },
    json(value) { response = value; return this }
  }
  await normalizePfpRequest(req, res, () => { continued = true })
  return { req, status, response, continued }
}

test('canonicalizes request years without mutating the original payload', async () => {
  for (const year of ['2026-2027', '2027', 2027]) {
    const body = { year, persist: false, proposals: { student: 'place' } }
    const result = await validate(body)
    assert.equal(result.continued, true)
    assert.equal(result.req.body.year, '2027')
    assert.equal(body.year, year)
    assert.equal(result.req.body.persist, false)
    assert.deepEqual(result.req.body.proposals, body.proposals)
  }
})

test('invalid request years stop before the write handler', async () => {
  for (const year of [null, '', '2026-2028', 'BA25', {}, 2027.5]) {
    const result = await validate({ year })
    assert.equal(result.status, 400)
    assert.equal(result.continued, false)
    assert.equal(result.response.ok, false)
  }
})

test('canonicalizes all confirmation rows while retaining separate students and PFPs', async () => {
  const results = [
    { user_id: 'one', pfp_type: 'PFP2', year: '2026-2027' },
    { user_id: 'two', pfp_type: 'PFP2', year: '2027' },
    { user_id: 'one', pfp_type: 'PFP3', year: 2027 }
  ]
  const result = await validate({ results })
  assert.equal(result.continued, true)
  assert.deepEqual(result.req.body.results.map(row => row.year), ['2027', '2027', '2027'])
  assert.equal(results[0].year, '2026-2027')
})

test('rejects an entire confirmation batch if academic aliases collide', async () => {
  const body = { results: [
    { user_id: 'one', pfp_type: 'PFP2', year: '2026-2027' },
    { user_id: 'one', pfp_type: 'PFP2', year: '2027' }
  ] }
  const result = await validate(body)
  assert.equal(result.status, 400)
  assert.equal(result.continued, false)
  assert.equal(result.req.body, body)
})

test('rejects an entire confirmation batch containing an invalid year', async () => {
  const result = await validate({ results: [
    { user_id: 'one', pfp_type: 'PFP2', year: '2027' },
    { user_id: 'two', pfp_type: 'PFP2', year: 'unknown' }
  ] })
  assert.equal(result.status, 400)
  assert.equal(result.continued, false)
})

test('read requests retain legacy year parameters and receive the shared reader', async () => {
  const result = await validate(undefined)
  assert.equal(result.continued, true)
  assert.equal(result.req.body, undefined)
  assert.deepEqual(result.req.academicPeriod.getAcademicYearKeys('2026-2027'), ['2027', '2026-2027'])
})

test('rejects string persistence flags before a handler can treat them as truthy', async () => {
  const result = await validate({ year: '2027', persist: 'false' })
  assert.equal(result.status, 400)
  assert.equal(result.continued, false)
})
