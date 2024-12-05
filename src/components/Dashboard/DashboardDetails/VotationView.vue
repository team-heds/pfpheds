<template>
  <div>
    <Navbar />
    <ResumStageUserProfile class="mb-5" />
    <div class="main-container flex flex-wrap w-full p-4 gap-6">
      <!-- Section de validation -->
      <div v-if="validationMessage" class="card validation-section">
        <h4 class="text-center font-bold text-lg">Validation</h4>
        <p class="text-center text-secondary">A besoin de : {{ validationMessage }}</p>
      </div>

      <!-- Table des places de stages -->
      <div v-if="selectedPFP && selectedClass" class="card table-section">
        <h3 class="text-center font-bold text-xl mb-4">Toutes les places de stages</h3>
        <div class="table-wrapper">
          <table class="table">
            <thead>
            <tr>
              <th>Institution</th>
              <th>Lieu</th>
              <th>Domaine</th>
              <th>FR</th>
              <th>ALL</th>
              <th>AIGU</th>
              <th>REHAB</th>
              <th>MSQ</th>
              <th>SYSINT</th>
              <th>NEUROGER</th>
              <th>AMBU</th>
              <th>Choix 1</th>
              <th>Choix 2</th>
              <th>Choix 3</th>
              <th>Choix 4</th>
              <th>Choix 5</th>
              <th>Votation 1</th>
              <th>Votation 2</th>
              <th>Votation 3</th>
              <th>Votation 4</th>
              <th>Votation 5</th>
              <th>Votation Total</th>
            </tr>
            </thead>
            <tbody>
            <template v-for="(group, groupIndex) in groupedStages" :key="groupIndex">
              <!-- En-tête du groupe -->
              <tr class="group-header">
                <td colspan="22">Places validant {{ group.numberPlace }} critères manquants</td>
              </tr>
              <!-- Lignes des stages -->
              <tr v-for="(stage, index) in group.stages" :key="index" class="hover-row">
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
                <!-- Cases à cocher pour les 5 choix -->
                <td>
                  <input
                    type="checkbox"
                    :disabled="isChoiceDisabled(stage, 'choice1')"
                    :checked="selectedChoices.choice1 === stage.IDENTIFIANT"
                    @change="handleChoiceChange(stage.IDENTIFIANT, 'choice1')"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    :disabled="isChoiceDisabled(stage, 'choice2')"
                    :checked="selectedChoices.choice2 === stage.IDENTIFIANT"
                    @change="handleChoiceChange(stage.IDENTIFIANT, 'choice2')"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    :disabled="isChoiceDisabled(stage, 'choice3')"
                    :checked="selectedChoices.choice3 === stage.IDENTIFIANT"
                    @change="handleChoiceChange(stage.IDENTIFIANT, 'choice3')"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    :disabled="isChoiceDisabled(stage, 'choice4')"
                    :checked="selectedChoices.choice4 === stage.IDENTIFIANT"
                    @change="handleChoiceChange(stage.IDENTIFIANT, 'choice4')"
                  />
                </td>
                <td>
                  <input
                    type="checkbox"
                    :disabled="isChoiceDisabled(stage, 'choice5')"
                    :checked="selectedChoices.choice5 === stage.IDENTIFIANT"
                    @change="handleChoiceChange(stage.IDENTIFIANT, 'choice5')"
                  />
                </td>
                <td>{{ voteCounts[stage.IDENTIFIANT]?.Votation1 || 0 }}</td>
                <td>{{ voteCounts[stage.IDENTIFIANT]?.Votation2 || 0 }}</td>
                <td>{{ voteCounts[stage.IDENTIFIANT]?.Votation3 || 0 }}</td>
                <td>{{ voteCounts[stage.IDENTIFIANT]?.Votation4 || 0 }}</td>
                <td>{{ voteCounts[stage.IDENTIFIANT]?.Votation5 || 0 }}</td>
                <td>{{ voteCounts[stage.IDENTIFIANT]?.VotationTotal || 0 }}</td>
              </tr>
              <!-- Ligne vide entre groupes -->
              <tr class="empty-row"><td colspan="22"></td></tr>
            </template>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Résultats du vote -->
      <div v-if="voteResult" class="card result-section">
        <h4 class="font-bold text-lg text-center">Choix du Vote</h4>
        <div v-for="(choice, index) in voteResult" :key="index">
          <p>Choix {{ index + 1 }} :</p>
          <p>Stage Sélectionné : {{ choice.selectedStageName }}</p>
          <p>Lieu : {{ choice.selectedStageLieu }}</p>
          <p>Domaine : {{ choice.selectedStageDomaine }}</p>
        </div>
      </div>

      <!-- Bouton Voter -->
      <div class="w-full flex justify-content-center">
        <Button class="btn btn-primary" @click="submitVotes">Voter</Button>
      </div>
    </div>
  </div>
