import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const usePraticiensFormateursStore = defineStore('praticiensFormateurs', {
  state: () => ({
    praticiensFormateurs: [],
    loading: false,
    error: null,
  }),

  actions: {
    /**
     * Fetches praticiens formateurs from the backend, with an optional search query.
     * @param {string} [searchQuery] - A string to search for in name, prenom, or institution.
     */
    async fetchPraticiensFormateurs(searchQuery = '') {
      this.loading = true;
      this.error = null;
      try {
        const params = searchQuery ? { q: searchQuery } : {};
        const response = await axios.get(`${API_URL}/praticiens-formateurs`, { params });
        this.praticiensFormateurs = response.data;
      } catch (error) {
        this.error = 'Failed to fetch praticiens formateurs.';
        console.error(error);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Creates a new praticien formateur.
     * @param {object} praticienData - The data for the new praticien.
     */
    async createPraticienFormateur(praticienData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post(`${API_URL}/praticiens-formateurs`, praticienData);
        this.praticiensFormateurs.push(response.data);
        return response.data;
      } catch (error) {
        this.error = 'Failed to create praticien formateur.';
        console.error(error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Updates an existing praticien formateur.
     * @param {string} praticienId - The ID of the praticien to update.
     * @param {object} updateData - The data to update.
     */
    async updatePraticienFormateur(praticienId, updateData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.put(`${API_URL}/praticiens-formateurs/${praticienId}`, updateData);
        const index = this.praticiensFormateurs.findIndex(p => p.id === praticienId);
        if (index !== -1) {
          this.praticiensFormateurs[index] = { ...this.praticiensFormateurs[index], ...response.data };
        }
        return response.data;
      } catch (error) {
        this.error = 'Failed to update praticien formateur.';
        console.error(error);
        return null;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Deletes a praticien formateur.
     * @param {string} praticienId - The ID of the praticien to delete.
     */
    async deletePraticienFormateur(praticienId) {
      this.loading = true;
      this.error = null;
      try {
        await axios.delete(`${API_URL}/praticiens-formateurs/${praticienId}`);
        this.praticiensFormateurs = this.praticiensFormateurs.filter(p => p.id !== praticienId);
      } catch (error) {
        this.error = 'Failed to delete praticien formateur.';
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
  },
});
