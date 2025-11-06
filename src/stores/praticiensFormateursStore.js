import { defineStore } from 'pinia';
import { supabase } from '@/supabase';

export const usePraticiensFormateursStore = defineStore('praticiensFormateurs', {
  state: () => ({
    praticiensFormateurs: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchPraticiensFormateurs(searchQuery = '') {
      this.loading = true;
      this.error = null;
      try {
        let q = supabase
          .from('praticiens_formateurs')
          .select('id, institution, institution_id, localite, mail, nom, prenom, created_at, updated_at')
          .order('institution', { ascending: true })
          .order('localite', { ascending: true })
          .order('nom', { ascending: true });

        const s = (searchQuery || '').trim();
        if (s) {
          q = q.or(
            `nom.ilike.%${s}%,prenom.ilike.%${s}%,mail.ilike.%${s}%,institution.ilike.%${s}%,localite.ilike.%${s}%`
          );
        }

        const { data, error } = await q;
        if (error) throw error;
        this.praticiensFormateurs = data || [];
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async createPraticienFormateur(praticienData) {
      this.loading = true;
      this.error = null;
      try {
        const payload = { ...praticienData }
        if (!payload.id) {
          payload.id = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
        }
        payload.updated_at = new Date().toISOString()
        if (!payload.created_at) payload.created_at = new Date().toISOString()

        const { data, error } = await supabase
          .from('praticiens_formateurs')
          .insert([payload])
          .select('*')
          .single()
        if (error) throw error
        const row = data
        this.praticiensFormateurs.push(row)
        return row
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async updatePraticienFormateur(praticienId, updateData) {
      this.loading = true;
      this.error = null;
      try {
        const payload = { ...updateData, updated_at: new Date().toISOString() }
        const { data, error } = await supabase
          .from('praticiens_formateurs')
          .update(payload)
          .eq('id', praticienId)
          .select('*')
          .single()
        if (error) throw error
        const updated = data
        const index = this.praticiensFormateurs.findIndex(p => p.id === praticienId)
        if (index !== -1) this.praticiensFormateurs[index] = updated
        return updated
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async deletePraticienFormateur(praticienId) {
      this.loading = true;
      this.error = null;
      try {
        const { error } = await supabase
          .from('praticiens_formateurs')
          .delete()
          .eq('id', praticienId)
        if (error) throw error
        this.praticiensFormateurs = this.praticiensFormateurs.filter(p => p.id !== praticienId)
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },
  },
});
