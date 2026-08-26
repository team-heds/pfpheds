/**
 * Service de statistiques PFP - Places de stages par cohorte et canton
 * Fournit des données pour les KPI du dashboard PFP
 */

import { supabase } from '@/supabase'
import { SUPABASE_SELECTS } from '@/service/supabaseContracts'

const PFP_STATS_CACHE_TTL_MS = 30_000
let pfpStatsCache = null
let pfpStatsRequest = null

function createEmptyCohortStats() {
  return { total: 0, assigned: 0, available: 0, byCantons: {}, topCantons: [] }
}

export function createEmptyPfpStats(total = 0) {
  return {
    PFP1A: createEmptyCohortStats(),
    PFP1B: createEmptyCohortStats(),
    global: { total, byStatus: {} }
  }
}

function parseCapacity(rawCapacity, year) {
  if (!rawCapacity) return 0
  let capacity = rawCapacity
  if (typeof capacity === 'string') {
    try {
      capacity = JSON.parse(capacity)
    } catch {
      return 0
    }
  }
  const count = Number.parseInt(capacity?.[year], 10)
  return Number.isFinite(count) && count > 0 ? count : 0
}

/**
 * Récupère les statistiques des places par cohorte PFP
 * @returns {Promise<Object>} Statistiques par cohorte
 */
async function loadPfpCohortStats() {
  try {
    // Année courante pour le filtre - Teste avec 2025 si 2026 n'a pas de données
    const currentYear = '2026' // Change ici selon tes données (2024, 2025, 2026...)
    
    // Récupérer toutes les places avec les colonnes PFP1A et PFP1B
    const { data: placesData, error: placesError } = await supabase
      .from('places')
      .select(SUPABASE_SELECTS.pfpStatsPlaces)

    if (placesError) {
      throw new Error(`Impossible de charger les places PFP: ${placesError.message}`)
    }
    const places = placesData || []
    
    // Si pas de places, retourner des stats vides
    if (!places || places.length === 0) {
      console.warn('[pfpStatsService] Aucune place trouvée')
      return createEmptyPfpStats()
    }
    
    // Récupérer toutes les institutions séparément
    const { data: institutionsData, error: instError } = await supabase
      .from('institutions')
      .select(SUPABASE_SELECTS.pfpStatsInstitutions)
    if (instError) throw new Error(`Impossible de charger les institutions PFP: ${instError.message}`)
    const institutions = institutionsData || []
    
    // Créer un map des institutions pour accès rapide
    const institutionsMap = {}
    institutions?.forEach(inst => {
      institutionsMap[inst.InstitutionId] = inst
    })
    
    // Statistiques globales
    const stats = {
      PFP1A: {
        total: 0,
        assigned: 0,
        available: 0,
        byCantons: {},
        topCantons: []
      },
      PFP1B: {
        total: 0,
        assigned: 0,
        available: 0,
        byCantons: {},
        topCantons: []
      },
      global: {
        total: places?.length || 0,
        byStatus: {}
      }
    }
    
    // Traiter chaque place
    places?.forEach((place) => {
      const institution = institutionsMap[place.InstitutionId]
      const canton = institution?.Canton || 'Non défini'
      
      // Traiter PFP1A
      const pfp1aCapacity = parseCapacity(place.PFP1A, currentYear)
      if (pfp1aCapacity) {
        const count = pfp1aCapacity
        
        if (!isNaN(count) && count >= 1) {
          // Total par cohorte (multiplié par le nombre de places)
          stats.PFP1A.total += count
          // Toutes les places sont disponibles (pas de système d'assignation pour l'instant)
          stats.PFP1A.available += count
          
          // Par canton
          if (!stats.PFP1A.byCantons[canton]) {
            stats.PFP1A.byCantons[canton] = {
              total: 0,
              assigned: 0,
              available: 0
            }
          }
          
          stats.PFP1A.byCantons[canton].total += count
          stats.PFP1A.byCantons[canton].available += count
        }
      }
      
      // Traiter PFP1B
      const pfp1bCapacity = parseCapacity(place.PFP1B, currentYear)
      if (pfp1bCapacity) {
        const count = pfp1bCapacity
        if (!isNaN(count) && count >= 1) {
          // Total par cohorte (multiplié par le nombre de places)
          stats.PFP1B.total += count
          // Toutes les places sont disponibles (pas de système d'assignation pour l'instant)
          stats.PFP1B.available += count
          
          // Par canton
          if (!stats.PFP1B.byCantons[canton]) {
            stats.PFP1B.byCantons[canton] = {
              total: 0,
              assigned: 0,
              available: 0
            }
          }
          
          stats.PFP1B.byCantons[canton].total += count
          stats.PFP1B.byCantons[canton].available += count
        }
      }
    })
    
    // Générer topCantons pour chaque cohorte (tri décroissant)
    for (const cohort of ['PFP1A', 'PFP1B']) {
      const cohortStats = stats[cohort] || (stats[cohort] = createEmptyCohortStats())
      cohortStats.topCantons = Object.entries(cohortStats.byCantons)
        .map(([canton, data]) => ({
          label: canton,
          value: data.total,
          assigned: data.assigned,
          available: data.available,
          color: getCantonColor(canton)
        }))
        .sort((a, b) => b.value - a.value)
    }
    
    return stats
    
  } catch (error) {
    console.error('❌ Erreur getPfpCohortStats:', error)
    throw error
  }
}

