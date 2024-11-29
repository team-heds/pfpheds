<template>
  <div>
    <Navbar />
    <div class="page-title">
      <h1>Management Votation</h1>
    </div>
    <div class="container mt-4">
      <div class="filter-menu mb-3">
        <div class="classes-checkboxes text-center mb-3">
          <label><input type="checkbox" value="ba23" v-model="selectedClasses"> BA23</label>
          <label><input type="checkbox" value="ba22" v-model="selectedClasses"> BA22</label>
          <label><input type="checkbox" value="ba21" v-model="selectedClasses"> BA21</label>
          <label><input type="checkbox" value="PRO" v-model="selectedClasses"> PRO</label>
        </div>
        <div class="pfp-selection text-center mb-3">
          <select v-model="selectedPFP" class="form-select w-50 mx-auto" @change="fetchStudentsData">
            <option disabled value="">Sélectionnez un PFP</option>
            <option value="PFP1A">PFP1A</option>
            <option value="PFP1B">PFP1B</option>
            <option value="PFP2">PFP2</option>
            <option value="PFP3">PFP3</option>
            <option value="PFP4">PFP4</option>
          </select>
        </div>
        <div class="text-center mb-3">
          <input v-model="search" placeholder="Recherche par nom ou prénom"
            class="form-control search-input w-50 mx-auto">
        </div>
      </div>

      <div v-if="selectedPFP && selectedClasses.length > 0" class="table-responsive">
        <table class="table table-striped align-middle p-4 mb-0 table-hover w-100 text-center">
          <thead>
            <tr>
              <th scope="col" class="border-0 rounded-start">Nom</th>
              <th scope="col" class="border-0">Prénom</th>
              <th scope="col" class="border-0">SAE</th>
              <th scope="col" class="border-0">Lesé</th>
              <th scope="col" class="border-0">Cas particulier</th>
              <th scope="col" class="border-0">Remarque</th>
              <th scope="col" class="border-0">Place de stage</th>
              <th scope="col" class="border-0">MSQ</th>
              <th scope="col" class="border-0">SYSINT</th>
              <th scope="col" class="border-0">NEUROGER</th>
              <th scope="col" class="border-0">AIGU</th>
              <th scope="col" class="border-0">REHAB</th>
              <th scope="col" class="border-0">AMBU</th>
              <th scope="col" class="border-0">FR</th>
              <th scope="col" class="border-0 rounded-end">ALL</th>
              <th scope="col" class="border-0 rounded-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="etudiant in etudiants" :key="etudiant.IDStudent">
              <td>{{ etudiant.Nom }}</td>
              <td>{{ etudiant.Prenom }}</td>
              <td><input type="checkbox" v-model="etudiant.SAE" @change="updateStudent(etudiant, 'SAE', etudiant.SAE)"
                  :disabled="etudiant.validated"></td>
              <td><input type="checkbox" v-model="etudiant.Lese"
                  @change="updateStudent(etudiant, 'Lese', etudiant.Lese)" :disabled="etudiant.validated"></td>
              <td><input type="checkbox" v-model="etudiant.CasParticulier"
                  @change="updateStudent(etudiant, 'CasParticulier', etudiant.CasParticulier)"
                  :disabled="etudiant.validated"></td>
              <td><input type="text" v-model="etudiant.Remarque"
                  @change="updateStudent(etudiant, 'Remarque', etudiant.Remarque)" :disabled="etudiant.validated"></td>
              <td>
                <!-- Dynamically populate the dropdown options with filtered places -->
                <select v-model="etudiant.PFPinfo[selectedPFP].PlaceDeStage" @change="handlePlaceChange(etudiant)"
                  :disabled="etudiant.validated">
                  <option value="empty">empty</option>
                  <option v-for="place in places" :key="place.IDENTIFIANT" :value="place.NomP"
                    :disabled="isPlaceTaken(place, etudiant)">
                    {{ place.NomP }}
                  </option>
                </select>

              </td>

              <td :class="getClass(etudiant.MSQ)">{{ etudiant.MSQ }}</td>
              <td :class="getClass(etudiant.SYSINT)">{{ etudiant.SYSINT }}</td>
              <td :class="getClass(etudiant.NEUROGER)">{{ etudiant.NEUROGER }}</td>
              <td :class="getClass(etudiant.AIGU)">{{ etudiant.AIGU }}</td>
              <td :class="getClass(etudiant.REHAB)">{{ etudiant.REHAB }}</td>
              <td :class="getClass(etudiant.AMBU)">{{ etudiant.AMBU }}</td>
              <td :class="getClass(etudiant.FR)">{{ etudiant.FR }}</td>
              <td :class="getClass(etudiant.ALL)">{{ etudiant.ALL }}</td>
              <td>
                <button class="btn btn-sm btn-success me-1 mb-1 mb-md-0" @click="validateStudent(etudiant)">{{
                  etudiant.validated ? 'Dévalider' : 'Valider' }}</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="selectedPFP && selectedClasses.length > 0" class="mt-3 text-center">
        <button class="btn btn-primary me-2" @click="createVotation('lese')">Créer votation pour Lesé</button>
        <button class="btn btn-primary" @click="createVotation()">Créer votation</button>
      </div>

      <div class="mt-4 text-center">
        <h4>Total des étudiants: {{ filteredEtudiants.length }}</h4>
        <h4>Total SAE: {{ totalSAE }}</h4>
        <h4>Total Lesé: {{ totalLese }}</h4>
        <h4>Total Cas Particulier: {{ totalCasParticulier }}</h4>
      </div>
    </div>
  </div>
  <div class="mt-4 text-center">
  <button class="btn btn-secondary" @click="downloadAllStagesJSON">Télécharger le JSON</button>
