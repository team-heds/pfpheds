<template>
  <div class="media-hub">
    <div class="header">
      <h2 class="title">Bibliothèque Multimédia</h2>
      <p class="subtitle">Vidéos par année et par module (Vimeo)</p>
    </div>

    <TabView v-model:activeIndex="activeTab">
      <TabPanel header="Bibliothèque">
        <div class="filters">
          <Dropdown v-model="selectedYear" :options="years" optionLabel="label" optionValue="id" placeholder="Sélectionner une année" class="mr-3 w-16rem" />
          <Dropdown v-model="selectedModule" :options="modules" optionLabel="title" optionValue="id" placeholder="Sélectionner un module" class="mr-3 w-20rem" :disabled="!selectedYear" />
          <span class="p-input-icon-left w-20rem">
            <i class="pi pi-search" />
            <InputText v-model="searchText" placeholder="Rechercher une vidéo" class="w-full" />
          </span>
        </div>

        <div v-if="videosLoading" class="mt-4">
          <Skeleton height="12rem" class="mb-3" v-for="i in 3" :key="i" />
        </div>
        <div v-else class="video-grid">
          <div v-if="videos.length === 0" class="empty">Aucune vidéo trouvée.</div>
          <div v-else class="grid">
            <div v-for="v in videos" :key="v.id" class="col-12 md:col-6 lg:col-4">
              <Card class="video-card" @click="openVideo(v)">
                <template #title>
                  <div class="flex align-items-center justify-content-between">
                    <span>{{ v.title || 'Sans titre' }}</span>
                    <Tag :value="statusLabel(v.visibility)" :severity="statusSeverity(v.visibility)" />
                  </div>
                </template>
                <template #content>
                  <div class="thumb" :style="thumbStyle(v)"></div>
                  <div class="mt-2 text-600">{{ (v.description || '').slice(0, 120) }}</div>
                </template>
              </Card>
            </div>
          </div>
        </div>

        <Dialog v-model:visible="viewerVisible" modal header="Lecture vidéo" :style="{ width: '70vw' }">
          <div v-if="currentVideo">
            <VideoPlayerVimeo :vimeo-id="currentVideo.vimeoId" class="mb-3" />
            <div class="text-xl font-medium mb-1">{{ currentVideo.title }}</div>
            <div class="text-600">{{ currentVideo.description }}</div>
          </div>
        </Dialog>
      </TabPanel>

      <TabPanel v-if="hasRole('profMultimedia')" header="Validation">
        <div class="mb-3 text-600">Vidéos en revue</div>
        <DataTable :value="inReviewVideos" :loading="inReviewLoading" responsive-layout="scroll">
          <Column field="title" header="Titre" />
          <Column field="moduleId" header="Module" />
          <Column field="createdAt" header="Créée" />
          <Column header="Actions">
            <template #body="{ data }">
              <Button label="Publier" icon="pi pi-upload" size="small" @click="publish(data)" />
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <TabPanel v-if="hasRole('profMultimedia')" header="Tickets">
        <div class="mb-3 flex align-items-center gap-2">
          <Button label="Nouveau ticket" icon="pi pi-plus" @click="openNewTicket" />
        </div>
        <DataTable :value="tickets" :loading="ticketsLoading" responsive-layout="scroll">
          <Column field="title" header="Titre" />
          <Column field="status" header="Statut" />
          <Column field="priority" header="Priorité" />
          <Column field="createdAt" header="Créé" />
          <Column header="Actions">
            <template #body="{ data }">
              <Button v-if="data.status==='open'" label="Clore" icon="pi pi-check" size="small" class="p-button-success p-button-text" @click="closeTicket(data)" />
            </template>
          </Column>
        </DataTable>
      </TabPanel>

      <TabPanel header="Vidéos Vimeo">
        <div class="mb-3 flex align-items-center gap-2">
          <span class="p-input-icon-left w-20rem">
            <i class="pi pi-search" />
            <InputText v-model="vimeoSearch" placeholder="Rechercher sur Vimeo" class="w-full" @keyup="onVimeoKeyup" />
          </span>
          <Button label="Actualiser" icon="pi pi-refresh" class="p-button-text" @click="loadVimeoVideos" />
          <!-- <Button label="Tester Auth" icon="pi pi-shield" class="p-button-text" @click="runVimeoAuthTest" /> -->
          <!-- <Button label="Debug Env" icon="pi pi-cog" class="p-button-text" @click="debugEnvironment" /> -->
         </div>
         <div v-if="vimeoDebug" class="mt-2 text-600" style="white-space:pre-wrap; word-break:break-word;">
           {{ vimeoDebug }}
         </div>
         <div v-if="vimeoLoading" class="mt-4">
           <div class="text-center">
             <ProgressSpinner style="width:50px;height:50px" strokeWidth="4" />
             <p class="mt-2 text-600">Chargement des vidéos Vimeo...</p>
           </div>
         </div>
         <div v-else-if="vimeoVideos.length === 0" class="mt-4 text-center">
           <div class="text-6xl text-300 mb-3">
             <i class="pi pi-video"></i>
           </div>
           <h3 class="text-700">Aucune vidéo trouvée</h3>
           <p class="text-600 mb-4">Cliquez sur "Actualiser" pour charger vos vidéos Vimeo</p>
           <Button label="Actualiser" icon="pi pi-refresh" @click="loadVimeoVideos" />
         </div>
         <div v-else>
           <DataTable :value="vimeoVideosPaginated" responsive-layout="scroll" class="mt-3">
             <Column header="Aperçu" style="width: 120px">
               <template #body="{ data }">
                 <img v-if="data.thumbnail" :src="data.thumbnail" alt="thumb" style="width:96px;height:54px;object-fit:cover;border-radius:6px;" />
                 <div v-else class="w-6rem h-3rem bg-gray-200 border-round flex align-items-center justify-content-center">
                   <i class="pi pi-video text-gray-500"></i>
                 </div>
               </template>
             </Column>
             <Column field="title" header="Titre">
               <template #body="{ data }">
                 <div class="font-medium">{{ data.title }}</div>
                 <div class="text-sm text-500" v-if="data.description">
                   {{ data.description.substring(0, 100) }}{{ data.description.length > 100 ? '...' : '' }}
                 </div>
               </template>
             </Column>
             <Column field="duration" header="Durée" style="width: 100px" />
             <Column field="privacy" header="Confidentialité" style="width: 120px">
               <template #body="{ data }">
                 <Tag :value="data.privacy" :severity="data.privacy === 'anybody' ? 'success' : 'warning'" />
               </template>
             </Column>
             <Column header="Actions" style="width: 100px">
               <template #body="{ data }">
                 <Button label="Ouvrir" icon="pi pi-play" size="small" @click="openVimeoVideo(data)" />
               </template>
             </Column>
           </DataTable>
         </div>
         <div v-if="vimeoVideosFiltered.length > 0" class="flex justify-content-between align-items-center mt-3">
           <span class="text-600">{{ vimeoVideosFiltered.length }} vidéo(s) • Page {{ vimeoCurrentPage }} sur {{ vimeoTotalPages }}</span>
           <div class="flex gap-2">
             <Button label="Précédent" icon="pi pi-chevron-left" :disabled="vimeoCurrentPage <= 1" @click="vimeoPreviousPage" />
             <Button label="Suivant" icon="pi pi-chevron-right" :disabled="vimeoCurrentPage >= vimeoTotalPages" @click="vimeoNextPage" />
           </div>
         </div>
         <div v-if="vimeoVideos.length > 0" class="text-center mt-2">
           <small class="text-500">Total exact : {{ vimeoVideos.length }} vidéos dans votre compte Vimeo</small>
         </div>
         <Dialog v-model:visible="vimeoViewerVisible" modal header="Lecture Vimeo" :style="{ width: '70vw' }">
           <div v-if="selectedVimeo">
             <VideoPlayerVimeo :vimeo-id="selectedVimeo.id" class="mb-3" />
             <div class="text-xl font-medium mb-1">{{ selectedVimeo.title }}</div>
             <div class="text-600">{{ selectedVimeo.description }}</div>
             <div class="text-sm text-500 mt-2">
               Durée: {{ selectedVimeo.duration }} • Confidentialité: {{ selectedVimeo.privacy }}
             </div>
           </div>
         </Dialog>
       </TabPanel>
     </TabView>

     <Dialog v-model:visible="ticketDialog" modal header="Créer un ticket" :style="{ width: '40rem' }">
       <div class="p-fluid">
         <div class="field">
           <label for="tTitle">Titre</label>
           <InputText id="tTitle" v-model="ticketForm.title" />
         </div>
         <div class="field">
           <label for="tType">Type</label>
           <Dropdown id="tType" v-model="ticketForm.type" :options="ticketTypes" />
         </div>
         <div class="field">
           <label for="tPriority">Priorité</label>
           <Dropdown id="tPriority" v-model="ticketForm.priority" :options="ticketPriorities" />
         </div>
         <div class="field">
           <label for="tDesc">Description</label>
           <Textarea id="tDesc" v-model="ticketForm.description" rows="5" />
         </div>
         <div class="flex justify-content-end gap-2">
           <Button label="Annuler" class="p-button-text" @click="ticketDialog=false" />
           <Button label="Créer" icon="pi pi-check" @click="createTicketAction" />
         </div>
       </div>
     </Dialog>
     <!-- Anchor for scroll-to-bottom with small margin -->
    <div ref="pageEnd" style="height: 24px;"></div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted, nextTick } from 'vue'
