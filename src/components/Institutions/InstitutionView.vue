<template>
  <Navbar />
  <div class="p-4 border-round">
    <!-- Conteneur principal de l'institution -->
    <div class="institution-container">
      <!-- Image de l'institution -->

      <!-- Informations institution -->
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
            <i class="pi pi-comments text-primary mr-2"></i>
            <span class="text-900">Canton : {{ institutionDetails ? institutionDetails.Canton : '' }}</span>
          </span>
        </div>
      </div>
    </div>

    <div class="institution-image-wrapper institution-image text-center my-4">
      <img
        :src="institutionDetails ? institutionDetails.ImageURL : 'https://eduport.webestica.com/assets/images/courses/4by3/21.jpg'"
        alt="Institution Image"
        class="institution-image w-100px"
      />
    </div>

    <!-- Contenu inférieur : TabView et Map -->
    <div class="content-lower grid mb-4 justify-content-center">
      <div class="col-12 md:col-8 lg:col-5">
        <TabView>
          <TabPanel header="Informations générales de l'institution">
            <div v-if="institutionDetails?.Description" class="text-900 font-bold text-3xl mb-4 mt-2">Description</div>
            <p v-if="institutionDetails?.Description" class="line-height-3 text-600 p-0 mx-0 mt-0 mb-4">
              {{ institutionDetails.Description }}
            </p>

            <div class="grid">
              <div class="col-12 lg:col-12">
                <p class="text-900 underline mb-3 font-bold">Informations générales de l'institution </p>
                <div class="py-0 p-0 m-0 text-600 mb-3">
                  <p class="card-text"><i class="bi bi-globe"></i> <strong>Langue:</strong> {{ institutionDetails ? institutionDetails.Language : '' }}</p>
                  <p class="card-text"><i class="bi bi-globe"></i> <strong>Canton:</strong> {{ institutionDetails ? institutionDetails.Canton : '' }}</p>
                  <p class="card-text"><i class="bi bi-geo-alt-fill"></i> <strong>Adresse:</strong> {{ institutionDetails ? institutionDetails.Address : '' }}</p>
                  <p class="card-text"><i class="bi bi-geo-alt-fill"></i> <strong>Lieu:</strong> {{ institutionDetails ? institutionDetails.Locality : '' }}</p>
                  <p class="card-text"><i class="bi bi-geo-alt-fill"></i> <strong>Site Web: </strong>
                    <a :href="institutionDetails?.URL" target="_blank" class="text-primary ">{{ institutionDetails?.URL }}</a>
                  </p>
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel header="Encadrement étudiant.e.s">
            <div class="grid">
              <div class="col-12 lg:col-12">
                <div class="text-900 font-bold text-3xl mb-4 mt-2">Encadrement étudiant.e.s</div>
                <div class="list-none p-0 m-0 text-600 mb-4 text-600">
                  <div v-if="institutionDetails">
                    <p class="card-text">
                      <i class="bi bi-person-badge-fill"></i>
                      <strong>Nom, Prénom du.de la responsable physio: </strong> {{ institutionDetails?.NomChef }}
                    </p>
                    <p class="card-text">
                      <i class="bi bi-envelope-fill"></i>
                      <strong>Email du.de la responsable physio: </strong>
                      <a :href="`mailto:${institutionDetails?.MailChef}`" class="text-primary">{{ institutionDetails?.MailChef }}</a>
                    </p>
                    <p class="card-text">
                      <i class="bi bi-telephone-fill"></i>
                      <strong>Téléphone du.de la responsable physio: </strong>
                      <a :href="`tel:${institutionDetails?.PhoneChef}`" class="text-primary">{{ institutionDetails?.PhoneChef }}</a>
                    </p>
                  </div>
                  <div v-else>
                    <p class="card-text">Aucun praticien.ne formateur.trice.s disponible.</p>
                  </div>
                  <!-- Bouton pour ouvrir le PDF -->
                  <div class="mt-4">
                    <Button
                      v-if="institutionDetails?.CyberleanURL"
                      label="Ouvrir le PDF"
                      icon="pi pi-file-pdf"
                      @click="openPDF"
                      class="p-button-raised p-button-primary"
                    />
                    <p v-else>Aucun PDF disponible pour cette institution.</p>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>
        </TabView>
      </div>

      <div class="col-12 md:col-4 lg:col-5 py-3 lg:pl-6">
        <div class="text-900 font-bold text-3xl mb-4 mt-2">Map</div>
        <div id="map" class="shadow map-container"></div>
      </div>
    </div>
  </div>
  <Footer />
</template>


<script>
import { db, auth } from '../../../firebase.js';
import { ref as firebaseRef, onValue } from "firebase/database";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Navbar from '@/components/Utils/Navbar.vue';
import Footer from '@/components/Utils/Footer.vue';
import { onAuthStateChanged } from "firebase/auth";

export default {
  name: 'InstitutionView',
  components: { Navbar, Footer },
  data() {
    return {
      institutionDetails: null,
      map: null,
      marker: null,
      userRole: null,
    };
  },
  mounted() {
    this.fetchInstitutionDetailsFromFirebase();
    this.checkUserRole();
  },
  methods: {
    initMap(lat, lng) {
      if (this.map) {
        this.map.remove();
      }
      this.map = L.map('map', {
        center: [lat, lng],
        zoom: 13,
        scrollWheelZoom: false,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(this.map);

      this.marker = L.marker([lat, lng], {
        title: 'Localisation de l\'institution',
        riseOnHover: true,
      }).addTo(this.map);
    },

    fetchInstitutionDetailsFromFirebase() {
      const institutionId = this.$route.params.id;
      const institutionRef = firebaseRef(db, `Institutions/${institutionId}`);

      onValue(institutionRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          this.institutionDetails = data;

          if (data.Latitude && data.Longitude) {
            this.initMap(parseFloat(data.Latitude), parseFloat(data.Longitude));
          }
        } else {
          this.$router.push({ name: 'Error404' });
        }
      });
    },

    checkUserRole() {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          const userRef = firebaseRef(db, `Users/${user.uid}/Roles`);
          onValue(userRef, (snapshot) => {
            if (snapshot.exists()) {
              if (snapshot.val().BA23) {
                this.userRole = "BA23";
              }
            }
          });
        } else {
          this.userRole = null;
        }
      });
    },

    openPDF() {
      if (this.institutionDetails?.CyberleanURL) {
        window.open(this.institutionDetails.CyberleanURL, '_blank');
      }
    },
  },
};
</script>

<style scoped>
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

.institution-info {
  flex: 1;
  margin-left: 2rem;
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

  .content-lower > div {
    width: 90% !important;
    margin-bottom: 2rem;
  }

  .map-container {
    height: 300px !important;
  }
}
</style>
