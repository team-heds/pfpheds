/**
 * Service pour gérer les résultats d'attribution des places (student_result_vote)
 * Utilise les routes backend /api/resultat-votation
 */

import { supabase } from '@/supabase'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000'

export const resultatVotationService = {
  /**
   * Lance l'algorithme d'attribution des places
   * @param {string} pfpType - Type de PFP (PFP1A, PFP1B, etc.)
   * @param {string} year - Année (ex: '2026')
   * @param {Array} students - Liste des étudiants avec leurs choix
   * @param {Array} places - Liste des places disponibles
   * @returns {Promise<Object>}
   */
  async runAlgorithm(pfpType, year, students, places) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const response = await axios.post(
        `${API_BASE_URL}/api/resultat-votation/run-algorithm`,
        {
          pfpType,
          year,
          students,
          places
        },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Algorithm execution failed')
      }

      console.log('✅ Algorithme exécuté avec succès:', response.data)
      return response.data
    } catch (err) {
      console.error('❌ Erreur runAlgorithm:', err)
      throw err
    }
  },

  /**
   * Récupère tous les résultats pour un PFP et une année
   * @param {string} pfpType - Type de PFP
   * @param {string} year - Année
   * @param {string} algorithmRunId - ID optionnel de l'exécution d'algorithme
   * @returns {Promise<Array>}
   */
  async getResults(pfpType, year, algorithmRunId = null) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const url = algorithmRunId
        ? `${API_BASE_URL}/api/resultat-votation/results/${pfpType}/${year}?algorithmRunId=${algorithmRunId}`
        : `${API_BASE_URL}/api/resultat-votation/results/${pfpType}/${year}`

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to fetch results')
      }

      return response.data.results || []
    } catch (err) {
      console.error('❌ Erreur getResults:', err)
      throw err
    }
  },

  /**
   * Récupère le résultat d'un étudiant spécifique
   * @param {string} userId - ID de l'utilisateur
   * @param {string} pfpType - Type de PFP
   * @param {string} year - Année
   * @returns {Promise<Object|null>}
   */
  async getStudentResult(userId, pfpType, year) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const response = await axios.get(
        `${API_BASE_URL}/api/resultat-votation/student/${userId}/${pfpType}/${year}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to fetch student result')
      }

      return response.data.result
    } catch (err) {
      console.error('❌ Erreur getStudentResult:', err)
      throw err
    }
  },

  /**
   * Récupère le résultat de l'étudiant connecté via RPC Supabase
   * @param {string} pfpType - Type de PFP
   * @param {string} year - Année
   * @returns {Promise<Object|null>}
   */
  async getMyResult(pfpType, year) {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Authentication required')

      const { data, error } = await supabase.rpc('get_student_result', {
        p_user_id: user.id,
        p_pfp_type: pfpType,
        p_year: year
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error('❌ Erreur getMyResult:', err)
      throw err
    }
  },

  /**
   * Récupère les statistiques des résultats
   * @param {string} pfpType - Type de PFP
   * @param {string} year - Année
   * @returns {Promise<Array>}
   */
  async getStatistics(pfpType, year) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const response = await axios.get(
        `${API_BASE_URL}/api/resultat-votation/statistics/${pfpType}/${year}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to fetch statistics')
      }

      return response.data.statistics || []
    } catch (err) {
      console.error('❌ Erreur getStatistics:', err)
      throw err
    }
  },

  /**
   * Met à jour le statut d'un résultat
   * @param {string} resultId - ID du résultat
   * @param {string} status - Nouveau statut (assigned, pending, rejected, confirmed)
   * @param {string} notes - Notes optionnelles
   * @returns {Promise<Object>}
   */
  async updateStatus(resultId, status, notes = null) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const response = await axios.put(
        `${API_BASE_URL}/api/resultat-votation/status/${resultId}`,
        { status, notes },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to update status')
      }

      return response.data.result
    } catch (err) {
      console.error('❌ Erreur updateStatus:', err)
      throw err
    }
  },

  /**
   * Supprime un résultat d'attribution
   * @param {string} resultId - ID du résultat
   * @returns {Promise<boolean>}
   */
  async deleteResult(resultId) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const response = await axios.delete(
        `${API_BASE_URL}/api/resultat-votation/${resultId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to delete result')
      }

      return true
    } catch (err) {
      console.error('❌ Erreur deleteResult:', err)
      throw err
    }
  },

  /**
   * Supprime tous les résultats d'une exécution d'algorithme
   * @param {string} algorithmRunId - ID de l'exécution de l'algorithme
   * @returns {Promise<number>} - Nombre de résultats supprimés
   */
  async deleteAlgorithmRun(algorithmRunId) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const response = await axios.delete(
        `${API_BASE_URL}/api/resultat-votation/algorithm-run/${algorithmRunId}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to delete algorithm run')
      }

      return response.data.deletedCount || 0
    } catch (err) {
      console.error('❌ Erreur deleteAlgorithmRun:', err)
      throw err
    }
  },

  /**
   * Récupère les résultats directement depuis Supabase (sans passer par le backend)
   * Utilisé pour l'accès en lecture seule
   * @param {string} pfpType - Type de PFP
   * @param {string} year - Année
   * @returns {Promise<Array>}
   */
  async getResultsDirect(pfpType, year) {
    try {
      const { data, error } = await supabase
        .from('student_result_vote')
        .select('*')
        .eq('pfp_type', pfpType)
        .eq('year', year)
        .order('assigned_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('❌ Erreur getResultsDirect:', err)
      throw err
    }
  }
}

export default resultatVotationService
