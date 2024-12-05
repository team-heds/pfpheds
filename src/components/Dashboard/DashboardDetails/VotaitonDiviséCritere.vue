<template>
  <div>
    <Navbar />
    <div class="flex w-full">
      <UserProfile class="w-5" />
      <div class="container-fluid mt-4 w-8">
        <!-- Section pour la validation -->
        <div v-if="currentStudent && selectedPFP && selectedClass" class="table-responsive mt-4">
          <div v-if="validationMessage" class="mt-4 text-center">
            <h4>Validations</h4>
            <p>A besoin de : {{ validationMessage }}</p>
          </div>
        </div>

        <!-- Table affichant toutes les places de stages disponibles -->
        <div v-if="selectedPFP && selectedClass" class="table-responsive mt-4">
          <div class="d-flex justify-content-center flex-column align-items-center">
            <h3 class="mb-3 text-center">Toutes les places de stages</h3>
            <table class="table table-striped align-middle mb-0 table-hover w-100 text-center">
              <thead>
                <tr>
                  <th>Institutions</th>
                  <th>Lieux</th>
                  <th>Domaine</th>
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
                    <td colspan="12">Places validant {{ group.numberPlace }} critères manquants</td>
                  </tr>
                  <!-- Lignes de stage -->
                  <tr v-for="(stage, index) in group.stages" :key="index">
                    <td>{{ stage.NomPlace }}</td>
                    <td>{{ stage.Lieu }}</td>
                    <td>{{ stage.Domaine }}</td>
                    <td v-if="Boolean(stage.FR)">&#9989;</td>
                    <td v-else>&#10060;</td>
                    <td v-if="Boolean(stage.ALL)">&#9989;</td>
                    <td v-else>&#10060;</td>
                    <td v-if="Boolean(stage.AIGU)">&#9989;</td>
                    <td v-else>&#10060;</td>
                    <td v-if="Boolean(stage.REHAB)">&#9989;</td>
                    <td v-else>&#10060;</td>
                    <td v-if="Boolean(stage.MSQ)">&#9989;</td>
                    <td v-else>&#10060;</td>
                    <td v-if="Boolean(stage.SYSINT)">&#9989;</td>
                    <td v-else>&#10060;</td>
                    <td v-if="Boolean(stage.NEUROGER)">&#9989;</td>
                    <td v-else>&#10060;</td>
                    <td v-if="Boolean(stage.AMBU)">&#9989;</td>
                    <td v-else>&#10060;</td>
                    <td>
                      <input
                        type="radio"
                        :name="'stage-selection'"
                        @change="selectStage(stage)"
                        :disabled="!isStageSelectable(stage)"
                      />
                    </td>
                  </tr>
                  <!-- Interligne entre les groupes -->
                  <tr><td colspan="12">&nbsp;</td></tr>
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

