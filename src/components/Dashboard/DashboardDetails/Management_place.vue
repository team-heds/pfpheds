<template>
  <div>
    <Navbar />
    <div class="page-title">
      <h1>Gestion des Places</h1>
    </div>
    <div class="container mt-4">
      <!-- Bouton Créer une nouvelle place -->
      <div class="text-center mb-3">
        <button class="btn btn-primary" @click="openCreatePlaceModal">Créer une nouvelle place</button>
      </div>

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
              <th scope="col" class="border-0">Catégorie</th>
              <th scope="col" class="border-0">Convention</th>
              <th scope="col" class="border-0">Lieu</th>
              <th scope="col" class="border-0">Praticien Formateur</th>
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
              <td><input type="checkbox" v-model="place.NEUROGER" @change="updatePlace(place, 'NEURO-GER', place.NEUROGER)"></td>
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
              </td>
              <td><input type="text" v-model="place.Remarques" @change="updatePlace(place, 'Note', place.Remarques)" class="form-control"></td>
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

      <div class="recap mt-4 surface-card">
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

    <!-- Modal de création de place -->
    <div v-if="showCreatePlaceModal" class="modal-overlay">
      <div class="modal-content">
        <h2>Créer une nouvelle place</h2>
        <form @submit.prevent="createPlace">
          <div class="form-group">
            <label for="institutionId">Institution</label>
            <select v-model="newPlace.InstitutionId" @change="populateInstitutionData" class="form-control" required>
              <option value="" disabled selected>Sélectionnez une institution</option>
              <option v-for="(institution, id) in institutions" :key="id" :value="id">{{ institution.Name }}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="NomPlace">NomPlace</label>
            <input v-model="newPlace.NomPlace" type="text" class="form-control" required>
          </div>
          <!-- Cases à cocher -->
          <div class="form-group">
            <label>Spécialités :</label>
            <div>
              <label><input type="checkbox" v-model="newPlace.MSQ"> MSQ</label>
              <label><input type="checkbox" v-model="newPlace.SYSINT"> SYSINT</label>
              <label><input type="checkbox" v-model="newPlace['NEURO-GER']"> NEURO-GER</label>
              <label><input type="checkbox" v-model="newPlace.AIGU"> AIGU</label>
              <label><input type="checkbox" v-model="newPlace.REHAB"> REHAB</label>
              <label><input type="checkbox" v-model="newPlace.AMBU"> AMBU</label>
            </div>
          </div>
          <!-- Langues -->
          <div class="form-group">
            <label>Langues :</label>
            <div>
              <label><input type="checkbox" v-model="newPlace.FR"> FR</label>
              <label><input type="checkbox" v-model="newPlace.DE"> DE</label>
              <label><input type="checkbox" v-model="newPlace.IT"> IT</label>
              <label><input type="checkbox" v-model="newPlace.ENG"> ENG</label>
            </div>
          </div>
          <!-- Champs PFP -->
          <div class="form-group">
            <label>PFP2</label>
            <input v-model="newPlace.PFP2" type="text" class="form-control">
          </div>
          <div class="form-group">
            <label>PFP1A</label>
            <input v-model="newPlace.PFP1A" type="text" class="form-control">
          </div>
          <div class="form-group">
            <label>PFP1B</label>
            <input v-model="newPlace.PFP1B" type="text" class="form-control">
          </div>
          <div class="form-group">
            <label>PFP4</label>
            <input v-model="newPlace.PFP4" type="text" class="form-control">
          </div>
          <div class="form-group">
            <label>PFP3</label>
            <input v-model="newPlace.PFP3" type="text" class="form-control">
          </div>
          <!-- Dates et autres champs -->
          <div class="form-group">
            <label>Accord Cadre</label>
            <input v-model="newPlace.AccordCadreDate" type="date" class="form-control" readonly>
          </div>
          <div class="form-group">
            <label>Canton</label>
            <input v-model="newPlace.Canton" type="text" class="form-control" readonly>
          </div>
          <div class="form-group">
            <label>Catégorie</label>
            <input v-model="newPlace.Categorie" type="text" class="form-control" readonly>
          </div>
          <div class="form-group">
            <label>Convention</label>
            <input v-model="newPlace.ConventionDate" type="date" class="form-control" readonly>
          </div>
          <div class="form-group">
            <label>Lieu</label>
            <input v-model="newPlace.Lieu" type="text" class="form-control" readonly>
          </div>
          <!-- Praticien Formateur -->
          <div class="form-group">
            <label>Praticien Formateur</label>
            <select multiple v-model="newPlace.selectedPraticiensFormateurs" class="form-control">
              <option v-for="(praticien, id) in praticiensFormateurs" :key="id" :value="id">{{ praticien }}</option>
            </select>
          </div>
          <!-- Remarques -->
          <div class="form-group">
            <label>Remarques</label>
            <textarea v-model="newPlace.Remarques" class="form-control"></textarea>
          </div>
          <!-- Boutons -->
          <div class="form-group text-right">
            <button type="button" class="btn btn-secondary" @click="closeCreatePlaceModal">Annuler</button>
            <button type="submit" class="btn btn-primary">Créer</button>
          </div>
        </form>
      </div>
    </div>

  </div>
