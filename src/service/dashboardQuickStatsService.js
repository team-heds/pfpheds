/**
 * Service pour les statistiques rapides du dashboard
 * Utilise Supabase au lieu de Firebase
 */

import { supabase } from '@/supabase'

/**
 * Compte les éléments d'une table avec filtre optionnel
 */
async function countTable(table, filter = null) {
  try {
    let query = supabase.from(table).select('*', { count: 'exact', head: true })
    
    if (filter && Array.isArray(filter)) {
      for (const [col, op, val] of filter) {
        query = query.filter(col, op, val)
      }
    }
    
    const { count, error } = await query
    if (error) throw error
    return count || 0
  } catch (error) {
    console.error(`Error counting ${table}:`, error)
    return 0
  }
}

/**
 * Récupère toutes les stats rapides en une seule fois
 */
export async function fetchQuickStats() {
  try {
    const [places, institutions, students, formateurs] = await Promise.all([
      // Places de stages
      countTable('places'),
      
      // Institutions partenaires
      countTable('institutions'),
      
      // Étudiants (essayer plusieurs noms de tables possibles)
      (async () => {
        // Essayer 'students' puis 'user_profiles' avec filtre
        let count = await countTable('students')
        if (count === 0) {
          count = await countTable('user_profiles', [['role', 'eq', 'student']])
        }
        return count
      })(),
      
      // Praticiens formateurs
      (async () => {
        let count = await countTable('praticien_formateurs')
        if (count === 0) {
          count = await countTable('user_profiles', [['role', 'eq', 'formateur']])
        }
        return count
      })()
    ])

    return {
      places,
      institutions,
      students,
      formateurs,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Error fetching quick stats:', error)
    return {
      places: 0,
      institutions: 0,
      students: 0,
      formateurs: 0,
      error: error.message
    }
  }
}

/**
 * Récupère les stats avec abonnement temps réel (si disponible)
 */
export function subscribeToQuickStats(callback) {
  // Supabase Realtime pour les mises à jour
  const channels = []
  
  // Places
  const placesChannel = supabase
    .channel('places-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'places' },
      () => {
        fetchQuickStats().then(callback)
      }
    )
    .subscribe()
  channels.push(placesChannel)
  
  // Institutions
  const institutionsChannel = supabase
    .channel('institutions-changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'institutions' },
      () => {
        fetchQuickStats().then(callback)
      }
    )
    .subscribe()
  channels.push(institutionsChannel)
  
  // Retourner fonction de nettoyage
  return () => {
    channels.forEach(channel => {
      supabase.removeChannel(channel)
    })
  }
}

/**
 * Récupère les détails d'une table spécifique
 */
export async function fetchTableDetails(tableName) {
  try {
    const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(100)
    
    if (error) throw error
    
    return {
      count,
      data: data || [],
      table: tableName
    }
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error)
    return {
      count: 0,
      data: [],
      error: error.message
    }
  }
}

/**
 * Récupère les stats avec tendances (comparaison période)
 */
export async function fetchQuickStatsWithTrends(days = 7) {
  try {
    const now = new Date()
    const previousDate = new Date()
    previousDate.setDate(previousDate.getDate() - days)
    
    const [current, previous] = await Promise.all([
      fetchQuickStats(),
      // Stats période précédente (si on a des timestamps)
      fetchQuickStats() // À améliorer avec vraie comparaison
    ])
    
    // Calculer les tendances
    const trends = {}
    for (const key in current) {
      if (typeof current[key] === 'number' && typeof previous[key] === 'number') {
        const diff = current[key] - previous[key]
        const percent = previous[key] > 0 ? ((diff / previous[key]) * 100).toFixed(1) : 0
        trends[key] = {
          value: current[key],
          previous: previous[key],
          diff,
          percent: parseFloat(percent)
        }
      }
    }
    
    return trends
  } catch (error) {
    console.error('Error fetching trends:', error)
    return {}
  }
}

export default {
  fetchQuickStats,
  subscribeToQuickStats,
  fetchTableDetails,
  fetchQuickStatsWithTrends
}
