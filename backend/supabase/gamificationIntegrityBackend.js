const express = require('express')

const TABLES = Object.freeze({
  profiles: 'user_profiles',
  gamification: 'gamification_data',
  houses: 'houses',
  badges: 'user_badges',
  quests: 'quests',
  steps: 'quest_steps',
  questProgress: 'user_quest_progress',
  xp: 'xp_history'
})

const MAX_ROWS = 10000
const EXPIRY_RULE = 'Les historiques expirés sont conservés ; aucune purge automatique.'

function groupBy(rows, keyFn) {
  const groups = new Map()
  for (const row of rows || []) {
    const key = keyFn(row)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(row)
  }
  return groups
}

function buildIntegrityReport(data) {
  const profiles = data.profiles || []
  const gamification = data.gamification || []
  const houses = data.houses || []
  const badges = data.badges || []
  const quests = data.quests || []
  const steps = data.steps || []
  const questProgress = data.questProgress || []
  const xp = data.xp || []
  const profileIds = new Set(profiles.map((row) => row.user_id))
  const gamificationIds = new Set(gamification.map((row) => row.user_id))
  const houseIds = new Set(houses.map((row) => row.id))
  const badgeIds = new Set((data.badgeDefinitions || []).map((row) => row.id))
  const questIds = new Set(quests.map((row) => row.id))
  const stepIdsByQuest = groupBy(steps, (row) => row.quest_id)
  const badgeGroups = groupBy(badges, (row) => `${row.user_id}:${row.badge_id}`)
  const xpByUser = groupBy(xp, (row) => row.user_id)
  const historyTotals = new Map()

  for (const [userId, rows] of xpByUser) {
    historyTotals.set(userId, rows.reduce((sum, row) => sum + Number(row.amount || 0), 0))
  }

  const issues = []
  const add = (code, rows, blocking = true) => {
    for (const row of rows) issues.push({ code, userId: row.user_id || null, recordId: row.id || null, blocking })
  }

  add('orphan_profile', profiles.filter((row) => !gamificationIds.has(row.user_id)))
  add('orphan_gamification', gamification.filter((row) => !profileIds.has(row.user_id)))
  add('missing_house', [
    ...profiles.filter((row) => row.house_id && !houseIds.has(row.house_id)),
    ...gamification.filter((row) => row.house_id && !houseIds.has(row.house_id))
  ])
  add('duplicate_badge', [...badgeGroups.values()].filter((rows) => rows.length > 1).flat())
  add('unknown_badge', badges.filter((row) => !badgeIds.has(row.badge_id)))
  add('unknown_quest', questProgress.filter((row) => !questIds.has(row.quest_id)))
  add('unknown_step', questProgress.filter((row) => {
    if (!Number.isInteger(Number(row.current_step)) || Number(row.current_step) <= 0) return false
    const questSteps = stepIdsByQuest.get(row.quest_id) || []
    return Number(row.current_step) > questSteps.length
  }))

  const gamificationByUser = new Map(gamification.map((row) => [row.user_id, row]))
  for (const row of gamification) {
    const sum = historyTotals.get(row.user_id)
    if (sum !== undefined && Number(row.total_xp || 0) !== sum) {
      issues.push({ code: 'xp_mismatch', userId: row.user_id, recordId: row.id || null, blocking: true, expected: sum, actual: Number(row.total_xp || 0) })
    }
  }
  for (const row of xp) {
    if (row.user_id && !gamificationByUser.has(row.user_id)) {
      issues.push({ code: 'xp_without_gamification', userId: row.user_id, recordId: row.id || null, blocking: true })
    }
  }

  const counts = issues.reduce((result, issue) => {
    result[issue.code] = (result[issue.code] || 0) + 1
    return result
  }, {})

  return {
    generatedAt: new Date().toISOString(),
    expiryRule: EXPIRY_RULE,
    blockingCount: issues.filter((issue) => issue.blocking).length,
    counts,
    issues
  }
}

