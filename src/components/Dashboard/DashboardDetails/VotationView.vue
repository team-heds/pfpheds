<template>
  <div class="votation-scrollable">
    <Navbar />

    <!-- Titre et bouton de retour -->
    <div class="page-title p-d-flex p-jc-between">
      <h1>Votation BA23 - PFP3</h1>
    </div>

    <div class="container">
      <Button label="Retour Profil" icon="pi pi-arrow-left"
        class="p-button-outlined m-2 align-content-end justify-content-end" @click="goBackToProfile" />

      <!-- Affichage du profil étudiant -->
      <div v-if="userProfile && Object.keys(userProfile).length">
        <ValidatedCriteriaSection :userId="currentUserId" />
      </div>

      <!-- Affichage des places disponibles -->
      <div v-if="allCriteriaValidated">
        <h2>Toutes les places disponibles ( {{ availablePlaces.length }} places )</h2>
        <DataTable :value="availablePlaces" class="p-datatable-sm custom-datatable" responsiveLayout="scroll">
          <!-- Colonne Institution avec lien -->
          <Column header="Institution">
            <template #body="slotProps">

              <a target="_blank" :href="`${slotProps.data.url}`">
                <span>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</span>
              </a>
            </template>
          </Column>

          <!-- Autres colonnes d'informations -->
          <Column header="Nom de la Place">
            <template #body="slotProps">
              <span>{{ slotProps.data.NomPlace }}</span>
            </template>
          </Column>

          <Column header="Catégorie ">
            <template #body="slotProps">
              <span>{{ slotProps.data.InstitutionCategory }}</span>
            </template>
          </Column>
          <Column header="MSQ">
            <template #body="slotProps">
              <span>{{ slotProps.data.MSQ ? 'MSQ' : '-' }}</span>
            </template>
          </Column>
          <Column header="SYSINT">
            <template #body="slotProps">
              <span>{{ slotProps.data.SYSINT ? 'SYSINT' : '-' }}</span>
            </template>
          </Column>
          <Column header="NEUROGER">
            <template #body="slotProps">
              <span>{{ slotProps.data.NEUROGER ? 'NEUROGER' : '-' }}</span>
            </template>
          </Column>
          <Column header="AIGU">
            <template #body="slotProps">
              <span>{{ slotProps.data.AIGU ? 'AIGU' : '-' }}</span>
            </template>
          </Column>
          <Column header="REHAB">
            <template #body="slotProps">
              <span>{{ slotProps.data.REHAB ? 'REHAB' : '-' }}</span>
            </template>
          </Column>
          <Column header="AMBU">
            <template #body="slotProps">
              <span>{{ slotProps.data.AMBU ? 'AMBU' : '-' }}</span>
            </template>
          </Column>
          <Column header="FR">
            <template #body="slotProps">
              <span>{{ slotProps.data.FR ? 'FR' : '-' }}</span>
            </template>
          </Column>
          <Column header="DE">
            <template #body="slotProps">
              <span>{{ slotProps.data.DE ? 'DE' : '-' }}</span>
            </template>
          </Column>
          <Column header="Nouveaux Critères Validés">
            <template #body="slotProps">
              <span>{{ getNewValidatedCriteria(slotProps.data).join(', ') }}</span>
            </template>
          </Column>

          <!-- Colonnes de vote (Choix 1 à 5) -->
          <Column header="Choix 1">
            <template #body="slotProps">
              <RadioButton v-model="selectedPlaces[0]" :value="slotProps.data"
                :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 0)" />
            </template>
          </Column>
          <Column header="Choix 2">
            <template #body="slotProps">
              <RadioButton v-model="selectedPlaces[1]" :value="slotProps.data"
                :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 1)" />
            </template>
          </Column>
          <Column header="Choix 3">
            <template #body="slotProps">
              <RadioButton v-model="selectedPlaces[2]" :value="slotProps.data"
                :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 2)" />
            </template>
          </Column>
          <Column header="Choix 4">
            <template #body="slotProps">
              <RadioButton v-model="selectedPlaces[3]" :value="slotProps.data"
                :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 3)" />
            </template>
          </Column>
          <Column header="Choix 5">
            <template #body="slotProps">
              <RadioButton v-model="selectedPlaces[4]" :value="slotProps.data"
                :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 4)" />
            </template>
          </Column>

          <!-- Colonnes d'agrégation des votes -->
          <Column header="Votes Top 1">
            <template #body="slotProps">
              <span>{{ getVoteCount(slotProps.data).top1 || 0 }}</span>
            </template>
          </Column>
          <Column header="Votes Top 2">
            <template #body="slotProps">
              <span>{{ getVoteCount(slotProps.data).top2 || 0 }}</span>
            </template>
          </Column>
          <Column header="Votes Top 3">
            <template #body="slotProps">
              <span>{{ getVoteCount(slotProps.data).top3 || 0 }}</span>
            </template>
          </Column>
          <Column header="Votes Top 4">
            <template #body="slotProps">
              <span>{{ getVoteCount(slotProps.data).top4 || 0 }}</span>
            </template>
          </Column>
          <Column header="Votes Top 5">
            <template #body="slotProps">
              <span>{{ getVoteCount(slotProps.data).top5 || 0 }}</span>
            </template>
          </Column>
          <Column header="Total Votes">
            <template #body="slotProps">
              <span>{{ getVoteCount(slotProps.data).total || 0 }}</span>
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- En cas de critères non validés, affichage groupé par nombre de critères validés -->
      <div v-else>
        <div v-for="group in displayedGroups" :key="group.criteriaCount" class="criteria-count-section">
          <div v-if="group.criteriaCount > 0">
            <h2>
              Nombre de places validant {{ group.criteriaCount }} critère
              <span v-if="group.criteriaCount > 1">s</span> manquant
              <span v-if="group.criteriaCount > 1">s</span>
              ({{ group.places.length }} places)
            </h2>
            <DataTable :value="group.places" class="p-datatable-sm custom-datatable text-center"
              responsiveLayout="scroll">
              <Column header="Institution">
                <template #body="slotProps">

                  <a target="_blank" :href="`${slotProps.data.url}`">
                    <span>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</span>
                  </a>
                </template>
              </Column>
              <Column header="Nom de la Place">
                <template #body="slotProps">
                  <span>{{ slotProps.data.NomPlace }}</span>
                </template>
              </Column>

              <Column header="Catégorie ">
                <template #body="slotProps">
                  <span>{{ slotProps.data.InstitutionCategory }}</span>
                </template>
              </Column>


              <Column header="MSQ">
                <template #body="slotProps">
                  <span>{{ slotProps.data.MSQ ? 'MSQ' : '-' }}</span>
                </template>
              </Column>
              <Column header="SYSINT">
                <template #body="slotProps">
                  <span>{{ slotProps.data.SYSINT ? 'SYSINT' : '-' }}</span>
                </template>
              </Column>
              <Column header="NEUROGER">
                <template #body="slotProps">
                  <span>{{ slotProps.data.NEUROGER ? 'NEUROGER' : '-' }}</span>
                </template>
              </Column>
              <Column header="AIGU">
                <template #body="slotProps">
                  <span>{{ slotProps.data.AIGU ? 'AIGU' : '-' }}</span>
                </template>
              </Column>
              <Column header="REHAB">
                <template #body="slotProps">
                  <span>{{ slotProps.data.REHAB ? 'REHAB' : '-' }}</span>
                </template>
              </Column>
              <Column header="AMBU">
                <template #body="slotProps">
                  <span>{{ slotProps.data.AMBU ? 'AMBU' : '-' }}</span>
                </template>
              </Column>
              <Column header="FR">
                <template #body="slotProps">
                  <span>{{ slotProps.data.FR ? 'FR' : '-' }}</span>
                </template>
              </Column>
              <Column header="DE">
                <template #body="slotProps">
                  <span>{{ slotProps.data.DE ? 'DE' : '-' }}</span>
                </template>
              </Column>
              <Column header="Nouveaux Critères Validés">
                <template #body="slotProps">
                  <span>{{ getNewValidatedCriteria(slotProps.data).join(', ') }}</span>
                </template>
              </Column>
              <!-- Colonnes de vote répétées -->
              <Column header="Choix 1">
                <template #body="slotProps">
                  <RadioButton v-model="selectedPlaces[0]" :value="slotProps.data"
                    :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 0)" />
                </template>
              </Column>
              <Column header="Choix 2">
                <template #body="slotProps">
                  <RadioButton v-model="selectedPlaces[1]" :value="slotProps.data"
                    :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 1)" />
                </template>
              </Column>
              <Column header="Choix 3">
                <template #body="slotProps">
                  <RadioButton v-model="selectedPlaces[2]" :value="slotProps.data"
                    :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 2)" />
                </template>
              </Column>
              <Column header="Choix 4">
                <template #body="slotProps">
                  <RadioButton v-model="selectedPlaces[3]" :value="slotProps.data"
                    :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 3)" />
                </template>
              </Column>
              <Column header="Choix 5">
                <template #body="slotProps">
                  <RadioButton v-model="selectedPlaces[4]" :value="slotProps.data"
                    :disabled="voteAlreadyCast || isPlaceDisabled(slotProps.data, 4)" />
                </template>
              </Column>
              <!-- Colonnes d'agrégation des votes répétées -->
              <Column header="Votes Top 1">
                <template #body="slotProps">
                  <span>{{ getVoteCount(slotProps.data).top1 || 0 }}</span>
                </template>
              </Column>
              <Column header="Votes Top 2">
                <template #body="slotProps">
                  <span>{{ getVoteCount(slotProps.data).top2 || 0 }}</span>
                </template>
              </Column>
              <Column header="Votes Top 3">
                <template #body="slotProps">
                  <span>{{ getVoteCount(slotProps.data).top3 || 0 }}</span>
                </template>
              </Column>
              <Column header="Votes Top 4">
                <template #body="slotProps">
                  <span>{{ getVoteCount(slotProps.data).top4 || 0 }}</span>
                </template>
              </Column>
              <Column header="Votes Top 5">
                <template #body="slotProps">
                  <span>{{ getVoteCount(slotProps.data).top5 || 0 }}</span>
                </template>
              </Column>
              <Column header="Total Votes">
                <template #body="slotProps">
                  <span>{{ getVoteCount(slotProps.data).total || 0 }}</span>
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>

      <!-- Action de vote -->
      <div class="vote-action">
        <Button v-if="!voteAlreadyCast" @click="sendVote">Envoyer</Button>
        <div v-else>
          <p>Votre vote :</p>
          <ul>
            <li v-for="(vote, index) in votedPlaces" :key="index">
              Choix {{ index + 1 }} : {{ vote.placeName }} ({{ vote.InstitutionName }})
            </li>
          </ul>
          <Button @click="revote">Revoter</Button>
        </div>
      </div>
    </div>

    <!-- Dialogue de confirmation -->
    <Dialog v-model:visible="dialogVisible" header="Confirmation de Vote" :modal="true" :closable="false"
      class="custom-dialog">
      <p>{{ dialogMessage }}</p>
      <template #footer>
        <button class="p-button p-component" @click="closeDialog">OK</button>
      </template>
    </Dialog>
  </div>
