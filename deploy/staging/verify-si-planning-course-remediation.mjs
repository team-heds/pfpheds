import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { buildPlanningRemediationFindings } from '../../src/domain/si/planningRemediation.js'

const directory = new URL('./', import.meta.url)
const endpoint = (process.env.HEDS_STAGING_URL || 'http://127.0.0.1:8180').replace(/\/$/, '')
assert.equal(endpoint, 'http://127.0.0.1:8180', 'Cette recette doit utiliser le tunnel de test')

const env = Object.fromEntries((await fs.readFile(new URL('.env', directory), 'utf8'))
  .split(/\r?\n/)
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('#'))
  .map(line => {
    const index = line.indexOf('=')
    return [line.slice(0, index), line.slice(index + 1)]
  }))

const account = JSON.parse(await fs.readFile(new URL('test-accounts.json', directory), 'utf8'))
  .find(item => item.email === 'admin.test@example.invalid')
assert.ok(account, 'Le compte administrateur de test est introuvable')

const service = createClient(endpoint, env.STAGING_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})
const browser = createClient(endpoint, env.STAGING_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const check = ({ data, error }) => {
  if (error) throw error
  return data || []
}

const normalize = value => String(value || '').replace(/\s+/g, ' ').trim().toUpperCase().replace(/_/g, '-')
const classAliases = value => {
  const normalized = normalize(value).replace(/\s+/g, '')
  const aliases = new Set(normalized ? [normalized] : [])
  const match = normalized.match(/^(?:B|BA|BAC)(\d{2})(.*)$/)
  if (match) {
    aliases.add(`B${match[1]}${match[2]}`)
    aliases.add(`BA${match[1]}${match[2]}`)
    aliases.add(`BAC${match[1]}${match[2]}`)
  }
  return aliases
}

async function fetchAll(table, select = '*') {
  const rows = []
  for (let offset = 0; offset < 20000; offset += 1000) {
    const page = check(await service.from(table).select(select).order('id').range(offset, offset + 999))
    rows.push(...page)
    if (page.length < 1000) break
  }
  return rows
}

const { error: loginError } = await browser.auth.signInWithPassword({
  email: account.email,
  password: account.password
})
if (loginError) throw loginError
const { data: sessionData } = await browser.auth.getSession()
const token = sessionData.session.access_token
const historyIds = []
const appliedHistoryIds = new Set()

async function api(path, init = {}) {
  const response = await fetch(`${endpoint}/api/si/planning-remediations${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {})
    }
  })
  const payload = await response.json()
  assert.ok(response.ok, `${response.status}: ${JSON.stringify(payload)}`)
  return payload
}

try {
  const activeYears = check(await service.from('academic_years').select('id,name').eq('is_active', true))
  assert.equal(activeYears.length, 1, `Une année active attendue, ${activeYears.length} trouvée(s)`)
  const activeClasses = check(await service.from('classes').select('code').eq('academic_year_id', activeYears[0].id))
  const activeClassCodes = new Set(activeClasses.flatMap(row => [...classAliases(row.code)]))

  const [allSlots, modules, courses] = await Promise.all([
    fetchAll('planning_time_slots'),
    fetchAll('modules', 'id,code,number'),
    fetchAll('courses', 'id,name,module_id')
  ])
  const slots = allSlots.filter(slot => {
    const codes = [...(Array.isArray(slot.class_codes) ? slot.class_codes : []), slot.class_code].filter(Boolean)
    return codes.some(code => [...classAliases(code)].some(alias => activeClassCodes.has(alias)))
  })
  const safeCourseFindings = buildPlanningRemediationFindings({ slots, modules, courses })
    .filter(finding => finding.category === 'course' && finding.confidence === 'high')
    .sort((left, right) => left.slotId - right.slotId)

  assert.equal(safeCourseFindings.length, 2, 'La recette attend exactement les deux propositions sûres visibles dans l’interface')

  const verified = []
  for (const finding of safeCourseFindings) {
    const targetId = finding.slotId
    const candidateId = finding.proposedValue.id
    const { data: before, error: beforeError } = await service
      .from('planning_time_slots')
      .select('course_id')
      .eq('id', targetId)
      .single()
    if (beforeError) throw beforeError
    assert.equal(before.course_id, finding.expectedValue.id)

    const applied = await api('', {
      method: 'POST',
      body: JSON.stringify({
        slotId: targetId,
        category: 'course',
        expectedValue: finding.expectedValue,
        replacementValue: finding.replacementValue,
        reason: `Recette contrôlée de la proposition sûre du créneau ${targetId}.`
      })
    })
    const historyId = applied.remediation.historyId
    historyIds.push(historyId)
    appliedHistoryIds.add(historyId)

    const { data: changed, error: changedError } = await service
      .from('planning_time_slots')
      .select('course_id')
      .eq('id', targetId)
      .single()
    if (changedError) throw changedError
    assert.equal(changed.course_id, candidateId)

    const appliedHistory = await api('/history?limit=100')
    const appliedEntry = appliedHistory.history.find(entry => entry.id === historyId)
    assert.equal(appliedEntry?.status, 'applied')
    assert.deepEqual(appliedEntry?.before_value, finding.expectedValue)
    assert.deepEqual(appliedEntry?.after_value, finding.replacementValue)

    const reverted = await api(`/${historyId}/revert`, { method: 'POST' })
    assert.equal(reverted.remediation.status, 'reverted')
    appliedHistoryIds.delete(historyId)

    const { data: restored, error: restoredError } = await service
      .from('planning_time_slots')
      .select('course_id')
      .eq('id', targetId)
      .single()
    if (restoredError) throw restoredError
    assert.equal(restored.course_id, before.course_id)

    const revertedHistory = await api('/history?limit=100')
    const revertedEntry = revertedHistory.history.find(entry => entry.id === historyId)
    assert.equal(revertedEntry?.status, 'reverted')
    assert.ok(revertedEntry?.reverted_at)
    assert.ok(revertedEntry?.reverted_by)

    verified.push({
      slotId: targetId,
      candidateId,
      historyApplied: true,
      historyReverted: true,
      originalValueRestored: true
    })
  }

  console.log(JSON.stringify({
    environment: 'test',
    activeAcademicYear: activeYears[0].name,
    safeCourseProposalCount: safeCourseFindings.length,
    verified,
    productionTouched: false
  }, null, 2))
} finally {
  for (const historyId of [...appliedHistoryIds]) {
    await api(`/${historyId}/revert`, { method: 'POST' }).catch(() => {})
  }
  if (historyIds.length) {
    await service.from('si_planning_remediation_history').delete().in('id', historyIds)
  }
  await browser.auth.signOut().catch(() => {})
}
