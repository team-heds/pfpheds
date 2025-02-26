<!-- src/components/Social/ManagementPlaceSafe.vue -->
<template>
    <div>
      <Navbar />
      <div class="page-title">
        <h1>Offre en place de stages</h1>
      </div>
      <div class="container">
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
            :rowsPerPageOptions="[10, 20, 50, 100]"
          >
            <!-- Colonne Institution (affichage uniquement) -->
            <Column header="Institution">
              <template #body="slotProps">
                <span>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</span>
              </template>
            </Column>
  
            <!-- Colonne Nom de la Place (affichage uniquement) -->
            <Column header="Nom de la Place">
              <template #body="slotProps">
                <span>{{ slotProps.data.NomPlace }}</span>
              </template>
            </Column>
  
            <!-- Colonnes booléennes (affichage en texte) -->
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
  
            <!-- Colonnes PFP (éditables avec confirmation) -->
            <Column header="PFP2">
              <template #body="slotProps">
                <InputText
                  v-model="slotProps.data.PFP2"
                  @change="confirmAndUpdatePlace(slotProps.data, 'PFP2', slotProps.data.PFP2)"
                  class="p-inputtext-sm small-input"
                />
              </template>
            </Column>
            <Column header="PFP1A">
              <template #body="slotProps">
                <InputText
                  v-model="slotProps.data.PFP1A"
                  @change="confirmAndUpdatePlace(slotProps.data, 'PFP1A', slotProps.data.PFP1A)"
                  class="p-inputtext-sm small-input"
                />
              </template>
            </Column>
            <Column header="PFP1B">
              <template #body="slotProps">
                <InputText
                  v-model="slotProps.data.PFP1B"
                  @change="confirmAndUpdatePlace(slotProps.data, 'PFP1B', slotProps.data.PFP1B)"
                  class="p-inputtext-sm small-input"
                />
              </template>
            </Column>
            <Column header="PFP4">
              <template #body="slotProps">
                <InputText
                  v-model="slotProps.data.PFP4"
                  @change="confirmAndUpdatePlace(slotProps.data, 'PFP4', slotProps.data.PFP4)"
                  class="p-inputtext-sm small-input"
                />
              </template>
            </Column>
            <Column header="PFP3">
              <template #body="slotProps">
                <InputText
                  v-model="slotProps.data.PFP3"
                  @change="confirmAndUpdatePlace(slotProps.data, 'PFP3', slotProps.data.PFP3)"
                  class="p-inputtext-sm small-input"
                />
              </template>
            </Column>
  
            <!-- Colonne Praticien Formateur (affichage uniquement avec noms) -->
            <Column header="Praticien Formateur">
              <template #body="slotProps">
                <span>
                  {{ getPraticiensNames(slotProps.data.selectedPraticiensFormateurs).join(', ') }}
                </span>
              </template>
            </Column>
  
            <!-- Colonne Remarques (affichage uniquement) -->
            <Column header="Remarques">
              <template #body="slotProps">
                <span>{{ slotProps.data.Remarques }}</span>
              </template>
            </Column>
  
  
            <!-- Colonne Voir Fichier -->
            <Column header="Voir Fichier">
              <template #body="slotProps">
                <div v-if="slotProps.data.fileURL">
                  <a :href="slotProps.data.fileURL" target="_blank">📂 Ouvrir</a>
                </div>
                <div v-else>
                  Aucun fichier
                </div>
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
    </div>
  </template>
  
  <script>
  import Navbar from '@/components/Utils/Navbar.vue';
  import { db, auth, storage } from '../../../../firebase.js';
  import { ref, onValue, update } from 'firebase/database';
  import InputText from 'primevue/inputtext';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  
  export default {
    name: 'ManagementPlacesSafe',
    components: {
      Navbar,
      InputText,
      DataTable,
      Column
    },
    data() {
      return {
        places: [],
        search: '',
        praticiensFormateurs: {} // Mapping id -> "Prenom Nom"
      };
    },
    computed: {
      filteredPlaces() {
        if (!Array.isArray(this.places)) return [];
        const searchLower = this.search.toLowerCase();
        return this.places.filter(place =>
          (place.NomPlace && place.NomPlace.toLowerCase().includes(searchLower)) ||
          (place.Lieu && place.Lieu.toLowerCase().includes(searchLower)) ||
          (place.InstitutionName && place.InstitutionName.toLowerCase().includes(searchLower)) ||
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
        onValue(placesRef, async snapshot => {
          const placesData = snapshot.val();
          if (placesData) {
            const placePromises = Object.keys(placesData).map(async key => {
              const place = placesData[key];
              const institutionData = await this.fetchInstitutionData(place.InstitutionId || place.IDPlace);
              return {
                IdPlace: key,
                NomPlace: place.NomPlace || '',
                MSQ: (place.MSQ === 'true' || place.MSQ === true),
                SYSINT: (place.SYSINT === 'true' || place.SYSINT === true),
                NEUROGER: (place.NEUROGER === 'true' || place.NEUROGER === true),
                AIGU: (place.AIGU === 'true' || place.AIGU === true),
                REHAB: (place.REHAB === 'true' || place.REHAB === true),
                AMBU: (place.AMBU === 'true' || place.AMBU === true),
                FR: (place.FR === 'true' || place.FR === true),
                DE: (place.DE === true || place.DE === 'true'),
                NEUROGER: (place.NEUROGER === true || place.NEUROGER === 'true'),
                IT: place.IT === "true",
                ENG: place.ENG === "true",
                PFP2: place.PFP2 || '',
                PFP1A: place.PFP1A || '',
                PFP1B: place.PFP1B || '',
                PFP4: place.PFP4 || '',
                PFP3: place.PFP3 || '',
                // Stockage des valeurs initiales pour restauration en cas d'annulation
                originalPFP2: place.PFP2 || '',
                originalPFP1A: place.PFP1A || '',
                originalPFP1B: place.PFP1B || '',
                originalPFP4: place.PFP4 || '',
                originalPFP3: place.PFP3 || '',
                InstitutionName: institutionData.Name || institutionData.NomPlace || '',
                Domaine: institutionData.Domaine || 'Inconnu',
                Lieu: institutionData.Locality || '',
                Remarques: place.Note || '',
                selectedPraticiensFormateurs: place.praticiensFormateurs || [],
                InstitutionId: place.InstitutionId || '',
                fileURL: place.fileURL || null
              };
            });
            this.places = await Promise.all(placePromises);
          }
        });
      },
      async fetchPraticiensFormateursData() {
        const praticiensRef = ref(db, 'PraticienFormateurs');
        onValue(praticiensRef, snapshot => {
          const praticiensData = snapshot.val() || {};
          // Création d'une mapping : id -> "Prenom Nom"
          this.praticiensFormateurs = Object.keys(praticiensData).reduce((acc, key) => {
            acc[key] = `${praticiensData[key].Prenom} ${praticiensData[key].Nom}`;
            return acc;
          }, {});
        });
      },
      async fetchInstitutionsData() {
        const institutionsRef = ref(db, 'Institutions');
        onValue(institutionsRef, snapshot => {
          const institutionsData = snapshot.val() || {};
          this.institutions = institutionsData;
          this.institutionsOptions = Object.keys(institutionsData).map(id => ({
            label: institutionsData[id].Name,
            value: id
          }));
        });
      },
      async fetchInstitutionData(institutionId) {
        if (!institutionId) return {};
        const institutionRef = ref(db, `Institutions/${institutionId}`);
        return new Promise(resolve => {
          onValue(institutionRef, snapshot => {
            resolve(snapshot.val() || {});
          });
        });
      },
      async updatePlace(place, field, value) {
        const placeRef = ref(db, `Places/${place.IdPlace}`);
        let updateValue = value;
        if (typeof value === "boolean") {
          updateValue = value ? "true" : "false";
        }
        // Mise à jour dans Firebase
        await update(placeRef, { [field]: updateValue });
      },
      async updatePraticiensFormateurs(place, praticiensIds) {
        const placeRef = ref(db, `Places/${place.IdPlace}`);
        await update(placeRef, { praticiensFormateurs: praticiensIds });
      },
      handleFileSelection(event, place) {
        const file = event.target.files[0];
        if (file) {
          place.selectedFile = file;
          place.selectedFileName = file.name;
        }
      },
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
          const placeRef = ref(db, `Places/${place.IdPlace}`);
          await update(placeRef, { fileURL: url });
          place.fileURL = url;
          place.selectedFile = null;
          place.selectedFileName = '';
          alert("Fichier envoyé avec succès !");
        } catch (error) {
          console.error("Erreur lors de l'upload du fichier :", error);
        }
      },
      openCreatePlaceModal() {
        this.isCreateModalVisible = true;
      },
      handlePlaceCreated() {
        this.isCreateModalVisible = false;
      },
      // Méthode avec confirmation pour mise à jour en se basant sur les valeurs initiales stockées
      async confirmAndUpdatePlace(place, field, newValue) {
        const originalValue = place['original' + field] || '';
        const confirmMsg = `Êtes-vous sûr de modifier la valeur du champ ${field} de "${originalValue}" à "${newValue}" pour l'institution "${place.InstitutionName}" et le domaine "${place.Domaine}" ?`;
        if (window.confirm(confirmMsg)) {
          await this.updatePlace(place, field, newValue);
          place['original' + field] = newValue;
        } else {
          place[field] = originalValue;
        }
      },
      // Méthode pour retourner les noms des praticiens à partir de leurs IDs
      getPraticiensNames(ids) {
        if (!ids || !Array.isArray(ids)) return [];
        return ids.map(id => this.praticiensFormateurs[id] || id);
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
  
  .small-input {
    max-width: 80px;
  }
  
  .p-datatable-responsive .p-datatable-wrapper {
    overflow-x: auto;
  }
  
  .custom-datatable .p-datatable-thead > tr > th {
    background-color: var(--surface-card);
    color: var(--text-color);
  }
  
  .custom-datatable .p-datatable-tbody > tr > td {
    background-color: var(--surface-card);
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
  