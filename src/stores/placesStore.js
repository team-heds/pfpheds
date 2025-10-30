/**
 * Store Pinia pour la gestion des Places (PFP) via Supabase
 */
import { defineStore } from 'pinia';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

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
        const response = await fetch(`${SUPABASE_URL}/rest/v1/places?select=*`, {
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        this.places = await response.json();
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
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/places?PlaceId=eq.${id}&select=*`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        const data = await response.json();
        const place = data[0];

        if (place) {
          // Mettre à jour le store si la place existe déjà
          const index = this.places.findIndex(p => p.PlaceId === id);
          if (index !== -1) {
            this.places[index] = place;
          } else {
            this.places.push(place);
          }
        }

        return place;
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
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/places?InstitutionId=eq.${institutionId}&select=*`,
          {
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

        return await response.json();
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
        const response = await fetch(`${SUPABASE_URL}/rest/v1/places`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(placeData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
        }

        const newPlace = await response.json();
        this.places.push(newPlace[0]);
        console.log('✅ Place créée:', newPlace[0].PlaceId);
        return newPlace[0];
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
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/places?PlaceId=eq.${id}`,
          {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(updates),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Erreur HTTP: ${response.status}`);
        }

        const updatedPlace = await response.json();
        
        // Mettre à jour le store local
        const index = this.places.findIndex(p => p.PlaceId === id);
        if (index !== -1) {
          this.places[index] = { ...this.places[index], ...updatedPlace[0] };
        }

        console.log('✅ Place mise à jour:', id);
        return updatedPlace[0];
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
        const response = await fetch(
          `${SUPABASE_URL}/rest/v1/places?PlaceId=eq.${id}`,
          {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_KEY,
              'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }

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
