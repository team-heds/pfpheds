<template>
  <div>
    <Navbar />
    <div class="page-title">
      <h1>Votation</h1>
    </div>
    <div class="container">
      <!-- Affichage du profil étudiant -->
      <div class="profile-info" v-if="userProfile && Object.keys(userProfile).length">
        <h2>Profil étudiant</h2>
        <ul>
          <li>Classe: {{ userProfile.Class || userProfile.Classe || 'Non spécifié' }}</li>
          <li>AIGU: {{ aggregatedPFP.AIGU ? 'true' : 'false' }}</li>
          <li>AMBU: {{ aggregatedPFP.AMBU ? 'true' : 'false' }}</li>
          <li>DE: {{ aggregatedPFP.DE ? 'true' : 'false' }}</li>
          <li>FR: {{ aggregatedPFP.FR ? 'true' : 'false' }}</li>
          <li>MSQ: {{ aggregatedPFP.MSQ ? 'true' : 'false' }}</li>
          <li>NEUROGER: {{ aggregatedPFP.NEUROGER ? 'true' : 'false' }}</li>
          <li>REHAB: {{ aggregatedPFP.REHAB ? 'true' : 'false' }}</li>
          <li>SYSINT: {{ aggregatedPFP.SYSINT ? 'true' : 'false' }}</li>
        </ul>
      </div>

      <!-- Récapitulatif -->
      <ul>
        <li>Nombre de places disponibles pour PFP4 BA22 : {{ totalSelectedOut }}</li>
      </ul>

      <!-- Tableau des places disponibles -->
      <DataTable :value="expandedPFP4" class="p-datatable-sm custom-datatable" responsiveLayout="scroll">
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
        <Column header="Choix">
          <template #body="slotProps">
            <Checkbox
              v-model="slotProps.data[`selectedActiveBA22PFP4-${slotProps.data.seatIndex}`]"
              @change="updateSelection(slotProps.data, slotProps.data.seatIndex, slotProps.data[`selectedActiveBA22PFP4-${slotProps.data.seatIndex}`])"
            />
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Utils/Navbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Checkbox from 'primevue/checkbox';
import { ref, onValue, update } from "firebase/database";
import { db } from '@/firebase';
import { getAuth } from "firebase/auth";

export default {
  name: 'Votation',
  components: {
    Navbar,
    DataTable,
    Column,
    Checkbox
  },
  data() {
    return {
      places: [],
      userProfile: {} // Données du profil étudiant récupérées depuis /students
    };
  },
  computed: {
    // Filtre sur le critère DE uniquement
    filteredPlaces() {
      // Si le profil indique DE false, ne garder que les places où DE est également false
      if (this.aggregatedPFP.DE === false) {
        return this.places.filter(place => place.DE === false);
      }
      // Sinon, afficher toutes les places
      return this.places;
    },
    // Tri alphabétique des places filtrées par Nom de la Place
    sortedPlaces() {
      return this.filteredPlaces.sort((a, b) => a.NomPlace.localeCompare(b.NomPlace));
    },
    // Génère une ligne par "place" en fonction du nombre de PFP4
    // SEULEMENT pour les sièges sans étudiant déjà sélectionné
    expandedPFP4() {
      const rows = [];
      this.sortedPlaces.forEach(place => {
        const count = parseInt(place.PFP4 || '0');
        if (!isNaN(count) && count >= 1) {
          for (let i = 1; i <= count; i++) {
            const studentKey = `selectedEtudiantBA22PFP4-${i}`;
            const alreadySelected =
              (i === 1 && place.selectedEtudiant && place.selectedEtudiant.trim() !== "") ||
              (place[studentKey] && place[studentKey].trim() !== "");
            if (!alreadySelected) {
              const dynamicKey = `selectedActiveBA22PFP4-${i}`;
              rows.push({
                ...place,
                seatIndex: i,
                [dynamicKey]: (place[dynamicKey] !== undefined ? place[dynamicKey] : false)
              });
            }
          }
        }
      });
      return rows;
    },
    // Calcule le nombre total de places sélectionnées dans le tableau généré
    totalSelectedOut() {
      return this.expandedPFP4.filter(row => row[`selectedActiveBA22PFP4-${row.seatIndex}`] === true).length;
    },
    // Agrège les valeurs de PFP_valided pour construire le profil étudiant
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
    // Récupère les données d'une institution depuis Firebase
    async fetchInstitutionData(institutionId) {
      if (!institutionId) return {};
      const institutionRef = ref(db, `Institutions/${institutionId}`);
      return new Promise((resolve) => {
        onValue(institutionRef, (snapshot) => {
          resolve(snapshot.val() || {});
        });
      });
    },
    // Récupère les places depuis Firebase en intégrant les infos d'institution et PFP4
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
              MSQ: (place.MSQ === 'true' || place.MSQ === true),
              SYSINT: (place.SYSINT === 'true' || place.SYSINT === true),
              NEUROGER: (place.NEUROGER === 'true' || place.NEUROGER === true),
              AIGU: (place.AIGU === 'true' || place.AIGU === true),
              REHAB: (place.REHAB === 'true' || place.REHAB === true),
              AMBU: (place.AMBU === 'true' || place.AMBU === true),
              FR: (place.FR === 'true' || place.FR === true),
              DE: (place.DE === 'true' || place.DE === true),
              PFP4: place.PFP4 || '0',
              InstitutionName: institutionData.Name || institutionData.NomPlace || place.InstitutionName || 'Non spécifié'
            };
          });
          this.places = await Promise.all(placePromises);
        }
      });
    },
    // Met à jour la sélection dans Firebase lors du changement de la case à cocher
    updateSelection(place, seatIndex, value) {
      const dynamicKey = `selectedActiveBA22PFP4-${seatIndex}`;
      const placeRef = ref(db, `Places/${place.IdPlace}`);
      update(placeRef, { [dynamicKey]: value })
        .catch((error) => {
          console.error("Erreur updateSelection:", error);
        });
    },
    // Récupère les données du profil étudiant depuis la table /students
    fetchUserProfile() {
      const auth = getAuth();
      auth.onAuthStateChanged(user => {
        if (user) {
          const userId = user.uid;
          const studentRef = ref(db, `Students/${userId}`);
          onValue(studentRef, (snapshot) => {
            this.userProfile = snapshot.val() || {};
          });
        }
      });
    }
  },
  mounted() {
    this.fetchPlacesData();
    this.fetchUserProfile();
  }
};
</script>

<style scoped>
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
</style>
