/**
 * Service pour les statistiques rapides du dashboard
 * Utilise Supabase au lieu de Firebase
 */

import { supabase } from '@/supabase'
import studentsService from './studentDirectoryService'

/**
 * Compte les éléments d'une table avec filtre optionnel
 */
async function countTable(table, filter = null) {
  // Use GET instead of HEAD to avoid 400 on some PostgREST setups
  let query = supabase.from(table).select('*', { count: 'exact', head: false })
  if (filter && Array.isArray(filter)) {
    for (const [col, op, val] of filter) {
      query = query.filter(col, op, val)
    }
  }
  const { count, error } = await query.limit(1)
  if (error) throw new Error(`Impossible de compter ${table}: ${error.message}`, { cause: error })
  return count ?? 0
}

/**
 * Récupère toutes les stats rapides en une seule fois
 * Utilise les vraies données Supabase validées
 */
export async function fetchQuickStats() {
  const [places, institutions, students, formateurs] = await Promise.all([
      // Places de stages
      countTable('places'),
      
      // Institutions partenaires
      countTable('institutions'),
      
      // Étudiants - SOURCE UNIQUE (inclut BA22, BA23, BA24, BA25)
      studentsService.countStudents(),
      
      // Formateurs (enseignants avec rôles réels)
      (async () => {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('user_id')
            .or('role.eq.EnseignantSoins,role.eq.EnseignantPhysio,role.ilike.%enseignant%,role.ilike.%teacher%,role.ilike.%formateur%')
          if (error) throw new Error(`Impossible de compter les formateurs: ${error.message}`, { cause: error })
          return data?.length ?? 0
      })()
    ])

    return {
      places,
      institutions,
      students,
      formateurs,
      timestamp: new Date().toISOString()
    }
}

/**
 * Récupère les stats avec abonnement temps réel (si disponible)
 */
export function subscribeToQuickStats(callback, onError = console.error) {
  // Supabase Realtime pour les mises à jour
  const channels = []
  
  // Places
  const placesChannel = supabase
    .channel('places-changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'places' },
      () => {
        fetchQuickStats().then(callback).catch(onError)
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
        fetchQuickStats().then(callback).catch(onError)
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
  const { data, error, count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact' })
      .limit(100)
    
    if (error) throw new Error(`Impossible de charger ${tableName}: ${error.message}`, { cause: error })
    
    return {
      count,
      data: data || [],
      table: tableName
    }
}

/**
 * Récupère les stats avec tendances (comparaison période)
 */
export async function fetchQuickStatsWithTrends(days = 7) {
    const now = new Date()
    const previousDate = new Date()
    previousDate.setDate(previousDate.getDate() - days)
    
    // Les tables ne sont pas encore historisées. Une seconde lecture identique
    // doublait le trafic sans produire une vraie période précédente.
    const current = await fetchQuickStats()
    const previous = current
    
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
}

export default {
  fetchQuickStats,
  subscribeToQuickStats,
  fetchTableDetails,
  fetchQuickStatsWithTrends
}
