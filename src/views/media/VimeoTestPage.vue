<template>
  <div class="vimeo-test-page">
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
  </div>
</template>

<script setup>
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
  const envToken = import.meta?.env?.VITE_VIMEO_ACCESS_TOKEN
  const localToken = typeof window !== 'undefined' ? localStorage.getItem('VIMEO_TOKEN_OVERRIDE') : null
  return !!(envToken || localToken)
})

const tokenPreview = computed(() => {
  const envToken = import.meta?.env?.VITE_VIMEO_ACCESS_TOKEN
  const localToken = typeof window !== 'undefined' ? localStorage.getItem('VIMEO_TOKEN_OVERRIDE') : null
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
    VITE_VIMEO_ACCESS_TOKEN: import.meta?.env?.VITE_VIMEO_ACCESS_TOKEN,
    NODE_ENV: import.meta?.env?.NODE_ENV,
    MODE: import.meta?.env?.MODE,
    DEV: import.meta?.env?.DEV,
    PROD: import.meta?.env?.PROD,
    BASE_URL: import.meta?.env?.BASE_URL
  }
  
  config.value.envToken = import.meta?.env?.VITE_VIMEO_ACCESS_TOKEN
  config.value.localToken = typeof window !== 'undefined' ? localStorage.getItem('VIMEO_TOKEN_OVERRIDE') : null
  config.value.finalToken = config.value.localToken || config.value.envToken
  config.value.nodeEnv = import.meta?.env?.NODE_ENV
  config.value.mode = import.meta?.env?.MODE
  
  console.log('[VimeoTest] Configuration chargée:', config.value)
}

