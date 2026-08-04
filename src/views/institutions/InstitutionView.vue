<template>
  <Navbar />
  <div class="institution-shell">
    <aside class="institution-shell__side institution-shell__side--left" aria-label="Espace personnel">
      <LeftSidebar :hide-gamification="true" />
    </aside>

    <div class="iv">
    <!-- ====== HERO ====== -->
    <section class="iv-hero">
      <img :src="primaryImage" alt="" class="iv-hero__bg" />
      <div class="iv-hero__fade"></div>

      <!-- floating glass card in hero -->
      <div class="iv-hero__glass">
        <h1 class="iv-hero__name">
          {{ institutionDetails ? institutionDetails.Name : 'Chargement…' }}
        </h1>
        <p v-if="institutionDetails" class="iv-hero__addr">
          <i class="pi pi-map-marker"></i>
          {{ institutionDetails.Address }}, {{ institutionDetails.Locality }}
        </p>
        <div class="iv-pills">
          <span v-if="institutionDetails?.Language" class="iv-pill">
            <i class="pi pi-comments"></i> {{ institutionDetails.Language }}
          </span>
          <span v-if="institutionDetails?.Canton" class="iv-pill">
            <i class="pi pi-compass"></i> {{ institutionDetails.Canton }}
          </span>
          <a v-if="institutionDetails?.URL" :href="formatUrl(institutionDetails.URL)" target="_blank" rel="noopener noreferrer" class="iv-pill iv-pill--link">
            <i class="pi pi-external-link"></i> Site web
          </a>
        </div>
      </div>
    </section>

    <!-- ====== CONTENT ====== -->
    <div class="iv-content">
      <!-- custom tab bar -->
      <nav class="iv-nav" aria-label="Sections de l'institution">
        <button
          type="button"
          :aria-pressed="activeIndex === 0"
          :class="['iv-nav__btn', { 'iv-nav__btn--active': activeIndex === 0 }]"
          @click="activeIndex = 0"
        >
          <i class="pi pi-info-circle"></i> Informations
        </button>
        <button
          type="button"
          :aria-pressed="activeIndex === 1"
          :class="['iv-nav__btn', { 'iv-nav__btn--active': activeIndex === 1 }]"
          @click="activeIndex = 1"
        >
          <i class="pi pi-users"></i> Encadrement
        </button>
      </nav>

      <div class="iv-layout">
        <!-- LEFT -->
        <main class="iv-main">
          <!-- TAB 0 : Infos -->
          <div v-show="activeIndex === 0" class="iv-fade">
            <div v-if="institutionDetails?.Description" class="iv-card">
              <div class="iv-card__head">
                <span class="iv-card__dot iv-card__dot--blue"></span>
                <h3 class="iv-card__title">Description</h3>
              </div>
              <p class="iv-card__body">{{ institutionDetails.Description }}</p>
            </div>

            <div class="iv-card">
              <div class="iv-card__head">
                <span class="iv-card__dot iv-card__dot--green"></span>
                <h3 class="iv-card__title">Détails</h3>
              </div>
              <div class="iv-details">
                <div class="iv-detail">
                  <div class="iv-detail__ico iv-detail__ico--1"><i class="pi pi-globe"></i></div>
                  <div class="iv-detail__txt">
                    <small>Langue</small>
                    <strong>{{ institutionDetails?.Language || '—' }}</strong>
                  </div>
                </div>
                <div class="iv-detail">
                  <div class="iv-detail__ico iv-detail__ico--2"><i class="pi pi-map-marker"></i></div>
                  <div class="iv-detail__txt">
                    <small>Canton</small>
                    <strong>{{ institutionDetails?.Canton || '—' }}</strong>
                  </div>
                </div>
                <div class="iv-detail">
                  <div class="iv-detail__ico iv-detail__ico--3"><i class="pi pi-home"></i></div>
                  <div class="iv-detail__txt">
                    <small>Adresse</small>
                    <strong>{{ institutionDetails?.Address || '—' }}</strong>
                  </div>
                </div>
                <div class="iv-detail">
                  <div class="iv-detail__ico iv-detail__ico--4"><i class="pi pi-map"></i></div>
                  <div class="iv-detail__txt">
                    <small>Localité</small>
                    <strong>{{ institutionDetails?.Locality || '—' }}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 1 : Encadrement -->
          <div v-show="activeIndex === 1" class="iv-fade">
            <div class="iv-card">
              <div class="iv-card__head">
                <span class="iv-card__dot iv-card__dot--purple"></span>
                <h3 class="iv-card__title">Responsable physio</h3>
              </div>
              <div v-if="institutionDetails" class="iv-contact">
                <div class="iv-contact__row">
                  <div class="iv-contact__ico"><i class="pi pi-user"></i></div>
                  <div>
                    <small>Nom, Prénom</small>
                    <span>{{ institutionDetails.NomChef || '—' }}</span>
                  </div>
                </div>
                <div class="iv-contact__row">
                  <div class="iv-contact__ico"><i class="pi pi-envelope"></i></div>
                  <div>
                    <small>Email</small>
                    <a v-if="institutionDetails.MailChef" :href="`mailto:${institutionDetails.MailChef}`">{{ institutionDetails.MailChef }}</a>
                    <span v-else>—</span>
                  </div>
                </div>
                <div class="iv-contact__row">
                  <div class="iv-contact__ico"><i class="pi pi-phone"></i></div>
                  <div>
                    <small>Téléphone</small>
                    <a v-if="institutionDetails.PhoneChef" :href="`tel:${institutionDetails.PhoneChef}`">{{ institutionDetails.PhoneChef }}</a>
                    <span v-else>—</span>
                  </div>
                </div>
              </div>
              <p v-else class="iv-card__empty">Aucun praticien formateur disponible.</p>
            </div>

            <!-- FILES -->
            <div v-if="institutionFiles.length > 0" class="iv-card">
              <div class="iv-card__head">
                <span class="iv-card__dot iv-card__dot--red"></span>
                <h3 class="iv-card__title">
                  {{ institutionFiles.length === 1 ? 'Document' : 'Documents' }}
                </h3>
                <span class="iv-card__count">{{ institutionFiles.length }}</span>
              </div>
              <div class="iv-files">
                <a
                  v-for="file in institutionFiles"
                  :key="file.url"
                  :href="file.url"
                  target="_blank"
                  class="iv-file"
                  @click="handleFileClick(file)"
                >
                  <div class="iv-file__icon"><i class="pi pi-file-pdf"></i></div>
                  <div class="iv-file__info">
                    <span class="iv-file__name">{{ file.name }}</span>
                    <span v-if="file.isGlobal" class="iv-file__tag">Global</span>
                    <span v-if="file.warning" class="iv-file__warn">{{ file.warning }}</span>
                  </div>
                  <i class="pi pi-arrow-up-right iv-file__go"></i>
                </a>
              </div>
            </div>
            <div v-else-if="loadingFiles" class="iv-card">
              <div class="iv-card__loading">
                <i class="pi pi-spin pi-spinner"></i> Chargement des documents…
              </div>
            </div>
            <div v-else class="iv-card">
              <p class="iv-card__empty">Aucun PDF disponible pour cette institution.</p>
            </div>
          </div>
        </main>

        <!-- RIGHT: MAP -->
        <aside class="iv-aside">
          <div class="iv-map">
            <div class="iv-map__label">
              <i class="pi pi-map-marker"></i> Localisation
            </div>
            <div id="map" class="iv-map__canvas"></div>
          </div>
        </aside>
      </div>
    </div>
    </div>

    <aside class="institution-shell__side institution-shell__side--right" aria-label="Communautés et hashtags">
      <RightSidebar />
    </aside>
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
import LeftSidebar from '@/components/social/library/LeftSidebar.vue'
import RightSidebar from '@/components/social/library/RightSidebar.vue'
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

