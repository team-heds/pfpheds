import { supabase } from '@/supabase'
import adminService from '@/service/adminService'
import gamificationAdminService from '@/service/gamificationAdminService'

async function countTable(table, filter = null) {
  try {
    let query = supabase.from(table).select('*', { count: 'exact', head: true })
    if (filter && Array.isArray(filter)) {
      for (const [col, op, val] of filter) query = query.filter(col, op, val)
    }
    const { count, error } = await query
    if (error) throw error
    return count || 0
  } catch (_) {
    return 0
  }
}

export async function fetchGeneralKpis({ router, roleStore }) {
  const [users, rolesList] = await Promise.all([
    countTable('user_profiles'),
    (async () => {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('role')
          .not('role', 'is', null)
        if (error) throw error
        return Array.from(new Set((data || []).map(r => r.role))).length
      } catch (_) {
        return 0
      }
    })()
  ])

  const routes = typeof router?.getRoutes === 'function' ? router.getRoutes().length : 0
  const permissions = Array.isArray(roleStore?.perms) ? roleStore.perms.length : 0

  return { users, roles: rolesList, routes, permissions }
}

export async function fetchPfpKpis() {
  // Heuristiques basées sur Supabase; fallback à 0 si tables absentes
  const etudiants = await (async () => {
    try {
      // Essayer plusieurs rôles potentiels
      const roles = ['student', 'etudiant', 'Student']
      let total = 0
      for (const r of roles) {
        total += await countTable('user_profiles', [['role', 'eq', r]])
      }
      return total
    } catch (_) { return 0 }
  })()
  const institutions = await countTable('institutions')
  const places = await countTable('places')
  const pfpEnCours = 0 // À brancher si table dédiée disponible
  return { etudiants, institutions, places, pfpEnCours }
}

export async function fetchAcademiqueKpis() {
  const enseignants = await (async () => {
    try {
      const roles = ['enseignant', 'teacher', 'Enseignant']
      let total = 0
      for (const r of roles) total += await countTable('user_profiles', [['role', 'eq', r]])
      return total
    } catch (_) { return 0 }
  })()
  const cours = await countTable('courses')
  const media = await countTable('media_assets')
  const modules = await countTable('modules')
  return { enseignants, cours, media, modules }
}

export async function fetchGamificationKpis() {
  try {
    const data = await gamificationAdminService.getGamificationStats()
    return {
      challenges: data.activeChallenges + (data.completedQuests ? 0 : 0), // total approx non dispo: garder actifs comme métrique clé
      challengesActive: data.activeChallenges || 0,
      quests: data.completedQuests || 0, // idem
      questsActive: 0, // non fourni; laisser 0
      badges: data.totalBadges || 0,
      badgesUnlocked: 0, // non fourni; laisser 0
      users: data.totalUsers || 0,
      usersActive: data.gamificationUsers || 0
    }
  } catch (_) {
    return { challenges: 0, challengesActive: 0, quests: 0, questsActive: 0, badges: 0, badgesUnlocked: 0, users: 0, usersActive: 0 }
  }
}
