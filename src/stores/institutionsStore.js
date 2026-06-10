import { defineStore } from 'pinia'

/**
 * ===========================
 *  Config & helpers Supabase
 * ===========================
 */

// Base REST Supabase : adapte si besoin via .env
const REST_BASE = import.meta.env.VITE_SUPABASE_REST_URL
  // Exemple d’URL: https://api2.hedsvs.ch/rest/v1
  // Si non défini, on tombe sur prod api2 (modifie si nécessaire)
  || 'https://api2.hedsvs.ch/rest/v1'

const ANON_KEY = import.meta.env.VITE_SUPABASE_KEY // <-- ton anon key

if (!ANON_KEY) {
  console.error('[InstitutionsStore] VITE_SUPABASE_KEY manquant dans .env')
}
if (!REST_BASE) {
  console.error('[InstitutionsStore] VITE_SUPABASE_REST_URL manquant (fallback utilisé)')
}

// En-têtes communs pour PostgREST
const baseHeaders = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  Accept: 'application/json',
}

/**
 * Wrapper fetch → PostgREST
 */
async function sbFetch(path, options = {}) {
  const url = `${REST_BASE}${path}`
  const res = await fetch(url, {
    ...options,
    headers: {
      ...baseHeaders,
      ...(options.headers || {}),
    },
  })
  if (!res.ok) {
    let detail = ''
    try {
      const err = await res.json()
      detail = err?.message || err?.error || JSON.stringify(err)
    } catch {
      detail = res.statusText
    }
    throw new Error(`[${res.status}] ${detail}`)
  }
  // Certaines réponses (DELETE sans return=representation) n’ont pas de JSON
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

/**
 * Utils
 */
function normalizeInstitution(inst) {
  if (inst && typeof inst.is_hidden !== 'boolean') {
    inst.is_hidden =
      inst.is_hidden === true ||
      inst.is_hidden === 1 ||
      inst.is_hidden === '1' ||
      (typeof inst.is_hidden === 'string' && inst.is_hidden.toLowerCase() === 'true')
  }
  // ImageURL renvoyé parfois stringifiable → on homogénéise en array
  if (inst?.ImageURL && typeof inst.ImageURL === 'string') {
    try {
      const parsed = JSON.parse(inst.ImageURL)
      inst.ImageURL = Array.isArray(parsed) ? parsed : [parsed]
    } catch {
      // si c'est une string simple (URL unique)
      if (inst.ImageURL.startsWith('http')) inst.ImageURL = [inst.ImageURL]
      else inst.ImageURL = []
    }
  }
  if (!Array.isArray(inst?.ImageURL)) inst.ImageURL = inst?.ImageURL ? [inst.ImageURL] : []
  return inst
}

export const useInstitutionsStore = defineStore('institutions', {
  state: () => ({
    institutions: [],
    currentInstitution: null,
    loading: false,
    error: null,
  }),

  getters: {
    getInstitutionById: (state) => (id) => {
      const numId = Number.isNaN(Number(id)) ? null : Number(id)
      return state.institutions.find((i) =>
        i.InstitutionId === id ||
        i.id === id ||
        (numId !== null && (i.InstitutionId === numId || i.id === numId))
      )
    },
    getInstitutionNameById: (state) => (id) => {
      const inst = state.institutions.find((i) =>
        i.InstitutionId === id ||
        i.id === id ||
        i.InstitutionId === parseInt(id) ||
        i.id === parseInt(id)
      )
      return inst?.Name || inst?.name || 'Institution inconnue'
    },
  },

  actions: {
    async fetchInstitutions() {
      this.loading = true
      this.error = null
      try {
        // PostgREST: /institutions?select=*  (select=* facultatif)
        const data = await sbFetch(`/institutions?select=*`)
        this.institutions = (Array.isArray(data) ? data : []).map(normalizeInstitution)
        return this.institutions
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
        // Filtre eq sur la clé (ici on suppose InstitutionId)
        // Adapte si ton PK est différent (id vs InstitutionId)
        const q = encodeURIComponent(`eq.${id}`)
        const rows = await sbFetch(`/institutions?InstitutionId=${q}&select=*`)
        const inst = Array.isArray(rows) && rows.length ? normalizeInstitution(rows[0]) : null
        this.currentInstitution = inst
        return inst
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
        const data = await sbFetch(`/institutions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Retourne la ligne insérée
            Prefer: 'return=representation',
          },
          body: JSON.stringify(payload),
        })
        const row = Array.isArray(data) ? data[0] : data
        const created = normalizeInstitution(row)
        this.institutions.push(created)
        return created
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },

    async updateInstitution(id, patch) {
      this.loading = true
      this.error = null
      try {
        const q = encodeURIComponent(`eq.${id}`)
        const data = await sbFetch(`/institutions?InstitutionId=${q}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(patch),
        })
        const row = Array.isArray(data) ? data[0] : data
        const updated = normalizeInstitution(row)

        const idx = this.institutions.findIndex((i) => i.InstitutionId === id || i.id === id)
        if (idx !== -1) this.institutions[idx] = updated
        else this.institutions.push(updated)

        if (this.currentInstitution?.InstitutionId === id || this.currentInstitution?.id === id) {
          this.currentInstitution = updated
        }
        return updated
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
        const q = encodeURIComponent(`eq.${id}`)
        await sbFetch(`/institutions?InstitutionId=${q}`, {
          method: 'DELETE',
          headers: {
            // Si tu veux récupérer la ligne supprimée :
            // Prefer: 'return=representation'
          },
        })
        this.institutions = this.institutions.filter((i) => i.InstitutionId !== id && i.id !== id)
        if (this.currentInstitution?.InstitutionId === id || this.currentInstitution?.id === id) {
          this.currentInstitution = null
        }
      } catch (e) {
        this.error = e.message
        throw e
      } finally {
        this.loading = false
      }
    },
  },
})

 
