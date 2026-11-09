const test = require('node:test')
const assert = require('node:assert/strict')
const { canReadAssignmentCounts } = require('../domain/votationAssignmentAccess')

test('an administrator can read aggregate assignment counts', () => {
  assert.equal(canReadAssignmentCounts({ admin: true }), true)
})

test('a student can read counts for an open campaign targeting their class', () => {
  assert.equal(canReadAssignmentCounts({
    userId: 'student-1',
    profile: { classe: 'BA25' },
    sessions: [{ target_class: 'ba25', is_priority: false }]
  }), true)
})

test('a priority student can read counts even outside the normal target class', () => {
  assert.equal(canReadAssignmentCounts({
    userId: 'student-1',
    profile: { classe: 'BA24' },
    sessions: [{
      target_class: 'BA25',
      is_priority: true,
      priority_user_ids: ['student-1']
    }]
  }), true)
})

test('an unrelated authenticated user cannot read campaign counts', () => {
  assert.equal(canReadAssignmentCounts({
    userId: 'student-2',
    profile: { classe: 'BA24' },
    sessions: [
      { target_class: 'BA25', is_priority: false },
      { target_class: 'BA25', is_priority: true, priority_user_ids: ['student-1'] }
    ]
  }), false)
})