export function clearPfpCohortStatsCache() {
  pfpStatsCache = null
  pfpStatsRequest = null
}

export async function getPfpCohortStats({ force = false } = {}) {
  if (!force && pfpStatsCache && Date.now() - pfpStatsCache.cachedAt < PFP_STATS_CACHE_TTL_MS) {
    return pfpStatsCache.data
  }
  if (pfpStatsRequest) return pfpStatsRequest

  pfpStatsRequest = loadPfpCohortStats()
    .then((data) => {
      pfpStatsCache = { cachedAt: Date.now(), data }
      return data
    })
    .finally(() => {
      pfpStatsRequest = null
    })
  return pfpStatsRequest
}

/**
 * Récupère les places détaillées par cohorte et canton
 * @param {string} cohort - 'PFP1A' ou 'PFP1B'
 * @param {string} canton - Canton spécifique (optionnel)
 * @returns {Promise<Array>} Liste des places
 */
export async function getPfpPlacesByCohortAndCanton(cohort, canton = null) {
  void cohort
  void canton
  return []
}

/**
 * Récupère les étudiants par cohorte PFP
 * @param {string} cohort - 'PFP1A' ou 'PFP1B'
 * @returns {Promise<Array>} Liste des étudiants
 */
export async function getStudentsByCohort(cohort) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select(SUPABASE_SELECTS.pfpStudents)
      .eq('pfp_cohort', cohort)
      .order('family_name')
    
    if (error) throw error
    
    return data || []
    
  } catch (error) {
    console.error('❌ Erreur getStudentsByCohort:', error)
    return []
  }
}

/**
 * Récupère le taux d'attribution des places par cohorte
 * @returns {Promise<Object>} Taux d'attribution
 */
export async function getPfpAssignmentRate() {
  try {
    const stats = await getPfpCohortStats()
    const pfp1a = stats?.PFP1A || createEmptyCohortStats()
    const pfp1b = stats?.PFP1B || createEmptyCohortStats()
    
    return {
      PFP1A: {
        rate: pfp1a.total > 0
          ? Math.round((pfp1a.assigned / pfp1a.total) * 100)
          : 0,
        assigned: pfp1a.assigned,
        total: pfp1a.total
      },
      PFP1B: {
        rate: pfp1b.total > 0
          ? Math.round((pfp1b.assigned / pfp1b.total) * 100)
          : 0,
        assigned: pfp1b.assigned,
        total: pfp1b.total
      }
    }
  } catch (error) {
    console.error('❌ Erreur getPfpAssignmentRate:', error)
    return {
      PFP1A: { rate: 0, assigned: 0, total: 0 },
      PFP1B: { rate: 0, assigned: 0, total: 0 }
    }
  }
}

/**
 * Couleurs des cantons suisses pour les graphiques
 */
function getCantonColor(canton) {
  const colors = {
    'VD': '#0ea5e9',
    'FR': '#3b82f6',
    'BE': '#8b5cf6',
    'NE': '#10b981',
    'GE': '#f59e0b',
    'VS': '#ec4899',
    'JU': '#14b8a6',
    'AG': '#f97316',
    'ZH': '#6366f1',
    'LU': '#a855f7',
    'TI': '#22c55e',
    'SG': '#ef4444',
    'GR': '#06b6d4',
    'BL': '#8b5cf6',
    'BS': '#d946ef',
    'SO': '#84cc16',
    'SH': '#f43f5e',
    'TG': '#0891b2',
    'ZG': '#7c3aed',
    'SZ': '#059669',
    'OW': '#dc2626',
    'NW': '#ea580c',
    'GL': '#65a30d',
    'UR': '#0284c7',
    'AI': '#c026d3',
    'AR': '#16a34a',
    'Non défini': '#9ca3af'
  }
  
  return colors[canton] || '#6b7280'
}

export default {
  getPfpCohortStats,
  getPfpPlacesByCohortAndCanton,
  getStudentsByCohort,
  getPfpAssignmentRate
}
