import { defineStore } from 'pinia'
import { supabase } from '@/supabase'
import votesBackendService from './votesBackendService'

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
      return state.votes.find(v => v.pfp_type === pfpType && v.year === year)
    },

    /**
     * Vérifie si un vote existe déjà
     */
    hasVoted: (state) => (pfpType, year) => {
      return !!state.votes.find(v => v.pfp_type === pfpType && v.year === year)
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
        console.log('✅ Votes chargés:', this.votes.length)
        
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

        const { data, error } = await supabase
          .from('student_votes')
          .select('*')
          .eq('user_id', user.id)
          .eq('pfp_type', pfpType)
          .eq('year', year)
          .maybeSingle()

        if (error) throw error

        this.currentVote = data
        console.log('✅ Vote récupéré:', data ? 'trouvé' : 'non trouvé')
        
        return data
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

        console.log('💾 Enregistrement du vote:', { 
          user: user.id, 
          pfpType, 
          year, 
          choicesCount: choices.length,
          method: shouldUseRPC ? 'RPC' : 'Direct'
        })

        let data

        if (shouldUseRPC) {
          // Utiliser la fonction RPC backend (plus sécurisé)
          console.log('🔧 Utilisation de la fonction RPC backend')
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
            console.log('🔄 Mise à jour du vote existant')
            result = await supabase
              .from('student_votes')
              .update({
                choices: payload.choices,
                updated_at: payload.updated_at
              })
              .eq('user_id', payload.user_id)
              .eq('pfp_type', payload.pfp_type)
              .eq('year', payload.year)
              .select()
              .single()
          } else {
            // INSERT
            console.log('➕ Création d\'un nouveau vote')
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

        console.log('✅ Vote enregistré avec succès:', data)

        // Mettre à jour le state
        this.currentVote = data
        
        // Mettre à jour la liste des votes
        const index = this.votes.findIndex(v => 
          v.pfp_type === pfpType && v.year === year
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

        const { error } = await supabase
          .from('student_votes')
          .delete()
          .eq('user_id', user.id)
          .eq('pfp_type', pfpType)
          .eq('year', year)

        if (error) throw error

        // Mettre à jour le state
        this.votes = this.votes.filter(v => 
          !(v.pfp_type === pfpType && v.year === year)
        )
        
        if (this.currentVote?.pfp_type === pfpType && this.currentVote?.year === year) {
          this.currentVote = null
        }

        console.log('✅ Vote supprimé')
        
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
