<template>
  <div>
    <Navbar />
    <UserProfile />
    <div class="container-fluid mt-4">
      <!-- Section pour la validation -->
      <div v-if="currentStudent && selectedPFP && selectedClass" class="table-responsive mt-4">
        <div v-if="validationMessage" class="mt-4 text-center">
          <h4>Validation</h4>
          <p>A besoin de : {{ validationMessage }}</p>
        </div>
      </div>

      <!-- Table affichant toutes les places de stages disponibles -->
      <div v-if="selectedPFP && selectedClass" class="table-responsive mt-4">
        <div class="d-flex justify-content-center">
          <h3 class="mb-3 text-center">Toutes les places de stages</h3>
          <table class="table table-striped align-middle mb-0 table-hover w-100 text-center">
            <thead>
              <tr>
                <th>Institutions</th>
                <th>Lieux</th>
                <th>Domaine</th>
                <th>PFP2</th>
                <th>FR</th>
                <th>ALL</th>
                <th>AIGU</th>
                <th>REHAB</th>
                <th>MSQ</th>
                <th>SYSINT</th>
                <th>NEUROGER</th>
                <th>AMBU</th>
                <th>Choisir</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(stage, index) in filteredStages" :key="index">
                <td>{{ stage.NomPlace }}</td>
                <td>{{ stage.Lieu }}</td>
                <td>{{ stage.Domaine }}</td>
                <td>{{ stage.numberPlace }}</td>
                <td v-if="Boolean(stage.FR) == true">&#9989;</td>
                <td v-else>&#10060;</td>
                <td v-if="Boolean(stage.ALL) == true">&#9989;</td>
                <td v-else>&#10060;</td>
                <td v-if="Boolean(stage.AIGU) == true">&#9989;</td>
                <td v-else>&#10060;</td>
                <td v-if="Boolean(stage.REHAB) == true">&#9989;</td>
                <td v-else>&#10060;</td>
                <td v-if="Boolean(stage.MSQ) == true">&#9989;</td>
                <td v-else>&#10060;</td>
                <td v-if="Boolean(stage.SYSINT) == true">&#9989;</td>
                <td v-else>&#10060;</td>
                <td v-if="Boolean(stage.NEUROGER) == true">&#9989;</td>
                <td v-else>&#10060;</td>
                <td v-if="Boolean(stage.AMBU) == true">&#9989;</td>
                <td v-else>&#10060;</td>
                <td>
                  <input type="radio" :name="'stage-selection'" @change="selectStage(stage)">
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Section pour afficher le résultat du vote -->
      <div v-if="voteResult" class="mt-4 text-center">
        <h4>Choix du Vote</h4>
        <p>Stage Sélectionné : {{ voteResult.selectedStageName }}</p>
        <p>Lieu : {{ voteResult.selectedStageLieu }}</p>
        <p>Domaine : {{ voteResult.selectedStageDomaine }}</p>
      </div>

      <div class="mt-4 text-center">
        <button class="btn btn-primary" @click="submitVotes">Voter</button>
      </div>
      <br><br><br><br>
    </div>
  </div>
</template>

<script>
import { db, auth } from '../../../../firebase.js';
import { ref, onValue, set, get } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from '@/components/Utils/Navbar.vue';
import UserProfile from './UserProfile.vue';



