/**
 * @module postsStore
 * @description Store Pinia pour la gestion des posts du réseau social éducatif.
 * Communique avec l'API backend via Axios.
 *
 * @state {Array} posts - Liste des posts chargés
 * @state {boolean} loading - Indicateur de chargement
 * @state {string|null} error - Dernier message d'erreur
 *
 * @action fetchPosts() - Récupère tous les posts depuis l'API
 * @action createPost(postData) - Crée un nouveau post
 * @action updatePost(id, postData) - Met à jour un post existant
 * @action deletePost(id) - Supprime un post
 */
import { defineStore } from 'pinia';
import apiClient from '@/service/apiClient';

function requireList(payload, operation) {
  if (!Array.isArray(payload)) throw new Error(`${operation}: réponse serveur invalide`)
  return payload
}

function requirePersistedPost(payload, operation) {
  const post = Array.isArray(payload) ? payload[0] : payload
  if (!post || typeof post !== 'object' || !post.id) {
    throw new Error(`${operation}: aucune publication persistée`)
  }
  return post
}

export const usePostsStore = defineStore('posts', {
  state: () => ({
    posts: [],
    loading: false,
    error: null,
  }),

  actions: {
    /**
     * Fetches all top-level posts from the backend.
     */
    async fetchPosts() {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.get('/posts');
        this.posts = requireList(response.data, 'Chargement des publications');
        return this.posts;
      } catch (error) {
        this.error = 'Failed to fetch posts.';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Creates a new post or a reply.
     * @param {object} postData - The data for the new post.
     * @param {string} postData.author_id - The UUID of the author.
     * @param {string} postData.content - The content of the post.
     * @param {string|null} [postData.parent_id] - The ID of the parent post if it's a reply.
     * @param {string|null} [postData.community_id] - The ID of the community.
     */
    async createPost(postData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.post('/posts', postData);
        const persistedPost = requirePersistedPost(response.data, 'Création de la publication');
        // If it's a top-level post, add it to the start of the list
        if (!postData.parent_id) {
            this.posts.unshift(persistedPost);
        } else {
            // If it's a reply, you might want to update the parent post's reply count
            // or handle it differently depending on your UI needs.
            // Reply created successfully
        }
        return persistedPost;
      } catch (error) {
        this.error = 'Failed to create post.';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Updates an existing post.
     * @param {string} postId - The ID of the post to update.
     * @param {object} updateData - The data to update.
     * @param {string} [updateData.content] - The new content.
     */
    async updatePost(postId, updateData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.put(`/posts/${postId}`, updateData);
        const persistedPost = requirePersistedPost(response.data, 'Mise à jour de la publication');
        if (persistedPost.id !== postId) throw new Error('La publication retournée ne correspond pas à la publication modifiée');
        const index = this.posts.findIndex(p => p.id === postId);
        if (index !== -1) {
          this.posts[index] = { ...this.posts[index], ...persistedPost };
        }
        return persistedPost;
      } catch (error) {
        this.error = 'Failed to update post.';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /**
     * Deletes a post.
     * @param {string} postId - The ID of the post to delete.
     */
    async deletePost(postId) {
      this.loading = true;
      this.error = null;
      try {
        const response = await apiClient.delete(`/posts/${postId}`);
        const deletedId = response.data?.id || response.data?.deletedId || response.data?.deletedPost?.id;
        if (deletedId !== postId && response.data?.success !== true) {
          throw new Error('Suppression non confirmée par le serveur');
        }
        this.posts = this.posts.filter(p => p.id !== postId);
        return true;
      } catch (error) {
        this.error = 'Failed to delete post.';
        console.error(error);
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
