<template>
  <div>
    <Navbar />
    <div class="page-title">
      <h1>Gestion des Votations</h1>
    </div>
    <div class="container mt-4">
      <!-- Menu de Filtrage -->
      <div class="filter-menu mb-3">
        <!-- Sélection des Classes -->
        <div class="classes-checkboxes text-center mb-3">
          <label><input type="checkbox" value="BA23" v-model="selectedClasses"> BA23</label>
          <label><input type="checkbox" value="BA22" v-model="selectedClasses"> BA22</label>
          <label><input type="checkbox" value="BA24" v-model="selectedClasses"> BA24</label>
          <label><input type="checkbox" value="PRO" v-model="selectedClasses"> PRO</label>
        </div>

        <!-- Sélection du PFP -->
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

        <!-- Barre de Recherche -->
        <div class="text-center mb-3">
          <input v-model="search" placeholder="Recherche par nom ou prénom"
            class="form-control search-input w-50 mx-auto">
        </div>
      </div>

      <!-- Tableau des Étudiants -->
      <div v-if="selectedPFP && selectedClasses.length > 0" class="table-responsive">
        <table class="table table-striped align-middle p-4 mb-0 table-hover w-100 text-center">
          <thead>
            <tr>
              <th class="border-0 rounded-start">Nom</th>
              <th class="border-0">Prénom</th>
              <th class="border-0">SAE</th>
              <th class="border-0">Lesé</th>
              <th class="border-0">Cas particulier</th>
              <th class="border-0">Remarque</th>
              <th class="border-0">Place de stage</th>
              <th class="border-0">MSQ</th>
              <th class="border-0">SYSINT</th>
              <th class="border-0">NEUROGER</th>
              <th class="border-0">AIGU</th>
              <th class="border-0">REHAB</th>
              <th class="border-0">AMBU</th>
              <th class="border-0">FR</th>
              <th class="border-0">ALL</th>
              <th class="border-0 rounded-end">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="etudiant in filteredEtudiants" :key="etudiant.IDStudent">
              <td>{{ etudiant.Nom }}</td>
              <td>{{ etudiant.Prenom }}</td>
              <td>
                <input type="checkbox" v-model="etudiant.SAE" @change="updateStudent(etudiant, 'SAE', etudiant.SAE)"
                  :disabled="etudiant.validated">
              </td>
              <td>
                <input type="checkbox" v-model="etudiant.Lese" @change="updateStudent(etudiant, 'Lese', etudiant.Lese)"
                  :disabled="etudiant.validated">
              </td>
              <td>
                <input type="checkbox" v-model="etudiant.CasParticulier"
                  @change="updateStudent(etudiant, 'CasParticulier', etudiant.CasParticulier)"
                  :disabled="etudiant.validated">
              </td>
              <td>
                <input type="text" v-model="etudiant.Remarque"
                  @change="updateStudent(etudiant, 'Remarque', etudiant.Remarque)"
                  :disabled="etudiant.validated">
              </td>
              <td>
                <!-- Sélection de la Place de Stage -->
                <select v-model="etudiant.PFPinfo[selectedPFP].selectedStageName" @change="handlePlaceChange(etudiant)"
                  :disabled="etudiant.validated">
                  <option value="" disabled>Sélectionnez une place</option>
                  <option value="empty">Aucune</option>
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
                <button class="btn btn-sm btn-success me-1 mb-1 mb-md-0" @click="validateStudent(etudiant)">
                  {{ etudiant.validated ? 'Dévalider' : 'Valider' }}
                </button>
                <button class="btn btn-sm btn-danger" @click="deleteStudent(etudiant.IDStudent)">
                  Supprimer
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Boutons de Création de Votation -->
      <div v-if="selectedPFP && selectedClasses.length > 0" class="mt-3 text-center">
        <button class="btn btn-primary me-2" @click="createVotation('lese')">Créer votation pour Lesé</button>
        <button class="btn btn-primary" @click="createVotation()">Créer votation</button>
      </div>

      <!-- Récapitulatif des Étudiants -->
      <div class="mt-4 text-center">
        <h4>Total des étudiants: {{ filteredEtudiants.length }}</h4>
        <h4>Total SAE: {{ totalSAE }}</h4>
        <h4>Total Lesé: {{ totalLese }}</h4>
        <h4>Total Cas Particulier: {{ totalCasParticulier }}</h4>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Utils/Navbar.vue';
