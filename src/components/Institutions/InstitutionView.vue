<template>
  <Navbar />
  <div class="surface-card p-4 shadow-2 border-round">
    <div class="flex justify-content-between flex-column-reverse md:flex-row align-items-center ml-8">
      <div>
        <div class="flex align-items-center text-900 font-medium text-6xl mb-2 pl-8 pr-8 ">
          {{ institutionDetails ? institutionDetails.Name : 'Chargement...' }}
        </div>
        <span class="text-900 font-bold text-3xl mb-4 mt-2 pl-8 pr-8">
          <strong> {{ institutionDetails ? institutionDetails.Locality : '' }} </strong> - {{ institutionDetails ? institutionDetails.Address : '' }}
        </span>
        <div class="flex flex-wrap justify-content-center md:justify-content-start gap-3 mt-2 pl-8 pr-8">
          <span class="inline-flex align-items-center py-2 px-3 font-medium border-1 surface-border border-round">
            <i class="pi pi-comments text-primary mr-2"></i>
            <span class="text-900"> Langue : {{ institutionDetails ? institutionDetails.Language : '' }}</span>
          </span>
          <span class="inline-flex align-items-center py-2 px-3 font-medium border-1 surface-border border-round">
            <i class="pi pi-comments text-primary mr-2"></i>
            <span class="text-900">Canton : {{ institutionDetails ? institutionDetails.Canton : '' }}</span>
          </span>
        </div>
      </div>
    </div>
    <div class="text-center my-4">
      <img :src="institutionDetails ? institutionDetails.ImageURL : 'https://eduport.webestica.com/assets/images/courses/4by3/21.jpg'" alt="Institution Image" class="w-100px institution-image shadow">
    </div>
    <div class="grid mb-4 justify-content-center ">
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
                  <p class="card-text"><i class="bi bi-globe"></i> <strong>Langue:</strong> {{ institutionDetails ? institutionDetails.Language : '' }}</p>
                  <p class="card-text"><i class="bi bi-globe"></i> <strong>Canton:</strong> {{ institutionDetails ? institutionDetails.Canton : '' }}</p>
                  <p class="card-text"><i class="bi bi-geo-alt-fill"></i> <strong>Adresse:</strong> {{ institutionDetails ? institutionDetails.Address : '' }}</p>
                  <p class="card-text"><i class="bi bi-geo-alt-fill"></i> <strong>Lieu:</strong> {{ institutionDetails ? institutionDetails.Locality : '' }}</p>
                  <p class="card-text"><i class="bi bi-geo-alt-fill"></i> <strong>Site Web:</strong> {{ institutionDetails ? institutionDetails.URL : '' }}</p>
                </div>
              </div>
            </div>
          </TabPanel>
          <TabPanel header="Encadrement étudiant.e.s">
            <div class="grid">
              <div class="col-12 lg:col-12">
                <div class="text-900 font-bold text-3xl mb-4 mt-2">Encadrement étudiant.e.s</div>
                <div class="list-none p-0 m-0 text-600 mb-4 text-600">
                  <div v-if="institutionDetails && institutionDetails.PraticiensFormateurs && institutionDetails.PraticiensFormateurs.length">
                    <div v-for="(praticien, index) in institutionDetails.PraticiensFormateurs" :key="index">
                      <p class="card-text"><i class="bi bi-person-badge-fill"></i> <strong>Nom Praticien.ne.s Formateur.trice.s:</strong> {{ praticien.Prenom }} {{ praticien.Nom }}</p>
                      <p class="card-text"><i class="bi bi-envelope-fill"></i> <strong>Email Praticien Formateur:</strong> {{ praticien.Mail }}</p>
                    </div>
                  </div>
                  <div v-else>
                    <p class="card-text">Aucun praticien.ne formateur.trice.s disponible.</p>
                  </div>

                  <!-- Bouton pour ouvrir le PDF -->
                  <Button v-if="pdfUrl" label="Ouvrir le PDF" icon="pi pi-file-pdf" @click="openPDF" class="p-button-raised p-button-danger mt-4" />
                  <p v-else>Aucun PDF disponible pour cette institution.</p> <!-- Message alternatif -->
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
import { db, storage } from '../../../firebase.js';
import { ref as firebaseRef, onValue } from "firebase/database";
import { getDownloadURL, ref as storageRef } from 'firebase/storage';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css'; // Ensure Leaflet's CSS is included
import Navbar from '@/components/Utils/Navbar.vue';
import Footer from '@/components/Utils/Footer.vue';
import Button from '@/views/uikit/Button.vue';
import { ref } from 'vue';

const liked = ref(false);

export default {
  name: 'InstitutionView',
  components: {
    Button,
    Navbar,
    Footer
  },
  data() {
    return {
      institutionDetails: null,
      map: null,
      marker: null,
      pdfUrl: null, // URL for the PDF file
    };
  },
  mounted() {
    this.fetchInstitutionDetailsFromFirebase();
  },
  methods: {
    initMap(lat, lng) {
      if (this.map) {
        this.map.remove(); // Ensures the map is not initialized more than once
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
    fetchInstitutionDetailsFromFirebase() {
      const institutionId = this.$route.params.id; // Assuming this is how you get the ID
      const institutionRef = firebaseRef(db, `Institutions/${institutionId}`);

      onValue(institutionRef, (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          this.institutionDetails = data;

          // Initialize map if coordinates are available
          this.initMapIfNeeded();

          // Fetch the PDF file if it exists in the institution details
          if (data.pdfPath) {
            this.fetchPDF(data.pdfPath);
          } else {
            console.log('No PDF path found in the institution data');
          }
        } else {
          this.$router.push({ name: 'Error404' });
        }
      });
    },
    fetchPDF(pdfPath) {
      const pdfRef = storageRef(storage, pdfPath);
      getDownloadURL(pdfRef)
        .then((url) => {
          this.pdfUrl = url;
          console.log('PDF URL fetched:', this.pdfUrl); // Log the fetched URL
        })
        .catch((error) => {
          console.error('Erreur lors de la récupération du PDF :', error);
        });
    },
    openPDF() {
      if (this.pdfUrl) {
        window.open(this.pdfUrl, '_blank');
      }
    },
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
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Add shadow to the image */
}

.shadow {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2); /* Add shadow to the map */
}
</style>
