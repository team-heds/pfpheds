/**
 * Service pour appeler les fonctions backend (RPC) de gestion des votes
 * Ces fonctions sont définies dans backend/supabase/migrations/0003_student_votes_functions.sql
 */

import { supabase } from '@/supabase'

export const votesBackendService = {
  /**
   * Récupère le vote d'un étudiant via une fonction RPC backend
   * @param {string} userId - ID de l'utilisateur
   * @param {string} pfpType - Type de PFP (PFP1A, PFP1B, etc.)
   * @param {string} year - Année (ex: '2026')
   * @returns {Promise<Object|null>}
   */
  async getStudentVote(userId, pfpType, year) {
    try {
      const { data, error } = await supabase.rpc('get_student_vote', {
        p_user_id: userId,
        p_pfp_type: pfpType,
        p_year: year
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error('❌ Erreur getStudentVote RPC:', err)
      throw err
    }
  },

  /**
   * Enregistre ou met à jour un vote via une fonction RPC backend
   * Cette fonction inclut des vérifications de sécurité côté serveur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} pfpType - Type de PFP
   * @param {string} year - Année
   * @param {Array} choices - Array des choix
   * @returns {Promise<Object>}
   */
  async upsertStudentVote(userId, pfpType, year, choices) {
    try {
      const { data, error } = await supabase.rpc('upsert_student_vote', {
        p_user_id: userId,
        p_pfp_type: pfpType,
        p_year: year,
        p_choices: choices
      })

      if (error) throw error
      
      return data
    } catch (err) {
      console.error('❌ Erreur upsertStudentVote RPC:', err)
      throw err
    }
  },

  /**
   * Supprime le vote d'un étudiant via une fonction RPC backend
   * @param {string} userId - ID de l'utilisateur
   * @param {string} pfpType - Type de PFP
   * @param {string} year - Année
   * @returns {Promise<boolean>}
   */
  async deleteStudentVote(userId, pfpType, year) {
    try {
      const { data, error } = await supabase.rpc('delete_student_vote', {
        p_user_id: userId,
        p_pfp_type: pfpType,
        p_year: year
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error('❌ Erreur deleteStudentVote RPC:', err)
      throw err
    }
  },

  /**
   * Vérifie si un étudiant a déjà voté
   * @param {string} userId - ID de l'utilisateur
   * @param {string} pfpType - Type de PFP
   * @param {string} year - Année
   * @returns {Promise<boolean>}
   */
  async hasStudentVoted(userId, pfpType, year) {
    try {
      const { data, error } = await supabase.rpc('has_student_voted', {
        p_user_id: userId,
        p_pfp_type: pfpType,
        p_year: year
      })

      if (error) throw error
      return data
    } catch (err) {
      console.error('❌ Erreur hasStudentVoted RPC:', err)
      throw err
    }
  },

  /**
   * Récupère tous les votes d'un étudiant
   * @param {string} userId - ID de l'utilisateur
   * @returns {Promise<Array>}
   */
  async getAllStudentVotes(userId) {
    try {
      const { data, error } = await supabase.rpc('get_all_student_votes', {
        p_user_id: userId
      })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('❌ Erreur getAllStudentVotes RPC:', err)
      throw err
    }
  },

  /**
   * Compte le nombre total de votes pour un PFP/année
   * @param {string} pfpType - Type de PFP
   * @param {string} year - Année
   * @returns {Promise<number>}
   */
  async countVotes(pfpType, year) {
    try {
      const { data, error } = await supabase.rpc('count_votes', {
        p_pfp_type: pfpType,
        p_year: year
      })

      if (error) throw error
      return data || 0
    } catch (err) {
      console.error('❌ Erreur countVotes RPC:', err)
      throw err
    }
  },

  /**
   * Récupère le top N des places les plus votées pour un rang donné
   * @param {string} pfpType - Type de PFP
   * @param {string} year - Année
   * @param {number} rank - Rang (1 = premier choix, 2 = deuxième, etc.)
   * @param {number} limit - Nombre de résultats max
   * @returns {Promise<Array>}
   */
  async getTopVotedPlaces(pfpType, year, rank = 1, limit = 10) {
    try {
      const { data, error } = await supabase.rpc('get_top_voted_places', {
        p_pfp_type: pfpType,
        p_year: year,
        p_rank: rank,
        p_limit: limit
      })

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('❌ Erreur getTopVotedPlaces RPC:', err)
      throw err
    }
  },

  /**
   * Récupère les statistiques générales des votes
   * @returns {Promise<Array>}
   */
  async getVoteStatistics() {
    try {
      const { data, error } = await supabase
        .from('vote_statistics')
        .select('*')

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('❌ Erreur getVoteStatistics:', err)
      throw err
    }
  },

  /**
   * Récupère l'agrégation des votes par place
   * @param {string} pfpType - Type de PFP (optionnel)
   * @param {string} year - Année (optionnel)
   * @returns {Promise<Array>}
   */
  async getVotePlaceAggregation(pfpType = null, year = null) {
    try {
      let query = supabase.from('vote_place_aggregation').select('*')

      if (pfpType) {
        query = query.eq('pfp_type', pfpType)
      }
      if (year) {
        query = query.eq('year', year)
      }

      const { data, error } = await query

      if (error) throw error
      return data || []
    } catch (err) {
      console.error('❌ Erreur getVotePlaceAggregation:', err)
      throw err
    }
  }
}

export default votesBackendService