</template>

<script>
import Navbar from '@/components/Utils/Navbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import RadioButton from 'primevue/radiobutton';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import ValidatedCriteriaSection from '@/components/UserProfile/ValidatedCriteriaSection.vue';
import CardNameProfile from '@/components/Bibliotheque/Profile/CardNameProfile.vue';
import { ref, onValue, update, set, remove } from "firebase/database";
import { db } from 'root/firebase';
import { getAuth } from "firebase/auth";

export default {
  name: 'VotationView',
  components: {
    Navbar,
    DataTable,
    Column,
    RadioButton,
    Dialog,
    Button,
    ValidatedCriteriaSection,
    CardNameProfile
  },
  data() {
    return {
      places: [],
      expandedPFP3Data: [],
      userProfile: {},
      // Tableau réactif pour 5 choix de vote
      selectedPlaces: [null, null, null, null, null],
      votedPlaces: [null, null, null, null, null],
      dialogVisible: false,
      dialogMessage: "",
      currentUserId: null,
      // Objet contenant l'agrégation des votes par place
      votesAggregation: {},
      alreadyAssigned: false, // Propriété ajoutée

    };
  },
  watch: {
    places: {
      handler() {
        this.updateExpandedPFP3Data();
      },
      immediate: true,
      deep: true
    }
  },
  computed: {
    groupedByCriteriaCount() {
      const groups = {};
      this.availablePlaces.forEach(place => {
        const count = this.getNewValidatedCriteria(place).length;
        if (groups[count]) {
          groups[count].push(place);
        } else {
          groups[count] = [place];
        }
      });
      const allGroups = Object.keys(groups)
        .map(count => ({
          criteriaCount: parseInt(count),
          places: groups[count]
        }))
        .sort((a, b) => b.criteriaCount - a.criteriaCount);
      return allGroups;
    },

    displayedGroups() {
      // Si le premier groupe contient plus de 5 places, on affiche uniquement ce groupe,
      // sinon on affiche tous les groupes.
      if (
        this.groupedByCriteriaCount.length > 0 &&
        this.groupedByCriteriaCount[0].places.length > 5
      ) {
        return [this.groupedByCriteriaCount[0]];
      } else {
        return this.groupedByCriteriaCount;
      }
    },
    // Agrégation des critères validés selon le profil utilisateur
    aggregatedPFP() {
      const fields = {
        AIGU: false,
        AMBU: false,
        DE: false,
        FR: false,
        MSQ: false,
        NEUROGER: false,
        REHAB: false,
        SYSINT: false
      };
      if (this.userProfile && this.userProfile.PFP_valided) {
        this.userProfile.PFP_valided.forEach(item => {
          fields.AIGU = fields.AIGU || item.AIGU;
          fields.AMBU = fields.AMBU || item.AMBU;
          fields.DE = fields.DE || item.DE;
          fields.FR = fields.FR || item.FR;
          fields.MSQ = fields.MSQ || item.MSQ;
          fields.NEUROGER = fields.NEUROGER || item.NEUROGER;
          fields.REHAB = fields.REHAB || item.REHAB;
          fields.SYSINT = fields.SYSINT || item.SYSINT;
        });
      }
      return fields;
    },
    // Critères manquants
    missingCriteria() {
      return Object.keys(this.aggregatedPFP).filter(key => !this.aggregatedPFP[key]);
    },
    // Vérifie que tous les critères sont validés
    allCriteriaValidated() {
      return Object.values(this.aggregatedPFP).every(value => value === true);
    },
    // Utilise la donnée pré-calculée pour les places
    availablePlaces() {
      let places = this.allCriteriaValidated
        ? this.expandedPFP3Data
        : this.expandedPFP3Data.filter(place => this.getNewValidatedCriteria(place).length > 0);
      if (this.missingCriteria.includes('DE')) {
        places = places.filter(place => place.DE === true);
      }
      return places.filter(place => place[`selectedActiveBA23PFP3-${place.seatIndex}`] === true);
    },
    // Regroupe les places par nombre de critères non validés
    groupedByCriteriaCount() {
      const groups = {};
      this.availablePlaces.forEach(place => {
        const count = this.getNewValidatedCriteria(place).length;
        if (groups[count]) {
          groups[count].push(place);
        } else {
          groups[count] = [place];
        }
      });
      const allGroups = Object.keys(groups)
        .map(count => ({
          criteriaCount: parseInt(count),
          places: groups[count]
        }))
        .sort((a, b) => b.criteriaCount - a.criteriaCount);
      return allGroups;
    },
    // Nombre de places sélectionnées
    totalSelectedOut() {
      return this.availablePlaces.filter(
        row => row[`selectedActiveBA23PFP3-${row.seatIndex}`] === true
      ).length;
    },
    // Le vote est considéré validé si le premier choix est renseigné
    voteAlreadyCast() {
      return this.votedPlaces[0] !== null;
    }
  },
  methods: {

    async getNameInstitutionById(institutionId) {
      const institutionData = await this.fetchInstitutionData(institutionId);
      return institutionData.Name || institutionId;
    },

    checkUserAssignedPlace(placesData) {
      console.log("yes1")
      for (const key in placesData) {
        const place = placesData[key];
        // Récupère le nombre de places (stocké dans PFP3, ici supposé être un nombre ou une chaîne numérique)
        console.log("yes13")

        const count = parseInt(place.PFP3 || '0');
        // Pour chaque siège, vérifie si la clé "selectedEtudiantBA23PFP3-i" correspond à l'ID utilisateur
        for (let i = 1; i <= count; i++) {
          if (place[`selectedEtudiantBA23PFP3-${i}`] === this.currentUserId) {
            console.log("yes122")

            return place; // Retourne la place trouvée
          }
        }
      }
      return null; // Aucun assignement trouvé
    },
    updateExpandedPFP3Data() {
      const rows = [];
      const sorted = this.places.slice().sort((a, b) =>
        a.NomPlace.localeCompare(b.NomPlace)
      );
      sorted.forEach(place => {
        const count = parseInt(place.PFP3 || '0');
        if (!isNaN(count) && count >= 1) {
          for (let i = 1; i <= count; i++) {
            const studentKey = `selectedEtudiantBA23PFP3-${i}`;
            const alreadySelected =
              (i === 1 && place.selectedEtudiant && place.selectedEtudiant.trim() !== "") ||
              (place[studentKey] && place[studentKey].trim() !== "");
            if (!alreadySelected) {
              const dynamicKey = `selectedActiveBA23PFP3-${i}`;
              rows.push({
                ...place,
                seatIndex: i,
                [dynamicKey]: place[dynamicKey] !== undefined ? place[dynamicKey] : false
              });
            }
          }
        }
      });
      this.expandedPFP3Data = rows;
    },
    goBackToProfile() {
      this.$router.push({ name: 'HistoriquePFP' });
    },
    checkExistingVote() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const voteRef = ref(db, `VotationBA23PFP3/${user.uid}`);
        onValue(voteRef, (snapshot) => {
          const vote = snapshot.val();
          if (vote && vote.votes) {
            this.votedPlaces = vote.votes;
            this.selectedPlaces = vote.votes.slice();
          }
        }, { onlyOnce: true });
      }
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


    fetchPlacesData() {
      const placesRef = ref(db, 'Places');
      onValue(placesRef, snapshot => {
        const placesData = snapshot.val();
        const auth = getAuth();
        auth.onAuthStateChanged(user => {
          if (user) {
            this.currentUserId = user.uid;
            // Récupération du profil étudiant
            const studentRef = ref(db, `Students/${user.uid}`);
            onValue(studentRef, (snapshot) => {
              this.userProfile = snapshot.val() || {};
              this.checkExistingVote();
            });
            (async () => {
              if (placesData) {
                const assignedPlace = this.checkUserAssignedPlace(placesData);
                if (assignedPlace) {
                  // Appel de getNameInstitutionById pour obtenir le nom de l'institution
                  const institutionName = await this.getNameInstitutionById(assignedPlace.IDPlace);
                  this.dialogMessage = "Vous avez déjà une place sélectionnée qui est " + institutionName + " - " + (assignedPlace.NomPlace || 'non spécifiée');
                  this.alreadyAssigned = true;
                  this.dialogVisible = true;
                  return; // On arrête le traitement si une place est déjà assignée
                }
              }
              if (placesData) {
                const placePromises = Object.keys(placesData).map(async key => {
                  const place = placesData[key];
                  const institutionData = await this.fetchInstitutionData(place.InstitutionId || place.IDPlace);
                  const va = place.IDPlace || place.InstitutionId;
                  const url = window.location.origin + "/institution/" + va;
                  return {
                    ...place,
                    IdPlace: key,
                    IdInstitution: place.IDPlace || place.InstitutionId,
                    NomPlace: place.NomPlace || '',
                    MSQ: place.MSQ === 'true' || place.MSQ === true,
                    SYSINT: place.SYSINT === 'true' || place.SYSINT === true,
                    NEUROGER: place.NEUROGER === 'true' || place.NEUROGER === true,
                    AIGU: place.AIGU === 'true' || place.AIGU === true,
                    REHAB: place.REHAB === 'true' || place.REHAB === true,
                    AMBU: place.AMBU === 'true' || place.AMBU === true,
                    FR: place.FR === 'true' || place.FR === true,
                    DE: place.DE === 'true' || place.DE === true,
                    PFP3: place.PFP3 || '0',
                    url: url,
                    InstitutionName: institutionData.Name ||
                      institutionData.NomPlace ||
                      place.InstitutionName ||
                      'Non spécifié',
                    InstitutionCategory: institutionData.Category || 'Non spécifié'
                  };
                });
                this.places = await Promise.all(placePromises);
              }
            })();
          }
        });
      });
    },



    updateSelection(place, seatIndex, value) {
      const dynamicKey = `selectedActiveBA23PFP3-${seatIndex}`;
      const placeRef = ref(db, `Places/${place.IdPlace}`);
      update(placeRef, { [dynamicKey]: value })
        .catch((error) => {
          console.error("Erreur updateSelection:", error);
        });
    },
    fetchUserProfile() {
      const auth = getAuth();
      auth.onAuthStateChanged(user => {
        if (user) {
          this.currentUserId = user.uid;
          console.log(this.currentUserId);
          const studentRef = ref(db, `Students/${user.uid}`);
          onValue(studentRef, (snapshot) => {
            this.userProfile = snapshot.val() || {};
            this.checkExistingVote();
          });
        }
      });
    },
    fetchVotesAggregation() {
      const votesRef = ref(db, 'VotationBA23PFP3');
      onValue(votesRef, (snapshot) => {
        const votesData = snapshot.val() || {};
        const aggregation = {};
        Object.keys(votesData).forEach(userId => {
          const vote = votesData[userId];
          if (vote && vote.votes) {
            vote.votes.forEach((voteItem, index) => {
              const placeId = voteItem.placeId;
              if (!aggregation[placeId]) {
                aggregation[placeId] = { top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 };
              }
              const key = `top${index + 1}`;
              aggregation[placeId][key] += 1;
              aggregation[placeId].total += 1;
            });
          }
        });
        this.votesAggregation = aggregation;
      });
    },
    getNewValidatedCriteria(place) {
      const criteria = [];
      Object.keys(this.aggregatedPFP).forEach(key => {
        if (!this.aggregatedPFP[key] && place[key]) {
          criteria.push(key);
        }
      });
      return criteria;
    },
    sendVote() {
      if (this.selectedPlaces.some(place => place === null)) {
        this.dialogMessage = "Veuillez sélectionner 5 places.";
        this.dialogVisible = true;
        return;
      }
      const selectedIds = this.selectedPlaces.map(place => place.IdPlace);
      if (new Set(selectedIds).size < 5) {
        this.dialogMessage = "Veuillez sélectionner 5 places différentes.";
        this.dialogVisible = true;
        return;
      }
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) {
        this.dialogMessage = "Utilisateur non connecté.";
        this.dialogVisible = true;
        return;
      }
      const voteData = {
        studentId: user.uid,
        studentName: this.userProfile.Nom || this.userProfile.name || "",
        studentPrenom: this.userProfile.Prenom || "",
        votes: this.selectedPlaces.map(place => ({
          placeId: place.IdPlace,
          placeName: place.NomPlace,
          InstitutionName: place.InstitutionName,
          criteriaValidating: this.getNewValidatedCriteria(place)
        })),
        timestamp: Date.now()
      };
      const voteRef = ref(db, `VotationBA23PFP3/${user.uid}`);
      set(voteRef, voteData)
        .then(() => {
          this.dialogMessage = "Vous avez voté pour les places : " +
            this.selectedPlaces.map((place, index) => `Choix ${index + 1}: ${place.NomPlace} (${place.InstitutionName})`).join(' | ');
          this.dialogVisible = true;
          this.votedPlaces = this.selectedPlaces.slice();
        })
        .catch((error) => {
          console.error("Erreur d'envoi de vote :", error);
          this.dialogMessage = "Erreur d'envoi de vote, veuillez réessayer.";
          this.dialogVisible = true;
        });
    },
    revote() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const voteRef = ref(db, `VotationBA23PFP3/${user.uid}`);
        remove(voteRef)
          .then(() => {
            this.votedPlaces = [null, null, null, null, null];
            this.selectedPlaces = [null, null, null, null, null];
          })
          .catch((error) => {
            console.error("Erreur de suppression du vote :", error);
            this.dialogMessage = "Erreur lors de la suppression de votre vote.";
            this.dialogVisible = true;
          });
      } else {
        this.votedPlaces = [null, null, null, null, null];
        this.selectedPlaces = [null, null, null, null, null];
      }
    },
    closeDialog() {
      this.dialogVisible = false;
      if (this.alreadyAssigned) {
        this.$router.push({ path: '/feed' });
      }
    },
    isPlaceDisabled(place, colIndex) {
      return this.selectedPlaces.some((p, index) => index !== colIndex && p && p.IdPlace === place.IdPlace);
    },
    getVoteCount(place) {
      return this.votesAggregation[place.IdPlace] || { top1: 0, top2: 0, top3: 0, top4: 0, top5: 0, total: 0 };
    }
  },
  mounted() {

    this.fetchUserProfile();

    this.fetchPlacesData();
    this.fetchVotesAggregation();
  }
};
</script>

<style scoped>
.votation-scrollable {
  overflow-y: auto;
  max-height: 100vh;
}

html, body, #app {
  height: 100%;
  min-height: 100%;
  overflow-y: auto;
}

.page-title {
  margin-bottom: 20px;
  text-align: center;
}

.container {
  padding: 20px;
}

.profile-info {
  margin-bottom: 20px;
  padding: 10px;
  background-color: var(--surface-card);
  color: var(--text-color);
  border-radius: 4px;
}

.custom-datatable .p-datatable-thead>tr>th {
  background-color: var(--surface-card);
  color: var(--text-color);
}

.custom-datatable .p-datatable-tbody>tr>td {
  background-color: var(--surface-card);
  color: var(--text-color);
  white-space: normal;
  overflow-wrap: break-word;
  word-wrap: break-word;
}

.criteria-count-section {
  margin-bottom: 40px;
}

.vote-action {
  margin-top: 20px;
  text-align: center;
}

.vote-action button {
  padding: 8px 16px;
  font-size: 16px;
}

.custom-dialog {
  width: 400px;
}
</style>
  