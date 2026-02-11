import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock Firebase
const { mockDbRef, mockOnValue, mockSet, mockOff } = vi.hoisted(() => ({
  mockDbRef: vi.fn(),
  mockOnValue: vi.fn(),
  mockSet: vi.fn(),
  mockOff: vi.fn(),
}))

vi.mock('root/firebase.js', () => ({
  db: {},
}))

vi.mock('firebase/database', () => ({
  ref: (...args) => mockDbRef(...args),
  onValue: (...args) => mockOnValue(...args),
  set: (...args) => mockSet(...args),
  off: (...args) => mockOff(...args),
}))

import { useDocumentStore } from '@/stores/documentStore'

// Sample test data
const sampleFolders = [
  {
    id: 'f1',
    name: 'Cours',
    files: [
      { id: 'file1', name: 'Anatomie.pdf', url: 'http://example.com/a.pdf' },
      { id: 'file2', name: 'Physiologie.pdf', url: 'http://example.com/p.pdf' },
    ],
    subFolders: [
      {
        id: 'sf1',
        name: 'Examens',
        files: [
          { id: 'file3', name: 'Examen2024.pdf', url: 'http://example.com/e.pdf' },
        ],
      },
    ],
  },
  {
    id: 'f2',
    name: 'Stages',
    files: [{ id: 'file4', name: 'Guide_stage.pdf', url: 'http://example.com/g.pdf' }],
    subFolders: [],
  },
]

