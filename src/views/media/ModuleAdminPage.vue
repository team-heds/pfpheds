<template>
  <!-- ... (no changes) -->
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import InputText from 'primevue/inputtext'
import Textarea from 'primevue/textarea'
import Button from 'primevue/button'
import Dropdown from 'primevue/dropdown'
import Dialog from 'primevue/dialog'
import Toast from 'primevue/toast'

// Services
import { listAllVideos } from '@/service/vimeoService'
import { 
  getAllModules, 
  createModule as createModuleService,
  deleteModule as deleteModuleService,
  addVideoToModule,
  getModuleVideos,
  isVideoAssignedToModule
} from '@/service/moduleService'

const router = useRouter()
const toast = useToast()

// État réactif
const modules = ref([])
const vimeoVideos = ref([])
const selectedVideos = ref([])
const moduleSearchQuery = ref('')
const videoSearchQuery = ref('')
const videoStatusFilter = ref('all')
const syncingVimeo = ref(false)

// Dialogs
const showCreateModuleDialog = ref(false)
const showAssignDialog = ref(false)
const assignToModuleId = ref('')

// Formulaire nouveau module
const newModule = ref({
  name: '',
  description: '',
  thumbnail: ''
})

// Options de filtre
const videoStatusOptions = [
  { label: 'Toutes', value: 'all' },
  { label: 'Assignées', value: 'assigned' },
  { label: 'Non assignées', value: 'unassigned' }
]

// Computed
const filteredModules = computed(() => {
  if (!moduleSearchQuery.value.trim()) return modules.value
  
  const query = moduleSearchQuery.value.toLowerCase()
  return modules.value.filter(module => 
    module.name.toLowerCase().includes(query) ||
    module.description?.toLowerCase().includes(query)
  )
})

const filteredVimeoVideos = computed(() => {
  let filtered = vimeoVideos.value

  // Filtrer par recherche
  if (videoSearchQuery.value.trim()) {
    const query = videoSearchQuery.value.toLowerCase()
    filtered = filtered.filter(video => 
      video.title.toLowerCase().includes(query) ||
      video.description?.toLowerCase().includes(query)
    )
  }

  // Filtrer par statut d'assignation
  if (videoStatusFilter.value === 'assigned') {
    filtered = filtered.filter(video => isVideoAssigned(video.id))
  } else if (videoStatusFilter.value === 'unassigned') {
    filtered = filtered.filter(video => !isVideoAssigned(video.id))
  }

  return filtered
})

const unassignedVideos = computed(() => 
  vimeoVideos.value.filter(video => !isVideoAssigned(video.id))
)

const totalVideos = computed(() => 
  modules.value.reduce((sum, module) => sum + (module.videoCount || 0), 0)
)

const validatedVideos = computed(() => 
  modules.value.reduce((sum, module) => sum + (module.validatedCount || 0), 0)
)

// Méthodes
const loadData = async () => {
  try {
    // Charger les modules
    modules.value = await getAllModules()
    
    // Charger les vidéos Vimeo
    await syncVimeoVideos()
  } catch (error) {
    console.error('Error loading data:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de charger les données',
      life: 3000
    })
  }
}

const syncVimeoVideos = async () => {
  syncingVimeo.value = true
  try {
    console.log('[ModuleAdmin] Début de la synchronisation Vimeo...')
    
    // Vérifier le token
    const token = import.meta?.env?.VITE_VIMEO_ACCESS_TOKEN || localStorage.getItem('VIMEO_TOKEN_OVERRIDE')
    console.log('[ModuleAdmin] Token Vimeo présent:', !!token)
    console.log('[ModuleAdmin] Token (premiers caractères):', token ? token.substring(0, 10) + '...' : 'AUCUN')
    
    const videos = await listAllVideos({ perPage: 100, maxPages: 10 })
    console.log('[ModuleAdmin] Réponse brute de listAllVideos:', videos)
    
    if (!videos || videos.length === 0) {
      console.warn('[ModuleAdmin] Aucune vidéo récupérée depuis Vimeo')
      toast.add({
        severity: 'warn',
        summary: 'Aucune vidéo',
        detail: 'Aucune vidéo trouvée sur votre compte Vimeo',
        life: 5000
      })
      return
    }
    
    // Transformer les données Vimeo pour notre format
    vimeoVideos.value = videos.map(video => {
      console.log('[ModuleAdmin] Traitement vidéo:', video.name || video.title, video)
      return {
        id: video.id || video.uri?.split('/').pop(),
        vimeoId: video.id || video.uri?.split('/').pop(),
        title: video.name || video.title || 'Titre non disponible',
        description: video.description || '',
        thumbnail: video.pictures?.sizes?.[0]?.link || video.thumbnail_url || null,
        duration: formatDuration(video.duration),
        uploadDate: new Date(video.created_time || video.upload_date || Date.now()),
        fileSize: formatFileSize(video.files?.[0]?.size),
        vimeoUrl: video.link || video.player_embed_url
      }
    })
    
    console.log(`[ModuleAdmin] ${vimeoVideos.value.length} vidéos transformées:`, vimeoVideos.value)
    
    toast.add({
      severity: 'success',
      summary: 'Synchronisation réussie',
      detail: `${vimeoVideos.value.length} vidéos récupérées depuis Vimeo`,
      life: 3000
    })
  } catch (error) {
    console.error('[ModuleAdmin] Erreur lors de la synchronisation Vimeo:', error)
    console.error('[ModuleAdmin] Stack trace:', error.stack)
    
    toast.add({
      severity: 'error',
      summary: 'Erreur de synchronisation',
      detail: `Impossible de récupérer les vidéos Vimeo: ${error.message}`,
      life: 5000
    })
  } finally {
    syncingVimeo.value = false
  }
}

