<template>
  <div class="scroll-page">
    <Navbar />

    <!-- Barre de titre + bouton "Retour Profil" -->
    <div class="page-title p-d-flex p-jc-between">
      <h1>Votation Lésé - BA23 PFP3</h1>
    </div>

    <div class="container">
      <Button
        label="Retour Profil"
        icon="pi pi-arrow-left"
        class="p-button-outlined m-2 align-content-end justify-content-end"
        @click="goBackToProfile"
      />
      <!-- Affichage du profil étudiant -->
      <h1>L'état de vos critères :   </h1>
      <div
        class="w-full flex-auto"
        v-if="userProfile && Object.keys(userProfile).length"
      >
        <!-- Composant dédié aux critères validés -->
        <ValidatedCriteriaSection :userId="currentUserId" />

      </div>


      <!-- Si tous les critères sont validés, affiche toutes les places disponibles -->
      <div v-if="allCriteriaValidated">
        <h2>Toutes les places disponibles</h2>
        <DataTable
          :value="availablePlaces"
          class="p-datatable-sm custom-datatable"
          responsiveLayout="scroll"
        >
          <Column header="Institution">
            <template #body="slotProps">
              <span>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</span>
            </template>
          </Column>
          <Column header="Nom de la Place">
            <template #body="slotProps">
              <span>{{ slotProps.data.NomPlace }}</span>
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
          <Column header="DEs ">
            <template #body="slotProps">
              <span>{{ slotProps.data.DE ? 'DE' : '-' }}</span>
            </template>
          </Column>
          <!-- Colonne pour indiquer si la place respecte le critère FR ou DE -->
          <Column header="Langue OK ?">
            <template #body="slotProps">
              <span :style="{ color: (slotProps.data.FR || slotProps.data.DE) ? 'green' : 'red' }">
                {{ (slotProps.data.FR || slotProps.data.DE) ? 'OK' : 'Non' }}
              </span>
            </template>
          </Column>
          <Column header="Nouveaux Critères Validés">
            <template #body="slotProps">
              <span>{{ getNewValidatedCriteria(slotProps.data).join(', ') }}</span>
            </template>
          </Column>
          <Column header="Choix">
            <template #body="slotProps">
              <RadioButton
                v-model="selectedPlace"
                :value="slotProps.data"
                :disabled="votedPlace !== null"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <!-- Sinon, affiche le groupement par nombre de critères validants -->
      <div v-else>
        <div
          v-for="group in groupedByCriteriaCount"
          :key="group.criteriaCount"
          class="criteria-count-section"
        >
          <div v-if="group.criteriaCount > 0">
            <h2>
              Nombre de places validant
              {{ group.criteriaCount }}
              critère<span v-if="group.criteriaCount >1">s</span> manquant<span v-if="group.criteriaCount > 1">s</span>({{ group.places.length }} place<span v-if="group.places.length > 1">s</span>)
            </h2>
            <DataTable
              :value="group.places"
              class="p-datatable-sm custom-datatable text-center"
              responsiveLayout="scroll"
            >
              <Column header="Institution">
                <template #body="slotProps">
                  <span>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</span>
                </template>
              </Column>
              <Column header="Nom de la Place">
                <template #body="slotProps">
                  <span>{{ slotProps.data.NomPlace }}</span>
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
              <Column header="Choix">
                <template #body="slotProps">
                  <RadioButton
                    v-model="selectedPlace"
                    :value="slotProps.data"
                    :disabled="votedPlace !== null"
                  />
                </template>
              </Column>
            </DataTable>
          </div>
        </div>
      </div>

      <!-- Section d'action de vote -->
      <div class="vote-action">
        <Button v-if="!votedPlace" @click="sendVote">Envoyer</Button>
        <div v-else>
          <p>
            Votre vote :
            {{ votedPlace.placeName }}
            ({{ votedPlace.InstitutionName }})
          </p>
          <Button @click="revote">Revoter</Button>
        </div>
      </div>
    </div>

    <!-- Overlay (Dialog) pour afficher un message stylé -->
    <Dialog
      v-model:visible="dialogVisible"
      header="Confirmation de Vote"
      :modal="true"
      :closable="false"
      class="custom-dialog"
    >
      <p>{{ dialogMessage }}</p>
      <template #footer>
        <button class="p-button p-component" @click="closeDialog">OK</button>
      </template>
    </Dialog>
  </div>
</template>

<script>
import Navbar from '@/components/common/utils/Navbar.vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import RadioButton from 'primevue/radiobutton'
import Dialog from 'primevue/dialog'
import ValidatedCriteriaSection from '@/components/user/details/ValidatedCriteriaSection.vue'
import { onValue, ref, remove, set, update } from 'firebase/database'
import { db } from 'root/firebase'
import { getAuth } from 'firebase/auth'