</template>

<script>
import Navbar from '@/components/Utils/Navbar.vue';
import { db } from '../../../../firebase.js';
import { ref, onValue, set, update, push } from "firebase/database";

export default {
  name: "ManagementPlace",
  components: {
    Navbar
  },
  data() {
    return {
      places: [],
      institutions: {}, // Stocker les données des institutions
      praticiensFormateurs: {}, // Stocker les praticiens formateurs avec les clés comme IDs
      search: '',
      showCreatePlaceModal: false,
      newPlace: {
        InstitutionId: '',
        NomPlace: '',
        MSQ: false,
        SYSINT: false,
        'NEURO-GER': false,
        AIGU: false,
        REHAB: false,
        AMBU: false,
        FR: false,
        DE: false,
        IT: false,
        ENG: false,
        PFP2: '',
        PFP1A: '',
        PFP1B: '',
        PFP4: '',
        PFP3: '',
        AccordCadreDate: '',
        Canton: '',
        Categorie: '',
        ConventionDate: '',
        Lieu: '',
        selectedPraticiensFormateurs: [],
        Remarques: ''
      }
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
        place.Name.toLowerCase().includes(searchLower) ||
        (place.Remarques && place.Remarques.toLowerCase().includes(searchLower))
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

    getPFPIncrement(value) {
      const num = parseInt(value);
      return isNaN(num) ? 0 : num;
    },

    async fetchPlacesData() {
      const placesRef = ref(db, 'Places');
      onValue(placesRef, async (snapshot) => {
        const placesData = snapshot.val();
        if (placesData) {
          const placePromises = Object.keys(placesData).map(async key => {
            const place = placesData[key];
            const institutionData = await this.fetchInstitutionData(place.IDPlace || place.InstitutionId);
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
              Name: institutionData.Name || '',
              AccordCadreDate: institutionData.AccordCadreDate || '',
              Canton: institutionData.Canton || '',
              Categorie: institutionData.Category || '',
              ConventionDate: institutionData.ConventionDate || '',
              Lieu: institutionData.Locality || '',
              Remarques: place.Note || '',
              selectedPraticiensFormateurs: place.praticiensFormateurs || [],
              InstitutionId: place.IDPlace || place.InstitutionId || ''
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
        }, {});
      });
    },

    async fetchInstitutionData(institutionId) {
      if (!institutionId) return {};
      const institutionRef = ref(db, `Institutions/${institutionId}`);
      return new Promise((resolve) => {
        onValue(institutionRef, (snapshot) => {
          resolve(snapshot.val() || {});
        });
      });
    },

    async fetchInstitutionsData() {
      const institutionsRef = ref(db, 'Institutions');
      onValue(institutionsRef, (snapshot) => {
        const institutionsData = snapshot.val() || {};
        this.institutions = institutionsData;
      });
    },

    async updatePlace(place, field, value) {
      const placeRef = ref(db, `Places/${place.IdPlace}`);
      if (field === 'Note') {
        await update(placeRef, { [field]: value });
      } else if (field === 'NEURO-GER') {
        await update(placeRef, { 'NEURO-GER': value });
      } else {
        await update(placeRef, { [field]: value });
      }
    },

    async updatePraticiensFormateurs(place, praticiensIds) {
      const placeRef = ref(db, `Places/${place.IdPlace}`);
      await update(placeRef, { praticiensFormateurs: praticiensIds });
    },

    openCreatePlaceModal() {
      this.showCreatePlaceModal = true;
    },

    closeCreatePlaceModal() {
      this.showCreatePlaceModal = false;
      // Réinitialiser les données de newPlace
      this.newPlace = {
        InstitutionId: '',
        NomPlace: '',
        MSQ: false,
        SYSINT: false,
        'NEURO-GER': false,
        AIGU: false,
        REHAB: false,
        AMBU: false,
        FR: false,
        DE: false,
        IT: false,
        ENG: false,
        PFP2: '',
        PFP1A: '',
        PFP1B: '',
        PFP4: '',
        PFP3: '',
        AccordCadreDate: '',
        Canton: '',
        Categorie: '',
        ConventionDate: '',
        Lieu: '',
        selectedPraticiensFormateurs: [],
        Remarques: ''
      };
    },

    async populateInstitutionData() {
      const institutionData = await this.fetchInstitutionData(this.newPlace.InstitutionId);
      if (institutionData) {
        this.newPlace.AccordCadreDate = institutionData.AccordCadreDate || '';
        this.newPlace.Canton = institutionData.Canton || '';
        this.newPlace.Categorie = institutionData.Category || '';
        this.newPlace.ConventionDate = institutionData.ConventionDate || '';
        this.newPlace.Lieu = institutionData.Locality || '';
        this.newPlace.Name = institutionData.Name || '';
        // Autres champs si nécessaire
      }
    },

    async createPlace() {
      try {
        const newPlaceRef = push(ref(db, 'Places'));
        const placeData = {
          InstitutionId: this.newPlace.InstitutionId,
          NomPlace: this.newPlace.NomPlace,
          MSQ: this.newPlace.MSQ,
          SYSINT: this.newPlace.SYSINT,
          'NEURO-GER': this.newPlace['NEURO-GER'],
          AIGU: this.newPlace.AIGU,
          REHAB: this.newPlace.REHAB,
          AMBU: this.newPlace.AMBU,
          FR: this.newPlace.FR,
          DE: this.newPlace.DE,
          IT: this.newPlace.IT,
          ENG: this.newPlace.ENG,
          PFP2: this.newPlace.PFP2,
          PFP1A: this.newPlace.PFP1A,
          PFP1B: this.newPlace.PFP1B,
          PFP4: this.newPlace.PFP4,
          PFP3: this.newPlace.PFP3,
          Note: this.newPlace.Remarques,
          praticiensFormateurs: this.newPlace.selectedPraticiensFormateurs
        };
        await set(newPlaceRef, placeData);
        this.closeCreatePlaceModal();
      } catch (error) {
        console.error('Erreur lors de la création de la place', error);
      }
    },

    editPlace(place) {
      // Logique pour éditer une place (par exemple, ouvrir une modal pour éditer les détails)
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
    await this.fetchInstitutionsData();
    await this.fetchPlacesData();
  }
};
</script>

<style>
/* Styles existants */
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

/* Styles pour le modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.modal-content {
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  width: 600px;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h2 {
  margin-top: 0;
}

.modal-content .form-group {
  margin-bottom: 15px;
}

.modal-content .form-group label {
  display: block;
  margin-bottom: 5px;
}

.modal-content .form-group input,
.modal-content .form-group select,
.modal-content .form-group textarea {
  width: 100%;
}

.modal-content .form-group input[type="checkbox"] {
  width: auto;
  display: inline-block;
}

.modal-content .form-group label input {
  margin-right: 5px;
}

.modal-content .form-group.text-right {
  text-align: right;
}
</style>
