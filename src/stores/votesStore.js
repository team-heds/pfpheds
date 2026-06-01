/**
 * @module votesStore
 * @description Store Pinia pour la gestion des votes étudiants (PFP).
 * Utilise Supabase avec support RPC backend pour contourner les restrictions RLS.
 *
 * @state {Array} votes - Liste des votes de l'utilisateur
 * @state {Object|null} currentVote - Vote en cours de consultation
 * @state {boolean} loading - Indicateur de chargement
 * @state {string|null} error - Dernier message d'erreur
 *
 * @action fetchUserVotes(userId) - Récupère tous les votes d'un utilisateur
 * @action fetchVote(voteId) - Récupère un vote spécifique
 * @action saveVote(voteData) - Crée ou met à jour un vote (via RPC ou direct)
 * @action deleteVote(voteId) - Supprime un vote
 * @action reset() - Réinitialise le store
 */
import { defineStore } from 'pinia'
import { supabase } from '@/supabase'
import votesBackendService from '@/service/votesBackendService'

const getAcademicYearKeys = (year) => {
  const y = Number(year)
  if (!Number.isFinite(y)) return [String(year)]
  return [String(y), `${y - 1}-${y}`]
}

const isYearMatch = (candidateYear, selectedYear) => {
  if (candidateYear === null || candidateYear === undefined || selectedYear === null || selectedYear === undefined) return false
  return getAcademicYearKeys(selectedYear).includes(String(candidateYear))
}

export const useVotesStore = defineStore('votes', {
  state: () => ({
    votes: [],
    currentVote: null,
    loading: false,
    error: null,
    useBackendFunctions: true // Utiliser les fonctions RPC backend par défaut (contourne les problèmes RLS)
  }),

  getters: {
    /**
     * Récupère le vote pour un PFP type et une année donnés
     */
    getVoteByTypeAndYear: (state) => (pfpType, year) => {
      return state.votes.find(v => v.pfp_type === pfpType && isYearMatch(v.year, year))
    },

    /**
     * Vérifie si un vote existe déjà
     */
    hasVoted: (state) => (pfpType, year) => {
      return !!state.votes.find(v => v.pfp_type === pfpType && isYearMatch(v.year, year))
    }
  },

  actions: {
    /**
     * Récupère tous les votes de l'utilisateur connecté
     */
    async fetchUserVotes() {
      this.loading = true
      this.error = null

      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('Utilisateur non connecté')
        }

        const { data, error } = await supabase
          .from('student_votes')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })

        if (error) throw error

        this.votes = data || []
        
        return data
      } catch (err) {
        console.error('❌ Erreur fetchUserVotes:', err)
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Récupère un vote spécifique pour un PFP type et une année
     */
    async fetchVote(pfpType, year) {
      this.loading = true
      this.error = null

      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('Utilisateur non connecté')
        }

        const yearKeys = getAcademicYearKeys(year)
        const { data, error } = await supabase
          .from('student_votes')
          .select('*')
          .eq('user_id', user.id)
          .eq('pfp_type', pfpType)
          .in('year', yearKeys)
          .order('updated_at', { ascending: false })
          .limit(1)

        if (error) throw error

        this.currentVote = data?.[0] || null
        
        return data?.[0] || null
      } catch (err) {
        console.error('❌ Erreur fetchVote:', err)
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Enregistre ou met à jour un vote
     * @param {string} pfpType - Type de PFP
     * @param {string} year - Année
     * @param {Array} choices - Choix de l'étudiant
     * @param {boolean} useRPC - Forcer l'utilisation des fonctions RPC backend
     */
    async saveVote(pfpType, year, choices, useRPC = null) {
      this.loading = true
      this.error = null

      const shouldUseRPC = useRPC !== null ? useRPC : this.useBackendFunctions

      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('Utilisateur non connecté')
        }

        let data

        if (shouldUseRPC) {
          // Utiliser la fonction RPC backend (plus sécurisé)
          data = await votesBackendService.upsertStudentVote(user.id, pfpType, year, choices)
        } else {
          // Approche directe (comme avant)
          // Vérifier si un vote existe déjà
          const existingVote = await this.fetchVote(pfpType, year)

          const payload = {
            user_id: user.id,
            pfp_type: pfpType,
            year: year,
            choices: choices,
            updated_at: new Date().toISOString()
          }

          let result

          if (existingVote) {
            // UPDATE
            result = await supabase
              .from('student_votes')
              .update({
                choices: payload.choices,
                updated_at: payload.updated_at
              })
              .eq('id', existingVote.id)
              .select()
              .single()
          } else {
            // INSERT
            result = await supabase
              .from('student_votes')
              .insert(payload)
              .select()
              .single()
          }

          const { data: resultData, error } = result

          if (error) {
            console.error('❌ Erreur Supabase:', error)
            throw error
          }

          if (!resultData) {
            throw new Error('Aucune donnée retournée par Supabase')
          }

          data = resultData
        }

        // Mettre à jour le state
        this.currentVote = data
        
        // Mettre à jour la liste des votes
        const index = this.votes.findIndex(v => 
          v.pfp_type === pfpType && isYearMatch(v.year, year)
        )
        if (index >= 0) {
          this.votes[index] = data
        } else {
          this.votes.push(data)
        }

        return data
      } catch (err) {
        console.error('❌ Erreur saveVote:', err)
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Supprime un vote
     */
    async deleteVote(pfpType, year) {
      this.loading = true
      this.error = null

      try {
        const { data: { user } } = await supabase.auth.getUser()
        
        if (!user) {
          throw new Error('Utilisateur non connecté')
        }

        const yearKeys = getAcademicYearKeys(year)
        const { error } = await supabase
          .from('student_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('pfp_type', pfpType)
          .in('year', yearKeys)

        if (error) throw error

        // Mettre à jour le state
        this.votes = this.votes.filter(v => 
          !(v.pfp_type === pfpType && isYearMatch(v.year, year))
        )
        
        if (this.currentVote?.pfp_type === pfpType && isYearMatch(this.currentVote?.year, year)) {
          this.currentVote = null
        }

        return true
      } catch (err) {
        console.error('❌ Erreur deleteVote:', err)
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    /**
     * Réinitialise le state
     */
    reset() {
      this.votes = []
      this.currentVote = null
      this.loading = false
      this.error = null
    }
  }
})
