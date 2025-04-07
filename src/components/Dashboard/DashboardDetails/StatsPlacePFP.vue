<template>
    <div>
      <Navbar />
  
      <!-- Titre de la page -->
      <div class="page-title">
        <h1>Stats Place PFP Votation PFP4 - BA22</h1>
      </div>
  
      <!-- Section Statistiques -->
      <div class="stats">
        <p><strong>Nombre d'institutions partenaires proposées :</strong> {{ institutionsUtilisees }}</p>
        <p><strong>Nombre de places proposées :</strong> {{ placesUtilisees }}</p>
        <p><strong>Nombre total de slots parmi les places proposées :</strong> {{ filteredSlots.length }}</p>
        <hr>
        <p><strong>Nombre de places utilisées :</strong> {{ activePlacesCount }}</p>
        <p><strong>Nombre de slots actifs :</strong> {{ activeSlots }}</p>
        <p><strong>Nombre de slots inactifs :</strong> {{ inactiveSlots }}</p>
        <hr>
        <p><strong>Nombre de places complètement inactives :</strong> {{ inactivePlacesCount }}</p>
        <p><strong>Nombre de slots complètement inactifs :</strong> {{ completelyInactiveSlots }}</p>
        <p>
          <strong>Places complètement inactives : </strong>
          <span v-if="inactivePlaceInfos.length">
            {{ inactivePlaceInfos.join(' / ') }}
          </span>
          <span v-else>Aucune</span>
        </p>
        <hr>
        <p><strong>Nombre de places en partie inactives : </strong> {{ halfInactivePlacesCount }}</p>
        <p>
          <strong>Places en partie inactives : </strong>
          <span v-if="halfInactivePlaceInfos.length">
            {{ halfInactivePlaceInfos.join(' / ') }}
          </span>
          <span v-else>Aucune</span>
        </p>
      </div>
  
      <!-- Tableau détaillé -->
      <div class="container">
        <table class="stats-table">
          <thead>
            <tr>
              <th>Institution</th>
              <th>Nom Place</th>

              <th>Slot</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(slot, index) in filteredSlots" :key="index">
              <td>{{ slot.InstitutionName }}</td>
              <td>{{ slot.NomPlace }}</td>

              <td>{{ slot.slot }}</td>
              <td>{{ slot.active ? "Active" : "Inactive" }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </template>
  
  <script>
  import Navbar from '@/components/Utils/Navbar.vue';
  import { ref, onValue } from "firebase/database";
  import { db } from 'root/firebase';
  
  export default {
    name: 'StatsPlacePFP',
    components: {
      Navbar
    },
    data() {
      return {
        // Données récupérées depuis Firebase
        places: {},
        institutions: {}
      };
    },
    computed: {
      // Total d'institutions partenaires (utilisées dans Places et présentes dans Institutions)
      totalInstitutions() {
        const ids = new Set();
        for (const key in this.places) {
          const place = this.places[key];
          if (place.IDPlace && this.institutions[place.IDPlace]) {
            ids.add(place.IDPlace);
          }
        }
        return ids.size;
      },
      // Institutions partenaires utilisées (au moins une place de l'institution a PFP4 > 0)
      institutionsUtilisees() {
        const ids = new Set();
        for (const key in this.places) {
          const place = this.places[key];
          const pfp4 = parseInt(place.PFP4) || 0;
          if (pfp4 > 0 && place.IDPlace && this.institutions[place.IDPlace]) {
            ids.add(place.IDPlace);
          }
        }
        return ids.size;
      },
      // Nombre de places utilisées (places ayant PFP4 > 0)
      placesUtilisees() {
        let count = 0;
        for (const key in this.places) {
          const place = this.places[key];
          const pfp4 = parseInt(place.PFP4) || 0;
          if (pfp4 > 0) count++;
        }
        return count;
      },
      // Liste de tous les slots créés à partir de PFP4 pour chaque place
      filteredSlots() {
        const slots = [];
        for (const key in this.places) {
          const place = this.places[key];
          const pfp4 = parseInt(place.PFP4) || 0;
          // Récupération du nom de l'institution à partir de IDPlace
          const institutionName = this.institutions[place.IDPlace] ? this.institutions[place.IDPlace].Name : "";
          if (pfp4 > 0) {
            for (let i = 1; i <= pfp4; i++) {
              const propKey = `selectedActiveBA22PFP4-${i}`;
              let active = false;
              if (propKey in place) {
                active = place[propKey] === true || place[propKey] === "true";
              }
              slots.push({
                NomPlace: place.NomPlace,
                InstitutionName: institutionName,
                slot: i,
                active: active
              });
            }
          }
        }
        return slots;
      },
      // Nombre de slots actifs
      activeSlots() {
        return this.filteredSlots.filter(slot => slot.active).length;
      },
      // Nombre de slots inactifs
      inactiveSlots() {
        return this.filteredSlots.filter(slot => !slot.active).length;
      },
      // Nombre total de slots complètement inactifs parmi les places (total slots des places sans aucun slot actif)
      completelyInactiveSlots() {
        let total = 0;
        for (const key in this.places) {
          const place = this.places[key];
          const pfp4 = parseInt(place.PFP4) || 0;
          if (pfp4 > 0) {
            let activeCount = 0;
            for (let i = 1; i <= pfp4; i++) {
              const propKey = `selectedActiveBA22PFP4-${i}`;
              if (place[propKey] === true || place[propKey] === "true") {
                activeCount++;
              }
            }
            if (activeCount === 0) {
              total += pfp4;
            }
          }
        }
        return total;
      },
      // Liste des places complètement inactives (aucun slot actif) – une place est identifiée par "InstitutionName - NomPlace"
      inactivePlaceInfos() {
        const infosSet = new Set();
        for (const key in this.places) {
          const place = this.places[key];
          const total = parseInt(place.PFP4) || 0;
          if (total > 0) {
            let activeCount = 0;
            for (let i = 1; i <= total; i++) {
              const propKey = `selectedActiveBA22PFP4-${i}`;
              if (place[propKey] === true || place[propKey] === "true") {
                activeCount++;
              }
            }
            if (activeCount === 0) {
              const institutionName = this.institutions[place.IDPlace] ? this.institutions[place.IDPlace].Name : "";
              const info = institutionName ? `${institutionName} - ${place.NomPlace}` : place.NomPlace;
              infosSet.add(info);
            }
          }
        }
        return Array.from(infosSet);
      },
      // Nombre de places complètement inactives (distinctes)
      inactivePlacesCount() {
        return this.inactivePlaceInfos.length;
      },
      // Liste des places à moitié inactives (certaines slots actifs et d'autres inactifs)
      halfInactivePlaceInfos() {
        const infosSet = new Set();
        for (const key in this.places) {
          const place = this.places[key];
          const total = parseInt(place.PFP4) || 0;
          if (total > 0) {
            let activeCount = 0;
            for (let i = 1; i <= total; i++) {
              const propKey = `selectedActiveBA22PFP4-${i}`;
              if (place[propKey] === true || place[propKey] === "true") {
                activeCount++;
              }
            }
            // Considère "à moitié inactives" si certains slots sont actifs mais pas tous
            if (activeCount > 0 && activeCount < total) {
              const institutionName = this.institutions[place.IDPlace] ? this.institutions[place.IDPlace].Name : "";
              const unusedSlots = total - activeCount;
              const info = institutionName
                ? `${institutionName} - ${place.NomPlace} (${unusedSlots} slot non utilisé)`
                : `${place.NomPlace} (${unusedSlots} slots non utilisé)`;
              infosSet.add(info);
            }
          }
        }
        return Array.from(infosSet);
      },
      // Nombre de places à moitié inactives (distinctes)
      halfInactivePlacesCount() {
        return this.halfInactivePlaceInfos.length;
      },
      // Nombre de places actives (comportant au moins un slot actif)
      activePlacesCount() {
        const infosSet = new Set();
        for (const key in this.places) {
          const place = this.places[key];
          const total = parseInt(place.PFP4) || 0;
          if (total > 0) {
            let activeCount = 0;
            for (let i = 1; i <= total; i++) {
              const propKey = `selectedActiveBA22PFP4-${i}`;
              if (place[propKey] === true || place[propKey] === "true") {
                activeCount++;
              }
            }
            if (activeCount > 0) {
              const institutionName = this.institutions[place.IDPlace] ? this.institutions[place.IDPlace].Name : "";
              const info = institutionName ? `${institutionName} - ${place.NomPlace}` : place.NomPlace;
              infosSet.add(info);
            }
          }
        }
        return infosSet.size;
      }
    },
    methods: {
      // Récupère les données "Places" depuis Firebase
      fetchPlaces() {
        const placesRef = ref(db, '/Places');
        onValue(placesRef, (snapshot) => {
          this.places = snapshot.val() || {};
        });
      },
      // Récupère les données "Institutions" depuis Firebase
      fetchInstitutions() {
        const institutionsRef = ref(db, '/Institutions');
        onValue(institutionsRef, (snapshot) => {
          this.institutions = snapshot.val() || {};
        });
      }
    },
    mounted() {
      this.fetchPlaces();
      this.fetchInstitutions();
    }
  };
  </script>
  
  <style scoped>
  .page-title {
    text-align: center;
    margin: 20px 0;
  }
  
  .stats {
    padding: 15px;
    margin: 20px auto;
    max-width: 600px;
    border: 1px solid #ddd;
  }
  
  .stats p {
    margin: 5px 0;
  }
  
  .container {
    padding: 20px;
  }
  
  .stats-table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
  }
  
  .stats-table th,
  .stats-table td {
    border: 1px solid #ddd;
    padding: 8px;
  }
  
  .stats-table th {
    text-align: left;
  }
  </style>
  