export default {
  name: "VotationView",
  components: {
    Navbar,
    UserProfile
  },
  data() {
    return {
      etudiants: [],
      selectedClass: 'BA24', // Ajustez cette valeur si nécessaire
      selectedPFP: 'PFP1A', // Ajustez cette valeur si nécessaire
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
    groupedStages() {
      const groups = {};

      this.filteredStages.forEach(stage => {
        const missing = this.getMissingCriteria(stage);
        const key = missing.length;

        if (!groups[key]) {
          groups[key] = { numberPlace: key, stages: [] };
        }
        groups[key].stages.push(stage);
      });

      // Trier les groupes par nombre de critères manquants décroissant
      const sortedGroups = Object.keys(groups)
        .sort((a, b) => b - a)
        .map(numberPlace => groups[numberPlace]);

      return sortedGroups;
    },
    filteredStages() {
      return this.stages.filter(stage => this.isStageVisible(stage));
    }
  },
  watch: {
    selectedPFP(newPFP) {
      console.log("selectedPFP changed:", newPFP);
      this.fetchStagesData();
      this.fetchTakenStages();
    },
    selectedClass(newClass) {
      console.log("selectedClass changed:", newClass);
      this.fetchStudentsData();
      this.fetchStagesData();
      this.fetchTakenStages();
    }
  },
  methods: {
    /**
     * Récupère les données de l'institution à partir de son ID.
     * @param {string} institutionId - L'ID de l'institution.
     * @returns {Object} Les données de l'institution ou un objet vide si non trouvé.
     */
    async fetchInstitutionData(institutionId) {
      if (!institutionId) return {};
      const institutionRef = ref(db, `Institutions/${institutionId}`);
      try {
        const snapshot = await get(institutionRef);
        if (snapshot.exists()) {
          return snapshot.val();
        } else {
          console.warn(`Institution avec l'ID ${institutionId} non trouvée.`);
          return {};
        }
      } catch (error) {
        console.error(`Erreur lors de la récupération de l'institution ${institutionId}:`, error);
        return {};
      }
    },
    /**
     * Retourne les critères manquants pour un stage donné.
     * @param {Object} stage - Le stage à évaluer.
     * @returns {Array} Liste des critères manquants.
     */
    getMissingCriteria(stage) {
      const missing = [];
      this.criteriaKeys.forEach(key => {
        if (!Boolean(stage[key])) {
          missing.push(key);
        }
      });
      return missing;
    },
    /**
     * Détermine si un stage est sélectionnable.
     * @param {Object} stage - Le stage à évaluer.
     * @returns {boolean} True si sélectionnable, sinon false.
     */
    isStageSelectable(stage) {
      // Vous pouvez ajouter des conditions supplémentaires ici si nécessaire
      return true;
    },
    /**
     * Soumet le vote de l'étudiant pour une place de stage sélectionnée.
     */
    async submitVotes() {
      if (this.selectedStage && this.currentStudent) {
        const { id } = this.currentStudent;
        if (id) {
          const votationRef = ref(db, `VotationPFP1A/${id}`); // Chemin ajusté pour PFP1A
          const votationData = {
            studentId: id,
            studentName: this.currentStudent.Nom,
            studentFirstName: this.currentStudent.Prenom,
            selectedStageName: this.selectedStage.NomPlace,
            selectedStageLieu: this.selectedStage.Lieu,
            selectedStageDomaine: this.selectedStage.Domaine,
            numberPlace: this.selectedStage.PFP1A, // Utilisation de PFP1A
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

          try {
            await set(votationRef, votationData);
            this.voteResult = votationData; // Mettre à jour la propriété data voteResult

            // Marquer la place comme prise
            const stageRef = ref(db, `PFP1A-B23/${this.selectedStage.IDENTIFIANT}`); // Chemin ajusté pour PFP1A
            await update(stageRef, { takenBy: id });

            alert("Votre vote a été soumis avec succès !");
          } catch (error) {
            console.error("Erreur lors de la soumission du vote:", error);
            alert("Une erreur est survenue lors de la soumission de votre vote. Veuillez réessayer.");
          }
        } else {
          alert("Erreur: Informations de l'étudiant manquantes.");
        }
      } else {
        alert("Veuillez sélectionner une place de stage.");
      }
    },
    /**
     * Récupère les données des étudiants en fonction de la classe et du PFP sélectionnés.
     */
    async fetchStudentsData() {
      if (!this.selectedPFP || !this.selectedClass) return;

      this.etudiants = [];
      const studentsRef = ref(db, `Students/`);
      onValue(studentsRef, (snapshot) => {
        const studentsData = snapshot.val();
        if (studentsData) {
          const transformedData = Object.keys(studentsData).map(key => ({
            id: key,
            Classe: studentsData[key].Classe,
            PFPinfo: studentsData[key].PFPinfo || {},
            ...studentsData[key]
          })).filter(student => 
            student.Classe === this.selectedClass && 
            Boolean(student.PFPinfo[this.selectedPFP]) &&
            Number(student.PFPinfo[this.selectedPFP].selectedStageId) !== 0 // Optionnel: vérifier si un stage est déjà sélectionné
          );

          this.etudiants = transformedData;
          this.findCurrentStudent();
        }
      });
    },
    /**
     * Récupère les données des places de stages disponibles avec PFP1A > 0.
     */
    async fetchStagesData() {
      if (!this.selectedPFP || !this.selectedClass) return;

      // Récupérer les places depuis Places où selectedPFP >=1
      const placesRef = ref(db, 'Places');
      onValue(placesRef, async (snapshot) => {
        const placesData = snapshot.val();
        if (placesData) {
          const placePromises = Object.keys(placesData).map(async key => {
            const place = placesData[key];
            // Filtrer par selectedPFP >=1
            const pfpValue = parseInt(place[this.selectedPFP], 10);
            if (isNaN(pfpValue) || pfpValue < 1) {
              return null;
            }

            const institutionId = place.InstitutionId; // Assume que chaque place a un InstitutionId
            const institutionData = await this.fetchInstitutionData(institutionId);
            return {
              IDENTIFIANT: key,
              NomPlace: place.NomPlace || '',
              Lieu: institutionData.Locality || '',
              Domaine: place.Domaine || '',
              PFP1A: pfpValue, // Utilisation de PFP1A
              FR: place.FR || false,
              ALL: place.ALL || false, // Vérifiez si 'ALL' correspond à 'ALL' dans vos données
              AIGU: place.AIGU || false,
              REHAB: place.REHAB || false,
              MSQ: place.MSQ || false,
              SYSINT: place.SYSINT || false,
              NEUROGER: place['NEURO-GER'] || false,
              AMBU: place.AMBU || false,
              Name: institutionData.Name || '',
              AccordCadreDate: institutionData.AccordCadreDate || '',
              Canton: institutionData.Canton || '',
              Categorie: institutionData.Category || '',
              ConventionDate: institutionData.ConventionDate || '',
              Remarques: place.Note || '',
              selectedPraticiensFormateurs: place.praticiensFormateurs || []
            };
          });

          const fetchedStages = await Promise.all(placePromises);
          this.stages = fetchedStages.filter(stage => stage !== null);

          console.log("Stages chargés:", this.stages);
        }
      });
    },
    /**
     * Récupère les places déjà prises par d'autres étudiants.
     */
    async fetchTakenStages() {
      const pfp1aRef = ref(db, 'PFP1A-B23'); // Chemin ajusté pour PFP1A
      onValue(pfp1aRef, (snapshot) => {
        if (snapshot.exists()) {
          const takenData = snapshot.val();
          this.takenStages.clear();
          for (const key in takenData) {
            const takenBy = takenData[key].takenBy;
            if (takenBy) {
              this.takenStages.add(key); // Ajouter l'IDENTIFIANT des stages pris
            }
          }
        }
      });
    },
    /**
     * Met à jour les données de l'étudiant dans Firebase.
     * @param {Object} etudiant - L'étudiant à mettre à jour.
     */
    updateStudent(etudiant) {
      const studentRef = ref(db, `Students/${etudiant.id}`);
      set(studentRef, etudiant);
    },
    /**
     * Sélectionne un stage.
     * @param {Object} stage - Le stage sélectionné.
     */
    selectStage(stage) {
      this.selectedStage = stage;
    },
    /**
     * Recherche et définit l'étudiant actuel basé sur l'email de l'utilisateur connecté.
     */
    async findCurrentStudent() {
      console.log("Recherche de l'étudiant actuel...");

      if (this.currentUserEmail) {
        console.log("Utilisateur connecté:", this.currentUserEmail);

        // Récupérer les données des utilisateurs
        const usersRef = ref(db, 'Users');
        try {
          const usersSnapshot = await get(usersRef);
          if (usersSnapshot.exists()) {
            const usersData = usersSnapshot.val();

            for (const userKey in usersData) {
              const user = usersData[userKey];

              // Vérifier si l'email correspond
              if (user.Mail && user.Mail.toLowerCase() === this.currentUserEmail.toLowerCase()) {
                // Récupérer les données de l'étudiant
                const studentRef = ref(db, `Students/${userKey}`);
                const studentSnapshot = await get(studentRef);

                let classe = null;
                let msq = null;
                let aigu = null;
                let neuroger = null;
                let rehab = null;
                let sysint = null;
                let fr = null;
                let all = null;
                if (studentSnapshot.exists()) {
                  const studentData = studentSnapshot.val();
                  classe = studentData.Classe || null;
                  msq = studentData.MSQ || null;
                  aigu = studentData.AIGU || null;
                  neuroger = studentData['NEURO-GER'] || null;
                  rehab = studentData.REHAB || null;
                  sysint = studentData.SYSINT || null;
                  fr = studentData.FR || null;
                  all = studentData.ALL || null; // Assure que 'ALL' correspond à 'ALL'
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

                console.log("Étudiant actuel:", this.currentStudent);

                this.checkValidation();
                await this.fetchVoteResult(this.currentStudent.id);
                return;
              }
            }
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des utilisateurs:", error);
        }
      } else {
        this.checkValidation();
      }
    },
    /**
     * Télécharge les données des stages au format JSON.
     */
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
    /**
     * Récupère les résultats de votation pour un étudiant donné.
     * @param {string} studentId - L'ID de l'étudiant.
     */
    async fetchVoteResult(studentId) {
      const votationRef = ref(db, `VotationPFP1A/${studentId}`); // Chemin ajusté pour PFP1A
      try {
        const snapshot = await get(votationRef);
        if (snapshot.exists()) {
          this.voteResult = snapshot.val();
        }
      } catch (error) {
        console.error("Erreur lors de la récupération du résultat du vote:", error);
      }
    },
    /**
     * Vérifie la validation des critères pour l'étudiant actuel.
     */
    checkValidation() {
      if (!this.currentStudent) return;

      const { FR, ALL, AMBU, MSQ, SYSINT, NEUROGER, REHAB, AIGU } = this.currentStudent;
      this.missingFields = [];
      this.languageIssue = null;

      // Vérifier si toutes les cases sont décochées
      if (FR == "0" && ALL == "0" && AMBU == "0" && MSQ == "0" && SYSINT == "0" && NEUROGER == "0" && REHAB == "0" && AIGU == "0") {
        this.validationMessage = "Toutes les options sont disponibles";
        return;
      }

      // Vérifier les critères manquants
      if (FR == "0") this.missingFields.push("FR");
      if (ALL == "0") this.missingFields.push("ALL");
      if (AMBU === "0" || AMBU === 0) this.missingFields.push("AMBU");
      if (MSQ === "0") this.missingFields.push("MSQ");
      if (AIGU === "0") this.missingFields.push("AIGU");
      if (SYSINT === "0") this.missingFields.push("SYSINT");
      if (NEUROGER === "0") this.missingFields.push("NEUROGER");
      if (REHAB == "0") this.missingFields.push("REHAB");

      if (this.missingFields.length > 0) {
        this.validationMessage = `Manque : ${this.missingFields.join(", ")}`;
      } else {
        this.validationMessage = "Tout validé";
      }
    },
    /**
     * Détermine si une place de stage est visible (non prise).
     * @param {Object} stage - Le stage à évaluer.
     * @returns {boolean} True si visible, sinon false.
     */
    isStageVisible(stage) {
      // Vérifier si la place est déjà prise par un autre étudiant
      if (this.takenStages.has(stage.IDENTIFIANT)) {
        return false;
      }

      // Filtrage supplémentaire basé sur les critères de l'étudiant actuel
      if (this.currentStudent) {
        const missing = this.getMissingCriteria(stage);
        // Vous pouvez ajouter des conditions supplémentaires ici si nécessaire
      }

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
    this.fetchTakenStages();
  }
};
</script>

<style scoped>
/* Styles existants */
.table-striped tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);
}

.text-center {
  text-align: center;
}

.flex {
  display: flex;
}

.w-full {
  width: 100%;
}

.w-5 {
  width: 20%;
}

.w-8 {
  width: 80%;
}

.group-header {
  background-color: #f1f1f1;
  font-weight: bold;
}

.group-header td {
  text-align: left;
}

.btn-primary {
  margin: 10px;
}

.btn-success {
  margin: 5px;
}

.btn-warning {
  color: white;
}

.btn-danger {
  color: white;
}

.recoupe {
  background-color: #f9f9f9;
  padding: 20px;
  border-radius: 5px;
}

.recoupe h3 {
  margin-bottom: 15px;
}

.recoupe ul {
  list-style-type: none;
  padding: 0;
}

.recoupe li {
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
