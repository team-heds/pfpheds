<template>
  <Navbar />
  <div class="surface-card p-4 shadow-2 border-round">
    <div class="flex justify-content-between flex-column-reverse md:flex-row align-items-center ml-8">
      <div>
        <div class="flex align-items-center text-900 font-medium text-6xl mb-2 pl-8 pr-8">
          {{ institutionDetails ? institutionDetails.Name : 'Chargemesnt...' }}
        </div>
        <span class="text-900 font-bold text-3xl mb-4 mt-2 pl-8 pr-8">
          <strong>{{ institutionDetails ? institutionDetails.Locality : '' }}</strong> - {{ institutionDetails ?
            institutionDetails.Address : '' }}
        </span>
        <div class="flex flex-wrap justify-content-center md:justify-content-start gap-3 mt-2 pl-8 pr-8">
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
    <div class="text-center my-4">
      <img
        :src="institutionDetails ? institutionDetails.ImageURL : 'https://eduport.webestica.com/assets/images/courses/4by3/21.jpg'"
        alt="Institution Image" class="w-100px institution-image shadow">
    </div>
    <div class="grid mb-4 justify-content-center">
      <div class="col-8 lg:col-5">
        <TabView>
          <TabPanel header="Informations générales de l'institution">
            <div v-if="institutionDetails?.Description" class="text-900 font-bold text-3xl mb-4 mt-2">Description</div>
            <p v-if="institutionDetails?.Description" class="line-height-3 text-600 p-0 mx-0 mt-0 mb-4">
              {{ institutionDetails.Description }}
            </p>

            <div class="grid">
              <div class="col-12 lg:col-12">
                <span class="text-900 block mb-3 font-bold">Informations générales de l'institution :</span>
                <div class="py-0 p-0 m-0 text-600 mb-3">
                  <p class="card-text"><i class="bi bi-globe"></i> <strong>Langue:</strong> {{ institutionDetails ?
                    institutionDetails.Language : '' }}</p>
                  <p class="card-text"><i class="bi bi-globe"></i> <strong>Canton:</strong> {{ institutionDetails ?
                    institutionDetails.Canton : '' }}</p>
                  <p class="card-text"><i class="bi bi-geo-alt-fill"></i> <strong>Adresse:</strong> {{
                    institutionDetails ? institutionDetails.Address : '' }}</p>
                  <p class="card-text"><i class="bi bi-geo-alt-fill"></i> <strong>Lieu:</strong> {{ institutionDetails ?
                    institutionDetails.Locality : '' }}</p>
                  <p class="card-text"><i class="bi bi-geo-alt-fill"></i> <strong>Site Web:</strong> {{
                    institutionDetails ? institutionDetails.URL : '' }}</p>
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel v-if="userRole === 'BA23'" header="Encadrement étudiant.e.s">
            <div class="grid">
              <div class="col-12 lg:col-12">
                <div class="text-900 font-bold text-3xl mb-4 mt-2">Encadrement étudiant.e.s {{ this.praticiensFormateur
                  }}</div>
                <div class="list-none p-0 m-0 text-600 mb-4 text-600">
                  <div v-if="institutionDetails">
                    <!-- Détails de l'institution (Chef) -->
                    <p class="card-text">
                      <i class="bi bi-person-badge-fill"></i>
                      <strong>Nom Responsable Physio: </strong>
                      {{ institutionDetails?.NomChef }}
                    </p>

                    <!-- Lien pour envoyer un email au chef -->
                    <p class="card-text">
                      <i class="bi bi-envelope-fill"></i>
                      <strong>Email Responsable Physio: </strong>
                      <a :href="`mailto:${institutionDetails?.MailChef}`">
                        {{ institutionDetails?.MailChef }}
                      </a>
                    </p>

                    <!-- Lien pour appeler le chef -->
                    <p class="card-text">
                      <i class="bi bi-telephone-fill"></i>
                      <strong>TéléphoneResponsable Physio: </strong>
                      <a :href="`tel:${institutionDetails?.PhoneChef}`">
                        {{ institutionDetails?.PhoneChef }}
                      </a>
                    </p>

                    <br> <br>
                    <h2>Praticien.ne.s Formateur.ice.s</h2>
                    <div>

                

                    </div> <!-- Détails des praticiens formateurs associés -->
         
                  </div>

                  <div v-else>
                    <p class="card-text">Aucun praticien.ne formateur.trice.s disponible.</p>
                  </div>

                  <!-- Bouton pour ouvrir le PDF -->
                  <div class="mt-4">
                    <Button v-if="institutionDetails?.CyberleanURL" label="Ouvrir le PDF" icon="pi pi-file-pdf"
                      @click="openPDF" class="p-button-raised p-button-danger" />
                    <p v-else>Aucun PDF disponible pour cette institution.</p>
                  </div>
                </div>
              </div>
            </div>
          </TabPanel>


        </TabView>
      </div>

      <div class="col-4 lg:col-5 py-3 lg:pl-6">
        <div class="text-900 font-bold text-3xl mb-4 mt-2">Map</div>
        <div id="map" class="shadow" style="height: 400px; border-radius: 1%;"></div>
      </div>
    </div>
  </div>
  <Footer />
