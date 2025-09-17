import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

export const useHashtagsStore = defineStore('hashtags', {
  state: () => ({
    hashtags: []
  }),
  actions: {
    async fetchHashtags() {
      try {
        const response = await axios.get(`${API_URL}/hashtags`)
        this.hashtags = response.data
      } catch (error) {
        console.error('Error fetching hashtags:', error)
      }
    },
    async addHashtag(newHashtag) {
      try {
        const response = await axios.post(`${API_URL}/hashtags`, newHashtag)
        this.hashtags.push(response.data)
      } catch (error) {
        console.error('Error adding hashtag:', error)
      }
    },
    async updateHashtag(code, updates) {
      try {
        const response = await axios.put(`${API_URL}/hashtags/${code}`, updates)
        const index = this.hashtags.findIndex(h => h.code === code)
        if (index !== -1) {
          this.hashtags[index] = response.data
        }
      } catch (error) {
        console.error('Error updating hashtag:', error)
      }
    },
    async deleteHashtag(code) {
      try {
        await axios.delete(`${API_URL}/hashtags/${code}`)
        this.hashtags = this.hashtags.filter(h => h.code !== code)
      } catch (error) {
        console.error('Error deleting hashtag:', error)
      }
    }
  }
})
