import { defineStore } from 'pinia'

/**
 * ===========================
 *  Document Store - FilePhysio
 * ===========================
 * Gère les dossiers et fichiers via l'API /api/filePhysio
 * Basé sur la logique de institutionsStore.js
 */

// Base REST Supabase : adapte si besoin via .env
const REST_BASE = import.meta.env.VITE_SUPABASE_REST_URL
  // Exemple d'URL: https://api2.hedsvs.ch/rest/v1
  // Si non défini, on tombe sur prod api2 (modifie si nécessaire)
  || 'https://api2.hedsvs.ch/rest/v1'

const ANON_KEY = import.meta.env.VITE_SUPABASE_KEY // <-- ton anon key

if (!ANON_KEY) {
  console.error('[DocumentStore] VITE_SUPABASE_KEY manquant dans .env')
}
if (!REST_BASE) {
  console.error('[DocumentStore] VITE_SUPABASE_REST_URL manquant (fallback utilisé)')
}

// En-têtes communs pour PostgREST
const baseHeaders = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
  Accept: 'application/json',
}

/**
 * Wrapper fetch pour gérer les requêtes API
 */
async function apiFetch(path, options = {}) {
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
  
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

export const useDocumentStore = defineStore('documents', {
  state: () => ({
    folders: [],           // Arborescence complète des dossiers
    topFolders: [],        // Dossiers racine uniquement
    currentFolder: null,   // Dossier actuellement sélectionné
    loading: false,
    error: null,
  }),

  getters: {
    /**
     * Récupère un dossier par ID
     */
    getFolderById: (state) => (id) => {
      // Cherche dans les dossiers racine
      let found = state.topFolders.find((f) => f.id === id)
      if (found) return found

      // Cherche dans les sous-dossiers
      for (const topFolder of state.topFolders) {
        if (topFolder.subFolders) {
          found = topFolder.subFolders.find((sf) => sf.id === id)
          if (found) return found
        }
      }
      return null
    },

    /**
     * Récupère tous les fichiers d'un dossier (incluant sous-dossiers)
     */
    getAllFilesFromFolder: (state) => (folderId) => {
      const folder = state.topFolders.find((f) => f.id === folderId)
      if (!folder) return []

      let allFiles = [...(folder.files || [])]

      // Ajoute les fichiers des sous-dossiers
      if (folder.subFolders) {
        for (const sub of folder.subFolders) {
          allFiles = [...allFiles, ...(sub.files || [])]
        }
      }

      return allFiles
    },

    /**
     * Compte total de fichiers
     */
    totalFilesCount: (state) => {
      let count = 0
      for (const folder of state.topFolders) {
        count += (folder.files || []).length
        if (folder.subFolders) {
          for (const sub of folder.subFolders) {
            count += (sub.files || []).length
          }
        }
      }
      return count
    },
  },

  actions: {
    /**
     * Charge l'arborescence complète des dossiers et fichiers
     */
    async loadFoldersTree() {
      this.loading = true
      this.error = null
      
      try {
        console.log('📂 [DocumentStore] Chargement de l\'arborescence...')
        
        // 1. Récupère les dossiers racine
        const tops = await apiFetch('/folders/top')
        
        // 2. Pour chaque dossier racine, charge les enfants et fichiers
        const enriched = await Promise.all(
          (tops || []).map(async (top) => {
            const [children, topFiles] = await Promise.all([
              apiFetch(`/folders/${encodeURIComponent(top.id)}/children`),
              apiFetch(`/folders/${encodeURIComponent(top.id)}/files`),
            ])

            // 3. Pour chaque sous-dossier, charge les fichiers
            const subFolders = await Promise.all(
              (children || []).map(async (sub) => {
                const subFiles = await apiFetch(`/folders/${encodeURIComponent(sub.id)}/files`)
                return {
                  id: sub.id,
                  name: sub.name,
                  files: subFiles || [],
                }
              })
            )

            return {
              id: top.id,
              name: top.name,
              icon: top.icon || 'pi pi-folder',
              files: topFiles || [],
              subFolders,
            }
          })
        )

        this.topFolders = enriched
        this.folders = enriched
        
        console.log('✅ [DocumentStore] Arborescence chargée:', {
          foldersCount: enriched.length,
          totalFiles: this.totalFilesCount,
        })
        
        return enriched
      } catch (e) {
        this.error = e.message
        console.error('❌ [DocumentStore] Erreur chargement arborescence:', e)
        throw e
      } finally {
        this.loading = false
      }
    },

    /**
     * Charge uniquement les dossiers racine (sans fichiers)
     */
    async fetchTopFolders() {
      this.loading = true
      this.error = null
      
      try {
        const data = await apiFetch('/folders/top')
        this.topFolders = Array.isArray(data) ? data : []
        return this.topFolders
      } catch (e) {
        this.error = e.message
        console.error('❌ [DocumentStore] Erreur chargement dossiers racine:', e)
        throw e
      } finally {
        this.loading = false
      }
    },

    /**
     * Charge les sous-dossiers d'un dossier parent
     */
    async fetchFolderChildren(folderId) {
      this.loading = true
      this.error = null
      
      try {
        const data = await apiFetch(`/folders/${encodeURIComponent(folderId)}/children`)
        return Array.isArray(data) ? data : []
      } catch (e) {
        this.error = e.message
        console.error(`❌ [DocumentStore] Erreur chargement enfants de ${folderId}:`, e)
        throw e
      } finally {
        this.loading = false
      }
    },

    /**
     * Charge les fichiers d'un dossier
     */
    async fetchFolderFiles(folderId) {
      this.loading = true
      this.error = null
      
      try {
        const data = await apiFetch(`/folders/${encodeURIComponent(folderId)}/files`)
        return Array.isArray(data) ? data : []
      } catch (e) {
        this.error = e.message
        console.error(`❌ [DocumentStore] Erreur chargement fichiers de ${folderId}:`, e)
        throw e
      } finally {
        this.loading = false
      }
    },

    /**
     * Charge un dossier complet (avec sous-dossiers et fichiers)
     */
    async fetchFolderComplete(folderId) {
      this.loading = true
      this.error = null
      
      try {
        const [children, files] = await Promise.all([
          apiFetch(`/folders/${encodeURIComponent(folderId)}/children`),
          apiFetch(`/folders/${encodeURIComponent(folderId)}/files`),
        ])

        const subFolders = await Promise.all(
          (children || []).map(async (sub) => {
            const subFiles = await apiFetch(`/folders/${encodeURIComponent(sub.id)}/files`)
            return {
              id: sub.id,
              name: sub.name,
              files: subFiles || [],
            }
          })
        )

        const folder = {
          id: folderId,
          files: files || [],
          subFolders,
        }

        this.currentFolder = folder
        return folder
      } catch (e) {
        this.error = e.message
        console.error(`❌ [DocumentStore] Erreur chargement complet de ${folderId}:`, e)
        throw e
      } finally {
        this.loading = false
      }
    },

    /**
     * Recherche de fichiers par nom
     */
    searchFiles(query) {
      if (!query || query.trim() === '') return []
      
      const searchTerm = query.toLowerCase()
      const results = []

      for (const folder of this.topFolders) {
        // Cherche dans les fichiers du dossier racine
        if (folder.files) {
          for (const file of folder.files) {
            if (file.name && file.name.toLowerCase().includes(searchTerm)) {
              results.push({
                ...file,
                folderName: folder.name,
                folderPath: folder.name,
              })
            }
          }
        }

        // Cherche dans les sous-dossiers
        if (folder.subFolders) {
          for (const sub of folder.subFolders) {
            if (sub.files) {
              for (const file of sub.files) {
                if (file.name && file.name.toLowerCase().includes(searchTerm)) {
                  results.push({
                    ...file,
                    folderName: sub.name,
                    folderPath: `${folder.name} > ${sub.name}`,
                  })
                }
              }
            }
          }
        }
      }

      return results
    },

    /**
     * Réinitialise le store
     */
    reset() {
      this.folders = []
      this.topFolders = []
      this.currentFolder = null
      this.loading = false
      this.error = null
    },
  },
})
