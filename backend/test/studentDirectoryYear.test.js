const test = require('node:test')
const assert = require('node:assert/strict')
const selector = import('../domain/studentDirectoryYear.mjs')

test('annual directory is independent of row order and preserves history', async () => {
  const { selectPhysioRows } = await selector
  const rows = [
    { user_id: 'a', year: '2027', repondant_hes: 'Tutor A' },
    { user_id: 'a', year: '2025', repondant_hes: null },
    { user_id: 'b', year: '2026', repondant_hes: 'Tutor B' },
    { user_id: 'b', year: '2027', repondant_hes: 'Tutor C' }
  ]
  const before = JSON.stringify(rows)
  for (const input of [rows, [...rows].reverse()]) {
    assert.equal(selectPhysioRows(input, '2026-2027').get('a').repondant_hes, 'Tutor A')
    assert.equal(selectPhysioRows(input).get('b').repondant_hes, 'Tutor C')
    assert.equal(selectPhysioRows(input, '2025').get('a').repondant_hes, null)
  }
  assert.equal(JSON.stringify(rows), before)
})

test('missing year does not fall back and conflicting duplicates are rejected', async () => {
  const { selectPhysioRows, directoryYear } = await selector
  const row = { user_id: 'a', year: '2026', repondant_hes: 'Tutor' }
  assert.equal(selectPhysioRows([row], '2027').size, 0)
  assert.equal(selectPhysioRows([{ ...row, year: null }]).size, 0)
  assert.throws(() => selectPhysioRows([row, { ...row }], '2026'), { status: 409 })
  assert.throws(() => directoryYear('2027-2026'), { status: 400 })
  assert.throws(() => directoryYear(['2027']), { status: 400 })
  assert.equal(directoryYear(undefined), null)
})

test('directory handler exposes annual status and uses no database mutations', async () => {
  const clientPath = require.resolve('../supabaseClient')
  const routerPath = require.resolve('../supabase/audienceDirectoryBackend')
  const originalClient = require.cache[clientPath]
  const originalRouter = require.cache[routerPath]
  let rows = [{ user_id: 'a', year: '2025', class: 'BA23', repondant_hes: null },
    { user_id: 'a', year: '2027', class: 'BA25', repondant_hes: 'Tutor A' }]
  let reads = 0
  const fake = { from(table) {
    reads++
    const data = table === 'user_profiles'
      ? [{ user_id: 'a', role: 'EtudiantPhysio', classe: 'BA25' }, { user_id: 'admin', role: 'admin' }]
      : rows
    const query = { select() { return query }, in() { return query }, then(resolve) { return Promise.resolve({ data, error: null }).then(resolve) } }
    return query
  } }
  require.cache[clientPath] = { id: clientPath, filename: clientPath, loaded: true, exports: { supabaseAdmin: fake } }
  delete require.cache[routerPath]
  try {
    const router = require(routerPath)
    const handler = router.stack.find(layer => layer.route?.path === '/students').route.stack[0].handle
    const call = async query => {
      const result = { status: 200 }
      await handler({ query }, { status(code) { result.status = code; return this }, json(body) { result.body = body; return this } })
      return result
    }
    const response = await call({ year: '2026-2027' })
    assert.equal(response.body.count, 1)
    assert.equal(response.body.data[0].repondant_hes, 'Tutor A')
    assert.equal(response.body.data[0].physio_year, '2027')
    assert.equal(response.body.data[0].physio_year_status, 'matched')
    const missing = await call({ year: '2028' })
    assert.equal(missing.body.data[0].repondant_hes, null)
    assert.equal(missing.body.data[0].physio_year_status, 'missing')
    const before = reads
    assert.equal((await call({ year: 'oops' })).status, 400)
    assert.equal(reads, before)
    rows = [rows[1], rows[1]]
    assert.equal((await call({ year: '2027' })).status, 409)
  } finally {
    if (originalClient) require.cache[clientPath] = originalClient
    else delete require.cache[clientPath]
    if (originalRouter) require.cache[routerPath] = originalRouter
    else delete require.cache[routerPath]
  }
})
