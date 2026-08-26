<!-- src/components/FilterMap.vue -->
<template>
  <SocialThreeColumnLayout>
    <div v-if="isMobile">
      <HeaderIcons />
    </div>
    <!-- Sidebar Gauche -->
    <template #left>
      <LeftSidebar />
    </template>

    <!-- Contenu Principal -->
    <div class="main-content">
      <div class="px-4 py-8 md:px-6 lg:px-8">
        <!-- Titre et Description -->
        <div class="text-900 font-bold text-6xl text-center mb-4">
          Carte Interactive
        </div>
        <p class="text-600 font-normal text-lg text-center mb-6">
          Liste des différentes places de formation pratique de la filière physiothérapie de la HES-SO Valais-Wallis
        </p>

        <div class="mobile-filters">
          <FilterSidebar
            id-prefix="institution-map-mobile-filters"
            v-model:filters="selectedFilters"
            v-model:search-term="searchTerm"
            :cantons="availableCantons"
            :result-count="filteredInstitutions.length"
            @clear="clearFilters"
          />
        </div>

        <p v-if="filteredInstitutions.length !== mappableInstitutions.length" class="map-summary" role="status">
          {{ mappableInstitutions.length }} institution{{ mappableInstitutions.length === 1 ? '' : 's' }} affichée{{ mappableInstitutions.length === 1 ? '' : 's' }} sur la carte ;
          {{ filteredInstitutions.length - mappableInstitutions.length }} sans coordonnées valides.
        </p>

        <!-- Container de la Carte -->
        <div class="map-container">
          <div v-if="institutionsLoading" class="flex justify-center items-center h-full">Chargement de la carte...</div>
          <div v-else-if="institutionsError" class="text-red-500 p-4">Erreur: {{ institutionsError }}</div>
          <div v-else id="newMap" class="map"></div>
        </div>

        <!-- Dialog pour les détails de l'institution -->
        <Dialog
          v-model:visible="dialogVisible"
          appendTo="body"
          :modal="true"
          :breakpoints="{'960px': '75vw', '640px': '100vw'}"
          :style="{ width: '40vw' }"
        >
          <template #header>
            <div class="flex align-items-center">
              <span
                class="flex align-items-center justify-content-center bg-primary-100 text-primary-800 mr-3 border-circle"
                style="width:32px; height:32px;"
              >
                <i class="pi pi-map-marker text-lg"></i>
              </span>
              <span class="font-medium text-2xl text-900">
                {{ selectedInstitution ? selectedInstitution.Name : '' }}
              </span>
            </div>
          </template>

          <template #default>
            <div class="grid">
              <div class="col-12 md:col-4">
                <img
                  :src="selectedInstitutionImage"
                  :alt="selectedInstitution ? `Illustration de ${selectedInstitution.Name}` : ''"
                  class="w-full institution-image shadow"
                />
              </div>
              <div class="col-12 md:col-8">
                <div class="line-height-3 p-0 m-0 mt-3">
                  <div class="mb-3 text-900 text-xl">
                    <i class="pi pi-map-marker text-primary mb-3"></i>
                    {{ selectedInstitution.Address }}
                  </div>
                  <div class="text-900 text-xl">
                    <i class="pi pi-flag text-primary"></i>
                    {{ selectedInstitution.Canton }}
                  </div>
                </div>
              </div>
            </div>
          </template>

          <template #footer>
            <div class="border-top-1 surface-border pt-3">
              <Button
                icon="pi pi-times"
                @click="dialogVisible = false"
                label="Retour"
                class="p-button-text mr-3"
              ></Button>
              <Button
                icon="pi pi-info-circle"
                @click="navigateToDetails(selectedInstitution.InstitutionId)"
                label="Détails"
                class="p-button-text mr-3"
              ></Button>

              <Button
                icon="pi pi-globe"
                @click="openWebsite(selectedInstitution.URL)"
                label="Site web"
              ></Button>
            </div>
          </template>
        </Dialog>
      </div>
    </div>

    <!-- Sidebar Droite : intégration du composant de filtre composite -->
    <template #right>
      <FilterSidebar
        id-prefix="institution-map-desktop-filters"
        v-model:filters="selectedFilters"
        v-model:search-term="searchTerm"
        :cantons="availableCantons"
        :result-count="filteredInstitutions.length"
        @clear="clearFilters"
      />
    </template>
  </SocialThreeColumnLayout>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import LeftSidebar from '@/components/social/library/LeftSidebar.vue'
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import FilterSidebar from './FilterSidebar.vue';
import HeaderIcons from '@/components/common/utils/HeaderIcons.vue'
import { usePlacesStore } from '@/stores/placesStore';
import SocialThreeColumnLayout from '@/components/common/layouts/SocialThreeColumnLayout.vue'

// Import et configuration du logo pour les marqueurs

import { useInstitutionsStore } from '@/stores/institutionsStore';
import { filterInstitutions, getAvailableCantons, hasValidInstitutionCoordinates } from '@/service/institutionFiltersService'
import schoolLogo from '../../../../public/assets/images/markerheds.png';
const originalWidth = 25;
const originalHeight = 30;
const markerScale = 1;
const schoolLogoIcon = L.icon({
  iconUrl: schoolLogo,
  iconSize: [originalWidth * markerScale, originalHeight * markerScale],
  iconAnchor: [(originalWidth * markerScale) / 2, originalHeight * markerScale],
  popupAnchor: [0, -(originalHeight * markerScale)]
});