import { getAuth, onAuthStateChanged } from 'firebase/auth'
import { getDatabase, ref as dbRef, get } from 'firebase/database'
import { listYears, listModules, listVideos, getVideo, publishVideo, createTicket, listTickets, updateTicketStatus } from '@/service/mediaService'
import VideoPlayerVimeo from '@/components/media/VideoPlayerVimeo.vue'
import { listAllVideos, testVimeoAuth } from '@/service/vimeoService'
import { envTest } from '@/utils/envTest'

// Auth & roles (local)
const userUid = ref(null)
const userRoles = ref({})

const activeTab = ref(0)
const years = ref([])
const modules = ref([])
const videos = ref([])
const videosLoading = ref(false)

const selectedYear = ref(null)
const selectedModule = ref(null)
const searchText = ref('')

const viewerVisible = ref(false)
const currentVideo = ref(null)

const inReviewVideos = ref([])
const inReviewLoading = ref(false)

const tickets = ref([])
const ticketsLoading = ref(false)

const ticketDialog = ref(false)
const ticketForm = ref({ title: '', type: 'issue', priority: 'normal', description: '' })
const ticketTypes = ['issue','request','other']
const ticketPriorities = ['low','normal','high']

// Vimeo listing (moved into script setup)
const vimeoVideos = ref([])
const vimeoLoading = ref(false)
const vimeoSearch = ref('')
const vimeoViewerVisible = ref(false)
const selectedVimeo = ref(null)
const vimeoDebug = ref('')
const vimeoTokenInput = ref('')
const pageEnd = ref(null)

