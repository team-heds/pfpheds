const { assertNoPersonalData } = require('./adminDashboardContract')
const { filterStudentProfiles } = require('../security/userAudience')
const { resolveProfileClass } = require('./adminDashboardFilters')
const { countRows, selectAllRows } = require('./adminDashboardStatsService')

const DROP_THRESHOLD_PERCENT = 30
const RISE_THRESHOLD_PERCENT = 50
const MAX_ALERT_KEY_LENGTH = 120

const METRIC_LABELS = Object.freeze({
  'general.users': 'Utilisateurs',
  'general.roles': 'Rôles',
  'general.permissions': 'Permissions',
  'general.routes': 'Routes',
  'pfp.students': 'Étudiants PFP',
  'pfp.institutions': 'Institutions',
  'pfp.places': 'Places',
  'pfp.pfpInProgress': 'PFP en cours',
  'academic.teachers': 'Enseignants',
  'academic.courses': 'Cours',
  'academic.media': 'Médias',
  'academic.modules': 'Modules',
  'gamification.activeChallenges': 'Défis actifs',
  'gamification.completedQuests': 'Quêtes complétées',
  'gamification.badges': 'Badges obtenus',
  'gamification.activeUsers': 'Utilisateurs actifs'
})

const DOMAIN_LINKS = Object.freeze({
  general: '/admin',
  pfp: '/admin/dashboard-pfp',
  academic: '/admin/dashboard-academique',
  gamification: '/admin/dashboard-gamification'
})

const DATA_QUALITY_RULES = Object.freeze([
  Object.freeze({
    key: 'quality.students_without_class',
    domain: 'pfp',
    kpiId: 'pfp.students',
    title: 'Étudiants sans classe',
    message: (value) => `${value} étudiant(s) actif(s) sans classe : ils échappent aux filtres par classe.`,
    link: '/admin/formation-pratique/etudiants',
    actionLabel: 'Voir les étudiants',
    async load(client) {
      const profiles = await selectAllRows(client, 'user_profiles', 'role,permissions,is_active,classe')
      return filterStudentProfiles(profiles).filter((profile) => !resolveProfileClass(profile)).length
    }
  }),
  Object.freeze({
    key: 'quality.pfp_draft_results',
    domain: 'pfp',
    kpiId: 'pfp.pfpInProgress',
    title: 'Résultats PFP en brouillon',
    message: (value) => `${value} résultat(s) PFP en brouillon, non publiés.`,
    link: '/admin/formation-pratique/validation-places',
    actionLabel: 'Ouvrir la validation',
    load: (client) =>
      countRows(client, 'student_result_vote', 'id', (query) => query.eq('status', 'draft'))
  }),
  Object.freeze({
    key: 'quality.modules_without_track',
    domain: 'academic',
    kpiId: 'academic.modules',
    title: 'Modules sans filière',
    message: (value) => `${value} module(s) sans filière : ils disparaissent du filtre SI/PHY.`,
    link: '/admin/modules',
    actionLabel: 'Voir les modules',
    load: (client) =>
      countRows(client, 'modules', 'id', (query) => query.is('track_id', null))
  }),
  Object.freeze({
    key: 'quality.modules_without_responsible',
    domain: 'academic',
    kpiId: 'academic.modules',
    title: 'Modules sans responsable',
    message: (value) => `${value} module(s) sans responsable de module.`,
    link: '/admin/modules',
    actionLabel: 'Voir les modules',
    load: (client) =>
      countRows(client, 'modules', 'id', (query) => query.is('responsable_email', null))
  })
])

function isMissingRelation(error) {
  return error?.code === '42P01' || error?.code === 'PGRST205'
}

function variationAlerts(stats) {
  const alerts = []
  for (const [domain, content] of Object.entries(stats.domains)) {
    for (const [metric, entry] of Object.entries(content.metrics)) {
      const kpiId = `${domain}.${metric}`
      const label = METRIC_LABELS[kpiId] || kpiId
      const base = { kpiId, link: DOMAIN_LINKS[domain], actionLabel: 'Ouvrir le dashboard' }

      if (entry.status === 'error') {
        alerts.push({
          ...base,
          key: `source.${kpiId}`,
          type: 'source',
          severity: 'error',
          title: 'Source de données en erreur',
          message: `${label} n'a pas pu être calculé.`,
          value: null,
          previousValue: null
        })
        continue
      }

      const comparison = entry.comparison
      if (comparison?.status !== 'ok' || !Number.isFinite(comparison.percentChange)) continue
      const percent = comparison.percentChange
      if (percent <= -DROP_THRESHOLD_PERCENT) {
        alerts.push({
          ...base,
          key: `drop.${kpiId}`,
          type: 'critical',
          severity: 'error',
          title: 'Chute importante',
          message: `${label} recule de ${Math.abs(percent)} % par rapport à la période précédente.`,
          value: entry.value,
          previousValue: comparison.value
        })
      } else if (percent >= RISE_THRESHOLD_PERCENT) {
        alerts.push({
          ...base,
          key: `rise.${kpiId}`,
          type: 'warning',
          severity: 'warn',
          title: 'Hausse inhabituelle',
          message: `${label} progresse de ${percent} % par rapport à la période précédente.`,
          value: entry.value,
          previousValue: comparison.value
        })
      }
    }
  }
  return alerts
}

