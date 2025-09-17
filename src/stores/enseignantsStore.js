import { defineStore } from 'pinia';

const API_URL = '/api/enseignants'; // Backend proxy endpoint

export const useEnseignantsStore = defineStore('enseignants', {
  state: () => ({
    enseignants: [],
    currentEnseignant: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchEnseignants() {
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error(`Network error: ${res.status} ${res.statusText}`);
        this.enseignants = await res.json();
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchEnseignantById(id) {
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch(`${API_URL}/${id}`);
        if (!res.ok) throw new Error('Failed to fetch enseignant');
        this.currentEnseignant = await res.json();
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    async createEnseignant(payload) {
      // payload attendu: { id, first_name, last_name, email }
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed to create enseignant');
        }
        const created = await res.json();
        this.enseignants.push(created);
        return created;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async updateEnseignant(id, updates) {
      // updates: { first_name?, last_name?, email? }
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch(`${API_URL}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          const msg = await res.text();
          throw new Error(msg || 'Failed to update enseignant');
        }
        const updated = await res.json();
        const idx = this.enseignants.findIndex(e => e.id === id);
        if (idx !== -1) this.enseignants[idx] = updated;
        if (this.currentEnseignant?.id === id) this.currentEnseignant = updated;
        return updated;
      } catch (e) {
        this.error = e.message;
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async deleteEnseignant(id) {
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete enseignant');
        this.enseignants = this.enseignants.filter(e => e.id !== id);
        if (this.currentEnseignant?.id === id) this.currentEnseignant = null;
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
  },
});