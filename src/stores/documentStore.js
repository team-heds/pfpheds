import { defineStore } from 'pinia'
import { supabase } from '@/supabase'

/**
* ===========================
*  Document Store - FilePhysio
* ===========================
* Gere les dossiers et fichiers depuis Supabase
* Tables: file_physio_folders, file_physio_files
*/

export const useDocumentStore = defineStore('documents', {
  state: () => ({
    folders: [],
    topFolders: [],
    currentFolder: null,
    loading: false,
    error: null,
  }),

  getters: {
    getFolderById: (state) => (id) => {
      let found = state.topFolders.find((f) => f.id === id)
      if (found) return found
      for (const topFolder of state.topFolders) {
        if (topFolder.subFolders) {
          found = topFolder.subFolders.find((sf) => sf.id === id)
          if (found) return found
        }
      }
      return null
    },

    getAllFilesFromFolder: (state) => (folderId) => {
      const folder = state.topFolders.find((f) => f.id === folderId)
      if (!folder) return []
      let allFiles = [...(folder.files || [])]
      if (folder.subFolders) {
        for (const sub of folder.subFolders) {
          allFiles = [...allFiles, ...(sub.files || [])]
        }
      }
      return allFiles
    },

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
    async loadFoldersTree() {
      this.loading = true
      this.error = null

      try {
        const [foldersResult, filesResult] = await Promise.all([
          supabase.from('file_physio_folders').select('*'),
          supabase.from('file_physio_files').select('*')
        ])

        if (foldersResult.error) throw foldersResult.error
        if (filesResult.error) throw filesResult.error

        const allFolders = foldersResult.data || []
        const allFiles = filesResult.data || []

        const filesByFolder = new Map()
        allFiles.forEach(f => {
          if (!filesByFolder.has(f.folder_id)) filesByFolder.set(f.folder_id, [])
          filesByFolder.get(f.folder_id).push({ id: f.id, name: f.name, url: f.url })
        })

        const topFolders = allFolders.filter(f => !f.parent_id)
        const subFoldersAll = allFolders.filter(f => f.parent_id)

        const FOLDER_ORDER = [
          'documentsGeneraux',
          'cpt',
          'journaldebord',
          'evaluation',
          'MobilitesInternationales'
        ]

        const tree = topFolders.map(top => {
          const subs = subFoldersAll
            .filter(s => s.parent_id === top.id)
            .map(s => ({
              id: s.id,
              name: s.name,
              files: filesByFolder.get(s.id) || []
            }))
            .sort((a, b) => a.name.localeCompare(b.name, 'fr'))

          return {
            id: top.id,
            name: top.name,
            icon: top.icon || 'pi pi-folder',
            files: filesByFolder.get(top.id) || [],
            subFolders: subs.length > 0 ? subs : undefined
          }
        }).sort((a, b) => {
          const idxA = FOLDER_ORDER.indexOf(a.id)
          const idxB = FOLDER_ORDER.indexOf(b.id)
          const orderA = idxA >= 0 ? idxA : FOLDER_ORDER.length
          const orderB = idxB >= 0 ? idxB : FOLDER_ORDER.length
          return orderA - orderB
        })

        console.log('📂 [DocumentStore] Ordre des dossiers:', tree.map(f => f.id))
        this.folders = tree
        this.topFolders = tree
        this.loading = false
        return this.folders
      } catch (e) {
        this.error = e.message
        console.error('[DocumentStore] Erreur chargement:', e)
        this.loading = false
        throw e
      }
    },

    async updateFile(fileId, updates) {
      this.loading = true
      this.error = null

      try {
        const { error } = await supabase
          .from('file_physio_files')
          .update({ name: updates.name, url: updates.url })
          .eq('id', fileId)

        if (error) throw error
        await this.loadFoldersTree()
        return true
      } catch (e) {
        this.error = e.message
        console.error('[DocumentStore] Erreur mise a jour:', e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async deleteFile(fileId) {
      this.loading = true
      this.error = null

      try {
        const { error } = await supabase
          .from('file_physio_files')
          .delete()
          .eq('id', fileId)

        if (error) throw error
        await this.loadFoldersTree()
        return true
      } catch (e) {
        this.error = e.message
        console.error('[DocumentStore] Erreur suppression:', e)
        throw e
      } finally {
        this.loading = false
      }
    },

    async addFile(newFile, targetFolderId, targetSubFolderId = null) {
      this.loading = true
      this.error = null

      try {
        const folderId = targetSubFolderId || targetFolderId
        const fileId = newFile.id || `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        const { error } = await supabase
          .from('file_physio_files')
          .insert({
            id: fileId,
            name: newFile.name,
            url: newFile.url,
            folder_id: folderId
          })

        if (error) throw error
        await this.loadFoldersTree()
        return true
      } catch (e) {
        this.error = e.message
        console.error('[DocumentStore] Erreur ajout:', e)
        throw e
      } finally {
        this.loading = false
      }
    },

    searchFiles(query) {
      if (!query || query.trim() === '') return []

      const searchTerm = query.toLowerCase()
      const results = []

      for (const folder of this.folders) {
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

        if (folder.subFolders) {
          for (const sub of folder.subFolders) {
            if (sub.files) {
              for (const file of sub.files) {
                if (file.name && file.name.toLowerCase().includes(searchTerm)) {
                  results.push({
                    ...file,
                    folderName: sub.name,
                    folderPath: folder.name + ' > ' + sub.name,
                  })
                }
              }
            }
          }
        }
      }

      return results
    },

    reset() {
      this.folders = []
      this.topFolders = []
      this.currentFolder = null
      this.loading = false
      this.error = null
    },
  },
})