const createModule = async () => {
  try {
    const moduleData = {
      name: newModule.value.name,
      description: newModule.value.description,
      thumbnail: newModule.value.thumbnail || `https://via.placeholder.com/300x200/4f46e5/white?text=${encodeURIComponent(newModule.value.name)}`
    }
    
    const createdModule = await createModuleService(moduleData)
    modules.value.push(createdModule)
    
    // Reset form
    newModule.value = { name: '', description: '', thumbnail: '' }
    showCreateModuleDialog.value = false
    
    toast.add({
      severity: 'success',
      summary: 'Module créé',
      detail: `Le module "${createdModule.name}" a été créé avec succès`,
      life: 3000
    })
  } catch (error) {
    console.error('Error creating module:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de créer le module',
      life: 3000
    })
  }
}

const deleteModule = async (moduleId) => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer ce module ?')) return
  
  try {
    await deleteModuleService(moduleId)
    modules.value = modules.value.filter(m => m.id !== moduleId)
    
    toast.add({
      severity: 'info',
      summary: 'Module supprimé',
      detail: 'Le module a été supprimé avec succès',
      life: 3000
    })
  } catch (error) {
    console.error('Error deleting module:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible de supprimer le module',
      life: 3000
    })
  }
}

const viewModule = (moduleId) => {
  router.push(`/modules/${moduleId}/videos`)
}

const editModule = (module) => {
  // TODO: Implémenter l'édition de module
  console.log('Edit module:', module)
}

const assignVideosToModule = (module) => {
  assignToModuleId.value = module.id
  showAssignDialog.value = true
}

const toggleVideoSelection = (videoId) => {
  const index = selectedVideos.value.indexOf(videoId)
  if (index > -1) {
    selectedVideos.value.splice(index, 1)
  } else {
    selectedVideos.value.push(videoId)
  }
}

const selectAllVideos = () => {
  selectedVideos.value = filteredVimeoVideos.value.map(v => v.id)
}

const assignSelectedVideos = async () => {
  try {
    const promises = selectedVideos.value.map(videoId => {
      const video = vimeoVideos.value.find(v => v.id === videoId)
      return addVideoToModule(assignToModuleId.value, {
        title: video.title,
        description: video.description,
        vimeoId: video.vimeoId,
        thumbnail: video.thumbnail,
        duration: video.duration,
        fileSize: video.fileSize,
        uploadDate: video.uploadDate.toISOString(),
        vimeoUrl: video.vimeoUrl
      })
    })
    
    await Promise.all(promises)
    
    // Recharger les modules pour mettre à jour les stats
    modules.value = await getAllModules()
    
    // Reset
    selectedVideos.value = []
    assignToModuleId.value = ''
    showAssignDialog.value = false
    
    toast.add({
      severity: 'success',
      summary: 'Vidéos assignées',
      detail: `${promises.length} vidéo(s) assignée(s) au module`,
      life: 3000
    })
  } catch (error) {
    console.error('Error assigning videos:', error)
    toast.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Impossible d\'assigner les vidéos',
      life: 3000
    })
  }
}

const isVideoAssigned = (videoId) => {
  // TODO: Vérifier si la vidéo est assignée à un module
  // Pour l'instant, on retourne false
  return false
}

const getAssignmentStatus = (videoId) => {
  return isVideoAssigned(videoId) ? 'assigned' : 'unassigned'
}

const getAssignmentLabel = (videoId) => {
  return isVideoAssigned(videoId) ? 'Assignée' : 'Non assignée'
}

const formatDate = (date) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

const formatDuration = (seconds) => {
  if (!seconds) return '00:00'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const formatFileSize = (bytes) => {
  if (!bytes) return 'N/A'
  const mb = bytes / (1024 * 1024)
  return `${Math.round(mb)} MB`
}

// Lifecycle
onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* ... (no changes) */
</style>
