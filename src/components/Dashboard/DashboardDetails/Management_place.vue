<!-- src/components/Social/ManagementPlace.vue -->
<template>
  <div>
    <Navbar />
    <div class="page-title">
      <h1>Gestion des Places</h1>
    </div>
    <div class="container">
      <!-- Bouton Créer une nouvelle place -->
      <div class="text-center mb-3">
        <Button label="Créer une nouvelle place" class="p-button-primary" @click="openCreatePlaceModal" />
      </div>

      <!-- Barre de recherche -->
      <div class="text-center mb-3">
        <InputText
          v-model="search"
          placeholder="Recherche par nom de place ou remarques"
          class="w-50"
          debounce="300"
        />
      </div>

      <!-- Table des places -->
      <div v-if="filteredPlaces.length > 0" class="p-datatable-responsive">
        <DataTable
          :value="filteredPlaces"
          class="p-datatable-sm custom-datatable"
          paginator
          :rows="10"
          responsiveLayout="scroll"
          :rowsPerPageOptions="[10, 20, 50]"
        >
          <!-- Colonne Nom de l'Institution -->
          <Column header="Institution">
            <template #body="slotProps">
              <span>{{ slotProps.data.Name || 'Non spécifié' }}</span>
            </template>
          </Column>

          <!-- Colonne Nom de la Place -->
          <Column header="Nom de la Place">
            <template #body="slotProps">
              <InputText
                v-model="slotProps.data.NomPlace"
                @change="updatePlace(slotProps.data, 'NomPlace', slotProps.data.NomPlace)"
                class="p-inputtext-sm"
              />
            </template>
          </Column>

          <!-- Colonnes Spécialités -->
          <Column header="MSQ">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.MSQ"
                @change="updatePlace(slotProps.data, 'MSQ', slotProps.data.MSQ)"
                binary="true"
              />
            </template>
          </Column>
          <Column header="SYSINT">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.SYSINT"
                @change="updatePlace(slotProps.data, 'SYSINT', slotProps.data.SYSINT)"
                binary="true"
              />
            </template>
          </Column>
          <Column header="NEURO-GER">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.NEUROGER"
                @change="updatePlace(slotProps.data, 'NEURO-GER', slotProps.data.NEUROGER)"
                binary="true"
              />
            </template>
          </Column>
          <Column header="AIGU">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.AIGU"
                @change="updatePlace(slotProps.data, 'AIGU', slotProps.data.AIGU)"
                binary="true"
              />
            </template>
          </Column>
          <Column header="REHAB">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.REHAB"
                @change="updatePlace(slotProps.data, 'REHAB', slotProps.data.REHAB)"
                binary="true"
              />
            </template>
          </Column>
          <Column header="AMBU">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.AMBU"
                @change="updatePlace(slotProps.data, 'AMBU', slotProps.data.AMBU)"
                binary="true"
              />
            </template>
          </Column>

          <!-- Colonnes Langues -->
          <Column header="FR">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.FR"
                @change="updatePlace(slotProps.data, 'FR', slotProps.data.FR)"
                binary="true"
              />
            </template>
          </Column>
          <Column header="DE">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.DE"
                @change="updatePlace(slotProps.data, 'DE', slotProps.data.DE)"
                binary="true"
              />
            </template>
          </Column>


          <!-- Colonnes PFP -->
          <Column header="PFP2">
            <template #body="slotProps">
              <InputText
                v-model="slotProps.data.PFP2"
                @change="updatePlace(slotProps.data, 'PFP2', slotProps.data.PFP2)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>
          <Column header="PFP1A">
            <template #body="slotProps">
              <InputText
                v-model="slotProps.data.PFP1A"
                @change="updatePlace(slotProps.data, 'PFP1A', slotProps.data.PFP1A)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>
          <Column header="PFP1B">
            <template #body="slotProps">
              <InputText
                v-model="slotProps.data.PFP1B"
                @change="updatePlace(slotProps.data, 'PFP1B', slotProps.data.PFP1B)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>
          <Column header="PFP4">
            <template #body="slotProps">
              <InputText
                v-model="slotProps.data.PFP4"
                @change="updatePlace(slotProps.data, 'PFP4', slotProps.data.PFP4)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>
          <Column header="PFP3">
            <template #body="slotProps">
              <InputText
                v-model="slotProps.data.PFP3"
                @change="updatePlace(slotProps.data, 'PFP3', slotProps.data.PFP3)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>

          <!-- Colonnes Informations Supplémentaires
          <Column field="AccordCadreDate" header="Accord Cadre"></Column>
          <Column field="Canton" header="Canton"></Column>
          <Column field="Categorie" header="Catégorie"></Column>
          <Column field="ConventionDate" header="Convention"></Column>
          <Column field="Lieu" header="Lieu"></Column>
          -->

          <!-- Colonne Praticien Formateur -->
          <Column header="Praticien Formateur">
            <template #body="slotProps">
              <MultiSelect
                v-model="slotProps.data.selectedPraticiensFormateurs"
                :options="praticiensFormateursOptions"
                optionLabel="label"
                optionValue="value"
                @change="updatePraticiensFormateurs(slotProps.data, slotProps.data.selectedPraticiensFormateurs)"
                placeholder="Sélectionner"
                display="chip"
                class="w-full"
              />
            </template>
          </Column>

          <!-- Colonne Remarques -->
          <Column header="Remarques">
            <template #body="slotProps">
              <InputText
                v-model="slotProps.data.Remarques"
                @change="updatePlace(slotProps.data, 'Note', slotProps.data.Remarques)"
                autoResize
                rows="2"
                cols="30"
                class="p-input-sm"
              />
            </template>
          </Column>

          <!-- Colonne Action -->
          <Column header="Action">
            <template #body="slotProps">
              <Button
                icon="pi pi-trash"
                class="p-button-rounded p-button-danger"
                @click="deletePlace(slotProps.data.IdPlace)"
              />
            </template>
          </Column>
        </DataTable>
      </div>

      <div v-else class="text-center mt-3">
        <p>Aucune place trouvée.</p>
      </div>

      <!-- Récapitulatif des places par PFP -->
      <div class="recap mt-4 surface-card">
        <h3>Récapitulatif des places par PFP :</h3>
        <ul>
          <li>PFP2 : {{ countPlacesByPFP().PFP2 }} places</li>
          <li>PFP1A : {{ countPlacesByPFP().PFP1A }} places</li>
          <li>PFP1B : {{ countPlacesByPFP().PFP1B }} places</li>
          <li>PFP4 : {{ countPlacesByPFP().PFP4 }} places</li>
          <li>PFP3 : {{ countPlacesByPFP().PFP3 }} places</li>
        </ul>
      </div>
    </div>

    <!-- Modal de création de place -->
    <Dialog header="Créer une nouvelle place" :visible="showCreatePlaceModal" modal @hide="closeCreatePlaceModal" :style="{ width: '50vw' }">
      <form @submit.prevent="createPlace">
        <div class="p-fluid p-formgrid p-grid">
          <!-- Institution -->
          <div class="p-field p-col-12">
            <label for="institutionId">Institution</label>
            <Dropdown
              v-model="newPlace.InstitutionId"
              :options="institutionOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionnez une institution"
              @change="populateInstitutionData"
              required
            />
          </div>

          <!-- Nom de la Place -->
          <div class="p-field p-col-12">
            <label for="NomPlace">Nom de la Place</label>
            <InputText v-model="newPlace.NomPlace" required />
          </div>

          <!-- Spécialités -->
          <div class="p-field p-col-12">
            <label>Spécialités :</label>
            <div class="p-formgrid p-grid">
              <div class="p-field-checkbox p-col-2">
                <Checkbox inputId="MSQ" v-model="newPlace.MSQ" binary />
                <label for="MSQ">MSQ</label>
              </div>
              <div class="p-field-checkbox p-col-2">
                <Checkbox inputId="SYSINT" v-model="newPlace.SYSINT" binary />
                <label for="SYSINT">SYSINT</label>
              </div>
              <div class="p-field-checkbox p-col-2">
                <Checkbox inputId="NEUROGER" v-model="newPlace['NEURO-GER']" binary />
                <label for="NEUROGER">NEURO-GER</label>
              </div>
              <div class="p-field-checkbox p-col-2">
                <Checkbox inputId="AIGU" v-model="newPlace.AIGU" binary />
                <label for="AIGU">AIGU</label>
              </div>
              <div class="p-field-checkbox p-col-2">
                <Checkbox inputId="REHAB" v-model="newPlace.REHAB" binary />
                <label for="REHAB">REHAB</label>
              </div>
              <div class="p-field-checkbox p-col-2">
                <Checkbox inputId="AMBU" v-model="newPlace.AMBU" binary />
                <label for="AMBU">AMBU</label>
              </div>
            </div>
          </div>

          <!-- Langues -->
          <div class="p-field p-col-12">
            <label>Langues :</label>
            <div class="p-formgrid p-grid">
              <div class="p-field-checkbox p-col-3">
                <Checkbox inputId="FR" v-model="newPlace.FR" binary />
                <label for="FR">FR</label>
              </div>
              <div class="p-field-checkbox p-col-3">
                <Checkbox inputId="DE" v-model="newPlace.DE" binary />
                <label for="DE">DE</label>
              </div>
              <div class="p-field-checkbox p-col-3">
                <Checkbox inputId="IT" v-model="newPlace.IT" binary />
                <label for="IT">IT</label>
              </div>
              <div class="p-field-checkbox p-col-3">
                <Checkbox inputId="ENG" v-model="newPlace.ENG" binary />
                <label for="ENG">ENG</label>
              </div>
            </div>
          </div>

          <!-- Champs PFP -->
          <div class="p-field p-col-6">
            <label for="PFP2">PFP2</label>
            <InputText v-model="newPlace.PFP2" />
          </div>
          <div class="p-field p-col-6">
            <label for="PFP1A">PFP1A</label>
            <InputText v-model="newPlace.PFP1A" />
          </div>
          <div class="p-field p-col-6">
            <label for="PFP1B">PFP1B</label>
            <InputText v-model="newPlace.PFP1B" />
          </div>
          <div class="p-field p-col-6">
            <label for="PFP4">PFP4</label>
            <InputText v-model="newPlace.PFP4" />
          </div>
          <div class="p-field p-col-6">
            <label for="PFP3">PFP3</label>
            <InputText v-model="newPlace.PFP3" />
          </div>

          <!-- Dates et autres champs -->
          <div class="p-field p-col-6">
            <label for="AccordCadreDate">Accord Cadre</label>
            <Calendar v-model="newPlace.AccordCadreDate" dateFormat="yy-mm-dd" showIcon />
          </div>
          <div class="p-field p-col-6">
            <label for="Canton">Canton</label>
            <InputText v-model="newPlace.Canton" readonly />
          </div>
          <div class="p-field p-col-6">
            <label for="Categorie">Catégorie</label>
            <InputText v-model="newPlace.Categorie" readonly />
          </div>
          <div class="p-field p-col-6">
            <label for="ConventionDate">Convention</label>
            <Calendar v-model="newPlace.ConventionDate" dateFormat="yy-mm-dd" showIcon readonly />
          </div>
          <div class="p-field p-col-6">
            <label for="Lieu">Lieu</label>
            <InputText v-model="newPlace.Lieu" readonly />
          </div>

          <!-- Praticien Formateur -->
          <div class="p-field p-col-12">
            <label for="PraticienFormateur">Praticien Formateur</label>
            <MultiSelect
              v-model="newPlace.selectedPraticiensFormateurs"
              :options="praticiensFormateursOptions"
              optionLabel="label"
              optionValue="value"
              placeholder="Sélectionner"
              display="chip"
              class="w-full"
            />
          </div>

          <!-- Remarques -->
          <div class="p-field p-col-12">
            <label for="Remarques">Remarques</label>
            <InputTextarea
              v-model="newPlace.Remarques"
              autoResize
              rows="3"
              cols="30"
              class="w-full"
            />
          </div>
        </div>

        <!-- Boutons -->
        <div class="p-d-flex p-jc-end p-mt-3">
          <Button label="Annuler" class="p-button-secondary p-mr-2" @click="closeCreatePlaceModal" />
          <Button label="Créer" type="submit" class="p-button-primary" />
        </div>
      </form>
    </Dialog>
  </div>
