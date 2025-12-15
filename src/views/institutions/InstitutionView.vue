<template>
  <Navbar />
  <div class="p-4 border-round scrollable-with-padding">
    <div class="institution-container">
      <div class="institution-info px-2 mb-2">
        <h1 class="text-900 font-medium text-4xl md:text-6xl mb-2">
          {{ institutionDetails ? institutionDetails.Name : 'Chargement...' }}
        </h1>
        <h2 class="text-900 font-bold text-2xl md:text-3xl mb-4 mt-2">
          <strong>{{ institutionDetails ? institutionDetails.Locality : '' }}</strong> - {{ institutionDetails ? institutionDetails.Address : '' }}
        </h2>
        <div class="flex flex-wrap justify-content-center md:justify-content-start gap-3 mt-2">
          <span class="inline-flex align-items-center py-2 px-3 font-medium border-1 surface-border border-round">
            <i class="pi pi-comments text-primary mr-2"></i>
            <span class="text-900">Langue : {{ institutionDetails ? institutionDetails.Language : '' }}</span>
          </span>
          <span class="inline-flex align-items-center py-2 px-3 font-medium border-1 surface-border border-round">
            <i class="pi pi-compass text-primary mr-2"></i>
            <span class="text-900">Canton : {{ institutionDetails ? institutionDetails.Canton : '' }}</span>
          </span>
        </div>
      </div>
    </div>

    <div class="institution-image-wrapper institution-image text-center my-4">
      <img :src="primaryImage" alt="Institution" class="institution-image w-100px" />
    </div>

    <div class="content-lower grid justify-content-center">
      <div class="col-12 md:col-8 lg:col-5">
        <TabView v-model:activeIndex="activeIndex">
          <TabPanel header="Informations générales de l'institution">
            <div v-if="institutionDetails?.Description" class="text-900 font-bold text-3xl mb-4 mt-2">Description</div>
            <p v-if="institutionDetails?.Description" class="line-height-3 text-600 p-0 mx-0 mt-0 mb-4">
              {{ institutionDetails.Description }}
            </p>

            <div class="grid">
              <div class="col-12">
                <p class="text-900 underline mb-3 font-bold">Informations générales</p>
                <div class="py-0 p-0 m-0 text-600 mb-3">
                  <p class="card-text"><i class="bi bi-globe"></i> <strong>Langue:</strong> {{ institutionDetails?.Language }}</p>
                  <p class="card-text"><i class="bi bi-geo-alt-fill"></i> <strong>Canton:</strong> {{ institutionDetails?.Canton }}</p>
                  <p class="card-text"><i class="bi bi-geo-alt-fill"></i> <strong>Adresse:</strong> {{ institutionDetails?.Address }}</p>
                  <p class="card-text"><i class="bi bi-geo-alt-fill"></i> <strong>Lieu:</strong> {{ institutionDetails?.Locality }}</p>
                  <p class="card-text" v-if="institutionDetails?.URL"><i class="bi bi-link-45deg"></i> <strong>Site Web:</strong>
                    <a :href="institutionDetails.URL" target="_blank" class="text-primary">{{ institutionDetails.URL }}</a>
                  </p>
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel header="Encadrement étudiant">
            <div class="grid">
              <div class="col-12">
                <div class="text-900 font-bold text-3xl mb-4 mt-2">Encadrement étudiant</div>
                <div class="list-none p-0 m-0 text-600 mb-4">
                  <div v-if="institutionDetails">
                    <p class="card-text">
                      <i class="bi bi-person-badge-fill"></i>
                      <strong>Nom, Prénom du responsable physio:</strong> {{ institutionDetails.NomChef || '—' }}
                    </p>
                    <p class="card-text">
                      <i class="bi bi-envelope-fill"></i>
                      <strong>Email du responsable physio:</strong>
                      <a v-if="institutionDetails.MailChef" :href="`mailto:${institutionDetails.MailChef}`" class="text-primary">
                        {{ institutionDetails.MailChef }}
                      </a>
                      <span v-else>—</span>
                    </p>
                    <p class="card-text">
                      <i class="bi bi-telephone-fill"></i>
                      <strong>Téléphone du responsable physio:</strong>
                      <a v-if="institutionDetails.PhoneChef" :href="`tel:${institutionDetails.PhoneChef}`" class="text-primary">
                        {{ institutionDetails.PhoneChef }}
                      </a>
                      <span v-else>—</span>
                    </p>
                  </div>
                  <div v-else>
                    <p class="card-text">Aucun praticien formateur disponible.</p>
                  </div>

                  <div v-if="institutionFiles.length > 0" class="mt-4">
                    <h3 class="text-900 font-bold text-xl mb-3">
                      {{ institutionFiles.length === 1 ? 'Descriptif lieu de formation pratique' : 'Descriptifs lieux de formation pratique' }}
                    </h3>
                    <ul class="list-none pl-0">
                      <li v-for="file in institutionFiles" :key="file.url" class="mb-2 flex align-items-center gap-2">
                        <a 
                          :href="file.url" 
                          target="_blank" 
                          class="text-primary hover:underline flex-1"
                          @click="handleFileClick(file)"
                        >
                          📄 {{ file.name }}
                        </a>
                        <span v-if="file.isGlobal" class="text-xs text-500 bg-blue-50 px-2 py-1 border-round">
                          Document global
                        </span>
                        <span v-if="file.warning" class="text-xs text-orange-600">
                          ⚠️ {{ file.warning }}
                        </span>
                      </li>
                    </ul>
                  </div>
                  <div v-else-if="loadingFiles" class="mt-3">
                    <i class="pi pi-spin pi-spinner mr-2"></i>
                    <span>Chargement des documents...</span>
                  </div>
                  <p v-else class="mt-3">Aucun PDF disponible pour cette institution.</p>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>

      <div class="col-12 md:col-4 lg:col-5 py-3 lg:pl-6">
        <div id="map" class="shadow map-container"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ref as firebaseDbRef, onValue, off } from 'firebase/database'