describe('documentStore', () => {
  let store

  beforeEach(() => {
    setActivePinia(createPinia())
    store = useDocumentStore()
    vi.clearAllMocks()
  })

  // ==================== INITIAL STATE ====================
  describe('initial state', () => {
    it('folders is empty', () => {
      expect(store.folders).toEqual([])
    })

    it('topFolders is empty', () => {
      expect(store.topFolders).toEqual([])
    })

    it('currentFolder is null', () => {
      expect(store.currentFolder).toBeNull()
    })

    it('loading is false', () => {
      expect(store.loading).toBe(false)
    })

    it('error is null', () => {
      expect(store.error).toBeNull()
    })
  })

  // ==================== GETTERS ====================
  describe('getters', () => {
    beforeEach(() => {
      store.topFolders = JSON.parse(JSON.stringify(sampleFolders))
      store.folders = JSON.parse(JSON.stringify(sampleFolders))
    })

    describe('getFolderById', () => {
      it('finds a top-level folder', () => {
        const folder = store.getFolderById('f1')
        expect(folder).toBeTruthy()
        expect(folder.name).toBe('Cours')
      })

      it('finds a sub-folder', () => {
        const folder = store.getFolderById('sf1')
        expect(folder).toBeTruthy()
        expect(folder.name).toBe('Examens')
      })

      it('returns null for unknown id', () => {
        expect(store.getFolderById('unknown')).toBeNull()
      })
    })

    describe('getAllFilesFromFolder', () => {
      it('returns all files including sub-folders', () => {
        const files = store.getAllFilesFromFolder('f1')
        expect(files).toHaveLength(3) // 2 in root + 1 in subfolder
      })

      it('returns empty array for unknown folder', () => {
        expect(store.getAllFilesFromFolder('unknown')).toEqual([])
      })

      it('returns only root files when no subfolders', () => {
        const files = store.getAllFilesFromFolder('f2')
        expect(files).toHaveLength(1)
      })
    })

    describe('totalFilesCount', () => {
      it('counts all files across all folders', () => {
        expect(store.totalFilesCount).toBe(4) // 2 + 1 + 1
      })

      it('returns 0 when no folders', () => {
        store.topFolders = []
        expect(store.totalFilesCount).toBe(0)
      })
    })
  })

  // ==================== UPDATE FILE ====================
  describe('updateFile', () => {
    beforeEach(() => {
      store.folders = JSON.parse(JSON.stringify(sampleFolders))
      store.topFolders = JSON.parse(JSON.stringify(sampleFolders))
      mockSet.mockResolvedValue()
    })

    it('updates a file in a root folder', async () => {
      await store.updateFile('file1', { name: 'Anatomie_v2.pdf' })

      expect(mockSet).toHaveBeenCalled()
      expect(store.folders[0].files[0].name).toBe('Anatomie_v2.pdf')
      expect(store.loading).toBe(false)
    })

    it('updates a file in a sub-folder', async () => {
      await store.updateFile('file3', { name: 'Examen2025.pdf' })

      expect(mockSet).toHaveBeenCalled()
      expect(store.folders[0].subFolders[0].files[0].name).toBe('Examen2025.pdf')
    })

    it('throws when file not found', async () => {
      await expect(store.updateFile('unknown', { name: 'test' })).rejects.toThrow('Fichier non trouvé')
      expect(store.error).toBe('Fichier non trouvé')
    })
  })

  // ==================== DELETE FILE ====================
  describe('deleteFile', () => {
    beforeEach(() => {
      store.folders = JSON.parse(JSON.stringify(sampleFolders))
      store.topFolders = JSON.parse(JSON.stringify(sampleFolders))
      mockSet.mockResolvedValue()
    })

    it('deletes a file from root folder', async () => {
      await store.deleteFile('file1')

      expect(mockSet).toHaveBeenCalled()
      expect(store.folders[0].files).toHaveLength(1)
      expect(store.folders[0].files[0].id).toBe('file2')
    })

    it('deletes a file from sub-folder', async () => {
      await store.deleteFile('file3')

      expect(store.folders[0].subFolders[0].files).toHaveLength(0)
    })

    it('throws when file not found', async () => {
      await expect(store.deleteFile('unknown')).rejects.toThrow('Fichier non trouvé')
    })
  })

  // ==================== ADD FILE ====================
  describe('addFile', () => {
    beforeEach(() => {
      store.folders = JSON.parse(JSON.stringify(sampleFolders))
      store.topFolders = JSON.parse(JSON.stringify(sampleFolders))
      mockSet.mockResolvedValue()
    })

    it('adds a file to a root folder', async () => {
      const newFile = { id: 'file5', name: 'NewFile.pdf' }
      await store.addFile(newFile, 'f1')

      expect(mockSet).toHaveBeenCalled()
      expect(store.folders[0].files).toHaveLength(3)
      expect(store.folders[0].files[2].id).toBe('file5')
    })

    it('adds a file to a sub-folder', async () => {
      const newFile = { id: 'file6', name: 'SubFile.pdf' }
      await store.addFile(newFile, 'f1', 'sf1')

      expect(store.folders[0].subFolders[0].files).toHaveLength(2)
    })

    it('handles Firebase error', async () => {
      mockSet.mockRejectedValue(new Error('Permission denied'))

      await expect(store.addFile({ id: 'x' }, 'f1')).rejects.toThrow('Permission denied')
      expect(store.error).toBe('Permission denied')
    })
  })

  // ==================== SEARCH FILES ====================
  describe('searchFiles', () => {
    beforeEach(() => {
      store.folders = JSON.parse(JSON.stringify(sampleFolders))
    })

    it('finds files by name (case insensitive)', () => {
      const results = store.searchFiles('anatomie')
      expect(results).toHaveLength(1)
      expect(results[0].name).toBe('Anatomie.pdf')
      expect(results[0].folderName).toBe('Cours')
    })

    it('finds files in sub-folders', () => {
      const results = store.searchFiles('examen')
      expect(results).toHaveLength(1)
      expect(results[0].folderPath).toBe('Cours > Examens')
    })

    it('finds multiple matches', () => {
      const results = store.searchFiles('.pdf')
      expect(results).toHaveLength(4)
    })

    it('returns empty for empty query', () => {
      expect(store.searchFiles('')).toEqual([])
      expect(store.searchFiles(null)).toEqual([])
    })

    it('returns empty for no matches', () => {
      expect(store.searchFiles('zzzzz')).toEqual([])
    })
  })

  // ==================== CLEANUP & RESET ====================
  describe('cleanup and reset', () => {
    it('cleanup calls Firebase off', () => {
      store.cleanup()
      expect(mockOff).toHaveBeenCalled()
    })

    it('reset clears all state and calls cleanup', () => {
      store.folders = [{ id: 'f1' }]
      store.topFolders = [{ id: 'f1' }]
      store.currentFolder = { id: 'f1' }
      store.loading = true
      store.error = 'err'

      store.reset()

      expect(store.folders).toEqual([])
      expect(store.topFolders).toEqual([])
      expect(store.currentFolder).toBeNull()
      expect(store.loading).toBe(false)
      expect(store.error).toBeNull()
      expect(mockOff).toHaveBeenCalled()
    })
  })
})
