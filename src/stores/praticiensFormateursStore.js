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
          .select('id, institution, localite, mail, nom, prenom, created_at, updated_at')
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
        
        if (error) {
          console.error('❌ Erreur lors du chargement:', error)
          throw error;
        }
        
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
          nom: praticienData?.nom || '',
          prenom: praticienData?.prenom || '',
          mail: praticienData?.mail || null,
          institution: praticienData?.institution || null,
          localite: praticienData?.localite || null,
          updated_at: new Date().toISOString()
        }
        
        const { data, error } = await supabase
          .from('praticiens_formateurs')
          .insert([payload])
          .select('*')
          .single()
          
        if (error) {
          console.error('❌ Erreur Supabase:', error)
          if (error.code === '42P01') {
            throw new Error('La table praticiens_formateurs est introuvable dans la base Supabase configurée.')
          }
          if (error.code === '42501') {
            throw new Error('Permissions insuffisantes pour créer un praticien formateur.')
          }
          throw error
        }
        
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
        const payload = {
          nom: updateData?.nom || '',
          prenom: updateData?.prenom || '',
          mail: updateData?.mail || null,
          institution: updateData?.institution || null,
          localite: updateData?.localite || null,
          updated_at: new Date().toISOString(),
        }
        
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
        const { error } = await supabase
          .from('praticiens_formateurs')
          .delete()
          .eq('id', praticienId)
          
        if (error) {
          console.error('❌ Erreur Supabase:', error)
          throw error
        }
        
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