import { db } from '../../../../firebase.js';
import { ref, get, update, remove, set } from "firebase/database";

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
      loading: true
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
      console.log("selectedClasses changed:", newClasses);
      this.fetchStudentsData();
    },
    selectedPFP(newPFP) {
      console.log("selectedPFP changed:", newPFP);
      this.fetchStudentsData();
    }
  },
  methods: {

    // Fonction pour convertir les chaînes "true"/"false" en booléens
    parseBoolean(value) {
      if (typeof value === 'boolean') return value;
      if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
      }
      return false;
    },

    // Méthode pour télécharger toutes les données de stages en un fichier JSON
    downloadAllStagesJSON() {
      // Crée un objet JSON avec les données des stages
      const allStagesData = this.places.map(stage => ({
        NomPlace: stage.NomP,
        Domaine: stage.Domaine,
        Lieu: stage.Lieu,
        FR: stage.FR || '',
        ALL: stage.ALL || '',
        AIGU: stage.AIGU || '',
        REHAB: stage.REHAB || '',
        MSQ: stage.MSQ || '',
        SYSINT: stage.SYSINT || '',
        NEUROGER: stage.NEUROGER || '',
        AMBU: stage.AMBU || ''
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
      if (!this.selectedPFP || this.selectedClasses.length === 0) {
        console.log("selectedPFP is not set or selectedClasses is empty.");
        this.etudiants = [];
        return;
      }

      console.log("Fetching students data for PFP:", this.selectedPFP, "and classes:", this.selectedClasses);
      this.etudiants = [];
      this.loading = true;

      // Attendre que 'this.places' soit chargé
      await this.fetchPlacesData();

      // Dictionnaire pour stocker les associations étudiant-place
      const studentPlaceMap = {};

      // Fetch des données pour le PFP sélectionné
      console.log("Fetching PFP data from path:", this.selectedPFP);
      const pfpDataRef = ref(db, `${this.selectedPFP}`);
      const pfpDataSnapshot = await get(pfpDataRef);
      const pfpData = pfpDataSnapshot.val() || {};
      console.log("PFP data fetched:", pfpData);

      Object.keys(pfpData).forEach(placeId => {
        const placeData = pfpData[placeId];
        if (placeData && placeData.takenBy) {
          studentPlaceMap[placeData.takenBy] = placeId;
          console.log(`Student ${placeData.takenBy} is taking place ${placeId}`);
        }
      });

      // Fetch tous les étudiants sans distinction de classe
      console.log("Fetching all students data.");
      const allStudentsRef = ref(db, `Students`);
      const allStudentsSnapshot = await get(allStudentsRef);
      const allStudentsData = allStudentsSnapshot.val();
      console.log("All students data fetched:", allStudentsData);

      if (allStudentsData) {
        let studentsWithUserInfo = [];

        for (const key of Object.keys(allStudentsData)) {
          let etudiant = allStudentsData[key];
          // Vérifier si la classe de l'étudiant est dans les classes sélectionnées
          if (!this.selectedClasses.includes(etudiant.Classe)) {
            continue; // Ignorer cet étudiant si sa classe n'est pas sélectionnée
          }

          // Initialisation de PFPinfo
          if (!etudiant.PFPinfo) {
            etudiant.PFPinfo = {};
            console.log(`Initialized PFPinfo for student ${key}`);
          }
          if (!etudiant.PFPinfo[this.selectedPFP]) {
            etudiant.PFPinfo[this.selectedPFP] = {
              selectedStageId: '',
              selectedStageName: ''
            };
            console.log(`Initialized PFPinfo[${this.selectedPFP}] for student ${key}`);
          }

          // Fetch user info from 'Users'
          const userRef = ref(db, `Users/${key}`);
          const userSnapshot = await get(userRef);
          let userInfo = userSnapshot.exists() ? userSnapshot.val() : {};
          console.log(`User info fetched for student ${key}:`, userInfo);

          // Check if student has an assigned place
          let placeId = studentPlaceMap[key];
          let placeName = '';
          if (placeId) {
            const place = this.places.find(p => p.IDENTIFIANT === placeId);
            if (place) {
              placeName = place.NomP;
              // Mise à jour de selectedStageName
              etudiant.PFPinfo[this.selectedPFP].selectedStageName = placeName;
              console.log(`Student ${key} has an assigned place: ${placeName}`);
            } else {
              console.warn(`Place with IDENTIFIANT ${placeId} not found for student ${key}`);
            }
          }

          // Update student data
          let transformedData = {
            IDStudent: key,
            Classe: etudiant.Classe,
            Nom: userInfo.Name || etudiant.Nom || '',
            Prenom: userInfo.Forname || etudiant.Prenom || '',
            Email: userInfo.Mail || '',
            MSQ: etudiant.MSQ || '',
            SYSINT: etudiant.SYSINT || '',
            NEUROGER: etudiant.NEUROGER || '',
            AIGU: etudiant.AIGU || '',
            AMBU: etudiant.AMBU || '',
            REHAB: etudiant.REHAB || '',
            FR: etudiant.FR || '',
            ALL: etudiant.ALL || '',
            SAE: this.parseBoolean(etudiant.SAE),
            Lese: this.parseBoolean(etudiant.Lese),
            CasParticulier: this.parseBoolean(etudiant.CasParticulier),
            Remarque: etudiant.Remarque || '',
            validated: this.parseBoolean(etudiant.validated),
            PFPinfo: etudiant.PFPinfo
          };

          // Si l'étudiant a une place assignée, le marquer comme validé
          if (placeName) {
            transformedData.validated = true;
          }

          studentsWithUserInfo.push(transformedData);
          console.log(`Added student ${key}:`, transformedData);
        }

        // Mettre à jour la liste des étudiants
        this.etudiants = studentsWithUserInfo;
        console.log(`Updated etudiants list:`, studentsWithUserInfo);
      }

      this.loading = false;
      console.log("Finished fetching students data.");
    },


    async fetchPlacesData() {
      if (!this.selectedPFP) {
        console.error("fetchPlacesData called without a selectedPFP.");
        this.places = [];
        return;
      }

      console.log("Fetching places data for PFP:", this.selectedPFP);

      // Validate selectedPFP
      if (!this.isValidFirebasePath(this.selectedPFP)) {
        console.error(`Invalid selectedPFP: "${this.selectedPFP}". It must be a non-empty string without ".", "#", "$", "[", "]", "/".`);
        this.places = [];
        return;
      }

      try {
        const placesRef = ref(db, 'Places');
        const institutionsRef = ref(db, 'Institutions');
        const pfpRef = ref(db, `${this.selectedPFP}`); // Utiliser le PFP sélectionné

        console.log("Fetching data from paths:", 'Places', 'Institutions', this.selectedPFP);

        // Utilisation de Promise.all pour récupérer les données en parallèle
        const [placesSnapshot, institutionsSnapshot, pfpSnapshot] = await Promise.all([
          get(placesRef),
          get(institutionsRef),
          get(pfpRef)
        ]);

        const placesData = placesSnapshot.val();
        const institutionsData = institutionsSnapshot.val();
        const pfpData = pfpSnapshot.val();

        console.log("Places data:", placesData);
        console.log("Institutions data:", institutionsData);
        console.log("PFP data:", pfpData);

        if (placesData && institutionsData) {
          // Transformer les données de places en une liste sans dépendre des clés
          const transformedPlaces = [];

          for (const placeKey in placesData) {
            if (Object.hasOwnProperty.call(placesData, placeKey)) {
              const place = placesData[placeKey];
              const institution = institutionsData[place.InstitutionId] || {};
              const repeatCount = parseInt(place[this.selectedPFP], 10);

              console.log(`Place ${placeKey} has ${repeatCount} place(s) for PFP ${this.selectedPFP}`);

              for (let i = 1; i <= repeatCount; i++) {
                const identifiant = `${placeKey}_${i}`;
                const takenBy = pfpData && pfpData[identifiant] ? pfpData[identifiant].takenBy : null;

                console.log(`Processing place identifier: ${identifiant}, takenBy: ${takenBy}`);

                transformedPlaces.push({
                  IDENTIFIANT: identifiant,
                  Nom: institution.Name || place.NomPlace || '',
                  Domaine: place.Domaine || '',
                  NomP: `${institution.Name || ''} - ${place.NomPlace || ''} - ${institution.Locality || ''} (${i})`,
                  takenBy: takenBy,
                  index: i
                });

                console.log(`Added place:`, {
                  IDENTIFIANT: identifiant,
                  Nom: institution.Name || place.NomPlace || '',
                  Domaine: place.Domaine || '',
                  NomP: `${institution.Name || ''} - ${place.NomPlace || ''} - ${institution.Locality || ''} (${i})`,
                  takenBy: takenBy,
                  index: i
                });
              }
            }
          }

          this.places = transformedPlaces;
          console.log("All places loaded:", this.places);
        } else {
          console.warn("No places or institutions data found.");
          this.places = [];
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des données :', error);
        this.places = [];
      }
    },

    isValidFirebasePath(path) {
      const invalidChars = ['.', '#', '$', '[', ']', '/'];
      if (typeof path !== 'string' || path.trim() === '') {
        return false;
      }
      for (let char of invalidChars) {
        if (path.includes(char)) {
          return false;
        }
      }
      return true;
    },

    updateStudent(etudiant, key, value) {
      console.log(`Updating student ${etudiant.IDStudent}: setting ${key} to ${value}`);

      if (['SAE', 'Lese', 'CasParticulier', 'Remarque', 'validated'].includes(key)) {
        // Pour les champs booléens, assurez-vous qu'ils sont stockés en tant que chaînes "true"/"false"
        let updatedValue = value;
        if (['SAE', 'Lese', 'CasParticulier', 'validated'].includes(key)) {
          updatedValue = value.toString();
        }
        etudiant[key] = value;
        const studentRef = ref(db, `Students/${etudiant.IDStudent}`);
        update(studentRef, { [key]: updatedValue })
          .then(() => console.log(`Updated student ${etudiant.IDStudent} field ${key} in Firebase.`))
          .catch(error => console.error(`Erreur de mise à jour de l'étudiant ${etudiant.IDStudent} :`, error));
      } else {
        // Assurer que PFPinfo[selectedPFP] existe
        if (!etudiant.PFPinfo) {
          etudiant.PFPinfo = {};
          console.log(`Initialized PFPinfo for student ${etudiant.IDStudent}`);
        }
        if (!etudiant.PFPinfo[this.selectedPFP]) {
          etudiant.PFPinfo[this.selectedPFP] = {};
          console.log(`Initialized PFPinfo[${this.selectedPFP}] for student ${etudiant.IDStudent}`);
        }

        // Ici, on suppose que les clés autres que celles listées sont liées à PFPinfo
        // Par exemple, 'selectedStageName'
        etudiant.PFPinfo[this.selectedPFP][key] = value;
        const studentRef = ref(db, `Students/${etudiant.IDStudent}/PFPinfo/${this.selectedPFP}`);
        update(studentRef, { [key]: value })
          .then(() => console.log(`Updated student ${etudiant.IDStudent} PFPinfo[${this.selectedPFP}] field ${key} in Firebase.`))
          .catch(error => console.error(`Erreur de mise à jour de l'étudiant ${etudiant.IDStudent} PFPinfo :`, error));
      }
    },

    async handlePlaceChange(etudiant) {
      console.log(`Handling place change for student ${etudiant.IDStudent}`);
      
      // Assurer que PFPinfo[selectedPFP] existe
      if (!etudiant.PFPinfo) {
        etudiant.PFPinfo = {};
        console.log(`Initialized PFPinfo for student ${etudiant.IDStudent}`);
      }
      if (!etudiant.PFPinfo[this.selectedPFP]) {
        etudiant.PFPinfo[this.selectedPFP] = {
          selectedStageId: '',
          selectedStageName: ''
        };
        console.log(`Initialized PFPinfo[${this.selectedPFP}] for student ${etudiant.IDStudent}`);
      }

      const selectedStageName = etudiant.PFPinfo[this.selectedPFP].selectedStageName;
      console.log(`Selected stage name: ${selectedStageName}`);

      if (selectedStageName === "empty" || selectedStageName === "" || selectedStageName === null) {
        // Clear the assignment
        etudiant.PFPinfo[this.selectedPFP].selectedStageName = '';
        console.log(`Clearing selectedStageName for student ${etudiant.IDStudent}`);

        // Remove the student assignment from the PFP data
        this.clearPFPData(etudiant);

        // Update Firebase
        const studentRef = ref(db, `Students/${etudiant.IDStudent}/PFPinfo/${this.selectedPFP}`);
        update(studentRef, {
          selectedStageId: '',
          selectedStageName: ''
        })
          .then(() => console.log(`Cleared PlaceDeStage for student ${etudiant.IDStudent} in Firebase.`))
          .catch(error => console.error(`Erreur de suppression de PlaceDeStage pour l'étudiant ${etudiant.IDStudent} :`, error));

        return;
      }

      // Handle assignment
      const oldPlace = this.places.find(place => place.takenBy === etudiant.IDStudent);
      if (oldPlace) {
        oldPlace.takenBy = null;
        console.log(`Clearing old place assignment for student ${etudiant.IDStudent}: ${oldPlace.IDENTIFIANT}`);
        update(ref(db, `${this.selectedPFP}/${oldPlace.IDENTIFIANT}`), { takenBy: null })
          .then(() => console.log(`Cleared old place ${oldPlace.IDENTIFIANT} for student ${etudiant.IDStudent} in Firebase.`))
          .catch(error => console.error(`Erreur de mise à jour de la place ${oldPlace.IDENTIFIANT} :`, error));
      }

      const newPlace = this.places.find(place => place.NomP === selectedStageName);
      if (newPlace) {
        newPlace.takenBy = etudiant.IDStudent;
        console.log(`Assigning new place ${newPlace.IDENTIFIANT} to student ${etudiant.IDStudent}`);
        update(ref(db, `${this.selectedPFP}/${newPlace.IDENTIFIANT}`), { takenBy: etudiant.IDStudent })
          .then(() => console.log(`Assigned place ${newPlace.IDENTIFIANT} to student ${etudiant.IDStudent} in Firebase.`))
          .catch(error => console.error(`Erreur de mise à jour de la place ${newPlace.IDENTIFIANT} :`, error));

        // Mettre à jour Firebase
        // Vous pouvez également ajouter selectedStageId si nécessaire
        const studentRef = ref(db, `Students/${etudiant.IDStudent}/PFPinfo/${this.selectedPFP}`);
        update(studentRef, { selectedStageName: selectedStageName })
          .then(() => console.log(`Updated selectedStageName for student ${etudiant.IDStudent} in Firebase.`))
          .catch(error => console.error(`Erreur de mise à jour de selectedStageName pour l'étudiant ${etudiant.IDStudent} :`, error));
      } else {
        console.warn(`Place with NomP ${selectedStageName} not found.`);
      }
    },

    clearPFPData(etudiant) {
      console.log(`Clearing PFP data for student ${etudiant.IDStudent}`);
      // Trouver la place actuelle assignée à l'étudiant
      const oldPlace = this.places.find(place => place.takenBy === etudiant.IDStudent);
      if (oldPlace) {
        // Clear the assignment in the PFP data
        console.log(`Clearing assignment for place ${oldPlace.IDENTIFIANT}`);
        update(ref(db, `${this.selectedPFP}/${oldPlace.IDENTIFIANT}`), { takenBy: null })
          .then(() => console.log(`Cleared assignment for place ${oldPlace.IDENTIFIANT} in Firebase.`))
          .catch(error => console.error(`Erreur de suppression de l'assignation de place ${oldPlace.IDENTIFIANT} :`, error));
      }
    },

    async validateStudent(etudiant) {
      console.log(`Validating student ${etudiant.IDStudent}`);
      
      // Assurer que PFPinfo[selectedPFP] existe
      if (!etudiant.PFPinfo) {
        etudiant.PFPinfo = {};
        console.log(`Initialized PFPinfo for student ${etudiant.IDStudent}`);
      }
      if (!etudiant.PFPinfo[this.selectedPFP]) {
        etudiant.PFPinfo[this.selectedPFP] = {
          selectedStageId: '',
          selectedStageName: ''
        };
        console.log(`Initialized PFPinfo[${this.selectedPFP}] for student ${etudiant.IDStudent}`);
      }

      etudiant.validated = !etudiant.validated;
      this.updateStudent(etudiant, 'validated', etudiant.validated);

      if (etudiant.validated && etudiant.PFPinfo[this.selectedPFP].selectedStageName && etudiant.PFPinfo[this.selectedPFP].selectedStageName !== '') {
        const newPlace = this.places.find(place => place.NomP === etudiant.PFPinfo[this.selectedPFP].selectedStageName);
        if (newPlace) {
          newPlace.takenBy = etudiant.IDStudent;
          console.log(`Assigning place ${newPlace.IDENTIFIANT} to validated student ${etudiant.IDStudent}`);
          update(ref(db, `${this.selectedPFP}/${newPlace.IDENTIFIANT}`), { takenBy: etudiant.IDStudent })
            .then(() => console.log(`Assigned place ${newPlace.IDENTIFIANT} to student ${etudiant.IDStudent} in Firebase.`))
            .catch(error => console.error(`Erreur de mise à jour de la place ${newPlace.IDENTIFIANT} :`, error));
        }
      } else {
        this.clearPFPData(etudiant);
      }
    },

    async deleteStudent(studentId) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cet étudiant ?')) {
        console.log(`Deleting student ${studentId}`);
        try {
          const studentRef = ref(db, `Students/${studentId}`);
          await set(studentRef, null);
          this.etudiants = this.etudiants.filter(student => student.IDStudent !== studentId);
          console.log(`Deleted student ${studentId}`);
        } catch (error) {
          console.error('Erreur de suppression de l’étudiant', error);
        }
      }
    },

    createVotation(type) {
      console.log(`Creating votation of type: ${type}`);
      if (type === 'lese') {
        this.$router.push({ name: 'VotationLese', params: { selectedClass: this.selectedClasses, selectedPFP: this.selectedPFP } });
      } else {
        alert(`Votation créée pour ${type || 'les stages'}`);
      }
    },

    isPlaceTaken(place, etudiant) {
      const taken = place.takenBy && place.takenBy !== etudiant.IDStudent;
      console.log(`Checking if place ${place.IDENTIFIANT} is taken: ${taken}`);
      return taken;
    },

    getClass(value) {
      const className = {
        'bg-success': value === '1' || value === '2',
        'bg-danger': value === '0',
      };
      console.log(`Getting class for value ${value}:`, className);
      return className;
    }
  },
  async mounted() {
    console.log("Component mounted. Initializing data.");
    try {
      // Ne pas appeler fetchStudentsData ou fetchPlacesData ici car selectedPFP n'est pas encore défini
      // Les appels seront effectués lorsque l'utilisateur sélectionne un PFP et/ou des classes
    } catch (error) {
      console.error('Erreur lors du mounted:', error);
    }
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

.table-striped tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}

.search-input {
  max-width: 400px;
}

.page-title {
  margin-bottom: 20px;
}

.pfp-selection select {
  max-width: 200px;
}

.classes-checkboxes label {
  margin-right: 15px;
}

.filter-menu .form-select {
  max-width: 200px;
}

.modal-overlay {
  /* Styles pour le modal si nécessaire */
}
</style>
