import { defineStore } from 'pinia';
import apiClient from '@/service/apiClient';

export const useFeedbackaStore = defineStore('feedbacka', {
  state: () => ({
    feedbackas: [],
    current: null,
    submissions: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchFeedbackas(params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get('/feedbacka', { params });
        this.feedbackas = response.data || [];
        return this.feedbackas;
      } catch (e) {
        this.error = 'Failed to fetch feedbackas.';
        return [];
      } finally {
        this.loading = false;
      }
    },

    async fetchFeedbacka(id, params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get(`/feedbacka/${id}`, { params });
        this.current = response.data;
        return this.current;
      } catch (e) {
        this.error = 'Failed to fetch feedbacka.';
        return null;
      } finally {
        this.loading = false;
      }
    },

    async createFeedbacka(payload) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.post('/feedbacka', payload);
        this.current = response.data;
        return this.current;
      } catch (e) {
        this.error = 'Failed to create feedbacka.';
        return null;
      } finally {
        this.loading = false;
      }
    },

    async updateFeedbacka(id, payload) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.put(`/feedbacka/${id}`, payload);
        this.current = response.data;
        return this.current;
      } catch (e) {
        this.error = 'Failed to update feedbacka.';
        return null;
      } finally {
        this.loading = false;
      }
    },

    async testFeedbacka(id, answerText, params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.post(`/feedbacka/${id}/test`, { answer_text: answerText }, { params });
        return response.data;
      } catch (e) {
        this.error = 'Failed to test evaluation.';
        return null;
      } finally {
        this.loading = false;
      }
    },

    async submitAnswer(id, payload) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.post(`/feedbacka/${id}/submit`, payload);
        return response.data;
      } catch (e) {
        this.error = 'Failed to submit answer.';
        return null;
      } finally {
        this.loading = false;
      }
    },

    async fetchSubmissions(id) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get(`/feedbacka/${id}/submissions`);
        this.submissions = response.data || [];
        return this.submissions;
      } catch (e) {
        this.error = 'Failed to fetch submissions.';
        return [];
      } finally {
        this.loading = false;
      }
    },
  },
});
