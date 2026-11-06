const test = require('node:test')
const assert = require('node:assert/strict')
const { buildIntegrityReport, createGamificationIntegrityRouter, loadIntegrityData } = require('../supabase/gamificationIntegrityBackend')

const emptyData = {
  profiles: [], gamification: [], houses: [], badges: [], badgeDefinitions: [],
  quests: [], steps: [], questProgress: [], xp: []
}

test('detects orphan users, missing houses, duplicate/unknown badges, unknown steps and XP drift', () => {
  const report = buildIntegrityReport({
    profiles: [{ user_id: 'u1', house_id: 'missing' }],
    gamification: [{ id: 'g1', user_id: 'u1', total_xp: 99, house_id: 'missing' }],
    houses: [], badges: [{ user_id: 'u1', badge_id: 'b1' }, { user_id: 'u1', badge_id: 'b1' }],
    badgeDefinitions: [], quests: [{ id: 'q1' }], steps: [],
    questProgress: [{ id: 'p1', user_id: 'u1', quest_id: 'q1', current_step: 2 }],
    xp: [{ id: 'x1', user_id: 'u1', amount: 10 }]
  })
  const codes = report.issues.map((issue) => issue.code)
  assert.ok(codes.includes('missing_house'))
  assert.ok(codes.includes('duplicate_badge'))
  assert.ok(codes.includes('unknown_badge'))
  assert.ok(codes.includes('unknown_step'))
  assert.ok(codes.includes('xp_mismatch'))
  assert.equal(report.blockingCount, report.issues.length)
})

test('reports profiles with no gamification row and preserves the explicit history rule', () => {
  const report = buildIntegrityReport({ ...emptyData, profiles: [{ user_id: 'u1' }] })
  assert.equal(report.issues[0].code, 'orphan_profile')
  assert.match(report.expiryRule, /conservés/)
})

test('continues when optional progress and history tables are absent', async () => {
  const client = {
    from(table) {
      return {
        select() {
          return {
            range: async () => {
              if (['quests', 'quest_steps', 'user_quest_progress', 'xp_history'].includes(table)) {
                return { data: null, error: { code: 'PGRST205' } }
              }
              return { data: [], error: null }
            }
          }
        }
      }
    }
  }
  const data = await loadIntegrityData(client)
  assert.equal(data.warnings.length, 4)
  assert.deepEqual(data.xp, [])
})

test('repair confirmation endpoint is disabled and cannot delete data', async () => {
  const router = createGamificationIntegrityRouter({ client: { from: () => { throw new Error('unused') } } })
  const route = router.stack.find((entry) => entry.route?.path === '/plan/:planId/confirm')
  let status
  let body
  route.route.stack[0].handle({}, { status(value) { status = value; return this }, json(value) { body = value; return this } })
  assert.equal(status, 409)
  assert.match(body.error, /validation humaine/)
})
