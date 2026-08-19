import { defineStore } from 'pinia';
import apiClient from '@/service/apiClient';

function requireList(payload, operation) {
  if (!Array.isArray(payload)) throw new Error(`${operation}: réponse serveur invalide`);
  return payload;
}

function requirePersistedEntity(payload, operation) {
  const entity = Array.isArray(payload) ? payload[0] : payload;
  if (!entity || typeof entity !== 'object' || !entity.id) {
    throw new Error(`${operation}: aucune donnée persistée`);
  }
  return entity;
}

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
        this.feedbackas = requireList(response.data, 'Chargement des évaluations');
        return this.feedbackas;
      } catch (e) {
        this.error = 'Failed to fetch feedbackas.';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async fetchFeedbacka(id, params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get(`/feedbacka/${id}`, { params });
        this.current = requirePersistedEntity(response.data, 'Chargement de l’évaluation');
        return this.current;
      } catch (e) {
        this.error = 'Failed to fetch feedbacka.';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async createFeedbacka(payload) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.post('/feedbacka', payload);
        this.current = requirePersistedEntity(response.data, 'Création de l’évaluation');
        return this.current;
      } catch (e) {
        this.error = 'Failed to create feedbacka.';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async updateFeedbacka(id, payload) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.put(`/feedbacka/${id}`, payload);
        this.current = requirePersistedEntity(response.data, 'Mise à jour de l’évaluation');
        if (this.current.id !== id) throw new Error('L’évaluation retournée ne correspond pas à celle modifiée.');
        return this.current;
      } catch (e) {
        this.error = 'Failed to update feedbacka.';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async testFeedbacka(id, answerText, params = {}) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.post(`/feedbacka/${id}/test`, { answer_text: answerText }, { params });
        if (!response.data || typeof response.data !== 'object') throw new Error('Test non confirmé par le serveur.');
        return response.data;
      } catch (e) {
        this.error = 'Failed to test evaluation.';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async submitAnswer(id, payload) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.post(`/feedbacka/${id}/submit`, payload);
        if (!response.data || typeof response.data !== 'object') throw new Error('Soumission non confirmée par le serveur.');
        return response.data;
      } catch (e) {
        this.error = 'Failed to submit answer.';
        throw e;
      } finally {
        this.loading = false;
      }
    },

    async fetchSubmissions(id) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get(`/feedbacka/${id}/submissions`);
        this.submissions = requireList(response.data, 'Chargement des soumissions');
        return this.submissions;
      } catch (e) {
        this.error = 'Failed to fetch submissions.';
        throw e;
      } finally {
        this.loading = false;
      }
    },
  },
});
