<template>
  <div>
    <Navbar />
    <div class="page-title">
      <h1>Management Place</h1>
    </div>
    <div class="container mt-4">
      <div class="text-center mb-3">
        <input v-model="search" placeholder="Recherche par nom de place ou remarques"
          class="form-control search-input w-50 mx-auto">
      </div>

      <div v-if="filteredPlaces.length > 0" class="table-responsive">
        <table class="table table-striped align-middle p-4 mb-0 table-hover w-100 text-center">
          <thead>
            <tr>
              <th scope="col" class="border-0">Nom</th>
              <th scope="col" class="border-0">NomPlace</th>
              <th scope="col" class="border-0">MSQ</th>
              <th scope="col" class="border-0">SYSINT</th>
              <th scope="col" class="border-0">NEURO-GER</th>
              <th scope="col" class="border-0">AIGU</th>
              <th scope="col" class="border-0">REHAB</th>
              <th scope="col" class="border-0">AMBU</th>
              <th scope="col" class="border-0">FR</th>
              <th scope="col" class="border-0">DE</th>
              <th scope="col" class="border-0">IT</th>
              <th scope="col" class="border-0">ENG</th>
              <th scope="col" class="border-0 small-column">PFP2</th>
              <th scope="col" class="border-0 small-column">PFP1A</th>
              <th scope="col" class="border-0 small-column">PFP1B</th>
              <th scope="col" class="border-0 small-column">PFP4</th>
              <th scope="col" class="border-0 small-column">PFP3</th>
              <th scope="col" class="border-0">Accord Cadre</th>
              <th scope="col" class="border-0">Canton</th>
              <th scope="col" class="border-0">Categorie</th>
              <th scope="col" class="border-0">Convention</th>
              <th scope="col" class="border-0">Lieu</th>
              <th scope="col" class="border-0">Praticien Formateur</th> <!-- New Column -->
              <th scope="col" class="border-0 rounded-end">Remarques</th>
              <th scope="col" class="border-0 rounded-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="place in filteredPlaces" :key="place.IdPlace">
              <td>{{ place.Name }}</td>
              <td><input v-model="place.NomPlace" @change="updatePlace(place, 'NomPlace', place.NomPlace)" class="form-control"></td>
              <td><input type="checkbox" v-model="place.MSQ" @change="updatePlace(place, 'MSQ', place.MSQ)"></td>
              <td><input type="checkbox" v-model="place.SYSINT" @change="updatePlace(place, 'SYSINT', place.SYSINT)"></td>
              <td><input type="checkbox" v-model="place.NEUROGER" @change="updatePlace(place, 'NEUROGER', place.NEUROGER)"></td>
              <td><input type="checkbox" v-model="place.AIGU" @change="updatePlace(place, 'AIGU', place.AIGU)"></td>
              <td><input type="checkbox" v-model="place.REHAB" @change="updatePlace(place, 'REHAB', place.REHAB)"></td>
              <td><input type="checkbox" v-model="place.AMBU" @change="updatePlace(place, 'AMBU', place.AMBU)"></td>
              <td><input type="checkbox" v-model="place.FR" @change="updatePlace(place, 'FR', place.FR)"></td>
              <td><input type="checkbox" v-model="place.DE" @change="updatePlace(place, 'DE', place.DE)"></td>
              <td><input type="checkbox" v-model="place.IT" @change="updatePlace(place, 'IT', place.IT)"></td>
              <td><input type="checkbox" v-model="place.ENG" @change="updatePlace(place, 'ENG', place.ENG)"></td>
              <td><input type="text" v-model="place.PFP2" @change="updatePlace(place, 'PFP2', place.PFP2)" class="form-control small-input"></td>
              <td><input type="text" v-model="place.PFP1A" @change="updatePlace(place, 'PFP1A', place.PFP1A)" class="form-control small-input"></td>
              <td><input type="text" v-model="place.PFP1B" @change="updatePlace(place, 'PFP1B', place.PFP1B)" class="form-control small-input"></td>
              <td><input type="text" v-model="place.PFP4" @change="updatePlace(place, 'PFP4', place.PFP4)" class="form-control small-input"></td>
              <td><input type="text" v-model="place.PFP3" @change="updatePlace(place, 'PFP3', place.PFP3)" class="form-control small-input"></td>
              <td>{{ place.AccordCadreDate }}</td>
              <td>{{ place.Canton }}</td>
              <td>{{ place.Categorie }}</td>
              <td>{{ place.ConventionDate }}</td>
              <td>{{ place.Lieu }}</td>
              <td>
                <select multiple v-model="place.selectedPraticiensFormateurs" @change="updatePraticiensFormateurs(place, place.selectedPraticiensFormateurs)" class="form-control">
                  <option v-for="(praticien, id) in praticiensFormateurs" :key="id" :value="id">{{ praticien }}</option>
                </select>
              </td> <!-- Praticien Formateur -->
              <td><input type="text" v-model="place.Remarques" @change="updatePlace(place, 'Remarques', place.Remarques)" class="form-control"></td>
              <td>
                <button class="btn btn-sm btn-warning me-1" @click="editPlace(place)">Modifier</button>
                <button class="btn btn-sm btn-danger" @click="deletePlace(place.IdPlace)">Supprimer</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-else class="text-center mt-3">
        <p>Aucune place trouvée.</p>
      </div>

      <div class="recap mt-4">
  <h3>Récapitulatif des places par PFP :</h3>
  <ul>
    <li>PFP2 : {{ countPlacesByPFP().PFP2 }} places</li>
    <li>PFP1A : {{ countPlacesByPFP().PFP1A }} places</li>
    <li>PFP1B : {{ countPlacesByPFP().PFP1B }} places</li>
    <li>PFP4 : {{ countPlacesByPFP().PFP4 }} places</li>
    <li>PFP3 : {{ countPlacesByPFP().PFP3 }} places</li>
  </ul>