async function qualityAlerts(client, domains, onRuleError) {
  const rules = DATA_QUALITY_RULES.filter((rule) => domains.includes(rule.domain))
  const results = await Promise.all(
    rules.map(async (rule) => {
      try {
        const value = await rule.load(client)
        if (value <= 0) return null
        return {
          key: rule.key,
          type: 'quality',
          severity: 'warn',
          kpiId: rule.kpiId,
          title: rule.title,
          message: rule.message(value),
          value,
          previousValue: null,
          link: rule.link,
          actionLabel: rule.actionLabel
        }
      } catch (error) {
        onRuleError?.({ key: rule.key, domain: rule.domain, source: 'alert-rule', error })
        return {
          key: `source.${rule.key}`,
          type: 'source',
          severity: 'error',
          kpiId: rule.kpiId,
          title: 'Contrôle indisponible',
          message: `Le contrôle « ${rule.title} » n'a pas pu être exécuté.`,
          value: null,
          previousValue: null,
          link: DOMAIN_LINKS[rule.domain],
          actionLabel: 'Ouvrir le dashboard'
        }
      }
    })
  )
  return results.filter(Boolean)
}

async function loadAlertStates(client) {
  const { data, error } = await client
    .from('admin_alert_states')
    .select('alert_key,resolved_value,resolved_at')
  if (error) {
    if (isMissingRelation(error)) return { available: false, states: new Map() }
    throw error
  }
  return {
    available: true,
    states: new Map((data || []).map((row) => [row.alert_key, row]))
  }
}

function sameValue(left, right) {
  if (left === null || left === undefined) return right === null || right === undefined
  return Number(left) === Number(right)
}

async function loadAdminAlerts({ client, statsService, domains, periodKey, onRuleError }) {
  const stats = await statsService.loadStats(domains, { key: periodKey })
  const [variation, quality, stateResult] = await Promise.all([
    Promise.resolve(variationAlerts(stats)),
    qualityAlerts(client, domains, onRuleError),
    loadAlertStates(client)
  ])

  // Une résolution ne vaut que pour la valeur constatée : si elle change, l'alerte revient.
  const alerts = [...variation, ...quality].map((alert) => {
    const state = stateResult.states.get(alert.key)
    const resolved = Boolean(state) && sameValue(state.resolved_value, alert.value)
    return Object.freeze({
      ...alert,
      kpiLabel: METRIC_LABELS[alert.kpiId] || alert.kpiId,
      timestamp: stats.asOf,
      resolved,
      resolvedAt: resolved ? state.resolved_at : null
    })
  })

  const active = alerts.filter((alert) => !alert.resolved)
  const response = {
    version: '1',
    asOf: stats.asOf,
    period: stats.period,
    canPersistResolution: stateResult.available,
    stats: {
      total: active.length,
      critical: active.filter((alert) => alert.severity === 'error').length,
      warning: active.filter((alert) => alert.severity === 'warn').length,
      info: active.filter((alert) => alert.severity === 'info').length,
      resolved: alerts.length - active.length
    },
    alerts
  }
  assertNoPersonalData(response)
  return Object.freeze(response)
}

async function resolveAdminAlert({ client, statsService, domains, periodKey, alertKey, userId }) {
  if (!alertKey || alertKey.length > MAX_ALERT_KEY_LENGTH) {
    const error = new Error('Alerte invalide.')
    error.status = 400
    throw error
  }
  const current = await loadAdminAlerts({ client, statsService, domains, periodKey })
  const alert = current.alerts.find((entry) => entry.key === alertKey)
  if (!alert) {
    const error = new Error('Cette alerte n’est plus active.')
    error.status = 404
    throw error
  }
  const { error } = await client.from('admin_alert_states').upsert(
    {
      alert_key: alertKey,
      resolved_value: alert.value,
      resolved_at: new Date().toISOString(),
      resolved_by: userId || null
    },
    { onConflict: 'alert_key' }
  )
  if (error) {
    if (isMissingRelation(error)) {
      const unavailable = new Error('La résolution des alertes n’est pas encore activée.')
      unavailable.status = 503
      throw unavailable
    }
    throw error
  }
  return loadAdminAlerts({ client, statsService, domains, periodKey })
}

module.exports = {
  DATA_QUALITY_RULES,
  DROP_THRESHOLD_PERCENT,
  RISE_THRESHOLD_PERCENT,
  loadAdminAlerts,
  resolveAdminAlert,
  variationAlerts
}
