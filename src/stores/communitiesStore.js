import { defineStore } from 'pinia';

const API_URL = '/api/communities'; // Backend proxy endpoint

export const useCommunitiesStore = defineStore('communities', {
  state: () => ({
    communities: [],
    currentCommunity: null,
    loading: false,
    error: null,
  }),
  actions: {
    async fetchCommunities() {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(API_URL);
        if (!response.ok) {
          throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        this.communities = await response.json();
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchCommunityById(id) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/${id}`);
        if (!response.ok) throw new Error('Failed to fetch community');
        this.currentCommunity = await response.json();
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    async createCommunity(communityData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(communityData),
        });
        if (!response.ok) throw new Error('Failed to create community');
        const newCommunity = await response.json();
        this.communities.push(newCommunity);
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    async updateCommunity(id, communityData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(communityData),
        });
        if (!response.ok) throw new Error('Failed to update community');
        const updatedCommunity = await response.json();
        const index = this.communities.findIndex(c => c.id === id);
        if (index !== -1) {
          this.communities[index] = updatedCommunity;
        }
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    async deleteCommunity(id) {
      this.loading = true;
      this.error = null;
      try {
        const response = await fetch(`${API_URL}/${id}`, {
          method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete community');
        this.communities = this.communities.filter(c => c.id !== id);
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },
  },
});
