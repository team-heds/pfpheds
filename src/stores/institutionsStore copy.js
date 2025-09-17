import { defineStore } from 'pinia'

const API_URL = '/api/institutions' // proxy Vite vers backend

export const useInstitutionsStore = defineStore('institutions', {
  state: () => ({
    institutions: [],
    currentInstitution: null,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchInstitutions() {
      this.loading = true
      this.error = null
      try {
        const r = await fetch(API_URL)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = await r.json()
        // Optionnel : normaliser ImageURL si c'est un TEXT contenant du JSON
        this.institutions = data.map(inst => {
          if (typeof inst.ImageURL === 'string') {
            try { inst.ImageURL = JSON.parse(inst.ImageURL) } catch { /* ignore */ }
          }
          return inst
        })
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async fetchInstitutionById(id) {
      this.loading = true
      this.error = null
      try {
        const r = await fetch(`${API_URL}/${encodeURIComponent(id)}`)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        this.currentInstitution = await r.json()
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async createInstitution(payload) {
      this.loading = true
      this.error = null
      try {
        const r = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const json = await r.json().catch(() => null)
        if (!r.ok) throw new Error(json?.error || `HTTP ${r.status}`)
        this.institutions.push(json)
        return json
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateInstitution(id, payload) {
      this.loading = true
      this.error = null
      try {
        const r = await fetch(`${API_URL}/${encodeURIComponent(id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        const json = await r.json().catch(() => null)
        if (!r.ok) throw new Error(json?.error || `HTTP ${r.status}`)

        const idx = this.institutions.findIndex(i => i.InstitutionId === id)
        if (idx !== -1) this.institutions[idx] = json
        if (this.currentInstitution?.InstitutionId === id) this.currentInstitution = json
        return json
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteInstitution(id) {
      this.loading = true
      this.error = null
      try {
        const r = await fetch(`${API_URL}/${encodeURIComponent(id)}`, { method: 'DELETE' })
        if (!r.ok) {
          const text = await r.text().catch(() => '')
          throw new Error(text || `HTTP ${r.status}`)
        }
        this.institutions = this.institutions.filter(i => i.InstitutionId !== id)
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },
  },
})
