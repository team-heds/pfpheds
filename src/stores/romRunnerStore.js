import { defineStore } from 'pinia'
import { supabase } from '@/supabase'

export const useRomRunnerStore = defineStore('romRunner', {
  state: () => ({
    status: 'idle', // idle, playing, paused, gameover
    score: 0,
    combo: 0,
    maxCombo: 0,
    health: 3,
    timeLeft: 60,
    currentSpeed: 10, // Vitesse de défilement
    
    // Statistiques pour l'analyse
    stats: {
      totalObstacles: 0,
      perfectHits: 0,
      okHits: 0,
      misses: 0
    },

    // Feedback UI immédiat
    lastFeedback: null, // { type: 'PERFECT'|'GOOD'|'MISS', text: '+20' }
  }),

  getters: {
    isPlaying: (state) => state.status === 'playing',
    multiplier: (state) => {
      if (state.combo >= 10) return 2.0
      if (state.combo >= 6) return 1.5
      if (state.combo >= 3) return 1.2
      return 1.0
    }
  },

  actions: {
    startGame() {
      this.resetState()
      this.status = 'playing'
    },

    resetState() {
      this.score = 0
      this.combo = 0
      this.maxCombo = 0
      this.health = 3
      this.timeLeft = 60
      this.currentSpeed = 10
      this.stats = { totalObstacles: 0, perfectHits: 0, okHits: 0, misses: 0 }
      this.lastFeedback = null
    },

    handleHit(quality) {
      // quality: 'PERFECT' (20pts) ou 'GOOD' (10pts)
      this.stats.totalObstacles++
      this.combo++
      if (this.combo > this.maxCombo) this.maxCombo = this.combo

      const basePoints = quality === 'PERFECT' ? 20 : 10
      const points = Math.round(basePoints * this.multiplier)
      
      this.score += points
      
      if (quality === 'PERFECT') this.stats.perfectHits++
      else this.stats.okHits++

      this.triggerFeedback(quality, `+${points}`)
    },

    handleMiss() {
      this.stats.totalObstacles++
      this.stats.misses++
      this.combo = 0
      this.health--
      this.triggerFeedback('MISS', 'Manqué !')
      
      if (this.health <= 0) {
        this.endGame()
      }
    },

    triggerFeedback(type, text) {
      this.lastFeedback = { type, text, id: Date.now() }
      // Le composant UI se chargera de l'effacer après l'animation
    },

    async endGame() {
      this.status = 'gameover'
      
      // Sauvegarde simple du score (MVP)
      // On pourrait ajouter une entrée dans une table 'rom_runner_scores' ici
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
           // Calcul XP basé sur le score
           const xpEarned = Math.floor(this.score / 10) 
           
           // TODO: Appel service gamification pour ajouter XP
           // Game over - score and XP calculated
        }
      } catch (e) {
        console.error("Erreur sauvegarde score", e)
      }
    }
  }
})
