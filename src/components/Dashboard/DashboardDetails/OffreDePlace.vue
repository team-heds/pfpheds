<template>
    <div>
      <Navbar />
      <div class="page-title">
        <h1>Offre de Place - PFP4</h1>
      </div>
      <div class="container">
        <!-- Bouton "Tout sélectionner" pour la colonne Sélection Out -->
        <div style="text-align: right; margin-bottom: 10px;">
          <Button label="Tout sélectionner" class="p-button-secondary" @click="selectAllOut" />
        </div>
  
        <!-- DataTable affichant les places dépliées pour PFP4 -->
        <DataTable :value="expandedPFP4" class="p-datatable-sm custom-datatable" responsiveLayout="scroll">
          <!-- Colonne Institution -->
          <Column header="Institution">
            <template #body="slotProps">
              <span>{{ slotProps.data.InstitutionName || 'Non spécifié' }}</span>
            </template>
          </Column>
  
          <!-- Colonne Nom de la Place -->
          <Column header="Nom de la Place">
            <template #body="slotProps">
              <span>{{ slotProps.data.NomPlace }}</span>
            </template>
          </Column>
  
          <Column header="CategoryInstitution">
            <template #body="slotProps">
              <span>{{ slotProps.data.CategoryInstitution || 'Non spécifié' }}</span>
            </template>
          </Column>
  
          <!-- Colonnes booléennes -->
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
  
          <!-- Colonne Praticien Formateur -->
          <Column header="Praticien Formateur">
            <template #body="slotProps">
              <div v-if="hasSelectedPraticien(slotProps.data)">
                <span>{{ getSelectedPraticienName(slotProps.data) }}</span>
                <Button class="p-button-text p-button-sm" @click="openPraticienDialog(slotProps.data)">✏️</Button>
              </div>
              <div v-else>
                <div v-if="slotProps.data['selectedPraticiensBA22PFP4-' + slotProps.data.seatIndex]">
                  <span>{{ praticiensFormateurs[slotProps.data['selectedPraticiensBA22PFP4-' + slotProps.data.seatIndex]] }}</span>
                  <Button icon="✏️" class="p-button-text p-button-sm" @click="openPraticienDialog(slotProps.data)" />
                </div>
                <div v-else-if="slotProps.data.selectedPraticiensFormateurs && slotProps.data.selectedPraticiensFormateurs.length > 1">
                  <Button :label="buttonLabel(slotProps.data)" class="p-button-outlined" @click="openPraticienDialog(slotProps.data)" />
                </div>
                <div v-else-if="slotProps.data.selectedPraticiensFormateurs && slotProps.data.selectedPraticiensFormateurs.length === 1">
                  <span>{{ praticiensFormateurs[slotProps.data.selectedPraticiensFormateurs[0]] }}</span>
                </div>
                <div v-else>
                  <span>Aucun praticien</span>
                </div>
              </div>
            </template>
          </Column>
  
          <!-- Colonne Etudiant -->
          <Column header="Etudiant">
            <template #body="slotProps">
              <Dropdown v-model="slotProps.data.dyn[selectedKey(slotProps.data)]"
                :options="ba22StudentsOptions" optionLabel="fullName" optionValue="id"
                placeholder="Sélectionner un étudiant" clearable
                @change="updatePlaceStudent(slotProps.data, slotProps.data.dyn[selectedKey(slotProps.data)], slotProps.data.seatIndex)" />
            </template>
          </Column>
  
          <!-- Colonne Remarques -->
          <Column header="Remarques Place">
            <template #body="slotProps">
              <textarea v-model="slotProps.data.Remarques" @blur="updateRemark(slotProps.data)"
                style="width: 100%; height: 80px;" placeholder="Saisir une remarque..." />
            </template>
          </Column>
  
          <!-- Colonne Instance -->
          <Column header="Instance">
            <template #body="slotProps">
              <span>{{ slotProps.data.seatIndex }}</span>
            </template>
          </Column>
  
          <!-- Colonne Sélection Out -->
          <Column header="Sélection Out">
            <template #body="slotProps">
              <Checkbox v-model="slotProps.data[`selectedActiveBA22PFP4-${slotProps.data.seatIndex}`]"
                binary="true" @change="onSelectActiveChange(slotProps.data)" />
            </template>
          </Column>
        </DataTable>
  
        <!-- Overlay (Dialog) pour la sélection du Praticien Formateur -->
        <Dialog header="Sélectionner un praticien" v-model:visible="displayPraticienDialog" modal>
          <div class="praticien-list" v-if="selectedRowForPraticien">
            <ul>
              <li v-for="praticienId in selectedRowForPraticien.selectedPraticiensFormateurs" :key="praticienId" style="margin-bottom: 0.5rem;">
                <Button :label="praticiensFormateurs[praticienId]" class="p-button-text" @click="selectPraticien(praticienId)" />
              </li>
            </ul>
          </div>
        </Dialog>
  
        <!-- Récapitulatif des statistiques -->
        <div class="recap mt-4 surface-card">
          <h3>Récapitulatif</h3>
          <ul>
            <li>Nombre d'étudiants BA22 : {{ ba22Students.length }}</li>
            <li>Nombre de lésés : {{ leses.length }}</li>
            <li>Nombre de SAE : {{ saes.length }}</li>
            <li>Nombre de cas particuliers : {{ casparticuliers.length }}</li>
            <li>Nombre global de places offertes : {{ totalPlacesOffertes }}</li>
            <li>Nombre de places sélectionnées pour PFP4 BA22 : {{ totalSelectedOut }}</li>
            <li>Nombre global d'institutions valaisanne : {{ globalInstitutionsValaisanne }}</li>
            <li>Nombre d'institutions valaisanne sélectionnée : {{ selectedInstitutionsValaisanne }}</li>
            <li>Nombre global d'institutions hors canton : {{ globalInstitutionsHorsCanton }}</li>
            <li>Nombre d'institutions hors canton sélectionnée : {{ selectedInstitutionsHorsCanton }}</li>
            <li>Nombre global de cabinets privés valaisan : {{ globalCabinetsPrivesValaisan }}</li>
            <li>Nombre de cabinets privés valaisan sélectionné : {{ selectedCabinetsPrivesValaisan }}</li>
            <li>Nombre global de cabinets privés hors canton : {{ globalCabinetsPrivesHorsCanton }}</li>
            <li>Nombre de cabinets privés hors canton sélectionné : {{ selectedCabinetsPrivesHorsCanton }}</li>
          </ul>

        </div>
  
        <!-- Listes des étudiants par rôle avec, à côté, leur place attribuée si existante -->
        <div class="liste-leses mt-4 surface-card">
          <h3>Liste des lésés</h3>
          <ul>
            <li v-for="user in leses" :key="user.id">
              {{ user.Prenom }} {{ user.Nom }}
              <span v-if="getAssignedPlace(user.id)"> - {{ getAssignedPlace(user.id) }}</span>
            </li>
          </ul>
        </div>
  
        <div class="liste-leses mt-4 surface-card">
          <h3>Liste des SAE</h3>
          <ul>
            <li v-for="user in saes" :key="user.id">
              {{ user.Prenom }} {{ user.Nom }}
              <span v-if="getAssignedPlace(user.id)"> - {{ getAssignedPlace(user.id) }}</span>
            </li>
          </ul>
        </div>
  
        <div class="liste-leses mt-4 surface-card">
          <h3>Liste des cas particuliers</h3>
          <ul>
            <li v-for="user in casparticuliers" :key="user.id">
              {{ user.Prenom }} {{ user.Nom }}
              <span v-if="getAssignedPlace(user.id)"> - {{ getAssignedPlace(user.id) }}</span>
            </li>
          </ul>
        </div>

      </div>
    </div>
  </template>
  
  <script>
  import Navbar from '@/components/Utils/Navbar.vue';
  import DataTable from 'primevue/datatable';
  import Column from 'primevue/column';
  import Dropdown from 'primevue/dropdown';
  import Checkbox from 'primevue/checkbox';
  import Button from 'primevue/button';
  import Dialog from 'primevue/dialog';
  import { ref, onValue, update } from "firebase/database";
  import { db } from '../../../../firebase.js';
  
  export default {
    name: "OfferPFP4Places",
    components: {
      Navbar,
      DataTable,
      Column,
      Dropdown,
      Checkbox,
      Button,
      Dialog
    },
    data() {
      return {
        places: [],
        praticiensFormateurs: {},
        users: [],
        dynamicSelections: {},         // pour étudiants
        dynamicPraticienSelections: {},  // pour praticiens
        displayPraticienDialog: false,
        selectedRowForPraticien: null,   // ligne en cours pour la sélection
        currentSeatIndex: null           // numéro de l’itération
      };
    },
    computed: {
      // Options pour le Dropdown des étudiants BA22
      ba22Students() {
        return this.users.filter(user =>
          user.Roles && user.Roles.BA22 === true
        );
      },
      ba22StudentsOptions() {
        let options = this.ba22Students
          .map(user => ({
            fullName: `${user.Prenom} ${user.Nom}`,
            id: user.id
          }))
          .sort((a, b) => a.fullName.localeCompare(b.fullName));
        options.unshift({ fullName: "Sélectionner un étudiant", id: "" });
        return options;
      },
      // Options pour le Menu des praticiens
      praticiensFormateursOptions() {
        let options = Object.keys(this.praticiensFormateurs).map(key => ({
          fullName: this.praticiensFormateurs[key],
          id: key
        })).sort((a, b) => a.fullName.localeCompare(b.fullName));
        options.unshift({ fullName: "Sélectionner un praticien", id: "" });
        return options;
      },
      // Tri alphabétique des places par Nom de la Place
      sortedPlaces() {
        return this.places.sort((a, b) =>
          a.NomPlace.localeCompare(b.NomPlace)
        );
      },
      // Création d'une ligne par itération pour chaque place.
      // Seules les places dont PFP4 est défini et >= 1 sont incluses.
      expandedPFP4() {
        const rows = [];
        this.sortedPlaces.forEach(place => {
          let count = parseInt(place.PFP4);
          if (!isNaN(count) && count >= 1) {
            if (!this.dynamicSelections[place.IdPlace]) {
              this.dynamicSelections[place.IdPlace] = {};
            }
            if (!this.dynamicPraticienSelections[place.IdPlace]) {
              this.dynamicPraticienSelections[place.IdPlace] = {};
            }
            for (let i = 1; i <= count; i++) {
              const keyEtudiant = `selectedEtudiantBA22PFP4-${i}`;
              const keyPraticien = `selectedPraticiensBA22PFP4-${i}`;
              const dyn = { [keyEtudiant]: this.dynamicSelections[place.IdPlace][keyEtudiant] ?? (place[keyEtudiant] || '') };
              const dynPraticien = { [keyPraticien]: this.dynamicPraticienSelections[place.IdPlace][keyPraticien] ?? (place[keyPraticien] || '') };
              rows.push({
                ...place,
                seatIndex: i,
                selectedOut: place.selectedOut || false,
                [`selectedActiveBA22PFP4-${i}`]: (place[`selectedActiveBA22PFP4-${i}`] !== undefined ? place[`selectedActiveBA22PFP4-${i}`] : false),
                dyn,        // pour étudiant
                dynPraticien // pour praticien
              });
            }
          }
        });
        return rows;
      },
      totalUniquePlaces() {
        return this.places.filter(place => {
          const count = parseInt(place.PFP4);
          return !isNaN(count) && count >= 1;
        }).length;
      },
      totalSelectedOut() {
        return this.expandedPFP4.filter(row => row[`selectedActiveBA22PFP4-${row.seatIndex}`] === true).length;
      },
      totalWithStudentSelected() {
        return this.places.filter(place => {
          const count = parseInt(place.PFP4);
          let found = false;
          for (let i = 1; i <= count; i++) {
            const key = `selectedEtudiantBA22PFP4-${i}`;
            if ((this.dynamicSelections[place.IdPlace] && this.dynamicSelections[place.IdPlace][key] && this.dynamicSelections[place.IdPlace][key] !== '')
                || (place[key] && place[key] !== '')) {
              found = true;
              break;
            }
          }
          return found;
        }).length;
      },
      totalWithPraticienSelected() {
        return this.places.filter(place => {
          const count = parseInt(place.PFP4);
          let found = false;
          for (let i = 1; i <= count; i++) {
            const key = `selectedPraticiensBA22PFP4-${i}`;
            if ((this.dynamicPraticienSelections[place.IdPlace] && this.dynamicPraticienSelections[place.IdPlace][key] && this.dynamicPraticienSelections[place.IdPlace][key] !== '')
                || (place[key] && place[key] !== '')) {
              found = true;
              break;
            }
          }
          return found;
        }).length;
      },
      // Liste des lignes dont un praticien est sélectionné
      linesWithSelectedPraticien() {
        return this.expandedPFP4.filter(row => this.praticienSelected(row));
      },
      // Liste des utilisateurs par rôle
      leses() {
        return this.users.filter(user => user.Roles && user.Roles.lese === true);
      },
      saes() {
        return this.users.filter(user => user.Roles && user.Roles.sae === true);
      },
      casparticuliers() {
        return this.users.filter(user => user.Roles && user.Roles.casparticulier === true);
      },
      // Nombre global de places offertes (somme de PFP4)
      totalPlacesOffertes() {
        return this.places.reduce((total, place) => total + (parseInt(place.PFP4) || 0), 0);
      },
      // Indicateurs par institution selon la catégorie
      globalInstitutionsValaisanne() {
        const institutions = new Set();
        this.places.forEach(place => {
          if (place.CategoryInstitution === 'Institution valaisanne') {
            institutions.add(place.InstitutionName);
          }
        });
        return institutions.size;
      },
      selectedInstitutionsValaisanne() {
        const institutions = new Set();
        this.places.forEach(place => {
          if (place.CategoryInstitution === 'Institution valaisanne') {
            const count = parseInt(place.PFP4) || 0;
            let selected = false;
            for (let i = 1; i <= count; i++) {
              const dynamicKey = `selectedActiveBA22PFP4-${i}`;
              if (place[dynamicKey] === true) {
                selected = true;
                break;
              }
            }
            if (selected) {
              institutions.add(place.InstitutionName);
            }
          }
        });
        return institutions.size;
      },
      globalInstitutionsHorsCanton() {
        const institutions = new Set();
        this.places.forEach(place => {
          if (place.CategoryInstitution === 'Institution hors canton') {
            institutions.add(place.InstitutionName);
          }
        });
        return institutions.size;
      },
      selectedInstitutionsHorsCanton() {
        const institutions = new Set();
        this.places.forEach(place => {
          if (place.CategoryInstitution === 'Institution hors canton') {
            const count = parseInt(place.PFP4) || 0;
            let selected = false;
            for (let i = 1; i <= count; i++) {
              const dynamicKey = `selectedActiveBA22PFP4-${i}`;
              if (place[dynamicKey] === true) {
                selected = true;
                break;
              }
            }
            if (selected) {
              institutions.add(place.InstitutionName);
            }
          }
        });
        return institutions.size;
      },
      globalCabinetsPrivesValaisan() {
        const institutions = new Set();
        this.places.forEach(place => {
          if (place.CategoryInstitution === 'Cabinet privé valaisan') {
            institutions.add(place.InstitutionName);
          }
        });
        return institutions.size;
      },
      selectedCabinetsPrivesValaisan() {
        const institutions = new Set();
        this.places.forEach(place => {
          if (place.CategoryInstitution === 'Cabinet privé valaisan') {
            const count = parseInt(place.PFP4) || 0;
            let selected = false;
            for (let i = 1; i <= count; i++) {
              const dynamicKey = `selectedActiveBA22PFP4-${i}`;
              if (place[dynamicKey] === true) {
                selected = true;
                break;
              }
            }
            if (selected) {
              institutions.add(place.InstitutionName);
            }
          }
        });
        return institutions.size;
      },
      globalCabinetsPrivesHorsCanton() {
        const institutions = new Set();
        this.places.forEach(place => {
          if (place.CategoryInstitution === 'Cabinet privé hors canton') {
            institutions.add(place.InstitutionName);
          }
        });
        return institutions.size;
      },
      selectedCabinetsPrivesHorsCanton() {
        const institutions = new Set();
        this.places.forEach(place => {
          if (place.CategoryInstitution === 'Cabinet privé hors canton') {
            const count = parseInt(place.PFP4) || 0;
            let selected = false;
            for (let i = 1; i <= count; i++) {
              const dynamicKey = `selectedActiveBA22PFP4-${i}`;
              if (place[dynamicKey] === true) {
                selected = true;
                break;
              }
            }
            if (selected) {
              institutions.add(place.InstitutionName);
            }
          }
        });
        return institutions.size;
      }
    },
    methods: {
      // Clé dynamique pour le Dropdown étudiant
      selectedKey(row) {
        return `selectedEtudiantBA22PFP4-${row.seatIndex}`;
      },
      updateRemark(row) {
        const placeRef = ref(db, `Places/${row.IdPlace}`);
        update(placeRef, { Note: row.Remarques })
          .then(() => {
            console.log("Remarque mise à jour !");
          })
          .catch((error) => {
            console.error("Erreur lors de la mise à jour de la remarque :", error);
          });
      },
      // Clé dynamique pour le praticien
      selectedKeyPraticien(row) {
        return `selectedPraticiensBA22PFP4-${row.seatIndex}`;
      },
      // Vérifie si un praticien est déjà sélectionné pour cette ligne
      praticienSelected(row) {
        const key = this.selectedKeyPraticien(row);
        return row.dynPraticien && row.dynPraticien[key] && row.dynPraticien[key] !== '';
      },
      // Vérifie si un praticien est sélectionné pour cette ligne (vérification de deux clés possibles)
      hasSelectedPraticien(row) {
        const keyPlural = `selectedPraticiensBA22PFP4-${row.seatIndex}`;
        const keySingular = `selectedPraticienBA22PFP4-${row.seatIndex}`;
        const valuePlural = row.dynPraticien && row.dynPraticien[keyPlural] ? row.dynPraticien[keyPlural] : row[keyPlural];
        const valueSingular = row.dynPraticien && row.dynPraticien[keySingular] ? row.dynPraticien[keySingular] : row[keySingular];
        return (valuePlural && valuePlural !== '') || (valueSingular && valueSingular !== '');
      },
      // Récupère le nom du praticien sélectionné
      getSelectedPraticienName(row) {
        const keyPlural = `selectedPraticiensBA22PFP4-${row.seatIndex}`;
        const keySingular = `selectedPraticienBA22PFP4-${row.seatIndex}`;
        const value = (row.dynPraticien && (row.dynPraticien[keyPlural] || row.dynPraticien[keySingular]))
          || (row[keyPlural] || row[keySingular]) || '';
        const practitionerId = String(value).trim();
        return practitionerId && this.praticiensFormateurs[practitionerId]
          ? this.praticiensFormateurs[practitionerId]
          : '';
      },
      // Label pour le bouton d'ouverture de l'overlay
      buttonLabel(row) {
        return "Sélectionner un praticien";
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
                MSQ: (place.MSQ === 'true' || place.MSQ === true),
                SYSINT: (place.SYSINT === 'true' || place.SYSINT === true),
                NEUROGER: (place.NEUROGER === 'true' || place.NEUROGER === true),
                AIGU: (place.AIGU === 'true' || place.AIGU === true),
                REHAB: (place.REHAB === 'true' || place.REHAB === true),
                AMBU: (place.AMBU === 'true' || place.AMBU === true),
                FR: (place.FR === 'true' || place.FR === true),
                DE: (place.DE === 'true' || place.DE === true),
                PFP4: place.PFP4 || '0',
                InstitutionName: institutionData.Name || institutionData.NomPlace || place.InstitutionName || 'Non spécifié',
                CategoryInstitution: institutionData.Category || 'Non spécifié',
                selectedPraticiensFormateurs: place.praticiensFormateurs || [],
                Remarques: place.Note || '',
                selectedEtudiant: place.selectedEtudiant || '',
                selectedOut: (place.selectedOut !== undefined) ? place.selectedOut : false
              };
            });
            this.places = await Promise.all(placePromises);
          }
        });
      },
      fetchPraticiensFormateursData() {
        const praticiensRef = ref(db, 'PraticienFormateurs');
        onValue(praticiensRef, (snapshot) => {
          const data = snapshot.val() || {};
          this.praticiensFormateurs = Object.keys(data).reduce((acc, key) => {
            acc[key] = `${data[key].Prenom} ${data[key].Nom}`;
            return acc;
          }, {});
        });
      },
      fetchUsersData() {
        const usersRef = ref(db, 'Users');
        onValue(usersRef, (snapshot) => {
          const data = snapshot.val() || {};
          this.users = Object.keys(data).map(key => ({ ...data[key], id: key }));
        });
      },
      updatePlaceStudent(place, newStudentId, seatIndex) {
        if (newStudentId === undefined || newStudentId === null) {
          newStudentId = "";
        }
        const propertyName = `selectedEtudiantBA22PFP4-${seatIndex}`;
        const placeRef = ref(db, `Places/${place.IdPlace}`);
        update(placeRef, { [propertyName]: newStudentId })
          .then(() => {
            if (!this.dynamicSelections[place.IdPlace]) {
              this.dynamicSelections[place.IdPlace] = {};
            }
            this.dynamicSelections[place.IdPlace][propertyName] = newStudentId;
          })
          .catch((error) => {
            console.error("Erreur updatePlaceStudent:", error);
          });
      },
      openPraticienDialog(row) {
        this.selectedRowForPraticien = row;
        this.currentSeatIndex = row.seatIndex;
        this.displayPraticienDialog = true;
      },
      updatePraticienSelection(row, newId, seatIndex) {
        const propertyName = `selectedPraticiensBA22PFP4-${seatIndex}`;
        const placeRef = ref(db, `Places/${row.IdPlace}`);
        update(placeRef, { [propertyName]: newId })
          .then(() => {
            if (!this.dynamicPraticienSelections[row.IdPlace]) {
              this.dynamicPraticienSelections[row.IdPlace] = {};
            }
            this.dynamicPraticienSelections[row.IdPlace][propertyName] = newId;
            if (!row.dynPraticien) {
              row.dynPraticien = {};
            }
            row.dynPraticien[propertyName] = newId;
            this.displayPraticienDialog = false;
            this.selectedRowForPraticien = null;
            this.currentSeatIndex = null;
          })
          .catch((error) => {
            console.error("Erreur updatePraticienSelection:", error);
          });
      },
      selectPraticien(newId) {
        if (this.selectedRowForPraticien && this.currentSeatIndex) {
          this.updatePraticienSelection(this.selectedRowForPraticien, newId, this.currentSeatIndex);
        }
      },
      onSelectActiveChange(row) {
        const dynamicKey = `selectedActiveBA22PFP4-${row.seatIndex}`;
        const placeRef = ref(db, `Places/${row.IdPlace}`);
        update(placeRef, { [dynamicKey]: row[dynamicKey] })
          .catch((error) => {
            console.error("Erreur updatePlaceSelection:", error);
          });
      },
      selectAllOut() {
        this.places.forEach(place => {
          const count = parseInt(place.PFP4);
          if (count >= 1) {
            for (let i = 1; i <= count; i++) {
              const dynamicKey = `selectedActiveBA22PFP4-${i}`;
              // Met à jour la propriété localement
              place[dynamicKey] = true;
              const placeRef = ref(db, `Places/${place.IdPlace}`);
              update(placeRef, { [dynamicKey]: true });
            }
          }
        });
      },
      // Méthode qui retourne la (ou les) place(s) attribuée(s) à un étudiant
      getAssignedPlace(studentId) {
  const assignedRows = this.expandedPFP4.filter(row => {
    const key = this.selectedKey(row);
    return row.dyn[key] && row.dyn[key] === studentId;
  });
  if (assignedRows.length > 0) {
    // Si plusieurs affectations, on joint chaque "Institution - NomPlace" par une virgule
    return assignedRows.map(row => row.InstitutionName + ' - ' + row.NomPlace).join(', ');
  }
  return '';
}

    },
    mounted() {
      this.fetchPraticiensFormateursData();
      this.fetchPlacesData();
      this.fetchUsersData();
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
  
  .recap,
  .liste-leses {
    background-color: var(--surface-card);
    padding: 20px;
    border-radius: 8px;
    margin-top: 20px;
  }
  
  .praticien-list ul {
    list-style: none;
    padding: 0;
  }
  
  .praticien-list li {
    margin-bottom: 0.5rem;
  }
  </style>
  