</div>

</template>


<script>
import Navbar from '@/components/Utils/Navbar.vue';
import { db } from '../../../../firebase.js';
import { ref, onValue, set, update, remove, get } from "firebase/database";

export default {
  name: "VotationManagement",
  components: {
    Navbar
  },
  data() {
    return {
      etudiants: [],
      selectedClasses: [],
      search: '',
      selectedPFP: '',
      places: [],
      loading: true,
      globalFilter: ''
    };
  },
  computed: {
    filteredEtudiants() {
      if (!Array.isArray(this.etudiants)) {
        return [];
      }

      return this.etudiants
        .filter(etudiant => {
          const matchesClass = this.selectedClasses.includes(etudiant.Classe);
          const searchLower = this.search.toLowerCase();
          const matchesSearch = (etudiant.Nom ? etudiant.Nom.toLowerCase().includes(searchLower) : false) || (etudiant.Prenom ? etudiant.Prenom.toLowerCase().includes(searchLower) : false);
          return matchesClass && matchesSearch;
        })
        .sort((a, b) => a.Nom.localeCompare(b.Nom));
    },
    totalSAE() {
      return this.filteredEtudiants.filter(etudiant => etudiant.SAE).length;
    },
    totalLese() {
      return this.filteredEtudiants.filter(etudiant => etudiant.Lese).length;
    },
    totalCasParticulier() {
      return this.filteredEtudiants.filter(etudiant => etudiant.CasParticulier).length;
    }
  },


  watch: {
    selectedClasses(newClasses) {
      this.fetchStudentsData();
    },
    selectedPFP(newPFP) {
      this.fetchStudentsData();
    }
  },
  methods: {

   // Méthode pour télécharger toutes les données de stages en un fichier JSON
   downloadAllStagesJSON() {
      // Crée un objet JSON avec les données des stages
      const allStagesData = this.places.map(stage => ({
        NomPlace: stage.NomP,
        Domaine: stage.Domaine,
        Lieu: stage.Lieu,
        FR: stage.details?.FR || '',
        ALL: stage.details?.ALL || '',
        AIGU: stage.details?.AIGU || '',
        REHAB: stage.details?.REHAB || '',
        MSQ: stage.details?.MSQ || '',
        SYSINT: stage.details?.SYSINT || '',
        NEUROGER: stage.details?.NEUROGER || '',
        AMBU: stage.details?.AMBU || ''
      }));

      // Convertir l'objet en une chaîne JSON
      const jsonContent = JSON.stringify(allStagesData, null, 2);

      // Créer un fichier Blob à partir de la chaîne JSON
      const blob = new Blob([jsonContent], { type: "application/json" });

      // Créer un lien pour télécharger le fichier
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "all_stages_data.json"; // Nom du fichier

      // Simuler le clic sur le lien pour télécharger le fichier
      link.click();

      // Nettoyer l'URL pour éviter les fuites de mémoire
      URL.revokeObjectURL(link.href);
    },
    async fetchStudentsData() {
      if (!this.selectedPFP || this.selectedClasses.length === 0) return;

      this.etudiants = [];
      this.loading = true;

      // Wait for 'this.places' to be loaded
      await this.fetchPlacesData();

      // Fetch PFP2-B23 data
      const pfp2Snapshot = await get(ref(db, 'PFP2-B23'));
      const pfp2Data = pfp2Snapshot.val() || {};
      const studentPlaceMap = {};
      Object.keys(pfp2Data).forEach(placeId => {
        const placeData = pfp2Data[placeId];
        if (placeData && placeData.takenBy) {
          studentPlaceMap[placeData.takenBy] = placeId;
        }
      });

      for (const classe of this.selectedClasses) {
        const starCountRef = ref(db, `Students`);
        const studentsSnapshot = await get(starCountRef);
        const studentsData = studentsSnapshot.val();
        if (studentsData) {
          let studentsWithUserInfo = [];

          for (const key of Object.keys(studentsData)) {
            let etudiant = studentsData[key];
            let pfpInfo = etudiant.PFPinfo ? etudiant.PFPinfo[this.selectedPFP] : {};

            // Fetch user info from 'Users'
            const userRef = ref(db, `Users/${key}`);
            const userSnapshot = await get(userRef);
            let userInfo = userSnapshot.exists() ? userSnapshot.val() : {};

            // Check if student has an assigned place
            let placeId = studentPlaceMap[key];
            let placeName = '';
            if (placeId) {
              const place = this.places.find(p => p.IDENTIFIANT === placeId);
              if (place) {
                placeName = place.NomP;
              }
            }

            // Update student data
            let transformedData = {
              IDStudent: key,
              Classe: classe,
              Nom: userInfo.Name || etudiant.Nom || '',
              Prenom: userInfo.Forname || etudiant.Prenom || '',
              Email: userInfo.Mail || '',
              MSQ: etudiant.MSQ || '',
              SYSINT: etudiant.SYSINT || '',
              NEUROGER: etudiant.NEUROGER || '',
              AIGU: etudiant.AIGU || '',
              AMBU: etudiant.AMBU || '',
              REHAB: etudiant.REHAB || '',
              FR: etudiant.fr || '',
              ALL: etudiant.all || '',
              SAE: etudiant.SAE || false,
              Lese: etudiant.Lese || false,
              CasParticulier: etudiant.CasParticulier || false,
              Remarque: etudiant.Remarque || '',
              validated: etudiant.validated || false,
              PFPinfo: {
                [this.selectedPFP]: {
                  PlaceDeStage: placeName || pfpInfo.PlaceDeStage || 'empty',
                }
              }
            };

            // If student has an assigned place, mark as validated
            if (placeName) {
              transformedData.validated = true;
            }

            studentsWithUserInfo.push(transformedData);
          }

          this.etudiants = [...this.etudiants.filter(etudiant => etudiant.Classe !== classe), ...studentsWithUserInfo];
        }
      }

      this.loading = false;
    },


    async fetchPlacesData() {
  try {
    const placesRef = ref(db, 'Places');
    const institutionsRef = ref(db, 'Institutions');
    const pfp2Ref = ref(db, 'PFP2-B23');

    // Utilisation de Promise.all pour récupérer les données en parallèle
    const [placesSnapshot, institutionsSnapshot, pfp2Snapshot] = await Promise.all([
      get(placesRef),
      get(institutionsRef),
      get(pfp2Ref)
    ]);

    const placesData = placesSnapshot.val();
    const institutionsData = institutionsSnapshot.val();
    const pfp2Data = pfp2Snapshot.val();
    console.log(pfp2Data);

    if (placesData && institutionsData) {
      // Map over the keys of placesData to include IDPlace as a property
      const filteredPlaces = Object.keys(placesData)
        .map(key => ({ ...placesData[key], IDPlace: key }))
        .filter(place => place.PFP2 >= 1);



      this.places = [];
      const idPlacesArray = []; // Nouveau tableau pour stocker les id_place

      filteredPlaces.forEach(place => {
        // On a déjà 'place', pas besoin de récupérer 'placeData' à nouveau
        const institution = institutionsData[place.IDInstitution] || {};

        const repeatCount = parseInt(place.PFP2, 10);

        for (let i = 1; i <= repeatCount; i++) {
          const identifiant = place.IDPlace + '_' + i;
          console.log(identifiant+ " - X");
          const takenBy = pfp2Data && pfp2Data[identifiant] ? pfp2Data[identifiant].takenBy : null;

          console.log(place.IDPlace + "_" + i +  institution.Name);

          const id_place = place.IDPlace + "_" + i;

          // Pousser id_place dans le tableau
          idPlacesArray.push(id_place);

          this.places.push({
            IDENTIFIANT: identifiant,
            Nom: institution.Name || place.NomPlace,
            Domaine: place.Domaine,
            NomP: `${institution.Name || ''} - ${place.NomPlace || ''} - ${institution.Locality || ''} (${i})`,
            takenBy: takenBy,
            index: i
          });
        }

      });
      console.log(filteredPlaces);

      // Imprimer le tableau des id_place
      console.log('Tableau des id_place :', idPlacesArray);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des données :', error);
  }
},



    updateStudent(etudiant, key, value) {
      if (['SAE', 'Lese', 'CasParticulier', 'Remarque', 'validated'].includes(key)) {
        etudiant[key] = value;
      } else {
        etudiant.PFPinfo[this.selectedPFP][key] = value;
      }

      const studentRef = ref(db, `Students/${etudiant.Classe}/${etudiant.IDStudent}`);
      if (['SAE', 'Lese', 'CasParticulier', 'Remarque', 'validated'].includes(key)) {
        update(studentRef, { [key]: value });
      } else {
        update(studentRef, { [`PFPinfo/${this.selectedPFP}/${key}`]: value });
      }
    },

    async handlePlaceChange(etudiant) {
      const placeDeStage = etudiant.PFPinfo[this.selectedPFP].PlaceDeStage;

      if (placeDeStage === "empty") {
        // Clear the assignment
        etudiant.PFPinfo[this.selectedPFP] = {
          PlaceDeStage: 'empty'
        };

        // Remove the student assignment from PFP2-B23
        this.clearPFP2B23(etudiant);

        // Update Firebase
        const studentRef = ref(db, `Students/${etudiant.Classe}/${etudiant.IDStudent}/PFPinfo/${this.selectedPFP}`);
        remove(studentRef);

        return;
      }

      // Handle assignment
      const oldPlace = this.places.find(place => place.takenBy === etudiant.IDStudent);
      if (oldPlace) {
        oldPlace.takenBy = null;
        update(ref(db, `PFP2-B23/${oldPlace.IDENTIFIANT}`), { takenBy: null });
      }

      const newPlace = this.places.find(place => place.NomP === placeDeStage);
      if (newPlace) {
        newPlace.takenBy = etudiant.IDStudent;
        update(ref(db, `PFP2-B23/${newPlace.IDENTIFIANT}`), { takenBy: etudiant.IDStudent });

        // Update Firebase
        etudiant.PFPinfo[this.selectedPFP].PlaceDeStage = placeDeStage;
        const studentRef = ref(db, `Students/${etudiant.Classe}/${etudiant.IDStudent}/PFPinfo/${this.selectedPFP}`);
        update(studentRef, etudiant.PFPinfo[this.selectedPFP]);
      }
    },

    clearPFP2B23(etudiant) {
      // Find the current place assigned to the student
      const oldPlace = this.places.find(place => place.takenBy === etudiant.IDStudent);
      if (oldPlace) {
        // Clear the assignment in PFP2-B23
        remove(ref(db, `PFP2-B23/${oldPlace.IDENTIFIANT}`));
      }
    },

    async validateStudent(etudiant) {
      etudiant.validated = !etudiant.validated;
      this.updateStudent(etudiant, 'validated', etudiant.validated);

      if (etudiant.validated && etudiant.PFPinfo[this.selectedPFP].PlaceDeStage) {
        const newPlace = this.places.find(place => place.NomP === etudiant.PFPinfo[this.selectedPFP].PlaceDeStage);
        if (newPlace) {
          newPlace.takenBy = etudiant.IDStudent;
          update(ref(db, `PFP2-B23/${newPlace.IDENTIFIANT}`), { takenBy: etudiant.IDStudent });
        }
      } else {
        this.clearPFP2B23(etudiant);
      }
    },

    async deleteStudent(studentId, classe) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
        try {
          const studentRef = ref(db, `Students/${classe}/${studentId}`);
          await set(studentRef, null);
          this.etudiants = this.etudiants.filter(student => student.IDStudent !== studentId);
        } catch (error) {
          console.error('Erreur de suppression de l’étudiant', error);
        }
      }
    },

    createVotation(type) {
      if (type === 'lese') {
        this.$router.push({ name: 'VotationLese', params: { selectedClass: this.selectedClasses, selectedPFP: this.selectedPFP } });
      } else {
        alert(`Votation créée pour ${type || 'les stages'}`);
      }
    },

    isPlaceTaken(place, etudiant) {
      return place.takenBy && place.takenBy !== etudiant.IDStudent;
    },

    getClass(value) {
      return {
        'bg-success': value === '1' || value === '2',
        'bg-danger': value === '0',
      };
    }
  },
  async mounted() {
    this.fetchStudentsData();
    this.fetchPlacesData();
  }
};
</script>




<style>
.bg-success {
  background-color: green !important;
  color: white;
}

.bg-danger {
  background-color: red !important;
  color: white;
}

option[disabled] {
  color: gray;
  background-color: lightgray;
}
</style>