import { onAuthStateChanged } from 'firebase/auth'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import Navbar from '@/components/common/utils/Navbar.vue'
import TabView from 'primevue/tabview'
import TabPanel from 'primevue/tabpanel'
import { useInstitutionsStore } from '@/stores/institutionsStore'
import { usePlacesStore } from '@/stores/placesStore'
import { db, auth } from '../../../firebase.js'
import schoolLogo from '../../..//public/assets/images/markerheds.png'

const originalWidth = 25
const originalHeight = 30
const markerScale = 1

const schoolLogoIcon = L.icon({
  iconUrl: schoolLogo,
  iconSize: [originalWidth * markerScale, originalHeight * markerScale],
  iconAnchor: [(originalWidth * markerScale) / 2, originalHeight * markerScale],
  popupAnchor: [0, -(originalHeight * markerScale)],
})

const route = useRoute()
const router = useRouter()
const institutionsStore = useInstitutionsStore()
const placesStore = usePlacesStore()

const institutionDetails = ref(null)
const institutionFiles = ref([])
const loadingFiles = ref(false)
const activeIndex = ref(route.query.tab === 'encadrement' ? 1 : 0)
const userRole = ref(null)
const mapInstance = ref(null)
const mapMarker = ref(null)

let placesRefInstance = null
let placesCallback = null
let roleRefInstance = null
let roleCallback = null
let unsubscribeAuth = null

const institutionId = computed(() => route.params.id)

const primaryImage = computed(() => {
  const images = institutionDetails.value?.ImageURL
  if (Array.isArray(images) && images.length > 0) return images[0]
  if (typeof images === 'string' && images.trim().length > 0) return images
  return 'https://eduport.webestica.com/assets/images/courses/4by3/21.jpg'
})

onMounted(() => {
  loadInstitution()
  listenUserRole()
})

onBeforeUnmount(() => {
  detachPlacesListener()
  detachRoleListener()
  if (typeof unsubscribeAuth === 'function') unsubscribeAuth()
  destroyMap()
})

watch(institutionId, (newId, oldId) => {
  console.log('👀 Watch: institutionId changé de', oldId, 'vers', newId)
  if (newId) {
    loadInstitution()
  }
})

// S'assurer que les fichiers sont rechargés quand institutionDetails change
watch(institutionDetails, (newDetails) => {
  if (newDetails) {
    console.log('👀 Watch: institutionDetails disponible:', newDetails.Name)
  }
}, { deep: true })