const formatUrl = (url) => {
  if (!url) return '#'
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return 'https://' + url
}

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
/* ============================================================
   INSTITUTION VIEW — v3 modern design (theme-aware)
   ============================================================ */

/* --- reset / page --- */
.institution-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 3fr) minmax(0, 1fr);
  align-items: start;
  gap: clamp(1rem, 1.5vw, 1.75rem);
  width: 100%;
  max-width: 120rem;
  min-height: calc(100dvh - var(--navbar-h, 64px));
  margin-inline: auto;
  padding-inline: clamp(1rem, 2vw, 2rem);
  box-sizing: border-box;
}

.institution-shell__side {
  min-width: 0;
  overflow-y: auto;
}

.iv {
  --accent: var(--primary-color, #6366f1);
  --accent-soft: var(--primary-color, rgba(99,102,241,.12));
  --radius: 1rem;
  height: calc(100dvh - var(--navbar-h, 64px));
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;

}
.iv::-webkit-scrollbar { width: 6px; }
.iv::-webkit-scrollbar-thumb { background: var(--surface-border); border-radius: 3px; }

/* ====== HERO ====== */
.iv-hero {
  position: relative;
  max-width: 1200px;
  margin: 1.5rem auto 0;
  padding: 0 2rem;
}
.iv-hero__bg {
  width: 100%; height: 380px;
  object-fit: cover;
  border-radius: var(--radius);
  filter: brightness(.85) saturate(1.1);
  display: block;
}
.iv-hero__fade {
  position: absolute; inset: 0;
  top: 0; left: 2rem; right: 2rem; bottom: 0;
  border-radius: var(--radius);
  background:
    linear-gradient(180deg, transparent 30%, rgba(15,23,42,.82) 100%),
    linear-gradient(135deg, rgba(99,102,241,.25) 0%, transparent 60%);
  pointer-events: none;
}

/* glass card floating in hero */
.iv-hero__glass {
  position: absolute;
  bottom: 1.25rem; left: 3.25rem; right: 3.25rem;
  padding: 1.75rem 2rem;
  background: rgba(255,255,255,.12);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border: 1px solid rgba(255,255,255,.22);
  border-radius: var(--radius);
  color: #fff;
  animation: glassIn .6s cubic-bezier(.22,1,.36,1) both;
}
@keyframes glassIn {
  from { opacity: 0; transform: translateY(24px); }
  to   { opacity: 1; transform: translateY(0); }
}
.iv-hero__name {
  font-size: 2.2rem;
  font-weight: 800;
  letter-spacing: -.02em;
  line-height: 1.15;
  margin: 0 0 .3rem;
}
.iv-hero__addr {
  margin: 0 0 .85rem;
  font-size: .95rem;
  opacity: .88;
  display: flex; align-items: center; gap: .4rem;
}
.iv-hero__addr i { font-size: .85rem; }

/* pills */
.iv-pills { display: flex; flex-wrap: wrap; gap: .45rem; }
.iv-pill {
  display: inline-flex; align-items: center; gap: .35rem;
  padding: .28rem .7rem;
  font-size: .78rem; font-weight: 600;
  border-radius: 999px;
  background: rgba(255,255,255,.18);
  border: 1px solid rgba(255,255,255,.2);
  color: #fff;
  transition: background .2s;
}
.iv-pill:hover { background: rgba(255,255,255,.28); }
.iv-pill--link {
  text-decoration: none; cursor: pointer;
  background: rgba(99,102,241,.45);
  border-color: rgba(99,102,241,.5);
}
.iv-pill--link:hover { background: rgba(99,102,241,.6); }

/* ====== CONTENT WRAPPER ====== */
.iv-content {
  max-width: 1200px;
  margin: 1.5rem auto 0;
  padding: 0 2rem 5rem;
  position: relative;
  z-index: 1;
}

/* ====== CUSTOM NAV ====== */
.iv-nav {
  display: inline-flex;
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 999px;
  padding: .3rem;
  box-shadow: 0 2px 12px rgba(0,0,0,.08);
  margin-bottom: 1.5rem;
}
.iv-nav__btn {
  display: inline-flex; align-items: center; gap: .4rem;
  min-height: 2.75rem;
  padding: .55rem 1.25rem;
  border: none; outline: none;
  border-radius: 999px;
  font-size: .85rem; font-weight: 600;
  color: var(--text-color-secondary);
  background: transparent;
  cursor: pointer;
  transition: background-color .2s ease, color .2s ease, box-shadow .2s ease;
}
.iv-nav__btn:hover { color: var(--text-color); }
.iv-nav__btn:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
.iv-nav__btn--active {
  background: var(--accent);
  color: #fff;
  box-shadow: 0 2px 8px rgba(99,102,241,.35);
}

/* ====== LAYOUT ====== */
.iv-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 1.75rem;
  align-items: start;
}
.iv-main { min-width: 0; }

