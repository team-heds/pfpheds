import { defineStore } from 'pinia';
import axios from 'axios';

// Ensure you have a VITE_API_URL in your .env file, e.g., VITE_API_URL=http://localhost:3000/api
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
        const response = await axios.get(`${API_URL}/posts`);
        this.posts = response.data;
      } catch (error) {
        this.error = 'Failed to fetch posts.';
        console.error(error);
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
        const response = await axios.post(`${API_URL}/posts`, postData);
        // If it's a top-level post, add it to the start of the list
        if (!postData.parent_id) {
            this.posts.unshift(response.data[0]);
        } else {
            // If it's a reply, you might want to update the parent post's reply count
            // or handle it differently depending on your UI needs.
            // Reply created successfully
        }
        return response.data[0];
      } catch (error) {
        this.error = 'Failed to create post.';
        console.error(error);
        return null;
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
        const response = await axios.put(`${API_URL}/posts/${postId}`, updateData);
        const index = this.posts.findIndex(p => p.id === postId);
        if (index !== -1) {
          this.posts[index] = { ...this.posts[index], ...response.data };
        }
        return response.data;
      } catch (error) {
        this.error = 'Failed to update post.';
        console.error(error);
        return null;
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
        await axios.delete(`${API_URL}/posts/${postId}`);
        this.posts = this.posts.filter(p => p.id !== postId);
      } catch (error) {
        this.error = 'Failed to delete post.';
        console.error(error);
      } finally {
        this.loading = false;
      }
    },
  },
});
