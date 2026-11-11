import { supabase } from '@/supabase'

export const GAMIFICATION_HISTORY_PAGE_SIZE = 10

const ACTION_PRESENTATION = Object.freeze({
  LOGIN: { label: 'Connexion quotidienne', detail: 'Votre connexion du jour a été récompensée.', icon: 'pi pi-sign-in' },
  LOGIN_STREAK: { label: 'Série de connexions', detail: 'Un palier de jours de connexion consécutifs a été atteint.', icon: 'pi pi-bolt' },
  PROFILE_UPDATE: { label: 'Profil complété', detail: 'La mise à jour de votre profil a été récompensée.', icon: 'pi pi-user-edit' },
  POST: { label: 'Publication créée', detail: 'Une nouvelle publication a été récompensée.', icon: 'pi pi-send' },
  BADGE_UNLOCK: { label: 'Badge obtenu', detail: 'Un objectif de badge a été atteint.', icon: 'pi pi-shield' },
  QUEST_COMPLETE: { label: 'Quête terminée', detail: 'Toutes les étapes de la quête ont été accomplies.', icon: 'pi pi-compass' },
  CHALLENGE_COMPLETE: { label: 'Défi réussi', detail: 'L’objectif du défi a été atteint.', icon: 'pi pi-flag' },
  OPENING_BALANCE: { label: 'Solde initial repris', detail: 'Vos points existants ont été repris lors du passage à Supabase.', icon: 'pi pi-history' },
  DAILY_WHEEL: { label: 'Activité quotidienne', detail: 'Une activité quotidienne a été validée.', icon: 'pi pi-star' },
  QUIZ_COMPLETE: { label: 'Quiz réussi', detail: 'Un quiz a été validé.', icon: 'pi pi-check-circle' },
})

const SOURCE_TABLES = Object.freeze({
  badge: { table: 'badges', labelColumn: 'name', label: 'Badge' },
  quest: { table: 'quests', labelColumn: 'title', label: 'Quête' },
  challenge: { table: 'challenges', labelColumn: 'name', label: 'Défi' },
})

const clampPageSize = (value) => Math.min(25, Math.max(1, Number(value) || GAMIFICATION_HISTORY_PAGE_SIZE))

const loadSourceLabels = async (rows) => {
  const labels = new Map()

  await Promise.all(Object.entries(SOURCE_TABLES).map(async ([sourceType, config]) => {
    const ids = [...new Set(rows
      .filter((row) => row.source_type === sourceType && row.source_id)
      .map((row) => row.source_id))]
    if (!ids.length) return

    const { data, error } = await supabase
      .from(config.table)
      .select(`id,${config.labelColumn}`)
      .in('id', ids)

    if (error) return
    for (const item of data || []) {
      const name = String(item?.[config.labelColumn] || '').trim()
      if (name) labels.set(`${sourceType}:${item.id}`, { type: config.label, name })
    }
  }))

  return labels
}

export const presentGamificationHistoryItem = (row, sourceLabels = new Map()) => {
  const presentation = ACTION_PRESENTATION[String(row?.action || '').toUpperCase()] || {
    label: 'Progression gamification',
    detail: 'Une progression a été enregistrée sur votre profil.',
    icon: 'pi pi-sparkles',
  }
  const source = sourceLabels.get(`${row?.source_type}:${row?.source_id}`) || null

  return {
    id: row.id,
    label: presentation.label,
    detail: presentation.detail,
    icon: presentation.icon,
    points: Number(row.amount || 0),
    occurredAt: row.occurred_at,
    totalAfter: Number.isFinite(Number(row.total_xp_after)) ? Number(row.total_xp_after) : null,
    linkedObject: source,
  }
}

export const getGamificationHistory = async (userId, options = {}) => {
  if (!userId) throw new TypeError('Un utilisateur est requis pour charger son historique.')

  const page = Math.max(1, Number(options.page) || 1)
  const pageSize = clampPageSize(options.pageSize)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  const { data, error, count } = await supabase
    .from('xp_history')
    .select('id,amount,action,source_type,source_id,total_xp_after,occurred_at', { count: 'exact' })
    .eq('user_id', userId)
    .order('occurred_at', { ascending: false })
    .range(from, to)

  if (error) throw error

  const rows = data || []
  const sourceLabels = await loadSourceLabels(rows)
  const total = Number(count || 0)

  return {
    items: rows.map((row) => presentGamificationHistoryItem(row, sourceLabels)),
    page,
    pageSize,
    total,
    hasMore: to + 1 < total,
  }
}

export default { getGamificationHistory }