</template>

<script>
import Navbar from '@/components/Utils/Navbar.vue';
import { db } from '../../../../firebase.js';
import { ref, onValue, set, update, push } from "firebase/database";
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import MultiSelect from 'primevue/multiselect';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';

export default {
  name: "ManagementPlace",
  components: {
    Navbar,
    Button,
    InputText,
    Checkbox,
    MultiSelect,
    DataTable,
    Column,
    Dialog,
    Calendar,
    Dropdown,
  },
  data() {
    return {
      places: [],
      institutions: {}, // Stocker les données des institutions
      praticiensFormateurs: {}, // Stocker les praticiens formateurs avec les clés comme IDs
      search: '',
      showCreatePlaceModal: false,
      newPlace: {
        InstitutionId: '',
        NomPlace: '',
        MSQ: false,
        SYSINT: false,
        'NEURO-GER': false,
        AIGU: false,
        REHAB: false,
        AMBU: false,
        FR: false,
        DE: false,
        IT: false,
        ENG: false,
        PFP2: '',
        PFP1A: '',
        PFP1B: '',
        PFP4: '',
        PFP3: '',
        AccordCadreDate: null,
        Canton: '',
        Categorie: '',
        ConventionDate: null,
        Lieu: '',
        selectedPraticiensFormateurs: [],
        Remarques: ''
      },
      institutionsOptions: [], // Options pour le Dropdown des institutions
      praticiensFormateursOptions: [], // Options pour le MultiSelect des praticiens formateurs
    };
  },
  computed: {
    filteredPlaces() {
      if (!Array.isArray(this.places)) {
        return [];
      }

      const searchLower = this.search.toLowerCase();
      return this.places.filter(place =>
        place.NomPlace.toLowerCase().includes(searchLower) ||
        place.Lieu.toLowerCase().includes(searchLower) ||
        place.InstitutionName.toLowerCase().includes(searchLower) ||
        (place.Remarques && place.Remarques.toLowerCase().includes(searchLower))
      );
    }
  },
  methods: {
    countPlacesByPFP() {
      const pfpCounts = {
        PFP2: 0,
        PFP1A: 0,
        PFP1B: 0,
        PFP4: 0,
        PFP3: 0
      };

      this.places.forEach(place => {
        pfpCounts.PFP2 += this.getPFPIncrement(place.PFP2);
        pfpCounts.PFP1A += this.getPFPIncrement(place.PFP1A);
        pfpCounts.PFP1B += this.getPFPIncrement(place.PFP1B);
        pfpCounts.PFP4 += this.getPFPIncrement(place.PFP4);
        pfpCounts.PFP3 += this.getPFPIncrement(place.PFP3);
      });

      return pfpCounts;
    },

    getPFPIncrement(value) {
      const num = parseInt(value);
      return isNaN(num) ? 0 : num;
    },

    async fetchPlacesData() {
      const placesRef = ref(db, 'Places');
      onValue(placesRef, async (snapshot) => {
        const placesData = snapshot.val();
        if (placesData) {
          const placePromises = Object.keys(placesData).map(async key => {
            const place = placesData[key];
            const institutionData = await this.fetchInstitutionData(place.InstitutionId);
            return {
              IdPlace: key,
              NomPlace: place.NomPlace || '',
              MSQ: place.MSQ || false,
              SYSINT: place.SYSINT || false,
              NEUROGER: place['NEURO-GER'] || false,
              AIGU: place.AIGU || false,
              REHAB: place.REHAB || false,
              AMBU: place.AMBU || false,
              FR: place.FR || false,
              DE: place.DE || false,
              IT: place.IT || false,
              ENG: place.ENG || false,
              PFP2: place.PFP2 || '',
              PFP1A: place.PFP1A || '',
              PFP1B: place.PFP1B || '',
              PFP4: place.PFP4 || '',
              PFP3: place.PFP3 || '',
              InstitutionName: institutionData.Name || '',
              AccordCadreDate: institutionData.AccordCadreDate || '',
              Canton: institutionData.Canton || '',
              Categorie: institutionData.Category || '',
              ConventionDate: institutionData.ConventionDate || '',
              Lieu: institutionData.Locality || '',
              Remarques: place.Note || '',
              selectedPraticiensFormateurs: place.praticiensFormateurs || [],
              InstitutionId: place.InstitutionId || ''
            };
          });

          this.places = await Promise.all(placePromises);
        }
      });
    },

    async fetchPraticiensFormateursData() {
      const praticiensRef = ref(db, 'PraticienFormateurs');
      onValue(praticiensRef, (snapshot) => {
        const praticiensData = snapshot.val() || {};
        this.praticiensFormateurs = Object.keys(praticiensData).reduce((acc, key) => {
          acc[key] = `${praticiensData[key].Prenom} ${praticiensData[key].Nom}`;
          return acc;
        }, {});

        // Préparer les options pour le MultiSelect
        this.praticiensFormateursOptions = Object.keys(this.praticiensFormateurs).map(id => ({
          label: this.praticiensFormateurs[id],
          value: id
        }));
      });
    },

    async fetchInstitutionsData() {
      const institutionsRef = ref(db, 'Institutions');
      onValue(institutionsRef, (snapshot) => {
        const institutionsData = snapshot.val() || {};
        this.institutions = institutionsData;

        // Préparer les options pour le Dropdown
        this.institutionsOptions = Object.keys(institutionsData).map(id => ({
          label: institutionsData[id].Name,
          value: id
        }));
      });
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

    async updatePlace(place, field, value) {
      const placeRef = ref(db, `Places/${place.IdPlace}`);
      if (field === 'Note') {
        await update(placeRef, { [field]: value });
      } else if (field === 'NEURO-GER') {
        await update(placeRef, { 'NEURO-GER': value });
      } else {
        await update(placeRef, { [field]: value });
      }
    },

    async updatePraticiensFormateurs(place, praticiensIds) {
      const placeRef = ref(db, `Places/${place.IdPlace}`);
      await update(placeRef, { praticiensFormateurs: praticiensIds });
    },

    openCreatePlaceModal() {
      this.showCreatePlaceModal = true;
    },

    closeCreatePlaceModal() {
      this.showCreatePlaceModal = false;
      // Réinitialiser les données de newPlace
      this.newPlace = {
        InstitutionId: '',
        NomPlace: '',
        MSQ: false,
        SYSINT: false,
        'NEURO-GER': false,
        AIGU: false,
        REHAB: false,
        AMBU: false,
        FR: false,
        DE: false,
        IT: false,
        ENG: false,
        PFP2: '',
        PFP1A: '',
        PFP1B: '',
        PFP4: '',
        PFP3: '',
        AccordCadreDate: null,
        Canton: '',
        Categorie: '',
        ConventionDate: null,
        Lieu: '',
        selectedPraticiensFormateurs: [],
        Remarques: ''
      };
    },

    async populateInstitutionData() {
      const institutionData = await this.fetchInstitutionData(this.newPlace.InstitutionId);
      if (institutionData) {
        this.newPlace.AccordCadreDate = institutionData.AccordCadreDate || '';
        this.newPlace.Canton = institutionData.Canton || '';
        this.newPlace.Categorie = institutionData.Category || '';
        this.newPlace.ConventionDate = institutionData.ConventionDate || '';
        this.newPlace.Lieu = institutionData.Locality || '';
        // Autres champs si nécessaire
      }
    },

    async createPlace() {
      try {
        const newPlaceRef = push(ref(db, 'Places'));
        const placeData = {
          InstitutionId: this.newPlace.InstitutionId,
          NomPlace: this.newPlace.NomPlace,
          MSQ: this.newPlace.MSQ,
          SYSINT: this.newPlace.SYSINT,
          'NEURO-GER': this.newPlace['NEURO-GER'],
          AIGU: this.newPlace.AIGU,
          REHAB: this.newPlace.REHAB,
          AMBU: this.newPlace.AMBU,
          FR: this.newPlace.FR,
          DE: this.newPlace.DE,
          IT: this.newPlace.IT,
          ENG: this.newPlace.ENG,
          PFP2: this.newPlace.PFP2,
          PFP1A: this.newPlace.PFP1A,
          PFP1B: this.newPlace.PFP1B,
          PFP4: this.newPlace.PFP4,
          PFP3: this.newPlace.PFP3,
          Note: this.newPlace.Remarques,
          praticiensFormateurs: this.newPlace.selectedPraticiensFormateurs
        };
        await set(newPlaceRef, placeData);
        this.closeCreatePlaceModal();
      } catch (error) {
        console.error('Erreur lors de la création de la place', error);
      }
    },

    editPlace(place) {
      // Logique pour éditer une place (par exemple, ouvrir une modal pour éditer les détails)
      alert(`Modifier la place: ${place.NomPlace}`);
    },

    async deletePlace(placeId) {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette place ?')) {
        try {
          const placeRef = ref(db, `Places/${placeId}`);
          await set(placeRef, null);
          this.places = this.places.filter(place => place.IdPlace !== placeId);
        } catch (error) {
          console.error('Erreur de suppression de la place', error);
        }
      }
    }
  },
  mounted() {
    this.fetchPraticiensFormateursData();
    this.fetchInstitutionsData();
    this.fetchPlacesData();
  }
};
</script>

