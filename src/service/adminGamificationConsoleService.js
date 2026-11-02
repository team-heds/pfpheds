import { supabase } from '@/supabase'

export const GAMIFICATION_ACTION_LABELS = Object.freeze({
  LOGIN: 'Connexion quotidienne',
  POST: 'Publication créée',
  PROFILE_UPDATE: 'Profil mis à jour',
})

export const GAMIFICATION_WINDOW_LABELS = Object.freeze({
  event: 'par événement',
  day: 'par jour',
  week: 'par semaine',
})

export const GAMIFICATION_REJECTION_LABELS = Object.freeze({
  system_disabled: 'Récompenses désactivées',
  audience_restricted: 'Compte hors audience pilote',
  rule_unavailable: 'Règle indisponible',
  unsupported_action: 'Action non prise en charge',
  verification_failed: 'Action non vérifiée',
  duplicate_event: 'Événement déjà comptabilisé',
  cap_reached: 'Plafond atteint',
  award_rejected: 'Attribution refusée',
})

export function normalizeGamificationRollout(payload) {
  if (
    !payload || typeof payload.rewards_enabled !== 'boolean' ||
    !['allowlist', 'all'].includes(payload.audience_mode) ||
    payload.contains_personal_data !== false || payload.write_performed !== false
  ) throw new TypeError('Le contrat de déploiement progressif est invalide.')

  return {
    rewardsEnabled: payload.rewards_enabled,
    audienceMode: payload.audience_mode,
    allowlistedUsers: finiteCount(payload.allowlisted_users, 'Les comptes autorisés'),
    eligibleUsers: finiteCount(payload.eligible_users, 'Les comptes éligibles'),
    updatedAt: payload.updated_at || null,
  }
}

const CONTENT_STATUSES = ['total', 'draft', 'scheduled', 'active', 'completed', 'archived']

function finiteCount(value, label) {
  const count = Number(value)
  if (!Number.isFinite(count) || count < 0) throw new TypeError(`${label} est invalide.`)
  return count
}

function normalizeLifecycleCounts(value, label) {
  if (!value || typeof value !== 'object') throw new TypeError(`${label} est invalide.`)
  return Object.fromEntries(CONTENT_STATUSES.map((key) => [key, finiteCount(value[key] ?? 0, label)]))
}

export function normalizeGamificationAdminConsole(payload) {
  if (
    !payload || payload.version !== '1' || !payload.as_of ||
    payload.timezone !== 'Europe/Zurich' || payload.contains_personal_data !== false ||
    payload.write_performed !== false || !Array.isArray(payload.rules)
  ) throw new TypeError('Le contrat de la console gamification est invalide.')

  const rules = payload.rules.map((rule) => {
    if (!rule?.action_code || !rule?.rule_version || !['event', 'day', 'week'].includes(rule.window_kind)) {
      throw new TypeError('Une règle de gamification est invalide.')
    }
    return {
      actionCode: rule.action_code,
      label: GAMIFICATION_ACTION_LABELS[rule.action_code] || 'Action configurée',
      version: rule.rule_version,
      xpAmount: finiteCount(rule.xp_amount, 'Le nombre de points'),
      windowKind: rule.window_kind,
      windowLabel: GAMIFICATION_WINDOW_LABELS[rule.window_kind],
      maxAwards: rule.max_awards_per_window == null ? null : finiteCount(rule.max_awards_per_window, 'Le plafond'),
      active: rule.is_active === true,
      effectiveFrom: rule.effective_from || null,
    }
  })

  const activity = payload.activity || {}
  if (!['ok', 'unavailable'].includes(activity.rejected_events_status)) {
    throw new TypeError('Le statut des événements refusés est invalide.')
  }
  if (activity.rejected_events_status === 'unavailable' && activity.rejected_events !== null) {
    throw new TypeError('Une mesure indisponible ne peut pas exposer de valeur.')
  }
  if (activity.rejected_events_status === 'ok' && !Number.isFinite(Number(activity.rejected_events))) {
    throw new TypeError('Le nombre d’événements refusés est invalide.')
  }

  const rejectionBreakdown = Object.entries(activity.rejected_events_by_reason || {})
    .map(([reason, count]) => ({
      reason,
      label: GAMIFICATION_REJECTION_LABELS[reason] || 'Autre refus contrôlé',
      count: finiteCount(count, 'Le détail des événements refusés'),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'fr-CH'))

  return {
    version: payload.version,
    asOf: payload.as_of,
    timezone: payload.timezone,
    rules,
    content: {
      quests: normalizeLifecycleCounts(payload.content?.quests, 'Les états des quêtes'),
      challenges: normalizeLifecycleCounts(payload.content?.challenges, 'Les états des défis'),
      badges: {
        total: finiteCount(payload.content?.badges?.total, 'Le total des badges'),
        active: finiteCount(payload.content?.badges?.active, 'Les badges actifs'),
        inactive: finiteCount(payload.content?.badges?.inactive, 'Les badges inactifs'),
      },
    },
    activity: {
      activeUsers30d: finiteCount(activity.active_users_30d, 'Les utilisateurs actifs'),
      awards30d: finiteCount(activity.awards_30d, 'Les attributions'),
      xpAwarded30d: finiteCount(activity.xp_awarded_30d, 'Les points attribués'),
      latestAwardAt: activity.latest_award_at || null,
      lifecycleTransitions30d: finiteCount(activity.lifecycle_transitions_30d, 'Les transitions'),
      rejectedEventsStatus: activity.rejected_events_status,
      rejectedEventsReason: activity.rejected_events_reason,
      rejectedEvents: activity.rejected_events_status === 'ok'
        ? finiteCount(activity.rejected_events, 'Les événements refusés')
        : null,
      rejectedEventsLatestAt: activity.rejected_events_latest_at || null,
      rejectionBreakdown,
    },
    quality: {
      blockingIssueCount: finiteCount(payload.quality?.blocking_issue_count, 'Les anomalies bloquantes'),
      issues: payload.quality?.issues || {},
      warnings: payload.quality?.warnings || {},
    },
  }
}

export async function fetchGamificationAdminConsole() {
  const { data, error } = await supabase.rpc('preview_gamification_admin_console')
  if (error) throw error
  return normalizeGamificationAdminConsole(data)
}

export async function fetchGamificationRollout() {
  const { data, error } = await supabase.rpc('preview_gamification_rollout')
  if (error) throw error
  return normalizeGamificationRollout(data)
}
