const test = require('node:test')
const assert = require('node:assert/strict')
const express = require('express')

process.env.SUPABASE_URL ||= 'http://127.0.0.1:54321'
process.env.SUPABASE_KEY ||= 'test-anon-key'

const supabasePath = require.resolve('../supabaseClient')
const authPath = require.resolve('../middleware/auth')
const routerPath = require.resolve('../supabase/resultatVotationStoreBackend')
const previousSupabase = require.cache[supabasePath]
const previousAuth = require.cache[authPath]
let existingRows = []
let writes = 0

const supabaseAdmin = {
  from() {
    const query = {
      select() { return query },
      eq() { return query },
      in() { return Promise.resolve({ data: existingRows, error: null }) },
      upsert() { writes += 1; return query }
    }
    return query
  }
}

require.cache[supabasePath] = { id: supabasePath, filename: supabasePath, loaded: true, exports: { supabaseAdmin } }
require.cache[authPath] = {
  id: authPath,
  filename: authPath,
  loaded: true,
  exports: {
    requireAdmin: (_req, _res, next) => next(),
    requireSelfParam: () => (_req, _res, next) => next()
  }
}
delete require.cache[routerPath]
const router = require(routerPath)

async function runAlgorithm(body) {
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    req.auth = { user: { id: 'admin-test' } }
    next()
  })
  app.use(router)
  const server = app.listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  try {
    const response = await fetch(`http://127.0.0.1:${server.address().port}/run-algorithm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ persist: false, year: '2027', seed: 5, ...body })
    })
    return { status: response.status, body: await response.json() }
  } finally {
    await new Promise(resolve => server.close(resolve))
  }
}

test.after(() => {
  delete require.cache[routerPath]
  if (previousSupabase) require.cache[supabasePath] = previousSupabase
  else delete require.cache[supabasePath]
  if (previousAuth) require.cache[authPath] = previousAuth
  else delete require.cache[authPath]
})

test('choix pondérés : les attributions existantes sont conservées et leur place n’est pas redonnée', async () => {
  writes = 0
  existingRows = [{ user_id: 'already', assigned_place_id: 'P1', assigned_place_name: 'Place 1', assigned_rank: 0, status: 'published', notes: 'Manuel' }]
  const { status, body } = await runAlgorithm({
    pfpType: 'PFP2',
    students: [
      { userId: 'already', choices: ['P1'] },
      { userId: 'a', choices: ['P1', 'P2', 'P3'], missingCriteria: [], donePlaceIds: [] },
      { userId: 'b', choices: ['P2'], missingCriteria: [], donePlaceIds: [] }
    ],
    places: [
      { PlaceId: 'P1', NomPlace: 'Place 1', Capacity: 1, criteria: {} },
      { PlaceId: 'P2', NomPlace: 'Place 2', Capacity: 1, criteria: {} },
      { PlaceId: 'P3', NomPlace: 'Place 3', Capacity: 1, criteria: {} }
    ]
  })
  existingRows = []
  assert.equal(status, 200)
  assert.equal(writes, 0)
  const byUser = new Map(body.results.map(r => [r.user_id, r]))
  assert.equal(byUser.get('already').assigned_place_id, 'P1')
  assert.equal(byUser.get('b').assigned_place_id, 'P2')
  assert.equal(byUser.get('b').assigned_rank, 1)
  assert.equal(byUser.get('a').assigned_place_id, 'P3')
  assert.equal(byUser.get('a').assigned_rank, 3)
  assert.equal(body.results.filter(r => r.assigned_place_id === 'P1').length, 1)
  assert.equal(body.stats.lesedCount, 0)
  assert.equal(body.stats.seed, 5)
})

test('PFP1/PFP2 suivent les choix pondérés, PFP3/PFP4 gardent la logique v5.0', async () => {
  existingRows = []
  const input = {
    students: [{ userId: 's', choices: ['P1'], missingCriteria: ['MSQ'], donePlaceIds: [] }],
    places: [
      { PlaceId: 'P1', NomPlace: 'Choisie', Capacity: 1, criteria: {} },
      { PlaceId: 'P2', NomPlace: 'Critère MSQ', Capacity: 1, criteria: { MSQ: true } }
    ]
  }
  for (const pfpType of ['PFP1A', 'PFP1B', 'PFP2']) {
    const { body } = await runAlgorithm({ ...input, pfpType })
    const result = body.results.find(r => r.user_id === 's')
    assert.equal(result.assigned_place_id, 'P1', pfpType)
    assert.equal(result.assigned_rank, 1, pfpType)
    assert.match(result.notes, /v6\.0/)
  }
  for (const pfpType of ['PFP3', 'PFP4']) {
    const { body } = await runAlgorithm({ ...input, pfpType })
    const result = body.results.find(r => r.user_id === 's')
    assert.equal(result.assigned_place_id, 'P2', pfpType)
    assert.equal(result.assigned_rank, 99, pfpType)
    assert.match(result.notes, /v5\.0/)
  }
})
