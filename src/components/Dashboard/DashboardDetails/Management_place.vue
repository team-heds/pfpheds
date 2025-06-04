<!-- src/components/Social/ManagementPlace.vue -->
<template>
  <div>
    <Navbar />
    <div class="page-title">
      <h1>Gestion des Places</h1>
    </div>    <!-- Barre de recherche -->
    <div class="text-center mb-3">
      <InputText
        v-model="search"
        placeholder="Recherche par nom de place ou remarques"
        class="w-50"
        debounce="300"
      />
    </div>
    <!-- Sélecteur d'année -->
    <div class="text-center mb-3">
      <label for="annee-select" class="mr-2">Année :</label>
      <select id="annee-select" v-model="selectedYear" class="p-inputtext-sm">
        <option value="2025">2025</option>
        <option value="2026">2026</option>
      </select>
    </div>
    <div class="container scroll-table-container compact-table">
      <!-- Bouton Créer une nouvelle place -->
      <div class="text-center mb-3">
        <Button label="Créer une nouvelle place" class="p-button-primary" @click="openCreatePlaceModal" />
      </div>
      <!-- Table des places -->
      <div v-if="filteredPlaces.length > 0" class="p-datatable-responsive">
        <DataTable
          :value="filteredPlaces"
          class="p-datatable-sm custom-datatable"
          paginator
          :rows="10"
          responsiveLayout="scroll"
          :rowsPerPageOptions="[10, 20, 50, 100]"
        >
          <!-- Colonne Institution -->
          <Column header="Institution">
            <template #body="slotProps">
              <span>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</span>
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

          <!-- Colonne Spécialités -->
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
          <Column header="NEUROGER">
            <template #body="slotProps">
              <Checkbox
                v-model="slotProps.data.NEUROGER"
                @change="updatePlace(slotProps.data, 'NEUROGER', slotProps.data.NEUROGER)"
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

          <!-- Colonne Langues -->
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


          <Column header="PFP2">
            <template #body="slotProps">
              <InputText
                :value="getYearField(slotProps.data, 'PFP2')"
                @input="setYearField(slotProps.data, 'PFP2', $event.target.value)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>

          <!-- Colonnes PFP -->
          <Column header="PFP1A">
            <template #body="slotProps">
              <InputText
                :value="getYearField(slotProps.data, 'PFP1A')"
                @input="setYearField(slotProps.data, 'PFP1A', $event.target.value)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>
          <Column header="PFP1B">
            <template #body="slotProps">
              <InputText
                :value="getYearField(slotProps.data, 'PFP1B')"
                @input="setYearField(slotProps.data, 'PFP1B', $event.target.value)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>
          <Column header="PFP4">
            <template #body="slotProps">
              <InputText
                :value="getYearField(slotProps.data, 'PFP4')"
                @input="setYearField(slotProps.data, 'PFP4', $event.target.value)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>

          <Column header="PFP3">
            <template #body="slotProps">
              <InputText
                :value="getYearField(slotProps.data, 'PFP3')"
                @input="setYearField(slotProps.data, 'PFP3', $event.target.value)"
                class="p-inputtext-sm small-input"
              />
            </template>
          </Column>
          <!-- Colonne Praticien Formateur -->
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
                :filter="true"
                filterBy="label"
                filterPlaceholder="Tapez pour rechercher un praticien formateur..."
              />
            </template>
          </Column>

          <!-- Colonne Remarques -->
          <Column header="Remarques">
            <template #body="slotProps">
              <InputText
                :value="getYearField(slotProps.data, 'Remarques')"
                @input="setYearField(slotProps.data, 'Remarques', $event.target.value)"
                autoResize
                rows="2"
                cols="30"
                class="p-input-sm"
              />
            </template>
          </Column>

          <!-- Colonne pour uploader un fichier -->
          <Column header="Uploader un fichier">
            <template #body="slotProps">
              <div class="file-upload-container">
                <input
                  type="file"
                  ref="fileInput"
                  class="hidden-file-input"
                  @change="handleFileSelection($event, slotProps.data)"
                />
                <span v-if="slotProps.data.selectedFileName" class="file-name">
                  {{ slotProps.data.selectedFileName }}
                </span>
                <Button
                  label="Envoyer fichier"
                  class="p-button-sm p-button-primary"
                  :disabled="!slotProps.data.selectedFile"
                  @click="uploadFile(slotProps.data)"
                />
              </div>
            </template>
          </Column>

          <!-- Colonne pour afficher le fichier existant -->
          <Column header="Voir Fichier">
            <template #body="slotProps">
              <div v-if="slotProps.data.fileURL">
                <a :href="slotProps.data.fileURL" target="_blank">
                  📂 Ouvrir
                </a>
              </div>
              <div v-else>
                Aucun fichier
              </div>
            </template>
          </Column>

          <!-- Colonne pour supprimer la place (double confirmation) -->
          <Column header="Supprimer">
            <template #body="slotProps">
              <Button
                label="Supprimer"
                class="p-button-sm p-button-danger"
                @click="confirmDeletePlace(slotProps.data)"
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

    <!-- Insertion du composant de création -->
    <OverCreatePlace
      :visible="isCreateModalVisible"
      :institutionsOptions="institutionsOptions"
      :praticiensFormateursOptions="praticiensFormateursOptions"
      @close="isCreateModalVisible = false"
      @created="handlePlaceCreated"
    />
  </div>