// Watch pour voir quand institutionFiles change
watch(institutionFiles, (newVal, oldVal) => {
  console.log(`📊 Watch: institutionFiles changé: ${oldVal?.length || 0} → ${newVal.length}`)
  if (newVal.length > 0) {
    console.log('📄 Fichiers actuels:', newVal.map(f => f.name))
  }
}, { deep: true })

function detachPlacesListener() {
  if (placesRefInstance && placesCallback) {
    off(placesRefInstance, 'value', placesCallback)
    placesRefInstance = null
    placesCallback = null
  }
}

function detachRoleListener() {
  if (roleRefInstance && roleCallback) {
    off(roleRefInstance, 'value', roleCallback)
    roleRefInstance = null
    roleCallback = null
  }
}

async function loadInstitution() {
  if (!institutionId.value) return
  
  console.log('🔄 Chargement institution:', institutionId.value)
  
  try {
    const inst = await institutionsStore.fetchInstitutionById(institutionId.value)
    if (!inst) {
      console.error('❌ Institution non trouvée')
      router.push({ name: 'Error404' })
      return
    }
    
    console.log('✅ Institution chargée:', inst.Name)
    institutionDetails.value = inst
    
    const instId = inst.InstitutionId ?? inst.id ?? institutionId.value
    console.log('📂 RECHARGEMENT FORCÉ des fichiers pour institution ID:', instId)
    
    // TOUJOURS recharger depuis Supabase (pas de cache)
    await fetchInstitutionFiles(instId)
    
    setupMap(inst)
  } catch (error) {
    console.error("❌ Erreur lors du chargement de l'institution:", error)
    router.push({ name: 'Error404' })
  }
}

async function fetchInstitutionFiles(id) {
  if (!id) {
    console.warn('⚠️ Pas d\'ID institution fourni pour charger les fichiers')
    return
  }
  
  detachPlacesListener()
  
  loadingFiles.value = true
  institutionFiles.value = []

  try {
    console.log(`🔍 Début chargement fichiers pour institution ID: ${id}`)
    
    // S'assurer que institutionDetails est disponible
    if (!institutionDetails.value) {
      console.error('❌ institutionDetails.value est null, impossible de charger les fichiers')
      return
    }

    // Charger les places depuis Supabase pour cette institution
    const places = await placesStore.fetchPlacesByInstitution(id)

    if (!places || places.length === 0) {
      console.warn(`⚠️ Aucune place trouvée pour l'institution ${id}`)
      institutionFiles.value = []
      return
    }

    const inst = institutionDetails.value
    const globalConceptUrl = inst?.CyberleanURL || inst?.CyberlearnURL

    console.log(`📋 ${places.length} places trouvées pour l'institution ${id}`)
    console.log('🔗 URL globale institution:', globalConceptUrl || 'Aucune')
    console.log('📊 Détails institution:', {
      Name: inst?.Name,
      InstitutionId: inst?.InstitutionId,
      CyberleanURL: inst?.CyberleanURL,
      CyberlearnURL: inst?.CyberlearnURL
    })

    // Map pour dédupliquer les URLs
    const urlMap = new Map()

    // Parcourir chaque place
    for (const place of places) {
      const placeName = place.NomPlace || 'Document sans nom'
      
      console.log(`🔎 Traitement place: ${placeName}`, {
        fileurl: place.fileurl || place.fileURL || 'N/A',
        CyberleanURL: place.CyberleanURL || 'N/A',
        CyberlearnURL: place.CyberlearnURL || 'N/A'
      })
      
      // Priorité 1 : Lien spécifique de la place (fileurl, CyberleanURL, CyberlearnURL)
      let fileUrl = place.fileurl || place.fileURL || place.CyberleanURL || place.CyberlearnURL
      let isGlobal = false
      
      // Priorité 2 : Lien global de l'institution si pas de lien spécifique
      if (!fileUrl && globalConceptUrl) {
        fileUrl = globalConceptUrl
        isGlobal = true
      }

      // Si on a une URL et qu'elle n'est pas déjà dans la map
      if (fileUrl && !urlMap.has(fileUrl)) {
        // Nettoyer l'URL (enlever espaces, etc.)
        const cleanUrl = fileUrl.trim()
        
        // Vérifier si l'URL semble valide
        const isValidUrl = cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')
        
        urlMap.set(cleanUrl, {
          name: placeName,
          url: cleanUrl,
          isGlobal: isGlobal,
          warning: !isValidUrl ? 'URL invalide' : null,
        })
        
        console.log(`📎 Ajouté: ${placeName} - ${isGlobal ? '[Global]' : '[Spécifique]'} - ${cleanUrl}`)
      } else if (!fileUrl) {
        console.log(`⚠️ Place "${placeName}" sans lien PDF`)
      }
    }

    // Convertir la map en array et trier (documents spécifiques en premier)
    const files = Array.from(urlMap.values()).sort((a, b) => {
      if (a.isGlobal === b.isGlobal) return 0
      return a.isGlobal ? 1 : -1 // Documents spécifiques avant globaux
    })

    // Mettre à jour les refs (spread pour forcer la réactivité)
    institutionFiles.value = [...files]

    console.log(`✅ ${institutionFiles.value.length} fichiers uniques trouvés`)
    console.log(`   - ${institutionFiles.value.filter(f => !f.isGlobal).length} spécifiques`)
    console.log(`   - ${institutionFiles.value.filter(f => f.isGlobal).length} globaux`)
    
    // Log final de l'état
    console.log('📦 État final institutionFiles:', institutionFiles.value)
  } catch (error) {
    console.error('❌ Erreur chargement fichiers places depuis Supabase:', error)
    console.error('   Stack:', error.stack)
    institutionFiles.value = []
  } finally {
    loadingFiles.value = false
    console.log('🏁 Fin chargement fichiers, loadingFiles:', loadingFiles.value)
  }
}

