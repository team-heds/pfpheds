import { defineStore } from 'pinia'
import { supabase } from '@/supabase'

export const useRepondantPhysioHESStore = defineStore('repondantPhysioHES', {
  state: () => ({
    repondants: [],
    currentRepondant: null,
    loading: false,
    error: null,
  }),

  getters: {
    activeRepondants: (state) => state.repondants.filter(r => r.is_active),
    getRepondantById: (state) => (id) => state.repondants.find(r => r.id === id),
    getRepondantByUserId: (state) => (userId) => state.repondants.find(r => r.user_id === userId),
  },

  actions: {
    async fetchRepondants() {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('RepondantPhysioHES')
          .select('*')
          .order('last_name', { ascending: true })

        if (error) throw error
        this.repondants = data || []
      } catch (e) {
        this.error = e.message
        console.error('Erreur fetchRepondants:', e)
      } finally {
        this.loading = false
      }
    },

    async fetchRepondantById(id) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('RepondantPhysioHES')
          .select('*')
          .eq('id', id)
          .single()

        if (error) throw error
        this.currentRepondant = data
        return data
      } catch (e) {
        this.error = e.message
        console.error('Erreur fetchRepondantById:', e)
        return null
      } finally {
        this.loading = false
      }
    },

    async createRepondant(payload) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('RepondantPhysioHES')
          .insert({
            first_name: payload.first_name,
            last_name: payload.last_name,
            email: payload.email,
            user_id: payload.user_id || null,
            is_active: payload.is_active !== undefined ? payload.is_active : true
          })
          .select()
          .single()

        if (error) throw error
        this.repondants.push(data)
        return data
      } catch (e) {
        this.error = e.message
        console.error('Erreur createRepondant:', e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateRepondant(id, updates) {
      this.loading = true
      this.error = null
      try {
        const { data, error } = await supabase
          .from('RepondantPhysioHES')
          .update({
            first_name: updates.first_name,
            last_name: updates.last_name,
            email: updates.email,
            user_id: updates.user_id,
            is_active: updates.is_active
          })
          .eq('id', id)
          .select()
          .single()

        if (error) throw error

        const idx = this.repondants.findIndex(r => r.id === id)
        if (idx !== -1) this.repondants[idx] = data
        if (this.currentRepondant?.id === id) this.currentRepondant = data

        return data
      } catch (e) {
        this.error = e.message
        console.error('Erreur updateRepondant:', e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteRepondant(id) {
      this.loading = true
      this.error = null
      try {
        const { error } = await supabase
          .from('RepondantPhysioHES')
          .delete()
          .eq('id', id)

        if (error) throw error

        this.repondants = this.repondants.filter(r => r.id !== id)
        if (this.currentRepondant?.id === id) this.currentRepondant = null
      } catch (e) {
        this.error = e.message
        console.error('Erreur deleteRepondant:', e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async getRepondantByIdAsync(id) {
      const found = this.repondants.find(r => r.id === id)
      if (found) return found
      return await this.fetchRepondantById(id)
    }
  }
})