// Variables réactives
const map = ref(null);
const markers = ref([]);
const institutionsStore = useInstitutionsStore();
const placesStore = usePlacesStore();
const { institutions, loading: institutionsLoading, error: institutionsError } = storeToRefs(institutionsStore);
const selectedInstitution = ref(null);
const dialogVisible = ref(false);
const router = useRouter();
const viewportWidth = ref(window.innerWidth)
const isMobile = computed(() => viewportWidth.value <= 768);
const searchTerm = ref('')

// Objet réactif regroupant l'ensemble des filtres sélectionnés
const selectedFilters = ref({
  cantons: [],
  criter: [],
  languages: [],
  pfp: [] // Nouveau filtre pour les critères PFP
});

// Liste des cantons disponibles (extrait dynamiquement depuis les institutions)
const availableCantons = computed(() => {
  return getAvailableCantons(institutions.value)
});

const filteredInstitutions = computed(() => {
  return filterInstitutions({
    institutions: institutions.value,
    places: placesStore.places || [],
    filters: selectedFilters.value,
    searchTerm: searchTerm.value,
  })
});

const mappableInstitutions = computed(() => filteredInstitutions.value.filter(hasValidInstitutionCoordinates))
const selectedInstitutionImage = computed(() => {
  const image = selectedInstitution.value?.ImageURL
  if (Array.isArray(image) && image.length) return image[0]
  if (typeof image === 'string' && image) return image
  return 'https://eduport.webestica.com/assets/images/courses/4by3/21.jpg'
})

// Initialisation de la carte Leaflet
const initMap = () => {
  if (map.value || !document.getElementById('newMap')) return;
  map.value = L.map('newMap').setView([46.22292, 7.3668], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value);
};

// Récupération des institutions depuis le store
onMounted(async () => {
  window.addEventListener('resize', updateViewportWidth)
  try {
    await Promise.all([institutionsStore.fetchInstitutions(), placesStore.fetchPlaces()])
    await nextTick()
    initMap()
    addLocationsToMap(mappableInstitutions.value)
  } catch (error) {
    console.error('Erreur lors du chargement de la carte des institutions:', error)
  }
});

const updateViewportWidth = () => {
  viewportWidth.value = window.innerWidth
}

// Nettoyage des marqueurs existants sur la carte
const clearMarkers = () => {
  markers.value.forEach((marker) => marker.remove());
  markers.value = [];
};

// Ajout des marqueurs sur la carte en fonction des institutions filtrées
const addLocationsToMap = (institutions) => {
  if (!map.value) return; // Ne rien faire si la carte n'est pas initialisée
  clearMarkers();
  institutions.forEach((institution) => {
    const lat = parseFloat(institution.Latitude);
    const lng = parseFloat(institution.Longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      const marker = L.marker([lat, lng], { icon: schoolLogoIcon })
        .addTo(map.value)
        .on('click', () => {
          selectedInstitution.value = institution;
          dialogVisible.value = true;
        });
      markers.value.push(marker);
    } else {
      console.warn(`Coordonnées invalides pour l'institution ${institution.id}:`, institution);
    }
  });
  if (markers.value.length > 0) {
    const group = new L.featureGroup(markers.value);
    map.value.fitBounds(group.getBounds().pad(0.2));
  }
};

// Mise à jour automatique des marqueurs lorsque les institutions filtrées changent
watch(mappableInstitutions, (newInstitutions) => {
  addLocationsToMap(newInstitutions);
});

const clearFilters = () => {
  searchTerm.value = ''
  selectedFilters.value = { cantons: [], criter: [], languages: [], pfp: [] }
}

// Navigation vers la vue détaillée de l'institution
const navigateToDetails = (id) => {
  router.push({ name: 'InstitutionView', params: { id } });
};

// Ouverture du site web de l'institution dans un nouvel onglet
const openWebsite = (url) => {
  if (url) {
    const completeUrl =
      url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `https://${url}`;
    window.open(completeUrl, '_blank');
  }
};

// Nettoyage lors de la destruction du composant
onUnmounted(() => {
  window.removeEventListener('resize', updateViewportWidth)
  clearMarkers();
  if (map.value) {
    map.value.remove();
  }
});
</script>

<style scoped>
/* Contenu principal */
.main-content {
  overflow-y: auto;
}

.mobile-filters { display: none; margin-bottom: 1.5rem; }
.map-summary { margin: 0 0 1rem; color: var(--text-color-secondary); text-align: center; }

/* Styles pour la carte */
.map-container {
  width: 100%;
  height: 600px; /* Ajustez la hauteur selon vos besoins */
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.map {
  width: 100%;
  height: 100%;
}

.institution-image {
  width: 100%;
  height: auto;
  object-fit: cover;
  border-radius: 0.5rem;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

.shadow {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

@media (max-width: 768px) {
  .map-container {
    height: 300px;
  }
}

@media (max-width: 63.99rem) {
  .mobile-filters { display: block; }
}
</style>