const testConnection = async () => {
  testing.value = true
  
  try {
    console.log('[VimeoTest] Début du test de connexion...')
    
    // Test 1: Vérifier le token depuis .env.production
    const envToken = import.meta?.env?.VITE_VIMEO_ACCESS_TOKEN
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('VIMEO_TOKEN_OVERRIDE') : null
    const token = localToken || envToken
    
    console.log('[VimeoTest] Token depuis .env:', envToken)
    console.log('[VimeoTest] Token depuis localStorage:', localToken)
    console.log('[VimeoTest] Token final utilisé:', token)
    
    if (!token) {
      addTestResult('Vérification du token', false, 'Aucun token Vimeo configuré dans VITE_VIMEO_ACCESS_TOKEN')
      return
    }
    
    addTestResult('Vérification du token', true, `Token présent: ${token.substring(0, 10)}... (longueur: ${token.length} caractères)`)
    
    // Test 2: Test direct de l'endpoint /me avec ton token
    try {
      console.log('[VimeoTest] Test direct de l\'endpoint /me...')
      const response = await fetch('https://api.vimeo.com/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.vimeo.*+json;version=3.4'
        }
      })
      
      console.log('[VimeoTest] Réponse /me:', response.status, response.statusText)
      
      if (response.ok) {
        const userData = await response.json()
        console.log('[VimeoTest] Données utilisateur:', userData)
        addTestResult('Test endpoint /me', true, `Utilisateur: ${userData.name}`, {
          name: userData.name,
          link: userData.link,
          account: userData.account,
          location: userData.location
        })
      } else {
        const errorText = await response.text()
        console.error('[VimeoTest] Erreur /me:', errorText)
        addTestResult('Test endpoint /me', false, `Erreur HTTP ${response.status}: ${errorText}`)
      }
    } catch (endpointError) {
      console.error('[VimeoTest] Erreur réseau /me:', endpointError)
      addTestResult('Test endpoint /me', false, `Erreur réseau: ${endpointError.message}`)
    }
    
    // Test 3: Test de l'endpoint /me/videos
    try {
      console.log('[VimeoTest] Test de l\'endpoint /me/videos...')
      const videosResponse = await fetch('https://api.vimeo.com/me/videos?per_page=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.vimeo.*+json;version=3.4'
        }
      })
      
      console.log('[VimeoTest] Réponse /me/videos:', videosResponse.status, videosResponse.statusText)
      
      if (videosResponse.ok) {
        const videosData = await videosResponse.json()
        console.log('[VimeoTest] Données vidéos:', videosData)
        addTestResult('Test endpoint /me/videos', true, `${videosData.total} vidéos trouvées, ${videosData.data?.length || 0} récupérées`, {
          total: videosData.total,
          page: videosData.page,
          per_page: videosData.per_page,
          paging: videosData.paging,
          firstVideo: videosData.data?.[0]
        })
      } else {
        const errorText = await videosResponse.text()
        console.error('[VimeoTest] Erreur /me/videos:', errorText)
        addTestResult('Test endpoint /me/videos', false, `Erreur HTTP ${videosResponse.status}: ${errorText}`)
      }
    } catch (videosError) {
      console.error('[VimeoTest] Erreur réseau /me/videos:', videosError)
      addTestResult('Test endpoint /me/videos', false, `Erreur réseau: ${videosError.message}`)
    }
    
    // Test 4: Test avec testVimeoAuth si disponible
    try {
      console.log('[VimeoTest] Test avec testVimeoAuth...')
      const authResult = await testVimeoAuth()
      if (authResult.success) {
        addTestResult('Test testVimeoAuth()', true, `Service auth OK: ${authResult.user?.name || 'Utilisateur'}`)
      } else {
        addTestResult('Test testVimeoAuth()', false, `Service auth KO: ${authResult.error}`)
      }
    } catch (authError) {
      console.error('[VimeoTest] Erreur testVimeoAuth:', authError)
      addTestResult('Test testVimeoAuth()', false, `Erreur service: ${authError.message}`)
    }
    
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
    console.log('[VimeoTest] Début de la récupération des vidéos...')
    
    // Test avec ton token depuis .env.production
    const envToken = import.meta?.env?.VITE_VIMEO_ACCESS_TOKEN
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('VIMEO_TOKEN_OVERRIDE') : null
    const token = localToken || envToken
    
    console.log('[VimeoTest] Token utilisé pour les vidéos:', token)
    
    if (!token) {
      addTestResult('Récupération vidéos', false, 'Aucun token disponible')
      return
    }
    
    // Test 1: Endpoint /me/videos direct
    try {
      console.log('[VimeoTest] Test /me/videos direct...')
      const response = await fetch('https://api.vimeo.com/me/videos?per_page=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.vimeo.*+json;version=3.4'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('[VimeoTest] Vidéos /me/videos:', data)
        addTestResult('Endpoint /me/videos', true, `${data.total} vidéos personnelles trouvées`)
        
        if (data.data && data.data.length > 0) {
          videos.value = data.data.slice(0, 5) // Afficher les 5 premières
        }
      } else {
        const errorText = await response.text()
        console.error('[VimeoTest] Erreur /me/videos:', errorText)
        addTestResult('Endpoint /me/videos', false, `Erreur ${response.status}: ${errorText}`)
      }
    } catch (error) {
      console.error('[VimeoTest] Erreur /me/videos:', error)
      addTestResult('Endpoint /me/videos', false, `Erreur: ${error.message}`)
    }
    
    // Test 2: Endpoint /me/folders pour voir les dossiers
    try {
      console.log('[VimeoTest] Test /me/folders...')
      const foldersResponse = await fetch('https://api.vimeo.com/me/folders?per_page=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.vimeo.*+json;version=3.4'
        }
      })
      
      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json()
        console.log('[VimeoTest] Dossiers trouvés:', foldersData)
        addTestResult('Endpoint /me/folders', true, `${foldersData.total} dossiers trouvés`, {
          folders: foldersData.data?.map(f => ({ name: f.name, uri: f.uri, video_count: f.metadata?.connections?.videos?.total }))
        })
        
        // Test des vidéos dans le premier dossier
        if (foldersData.data && foldersData.data.length > 0) {
          const firstFolder = foldersData.data[0]
          console.log('[VimeoTest] Test vidéos du premier dossier:', firstFolder.uri)
          
          try {
            const folderVideosResponse = await fetch(`https://api.vimeo.com${firstFolder.uri}/videos?per_page=5`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Accept': 'application/vnd.vimeo.*+json;version=3.4'
              }
            })
            
            if (folderVideosResponse.ok) {
              const folderVideosData = await folderVideosResponse.json()
              console.log('[VimeoTest] Vidéos du dossier:', folderVideosData)
              addTestResult(`Vidéos dossier "${firstFolder.name}"`, true, `${folderVideosData.total} vidéos dans le dossier`)
            } else {
              const errorText = await folderVideosResponse.text()
              addTestResult(`Vidéos dossier "${firstFolder.name}"`, false, `Erreur ${folderVideosResponse.status}: ${errorText}`)
            }
          } catch (folderError) {
            addTestResult(`Vidéos dossier "${firstFolder.name}"`, false, `Erreur: ${folderError.message}`)
          }
        }
      } else {
        const errorText = await foldersResponse.text()
        console.error('[VimeoTest] Erreur /me/folders:', errorText)
        addTestResult('Endpoint /me/folders', false, `Erreur ${foldersResponse.status}: ${errorText}`)
      }
    } catch (error) {
      console.error('[VimeoTest] Erreur /me/folders:', error)
      addTestResult('Endpoint /me/folders', false, `Erreur: ${error.message}`)
    }
    
    // Test 3: Utilisation du service listAllVideos
    try {
      console.log('[VimeoTest] Test avec listAllVideos du service...')
      const allVideos = await listAllVideos()
      console.log('[VimeoTest] Résultat listAllVideos:', allVideos)
      
      if (allVideos && allVideos.length > 0) {
        addTestResult('Service listAllVideos()', true, `${allVideos.length} vidéos récupérées via le service`)
        
        // Afficher quelques vidéos si on n'en a pas déjà
        if (videos.value.length === 0) {
          videos.value = allVideos.slice(0, 5)
        }
      } else {
        addTestResult('Service listAllVideos()', false, 'Aucune vidéo récupérée via le service')
      }
    } catch (serviceError) {
      console.error('[VimeoTest] Erreur listAllVideos:', serviceError)
      addTestResult('Service listAllVideos()', false, `Erreur service: ${serviceError.message}`)
    }
    
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
