// stores/praticiensStore.js
import { defineStore } from 'pinia'

// Backend Express local
const API_BASE = 'http://localhost:3000'
const API_URL  = `${API_BASE}/api/praticiens`

export const usePraticiensStore = defineStore('praticiens', {
  state: () => ({
    items: [],
    total: 0,
    loading: false,
    error: null,
  }),

  actions: {
    async fetchPraticiens(searchQuery = '', { limit = 50, offset = 0 } = {}) {
      this.loading = true
      this.error = null
      try {
        const params = new URLSearchParams()
        if (searchQuery) params.set('q', searchQuery)
        params.set('limit', String(limit))
        params.set('offset', String(offset))

        const res = await fetch(`${API_URL}?${params.toString()}`)
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)

        const payload = await res.json()
        this.items = Array.isArray(payload) ? payload : (payload.items ?? [])
        this.total = Array.isArray(payload) ? this.items.length : (payload.count ?? this.items.length)
        return { items: this.items, total: this.total }
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async createPraticien(data) {
      this.loading = true
      this.error = null
      try {
        const res = await fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom: data.nom,
            prenom: data.prenom,
            mail: data.mail ?? null,
            institution: data.institution ?? null,
            localite: data.localite ?? null,
          }),
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
        this.items.unshift(json)
        this.total += 1
        return json
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

// stores/praticiensStore.js (action updatePraticien)
// stores/praticiensStore.js (action updatePraticien)
async updatePraticien(id, form) {
  this.error = null
  try {
    const res = await fetch(`${API_URL}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nom: form.nom,
        prenom: form.prenom,
        mail: form.mail ?? null,
        institution: form.institution ?? null,
        localite: form.localite ?? null,
      }),
    })

    const json = await res.json().catch(() => ({}))

    // ✅ un seul test d'erreur, avec message provenant du backend
    if (!res.ok) {
      const msg = json?.error || `${res.status} ${res.statusText}`
      throw new Error(msg)
    }

    const i = this.items.findIndex(p => p.id === id)
    if (i !== -1) this.items[i] = json
    return json
  } catch (e) {
    this.error = e.message
    throw e
  }
}
,


    async deletePraticien(id) {
      this.loading = true
      this.error = null
      try {
        const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json?.error || `HTTP ${res.status}`)
        }
        this.items = this.items.filter(p => p.id !== id)
        this.total = Math.max(0, this.total - 1)
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },
  },
})