async function fetchAll(client, table, columns) {
  const rows = []
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await client.from(table).select(columns).range(offset, offset + 999)
    if (error) throw error
    const page = data || []
    if (rows.length + page.length > MAX_ROWS) {
      const limitError = new Error(`Limite de diagnostic atteinte pour ${table}; rapport incomplet.`)
      limitError.code = 'DIAGNOSTIC_LIMIT'
      throw limitError
    }
    rows.push(...page)
    if (page.length < 1000) return rows
  }
}

async function loadIntegrityData(client) {
  const warnings = []
  const optionalFetch = async (table, columns) => {
    try {
      return await fetchAll(client, table, columns)
    } catch (error) {
      if (['42P01', 'PGRST205'].includes(error.code)) {
        warnings.push(`Table indisponible: ${table}`)
        return []
      }
      throw error
    }
  }
  const [profiles, gamification, houses, badges, badgeDefinitions, quests, steps, questProgress, xp] = await Promise.all([
    fetchAll(client, TABLES.profiles, 'user_id,house_id'),
    fetchAll(client, TABLES.gamification, 'id,user_id,total_xp,house_id'),
    fetchAll(client, TABLES.houses, 'id'),
    fetchAll(client, TABLES.badges, 'user_id,badge_id,earned_at'),
    fetchAll(client, 'badges', 'id'),
    optionalFetch(TABLES.quests, 'id,end_date,status'),
    optionalFetch(TABLES.steps, 'id,quest_id,step_order'),
    optionalFetch(TABLES.questProgress, 'id,user_id,quest_id,status,current_step,updated_at'),
    optionalFetch(TABLES.xp, 'id,user_id,amount,created_at')
  ])
  return { profiles, gamification, houses, badges, badgeDefinitions, quests, steps, questProgress, xp, warnings }
}

function createGamificationIntegrityRouter(options = {}) {
  const router = express.Router()
  const client = options.client
  const now = options.now || (() => new Date())
  const plans = new Map()
  if (!client) throw new Error('Un client Supabase serveur est obligatoire.')

  router.get('/report', async (_req, res) => {
    try {
      const data = await loadIntegrityData(client)
      const report = buildIntegrityReport(data)
      report.generatedAt = now().toISOString()
      report.warnings = data.warnings
      return res.json(report)
    } catch (error) {
      if (options.logger?.error) {
        options.logger.error('[GAMIFICATION_INTEGRITY] Report failed', { code: error.code || 'UNKNOWN', message: error.message })
      }
      return res.status(error.code === 'DIAGNOSTIC_LIMIT' ? 413 : 503).json({ error: 'Impossible de produire le diagnostic gamification.', code: error.code || 'DIAGNOSTIC_FAILED' })
    }
  })

  router.post('/plan', async (req, res) => {
    const selected = Array.isArray(req.body?.issueIds) ? req.body.issueIds.map(String) : []
    try {
      const data = await loadIntegrityData(client)
      const report = buildIntegrityReport(data)
      const chosen = report.issues.filter((issue) => selected.includes(`${issue.code}:${issue.userId || ''}:${issue.recordId || ''}`))
      const planId = require('crypto').randomUUID()
      const plan = { planId, createdAt: now().toISOString(), expiresAt: now().getTime() + 15 * 60 * 1000, issueCount: chosen.length, resolved: false }
      plans.set(planId, plan)
      return res.json({ ...plan, simulated: true, corrections: [], message: 'Aucune correction n’a été exécutée. Les données sont conservées.' })
    } catch (_error) {
      return res.status(503).json({ error: 'Simulation impossible.' })
    }
  })

  router.post('/plan/:planId/confirm', (_req, res) => {
    return res.status(409).json({ error: 'Les corrections automatiques sont désactivées : sauvegarde et validation humaine requises.' })
  })

  return router
}

module.exports = { buildIntegrityReport, createGamificationIntegrityRouter, loadIntegrityData }
