<template>
  <div>
    <Navbar />

    <div class="flex w-full">

      <div class="container-fluid mt-4 w-12">
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
                  <th>Votation1</th>
                  <th>Votation2</th>
                  <th>Votation3</th>
                  <th>Votation4</th>
                  <th>Votation5</th>
                  <th>VotationTotal</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="stage in filteredStages" :key="stage.IDENTIFIANT">
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
                  <!-- Colonnes supplémentaires avec des chiffres initialisés à 0 -->
                  <td>{{ voteCounts[stage.IDENTIFIANT]?.Votation1 || 0 }}</td>
                  <td>{{ voteCounts[stage.IDENTIFIANT]?.Votation2 || 0 }}</td>
                  <td>{{ voteCounts[stage.IDENTIFIANT]?.Votation3 || 0 }}</td>
                  <td>{{ voteCounts[stage.IDENTIFIANT]?.Votation4 || 0 }}</td>
                  <td>{{ voteCounts[stage.IDENTIFIANT]?.Votation5 || 0 }}</td>
                  <td>{{ voteCounts[stage.IDENTIFIANT]?.VotationTotal || 0 }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Section pour afficher le résultat du vote -->
        <div v-if="voteResult" class="mt-4 text-center">
          <h4>Choix du Vote</h4>
          <div v-for="(choice, index) in voteResult" :key="index">
            <p>Choix {{ index + 1 }} :</p>
            <p>Stage Sélectionné : {{ choice.selectedStageName }}</p>
            <p>Lieu : {{ choice.selectedStageLieu }}</p>
            <p>Domaine : {{ choice.selectedStageDomaine }}</p>
          </div>
        </div>

        <div class="mt-4 text-center">
          <button class="btn btn-primary" @click="submitVotes">Voter</button>

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


      <UserProfile class="w-5" />


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
      selectedChoices: {
        choice1: null,
        choice2: null,
        choice3: null,
        choice4: null,
        choice5: null,
      },
      voteCounts: {}, // Comptes de votes pour chaque stage
      criteriaKeys: ['FR', 'ALL', 'AIGU', 'REHAB', 'MSQ', 'SYSINT', 'NEUROGER', 'AMBU'],


      selectedChoices: {
        choice1: null,
        choice2: null,
        choice3: null,
        choice4: null,
        choice5: null,
      },
      voteCounts: {}, // Object to hold vote counts per stage

    };
  },
  computed: {
    filteredStages() {
      return this.stages.filter(stage => this.isStageVisible(stage));
    }
  },
  watch: {
    selectedPFP(newPFP) {
      console.log("selectedPFP changed:", newPFP);
      this.fetchStagesData();
      this.fetchTakenStages();
      this.fetchVoteCounts();
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

    selectedClass(newClass) {
      console.log("selectedClass changed:", newClass);

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
      // Ajoutez des conditions supplémentaires si nécessaire
      return true;
    },
    /**
     * Gère le changement de sélection des choix.
     * @param {string} stageId - L'ID du stage sélectionné.
     * @param {string} choice - Le choix (choice1, choice2, etc.).
     */
    handleChoiceChange(stageId, choice) {
      if (this.selectedChoices[choice] === stageId) {
        // Si déjà sélectionné, désélectionner
        this.selectedChoices[choice] = null;
      } else {
        // Sélectionner le nouveau stage pour ce choix
        this.selectedChoices[choice] = stageId;
      }
    },
    /**
     * Vérifie si une case à cocher doit être désactivée.
     * @param {Object} stage - Le stage en question.
     * @param {string} choice - Le choix (choice1, choice2, etc.).
     * @returns {boolean} True si la case doit être désactivée, sinon false.
     */
    isChoiceDisabled(stage, choice) {
      // Désactiver si le stage est déjà sélectionné pour un autre choix
      for (const [key, value] of Object.entries(this.selectedChoices)) {
        if (key !== choice && value === stage.IDENTIFIANT) {
          return true;
        }
      }

      // Désactiver si un autre stage est déjà sélectionné pour ce choix
      if (this.selectedChoices[choice] && this.selectedChoices[choice] !== stage.IDENTIFIANT) {
        return true;
      }

      // Désactiver si une autre case dans la même ligne est déjà sélectionnée
      const isAnotherChoiceInRowSelected = Object.keys(this.selectedChoices).some(
        key => key !== choice && this.selectedChoices[key] === stage.IDENTIFIANT
      );
      if (isAnotherChoiceInRowSelected) {
        return true;
      }

      return false;
    },
    /**
     * Soumet le vote de l'étudiant pour les places de stage sélectionnées.
     */

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

                  studentName: this.currentStudent.Nom,
                  studentFirstName: this.currentStudent.Prenom,
                  selectedStageName: stage.NomPlace,
                  selectedStageLieu: stage.Lieu,
                  selectedStageDomaine: stage.Domaine,
                  numberPlace: stage.PFP1A, // Utilisation de PFP1A

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

                 AMBU: stage.AMBU
                  }
                };

                // Enregistrer le choix dans Firebase
                await set(votationRef, votationData);

                // Marquer la place comme prise
                const stageRef = ref(db, `PFP1A-B23/${stage.IDENTIFIANT}`);
                await update(stageRef, { takenBy: id });

                // Mettre à jour les comptes de votes
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

            // Optionnel: Réinitialiser les choix après soumission
            this.resetChoices();
            // Re-fetch vote counts pour mettre à jour l'affichage

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

      }
    },
    /**
     * Réinitialise les choix sélectionnés.
     */
    resetChoices() {
      this.selectedChoices = {
        choice1: null,
        choice2: null,
        choice3: null,
        choice4: null,
        choice5: null,
      };
    },
    /**
     * Incrémente les comptes de votes pour un stage donné.
     * @param {string} stageId - L'ID du stage.
     * @param {number} choiceNumber - Le numéro du choix (1 à 5).
     */
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

            ...studentsData[key],
          })).filter(student => student.Classe === this.selectedClass);

            Classe: studentsData[key].Classe,
            PFPinfo: studentsData[key].PFPinfo || {},
            ...studentsData[key]
          })).filter(student => 
            student.Classe === this.selectedClass && 
            Boolean(student.PFPinfo[this.selectedPFP])
          );


          this.etudiants = transformedData;
          this.findCurrentStudent();
        }
      });
    },

    async fetchStagesData() {

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

          const placePromises = Object.keys(placesData).map(async key => {
            const place = placesData[key];
            // Filtrer par selectedPFP >=1
            const pfpValue = parseInt(place[this.selectedPFP], 10);
            if (isNaN(pfpValue) || pfpValue < 1) {
              return null;
            }

            const institutionId = place.InstitutionId || place.IDPlace; // Prendre en compte InstitutionId ou IDPlace
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
          // Re-fetch vote counts après avoir chargé les stages
          this.fetchVoteCounts();
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

              this.takenStages.add(key);
            }
          }
        }
      });
    },

              this.takenStages.add(key); // Ajouter l'IDENTIFIANT des stages pris
            }
          }
        }
      });
    },
    /**
     * Récupère les comptes de votes pour chaque stage.
     */

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


          for (const studentId in votations) {
            const studentVotations = votations[studentId].choices;
            if (studentVotations) {
              for (const choiceKey in studentVotations) {
                const vote = studentVotations[choiceKey];
                if (vote && vote.selectedStageName) {
                  const stageId = Object.keys(this.stages).find(key => this.stages[key].NomPlace === vote.selectedStageName);
                  const stage = this.stages.find(s => s.NomPlace === vote.selectedStageName);
                  if (stage) {
                    const identifiant = stage.IDENTIFIANT;
                    const votNum = vote.choice;
                    if (!counts[identifiant]) {
                      counts[identifiant] = {
                        Votation1: 0,
                        Votation2: 0,
                        Votation3: 0,
                        Votation4: 0,
                        Votation5: 0,
                        VotationTotal: 0,
                      };
                    }
                    const votKey = `Votation${votNum}`;
                    counts[identifiant][votKey] += 1;
                    counts[identifiant]['VotationTotal'] += 1;
                  }
                }
              }
            }
          }

          this.voteCounts = counts;
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
    checkValidation() {
      if (!this.currentStudent) return;
      this.missingFields = this.criteriaKeys.filter(key => !Boolean(this.currentStudent[key]));
      this.validationMessage = this.missingFields.length
        ? `Manque : ${this.missingFields.join(", ")}`
        : "Tout validé";
    },

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
      const votationRef = ref(db, `VotationPFP1A/${studentId}/choices`); // Chemin ajusté pour PFP1A
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
      if (
        FR == "0" &&
        ALL == "0" &&
        AMBU == "0" &&
        MSQ == "0" &&
        SYSINT == "0" &&
        NEUROGER == "0" &&
        REHAB == "0" &&
        AIGU == "0"
      ) {
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
      }
    });
    this.fetchStudentsData();
    this.fetchStagesData();
    this.fetchTakenStages();

    this.fetchVoteCounts();
  },

  }

};
</script>
<style scoped>

/* Conteneur principal */


/* Styles existants */
.table-striped tbody tr:nth-of-type(odd) {
  background-color: rgba(0, 0, 0, 0.05);

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