</template>


<script>
import { db, auth } from '../../../../firebase.js';
import { ref, onValue, get, set, update } from "firebase/database";
import { onAuthStateChanged } from "firebase/auth";
import Navbar from '@/components/Utils/Navbar.vue';
import ResumStageUserProfile from '@/components/UserProfile/ResumStageUserProfile.vue';

export default {
  name: "VotationView",
  components: {
    Navbar,
    ResumStageUserProfile,
  },
  data() {
    return {
      etudiants: [],
      selectedClass: 'BA24',
      selectedPFP: 'PFP1A',
      stages: [],
      selectedStage: null,
      currentStudent: null,
      currentUserEmail: null,
      validationMessage: null,
      missingFields: [],
      languageIssue: null,
      voteResult: null,
      takenStages: new Set(),
      selectedChoices: {
        choice1: null,
        choice2: null,
        choice3: null,
        choice4: null,
        choice5: null,
      },
      voteCounts: {}, // Comptes de votes pour chaque stage
      criteriaKeys: ['FR', 'ALL', 'AIGU', 'REHAB', 'MSQ', 'SYSINT', 'NEUROGER', 'AMBU'],
    };
  },
  computed: {
    filteredStages() {
      return this.stages.filter(stage => this.isStageVisible(stage));
    },
    groupedStages() {
      const groups = {};
      this.filteredStages.forEach(stage => {
        const key = stage.numberPlace;
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(stage);
      });

      return Object.keys(groups)
        .sort((a, b) => b - a)
        .map(numberPlace => ({
          numberPlace: numberPlace,
          stages: groups[numberPlace],
        }));
    },
  },
  watch: {
    selectedPFP(newPFP) {
      this.fetchStagesData();
      this.fetchTakenStages();
      this.fetchVoteCounts();
    },
    selectedClass(newClass) {
      this.fetchStudentsData();
      this.fetchStagesData();
      this.fetchTakenStages();
      this.fetchVoteCounts();
    },
  },
  methods: {
    handleChoiceChange(stageId, choice) {
      if (this.selectedChoices[choice] === stageId) {
        this.selectedChoices[choice] = null;
      } else {
        this.selectedChoices[choice] = stageId;
      }
    },
    isChoiceDisabled(stage, choice) {
      for (const [key, value] of Object.entries(this.selectedChoices)) {
        if (key !== choice && value === stage.IDENTIFIANT) {
          return true;
        }
      }
      if (this.selectedChoices[choice] && this.selectedChoices[choice] !== stage.IDENTIFIANT) {
        return true;
      }
      return false;
    },
    async submitVotes() {
      if (this.currentStudent) {
        const { id } = this.currentStudent;
        if (id) {
          const votationPromises = Object.keys(this.selectedChoices).map(async (choiceKey, index) => {
            const stageId = this.selectedChoices[choiceKey];
            if (stageId) {
              const stage = this.stages.find(s => s.IDENTIFIANT === stageId);
              if (stage) {
                const votationRef = ref(db, `VotationPFP1A/${id}/choices/${choiceKey}`);
                const votationData = {
                  choice: index + 1,
                  studentId: id,
                  selectedStageName: stage.NomPlace,
                  selectedStageLieu: stage.Lieu,
                  selectedStageDomaine: stage.Domaine,
                  selectedStageDetails: {
                    FR: stage.FR,
                    ALL: stage.ALL,
                    AIGU: stage.AIGU,
                    REHAB: stage.REHAB,
                    MSQ: stage.MSQ,
                    SYSINT: stage.SYSINT,
                    NEUROGER: stage.NEUROGER,
                    AMBU: stage.AMBU,
                  },
                };
                await set(votationRef, votationData);

                const stageRef = ref(db, `PFP1A-B23/${stage.IDENTIFIANT}`);
                await update(stageRef, { takenBy: id });

                this.incrementVoteCount(stage.IDENTIFIANT, index + 1);
                return votationData;
              }
            }
            return null;
          });

          try {
            const results = await Promise.all(votationPromises);
            this.voteResult = results.filter(result => result !== null);
            alert("Vos votes ont été soumis avec succès !");
            this.resetChoices();
            this.fetchVoteCounts();
          } catch (error) {
            console.error("Erreur lors de la soumission des votes:", error);
            alert("Une erreur est survenue lors de la soumission de vos votes. Veuillez réessayer.");
          }
        } else {
          alert("Erreur: Informations de l'étudiant manquantes.");
        }
      } else {
        alert("Veuillez sélectionner au moins un choix de stage.");
      }
    },
    resetChoices() {
      this.selectedChoices = {
        choice1: null,
        choice2: null,
        choice3: null,
        choice4: null,
        choice5: null,
      };
    },
    incrementVoteCount(stageId, choiceNumber) {
      if (!this.voteCounts[stageId]) {
        this.$set(this.voteCounts, stageId, {
          Votation1: 0,
          Votation2: 0,
          Votation3: 0,
          Votation4: 0,
          Votation5: 0,
          VotationTotal: 0,
        });
      }
      const choiceKey = `Votation${choiceNumber}`;
      if (this.voteCounts[stageId][choiceKey] !== undefined) {
        this.voteCounts[stageId][choiceKey] += 1;
        this.voteCounts[stageId]['VotationTotal'] += 1;
      }
    },
    async fetchStudentsData() {
      const studentsRef = ref(db, `Students/`);
      onValue(studentsRef, (snapshot) => {
        const studentsData = snapshot.val();
        if (studentsData) {
          const transformedData = Object.keys(studentsData).map(key => ({
            id: key,
            ...studentsData[key],
          })).filter(student => student.Classe === this.selectedClass);
          this.etudiants = transformedData;
          this.findCurrentStudent();
        }
      });
    },
    async fetchStagesData() {
      const placesRef = ref(db, 'Places');
      onValue(placesRef, async (snapshot) => {
        const placesData = snapshot.val();
        if (placesData) {
          const fetchedStages = Object.keys(placesData).map(key => {
            const place = placesData[key];
            return {
              IDENTIFIANT: key,
              ...place,
            };
          });
          this.stages = fetchedStages.filter(stage => stage[this.selectedPFP] >= 1);
        }
      });
    },
    async fetchTakenStages() {
      const pfp1aRef = ref(db, 'PFP1A-B23');
      onValue(pfp1aRef, (snapshot) => {
        if (snapshot.exists()) {
          const takenData = snapshot.val();
          this.takenStages.clear();
          for (const key in takenData) {
            const takenBy = takenData[key].takenBy;
            if (takenBy) {
              this.takenStages.add(key);
            }
          }
        }
      });
    },
    async fetchVoteCounts() {
      const votationRef = ref(db, `VotationPFP1A`);
      onValue(votationRef, (snapshot) => {
        if (snapshot.exists()) {
          const votations = snapshot.val();
          const counts = {};
          Object.keys(votations).forEach(studentId => {
            const studentVotes = votations[studentId]?.choices || {};
            Object.values(studentVotes).forEach(vote => {
              if (vote.selectedStageName) {
                const stageId = vote.selectedStageName;
                const votKey = `Votation${vote.choice}`;
                if (!counts[stageId]) {
                  counts[stageId] = {
                    Votation1: 0,
                    Votation2: 0,
                    Votation3: 0,
                    Votation4: 0,
                    Votation5: 0,
                    VotationTotal: 0,
                  };
                }
                counts[stageId][votKey] += 1;
                counts[stageId]['VotationTotal'] += 1;
              }
            });
          });
          this.voteCounts = counts;
        }
      });
    },
    isStageVisible(stage) {
      return !this.takenStages.has(stage.IDENTIFIANT);
    },
    async findCurrentStudent() {
      if (this.currentUserEmail) {
        const usersRef = ref(db, 'Users');
        const usersSnapshot = await get(usersRef);
        if (usersSnapshot.exists()) {
          const usersData = usersSnapshot.val();
          for (const userKey in usersData) {
            const user = usersData[userKey];
            if (user.Mail?.toLowerCase() === this.currentUserEmail.toLowerCase()) {
              const studentRef = ref(db, `Students/${userKey}`);
              const studentSnapshot = await get(studentRef);
              if (studentSnapshot.exists()) {
                const studentData = studentSnapshot.val();
                this.currentStudent = { id: userKey, ...studentData };
                this.checkValidation();
                return;
              }
            }
          }
        }
      }
    },
    checkValidation() {
      if (!this.currentStudent) return;
      this.missingFields = this.criteriaKeys.filter(key => !Boolean(this.currentStudent[key]));
      this.validationMessage = this.missingFields.length
        ? `Manque : ${this.missingFields.join(", ")}`
        : "Tout validé";
    },
  },
  async mounted() {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        this.currentUserEmail = user.email;
        this.findCurrentStudent();
      }
    });
    this.fetchStudentsData();
    this.fetchStagesData();
    this.fetchTakenStages();
    this.fetchVoteCounts();
  },
};
</script>
<style scoped>
/* Conteneur principal */
.main-container {
  gap: 2rem;
  display: flex;
  flex-wrap: wrap;
}

