import { defineStore } from 'pinia'
import { db } from 'root/firebase.js'
import { ref as dbRef, onValue, set, off } from 'firebase/database'
 
/**
* ===========================
*  Document Store - FilePhysio
* ===========================
* Gère les dossiers et fichiers depuis Firebase Realtime Database
* Path Firebase: FilePFPPhysio
*/
 
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
     * Charge l'arborescence complète depuis Firebase
     */
    async loadFoldersTree() {
      this.loading = true
      this.error = null
      
      try {
        const foldersRef = dbRef(db, 'FilePFPPhysio')
        
        return new Promise((resolve, reject) => {
          onValue(
            foldersRef,
            (snapshot) => {
              const data = snapshot.val()
              this.folders = data || []
              this.topFolders = data || []
              
              this.loading = false
              resolve(this.folders)
            },
            (error) => {
              console.error('❌ [DocumentStore] Erreur Firebase:', error)
              this.error = error.message
              this.loading = false
              reject(error)
            }
          )
        })
      } catch (e) {
        this.error = e.message
        console.error('❌ [DocumentStore] Erreur chargement:', e)
        this.loading = false
        throw e
      }
    },
 
    /**
     * Met à jour un fichier
     */
    async updateFile(fileId, updates) {
      this.loading = true
      this.error = null
      
      try {
        let updated = false
        const newFolders = this.folders.map(folder => {
          // Mise à jour dans folder.files
          if (folder.files && Array.isArray(folder.files)) {
            folder.files = folder.files.map(file => {
              if (file.id === fileId) {
                updated = true
                return { ...file, ...updates }
              }
              return file
            })
          }
          
          // Mise à jour dans les sous-dossiers
          if (folder.subFolders && Array.isArray(folder.subFolders)) {
            folder.subFolders = folder.subFolders.map(subFolder => {
              if (subFolder.files && Array.isArray(subFolder.files)) {
                subFolder.files = subFolder.files.map(file => {
                  if (file.id === fileId) {
                    updated = true
                    return { ...file, ...updates }
                  }
                  return file
                })
              }
              return subFolder
            })
          }
          
          return folder
        })
 
        if (!updated) {
          throw new Error('Fichier non trouvé')
        }
 
        await set(dbRef(db, 'FilePFPPhysio'), newFolders)
        this.folders = newFolders
        this.topFolders = newFolders
        
        return true
      } catch (e) {
        this.error = e.message
        console.error('❌ [DocumentStore] Erreur mise à jour:', e)
        throw e
      } finally {
        this.loading = false
      }
    },
 
    /**
     * Supprime un fichier
     */
    async deleteFile(fileId) {
      this.loading = true
      this.error = null
      
      try {
        let deleted = false
        const newFolders = this.folders.map(folder => {
          // Suppression dans folder.files
          if (folder.files && Array.isArray(folder.files)) {
            const beforeLength = folder.files.length
            folder.files = folder.files.filter(file => {
              if (file.id === fileId) {
                deleted = true
                return false
              }
              return true
            })
            if (beforeLength !== folder.files.length) deleted = true
          }
          
          // Suppression dans les sous-dossiers
          if (folder.subFolders && Array.isArray(folder.subFolders)) {
            folder.subFolders = folder.subFolders.map(subFolder => {
              if (subFolder.files && Array.isArray(subFolder.files)) {
                const beforeLength = subFolder.files.length
                subFolder.files = subFolder.files.filter(file => {
                  if (file.id === fileId) {
                    deleted = true
                    return false
                  }
                  return true
                })
                if (beforeLength !== subFolder.files.length) deleted = true
              }
              return subFolder
            })
          }
          
          return folder
        })
 
        if (!deleted) {
          throw new Error('Fichier non trouvé')
        }
 
        await set(dbRef(db, 'FilePFPPhysio'), newFolders)
        this.folders = newFolders
        this.topFolders = newFolders
        
        return true
      } catch (e) {
        this.error = e.message
        console.error('❌ [DocumentStore] Erreur suppression:', e)
        throw e
      } finally {
        this.loading = false
      }
    },
 
    /**
     * Ajoute un fichier dans un dossier ou sous-dossier
     */
    async addFile(newFile, targetFolderId, targetSubFolderId = null) {
      this.loading = true
      this.error = null
      
      try {
        const newFolders = this.folders.map(folder => {
          if (targetSubFolderId && folder.id === targetFolderId) {
            // Ajout dans un sous-dossier
            if (folder.subFolders && Array.isArray(folder.subFolders)) {
              folder.subFolders = folder.subFolders.map(sub => {
                if (sub.id === targetSubFolderId) {
                  if (!sub.files || !Array.isArray(sub.files)) {
                    sub.files = []
                  }
                  sub.files.push(newFile)
                }
                return sub
              })
            }
          } else if (!targetSubFolderId && folder.id === targetFolderId) {
            // Ajout dans le dossier directement
            if (!folder.files || !Array.isArray(folder.files)) {
              folder.files = []
            }
            folder.files.push(newFile)
          }
          return folder
        })
 
        await set(dbRef(db, 'FilePFPPhysio'), newFolders)
        this.folders = newFolders
        this.topFolders = newFolders
        
        return true
      } catch (e) {
        this.error = e.message
        console.error('❌ [DocumentStore] Erreur ajout:', e)
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
 
      for (const folder of this.folders) {
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
     * Nettoie les listeners Firebase
     */
    cleanup() {
      const foldersRef = dbRef(db, 'FilePFPPhysio')
      off(foldersRef)
    },
 
    /**
     * Réinitialise le store
     */
    reset() {
      this.cleanup()
      this.folders = []
      this.topFolders = []
      this.currentFolder = null
      this.loading = false
      this.error = null
    },
  },
})
 
 