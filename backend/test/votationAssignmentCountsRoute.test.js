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

let requestedAssignmentColumns = null

function resolvedQuery(result) {
  const query = {
    select(columns) {
      if (result.kind === 'assignments') requestedAssignmentColumns = columns
      return query
    },
    eq() { return query },
    in() { return query },
    not() { return query },
    maybeSingle() { return Promise.resolve(result.value) },
    then(resolve, reject) { return Promise.resolve(result.value).then(resolve, reject) }
  }
  return query
}

const supabaseAdmin = {
  from(table) {
    if (table === 'user_profiles') {
      return resolvedQuery({
        kind: 'profile',
        value: { data: { classe: 'BA25', pfp_cohort: null }, error: null }
      })
    }
    if (table === 'votation_sessions') {
      return resolvedQuery({
        kind: 'sessions',
        value: {
          data: [{ target_class: 'BA25', is_priority: false, priority_user_ids: [] }],
          error: null
        }
      })
    }
    if (table === 'student_result_vote') {
      return resolvedQuery({
        kind: 'assignments',
        value: {
          data: [
            { assigned_place_id: 'place-a' },
            { assigned_place_id: 'place-a' },
            { assigned_place_id: 'place-b' }
          ],
          error: null
        }
      })
    }
    return resolvedQuery({ kind: table, value: { data: [], error: null } })
  }
}

require.cache[supabasePath] = {
  id: supabasePath,
  filename: supabasePath,
  loaded: true,
  exports: { supabaseAdmin }
}
require.cache[authPath] = {
  id: authPath,
  filename: authPath,
  loaded: true,
  exports: {
    isAdmin: () => false,
    requireAdmin: (_req, _res, next) => next(),
    requireSelfParam: () => (_req, _res, next) => next()
  }
}
delete require.cache[routerPath]
const router = require(routerPath)

function createApp() {
  const app = express()
  app.use((req, _res, next) => {
    req.auth = {
      user: { id: 'student-1' },
      userId: 'student-1',
      permissions: ['EtudiantPhysio']
    }
    next()
  })
  app.use(router)
  return app
}

async function listen(callback) {
  const server = createApp().listen(0, '127.0.0.1')
  await new Promise((resolve) => server.once('listening', resolve))
  const { port } = server.address()
  try {
    await callback(`http://127.0.0.1:${port}`)
  } finally {
    await new Promise((resolve) => server.close(resolve))
  }
}

test.after(() => {
  delete require.cache[routerPath]
  if (previousSupabase) require.cache[supabasePath] = previousSupabase
  else delete require.cache[supabasePath]
  if (previousAuth) require.cache[authPath] = previousAuth
  else delete require.cache[authPath]
})

test('an eligible student receives aggregate counts without identity columns', async () => {
  requestedAssignmentColumns = null

  await listen(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/assignment-counts/PFP2/2026-2027`)
    const body = await response.json()

    assert.equal(response.status, 200)
    assert.match(response.headers.get('cache-control') || '', /no-store/)
    assert.deepEqual(body, {
      ok: true,
      counts: { 'place-a': 2, 'place-b': 1 }
    })
    assert.equal(requestedAssignmentColumns, 'assigned_place_id')

    const conditionalResponse = await fetch(`${baseUrl}/assignment-counts/PFP2/2026-2027`, {
      headers: { 'If-None-Match': response.headers.get('etag') }
    })
    assert.equal(conditionalResponse.status, 200)
    assert.deepEqual(await conditionalResponse.json(), body)
  })
})
