import { defineStore } from 'pinia';

const API_URL = '/api/filePhysio';

export const useFilePhysioStore = defineStore('filePhysio', {
  state: () => ({
    topFolders: [],
    foldersTree: [],
    currentFolder: null,
    children: [],
    files: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchTopFolders() {
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch(`${API_URL}/folders/top`);
        if (!res.ok) throw new Error(`Failed to fetch top folders: ${res.statusText}`);
        this.topFolders = await res.json();
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchFolderFull(folderId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch(`${API_URL}/folders/${encodeURIComponent(folderId)}/full`);
        if (!res.ok) throw new Error(`Failed to fetch folder: ${res.statusText}`);
        const payload = await res.json();
        this.currentFolder = payload.folder || null;
        this.children = payload.children || [];
        this.files = payload.files || [];
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    // Helpers granulaire (si nécessaire dans l’UI)
    async fetchChildren(folderId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch(`${API_URL}/folders/${encodeURIComponent(folderId)}/children`);
        if (!res.ok) throw new Error(`Failed to fetch subfolders: ${res.statusText}`);
        this.children = await res.json();
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    async fetchFiles(folderId) {
      this.loading = true;
      this.error = null;
      try {
        const res = await fetch(`${API_URL}/folders/${encodeURIComponent(folderId)}/files`);
        if (!res.ok) throw new Error(`Failed to fetch files: ${res.statusText}`);
        this.files = await res.json();
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    // Build a full tree for all top-level folders with their subfolders and files
    async loadFoldersTree() {
      this.loading = true;
      this.error = null;
      try {
        // Top-level folders
        const topsRes = await fetch(`${API_URL}/folders/top`);
        if (!topsRes.ok) throw new Error(`Failed to fetch top folders: ${topsRes.statusText}`);
        const tops = await topsRes.json();

        const enriched = await Promise.all(
          (tops || []).map(async (top) => {
            const [childrenRes, topFilesRes] = await Promise.all([
              fetch(`${API_URL}/folders/${encodeURIComponent(top.id)}/children`),
              fetch(`${API_URL}/folders/${encodeURIComponent(top.id)}/files`),
            ]);
            if (!childrenRes.ok) throw new Error(`Failed to fetch children for ${top.id}: ${childrenRes.statusText}`);
            if (!topFilesRes.ok) throw new Error(`Failed to fetch files for ${top.id}: ${topFilesRes.statusText}`);
            const children = await childrenRes.json();
            const topFiles = await topFilesRes.json();

            const subFolders = await Promise.all(
              (children || []).map(async (sub) => {
                const subFilesRes = await fetch(`${API_URL}/folders/${encodeURIComponent(sub.id)}/files`);
                if (!subFilesRes.ok) throw new Error(`Failed to fetch files for sub ${sub.id}: ${subFilesRes.statusText}`);
                const subFiles = await subFilesRes.json();
                return {
                  id: sub.id,
                  name: sub.name,
                  files: subFiles || [],
                };
              })
            );

            return {
              id: top.id,
              name: top.name,
              icon: top.icon || 'pi pi-folder',
              files: topFiles || [],
              subFolders,
            };
          })
        );

        this.topFolders = tops || [];
        this.foldersTree = enriched;
      } catch (e) {
        this.error = e.message;
      } finally {
        this.loading = false;
      }
    },

    // UX helpers
    async selectFolder(folderId) {
      await this.fetchFolderFull(folderId);
    },

    resetSelection() {
      this.currentFolder = null;
      this.children = [];
      this.files = [];
      this.error = null;
    },
  },
});