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
    // Vérifie le statut serveur; le navigateur n'est jamais la source de vérité.
    async checkStatus() {
      this.loading = true
      this.error = null
      this.backendFunctionMissing = false

      try {
        const {
          data: { user }
        } = await supabase.auth.getUser()
        if (!user) return

        const { data, error } = await supabase.rpc('get_daily_wheel_status')
        if (error) throw error
        this.canSpin = Boolean(data?.can_spin)
        this.lastResult = data?.last_result || null
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
        const {
          data: { user }
        } = await supabase.auth.getUser()
        if (!user) throw new Error('User not found')

        const { data, error } = await supabase.rpc('spin_daily_wheel')
        if (error) throw error
        return data
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
