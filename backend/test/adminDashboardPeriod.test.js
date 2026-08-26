const test = require('node:test')
const assert = require('node:assert/strict')

const { parseReference, resolveDashboardPeriods } = require('../dashboard/adminDashboardPeriod')

test('day periods use Zurich calendar boundaries during standard time', () => {
  const periods = resolveDashboardPeriods({ key: 'day', reference: '2026-01-15T12:00:00Z' })
  assert.deepEqual(periods.current, {
    key: 'day',
    start: '2026-01-14T23:00:00.000Z',
    end: '2026-01-15T23:00:00.000Z',
    timezone: 'Europe/Zurich'
  })
  assert.equal(periods.previous.start, '2026-01-13T23:00:00.000Z')
})

test('week starts on Monday and crosses a year safely', () => {
  const periods = resolveDashboardPeriods({ key: 'week', reference: '2026-01-01T12:00:00Z' })
  assert.equal(periods.current.start, '2025-12-28T23:00:00.000Z')
  assert.equal(periods.current.end, '2026-01-04T23:00:00.000Z')
  assert.equal(periods.previous.start, '2025-12-21T23:00:00.000Z')
})

test('month, quarter and year use calendar boundaries', () => {
  const month = resolveDashboardPeriods({ key: 'month', reference: '2026-03-31T22:30:00Z' })
  assert.equal(month.current.start, '2026-03-31T22:00:00.000Z')
  assert.equal(month.current.end, '2026-04-30T22:00:00.000Z')
  assert.equal(month.previous.start, '2026-02-28T23:00:00.000Z')

  const quarter = resolveDashboardPeriods({ key: 'quarter', reference: '2026-08-26' })
  assert.equal(quarter.current.start, '2026-06-30T22:00:00.000Z')
  assert.equal(quarter.current.end, '2026-09-30T22:00:00.000Z')
  assert.equal(quarter.previous.start, '2026-03-31T22:00:00.000Z')

  const year = resolveDashboardPeriods({ key: 'year', reference: '2026-08-26' })
  assert.equal(year.current.start, '2025-12-31T23:00:00.000Z')
  assert.equal(year.current.end, '2026-12-31T23:00:00.000Z')
  assert.equal(year.previous.start, '2024-12-31T23:00:00.000Z')
})

test('DST days expose their real 23 and 25 hour durations', () => {
  const spring = resolveDashboardPeriods({ key: 'day', reference: '2026-03-29T12:00:00Z' })
  assert.equal(Date.parse(spring.current.end) - Date.parse(spring.current.start), 23 * 60 * 60 * 1000)

  const autumn = resolveDashboardPeriods({ key: 'day', reference: '2026-10-25T12:00:00Z' })
  assert.equal(Date.parse(autumn.current.end) - Date.parse(autumn.current.start), 25 * 60 * 60 * 1000)
})

test('invalid period and reference parameters fail closed', () => {
  assert.throws(() => resolveDashboardPeriods({ key: '90d' }), /period invalide/)
  assert.throws(() => resolveDashboardPeriods({ reference: '26/08/2026' }), /reference invalide/)
  assert.throws(() => parseReference('2026-02-30'), /reference invalide/)
  assert.throws(() => parseReference('2026-02-30T12:00:00Z'), /reference invalide/)
  assert.throws(() => parseReference('2026-08-26T12:00:00'), /reference invalide/)
})
