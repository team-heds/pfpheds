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
<!-- Colonne Praticien Formateur -->
<Column header="Praticien Formateur">
  <template #body="slotProps">
    <!-- Si un praticien est déjà sélectionné (vérifié via hasSelectedPraticien), on affiche son nom avec un bouton d'édition -->
    <div v-if="hasSelectedPraticien(slotProps.data)">
      <span>{{ getSelectedPraticienName(slotProps.data) }}</span>
      <Button  class="p-button-text p-button-sm" @click="openPraticienDialog(slotProps.data)" >✏️</Button>
    </div>
    <!-- Sinon, on vérifie d'abord si la clé dynamique existe dans la DB -->
    <div v-else>
      <div v-if="slotProps.data['selectedPraticiensBA22PFP4-' + slotProps.data.seatIndex]">
       
        <span>{{ praticiensFormateurs[ slotProps.data['selectedPraticiensBA22PFP4-' + slotProps.data.seatIndex] ] }}</span>
        <Button icon="✏️" class="p-button-text p-button-sm" @click="openPraticienDialog(slotProps.data)" />
      </div>
      <div v-else>
        <!-- Sinon, si plusieurs praticiens sont liés -->
        <div v-if="slotProps.data.selectedPraticiensFormateurs && slotProps.data.selectedPraticiensFormateurs.length > 1">
          <Button :label="buttonLabel(slotProps.data)" class="p-button-outlined" @click="openPraticienDialog(slotProps.data)" />
        </div>
        <!-- S'il n'y a qu'un seul praticien lié -->
        <div v-else-if="slotProps.data.selectedPraticiensFormateurs && slotProps.data.selectedPraticiensFormateurs.length === 1">
          <span>{{ praticiensFormateurs[ slotProps.data.selectedPraticiensFormateurs[0] ] }}</span>
        </div>
        <!-- Aucun praticien lié -->
        <div v-else>
          <span>Aucun praticien</span>
        </div>
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
                <Column header="Remarques">
                    <template #body="slotProps">
                        <span>{{ slotProps.data.Remarques }}</span>
                    </template>
                </Column>

                <!-- Colonne Instance -->
                <Column header="Instance">
                    <template #body="slotProps">
                        <span>{{ slotProps.data.seatIndex }}</span>
                    </template>
                </Column>

                <!-- Colonne Selected PF -->
                <Column header="Selected PF">
                    <template #body="slotProps">
                        <span>{{ getSelectedPraticienName(slotProps.data) || 'Aucun praticien' }}</span>
                    </template>
                </Column>


                <!-- Colonne Sélection Out -->
                <Column header="Sélection Out">
                    <template #body="slotProps">
                        <Checkbox v-model="slotProps.data.selectedOut" binary="true"
                            @change="onSelectOutChange(slotProps.data)" />
                    </template>
                </Column>
            </DataTable>

            <!-- Overlay (Dialog) pour la sélection du Praticien Formateur -->
            <Dialog header="Sélectionner un praticien" v-model:visible="displayPraticienDialog" modal>
                <div class="praticien-list" v-if="selectedRowForPraticien">
                    <ul>
                        <li v-for="praticienId in selectedRowForPraticien.selectedPraticiensFormateurs"
                            :key="praticienId" style="margin-bottom: 0.5rem;">
                            <Button :label="praticiensFormateurs[praticienId]" class="p-button-text"
                                @click="selectPraticien(praticienId)" />
                        </li>
                    </ul>
                </div>
            </Dialog>

            <!-- Récapitulatif -->
            <div class="recap mt-4 surface-card">
                <h3>Récapitulatif</h3>
                <ul>
                    <li>Total de places uniques (PFP4 ≥ 1) : {{ totalUniquePlaces }}</li>
                    <li>Total de lignes affichées : {{ totalExpandedCount }}</li>
                    <li>Nombre d'étudiants BA22 : {{ ba22Students.length }}</li>
                    <li>Nombre de places sélectionnées (Sélection Out) : {{ totalSelectedOut }}</li>
                    <li>Nombre de places avec étudiant sélectionné : {{ totalWithStudentSelected }}</li>
                    <li>Nombre de places avec praticien sélectionné : {{ totalWithPraticienSelected }}</li>
                    <!-- Affichage détaillé des lignes dont un praticien est sélectionné -->
                    <li v-if="linesWithSelectedPraticien.length">
                        Lignes avec praticien sélectionné:
                        <ul>
                            <li v-for="row in linesWithSelectedPraticien" :key="row.IdPlace + '-' + row.seatIndex">
                                {{ row.NomPlace }} (Instance: {{ row.seatIndex }}) : {{ getSelectedPraticienName(row) }}
                            </li>
                        </ul>
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
        // Création d'une ligne par itération pour chaque place (pour étudiant et praticien)
        // Si la place ne comporte pas d'itération (PFP4 invalide ou < 1), on considère 1 itération par défaut.
        expandedPFP4() {
            const rows = [];
            this.sortedPlaces.forEach(place => {
                let count = parseInt(place.PFP4);
                if (isNaN(count) || count < 1) {
                    count = 1;
                }
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
                        dyn,        // pour étudiant
                        dynPraticien // pour praticien
                    });
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
        totalExpandedCount() {
            return this.expandedPFP4.length;
        },
        totalSelectedOut() {
            return this.places.filter(place => place.selectedOut === true).length;
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
        }
    },
    methods: {
        // Clé dynamique pour le Dropdown étudiant
        selectedKey(row) {
            return `selectedEtudiantBA22PFP4-${row.seatIndex}`;
        },
        // Clé dynamique pour le praticien
     
        // Vérifie si un praticien est déjà sélectionné pour cette ligne
        praticienSelected(row) {
            const key = this.selectedKeyPraticien(row);
            return row.dynPraticien && row.dynPraticien[key] && row.dynPraticien[key] !== '';
        },
        // Récupère le nom du praticien sélectionné pour cette ligne (s'il existe dans la DB)
        selectedKeyPraticien(row) {
            return `selectedPraticiensBA22PFP4-${row.seatIndex}`;
        },
        // Vérifie si un praticien est déjà sélectionné pour cette ligne en testant les deux clés possibles
        hasSelectedPraticien(row) {
            const keyPlural = `selectedPraticiensBA22PFP4-${row.seatIndex}`;
            const keySingular = `selectedPraticienBA22PFP4-${row.seatIndex}`;
            const valuePlural = row.dynPraticien && row.dynPraticien[keyPlural] ? row.dynPraticien[keyPlural] : row[keyPlural];
            const valueSingular = row.dynPraticien && row.dynPraticien[keySingular] ? row.dynPraticien[keySingular] : row[keySingular];
            return (valuePlural && valuePlural !== '') || (valueSingular && valueSingular !== '');
        },
        // Récupère le nom du praticien sélectionné, en vérifiant les deux clés
        getSelectedPraticienName(row) {
  const keyPlural = `selectedPraticiensBA22PFP4-${row.seatIndex}`;
  const keySingular = `selectedPraticienBA22PFP4-${row.seatIndex}`;
  // Récupération depuis row.dynPraticien ou directement dans row
  const value = (row.dynPraticien && (row.dynPraticien[keyPlural] || row.dynPraticien[keySingular])) 
                || (row[keyPlural] || row[keySingular]) || '';
  // Pour le debug, vous pouvez décommenter la ligne suivante :
  // console.log('getSelectedPraticienName', row, keyPlural, keySingular, value);
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
          ...place, // On inclut toutes les propriétés de la DB (y compris les clés dynamiques)
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
          InstitutionName: institutionData.Name || institutionData.NomPlace || '',
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
        // Mise à jour de la sélection étudiant dans Firebase pour l'itération donnée
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
        // Ouvre l'overlay (Dialog) pour la sélection du praticien
        openPraticienDialog(row) {
            this.selectedRowForPraticien = row;
            this.currentSeatIndex = row.seatIndex;
            this.displayPraticienDialog = true;
        },
        // Mise à jour de la sélection du praticien dans Firebase pour l'itération donnée
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
        // Méthode appelée lors de la sélection dans l'overlay
        selectPraticien(newId) {
            if (this.selectedRowForPraticien && this.currentSeatIndex) {
                this.updatePraticienSelection(this.selectedRowForPraticien, newId, this.currentSeatIndex);
            }
        },
        onSelectOutChange(row) {
            const placeRef = ref(db, `Places/${row.IdPlace}`);
            update(placeRef, { selectedOut: row.selectedOut });
        },
        selectAllOut() {
            this.places.forEach(place => {
                if (parseInt(place.PFP4) >= 1) {
                    place.selectedOut = true;
                    const placeRef = ref(db, `Places/${place.IdPlace}`);
                    update(placeRef, { selectedOut: true });
                }
            });
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

.recap {
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