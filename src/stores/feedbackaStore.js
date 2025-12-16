import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
        const response = await axios.get(`${API_URL}/feedbacka`, { params });
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
        const response = await axios.get(`${API_URL}/feedbacka/${id}`, { params });
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
        const response = await axios.post(`${API_URL}/feedbacka`, payload);
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
        const response = await axios.put(`${API_URL}/feedbacka/${id}`, payload);
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
        const response = await axios.post(`${API_URL}/feedbacka/${id}/test`, { answer_text: answerText }, { params });
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
        const response = await axios.post(`${API_URL}/feedbacka/${id}/submit`, payload);
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
        const response = await axios.get(`${API_URL}/feedbacka/${id}/submissions`, { params: { author_id: this.current?.author_id } });
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
