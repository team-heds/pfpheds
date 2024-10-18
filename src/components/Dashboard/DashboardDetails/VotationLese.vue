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
                <th>Critères validants manquants</th> <!-- New column for criteria count -->

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
                <td>{{ stage.validationCount }}</td>

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
      takenStages: new Set(), // Track stages already selected by other students
      idUser: null,
    };
  },
  computed: {
  filteredStages() {
    // Convert the validationMessage string into an array of validation elements
    const validationElements = this.validationMessage ? this.validationMessage.split(', ').map(element => element.trim()) : [];

    // Filter and sort the stages based on the number of validation elements they match
    return this.stages
      .map(stage => {
        // Count how many of the validation elements are true for this stage
        const validationCount = validationElements.reduce((count, element) => {
          if (Boolean(stage[element])) {
            count++;
          }
          return count;
        }, 0);

        // Return the stage along with the validationCount for display
        return {
          ...stage,
          validationCount // Add the number of criteria the stage satisfies
        };
      })
      .filter(stage => {
        // Only return stages that match at least one validation element
        return this.isStageVisible(stage) && stage.validationCount >= 1;
      })
      .sort((a, b) => b.validationCount - a.validationCount); // Sort by validationCount (descending)
  }
},
  methods: {
    async submitVotes() {
      if (this.selectedStage && this.currentStudent) {
        console.log("Stage selected: ", this.selectedStage);
        console.log("Current student: ", this.currentStudent);

        // Check if necessary properties exist before proceeding
        if (this.idUser) {
          const ida = this.idUser;
          if (ida) {
            console.log("IDPLACE " + this.selectedStage.IDPlace);
            const votationRef = ref(db, `Votation_lese/${ida}`);
            const votationData = {
              studentId: ida,
              selectedStageName: this.selectedStage.NomPlace || "N/A",
              selectedStageLieu: this.selectedStage.Lieu || "N/A",
              selectedStageDomaine: this.selectedStage.Domaine || "N/A",
              selectedIdInstitutionPlace: this.selectedStage.Identifiant || "N/A",
              numberPlace: this.selectedStage.PFP2 || 0,
              selectedStageDetails: {
                FR: Boolean(this.selectedStage.FR),
                ALL: Boolean(this.selectedStage.ALL),
                AIGU: Boolean(this.selectedStage.AIGU),
                REHAB: Boolean(this.selectedStage.REHAB),
                MSQ: Boolean(this.selectedStage.MSQ),
                SYSINT: Boolean(this.selectedStage.SYSINT),
                NEUROGER: Boolean(this.selectedStage.NEUROGER),
                AMBU: Boolean(this.selectedStage.AMBU),
              }
            };
            console.log("Submitting data: ", votationData);

            try {
              await set(votationRef, votationData);
              this.voteResult = votationData; // Update voteResult data property
              alert("Votation transmise");
            } catch (error) {
              console.error("Error saving votation: ", error);
            }
          } else {
            alert("Erreur: Informations de l'étudiant manquantes.");
          }
        } else {
          alert("Erreur: Nom ou prénom de l'étudiant manquant.");
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
      const studentRef = ref(db, `Students/${etudiant.id}`);
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
      console.log("ka : " + uid)
      this.idUser = uid
      if (uid) { // Remplacer par l'UID de l'utilisateur
        console.log("0011" + uid + " - ");

        const studentRef = ref(db, `Students/${uid}`);
        const snapshot = await get(studentRef);
        if (snapshot.exists()) {
          const studentData = snapshot.val();
          this.currentStudent = studentData;
          this.currentStudent.id = uid;

          this.checkValidation();
          //this.pfp1 = this.currentStudent.PFP1_info?.IDA || 'PFP1 non disponible';

          await this.fetchVoteResult(this.idUser); // Fetch the vote result when the student is found

        } else {
          console.log('Étudiant introuvable pour cet UID:', this.currentUserUID);
        }
      } else {
        console.log('Aucun UID utilisateur disponible.');
      }
    },

    async fetchVoteResult(studentId) {
      const votationRef = ref(db, `Votation_lese/${studentId}`);
      const snapshot = await get(votationRef);
      if (snapshot.exists()) {
        this.voteResult = snapshot.val();
      }
    },

    checkValidation() {
      if (!this.currentStudent) return;

      const { FR, ALL, AMBU, MSQ, SYSINT, NEUROGER, REHAB, AIGU } = this.currentStudent;

      this.missingFields = [];
      this.languageIssue = null;

      if (FR == "0" && ALL == "0" && AMBU == "0" && MSQ == "0" && SYSINT == "0" && NEUROGER == "0" && REHAB == "0" && AIGU == "0") {
        // All fields are 0, all checkboxes usable
        this.validationMessage = "Toutes les options sont disponibles";
        return;
      }
      //   if (FR == "0") this.languageIssue = "FR";
      //   if (ALL == "0") this.languageIssue = "ALL";

      if (FR == "0") this.missingFields.push("FR");
      if (ALL == "0") this.missingFields.push("ALL");

      if (AMBU == "0") this.missingFields.push("AMBU");
      if (MSQ == "0") this.missingFields.push("MSQ");
      if (AIGU == "0") this.missingFields.push("AIGU");
      if (SYSINT == "0") this.missingFields.push("SYSINT");
      if (NEUROGER == "0") this.missingFields.push("NEUROGER");
      if (REHAB == "0") this.missingFields.push("REHAB");

      if (this.languageIssue) {
        this.validationMessage = this.languageIssue;
      } else if (this.missingFields.length > 0) {
        this.validationMessage = `${this.missingFields.join(", ")}`;
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
