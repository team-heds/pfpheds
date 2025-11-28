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
                    <ul>
                      <li v-for="file in institutionFiles" :key="file.url">
                        <a :href="file.url" target="_blank" class="text-primary">
                          📄 {{ file.name }}
                        </a>
                      </li>
                    </ul>
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

watch(institutionId, () => {
  loadInstitution()
})

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
  try {
    const inst = await institutionsStore.fetchInstitutionById(institutionId.value)
    if (!inst) {
      router.push({ name: 'Error404' })
      return
    }
    institutionDetails.value = inst
    fetchInstitutionFiles(inst.InstitutionId ?? inst.id ?? institutionId.value)
    setupMap(inst)
  } catch (error) {
    console.error("Erreur lors du chargement de l'institution:", error)
    router.push({ name: 'Error404' })
  }
}

async function fetchInstitutionFiles(id) {
  if (!id) return
  detachPlacesListener()

  try {
    // Charger les places depuis Supabase pour cette institution
    const places = await placesStore.fetchPlacesByInstitution(id)

    // Transformer en format pour l'affichage
    institutionFiles.value = places
      .filter(place => place.fileURL) // Seulement celles avec un fichier
      .map(place => ({
        name: place.NomPlace || 'Document',
        url: place.fileURL,
      }))

    console.log(`✅ ${institutionFiles.value.length} fichiers chargés depuis Supabase pour l'institution ${id}`)
  } catch (error) {
    console.error('❌ Erreur chargement fichiers places depuis Supabase:', error)
    institutionFiles.value = []
  }
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