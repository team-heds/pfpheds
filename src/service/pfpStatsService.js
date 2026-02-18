/**
 * Service de statistiques PFP - Places de stages par cohorte et canton
 * Fournit des données pour les KPI du dashboard PFP
 */

import { supabase } from '@/supabase'

/**
 * Récupère les statistiques des places par cohorte PFP
 * @returns {Promise<Object>} Statistiques par cohorte
 */
export async function getPfpCohortStats() {
  try {
    // Année courante pour le filtre - Teste avec 2025 si 2026 n'a pas de données
    const currentYear = '2026' // Change ici selon tes données (2024, 2025, 2026...)
    
    // Récupérer toutes les places avec les colonnes PFP1A et PFP1B
    const { data: places, error: placesError } = await supabase
      .from('places')
      .select('PlaceId, PFP1A, PFP1B, InstitutionId')
    
    if (placesError) {
      console.error('[pfpStatsService] Erreur places:', placesError)
      throw placesError
    }
    
    // Si pas de places, retourner des stats vides
    if (!places || places.length === 0) {
      console.warn('[pfpStatsService] Aucune place trouvée')
      return {
        PFP1A: { total: 0, assigned: 0, available: 0, byCantons: {}, topCantons: [] },
        PFP1B: { total: 0, assigned: 0, available: 0, byCantons: {}, topCantons: [] },
        global: { total: 0, byStatus: {} }
      }
    }
    
    // Récupérer toutes les institutions séparément
    const { data: institutions, error: instError } = await supabase
      .from('institutions')
      .select('InstitutionId, Name, Canton, Locality')
    
    if (instError) {
      console.error('[pfpStatsService] Erreur institutions:', instError)
      throw instError
    }
    
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
    places?.forEach((place, index) => {
      const institution = institutionsMap[place.InstitutionId]
      const canton = institution?.Canton || 'Non défini'
      
      // Traiter PFP1A
      if (place.PFP1A && place.PFP1A[currentYear]) {
        const count = parseInt(place.PFP1A[currentYear])
        
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
      if (place.PFP1B && place.PFP1B[currentYear]) {
        const count = parseInt(place.PFP1B[currentYear])
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
    ['PFP1A', 'PFP1B'].forEach(cohort => {
      stats[cohort].topCantons = Object.entries(stats[cohort].byCantons)
        .map(([canton, data]) => ({
          label: canton,
          value: data.total,
          assigned: data.assigned,
          available: data.available,
          color: getCantonColor(canton)
        }))
        .sort((a, b) => b.value - a.value)
    })
    
    return stats
    
  } catch (error) {
    console.error('❌ Erreur getPfpCohortStats:', error)
    return {
      PFP1A: { total: 0, assigned: 0, available: 0, byCantons: {}, topCantons: [] },
      PFP1B: { total: 0, assigned: 0, available: 0, byCantons: {}, topCantons: [] },
      global: { total: 0, byStatus: {} }
    }
  }
}

/**
 * Récupère les places détaillées par cohorte et canton
 * @param {string} cohort - 'PFP1A' ou 'PFP1B'
 * @param {string} canton - Canton spécifique (optionnel)
 * @returns {Promise<Array>} Liste des places
 */
export async function getPfpPlacesByCohortAndCanton(cohort, canton = null) {
  try {
    // TODO: Implémenter le filtrage par cohorte et canton avec la nouvelle structure
    // Pour l'instant, retourner un tableau vide
    return []
    
  } catch (error) {
    console.error('❌ Erreur getPfpPlacesByCohortAndCanton:', error)
    return []
  }
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
      .select('user_id, email, display_name, forname, family_name, pfp_cohort')
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
    
    return {
      PFP1A: {
        rate: stats.PFP1A.total > 0 
          ? Math.round((stats.PFP1A.assigned / stats.PFP1A.total) * 100) 
          : 0,
        assigned: stats.PFP1A.assigned,
        total: stats.PFP1A.total
      },
      PFP1B: {
        rate: stats.PFP1B.total > 0 
          ? Math.round((stats.PFP1B.assigned / stats.PFP1B.total) * 100) 
          : 0,
        assigned: stats.PFP1B.assigned,
        total: stats.PFP1B.total
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