/* Carte (section de validation, tableau, résultats, etc.) */
.card {
  background-color: var(--surface-card);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  padding: 1.5rem;
  flex: 1 1 100%;
  margin-bottom: 1rem;
}

.card h3,
.card h4 {
  color: var(--text-color);
  margin-bottom: 1rem;
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}

.table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.table th,
.table td {
  padding: 0.75rem;
  text-align: center;
  border: 1px solid var(--surface-border);
}

.table th {
  background-color: var(--surface-200);
  font-weight: bold;
}

.table .hover-row:hover {
  background-color: var(--surface-hover);
}

/* Ligne d'en-tête du groupe */
.group-header {
  background-color: var(--surface-300);
  font-weight: bold;
  text-align: center;
  color: var(--text-secondary);
}

.group-header td {
  text-align: left;
}

/* Ligne vide entre les groupes */
.empty-row td {
  height: 1rem;
  background-color: transparent;
  border: none;
}

/* Indicateurs de validation (✔️ / ❌) */
.text-green-500 {
  color: green;
}

.text-red-500 {
  color: red;
}

/* Boutons */
.btn-primary {
  background-color: var(--primary-color);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 1rem;
}

.btn-primary:hover {
  background-color: var(--primary-color-hover);
}

/* Résultats du vote */
.result-section p {
  margin: 0.5rem 0;
}

/* Style pour les cases à cocher */
input[type="checkbox"] {
  width: 20px;
  height: 20px;
  cursor: pointer;
}

/* Responsiveness */
@media (max-width: 768px) {
  .main-container {
    flex-direction: column;
    gap: 1rem;
  }

  .card {
    flex: 1 1 100%;
  }
}
</style>


