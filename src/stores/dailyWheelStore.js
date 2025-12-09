import { defineStore } from 'pinia'
import { supabase } from '@/supabase'

export const useDailyWheelStore = defineStore('dailyWheel', {
  state: () => ({
    canSpin: false,
    loading: false,
    isSpinning: false,
    lastResult: null, // { result_type, prize_details }
    showModal: false, // Controls the visibility of the wheel modal
    error: null,
    backendFunctionMissing: false
  }),

  actions: {
    // Vérifie si l'utilisateur peut tourner la roue aujourd'hui
    // MODE HYBRIDE : Check local (car backend table 404) + Sauvegarde XP réelle
    async checkStatus() {
      this.loading = true
      this.error = null
      this.backendFunctionMissing = false
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        const today = new Date().toISOString().split('T')[0]
        
        // 1. Vérification LOCALE (Navigateur)
        const lastSpinDate = localStorage.getItem(`daily_wheel_date_${user.id}`)
        const lastSpinResult = localStorage.getItem(`daily_wheel_result_${user.id}`)

        if (lastSpinDate === today) {
            this.canSpin = false
            this.lastResult = lastSpinResult ? JSON.parse(lastSpinResult) : null
        } else {
            this.canSpin = true
            this.lastResult = null
        }
        
      } catch (err) {
        console.error('Error checking wheel status:', err)
        this.error = err.message
      } finally {
        this.loading = false
      }
    },

    async spinWheel() {
      if (!this.canSpin) return
      
      this.isSpinning = true
      this.error = null
      
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error("User not found")

        // 1. Logique du jeu (Client)
        const rand = Math.floor(Math.random() * 100) + 1
        let result_type, prize_details, xp_gain = 0

        if (rand <= 35) {
            result_type = 'QUIZ_EASY'; xp_gain = 2;
            prize_details = {xp: 10, difficulty: 'easy', label: 'Quiz Facile'};
        } else if (rand <= 60) {
            result_type = 'XP_BONUS'; xp_gain = 5;
            prize_details = {xp: 5, label: 'Bonus +5 XP'};
        } else if (rand <= 75) {
            result_type = 'QUIZ_HARD'; xp_gain = 5;
            prize_details = {xp: 20, difficulty: 'hard', label: 'Quiz Difficile'};
        } else if (rand <= 90) {
            result_type = 'HELP_CHALLENGE'; xp_gain = 0;
            prize_details = {xp: 15, mission: 'help_peer', label: 'Défi Entraide'};
        } else {
            result_type = 'REROLL'; xp_gain = 0;
            prize_details = {token: 1, label: 'Jeton Rejouer'};
        }

        // 2. Sauvegarde LOCALE (Pour bloquer le re-jeu aujourd'hui)
        const today = new Date().toISOString().split('T')[0]
        localStorage.setItem(`daily_wheel_date_${user.id}`, today)
        localStorage.setItem(`daily_wheel_result_${user.id}`, JSON.stringify(prize_details))

        // 3. Sauvegarde DISTANTE (Uniquement les points XP)
        if (xp_gain > 0) {
            // A. On récupère les données actuelles
            const { data: currentData, error: fetchError } = await supabase
                .from('gamification_data')
                .select('user_id, total_xp')
                .eq('user_id', user.id)
                .maybeSingle()
            
            if (fetchError) console.warn("Erreur lecture XP:", fetchError)

            if (currentData) {
                // B. UPDATE si existe
                const newXP = (currentData.total_xp || 0) + xp_gain
                const { error: updateError } = await supabase
                    .from('gamification_data')
                    .update({ 
                        total_xp: newXP,
                        email: user.email,
                        updated_at: new Date()
                    })
                    .eq('user_id', user.id)
                
                if (updateError) console.warn("Erreur update XP:", updateError)
            } else {
                // C. INSERT si n'existe pas
                const { error: insertError } = await supabase
                    .from('gamification_data')
                    .insert({ 
                        user_id: user.id,
                        email: user.email,
                        total_xp: xp_gain,
                        current_level: 1,
                        updated_at: new Date()
                    })
                
                if (insertError) console.warn("Erreur insert XP:", insertError)
            }
        }
        
        return { result_type, prize_details, status: 'SUCCESS' }
        
      } catch (err) {
        console.error('Error spinning wheel:', err)
        this.error = err.message
        this.isSpinning = false
        throw err
      }
    },
    
    // Marque l'animation comme terminée et met à jour l'état
    completeSpin(result) {
      this.lastResult = result.prize_details
      this.canSpin = false
      this.isSpinning = false
    },

    openModal() {
      this.showModal = true
    },

    closeModal() {
      this.showModal = false
      // Si on vient de tourner, on refresh le status pour être sûr
      if (!this.canSpin) {
        this.checkStatus()
      }
    }
  }
})
