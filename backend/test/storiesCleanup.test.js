const test = require('node:test')
const assert = require('node:assert/strict')
const { purgeExpiredStories } = require('../workers/storiesCleanup')

// Faux client Supabase : enregistre les appels et rejoue des réponses.
function fakeClient({ rows = [], removed, removeError = null, selectError = null, deleteError = null } = {}) {
  const calls = { select: null, removed: null, deleted: null }
  const client = {
    calls,
    from(table) {
      assert.equal(table, 'stories')
      return {
        select(columns) {
          const query = { columns }
          const chain = {
            lt(column, value) { query.lt = [column, value]; return chain },
            order(column, options) { query.order = [column, options]; return chain },
            limit(n) { query.limit = n; calls.select = query; return Promise.resolve({ data: rows, error: selectError }) },
          }
          return chain
        },
        delete() {
          return { in(column, ids) { calls.deleted = [column, ids]; return Promise.resolve({ error: deleteError }) } }
        },
      }
    },
    storage: {
      from(bucket) {
        assert.equal(bucket, 'stories')
        return {
          remove(paths) {
            calls.removed = paths
            return Promise.resolve({ data: removed ?? paths.map(name => ({ name })), error: removeError })
          },
        }
      },
    },
  }
  return client
}

const now = new Date('2026-11-16T12:00:00Z')

test('only stories expired for more than the grace period are selected', async () => {
  const client = fakeClient()
  const result = await purgeExpiredStories(client, { now })
  assert.deepEqual(result, { expired: 0, filesRemoved: 0, storiesDeleted: 0 })
  assert.deepEqual(client.calls.select.lt, ['expires_at', '2026-11-16T11:00:00.000Z'])
  assert.equal(client.calls.select.limit, 200)
  assert.equal(client.calls.removed, null)
  assert.equal(client.calls.deleted, null)
})

test('media are removed through Storage before the story rows', async () => {
  const rows = [
    { id: 's1', media_path: 'u1/a.mp4' },
    { id: 's2', media_path: 'u2/b.jpg' },
  ]
  // b.jpg n'existe déjà plus : la ligne est quand même effacée.
  const client = fakeClient({ rows, removed: [{ name: 'u1/a.mp4' }] })
  const result = await purgeExpiredStories(client, { now })
  assert.deepEqual(client.calls.removed, ['u1/a.mp4', 'u2/b.jpg'])
  assert.deepEqual(client.calls.deleted, ['id', ['s1', 's2']])
  assert.deepEqual(result, { expired: 2, filesRemoved: 1, storiesDeleted: 2 })
})

test('story rows are kept when the media removal fails', async () => {
  const client = fakeClient({ rows: [{ id: 's1', media_path: 'u1/a.mp4' }], removeError: { message: 'storage down' } })
  await assert.rejects(purgeExpiredStories(client, { now }), /médias impossible/)
  assert.equal(client.calls.deleted, null)
})

test('a read error stops the pass without deleting anything', async () => {
  const client = fakeClient({ selectError: { message: 'permission denied' } })
  await assert.rejects(purgeExpiredStories(client, { now }), /lecture des stories/)
  assert.equal(client.calls.removed, null)
})