/* ====== CARDS ====== */
.iv-card {
  background: var(--surface-card);
  border-radius: var(--radius);
  padding: 1.5rem 1.75rem;
  margin-bottom: 1.25rem;
  box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
  border: 1px solid var(--surface-border);
  animation: cardUp .45s cubic-bezier(.22,1,.36,1) both;
}
@keyframes cardUp {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
.iv-card__head {
  display: flex; align-items: center; gap: .6rem;
  margin-bottom: 1rem;
}
.iv-card__dot {
  width: .55rem; height: .55rem;
  border-radius: 50%;
  flex-shrink: 0;
}
.iv-card__dot--blue   { background: #3b82f6; }
.iv-card__dot--green  { background: #22c55e; }
.iv-card__dot--purple { background: #8b5cf6; }
.iv-card__dot--red    { background: #ef4444; }
.iv-card__title {
  font-size: 1.05rem; font-weight: 700;
  color: var(--text-color); margin: 0;
}
.iv-card__count {
  margin-left: auto;
  font-size: .72rem; font-weight: 700;
  background: var(--accent-soft); color: var(--accent);
  padding: .15rem .55rem; border-radius: 999px;
}
.iv-card__body {
  color: var(--text-color-secondary); line-height: 1.75; margin: 0;
  font-size: .93rem;
}
.iv-card__empty {
  color: var(--text-color-secondary); font-size: .9rem; margin: 0;
}
.iv-card__loading {
  display: flex; align-items: center; gap: .5rem;
  color: var(--text-color-secondary); font-size: .9rem;
}

/* ====== DETAILS GRID ====== */
.iv-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: .65rem;
}
.iv-detail {
  display: flex; align-items: center; gap: .75rem;
  padding: .8rem .95rem;
  border-radius: .75rem;
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  transition: background-color .2s ease, border-color .2s ease, box-shadow .2s ease;
}
.iv-detail:hover {
  background: var(--surface-hover, var(--surface-card));
  box-shadow: 0 2px 8px rgba(0,0,0,.08);
  border-color: var(--surface-border);
}
.iv-detail__ico {
  width: 2.4rem; height: 2.4rem;
  border-radius: .6rem;
  display: flex; align-items: center; justify-content: center;
  font-size: .95rem; color: #fff;
  flex-shrink: 0;
}
.iv-detail__ico--1 { background: linear-gradient(135deg, #6366f1, #818cf8); }
.iv-detail__ico--2 { background: linear-gradient(135deg, #f43f5e, #fb7185); }
.iv-detail__ico--3 { background: linear-gradient(135deg, #f59e0b, #fbbf24); }
.iv-detail__ico--4 { background: linear-gradient(135deg, #22c55e, #4ade80); }
.iv-detail__txt small {
  display: block;
  font-size: .68rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: .04em;
  color: var(--text-color-secondary); margin-bottom: .05rem;
}
.iv-detail__txt strong {
  display: block;
  font-size: .9rem; font-weight: 600;
  color: var(--text-color);
}

/* ====== CONTACT ====== */
.iv-contact__row {
  display: flex; align-items: center; gap: .8rem;
  padding: .85rem 0;
  border-bottom: 1px solid var(--surface-border);
}
.iv-contact__row:last-child { border-bottom: none; }
.iv-contact__ico {
  width: 2.2rem; height: 2.2rem;
  border-radius: 50%;
  background: var(--accent-soft);
  color: var(--accent);
  display: flex; align-items: center; justify-content: center;
  font-size: .9rem; flex-shrink: 0;
}
.iv-contact__row small {
  display: block;
  font-size: .68rem; font-weight: 600;
  text-transform: uppercase; letter-spacing: .04em;
  color: var(--text-color-secondary);
}
.iv-contact__row span {
  font-size: .9rem; font-weight: 500; color: var(--text-color);
}
.iv-contact__row a {
  font-size: .9rem; font-weight: 500;
  color: var(--accent); text-decoration: none;
}
.iv-contact__row a:hover { text-decoration: underline; }

/* ====== FILES ====== */
.iv-files { display: flex; flex-direction: column; gap: .45rem; }
.iv-file {
  display: flex; align-items: center; gap: .7rem;
  padding: .7rem .9rem;
  border-radius: .65rem;
  background: var(--surface-ground);
  border: 1px solid var(--surface-border);
  text-decoration: none; color: var(--text-color);
  transition: background-color .2s ease, border-color .2s ease, box-shadow .2s ease;
}
.iv-file:hover {
  background: var(--surface-hover, var(--surface-card));
  border-color: var(--accent);
  box-shadow: 0 2px 10px rgba(99,102,241,.12);
}
.iv-file__icon {
  width: 2rem; height: 2rem;
  border-radius: .45rem;
  background: rgba(239,68,68,.08);
  color: #ef4444;
  display: flex; align-items: center; justify-content: center;
  font-size: .95rem; flex-shrink: 0;
}
.iv-file__info { flex: 1; min-width: 0; }
.iv-file__name {
  display: block;
  font-size: .88rem; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.iv-file__tag {
  display: inline-block;
  font-size: .65rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .03em;
  padding: .1rem .45rem; border-radius: 999px;
  background: rgba(59,130,246,.08); color: #3b82f6;
  margin-top: .15rem;
}
.iv-file__warn {
  display: inline-block;
  font-size: .72rem; color: #f97316; font-weight: 500;
  margin-top: .1rem;
}
.iv-file__go {
  font-size: .75rem; color: var(--text-color-secondary);
  transition: color .2s; flex-shrink: 0;
}
.iv-file:hover .iv-file__go { color: var(--accent); }

/* ====== MAP SIDEBAR ====== */
.iv-aside { min-width: 0; }
.iv-map {
  background: var(--surface-card);
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0,0,0,.06), 0 4px 16px rgba(0,0,0,.04);
  border: 1px solid var(--surface-border);
  position: sticky; top: 1rem;
  animation: cardUp .5s cubic-bezier(.22,1,.36,1) both;
  animation-delay: .1s;
}
.iv-map__label {
  display: flex; align-items: center; gap: .45rem;
  padding: .8rem 1.1rem;
  font-size: .88rem; font-weight: 700; color: var(--text-color);
  border-bottom: 1px solid var(--surface-border);
}
.iv-map__label i { color: var(--accent); font-size: .9rem; }
.iv-map__canvas { height: 400px; width: 100%; }

/* ====== FADE HELPER ====== */
.iv-fade {
  animation: fadeTab .35s ease both;
}
@keyframes fadeTab {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ====== RESPONSIVE ====== */
@media (max-width: 1280px) {
  .institution-shell {
    grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  }
  .institution-shell__side--right { display: none; }
}
@media (max-width: 991px) {
  .institution-shell { display: block; padding-inline: 0; }
  .institution-shell__side { display: none; }
}
@media (max-width: 1024px) {
  .iv-layout { grid-template-columns: 1fr; }
  .iv-map { position: static; }
  .iv-hero { padding: 0 1.25rem; }
  .iv-hero__bg { height: 300px; }
  .iv-hero__fade { left: 1.25rem; right: 1.25rem; }
  .iv-hero__glass { left: 2rem; right: 2rem; bottom: 1rem; }
  .iv-content { padding: 0 1.25rem 4rem; }
}
@media (max-width: 640px) {
  .iv-hero { padding: 0 .75rem; margin-top: 1rem; }
  .iv-hero__bg { height: 240px; }
  .iv-hero__fade { left: .75rem; right: .75rem; }
  .iv-hero__name { font-size: 1.5rem; }
  .iv-hero__glass { left: 1.25rem; right: 1.25rem; bottom: .75rem; padding: 1.25rem; }
  .iv-details { grid-template-columns: 1fr; }
  .iv-content { margin-top: 1rem; padding: 0 .75rem 3rem; }
  .iv-nav { width: 100%; }
  .iv-nav__btn { flex: 1; justify-content: center; font-size: .8rem; padding: .5rem .75rem; }
}
</style>
