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
    lastFetchedAt: 0,
    fetchPromise: null,
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
    async fetchPlaces(options = {}) {
      this.loading = true;
      this.error = null;

      const debug = (...args) => {
        if (import.meta.env.DEV) console.log(...args);
      };

      try {
        const cacheTtlMs = 5 * 60 * 1000;
        const force = !!options.force;

        // Si une requête est déjà en cours, réutiliser la promesse
        if (this.fetchPromise) {
          return await this.fetchPromise;
        }

        // Cache simple: si on a déjà des données récentes, ne pas re-fetch
        if (!force && Array.isArray(this.places) && this.places.length > 0 && (Date.now() - this.lastFetchedAt) < cacheTtlMs) {
          return this.places;
        }

        this.fetchPromise = (async () => {
        // 1. Récupérer toutes les places
        const { data: placesData, error: placesError } = await supabase
          .from('places')
          .select('*');

        if (placesError) throw placesError;

        // 2. Récupérer toutes les institutions
        const { data: institutionsData, error: institutionsError } = await supabase
          .from('institutions')
          .select('*');

        if (institutionsError) {
          console.warn('⚠️ Impossible de charger les institutions:', institutionsError);
          // Continue sans les institutions
          this.places = placesData || [];
          this.lastFetchedAt = Date.now();
          return this.places;
        }

        // 3. Créer un map des institutions par ID
        const institutionsMap = {};
        (institutionsData || []).forEach(inst => {
          institutionsMap[inst.InstitutionId] = inst;
        });

        debug('📊 Institutions map:', institutionsMap);

        // 4. Enrichir les places avec le nom de l'institution
        this.places = (placesData || []).map(place => {
          const institution = institutionsMap[place.InstitutionId];
          
          if (!institution && place.InstitutionId) {
            console.warn(`⚠️ Institution non trouvée pour place ${place.NomPlace || place.PlaceId}, InstitutionId: ${place.InstitutionId}`);
          }
          
          // Le champ dans la table institutions s'appelle "Name" pas "InstitutionName"
          const institutionName = institution?.Name || place.Institution || 'N/A';

          debug(`📍 Place: ${place.NomPlace || place.PlaceId} → Institution: ${institutionName} (InstitutionId: ${place.InstitutionId})`);
          
          return {
            ...place,
            Institution_name: institutionName,
            institution_data: institution
          };
        });

        debug('✅ Places chargées depuis Supabase:', this.places.length);
        debug('✅ Institutions chargées:', Object.keys(institutionsMap).length);
        if (this.places.length > 0) {
          debug('✅ Exemple de place:', this.places[0]);
        }
        this.lastFetchedAt = Date.now();
        return this.places;
        })();

        return await this.fetchPromise;
      } catch (error) {
        console.error('❌ Erreur fetch places:', error);
        this.error = error.message;
        throw error;
      } finally {
        this.fetchPromise = null;
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
