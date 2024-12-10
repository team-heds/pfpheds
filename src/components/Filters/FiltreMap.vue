<!-- src/components/Map.vue -->
<template>
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
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { db } from '../../../firebase'; // Assurez-vous que le chemin est correct
import { ref as firebaseRef, onValue } from 'firebase/database'; // Utilisation de Realtime Database
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Importer le CSS de Leaflet


// Correction des chemins des icônes Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow
});
L.Marker.prototype.options.icon = DefaultIcon;

// Variables réactives
const map = ref(null);
const markers = ref([]);
const allInstitutions = ref([]);
const selectedInstitution = ref(null);
const dialogVisible = ref(false);

const router = useRouter();

// Fonction d'initialisation de la carte
const initMap = () => {
  map.value = L.map('newMap').setView([46.22292, 7.3668], 10); // Centrage initial sur Valais-Wallis

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map.value);
};

// Fonction pour récupérer les institutions depuis Firebase Realtime Database
const fetchInstitutionsFromFirebase = () => {
  const institutionsRef = firebaseRef(db, 'Institutions/'); // Vérifiez la casse exacte ici

  onValue(institutionsRef, (snapshot) => {
    const data = snapshot.val();
    allInstitutions.value = data
      ? Object.keys(data).map((key) => ({ id: key, ...data[key] }))
      : [];
    console.log('Institutions récupérées:', allInstitutions.value); // Ajout d'un log pour vérifier les données
    addLocationsToMap(allInstitutions.value);
  });
};

// Fonction pour nettoyer les marqueurs existants
const clearMarkers = () => {
  markers.value.forEach((marker) => marker.remove());
  markers.value = [];
};

// Fonction pour ajouter les marqueurs sur la carte
const addLocationsToMap = (institutions) => {
  clearMarkers();
  institutions.forEach((institution) => {
    // Utilisation de 'Latitude' et 'Longitude' si c'est ainsi que les champs sont nommés dans Firebase
    const lat = parseFloat(institution.Latitude);
    const lng = parseFloat(institution.Longitude);

    if (!isNaN(lat) && !isNaN(lng)) {
      const marker = L.marker([lat, lng])
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

  // Ajuster la vue de la carte pour inclure tous les marqueurs
  if (markers.value.length > 0) {
    const group = new L.featureGroup(markers.value);
    map.value.fitBounds(group.getBounds().pad(0.2));
  }
};

// Fonction pour naviguer vers les détails de l'institution
const navigateToDetails = (id) => {
  router.push({ name: 'InstitutionView', params: { id } });
};

// Fonction pour ouvrir le site web de l'institution
const openWebsite = (url) => {
  if (url) {
    const completeUrl =
      url.startsWith('http://') || url.startsWith('https://') ? url : `http://${url}`;
    window.open(completeUrl, '_blank');
  }
};

// Initialisation de la carte et récupération des données
onMounted(() => {
  initMap();
  fetchInstitutionsFromFirebase();
});

// Nettoyage des marqueurs et des listeners lors de la destruction du composant
onUnmounted(() => {
  clearMarkers();
  if (map.value) {
    map.value.remove();
  }
});
</script>

<style scoped>
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

/* Styles pour le dialogue */
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

/* Responsive Design */
@media (max-width: 768px) {
  .map-container {
    height: 300px; /* Ajustez la hauteur pour les petits écrans */
  }
}
</style>
