<template>
  <AdminLayout class="vimeo-test-page">
    <div class="test-header">
      <h1>Test de connexion Vimeo</h1>
      <p>Vérification de l'API Vimeo</p>
    </div>

    <div class="test-section">
      <h2>Configuration</h2>
      <div class="config-info">
        <div class="config-item">
          <label>Token présent:</label>
          <span :class="tokenPresent ? 'success' : 'error'">
            {{ tokenPresent ? 'OUI' : 'NON' }}
          </span>
        </div>
        <div class="config-item">
          <label>Token (début):</label>
          <span>{{ tokenPreview }}</span>
        </div>
        <div class="config-item">
          <label>API Base URL:</label>
          <span>{{ apiBaseUrl }}</span>
        </div>
        <div class="config-item">
          <label>Configuration complète:</label>
          <pre>{{ config }}</pre>
        </div>
      </div>
    </div>

    <div class="test-section">
      <h2>Test de connexion</h2>
      <div class="test-controls">
        <Button 
          label="Tester la connexion" 
          icon="pi pi-play"
          @click="testConnection"
          :loading="testing"
        />
        <Button 
          label="Récupérer mes vidéos" 
          icon="pi pi-video"
          @click="fetchVideos"
          :loading="fetchingVideos"
        />
      </div>
    </div>

    <div class="test-section" v-if="testResults.length > 0">
      <h2>Résultats des tests</h2>
      <div class="test-results">
        <div 
          v-for="result in testResults" 
          :key="result.id"
          class="test-result"
          :class="result.success ? 'success' : 'error'"
        >
          <div class="result-header">
            <i :class="result.success ? 'pi pi-check-circle' : 'pi pi-times-circle'"></i>
            <span class="result-title">{{ result.title }}</span>
            <span class="result-time">{{ result.timestamp }}</span>
          </div>
          <div class="result-details">
            <p>{{ result.message }}</p>
            <pre v-if="result.data">{{ JSON.stringify(result.data, null, 2) }}</pre>
          </div>
        </div>
      </div>
    </div>

    <div class="test-section" v-if="videos.length > 0">
      <h2>Vidéos récupérées ({{ videos.length }})</h2>
      <div class="videos-preview">
        <div 
          v-for="video in videos.slice(0, 5)" 
          :key="video.id"
          class="video-preview"
        >
          <div class="video-thumbnail">
            <img 
              :src="video.thumbnail || 'https://via.placeholder.com/160x90/4f46e5/white?text=Video'" 
              :alt="video.title"
            />
          </div>
          <div class="video-info">
            <h4>{{ video.title }}</h4>
            <p>{{ video.description || 'Pas de description' }}</p>
            <div class="video-meta">
              <span>ID: {{ video.id }}</span>
              <span>Durée: {{ video.duration || 'N/A' }}</span>
            </div>
          </div>
        </div>
      </div>
      <p v-if="videos.length > 5" class="more-videos">
        ... et {{ videos.length - 5 }} autres vidéos
      </p>
    </div>

    <!-- Toast -->
    <Toast />
  </AdminLayout>
</template>

<script setup>
import AdminLayout from '@/components/admin/layouts/AdminLayout.vue';
import { ref, computed, onMounted } from 'vue'
import { useToast } from 'primevue/usetoast'
import Button from 'primevue/button'
import Toast from 'primevue/toast'
import { listAllVideos, testVimeoAuth } from '@/service/vimeoService'

const toast = useToast()

// État réactif
const testing = ref(false)
const fetchingVideos = ref(false)
const testResults = ref([])
const videos = ref([])
const config = ref({
  envToken: null,
  localToken: null,
  finalToken: null,
  allEnvVars: {},
  nodeEnv: null,
  mode: null
})

// Configuration
const tokenPresent = computed(() => {
  const envToken = null
  const localToken = null
  return !!(envToken || localToken)
})

const tokenPreview = computed(() => {
  const envToken = null
  const localToken = null
  const token = localToken || envToken
  return token ? token.substring(0, 10) + '...' : 'AUCUN'
})

const apiBaseUrl = 'https://api.vimeo.com'

