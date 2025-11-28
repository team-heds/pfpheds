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
        console.log('📥 Chargement des praticiens formateurs...')
        
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
          console.log('🔍 Recherche:', s)
        }

        const { data, error } = await q;
        
        if (error) {
          console.error('❌ Erreur lors du chargement:', error)
          throw error;
        }
        
        console.log('✅ Praticiens chargés:', data?.length || 0)
        this.praticiensFormateurs = data || [];
      } catch (e) {
        console.error('❌ Erreur:', e)
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
        const payload = { 
          ...praticienData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        // Générer un UUID pour l'id si non fourni
        if (!payload.id) {
          if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            payload.id = crypto.randomUUID()
          } else {
            // Fallback: générer un UUID v4 simple
            payload.id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
              const r = Math.random() * 16 | 0
              const v = c === 'x' ? r : (r & 0x3 | 0x8)
              return v.toString(16)
            })
          }
        }
        
        console.log('📝 Création praticien formateur:', payload)

        const { data, error } = await supabase
          .from('praticiens_formateurs')
          .insert([payload])
          .select('*')
          .single()
          
        if (error) {
          console.error('❌ Erreur Supabase:', error)
          throw error
        }
        
        console.log('✅ Praticien créé:', data)
        const row = data
        this.praticiensFormateurs.push(row)
        return row
      } catch (e) {
        console.error('❌ Erreur lors de la création:', e)
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
        console.log('📝 Mise à jour praticien formateur:', praticienId, payload)
        
        const { data, error } = await supabase
          .from('praticiens_formateurs')
          .update(payload)
          .eq('id', praticienId)
          .select('*')
          .single()
          
        if (error) {
          console.error('❌ Erreur Supabase:', error)
          throw error
        }
        
        console.log('✅ Praticien mis à jour:', data)
        const updated = data
        const index = this.praticiensFormateurs.findIndex(p => p.id === praticienId)
        if (index !== -1) this.praticiensFormateurs[index] = updated
        return updated
      } catch (e) {
        console.error('❌ Erreur lors de la mise à jour:', e)
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
        console.log('🗑️ Suppression praticien formateur:', praticienId)
        
        const { error } = await supabase
          .from('praticiens_formateurs')
          .delete()
          .eq('id', praticienId)
          
        if (error) {
          console.error('❌ Erreur Supabase:', error)
          throw error
        }
        
        console.log('✅ Praticien supprimé')
        this.praticiensFormateurs = this.praticiensFormateurs.filter(p => p.id !== praticienId)
      } catch (e) {
        console.error('❌ Erreur lors de la suppression:', e)
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },
  },
});