</template>

<script>
import {
  db, auth
} from '../../../firebase.js';
import { ref as firebaseRef, onValue, get } from "firebase/database";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Navbar from '@/components/Utils/Navbar.vue';
import Footer from '@/components/Utils/Footer.vue';
import Button from '@/views/uikit/Button.vue';

import { onAuthStateChanged } from "firebase/auth";


export default {
  name: 'InstitutionView',
  components: {
    Navbar,
    Footer
  },
  data() {
    return {
      institutionDetails: null, // Contient les détails de l'institution
      map: null, // Carte Leaflet
      marker: null, // Marqueur sur la carte
      userRole: null, // Contient le rôle de l'utilisateur connecté
    


    };
  },
  mounted() {
    this.fetchInstitutionDetailsFromFirebase(); // Charger les détails de l'institution
    this.checkUserRole(); // Vérifier le rôle de l'utilisateur connecté



  },
  methods: {
    // Initialiser la carte avec les coordonnées latitude et longitude
    initMap(lat, lng) {
      if (this.map) {
        this.map.remove(); // Si la carte existe déjà, on la retire
      }
      this.map = L.map('map', {
        center: [lat, lng],
        zoom: 13
      });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(this.map);
      this.marker = L.marker([lat, lng]).addTo(this.map);
    },


    // Récupérer les détails de l'institution depuis Firebase
    fetchInstitutionDetailsFromFirebase() {
      const institutionId = this.$route.params.id; // ID de l'institution dans l'URL
      const institutionRef = firebaseRef(db, `Institutions/${institutionId}`);

      onValue(institutionRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          this.institutionDetails = data;

          // Initialiser la carte si les coordonnées sont disponibles
          this.initMapIfNeeded();
        } else {
          this.$router.push({ name: 'Error404' }); // Redirection si l'institution n'existe pas
        }
      });
    },

    // Vérifier le rôle de l'utilisateur connecté
    checkUserRole() {
      onAuthStateChanged(auth, (user) => {
        if (user) {
          const userRef = firebaseRef(db, `Users/${user.uid}/Roles`);
          console.log("fs");
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


    // Ouvrir le PDF dans un nouvel onglet
    openPDF() {
      if (this.institutionDetails?.CyberleanURL) {
        window.open(this.institutionDetails.CyberleanURL, '_blank');
      }
    },

    // Initialiser la carte si les coordonnées (Latitude, Longitude) sont disponibles
    initMapIfNeeded() {
      if (this.institutionDetails && this.institutionDetails.Latitude && this.institutionDetails.Longitude) {
        this.initMap(parseFloat(this.institutionDetails.Latitude), parseFloat(this.institutionDetails.Longitude));
      }
    },
  }
}
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
</style>
