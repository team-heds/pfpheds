/**
 * Store Pinia pour la gestion des Places (PFP) via Supabase
 */
import { defineStore } from 'pinia';
import { supabase } from '@/supabase';

export const usePlacesStore = defineStore('places', {
  state: () => ({
    places: [],
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Récupérer une place par son ID
     */
    getPlaceById: (state) => (id) => {
      return state.places.find(place => place.PlaceId === id);
    },

    /**
     * Récupérer les places d'une institution
     */
    getPlacesByInstitution: (state) => (institutionId) => {
      return state.places.filter(place => place.InstitutionId === institutionId);
    },

    /**
     * Filtrer les places par spécialités
     */
    getPlacesBySpecialties: (state) => (specialties) => {
      return state.places.filter(place => {
        return specialties.some(specialty => place[specialty] === true);
      });
    },

    /**
     * Filtrer les places par langue
     */
    getPlacesByLanguage: (state) => (languages) => {
      return state.places.filter(place => {
        return languages.some(lang => place[lang] === true);
      });
    },

    /**
     * Récupérer les places avec fichier PDF
     */
    getPlacesWithFiles: (state) => {
      return state.places.filter(place => place.fileURL !== null && place.fileURL !== '');
    },
  },

  actions: {
    /**
     * Récupérer toutes les places
     */
    async fetchPlaces() {
      this.loading = true;
      this.error = null;

      try {
        const { data, error } = await supabase
          .from('places')
          .select('*');

        if (error) throw error;

        this.places = data || [];
        console.log('✅ Places chargées depuis Supabase:', this.places.length);
        return this.places;
      } catch (error) {
        console.error('❌ Erreur fetch places:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Récupérer une place par ID
     */
    async fetchPlaceById(id) {
      this.loading = true;
      this.error = null;

      try {
        const { data, error } = await supabase
          .from('places')
          .select('*')
          .eq('PlaceId', id)
          .single();

        if (error) throw error;

        if (data) {
          // Mettre à jour le store si la place existe déjà
          const index = this.places.findIndex(p => p.PlaceId === id);
          if (index !== -1) {
            this.places[index] = data;
          } else {
            this.places.push(data);
          }
        }

        return data;
      } catch (error) {
        console.error('❌ Erreur fetch place by ID:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Récupérer les places d'une institution
     */
    async fetchPlacesByInstitution(institutionId) {
      this.loading = true;
      this.error = null;

      try {
        const { data, error } = await supabase
          .from('places')
          .select('*')
          .eq('InstitutionId', institutionId);

        if (error) throw error;

        return data || [];
      } catch (error) {
        console.error('❌ Erreur fetch places by institution:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Créer une nouvelle place
     */
    async createPlace(placeData) {
      this.loading = true;
      this.error = null;

      try {
        const { data, error } = await supabase
          .from('places')
          .insert(placeData)
          .select()
          .single();

        if (error) throw error;

        this.places.push(data);
        console.log('✅ Place créée:', data.PlaceId);
        return data;
      } catch (error) {
        console.error('❌ Erreur création place:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Mettre à jour une place
     */
    async updatePlace(id, updates) {
      this.loading = true;
      this.error = null;

      try {
        console.log('📤 Envoi de la mise à jour à Supabase:', { id, updates });
        
        const { data, error } = await supabase
          .from('places')
          .update(updates)
          .eq('PlaceId', id)
          .select()
          .single();

        if (error) {
          console.error('❌ Erreur Supabase:', error);
          throw error;
        }

        console.log('📦 Réponse Supabase:', data);
        
        // Mettre à jour le store local
        const index = this.places.findIndex(p => p.PlaceId === id);
        if (index !== -1) {
          this.places[index] = { ...this.places[index], ...data };
          console.log('✅ Place mise à jour localement:', this.places[index]);
        } else {
          console.warn('⚠️ Place non trouvée dans le store local:', id);
        }

        console.log('✅ Place mise à jour:', id);
        return data;
      } catch (error) {
        console.error('❌ Erreur mise à jour place:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Supprimer une place
     */
    async deletePlace(id) {
      this.loading = true;
      this.error = null;

      try {
        const { error } = await supabase
          .from('places')
          .delete()
          .eq('PlaceId', id);

        if (error) throw error;

        // Retirer du store local
        this.places = this.places.filter(p => p.PlaceId !== id);
        console.log('✅ Place supprimée:', id);
      } catch (error) {
        console.error('❌ Erreur suppression place:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Rechercher des places par nom ou remarques
     */
    async searchPlaces(searchTerm) {
      if (!searchTerm || searchTerm.trim() === '') {
        return this.places;
      }

      return this.places.filter(place => {
        const nomMatch = place.NomPlace?.toLowerCase().includes(searchTerm.toLowerCase());
        const remarquesMatch = JSON.stringify(place.Remarques).toLowerCase().includes(searchTerm.toLowerCase());
        return nomMatch || remarquesMatch;
      });
    },
  },
});
