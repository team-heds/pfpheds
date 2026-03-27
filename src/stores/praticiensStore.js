// stores/praticiensStore.js
import { defineStore } from 'pinia'
import { supabase } from '@/supabase'

export const usePraticiensStore = defineStore('praticiens', {
  state: () => ({
    items: [],
    total: 0,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchPraticiens(searchQuery = '', { limit = 1000, offset = 0 } = {}) {
      this.loading = true
      this.error = null
      
      try {
        let query = supabase
          .from('praticiens_formateurs')
          .select('*', { count: 'exact' })
          .order('nom', { ascending: true })
          .order('prenom', { ascending: true })
        
        // Filtrage par recherche si nécessaire
        if (searchQuery && searchQuery.trim()) {
          const searchTerm = `%${searchQuery.trim()}%`
          query = query.or(`nom.ilike.${searchTerm},prenom.ilike.${searchTerm},mail.ilike.${searchTerm},institution.ilike.${searchTerm},localite.ilike.${searchTerm}`)
        }
        
        // Pagination
        query = query.range(offset, offset + limit - 1)
        
        const { data, error, count } = await query
        
        if (error) throw error
        
        // Normaliser les données pour compatibilité
        const praticiens = (data || []).map(item => ({
          id: item.id,
          nom: item.nom || '',
          prenom: item.prenom || '',
          mail: item.mail || '',
          institution: item.institution || '',
          localite: item.localite || '',
          // Versions avec majuscules pour compatibilité
          Nom: item.nom || '',
          Prenom: item.prenom || '',
          Mail: item.mail || '',
          Institution: item.institution || '',
          Localite: item.localite || '',
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }))
        
        this.items = praticiens
        this.total = count || 0
        
        return { items: this.items, total: this.total }
      } catch (error) {
        console.error('❌ [PRATICIENS STORE] Fetch error:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async createPraticien(data) {
      this.loading = true
      this.error = null
      
      try {
        const praticienData = {
          nom: data.nom || data.Nom || '',
          prenom: data.prenom || data.Prenom || '',
          mail: data.mail || data.Mail || null,
          institution: data.institution || data.Institution || null,
          localite: data.localite || data.Localite || null,
        }
        
        // Ne pas envoyer l'ID, Supabase va le générer automatiquement
        const { data: newData, error } = await supabase
          .from('praticiens_formateurs')
          .insert([praticienData])
          .select()
          .single()
        
        if (error) {
          console.error('❌ [PRATICIENS STORE] Erreur Supabase détaillée:', error)
          
          // Messages d'erreur plus explicites
          if (error.code === '42P01') {
            throw new Error('La table praticiens_formateurs n\'existe pas dans Supabase. Veuillez exécuter le script SQL de migration : supabase_migrations/create_praticiens_formateurs_table.sql')
          } else if (error.code === '42501') {
            throw new Error('Permissions insuffisantes. Vérifiez que vous êtes admin ou editor.')
          } else {
            throw new Error(`Erreur Supabase: ${error.message || error.hint || 'Erreur inconnue'}`)
          }
        }
        
        const newPraticien = {
          id: newData.id,
          nom: newData.nom,
          prenom: newData.prenom,
          mail: newData.mail,
          institution: newData.institution,
          localite: newData.localite,
          Nom: newData.nom,
          Prenom: newData.prenom,
          Mail: newData.mail,
          Institution: newData.institution,
          Localite: newData.localite,
          createdAt: newData.created_at,
          updatedAt: newData.updated_at
        }
        
        // Ajouter au début de la liste locale
        this.items.unshift(newPraticien)
        this.total += 1
        
        return newPraticien
      } catch (error) {
        console.error('❌ [PRATICIENS STORE] Create error:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    async updatePraticien(id, form) {
      this.error = null
      
      try {
        const updateData = {
          nom: form.nom || form.Nom || '',
          prenom: form.prenom || form.Prenom || '',
          mail: form.mail || form.Mail || null,
          institution: form.institution || form.Institution || null,
          localite: form.localite || form.Localite || null,
        }
        
        const { data, error } = await supabase
          .from('praticiens_formateurs')
          .update(updateData)
          .eq('id', id)
          .select()
          .single()
        
        if (error) throw error
        
        // Mettre à jour dans la liste locale
        const index = this.items.findIndex(p => p.id === id)
        if (index !== -1) {
          this.items[index] = {
            id: data.id,
            nom: data.nom,
            prenom: data.prenom,
            mail: data.mail,
            institution: data.institution,
            localite: data.localite,
            Nom: data.nom,
            Prenom: data.prenom,
            Mail: data.mail,
            Institution: data.institution,
            Localite: data.localite,
            createdAt: data.created_at,
            updatedAt: data.updated_at
          }
        }
        
        return this.items[index]
      } catch (error) {
        console.error('❌ [PRATICIENS STORE] Update error:', error)
        this.error = error.message
        throw error
      }
    },

    async deletePraticien(id) {
      this.loading = true
      this.error = null
      
      try {
        const { error } = await supabase
          .from('praticiens_formateurs')
          .delete()
          .eq('id', id)
        
        if (error) throw error
        
        // Supprimer de la liste locale
        this.items = this.items.filter(p => p.id !== id)
        this.total = Math.max(0, this.total - 1)
        
      } catch (error) {
        console.error('❌ [PRATICIENS STORE] Delete error:', error)
        this.error = error.message
        throw error
      } finally {
        this.loading = false
      }
    },

    // Méthode pour récupérer un praticien par ID
    async getPraticienById(id) {
      try {
        const { data, error } = await supabase
          .from('praticiens_formateurs')
          .select('*')
          .eq('id', id)
          .single()
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Pas trouvé
            return null
          }
          throw error
        }
        
        if (data) {
          const praticien = {
            id: data.id,
            nom: data.nom || '',
            prenom: data.prenom || '',
            mail: data.mail || '',
            institution: data.institution || '',
            localite: data.localite || '',
            // Versions avec majuscules pour compatibilité
            Nom: data.nom || '',
            Prenom: data.prenom || '',
            Mail: data.mail || '',
            Institution: data.institution || '',
            Localite: data.localite || '',
            createdAt: data.created_at,
            updatedAt: data.updated_at
          }
          return praticien
        }
        
        return null
      } catch (error) {
        console.error('❌ [PRATICIENS STORE] Get praticien error:', error)
        throw error
      }
    },
  },
})