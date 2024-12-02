<template>
  <div>
    <Navbar />
    <ResumStageUserProfile class="" />
    <div class="flex w-full">
      <div class="container-fluid mt-4 w-full">
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
              <template v-for="(group, groupIndex) in groupedStages" :key="groupIndex">
                <!-- En-tête de groupe -->
                <tr class="group-header">
                  <td colspan="13">Places validant  {{ group.numberPlace }} critères manquants</td>
                </tr>
                <!-- Lignes de stage -->
                <tr v-for="(stage, index) in group.stages" :key="index">
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
                <!-- Interligne entre les groupes -->
                <tr><td colspan="13">&nbsp;</td></tr>
              </template>
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

      <div class="mt-4 text-center">
</div>

      <br><br><br><br>
    </div>
  </div>
</template>


<script>
import { db, auth } from '../../../../firebase.js';
import { ref, onValue, set, get, update } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from '@/components/Utils/Navbar.vue';
import UserProfile from './UserProfile.vue';
import ResumStageUserProfile from '@/components/UserProfile/ResumStageUserProfile.vue'

export default {
  name: "VotationView",
  components: {
    ResumStageUserProfile,
    Navbar,
    UserProfile
  },
  data() {
    return {
      etudiants: [],
      selectedClass: 'BA23', // Adjust this as needed
      selectedPFP: 'PFP2', // Adjust this as needed
      stages: [],
      selectedStage: null,
      currentStudent: null,
      currentUserEmail: null,
      validationMessage: null,
      missingFields: [],
      languageIssue: null,
      voteResult: null,
      takenStages: new Set(),
      criteriaKeys: ['FR', 'ALL', 'AIGU', 'REHAB', 'MSQ', 'SYSINT', 'NEUROGER', 'AMBU'],
      // Track stages already selected by other students
    };
  },
  computed: {
    filteredStages() {
      // Filtre pour afficher uniquement les stages disponibles non pris par d'autres étudiants
      return this.stages.filter(stage => this.isStageVisible(stage));
    },
    groupedStages() {
      const groups = {};
      this.filteredStages.forEach(stage => {
        const key = stage.numberPlace; // Regroupement par numberPlace
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(stage);
      });
      // Vous pouvez trier les groupes par numberPlace si nécessaire
      const sortedGroups = Object.keys(groups)
        .sort((a, b) => b - a)
        .map(numberPlace => ({
          numberPlace: numberPlace,
          stages: groups[numberPlace]
        }));
      return sortedGroups;
    },
  },
  methods: {
    countCriteriaValidated(stage) {
      let count = 0;
      this.criteriaKeys.forEach(key => {
        if (stage[key]) count++;
      });
      return count;
    },

    async submitVotes() {
      if (this.selectedStage && this.currentStudent) {
        const { id } = this.currentStudent;
        if (id) {
          const votationRef = ref(db, `VotationPFP2/${id}`); // Adjust the path as needed
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

          // Update PFP2-B23 to mark the stage as taken
          const stageRef = ref(db, `PFP2-B23/${this.selectedStage.IDENTIFIANT}`);
          await update(stageRef, { takenBy: id });
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
      // Récupérer les places depuis Places
      const placesRef = ref(db, 'Places');
      onValue(placesRef, (snapshot) => {
        const placesData = snapshot.val();
        if (placesData) {
          const filteredPlaces = Object.keys(placesData)
            .map(key => ({ ...placesData[key], IDPlace: key }))
            .filter(place => place.PFP2 >= 1);

          // Récupérer les institutions
          const institutionsRef = ref(db, 'Institutions');
          onValue(institutionsRef, (institutionsSnapshot) => {
            const institutionsData = institutionsSnapshot.val();

            if (institutionsData) {
              // Récupérer PFP2-B23 pour obtenir les places prises
              const pfp2Ref = ref(db, 'PFP2-B23');
              onValue(pfp2Ref, (pfp2Snapshot) => {
                const pfp2Data = pfp2Snapshot.val();

                this.stages = [];

                filteredPlaces.forEach(place => {
                  // Obtenir les données de l'institution
                  const institutionId = placesData[place.IDPlace].IDPlace; // Ensure this field exists in your data
                  const institution = institutionsData[institutionId] || {};

                  // Pour chaque place disponible
                  const repeatCount = parseInt(place.PFP2, 10);
                  for (let i = 1; i <= repeatCount; i++) {
                    const identifiant = place.IDPlace + '_' + i;
                    const takenBy = pfp2Data && pfp2Data[identifiant] ? pfp2Data[identifiant].takenBy : null;

                    // Construire l'objet stage
                    const stage = {
                      IDENTIFIANT: identifiant,
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
                      NEUROGER: place['NEURO-GER'],
                      AMBU: place.AMBU,
                      takenBy: takenBy,
                      NomP: `${institution.Name} - ${place.NomPlace} - ${institution.Locality} (${i})`
                    };

                    // Ajouter le stage au tableau des stages
                    this.stages.push(stage);
                  }
                });

                // Récupérer les résultats de votation pour déterminer les stages pris
                this.fetchTakenStages();
              });
              console.log("ds");
              console.log(this.stages);

            }
          });
        }
      });
    },

    async fetchTakenStages() {
      const pfp2Ref = ref(db, 'PFP2-B23');
      onValue(pfp2Ref, (snapshot) => {
        if (snapshot.exists()) {
          const takenData = snapshot.val();
          for (const key in takenData) {
            const takenBy = takenData[key].takenBy;
            if (takenBy) {
              this.takenStages.add(key); // Add IDENTIFIANT of taken stages
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
    },

    async findCurrentStudent() {
  console.log("AVIS 33");

  if (this.currentUserEmail) {
    console.log("AVIS 34");

    // Fetch data from the 'Users' table
    const dbRef = ref(db, 'Users');
    const snapshot = await get(dbRef);

    if (snapshot.exists()) {
      const usersData = snapshot.val();

      for (const userKey in usersData) {
        const user = usersData[userKey];

        // Check if the email matches the current user's email
        if (user.Mail && user.Mail.toLowerCase() === this.currentUserEmail.toLowerCase()) {
          // Fetch the student's class from the 'Students' table
          const studentRef = ref(db, `Students/${userKey}`);
          const studentSnapshot = await get(studentRef);

          let classe = null;
          let msq = null;
          let aigu = null;
          let fr = null;
          let all = null;
          let neuroger = null;
          let rehab = null;
          let sysint = null;
          if (studentSnapshot.exists()) {
            const studentData = studentSnapshot.val();
            classe = studentData.Classe || null;
            msq = studentData.MSQ || null;
            aigu = studentData.MSQ || null;
            neuroger = studentData.MSQ || null;
            rehab = studentData.MSQ || null;
            sysint = studentData.DSYSINT || null;
            fr = studentData.FR || null;
            all = studentData.ALL || null;
          }

          this.currentStudent = {
            id: userKey,
            Classe: classe,
            MSQ: msq,
            SYSINT: sysint,
            NEUROGER: neuroger,
            REHAB: rehab,
            AIGU: aigu,
            FR: fr,
            ALL: all,
            ...user
          };

          console.log(this.currentStudent);
          console.log("AVIS 35");

          this.checkValidation();
          await this.fetchVoteResult(this.currentStudent.id);
          return;
        }
      }
    }
  } else {
    this.checkValidation();
  }
},


 // Méthode pour télécharger les données en fichier JSON
 downloadJSON() {
    // Crée un objet JSON avec les données de stages, y compris l'ID du stage
    const stagesData = this.stages.map(stage => ({
      IDPlace: stage.IDENTIFIANT, // Ajoute l'ID du stage
      NomPlace: stage.NomPlace,
      Lieu: stage.Lieu,
      Domaine: stage.Domaine,
      FR: stage.FR,
      ALL: stage.ALL,
      AIGU: stage.AIGU,
      REHAB: stage.REHAB,
      MSQ: stage.MSQ,
      SYSINT: stage.SYSINT,
      NEUROGER: stage.NEUROGER,
      AMBU: stage.AMBU,
    }));

    // Convertir l'objet en une chaîne JSON
    const jsonContent = JSON.stringify(stagesData, null, 2);

    // Créer un fichier Blob à partir de la chaîne JSON
    const blob = new Blob([jsonContent], { type: "application/json" });

    // Créer un lien pour télécharger le fichier
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "stages_data.json"; // Nom du fichier

    // Simuler le clic sur le lien pour télécharger le fichier
    link.click();

    // Nettoyer l'URL pour éviter les fuites de mémoire
    URL.revokeObjectURL(link.href);
  },
    async fetchVoteResult(studentId) {
      const votationRef = ref(db, `VotationPFP2/${studentId}`); // Adjust the path as needed
      const snapshot = await get(votationRef);
      if (snapshot.exists()) {
        this.voteResult = snapshot.val();
      }
    },

    checkValidation() {
      console.log( "avis : ");
      console.log( "avis 21: ");

      if (!this.currentStudent) return;
      console.log( "avis 22: ");

      const { FR, ALL, AMBU, MSQ, SYSINT, NEUROGER, REHAB, AIGU } = this.currentStudent;
      console.log(this.currentStudent);
      console.log(this.currentStudent.MSQ);
      this.missingFields = [];
      this.languageIssue = null;

      if (FR == "0" && ALL == "0" && AMBU == "0" && MSQ == "0" && SYSINT == "0" && NEUROGER == "0" && REHAB == "0" && AIGU == "0") {
        // All fields are 0, all checkboxes usable
        this.validationMessage = "Toutes les options sont disponibles";
        console.log( "avis 21: " + this.validationMessage);

        return;
      }
    //  console.log("avis 11");
    //   if (FR == "0") this.languageIssue = "FR";
     //  if (ALL == "0") this.languageIssue = "ALL";

      if (FR == "0") this.missingFields.push("FR");
      if (ALL == "0") this.missingFields.push("ALL");
  //    console.log("avis b" + AMBU)
      if (parseInt(AMBU) < 1 ) console.log("avis bug");
      if (AMBU === 0) this.missingFields.push("AMBU");
      if (MSQ === "0") this.missingFields.push("MSQ");
      if (AIGU === "0") this.missingFields.push("AIGU");
      if (SYSINT === "0") this.missingFields.push("SYSINT");
      if (NEUROGER === "0") this.missingFields.push("NEUROGER");
      if (REHAB == "0") this.missingFields.push("REHAB");

      if (this.languageIssue) {
   //     console.log("avis lan uss");
        this.validationMessage = this.languageIssue;
      } else if (this.missingFields.length > 0) {
  //      console.log("avis lan uss22");

        this.validationMessage = `manque ${this.missingFields.join(", ")}`;
      } else {
        this.validationMessage = "Tout validé";
      }
      console.log( "avis 2: " + this.validationMessage);
    },

    isStageVisible(stage) {
      // Check if the stage is already taken by another student
      if (this.takenStages.has(stage.IDENTIFIANT)) {
        return false;
      }

      // Additional filtering based on student's missing fields or validation criteria can be added here

      return true;
    }
  },

  async mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUserEmail = user.email;
        this.findCurrentStudent();
      } else {
        this.currentUserEmail = null;
        this.currentStudent = null;
      }
    });
    this.fetchStudentsData();
    this.fetchStagesData();
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
