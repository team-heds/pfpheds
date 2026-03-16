import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'

// Mock Supabase
const mockUpdate = vi.fn()
const mockDelete = vi.fn()
const mockInsert = vi.fn()
const mockSelect = vi.fn()

const mockEq = vi.fn()

vi.mock('@/supabase', () => ({
  supabase: {
    from: vi.fn((table) => ({
      select: (...args) => {
        mockSelect(table, ...args)
        return { data: [], error: null }
      },
      update: (data) => {
        mockUpdate(table, data)
        return { eq: (col, val) => { mockEq(col, val); return { error: null } } }
      },
      delete: () => {
        mockDelete(table)
        return { eq: (col, val) => { mockEq(col, val); return { error: null } } }
      },
      insert: (data) => {
        mockInsert(table, data)
        return { error: null }
      }
    }))
  }
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
    it('calls supabase update with correct params', async () => {
      await store.updateFile('file1', { name: 'Anatomie_v2.pdf', url: 'http://new.url' })

      expect(mockUpdate).toHaveBeenCalledWith('file_physio_files', { name: 'Anatomie_v2.pdf', url: 'http://new.url' })
      expect(mockEq).toHaveBeenCalledWith('id', 'file1')
      expect(store.loading).toBe(false)
    })

    it('sets error on supabase failure', async () => {
      const { supabase } = await import('@/supabase')
      supabase.from.mockReturnValueOnce({
        select: () => ({ data: [], error: null }),
        update: () => ({
          eq: () => ({ error: { message: 'Update failed' } })
        })
      })

      await expect(store.updateFile('file1', { name: 'test' })).rejects.toThrow('Update failed')
      expect(store.error).toBe('Update failed')
    })
  })

  // ==================== DELETE FILE ====================
  describe('deleteFile', () => {
    it('calls supabase delete with correct id', async () => {
      await store.deleteFile('file1')

      expect(mockDelete).toHaveBeenCalledWith('file_physio_files')
      expect(mockEq).toHaveBeenCalledWith('id', 'file1')
      expect(store.loading).toBe(false)
    })

    it('sets error on supabase failure', async () => {
      const { supabase } = await import('@/supabase')
      supabase.from.mockReturnValueOnce({
        select: () => ({ data: [], error: null }),
        delete: () => ({
          eq: () => ({ error: { message: 'Delete failed' } })
        })
      })

      await expect(store.deleteFile('file1')).rejects.toThrow('Delete failed')
      expect(store.error).toBe('Delete failed')
    })
  })

  // ==================== ADD FILE ====================
  describe('addFile', () => {
    it('inserts a file to the correct folder', async () => {
      const newFile = { id: 'file5', name: 'NewFile.pdf', url: 'http://example.com/new.pdf' }
      await store.addFile(newFile, 'f1')

      expect(mockInsert).toHaveBeenCalled()
      const [table, data] = mockInsert.mock.calls[0]
      expect(table).toBe('file_physio_files')
      expect(data).toEqual({
        id: 'file5',
        name: 'NewFile.pdf',
        url: 'http://example.com/new.pdf',
        folder_id: 'f1'
      })
    })

    it('inserts a file to a sub-folder when specified', async () => {
      const newFile = { id: 'file6', name: 'SubFile.pdf', url: 'http://example.com/sub.pdf' }
      await store.addFile(newFile, 'f1', 'sf1')

      expect(mockInsert).toHaveBeenCalled()
      const [table, data] = mockInsert.mock.calls[0]
      expect(table).toBe('file_physio_files')
      expect(data).toEqual({
        id: 'file6',
        name: 'SubFile.pdf',
        url: 'http://example.com/sub.pdf',
        folder_id: 'sf1'
      })
    })

    it('handles Supabase error', async () => {
      const { supabase } = await import('@/supabase')
      supabase.from.mockReturnValueOnce({
        select: () => ({ data: [], error: null }),
        insert: () => ({ error: { message: 'Permission denied' } })
      })

      await expect(store.addFile({ id: 'x', name: 'test' }, 'f1')).rejects.toThrow('Permission denied')
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

  // ==================== RESET ====================
  describe('reset', () => {
    it('reset clears all state', () => {
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
    })
  })
})
