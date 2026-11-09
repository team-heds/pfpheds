import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
const base = 'https://test.hedsvs.ch'
const access = JSON.parse(await fs.readFile(new URL('real-test-access.json', import.meta.url)))
const env = Object.fromEntries((await fs.readFile(new URL('.env', import.meta.url), 'utf8')).trim().split('\n').map(line => {
  const i = line.indexOf('='); return [line.slice(0, i), line.slice(i + 1)]
}))
const login = await fetch(base + '/auth/v1/token?grant_type=password', {
  method: 'POST', headers: { apikey: env.STAGING_ANON_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: access.verificationAccounts.find(item => item.role === 'admin').email, password: access.password })
})
assert.equal(login.status, 200, 'Test admin login')
const session = await login.json()
const headers = { Authorization: `Bearer ${session.access_token}`, apikey: env.STAGING_ANON_KEY }
for (const year of ['2027', '2026-2027', '2025', undefined]) {
  const response = await fetch(base + '/api/audiences/students' + (year ? '?year=' + year : ''), { headers })
  assert.equal(response.status, 200, 'Annual directory request')
  const { data } = await response.json()
  const expected = [['Noah', 'In-Albon', 'Christophe Baur'], ['Fleur', 'Greffet', 'Benoît Bontempelli']]
  for (const [first, last, respondent] of expected) {
    const student = data.find(item => item.forname === first && item.family_name === last)
    assert.ok(student, 'Expected student exists')
    assert.equal(student.repondant_hes, year === '2025' ? null : respondent)
    assert.equal(student.physio_year, year === '2025' ? '2025' : '2027')
  }
  console.log(JSON.stringify({ year: year || 'latest', checkedStudents: 2, correctRespondents: true, ba25: data.filter(item => item.Classe === 'BA25').length }))
}
const invalid = await fetch(base + '/api/audiences/students?year=invalid', { headers })
assert.equal(invalid.status, 400)
console.log('Invalid year rejected; historical rows preserved.')
