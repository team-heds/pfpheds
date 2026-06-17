/**
 * Service pour gérer les résultats d'attribution des places (student_result_vote)
 * Utilise les routes backend /api/resultat-votation
 */

import { supabase } from '@/supabase'
import axios from 'axios'

const resolveApiBaseUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:3000'
    }
  }

  return ''
}

const API_BASE_URL = resolveApiBaseUrl()
const getAcademicYearKeys = (year) => {
  const y = Number(year)
  if (!Number.isFinite(y)) return [String(year)]
  return [String(y), `${y - 1}-${y}`]
}

export const resultatVotationService = {
  /**
   * Lance l'algorithme d'attribution des places
   * @param {string} pfpType - Type de PFP (PFP1A, PFP1B, etc.)
   * @param {string} year - Année (ex: '2026')
   * @param {Array} students - Liste des étudiants avec leurs choix
   * @param {Array} places - Liste des places disponibles
   * @returns {Promise<Object>}
   */
  async runAlgorithm(pfpType, year, students, places, options = {}) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const response = await axios.post(
        `${API_BASE_URL}/api/resultat-votation/run-algorithm`,
        {
          pfpType,
          year,
          students,
          places,
          persist: options.persist ?? true,
          ignoreExistingAssignments: options.ignoreExistingAssignments ?? false
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

      return response.data
    } catch (err) {
      console.error('❌ Erreur runAlgorithm:', err)
      throw err
    }
  },

  async confirmAlgorithm(results) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const response = await axios.post(
        `${API_BASE_URL}/api/resultat-votation/confirm-algorithm`,
        { results },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Algorithm confirmation failed')
      }

      return response.data
    } catch (err) {
      console.error('❌ Erreur confirmAlgorithm:', err)
      throw err
    }
  },

  /**
   * Récupère le nombre d'assignations par place pour un PFP et une année
   * @param {string} pfpType - Type de PFP
   * @param {string} year - Année
   * @returns {Promise<Object>} { placeId: count }
   */
  async getAssignmentCounts(pfpType, year, targetClass = null) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const params = targetClass ? `?targetClass=${encodeURIComponent(targetClass)}` : ''
      const response = await axios.get(
        `${API_BASE_URL}/api/resultat-votation/assignment-counts/${pfpType}/${year}${params}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to fetch assignment counts')
      }

      return response.data.counts || {}
    } catch (err) {
      console.error('❌ Erreur getAssignmentCounts:', err)
      throw err
    }
  },

  /**
   * Récupère les propositions PFP3 pour l'étudiant connecté
   * @param {string} year - Année
   * @returns {Promise<Array|null>} Liste des PlaceIds proposés ou null
   */
  async getPfp3Proposals(year, targetClass = null) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const params = targetClass ? `?targetClass=${encodeURIComponent(targetClass)}` : ''
      const response = await axios.get(
        `${API_BASE_URL}/api/resultat-votation/pfp3-proposals/${year}${params}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to fetch PFP3 proposals')
      }

      return {
        proposedPlaceIds: response.data.proposedPlaceIds,
        missingCriteria: response.data.missingCriteria || [],
        appliedRule: response.data.appliedRule || null,
        assignCounts: response.data.assignCounts || {}
      }
    } catch (err) {
      console.error('❌ Erreur getPfp3Proposals:', err)
      throw err
    }
  },

  /**
   * Sauvegarde les propositions PFP3 validées par l'admin
   * @param {string} year - Année
   * @param {string} targetClass - Classe cible
   * @param {Array} proposals - Liste des propositions par étudiant
   * @returns {Promise<Object>}
   */
  async savePfp3Proposals(year, targetClass, proposals, assignCounts) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const response = await axios.post(
        `${API_BASE_URL}/api/resultat-votation/save-pfp3-proposals`,
        { year, targetClass, proposals, assignCounts: assignCounts || {} },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to save PFP3 proposals')
      }

      return response.data
    } catch (err) {
      console.error('❌ Erreur savePfp3Proposals:', err)
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
   * Génère les propositions de places PFP4 pour chaque étudiant
   * basé sur leurs critères manquants
   * @param {string} year - Année (ex: '2026')
   * @param {string} targetClass - Classe cible (ex: 'BA23')
   * @returns {Promise<Object>} { proposals, allPfp4Places, stats }
   */
  async generatePfp4Proposals(year, targetClass = 'BA23') {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const response = await axios.post(
        `${API_BASE_URL}/api/resultat-votation/generate-pfp4-proposals`,
        { year, targetClass },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to generate PFP4 proposals')
      }

      return response.data
    } catch (err) {
      console.error('❌ Erreur generatePfp4Proposals:', err)
      throw err
    }
  },

  /**
   * Sauvegarde les propositions PFP4 validées par l'admin
   * @param {string} year - Année
   * @param {string} targetClass - Classe cible
   * @param {Array} proposals - Liste des propositions par étudiant
   * @returns {Promise<Object>}
   */
  async savePfp4Proposals(year, targetClass, proposals, assignCounts) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const response = await axios.post(
        `${API_BASE_URL}/api/resultat-votation/save-pfp4-proposals`,
        { year, targetClass, proposals, assignCounts: assignCounts || {} },
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to save PFP4 proposals')
      }

      return response.data
    } catch (err) {
      console.error('❌ Erreur savePfp4Proposals:', err)
      throw err
    }
  },

  /**
   * Récupère les propositions PFP4 pour l'étudiant connecté
   * @param {string} year - Année
   * @returns {Promise<Array|null>} Liste des PlaceIds proposés ou null
   */
  async getPfp4Proposals(year, targetClass = null) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Authentication required')

      const params = targetClass ? `?targetClass=${encodeURIComponent(targetClass)}` : ''
      const response = await axios.get(
        `${API_BASE_URL}/api/resultat-votation/pfp4-proposals/${year}${params}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.data.ok) {
        throw new Error(response.data.error || 'Failed to fetch PFP4 proposals')
      }

      return {
        proposedPlaceIds: response.data.proposedPlaceIds,
        missingCriteria: response.data.missingCriteria || [],
        appliedRule: response.data.appliedRule || null,
        assignCounts: response.data.assignCounts || {}
      }
    } catch (err) {
      console.error('❌ Erreur getPfp4Proposals:', err)
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
      const yearKeys = getAcademicYearKeys(year)
      const { data, error } = await supabase
        .from('student_result_vote')
        .select('*')
        .eq('pfp_type', pfpType)
        .in('year', yearKeys)
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