const vimeoVideosFiltered = computed(() => {
  const q = (vimeoSearch.value || '').toLowerCase()
  let filtered = vimeoVideos.value
  if (q) {
    filtered = vimeoVideos.value.filter(v => (v.title||'').toLowerCase().includes(q) || (v.description||'').toLowerCase().includes(q))
  }
  return filtered
})

const vimeoCurrentPage = ref(1)
const vimeoItemsPerPage = 100
const vimeoTotalPages = computed(() => Math.ceil(vimeoVideosFiltered.value.length / vimeoItemsPerPage))

const vimeoVideosPaginated = computed(() => {
  const start = (vimeoCurrentPage.value - 1) * vimeoItemsPerPage
  const end = start + vimeoItemsPerPage
  return vimeoVideosFiltered.value.slice(start, end)
})

async function loadVimeoVideos() {
  vimeoLoading.value = true
  vimeoCurrentPage.value = 1 // Reset to first page when loading new videos
  
  try {
    console.log('[MediaHub] Chargement des vidéos Vimeo...')
    console.log('[MediaHub] import.meta:', import.meta)
    console.log('[MediaHub] import.meta.env:', import.meta.env)
    console.log('[MediaHub] Toutes les variables d\'environnement Vimeo:', {
      VITE_VIMEO_ACCESS_TOKEN: import.meta?.env?.VITE_VIMEO_ACCESS_TOKEN,
      NODE_ENV: import.meta?.env?.NODE_ENV,
      MODE: import.meta?.env?.MODE,
      DEV: import.meta?.env?.DEV,
      PROD: import.meta?.env?.PROD,
      BASE_URL: import.meta?.env?.BASE_URL
    })
    
    // Utiliser le token depuis .env (maintenant synchronisé avec .env.production)
    const envToken = import.meta?.env?.VITE_VIMEO_ACCESS_TOKEN
    const localToken = typeof window !== 'undefined' ? localStorage.getItem('VIMEO_TOKEN_OVERRIDE') : null
    const token = localToken || envToken
    
    console.log('[MediaHub] Token depuis .env:', envToken)
    console.log('[MediaHub] Type du token:', typeof envToken)
    console.log('[MediaHub] Token override localStorage:', localToken)
    console.log('[MediaHub] Token final utilisé:', token)
    console.log('[MediaHub] Type du token final:', typeof token)
    
    if (!token) {
      vimeoDebug.value = '❌ Aucun token Vimeo configuré.\n\nDEBUG INFO:\n' + 
        `• Token depuis env: ${envToken} (${typeof envToken})\n` +
        `• Token depuis localStorage: ${localToken} (${typeof localToken})\n` +
        `• import.meta.env: ${JSON.stringify(import.meta.env, null, 2)}\n\n` +
        'Vérifiez que VITE_VIMEO_ACCESS_TOKEN est dans votre fichier .env\n\n' +
        'Redémarrez le serveur de développement après modification.'
      return
    }

    // Récupération via le service avec logs détaillés
    console.log('[MediaHub] Appel à listAllVideos...')
    const fetchedVideos = await listAllVideos({ 
      query: vimeoSearch.value, 
      perPage: 100, 
      maxPages: 999,
      token: token // Passer le token explicitement
    })
    
    console.log('[MediaHub] Vidéos récupérées:', fetchedVideos)
    
    if (!fetchedVideos || fetchedVideos.length === 0) {
      vimeoDebug.value = '⚠️ Aucune vidéo trouvée. Vérifiez:\n• Le token Vimeo est valide\n• Les permissions du token\n• Que vous avez des vidéos sur votre compte'
      vimeoVideos.value = []
    } else {
      // Formatage des vidéos pour l'affichage
      const formattedVideos = fetchedVideos.map(video => ({
        id: video.id || video.uri?.split('/').pop(),
        title: video.name || 'Sans titre',
        description: video.description || '',
        duration: formatDuration(video.duration || 0),
        thumbnail: video.pictures?.length > 0 ? video.pictures[video.pictures.length - 1]?.link : '',
        link: video.link || '',
        privacy: video.privacy || 'unknown',
        created_time: video.created_time || '',
        modified_time: video.modified_time || ''
      }))
      
      console.log('[MediaHub] Vidéos formatées:', formattedVideos)
      vimeoVideos.value = formattedVideos
      vimeoDebug.value = `✅ ${fetchedVideos.length} vidéos récupérées avec succès depuis l'API Vimeo`
    }
  } catch (error) {
    console.error('[MediaHub] Erreur lors du chargement des vidéos Vimeo:', error)
    vimeoDebug.value = `❌ Erreur lors du chargement des vidéos:\n${error.message}\n\nVérifiez la console pour plus de détails.`
    vimeoVideos.value = []
  } finally { 
    vimeoLoading.value = false 
  }
}

