import { defineStore } from 'pinia';

const API_URL = '/api/praticiens_formateurs'; // Using the backend proxy

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
        let url = API_URL;
        
        // Add search query parameter if provided
        if (searchQuery) {
          url += `?q=${encodeURIComponent(searchQuery)}`;
        }

        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        this.praticiensFormateurs = await response.json();
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
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(praticienData),
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorBody.error || 'Failed to create praticien formateur');
        }
        const newPraticien = await response.json();
        this.praticiensFormateurs.push(newPraticien);
        return newPraticien;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async updatePraticienFormateur(praticienId, updateData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/${praticienId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updateData),
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorBody.error || 'Failed to update praticien formateur');
        }
        const updatedPraticien = await response.json();
        const index = this.praticiensFormateurs.findIndex(p => p.id === praticienId);
        if (index !== -1) {
          this.praticiensFormateurs[index] = updatedPraticien;
        }
        return updatedPraticien;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async deletePraticienFormateur(praticienId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/${praticienId}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorBody.error || 'Failed to delete praticien formateur');
        }
        this.praticiensFormateurs = this.praticiensFormateurs.filter(p => p.id !== praticienId);
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
});