</template>

<script>
import Navbar from '@/components/Utils/Navbar.vue';
import OverCreatePlace from './OverCreatePlace.vue';
import { db, auth, storage } from '../../../../firebase.js';
import { ref, onValue, remove, update } from "firebase/database";
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Checkbox from 'primevue/checkbox';
import MultiSelect from 'primevue/multiselect';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Calendar from 'primevue/calendar';
import Dropdown from 'primevue/dropdown';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";

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
    OverCreatePlace,
    Dialog,
    Calendar,
    Dropdown
  },
  data() {
    return {
      places: [],
      institutions: {},
      praticiensFormateurs: {},
      search: '',
      isCreateModalVisible: false,
      institutionsOptions: [],
      praticiensFormateursOptions: [],
      selectedYear: '2025',
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
        (place.Remarques && place.Remarques[this.selectedYear] && place.Remarques[this.selectedYear].toLowerCase().includes(searchLower))
      );
    },
    praticiensFormateursOptions() {
      // Forçage debug : s'assurer que la liste n'est jamais vide et formatée
      if (!this.$data.praticiensFormateursOptions || this.$data.praticiensFormateursOptions.length === 0) {
        // Options factices pour forcer l'affichage du champ de recherche
        return [
          { label: 'Test Praticien 1', value: 'test1' },
          { label: 'Test Praticien 2', value: 'test2' }
        ];
      }
      // Vérification format
      return this.$data.praticiensFormateursOptions.map(opt => {
        if (typeof opt.label === 'undefined' || typeof opt.value === 'undefined') {
          return { label: String(opt), value: String(opt) };
        }
        return opt;
      });
    },
  },
  methods: {
    // Calcul du nombre de places par type de PFP
    countPlacesByPFP() {
      const pfpCounts = {
        PFP2: 0,
        PFP1A: 0,
        PFP1B: 0,
        PFP4: 0,
        PFP3: 0
      };
      this.places.forEach(place => {
        pfpCounts.PFP2 += this.getPFPIncrement(place.PFP2 && place.PFP2[this.selectedYear]);
        pfpCounts.PFP1A += this.getPFPIncrement(place.PFP1A && place.PFP1A[this.selectedYear]);
        pfpCounts.PFP1B += this.getPFPIncrement(place.PFP1B && place.PFP1B[this.selectedYear]);
        pfpCounts.PFP4 += this.getPFPIncrement(place.PFP4 && place.PFP4[this.selectedYear]);
        pfpCounts.PFP3 += this.getPFPIncrement(place.PFP3 && place.PFP3[this.selectedYear]);
      });
      return pfpCounts;
    },
    getPFPIncrement(value) {
      const num = parseInt(value);
      return isNaN(num) ? 0 : num;
    },

    // Récupération des données "Places"
    async fetchPlacesData() {
      const placesRef = ref(db, 'Places');
      onValue(placesRef, async (snapshot) => {
        const placesData = snapshot.val();
        if (placesData) {
          const placePromises = Object.keys(placesData).map(async key => {
            const place = placesData[key];
            const institutionData = await this.fetchInstitutionData(place.InstitutionId || place.IDPlace);
            // Migration des champs PFP* et Remarques pour 2025/2026 si nécessaire
            const migrateField = (field) => {
              let obj = {};
              if (typeof place[field] === 'object') {
                obj = { ...place[field] };
              } else if (place[field] !== undefined && place[field] !== null && place[field] !== '') {
                obj = { '2025': place[field] };
              }
              // Charger la valeur -2026 si présente
              if (place[field + '-2026'] !== undefined && place[field + '-2026'] !== null && place[field + '-2026'] !== '') {
                obj['2026'] = place[field + '-2026'];
              } else if (!obj['2026']) {
                obj['2026'] = '';
              }
              return obj;
            };
            // Gestion spéciale pour Remarques-2026
            let remarques = migrateField('Remarques');
            if (place['Remarques-2026']) {
              remarques['2026'] = place['Remarques-2026'];
            }
            return {
              IdPlace: key,
              NomPlace: place.NomPlace || '',
              MSQ: (place.MSQ === 'true' || place.MSQ === true),
              SYSINT: (place.SYSINT === 'true' || place.SYSINT === true),
              AIGU: (place.AIGU === 'true' || place.AIGU === true),
              REHAB: (place.REHAB === 'true' || place.REHAB === true),
              AMBU: (place.AMBU === 'true' || place.AMBU === true),
              FR: (place.FR === 'true' || place.FR === true),
              DE: (place.DE === true  || place.DE === 'true'),
              NEUROGER: (place.NEUROGER === true  ||  place.NEUROGER === 'true'),
              IT: place.IT === "true",
              ENG: place.ENG === "true",
              PFP2: migrateField('PFP2'),
              PFP1A: migrateField('PFP1A'),
              PFP1B: migrateField('PFP1B'),
              PFP4: migrateField('PFP4'),
              PFP3: migrateField('PFP3'),
              InstitutionName: institutionData.Name || institutionData.NomPlace || '',
              AccordCadreDate: institutionData.AccordCadreDate || '',
              Canton: institutionData.Canton || '',
              Categorie: institutionData.Category || '',
              ConventionDate: institutionData.ConventionDate || '',
              Lieu: institutionData.Locality || '',
              Remarques: remarques,
              selectedPraticiensFormateurs: place.praticiensFormateurs || [],
              InstitutionId: place.InstitutionId || '',
              fileURL: place.fileURL || null
            };
          });
          this.places = await Promise.all(placePromises);
        }
      });
    },

    // Récupération d'une institution
    async fetchInstitutionData(institutionId) {
      if (!institutionId) return {};
      const institutionRef = ref(db, `Institutions/${institutionId}`);
      return new Promise((resolve) => {
        onValue(institutionRef, (snapshot) => {
          resolve(snapshot.val() || {});
        });
      });
    },

    // Récupération des données "PraticienFormateurs"
    async fetchPraticiensFormateursData() {
      const praticiensRef = ref(db, 'PraticienFormateurs');
      onValue(praticiensRef, (snapshot) => {
        const praticiensData = snapshot.val() || {};
        this.praticiensFormateurs = Object.keys(praticiensData).reduce((acc, key) => {
          acc[key] = `${praticiensData[key].Prenom} ${praticiensData[key].Nom}`;
          return acc;
        }, {});
        this.praticiensFormateursOptions = Object.keys(this.praticiensFormateurs).map(id => ({
          label: this.praticiensFormateurs[id],
          value: id
        }));
      });
    },

    // Récupération de la liste des institutions
    async fetchInstitutionsData() {
      const institutionsRef = ref(db, 'Institutions');
      onValue(institutionsRef, (snapshot) => {
        const institutionsData = snapshot.val() || {};
        this.institutions = institutionsData;
        this.institutionsOptions = Object.keys(institutionsData).map(id => ({
          label: institutionsData[id].Name,
          value: id
        }));
      });
    },

    // Mise à jour d'un champ
    async updatePlace(place, field, value, year) {
      const placeRef = ref(db, `Places/${place.IdPlace}`);
      let updateValue = value;
      if (typeof value === "boolean") {
        updateValue = value ? "true" : "false";
      }
      // Gestion spéciale pour les champs PFP* et Remarques selon l'année
      if (["PFP1A", "PFP1B", "PFP2", "PFP3", "PFP4", "Remarques"].includes(field)) {
        if ((year || this.selectedYear) === "2026") {
          // Pour 2026 : sauvegarder dans PFP1A-2026, etc.
          const dbField = field + "-2026";
          await update(placeRef, { [dbField]: updateValue });
        } else {
          // Pour 2025 : sauvegarder dans PFP1A, etc.
          await update(placeRef, { [field]: updateValue });
        }
      } else {
        place[field] = value;
        await update(placeRef, { [field]: updateValue });
      }
    },

    // Mise à jour des praticiens formateurs
    async updatePraticiensFormateurs(place, praticiensIds) {
      const placeRef = ref(db, `Places/${place.IdPlace}`);
      await update(placeRef, { praticiensFormateurs: praticiensIds });
    },

    // Sélection d'un fichier
    handleFileSelection(event, place) {
      const file = event.target.files[0];
      if (file) {
        place.selectedFile = file;
        place.selectedFileName = file.name;
      }
    },

    // Upload du fichier
    async uploadFile(place) {
      try {
        const user = auth.currentUser;
        if (!user) {
          alert("Vous devez être connecté pour uploader un fichier.");
          return;
        }
        const fileRef = storageRef(storage, `Places/${place.selectedFile.name}`);
        const metadata = {
          customMetadata: { ownerId: user.uid }
        };
        await uploadBytes(fileRef, place.selectedFile, metadata);
        const url = await getDownloadURL(fileRef);
        const placeDbRef = ref(db, `Places/${place.IdPlace}`);
        await update(placeDbRef, { fileURL: url });
        place.fileURL = url;
        place.selectedFile = null;
        place.selectedFileName = '';
        alert("Fichier envoyé avec succès !");
      } catch (error) {
        console.error("Erreur lors de l'upload du fichier :", error);
      }
    },

    // Ouvrir la modale de création
    openCreatePlaceModal() {
      this.isCreateModalVisible = true;
    },

    // Une fois la place créée (event "created" du composant enfant)
    handlePlaceCreated() {
      this.isCreateModalVisible = false;
    },

    // Supprimer une place (double confirmation)
    async confirmDeletePlace(place) {
      // 1ère confirmation
      const firstConfirm = window.confirm(
        `Êtes-vous sûr de vouloir supprimer la place "${place.NomPlace}" ?`
      );
      if (!firstConfirm) {
        return;
      }
      // 2ème confirmation
      const secondConfirm = window.confirm(
        `Voulez-vous vraiment SUPPRIMER DÉFINITIVEMENT la place "${place.NomPlace}" ?`
      );
      if (!secondConfirm) {
        return;
      }
      try {
        const placeToRemoveRef = ref(db, `Places/${place.IdPlace}`);
        await remove(placeToRemoveRef);
        alert("La place a bien été supprimée !");
      } catch (error) {
        console.error("Erreur lors de la suppression de la place :", error);
        alert("Une erreur est survenue lors de la suppression de la place.");
      }
    },
    getYearField(place, field) {
      return place[field] && place[field][this.selectedYear] ? place[field][this.selectedYear] : '';
    },
    setYearField(place, field, value) {
      if (!place[field]) place[field] = {};
      place[field][this.selectedYear] = value;
      this.updatePlace(place, field, value, this.selectedYear);
    },
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

/* Pour forcer l'input "small-input" à prendre toute la largeur */
.small-input {
  width: 100%;
}

/* Conteneur recap */
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

/* DataTable responsive */
.p-datatable-responsive .p-datatable-wrapper {
  overflow-x: auto; /* Conserve le scroll horizontal si colonnes trop nombreuses */
}

/* Personnalise l'aspect du header et du body */
.custom-datatable .p-datatable-thead > tr > th {
  background-color: var(--surface-card);
  color: var(--text-color);
}

.custom-datatable .p-datatable-tbody > tr > td {
  background-color: var(--surface-card);
  color: var(--text-color);
}

/* Taille de police par défaut plus petite */
.p-inputtext-sm {
  font-size: 0.875rem;
}

.p-inputtextarea-sm {
  font-size: 0.875rem;
}

/* Marges pour les boutons d'alerte */
.p-button-warning {
  margin-right: 0.5rem;
}
.p-button-danger {
  margin-left: 0.5rem;
}


/* Media queries pour adapter la table, le texte, etc. */

@media (max-width: 992px) {
  /* On réduit un peu la police du tableau */
  .custom-datatable .p-datatable-thead > tr > th,
  .custom-datatable .p-datatable-tbody > tr > td {
    font-size: 0.82rem;
    padding: 0.4rem;
  }

  /* On ajuste les inputs */
  .p-inputtext-sm,
  .p-inputtextarea-sm,
  .small-input {
    font-size: 0.8rem;
  }
}

@media (max-width: 768px) {
  /* La table prend toute la largeur possible */
  .p-datatable-responsive {
    width: 100%;
  }
  .w-50 {
    width: 100% !important;
  }
  .small-input {
    max-width: 100%;
  }

  /* On réduit la taille de titre, etc. */
  .page-title h1 {
    font-size: 1.3rem;
  }
}

@media (max-width: 576px) {
  /* Police encore plus petite pour les colonnes */
  .custom-datatable .p-datatable-thead > tr > th,
  .custom-datatable .p-datatable-tbody > tr > td {
    font-size: 0.75rem;
    padding: 0.3rem;
  }

  /* Titre */
  .page-title h1 {
    font-size: 1.1rem;
  }
}

/* Forcer la table à ne pas déborder */
.custom-datatable .p-datatable {
  table-layout: fixed;  /* distribution fixe de l’espace */
  width: 100%;          /* occupe 100% de la place */
}

/* Permettre au texte de se couper si trop long */
/* Sinon, par défaut, le texte pourrait faire déborder la colonne */
.custom-datatable .p-datatable-thead > tr > th,
.custom-datatable .p-datatable-tbody > tr > td {
  white-space: normal;           /* le texte peut aller à la ligne */
  overflow-wrap: break-word;     /* coupe le mot si trop long */
  word-wrap: break-word;         /* compatibilité */
}

/* Optionnel : pour s'assurer qu'aucune colonne ne “force” un dépassement,
   on peut aussi réduire la taille de police, etc. en media queries
   comme vous le faisiez déjà. */

.admin-scrollable {
  overflow-y: auto;
  height: 100vh;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.admin-scrollable::-webkit-scrollbar {
  display: none;
}

.scroll-table-container {
  padding: 12px 6px 32px 6px;
  height: calc(100vh - 120px);
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scroll-table-container::-webkit-scrollbar {
  display: none;
}
.compact-table .p-datatable {
  font-size: 0.95em;
}
.compact-table .p-datatable th,
.compact-table .p-datatable td {
  padding: 0.32em 0.5em;
}
@media (max-width: 900px) {
  .scroll-table-container {
    padding: 4px 2px 20px 2px;
    height: calc(100vh - 80px);
  }
  .compact-table .p-datatable {
    font-size: 0.85em;
  }
  .compact-table .p-datatable th,
  .compact-table .p-datatable td {
    padding: 0.18em 0.2em;
  }
}
</style>