// Fonction helper pour formater la durée
function formatDuration(seconds) {
  if (!seconds) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function openVimeoVideo(v) {
  selectedVimeo.value = v
  vimeoViewerVisible.value = true
}

function onVimeoKeyup(e) {
  if (e && e.key === 'Enter') {
    loadVimeoVideos()
  }
}

async function runVimeoAuthTest() {
  const res = await testVimeoAuth()
  vimeoDebug.value = `Auth test -> ok: ${res.ok}, status: ${res.status}\n${res.body}`
}

function applyVimeoTokenOverride() {
  if (vimeoTokenInput.value) {
    localStorage.setItem('VIMEO_TOKEN_OVERRIDE', vimeoTokenInput.value)
    vimeoDebug.value = 'Token override enregistré en localStorage. Relance le test.'
  }
}

function clearVimeoTokenOverride() {
  localStorage.removeItem('VIMEO_TOKEN_OVERRIDE')
  vimeoDebug.value = 'Token override supprimé.'
}

function hasRole(role) {
  return !!userRoles.value?.[role]
}

function statusLabel(v) {
  const map = { draft: 'Brouillon', in_review: 'En revue', published: 'Publié', archived: 'Archivé' }
  return map[v] || v
}
function statusSeverity(v) {
  const map = { draft: 'secondary', in_review: 'warning', published: 'success', archived: 'danger' }
  return map[v] || 'info'
}
function thumbStyle(v) {
  // Placeholder style; could fetch from Vimeo meta later
  return { background: '#f5f7fa', height: '160px', borderRadius: '8px' }
}

async function fetchYears() {
  years.value = await listYears()
}
async function fetchModules() {
  if (!selectedYear.value) { modules.value = []; return }
  modules.value = await listModules(selectedYear.value)
}
async function fetchVideos() {
  if (!selectedModule.value) { videos.value = []; return }
  videosLoading.value = true
  try {
    const all = await listVideos({ moduleId: selectedModule.value })
    const filtered = all.filter(v => v.visibility === 'published' || hasRole('profMultimedia'))
    const t = (searchText.value || '').toLowerCase()
    videos.value = t ? filtered.filter(v => (v.title||'').toLowerCase().includes(t) || (v.description||'').toLowerCase().includes(t)) : filtered
  } finally {
    videosLoading.value = false
  }
}

function openVideo(v) {
  currentVideo.value = v
  viewerVisible.value = true
}

async function publish(row) {
  await publishVideo(row.id, userUid.value)
  await loadInReview()
  await fetchVideos()
}

async function loadInReview() {
  if (!hasRole('profMultimedia')) return
  inReviewLoading.value = true
  try {
    // reuse listVideos by module if needed; here simplistic: need selectedModule
    if (!selectedModule.value) { inReviewVideos.value = []; return }
    const all = await listVideos({ moduleId: selectedModule.value })
    inReviewVideos.value = all.filter(v => v.visibility === 'in_review')
  } finally { inReviewLoading.value = false }
}

function openNewTicket() { ticketDialog.value = true }
async function createTicketAction() {
  ticketsLoading.value = true
  try {
    await createTicket({
      title: ticketForm.value.title,
      type: ticketForm.value.type,
      priority: ticketForm.value.priority,
      description: ticketForm.value.description,
    })
    ticketDialog.value = false
    ticketForm.value = { title: '', type: 'issue', priority: 'normal', description: '' }
    await loadTickets()
  } finally {
    ticketsLoading.value = false
  }
}

async function loadTickets() {
  if (!hasRole('profMultimedia')) return
  ticketsLoading.value = true
  try {
    tickets.value = await listTickets()
  } finally {
    ticketsLoading.value = false
  }
}

async function closeTicket(t) {
  await updateTicketStatus(t.id, 'closed')
  await loadTickets()
}

function vimeoPreviousPage() {
  if (vimeoCurrentPage.value > 1) {
    vimeoCurrentPage.value -= 1
  }
}

function vimeoNextPage() {
  if (vimeoCurrentPage.value < vimeoTotalPages.value) {
    vimeoCurrentPage.value += 1
  }
}

function debugEnvironment() {
  console.log('=== DEBUG ENVIRONNEMENT ===')
  console.log('import.meta:', import.meta)
  console.log('import.meta.env:', import.meta.env)
  
  // Test direct des variables
  const allVars = import.meta.env
  console.log('Toutes les variables:', allVars)
  
  // Variables spécifiques
  const vimeoToken = import.meta.env.VITE_VIMEO_ACCESS_TOKEN
  const firebaseProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID
  const firebaseDatabaseUrl = import.meta.env.VITE_FIREBASE_DATABASE_URL
  
  console.log('Variables critiques:')
  console.log('- VITE_VIMEO_ACCESS_TOKEN:', vimeoToken, typeof vimeoToken)
  console.log('- VITE_FIREBASE_PROJECT_ID:', firebaseProjectId, typeof firebaseProjectId)
  console.log('- VITE_FIREBASE_DATABASE_URL:', firebaseDatabaseUrl, typeof firebaseDatabaseUrl)
  
  // Affichage dans l'interface
  vimeoDebug.value = `=== DEBUG ENVIRONNEMENT ===\n\n` +
    `🔍 Variables détectées:\n` +
    `• VITE_VIMEO_ACCESS_TOKEN: ${vimeoToken ? '✅ Présent' : '❌ Manquant'} (${typeof vimeoToken})\n` +
    `• VITE_FIREBASE_PROJECT_ID: ${firebaseProjectId ? '✅ Présent' : '❌ Manquant'} (${typeof firebaseProjectId})\n` +
    `• VITE_FIREBASE_DATABASE_URL: ${firebaseDatabaseUrl ? '✅ Présent' : '❌ Manquant'} (${typeof firebaseDatabaseUrl})\n\n` +
    `📊 Nombre total de variables: ${Object.keys(allVars).length}\n\n` +
    `🔧 Variables commençant par VITE_:\n` +
    Object.keys(allVars)
      .filter(key => key.startsWith('VITE_'))
      .map(key => `• ${key}: ${allVars[key] ? '✅' : '❌'}`)
      .join('\n')
}

onMounted(async () => {
  // Test des variables d'environnement au démarrage
  console.log('[MediaHub] Test des variables d\'environnement au montage du composant:')
  const envTestResult = envTest()
  console.log('[MediaHub] Résultat du test env:', envTestResult)
  
  // auth state
  const auth = getAuth()
  const db = getDatabase()
  onAuthStateChanged(auth, async (user) => {
    userUid.value = user?.uid || null
    if (userUid.value) {
      const rolesSnap = await get(dbRef(db, `Users/${userUid.value}/roles`))
      userRoles.value = rolesSnap.exists() ? rolesSnap.val() : {}
      await loadTickets()
    } else {
      userRoles.value = {}
      tickets.value = []
    }
    await fetchYears()
  })
  // auto-load when tab switches to Vimeo
  watch(activeTab, (idx) => {
    // assuming last tab is Vimeo; adapt index if order changes
    // Here tabs: 0=Bibliothèque, 1=Validation?, 2=Tickets?, 3=Vimeo (depending on roles)
    // Safer: trigger when header equals 'Vidéos Vimeo' but TabView API doesn't expose here; we'll load on first enter
    if (!vimeoVideos.value.length) {
      // Debounced initial load
      loadVimeoVideos()
    }
  })
  watch(selectedYear, () => { selectedModule.value = null; modules.value = []; fetchModules(); videos.value = [] })
  watch([selectedModule, searchText], fetchVideos)
})
</script>

<style scoped>
.media-hub { 
  padding: 1rem; 
  overflow-y: auto;
  max-height: calc(100vh - 80px);
  height: auto;
  min-height: calc(100vh - 80px);
}
.header { margin-bottom: 1rem; }
.title { margin: 0; }
.subtitle { margin: 0.25rem 0 0; color: var(--text-color-secondary); }
.filters { display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
.video-grid { margin-top: 1rem; }
.video-card { cursor: pointer; }
.thumb { background-size: cover; background-position: center; }
.empty { color: var(--text-color-secondary); padding: 2rem 0; }
</style>

<style>
/* Force scroll on layout containers - global styles */
.layout-content-wrapper {
  overflow-y: auto !important;
  height: auto !important;
  max-height: none !important;
}

.layout-content {
  overflow-y: auto !important;
  height: auto !important;
  max-height: none !important;
}
</style>
