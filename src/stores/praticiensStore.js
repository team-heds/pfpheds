// stores/praticiensStore.js
import { defineStore } from 'pinia'
import { db } from '../../firebase.js'
import { ref, push, set, update, remove, onValue, off } from 'firebase/database'

export const usePraticiensStore = defineStore('praticiens', {
  state: () => ({
    items: [],
    total: 0,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchPraticiens(searchQuery = '', { limit = 50, offset = 0 } = {}) {
      this.loading = true
      this.error = null
      
      try {
        console.log('🔍 [PRATICIENS STORE] Fetching praticiens from Firebase...')
        
        const praticiensRef = ref(db, 'PraticienFormateurs')
        
        return new Promise((resolve, reject) => {
          onValue(praticiensRef, (snapshot) => {
            try {
              const data = snapshot.val()
              let praticiens = []
              
              if (data) {
                // Convertir l'objet Firebase en array avec les IDs et normaliser les noms de champs
                praticiens = Object.keys(data).map(key => {
                  const item = data[key]
                  return {
                    id: key,
                    // Normaliser les noms de champs pour la compatibilité avec les composants
                    nom: item.Nom || item.nom || '',
                    prenom: item.Prenom || item.prenom || '',
                    mail: item.Mail || item.mail || '',
                    institution: item.Institution || item.institution || '',
                    localite: item.Localite || item.localite || '',
                    // Garder aussi les versions avec majuscules pour référence
                    Nom: item.Nom || item.nom || '',
                    Prenom: item.Prenom || item.prenom || '',
                    Mail: item.Mail || item.mail || '',
                    Institution: item.Institution || item.institution || '',
                    Localite: item.Localite || item.localite || '',
                    // Timestamps
                    createdAt: item.createdAt,
                    updatedAt: item.updatedAt
                  }
                })
              }
              
              // Filtrage par recherche si nécessaire
              if (searchQuery && searchQuery.trim()) {
                const query = searchQuery.toLowerCase().trim()
                praticiens = praticiens.filter(p => 
                  (p.nom && p.nom.toLowerCase().includes(query)) ||
                  (p.prenom && p.prenom.toLowerCase().includes(query)) ||
                  (p.mail && p.mail.toLowerCase().includes(query)) ||
                  (p.institution && p.institution.toLowerCase().includes(query)) ||
                  (p.localite && p.localite.toLowerCase().includes(query))
                )
              }
              
              // Tri par nom puis prénom
              praticiens.sort((a, b) => {
                const nomA = (a.nom || '').toLowerCase()
                const nomB = (b.nom || '').toLowerCase()
                if (nomA !== nomB) return nomA.localeCompare(nomB)
                
                const prenomA = (a.prenom || '').toLowerCase()
                const prenomB = (b.prenom || '').toLowerCase()
                return prenomA.localeCompare(prenomB)
              })
              
              // Pagination
              const start = offset
              const end = offset + limit
              const paginatedItems = praticiens.slice(start, end)
              
              this.items = paginatedItems
              this.total = praticiens.length
              
              console.log(`✅ [PRATICIENS STORE] Loaded ${paginatedItems.length}/${praticiens.length} praticiens`)
              
              resolve({ items: this.items, total: this.total })
            } catch (error) {
              console.error('❌ [PRATICIENS STORE] Error processing Firebase data:', error)
              this.error = error.message
              reject(error)
            } finally {
              this.loading = false
            }
          }, (error) => {
            console.error('❌ [PRATICIENS STORE] Firebase read error:', error)
            this.error = error.message
            this.loading = false
            reject(error)
          })
        })
      } catch (error) {
        console.error('❌ [PRATICIENS STORE] Fetch error:', error)
        this.error = error.message
        this.loading = false
        throw error
      }
    },

    async createPraticien(data) {
      this.loading = true
      this.error = null
      
      try {
        console.log('➕ [PRATICIENS STORE] Creating new praticien:', data)
        
        const praticiensRef = ref(db, 'PraticienFormateurs')
        const newPraticienRef = push(praticiensRef)
        
        const praticienData = {
          Nom: data.nom || data.Nom || '',
          Prenom: data.prenom || data.Prenom || '',
          Mail: data.mail || data.Mail || null,
          Institution: data.institution || data.Institution || null,
          Localite: data.localite || data.Localite || null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        
        await set(newPraticienRef, praticienData)
        
        const newPraticien = {
          id: newPraticienRef.key,
          ...praticienData
        }
        
        // Ajouter au début de la liste locale
        this.items.unshift(newPraticien)
        this.total += 1
        
        console.log('✅ [PRATICIENS STORE] Praticien created successfully:', newPraticien.id)
        
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
        console.log('📝 [PRATICIENS STORE] Updating praticien:', id, form)
        
        const praticienRef = ref(db, `PraticienFormateurs/${id}`)
        
        const updateData = {
          Nom: form.nom || form.Nom || '',
          Prenom: form.prenom || form.Prenom || '',
          Mail: form.mail || form.Mail || null,
          Institution: form.institution || form.Institution || null,
          Localite: form.localite || form.Localite || null,
          updatedAt: new Date().toISOString()
        }
        
        await update(praticienRef, updateData)
        
        // Mettre à jour dans la liste locale
        const index = this.items.findIndex(p => p.id === id)
        if (index !== -1) {
          this.items[index] = {
            ...this.items[index],
            ...updateData
          }
        }
        
        console.log('✅ [PRATICIENS STORE] Praticien updated successfully:', id)
        
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
        console.log('🗑️ [PRATICIENS STORE] Deleting praticien:', id)
        
        const praticienRef = ref(db, `PraticienFormateurs/${id}`)
        await remove(praticienRef)
        
        // Supprimer de la liste locale
        this.items = this.items.filter(p => p.id !== id)
        this.total = Math.max(0, this.total - 1)
        
        console.log('✅ [PRATICIENS STORE] Praticien deleted successfully:', id)
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
        console.log('🔍 [PRATICIENS STORE] Getting praticien by ID:', id)
        
        const praticienRef = ref(db, `PraticienFormateurs/${id}`)
        
        return new Promise((resolve, reject) => {
          onValue(praticienRef, (snapshot) => {
            const data = snapshot.val()
            if (data) {
              const praticien = {
                id: id,
                // Normaliser les noms de champs pour la compatibilité avec les composants
                nom: data.Nom || data.nom || '',
                prenom: data.Prenom || data.prenom || '',
                mail: data.Mail || data.mail || '',
                institution: data.Institution || data.institution || '',
                localite: data.Localite || data.localite || '',
                // Garder aussi les versions avec majuscules pour référence
                Nom: data.Nom || data.nom || '',
                Prenom: data.Prenom || data.prenom || '',
                Mail: data.Mail || data.mail || '',
                Institution: data.Institution || data.institution || '',
                Localite: data.Localite || data.localite || '',
                // Timestamps
                createdAt: data.createdAt,
                updatedAt: data.updatedAt
              }
              console.log('✅ [PRATICIENS STORE] Praticien found:', praticien)
              resolve(praticien)
            } else {
              console.log('❌ [PRATICIENS STORE] Praticien not found:', id)
              resolve(null)
            }
          }, (error) => {
            console.error('❌ [PRATICIENS STORE] Error getting praticien:', error)
            reject(error)
          })
        })
      } catch (error) {
        console.error('❌ [PRATICIENS STORE] Get praticien error:', error)
        throw error
      }
    },

    // Méthode pour nettoyer les listeners Firebase
    cleanup() {
      const praticiensRef = ref(db, 'PraticienFormateurs')
      off(praticiensRef)
    }
  },
})