</div>

    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Utils/Navbar.vue';
import { db } from '../../../../firebase.js';
import { ref, onValue, set, update } from "firebase/database";

export default {
  name: "ManagementPlace",
  components: {
    Navbar
  },
  data() {
    return {
      places: [],
      praticiensFormateurs: {}, // Store fetched praticiensFormateurs as an object with keys as IDs
      search: ''
    };
  },
  computed: {
    filteredPlaces() {
      if (!Array.isArray(this.places)) {
        return [];
      }

      const searchLower = this.search.toLowerCase();
      return this.places.filter(place => 
        place.NomPlace.toLowerCase().includes(searchLower) || 
        place.Lieu.toLowerCase().includes(searchLower) ||
        place.Name.toLowerCase().includes(searchLower)
      );
    }
  },
  methods: {
    countPlacesByPFP() {
    const pfpCounts = {
      PFP2: 0,
      PFP1A: 0,
      PFP1B: 0,
      PFP4: 0,
      PFP3: 0
    };

    this.places.forEach(place => {
      pfpCounts.PFP2 += this.getPFPIncrement(place.PFP2);
      pfpCounts.PFP1A += this.getPFPIncrement(place.PFP1A);
      pfpCounts.PFP1B += this.getPFPIncrement(place.PFP1B);
      pfpCounts.PFP4 += this.getPFPIncrement(place.PFP4);
      pfpCounts.PFP3 += this.getPFPIncrement(place.PFP3);
    });

    return pfpCounts;
  },

  // Fonction pour déterminer l'incrément basé sur la valeur de PFP
  getPFPIncrement(value) {
    console.log(value);
    switch (value) {
      case "1":

      return 1  ;
      case "2":
        return 2;
      case "3":
        return 3;
      case "4":
        return 4;
      case "5":
        return "5";
      default:
        return 0; // Si la valeur n'est pas 1, 2, 3, 4 ou 6, l'incrément est de 0
    }
  },

    async fetchPlacesData() {
      const placesRef = ref(db, 'Places');
      onValue(placesRef, async (snapshot) => {
        const placesData = snapshot.val();
        if (placesData) {
          const placePromises = Object.keys(placesData).map(async key => {
            const place = placesData[key];
            const institutionData = await this.fetchInstitutionData(place.IDPlace);
            return {
              IdPlace: key,
              NomPlace: place.NomPlace || '',
              MSQ: place.MSQ || false,
              SYSINT: place.SYSINT || false,
              NEUROGER: place['NEURO-GER'] || false,
              AIGU: place.AIGU || false,
              REHAB: place.REHAB || false,
              AMBU: place.AMBU || false,
              FR: place.FR || false,
              DE: place.DE || false,
              IT: place.IT || false,
              ENG: place.ENG || false,
              PFP2: place.PFP2 || '',
              PFP1A: place.PFP1A || '',
              PFP1B: place.PFP1B || '',
              PFP4: place.PFP4 || '',
              PFP3: place.PFP3 || '',
              Name: institutionData.Name || 'x',
              AccordCadreDate: institutionData.AccordCadreDate || '',
              Canton: institutionData.Canton || '',
              Categorie: institutionData.Category || '',
              ConventionDate: institutionData.ConventionDate || '',
              Lieu: institutionData.Lieu || '',
              Remarques: place.Note || '',
              selectedPraticiensFormateurs: place.praticiensFormateurs || [] // Store selected praticien formateurs IDs as an array
            };
          });

          this.places = await Promise.all(placePromises);
        }
      });
    },

    async fetchPraticiensFormateursData() {
      const praticiensRef = ref(db, 'PraticienFormateurs');
      onValue(praticiensRef, (snapshot) => {
        const praticiensData = snapshot.val() || {};
        this.praticiensFormateurs = Object.keys(praticiensData).reduce((acc, key) => {
          acc[key] = `${praticiensData[key].Prenom} ${praticiensData[key].Nom}`;
          return acc;
        }, {}); // Store praticiens as an object with IDs as keys and names as values
      });
    },

    async fetchInstitutionData(idPlace) {
      const institutionRef = ref(db, `Institutions/${idPlace}`);
      return new Promise((resolve) => {
        onValue(institutionRef, (snapshot) => {
          resolve(snapshot.val() || {});
        });
      });
    },

    async updatePlace(place, field, value) {
      const placeRef = ref(db, `Places/${place.IdPlace}`);
      await update(placeRef, { [field]: value });
    },

    async updatePraticiensFormateurs(place, praticiensIds) {
      const placeRef = ref(db, `Places/${place.IdPlace}`);
      await update(placeRef, { praticiensFormateurs: praticiensIds });
    },

    editPlace(place) {
      // Logic for editing a place (e.g., open a modal to edit place details)
      alert(`Modifier la place: ${place.NomPlace}`);
    },

    async deletePlace(placeId) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette place ?')) {
        try {
          const placeRef = ref(db, `Places/${placeId}`);
          await set(placeRef, null);
          this.places = this.places.filter(place => place.IdPlace !== placeId);
        } catch (error) {
          console.error('Erreur de suppression de la place', error);
        }
      }
    }
  },
  async mounted() {
    await this.fetchPraticiensFormateursData();
    this.fetchPlacesData();
  }
};
</script>

<style>
.table-striped tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}

.search-input {
  max-width: 400px;
}

.page-title {
  margin-bottom: 20px;
}

.small-column {
  width: 5%;
}

.small-input {
  width: 100%;
}

.btn-warning {
  color: white;
}

.btn-danger {
  color: white;
}

.recap {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 5px;
}

.recap h3 {
  margin-bottom: 15px;
}

.recap ul {
  list-style-type: none;
  padding: 0;
}

.recap li {
  margin-bottom: 5px;
}

</style>