export default {
  name: 'VotationLese',
  components: {
    Navbar,
    DataTable,
    Column,
    RadioButton,
    Dialog,
    ValidatedCriteriaSection
  },
  data() {
    return {
      places: [],
      userProfile: {}, // Données du profil étudiant
      selectedPlace: null, // Place sélectionnée via le RadioButton
      votedPlace: null,    // Vote validé (après vote)
      dialogVisible: false,
      dialogMessage: "",
      currentUserId: null  // On stocke l'ID utilisateur ici
    };
  },
  computed: {
    // Vérifie si tous les critères de l'étudiant sont validés
    allCriteriaValidated() {
      return Object.values(this.aggregatedPFP).every(value => value === true);
    },
    // Génère toutes les lignes pour chaque place selon le nombre de sièges PFP4, en excluant celles déjà attribuées
    expandedPFP4() {
      const rows = [];
      const sorted = this.places.sort((a, b) => a.NomPlace.localeCompare(b.NomPlace));
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
      return rows;
    },
    // Retourne les places disponibles. Si tous les critères sont validés, retourne toutes les places ;
    // sinon, filtre selon les nouveaux critères.
    availablePlaces() {
      let places = this.expandedPFP4;

      if (this.allCriteriaValidated) {
        return places;
      }

      const manqueFR = !this.aggregatedPFP.FR;
      const manqueDE = !this.aggregatedPFP.DE;

      if (manqueFR && manqueDE) {
        return places.filter(place => !!place.FR || !!place.DE);
      }
      if (manqueFR) {
        return places.filter(place => !!place.FR);
      }
      if (manqueDE) {
        return places.filter(place => !!place.DE);
      }
      return places;
    },
    // Regroupe les places disponibles par nombre de nouveaux critères validés
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
    // Nombre total de places sélectionnées parmi les places disponibles
    totalSelectedOut() {
      return this.availablePlaces.filter(
        row => row[`selectedActiveBA23PFP3-${row.seatIndex}`] === true
      ).length;
    },
    // Agrège les critères déjà validés par l'étudiant depuis son profil
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
    }
  },
  methods: {
    goBackToProfile() {
      // Redirige vers la page "Profil"
      // Adapte la route selon ton router (path ou name)
      this.$router.push({ name: 'HistoriquePFP' });
      // ou this.$router.push('/profile') si tu as une route /profile
    },
    // Vérifie si un vote existe déjà pour l'étudiant et le charge
    checkExistingVote() {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const voteRef = ref(db, `VotationLeseBA23PFP3/${user.uid}`);
        onValue(voteRef, (snapshot) => {
          const vote = snapshot.val();
          if (vote) {
            this.votedPlace = vote;
            this.selectedPlace = vote;
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
      onValue(placesRef, async (snapshot) => {
        const placesData = snapshot.val();
        if (placesData) {
          const placePromises = Object.keys(placesData).map(async key => {
            const place = placesData[key];
            const institutionData = await this.fetchInstitutionData(place.InstitutionId || place.IDPlace);
            return {
              ...place,
              IdPlace: key,
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
              InstitutionName: institutionData.Name ||
                institutionData.NomPlace ||
                place.InstitutionName ||
                'Non spécifié'
            };
          });
          this.places = await Promise.all(placePromises);
        }
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
          this.currentUserId = user.uid; // IMPORTANT : on stocke l'ID ici
          const studentRef = ref(db, `Students/${user.uid}`);
          onValue(studentRef, (snapshot) => {
            this.userProfile = snapshot.val() || {};
            // Vérifie si un vote existe déjà
            this.checkExistingVote();
          });
        }
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
      if (!this.selectedPlace) {
        this.dialogMessage = "Veuillez sélectionner une place.";
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
        placeId: this.selectedPlace.IdPlace,
        placeName: this.selectedPlace.NomPlace,
        InstitutionName: this.selectedPlace.InstitutionName,
        criteriaValidating: this.getNewValidatedCriteria(this.selectedPlace),
        timestamp: Date.now()
      };
      const voteRef = ref(db, `VotationLeseBA23PFP3/${user.uid}`);
      set(voteRef, voteData)
        .then(() => {
          this.dialogMessage = "Vous avez voté pour la place : "
            + this.selectedPlace.NomPlace
            + " de l'institution : "
            + this.selectedPlace.InstitutionName;
          this.dialogVisible = true;
          this.votedPlace = this.selectedPlace;
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
        const voteRef = ref(db, `VotationLeseBA23PFP3/${user.uid}`);
        remove(voteRef)
          .then(() => {
            this.votedPlace = null;
            this.selectedPlace = null;
          })
          .catch((error) => {
            console.error("Erreur de suppression du vote :", error);
            this.dialogMessage = "Erreur lors de la suppression de votre vote.";
            this.dialogVisible = true;
          });
      } else {
        this.votedPlace = null;
        this.selectedPlace = null;
      }
    },
    closeDialog() {
      this.dialogVisible = false;
    }
  },
  mounted() {
    this.fetchPlacesData();
    this.fetchUserProfile();
  }
};
</script>

<style scoped>
.scroll-page {
  min-height: 100vh;
  height: 100vh;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scroll-page::-webkit-scrollbar {
  display: none;
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

.custom-datatable .p-datatable-thead > tr > th {
  background-color: var(--surface-card);
  color: var(--text-color);
}

.custom-datatable .p-datatable-tbody > tr > td {
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

/* Styles personnalisés pour le Dialog */
.custom-dialog {
  width: 400px;
}
</style>