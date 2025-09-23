import { defineStore } from 'pinia';

const API_URL = '/api/institutions'; // Using the backend proxy

export const useInstitutionsStore = defineStore('institutions', {
  state: () => ({
    institutions: [],
    currentInstitution: null,
    loading: false,
    error: null,
  }),
  getters: {
    getInstitutionById: (state) => (id) => {
      return state.institutions.find(institution => 
        institution.InstitutionId === id || 
        institution.id === id ||
        institution.InstitutionId === parseInt(id) ||
        institution.id === parseInt(id)
      );
    },
    getInstitutionNameById: (state) => (id) => {
      const institution = state.institutions.find(institution => 
        institution.InstitutionId === id || 
        institution.id === id ||
        institution.InstitutionId === parseInt(id) ||
        institution.id === parseInt(id)
      );
      return institution?.Name || institution?.name || 'Institution inconnue';
    }
  },
  actions: {
    async fetchInstitutions() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const institutions = await response.json();
        this.institutions = institutions.map(inst => {
          if (inst.ImageURL && typeof inst.ImageURL === 'string') {
            try {
              inst.ImageURL = JSON.parse(inst.ImageURL);
            } catch (e) {
              console.error(`Failed to parse ImageURL for institution ${inst.InstitutionId}:`, inst.ImageURL);
              inst.ImageURL = [];
            }
          }
          return inst;
        });
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async fetchInstitutionById(id) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch institution');
        this.currentInstitution = await response.json();
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async createInstitution(institutionData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(institutionData),
        });
        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
          throw new Error(errorBody.error || 'Failed to create institution');
        }
        const newInstitution = await response.json();
        this.institutions.push(newInstitution);
        return newInstitution;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async updateInstitution(id, institutionData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(institutionData),
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            throw new Error(errorBody.error || 'Failed to update institution');
        }
        let updatedInstitution = await response.json();
        if (updatedInstitution.ImageURL && typeof updatedInstitution.ImageURL === 'string') {
          try {
            updatedInstitution.ImageURL = JSON.parse(updatedInstitution.ImageURL);
          } catch (e) {
            updatedInstitution.ImageURL = [];
          }
        }
        const index = this.institutions.findIndex(i => i.InstitutionId === id);
        if (index !== -1) {
          this.institutions[index] = updatedInstitution;
        }
        return updatedInstitution;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async deleteInstitution(id) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
            const errorBody = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
            throw new Error(errorBody.error || 'Failed to delete institution');
        }
        this.institutions = this.institutions.filter(i => i.InstitutionId !== id);
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
});
