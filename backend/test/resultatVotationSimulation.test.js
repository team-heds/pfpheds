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
let queryError = null
let queryData = []
let writes = 0

const supabaseAdmin = {
  from() {
    const query = {
      select() { return query },
      eq() { return query },
      in() { return Promise.resolve({ data: queryData, error: queryError }) },
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

function createApp() {
  const app = express()
  app.use(express.json())
  app.use((req, _res, next) => {
    req.auth = { user: { id: 'admin-test' } }
    next()
  })
  app.use(router)
  return app
}

async function listen(callback) {
  const server = createApp().listen(0, '127.0.0.1')
  await new Promise(resolve => server.once('listening', resolve))
  const { port } = server.address()
  try {
    await callback(`http://127.0.0.1:${port}`)
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

test('algorithm runs are non-persistent when persist is omitted', async () => {
  queryError = null
  writes = 0
  await listen(async baseUrl => {
    const response = await fetch(`${baseUrl}/run-algorithm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pfpType: 'PFP2', year: '2026-2027', students: [], places: [] })
    })
    const body = await response.json()
    assert.equal(response.status, 200)
    assert.equal(body.persisted, false)
    assert.equal(writes, 0)
  })
})

test('algorithm simulation fails closed when existing assignments cannot be checked', async () => {
  queryError = { message: 'read unavailable' }
  writes = 0
  await listen(async baseUrl => {
    const response = await fetch(`${baseUrl}/run-algorithm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pfpType: 'PFP2', year: '2027', students: [], places: [], persist: false })
    })
    const body = await response.json()
    assert.equal(response.status, 500)
    assert.match(body.error, /Impossible de vérifier/)
    assert.equal(writes, 0)
  })
})

test('a string persistence flag is rejected before querying or writing', async () => {
  queryError = null
  writes = 0
  await listen(async baseUrl => {
    const response = await fetch(`${baseUrl}/run-algorithm`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pfpType: 'PFP2', year: '2027', students: [], places: [], persist: 'false' })
    })
    assert.equal(response.status, 400)
    assert.equal(writes, 0)
  })
})

test('weighted choices keep existing assignments and never reuse their place', async () => {
  queryError = null
  writes = 0
  queryData = [{ user_id: 'already', assigned_place_id: 'P1', assigned_place_name: 'Place 1', assigned_rank: 0, status: 'published', notes: 'Manuel' }]
  try {
    await listen(async baseUrl => {
      const response = await fetch(`${baseUrl}/run-algorithm`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          pfpType: 'PFP2',
          year: '2027',
          seed: 11,
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
      })
      const body = await response.json()
      assert.equal(response.status, 200)
      assert.equal(writes, 0)
      const byUser = new Map(body.results.map(r => [r.user_id, r]))
      assert.equal(byUser.get('already').assigned_place_id, 'P1')
      assert.equal(byUser.get('b').assigned_place_id, 'P2')
      assert.equal(byUser.get('b').assigned_rank, 1)
      assert.equal(byUser.get('a').assigned_place_id, 'P3')
      assert.equal(byUser.get('a').assigned_rank, 3)
      assert.equal(body.results.filter(r => r.assigned_place_id === 'P1').length, 1)
      assert.equal(body.stats.lesedCount, 0)
      assert.equal(body.stats.seed, 11)
    })
  } finally {
    queryData = []
  }
})