<style scoped>
.page-title {
  margin-bottom: 20px;
  text-align: center;
}

.small-input {
  width: 100%;
}

.recap {
  background-color: var(--surface-card);
  padding: 20px;
  border-radius: 8px;
}

.recap h3 {
  margin-bottom: 15px;
}

.recap ul {
  list-style-type: none;
  padding: 0;
}

.recap li {
  margin-bottom: 5px;
}

/* Styles pour les petits inputs dans la table */
.small-input {
  max-width: 80px;
}

/* Ajustements pour les éléments PrimeVue */
.p-datatable-responsive .p-datatable-wrapper {
  overflow-x: auto;
}

.custom-datatable .p-datatable-thead > tr > th {
  background-color: var(--surface-card); /* Assure que le fond du header correspond au thème card */
  color: var(--text-color);
}

.custom-datatable .p-datatable-tbody > tr > td {
  background-color: var(--surface-card); /* Assure que le fond des cellules correspond au thème card */
  color: var(--text-color);
}

.p-inputtext-sm {
  font-size: 0.875rem;
}

.p-inputtextarea-sm {
  font-size: 0.875rem;
}

.p-button-warning {
  margin-right: 0.5rem;
}

.p-button-danger {
  margin-left: 0.5rem;
}

/* Responsivité supplémentaire pour les petits écrans */
@media (max-width: 768px) {
  .p-datatable-responsive {
    width: 100%;
  }

  .w-50 {
    width: 100% !important;
  }

  .small-input {
    max-width: 100%;
  }
}
</style>
