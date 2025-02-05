<!-- src/components/FilterMap.vue -->
<template>
  <div class="map-layout">
    <!-- Sidebar Gauche -->
    <div class="sidebar-left">
      <LeftSidebar />
    </div>

    <!-- Contenu Principal -->
    <div class="main-content">
      <div class="px-4 py-8 md:px-6 lg:px-8">
        <!-- Titre et Description -->
        <div class="text-900 font-bold text-3xl text-center mb-4">
          Carte Interactive
        </div>
        <p class="text-600 font-normal text-lg text-center mb-6">
          Liste des différentes places de formation pratique de la filière physiothérapie de la HES-SO Valais-Wallis
        </p>
        <Divider class="w-full mb-6" />

        <!-- Container de la Carte -->
        <div class="map-container">
          <div id="newMap" class="map"></div>
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
                  :src="selectedInstitution && selectedInstitution.ImageURL ? selectedInstitution.ImageURL : 'https://eduport.webestica.com/assets/images/courses/4by3/21.jpg'"
                  alt="Institution Image"
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
                @click="navigateToDetails(selectedInstitution.id)"
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

    <!-- Sidebar Droite -->
    <div class="sidebar-right">
      <RightSidebar />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../../../firebase'; // Vérifiez que le chemin est correct
import { ref as firebaseRef, onValue } from 'firebase/database';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Importez le logo de l'école (ajustez le chemin si nécessaire)
import schoolLogo from '../../..//public/assets/images/markerheds.png';

/*
  Définition des dimensions naturelles de l'image du logo.
  Vous devez ajuster originalWidth et originalHeight selon les dimensions réelles de votre image.
*/
const originalWidth = 25;  // largeur naturelle (en pixels)
const originalHeight = 30; // hauteur naturelle (en pixels)

/*
  markerScale permet de réduire ou agrandir l'image.
  - 1 : taille réelle
  - 0.5 : la moitié de la taille réelle
  - 2 : le double de la taille réelle
*/
const markerScale = 1;

// Création du marqueur personnalisé avec le logo de l'école
const schoolLogoIcon = L.icon({
  iconUrl: schoolLogo,
  iconSize: [originalWidth * markerScale, originalHeight * markerScale],
  iconAnchor: [(originalWidth * markerScale) / 2, originalHeight * markerScale],
  popupAnchor: [0, -(originalHeight * markerScale)]
});

// Import des composants utilisés
import Navbar from '@/components/Utils/Navbar.vue';
import LeftSidebar from '@/components/Bibliotheque/Social/LeftSidebar.vue';
import RightSidebar from '@/components/Bibliotheque/Social/RightSidebar.vue';
import Divider from 'primevue/divider';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';

// Variables réactives
const map = ref(null);
const markers = ref([]);
const allInstitutions = ref([]);
const selectedInstitution = ref(null);
const dialogVisible = ref(false);
const router = useRouter();

// Initialisation de la carte
const initMap = () => {
  map.value = L.map('newMap').setView([46.22292, 7.3668], 10);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value);
};

// Récupération des institutions depuis Firebase Realtime Database
const fetchInstitutionsFromFirebase = () => {
  const institutionsRef = firebaseRef(db, 'Institutions/');
  onValue(institutionsRef, (snapshot) => {
    const data = snapshot.val();
    allInstitutions.value = data
      ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
      : [];
    console.log('Institutions récupérées:', allInstitutions.value);
    addLocationsToMap(allInstitutions.value);
  });
};

// Nettoyage des marqueurs existants
const clearMarkers = () => {
  markers.value.forEach((marker) => marker.remove());
  markers.value = [];
};

// Ajout des marqueurs sur la carte avec le logo de l'école comme icône
const addLocationsToMap = (institutions) => {
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

const navigateToDetails = (id) => {
  router.push({ name: 'InstitutionView', params: { id } });
};

const openWebsite = (url) => {
  if (url) {
    const completeUrl =
      url.startsWith('http://') || url.startsWith('https://')
        ? url
        : `http://${url}`;
    window.open(completeUrl, '_blank');
  }
};

// Initialisation lors du montage du composant
onMounted(() => {
  initMap();
  fetchInstitutionsFromFirebase();
});

// Nettoyage lors de la destruction du composant
onUnmounted(() => {
  clearMarkers();
  if (map.value) {
    map.value.remove();
  }
});
</script>

<style scoped>
/* Layout global pour la carte avec sidebars */
.map-layout {
  display: grid;
  grid-template-columns: 1fr 3fr 1fr; /* Sidebar gauche, contenu central, sidebar droite */
  gap: 1.5rem;
  min-height: 100vh;
}

/* Sidebar Gauche */
.sidebar-left {
  overflow-y: auto;
}

/* Contenu principal */
.main-content {
  overflow-y: auto;
}

/* Sidebar Droite */
.sidebar-right {
  overflow-y: auto;
}

/* Responsive : Ajustements pour tablettes et mobiles */
@media (max-width: 1024px) {
  .map-layout {
    grid-template-columns: 1fr 2fr;
  }
  .sidebar-right {
    display: none;
  }
}

@media (max-width: 768px) {
  .map-layout {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
  .sidebar-left {
    display: none;
  }
}

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
</style>