export default {
  name: "VotationLese",
  components: {
    Navbar,
    UserProfile
  },
  data() {
    return {
      etudiants: [],
      selectedClass: 'BA23',
      selectedPFP: 'PFP2',
      stages: [],
      selectedStage: null,
      currentStudent: null,
      currentUserEmail: null,
      validationMessage: null,
      missingFields: [],
      languageIssue: null,
      pfp1: [],
      pfp2: [],
      voteResult: null,
      takenStages: new Set() // Track stages already selected by other students
    };
  },
  computed: {
    filteredStages() {
      // Filter to show only available stages not taken by other students
      return this.stages.filter(stage => this.isStageVisible(stage));
    }
  },
  methods: {
    async submitVotes() {

      console.log("oka1");

      console.log("oka12 _ " + this.selectedStage);

      console.log("oka221" + this.currentStudent);

      if (this.selectedStage && this.currentStudent) {
        console.log("oka1");
        const { id } = this.currentStudent;
        if (id) {
          const votationRef = ref(db, `Votation_lese/${id}`);
          const votationData = {
            studentId: id,
            studentName: this.currentStudent.Nom,
            studentFirstName: this.currentStudent.Prenom,
            selectedStageName: this.selectedStage.NomPlace,
            selectedStageLieu: this.selectedStage.Lieu,
            selectedStageDomaine: this.selectedStage.Domaine,
            numberPlace: this.selectedStage.PFP2,
            selectedStageDetails: {
              FR: this.selectedStage.FR,
              ALL: this.selectedStage.ALL,
              AIGU: this.selectedStage.AIGU,
              REHAB: this.selectedStage.REHAB,
              MSQ: this.selectedStage.MSQ,
              SYSINT: this.selectedStage.SYSINT,
              NEUROGER: this.selectedStage.NEUROGER,
              AMBU: this.selectedStage.AMBU
            }
          };

          await set(votationRef, votationData);
          this.voteResult = votationData; // Update voteResult data property
        } else {
          alert("Erreur: Informations de l'étudiant manquantes.");
        }
      } else {
        alert("Veuillez sélectionner une place de stage.");
      }
    },

    async fetchStudentsData() {
      if (!this.selectedPFP || !this.selectedClass) return;

      this.etudiants = [];
      const starCountRef = ref(db, `Students/`);
      onValue(starCountRef, (snapshot) => {
        const studentsData = snapshot.val();
        if (studentsData) {
          const transformedData = Object.keys(studentsData).map(key => ({
            id: key,
            Classe: this.selectedClass,
            PFPinfo: {},
            ...studentsData[key]
          }));
          this.etudiants = transformedData;
          this.findCurrentStudent();
        }
      });
    },

    async fetchStagesData() {
      const placesRef = ref(db, 'Places');
      onValue(placesRef, (snapshot) => {
        const placesData = snapshot.val();
        if (placesData) {
          const filteredPlaces = Object.keys(placesData)
            .map(key => placesData[key])
            .filter(place => place.PFP2 >= 1);

          const institutionsRef = ref(db, 'Institutions');
          onValue(institutionsRef, (institutionsSnapshot) => {
            const institutionsData = institutionsSnapshot.val();
            if (institutionsData) {
              this.places = [];

              filteredPlaces.forEach(place => {
                const institution = institutionsData[place.IDPlace] || {};

                // Add each place only once, even if repeatCount is greater than 1
                this.stages.push({
                  Identifiant: place.IDPlace,
                  NomPlace: institution.Name || place.NomPlace,
                  Lieu: institution.Locality || '',
                  numberPlace: place.PFP2 || '',
                  Domaine: place.NomPlace,
                  FR: place.FR,
                  ALL: place.DE,
                  AIGU: place.AIGU,
                  REHAB: place.REHAB,
                  MSQ: place.MSQ,
                  SYSINT: place.SYSINT,
                  NEUROGER: place['NEURO-GER'], // Using bracket notation to access the property
                  AMBU: place.AMBU,
                  takenBy: place.takenBy || null,
                  NomP: `${institution.Name} - ${place.NomPlace} - ${institution.Lieu}`
                });
              });

              console.log("Populated stages:", this.stages);

              // Fetch votation results to determine taken stages
              this.fetchTakenStages();
            }
          });
        }
      });
    },

    async fetchTakenStages() {
      const votationRef = ref(db, 'Votation_lese');
      onValue(votationRef, (snapshot) => {
        if (snapshot.exists()) {
          const takenData = snapshot.val();
          for (const key in takenData) {
            const takenStageId = takenData[key].selectedStageId;
            if (takenStageId) {
              this.takenStages.add(takenStageId);
            }
          }
        }
      });
    },

    updateStudent(etudiant) {
      const studentRef = ref(db, `Students/${etudiant.Classe}/${etudiant.id}`);
      set(studentRef, etudiant);
    },

    selectStage(stage) {
      this.selectedStage = stage;
      for (const etudiant of this.etudiants) {
        if (!etudiant.PFPinfo[this.selectedPFP]) {
          etudiant.PFPinfo[this.selectedPFP] = {};
        }
        etudiant.PFPinfo[this.selectedPFP].selectedStageName = `${stage.NomPlace} - ${stage.Lieu}`;
        etudiant.PFPinfo[this.selectedPFP].selectedStageId = stage.Identifiant;
        this.updateStudent(etudiant);
      }
    },

    async findCurrentStudent(uid) {
      console.log("0011");

      if (uid) { // Remplacer par l'UID de l'utilisateur
      console.log("0011" + uid);

        const studentRef = ref(db, `Students/${uid}`);
        const snapshot = await get(studentRef);
        if (snapshot.exists()) {
          const studentData = snapshot.val();
          this.currentStudent = studentData;

          this.checkValidation();
//this.pfp1 = this.currentStudent.PFP1_info?.IDA || 'PFP1 non disponible';

          await this.fetchVoteResult(this.currentStudent.id); // Fetch the vote result when the student is found

        } else {
          console.log('Étudiant introuvable pour cet UID:', this.currentUserUID);
        }
      } else {
        console.log('Aucun UID utilisateur disponible.');
      }
    },

    async fetchVoteResult(studentId) {
      const votationRef = ref(db, `votation_lese/${studentId}`);
      const snapshot = await get(votationRef);
      if (snapshot.exists()) {
        this.voteResult = snapshot.val();
      }
    },

    checkValidation() {
      if (!this.currentStudent) return;

      const { fr, all, AMBU, MSQ, SYSINT, NEUROGER, REHAB, AIGU } = this.currentStudent;

      this.missingFields = [];
      this.languageIssue = null;

      if (fr == "0" && all == "0" && AMBU == "0" && MSQ == "0" && SYSINT == "0" && NEUROGER == "0" && REHAB == "0" && AIGU == "0") {
        // All fields are 0, all checkboxes usable
        this.validationMessage = "Toutes les options sont disponibles";
        return;
      }
      if (fr == "0") this.languageIssue = "FR";
      if (all == "0") this.languageIssue = "ALL";

      if (fr == "0") this.missingFields.push("FR");
      if (all == "0") this.missingFields.push("ALL");

      if (AMBU == "0") this.missingFields.push("AMBU");
      if (MSQ == "0") this.missingFields.push("MSQ");
      if (AIGU == "0") this.missingFields.push("AIGU");
      if (SYSINT == "0") this.missingFields.push("SYSINT");
      if (NEUROGER == "0") this.missingFields.push("NEUROGER");
      if (REHAB == "0") this.missingFields.push("REHAB");

      if (this.languageIssue) {
        this.validationMessage = this.languageIssue;
      } else if (this.missingFields.length > 0) {
        this.validationMessage = `manque ${this.missingFields.join(", ")}`;
      } else {
        this.validationMessage = "Tout validé";
      }
    },

    isStageVisible(stage) {
      // Check if the stage is already taken by another student
      if (this.takenStages.has(stage.Identifiant)) {
        return false;
      }

    

    

      return true;
    }
  },

  async mounted() {
    this.fetchStudentsData();
    this.fetchStagesData();
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentStudent = this.findCurrentStudent(user.uid);
      } else {
        this.currentUserEmail = null;
        this.currentStudent = null;
      }
    });
  }
};
</script>

<style scoped>
/* Style de base */
.table-striped {
  width: 80%;
  margin: 0 auto;
}

.text-center {
  text-align: center;
}
</style>