// Méthodes
const addTestResult = (title, success, message, data = null) => {
  testResults.value.unshift({
    id: Date.now(),
    title,
    success,
    message,
    data,
    timestamp: new Date().toLocaleTimeString()
  })
}

const loadConfig = () => {
  console.log('[VimeoTest] Chargement de la configuration...')
  
  // Récupérer toutes les variables d'environnement
  config.value.allEnvVars = {
    VIMEO_SERVER_PROXY: true,
    NODE_ENV: import.meta?.env?.NODE_ENV,
    MODE: import.meta?.env?.MODE,
    DEV: import.meta?.env?.DEV,
    PROD: import.meta?.env?.PROD,
    BASE_URL: import.meta?.env?.BASE_URL
  }
  
  config.value.envToken = null
  config.value.localToken = null
  config.value.finalToken = config.value.localToken || config.value.envToken
  config.value.nodeEnv = import.meta?.env?.NODE_ENV
  config.value.mode = import.meta?.env?.MODE
  
  console.log('[VimeoTest] Configuration chargée:', config.value)
}

const testConnection = async () => {
  testing.value = true
  
  try {
    const proxyResult = await testVimeoAuth()
    addTestResult(
      'Connexion Vimeo côté serveur',
      proxyResult.ok,
      proxyResult.ok ? `Utilisateur: ${proxyResult.user?.name || 'Vimeo'}` : proxyResult.error
    )
  } catch (error) {
    console.error('[VimeoTest] Erreur lors du test:', error)
    addTestResult('Test général', false, `Erreur inattendue: ${error.message}`)
  } finally {
    testing.value = false
  }
}

const fetchVideos = async () => {
  fetchingVideos.value = true
  
  try {
    const proxiedVideos = await listAllVideos({ perPage: 10, maxPages: 1 })
    videos.value = proxiedVideos.slice(0, 5)
    addTestResult('Récupération via proxy', true, `${proxiedVideos.length} vidéo(s) récupérée(s)`)
  } catch (error) {
    console.error('[VimeoTest] Erreur lors de la récupération:', error)
    addTestResult('Récupération vidéos', false, `Erreur inattendue: ${error.message}`)
  } finally {
    fetchingVideos.value = false
  }
}

const formatDuration = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Lifecycle
onMounted(() => {
  console.log('[VimeoTest] Page de test Vimeo chargée')
  loadConfig()
})
</script>

<style scoped>
.vimeo-test-page {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.test-header {
  text-align: center;
  margin-bottom: 3rem;
}

.test-header h1 {
  font-size: 2.5rem;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.test-header p {
  color: #6b7280;
  font-size: 1.1rem;
}

.test-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.test-section h2 {
  font-size: 1.5rem;
  color: #1f2937;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.config-info {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.config-item {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.config-item label {
  font-weight: 500;
  color: #374151;
  min-width: 120px;
}

.config-item .success {
  color: #10b981;
  font-weight: 600;
}

.config-item .error {
  color: #ef4444;
  font-weight: 600;
}

.test-controls {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.test-results {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.test-result {
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid;
}

.test-result.success {
  background: #f0fdf4;
  border-left-color: #10b981;
}

.test-result.error {
  background: #fef2f2;
  border-left-color: #ef4444;
}

.result-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.result-title {
  font-weight: 600;
  flex: 1;
}

.result-time {
  font-size: 0.875rem;
  color: #6b7280;
}

.result-details p {
  margin-bottom: 0.5rem;
  color: #374151;
}

.result-details pre {
  background: #f9fafb;
  border-radius: 4px;
  padding: 0.75rem;
  font-size: 0.875rem;
  overflow-x: auto;
  max-height: 200px;
  overflow-y: auto;
}

.videos-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.video-preview {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

.video-thumbnail {
  height: 160px;
  overflow: hidden;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.video-info {
  padding: 1rem;
}

.video-info h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.video-info p {
  color: #6b7280;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  line-height: 1.4;
}

.video-meta {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #6b7280;
}

.more-videos {
  text-align: center;
  color: #6b7280;
  font-style: italic;
}

@media (max-width: 768px) {
  .vimeo-test-page {
    padding: 1rem;
  }
  
  .test-controls {
    flex-direction: column;
  }
  
  .videos-preview {
    grid-template-columns: 1fr;
  }
}
</style>
