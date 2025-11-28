/**
 * Dashboard Service - KPI avec vraies données Supabase
 * Migration vers dashboardSupabaseService enrichi
 * Date: 28/11/2025
 */

import dashboardSupabaseService from './dashboardSupabaseService'

/**
 * KPI GÉNÉRAUX - Délègue au service Supabase enrichi
 */
export async function fetchGeneralKpis(params = {}) {
  return await dashboardSupabaseService.fetchGeneralKpis()
}

/**
 * KPI PFP - Délègue au service Supabase enrichi
 */
export async function fetchPfpKpis() {
  return await dashboardSupabaseService.fetchPfpKpis()
}

/**
 * KPI ACADÉMIQUE - Délègue au service Supabase enrichi
 */
export async function fetchAcademiqueKpis() {
  return await dashboardSupabaseService.fetchAcademiqueKpis()
}

/**
 * KPI GAMIFICATION - Délègue au service Supabase enrichi
 */
export async function fetchGamificationKpis() {
  return await dashboardSupabaseService.fetchGamificationKpis()
}

/**
 * STATS TEMPS RÉEL - Widgets dashboard
 */
export async function fetchRealtimeStats() {
  return await dashboardSupabaseService.fetchRealtimeStats()
}

/**
 * STATS MAISONS HES - Classement détaillé
 */
export async function fetchHousesStats() {
  return await dashboardSupabaseService.fetchHousesStats()
}

/**
 * EXPORT COMPLET - Toutes les stats
 */
export async function fetchAllKpis() {
  return await dashboardSupabaseService.fetchAllKpis()
}

// Export par défaut
export default {
  fetchGeneralKpis,
  fetchPfpKpis,
  fetchAcademiqueKpis,
  fetchGamificationKpis,
  fetchRealtimeStats,
  fetchHousesStats,
  fetchAllKpis
}