/**
 * Gère le clic sur un fichier PDF
 */
function handleFileClick(file) {
  console.log(`🖱️ Clic sur fichier: ${file.name}`)
  console.log(`   URL: ${file.url}`)
  console.log(`   Type: ${file.isGlobal ? 'Document global' : 'Document spécifique'}`)
  
  // Le lien s'ouvrira normalement via le href, on log juste pour le debug
}

function setupMap(inst) {
  const lat = Number(inst?.Latitude)
  const lng = Number(inst?.Longitude)
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    destroyMap()
    return
  }

  destroyMap()

  mapInstance.value = L.map('map', {
    center: [lat, lng],
    zoom: 13,
    scrollWheelZoom: false,
  })

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors',
  }).addTo(mapInstance.value)

  mapMarker.value = L.marker([lat, lng], {
    icon: schoolLogoIcon,
    title: "Localisation de l'institution",
    riseOnHover: true,
  }).addTo(mapInstance.value)
}

function destroyMap() {
  if (mapInstance.value) {
    mapInstance.value.remove()
    mapInstance.value = null
  }
  mapMarker.value = null
}

function listenUserRole() {
  unsubscribeAuth = onAuthStateChanged(auth, (user) => {
    detachRoleListener()
    if (!user) {
      userRole.value = null
      return
    }
    const refRole = firebaseDbRef(db, `Users/${user.uid}/Roles`)
    roleRefInstance = refRole
    roleCallback = (snapshot) => {
      const roles = snapshot.val()
      userRole.value = roles?.BA22 ? 'BA22' : null
    }
    onValue(refRole, roleCallback)
  })
}
</script>

<style scoped>
.scrollable-with-padding {
  height: 100vh;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 2rem;
  padding-bottom: 7rem;
  scrollbar-width: none;
}
.scrollable-with-padding::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.institution-info {
  flex: 1;
  margin-left: 2rem;
}
.institution-image {
  width: 100%;
  max-width: 1200px;
  height: auto;
  max-height: 400px;
  object-fit: cover;
  margin: auto;
  border-radius: 0.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.shadow {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

#map {
  height: 400px;
  width: 100%;
}

.institution-container {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  margin-left: 2rem;
  margin-right: 2rem;
}

/* Version mobile */
@media (max-width: 768px) {
  .institution-container {
    flex-direction: column;
    align-items: center;
    margin: 0;
  }

  .institution-image-wrapper {
    order: 1;
    width: 100%;
    padding: 0 1rem;
  }

  .institution-info {
    order: 2;
    width: 100%;
    margin: 1rem;
  }

  .content-lower {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .content-lower>div {
    width: 90% !important;
    margin-bottom: 2rem;
  }

  .map-container {
    height: 300px !important;
  }
}
</style>