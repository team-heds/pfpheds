<template>
  <!-- Insertion du composant Navbar -->
  <Navbar />

  <div class="grid scrollable-container">
    <!-- Parcours de chaque dossier -->
    <div class="col-12 md:col-12">
      <div class="grid">
        <div v-for="folder in folders" :key="folder.id" class="col-12">
          <div class="card mb-3">
            <!-- En-tête du dossier -->
            <div class="flex align-items-center mb-2">
              <i :class="[folder.icon, 'text-2xl', 'mr-3']"></i>
              <h3 class="m-0">{{ folder.name }}</h3>
            </div>

            <!-- CAS 1 : Dossier avec sous-sections -->
            <template v-if="folder.subFolders && folder.subFolders.length > 0">
              <div class="grid">
                <div v-for="sub in folder.subFolders" :key="sub.id" class="col-12 md:col-6">
                  <div class="border-round border-1 surface-border p-2 mb-3">
                    <h4 class="mb-2">{{ sub.name }}</h4>
                    <div v-if="sub.files && sub.files.length > 0">
                      <ul class="pl-3">
                        <li v-for="file in sub.files" :key="file.id" class="mb-2">
                          <a
                            :href="file.url"
                            target="_blank"
                            rel="noopener noreferrer"
                            class="text-primary hover:underline"
                          >
                            {{ file.name }}
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div v-else>
                      <p class="text-600 m-0">Aucun fichier pour cette sous-section.</p>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- CAS 2 : Dossier sans sous-sections -->
            <template v-else>
              <div v-if="folder.files && folder.files.length > 0">
                <ul class="pl-3">
                  <li v-for="file in folder.files" :key="file.id" class="mb-2">
                    <a
                      :href="file.url"
                      target="_blank"
                      rel="noopener noreferrer"
                      class="text-primary hover:underline"
                    >
                      {{ file.name }}
                    </a>
                  </li>
                </ul>
              </div>
              <div v-else>
                <p class="text-600 m-0">Aucun fichier n'est disponible.</p>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Navbar from '@/components/common/utils/Navbar.vue'

const folders = ref([])
const loading = ref(false)
const error = ref(null)

const API_URL = '/api/filePhysio'

async function fetchJSON(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${res.statusText}`)
  return await res.json()
}

async function loadFoldersTree() {
  loading.value = true
  error.value = null
  try {
    const tops = await fetchJSON(`${API_URL}/folders/top`)
    const enriched = await Promise.all(
      (tops || []).map(async (top) => {
        const [children, topFiles] = await Promise.all([
          fetchJSON(`${API_URL}/folders/${encodeURIComponent(top.id)}/children`),
          fetchJSON(`${API_URL}/folders/${encodeURIComponent(top.id)}/files`),
        ])

        const subFolders = await Promise.all(
          (children || []).map(async (sub) => {
            const subFiles = await fetchJSON(`${API_URL}/folders/${encodeURIComponent(sub.id)}/files`)
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
    folders.value = enriched
  } catch (e) {
    error.value = e.message
    console.error('Erreur chargement FilePhysio:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadFoldersTree()
})
</script>

<style scoped>
.admin-panel {
  text-align: right;
  margin-bottom: 1rem;
}
.add-file-button {
  margin-top: 1rem;
  text-align: center;
}

.scrollable-container {
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none;
  -ms-overflow-style: none;
  padding-bottom: 12rem;
}
.scrollable-container::-webkit-scrollbar {
  display: none;
}
</style>
