<template>
  <div class="scroll-page">
    <Navbar />
    <div class="page-title">
      <h1>Offre de Place - PFP2 BA24</h1>
    </div>
    <div class="container">
      <!-- Bouton "Tout sélectionner" pour la colonne Sélection Out -->
      <div style="text-align: right; margin-bottom: 10px;">
        <Button label="Tout sélectionner" class="p-button-secondary" @click="selectAllOut" />
      </div>

      <!-- DataTable affichant les places dépliées pour PFP2 -->
      <DataTable :value="expandedPFP2" class="p-datatable-sm custom-datatable" responsiveLayout="scroll">
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
              <div v-if="slotProps.data['selectedPraticiensBA24PFP2-' + slotProps.data.seatIndex]">
                <span>{{ praticiensFormateurs[slotProps.data['selectedPraticiensBA24PFP2-' + slotProps.data.seatIndex]] }}</span>
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
                      :options="BA24StudentsOptions" optionLabel="fullName" optionValue="id"
                      placeholder="Sélectionner un étudiant" clearable
                      @change="updatePlaceStudent(slotProps.data, slotProps.data.dyn[selectedKey(slotProps.data)], slotProps.data.seatIndex)" />
          </template>
        </Column>

        <!-- Colonne Remarques -->
        <Column header="Remarques Place">
          <template #body="slotProps">
            <Textarea v-model="slotProps.data.Remarques" @blur="updateRemark(slotProps.data)"
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
            <Checkbox v-model="slotProps.data[`selectedActiveBA24PFP2-${slotProps.data.seatIndex}`]"
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

      <!-- Récapitulatif des statistiques optimisé -->
      <div class="stats-dashboard mt-4">
        <div class="stats-header">
          <h2><i class="pi pi-chart-bar"></i> Tableau de Bord PFP2 BA24</h2>
          <p class="stats-subtitle">Récapitulatif des données et répartitions</p>
        </div>

        <!-- Section Étudiants -->
        <div class="stats-section">
          <h3><i class="pi pi-users text-blue-500"></i> Étudiants</h3>
          <div class="stats-grid">
            <div class="stat-card primary">
              <div class="stat-icon">
                <i class="pi pi-user"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ BA24Students.length }}</div>
                <div class="stat-label">Total BA24</div>
              </div>
            </div>
            <div class="stat-card warning">
              <div class="stat-icon">
                <i class="pi pi-exclamation-triangle"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ leses.length }}</div>
                <div class="stat-label">Prioritaires</div>
              </div>
            </div>
            <div class="stat-card info">
              <div class="stat-icon">
                <i class="pi pi-star"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ saes.length }}</div>
                <div class="stat-label">SAE</div>
              </div>
            </div>
            <div class="stat-card secondary">
              <div class="stat-icon">
                <i class="pi pi-flag"></i>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ casparticuliers.length }}</div>
                <div class="stat-label">Cas particuliers</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Places -->
        <div class="stats-section">
          <h3><i class="pi pi-map-marker text-green-500"></i> Places de Stage</h3>
          <div class="stats-grid-2">
            <div class="stat-card-large success">
              <div class="stat-progress">
                <div class="progress-circle">
                  <span class="progress-text">{{ Math.round((totalSelectedOut / totalPlacesOffertes) * 100) }}%</span>
                </div>
              </div>
              <div class="stat-details">
                <div class="stat-main">{{ totalSelectedOut }} / {{ totalPlacesOffertes }}</div>
                <div class="stat-desc">Places sélectionnées</div>
              </div>
            </div>
            <div class="stat-summary">
              <div class="summary-item">
                <span class="summary-label">Places offertes :</span>
                <span class="summary-value">{{ totalPlacesOffertes }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Places sélectionnées :</span>
                <span class="summary-value selected">{{ totalSelectedOut }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Places disponibles :</span>
                <span class="summary-value available">{{ totalPlacesOffertes - totalSelectedOut }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Institutions -->
        <div class="stats-section">
          <h3><i class="pi pi-building text-purple-500"></i> Répartition par Type d'Institution</h3>
          <div class="institution-stats">
            
            <!-- Institutions valaisannes -->
            <div class="institution-card">
              <div class="institution-header valais">
                <i class="pi pi-home"></i>
                <span>Institutions Valaisannes</span>
              </div>
              <div class="institution-metrics">
                <div class="metric">
                  <span class="metric-number">{{ selectedInstitutionsValaisanne }}</span>
                  <span class="metric-separator">/</span>
                  <span class="metric-total">{{ globalInstitutionsValaisanne }}</span>
                </div>
                <div class="metric-bar">
                  <div class="metric-progress" 
                       :style="{ width: globalInstitutionsValaisanne > 0 ? (selectedInstitutionsValaisanne / globalInstitutionsValaisanne) * 100 + '%' : '0%' }">
                  </div>
                </div>
              </div>
            </div>



            <!-- Cabinets privés valaisans -->
            <div class="institution-card">
              <div class="institution-header private-valais">
                <i class="pi pi-briefcase"></i>
                <span>Cabinets Privés Valaisans</span>
              </div>
              <div class="institution-metrics">
                <div class="metric">
                  <span class="metric-number">{{ selectedCabinetsPrivesValaisan }}</span>
                  <span class="metric-separator">/</span>
                  <span class="metric-total">{{ globalCabinetsPrivesValaisan }}</span>
                </div>
                <div class="metric-bar">
                  <div class="metric-progress" 
                       :style="{ width: globalCabinetsPrivesValaisan > 0 ? (selectedCabinetsPrivesValaisan / globalCabinetsPrivesValaisan) * 100 + '%' : '0%' }">
                  </div>
                </div>
              </div>
            </div>

                        <!-- Institutions hors canton -->
                        <div class="institution-card">
              <div class="institution-header external">
                <i class="pi pi-globe"></i>
                <span>Institutions Hors Canton</span>
              </div>
              <div class="institution-metrics">
                <div class="metric">
                  <span class="metric-number">{{ selectedInstitutionsHorsCanton }}</span>
                  <span class="metric-separator">/</span>
                  <span class="metric-total">{{ globalInstitutionsHorsCanton }}</span>
                </div>
                <div class="metric-bar">
                  <div class="metric-progress" 
                       :style="{ width: globalInstitutionsHorsCanton > 0 ? (selectedInstitutionsHorsCanton / globalInstitutionsHorsCanton) * 100 + '%' : '0%' }">
                  </div>
                </div>
              </div>
            </div>

            <!-- Cabinets privés hors canton -->
            <div class="institution-card">
              <div class="institution-header private-external">
                <i class="pi pi-briefcase"></i>
                <span>Cabinets Privés Hors Canton</span>
              </div>
              <div class="institution-metrics">
                <div class="metric">
                  <span class="metric-number">{{ selectedCabinetsPrivesHorsCanton }}</span>
                  <span class="metric-separator">/</span>
                  <span class="metric-total">{{ globalCabinetsPrivesHorsCanton }}</span>
                </div>
                <div class="metric-bar">
                  <div class="metric-progress" 
                       :style="{ width: globalCabinetsPrivesHorsCanton > 0 ? (selectedCabinetsPrivesHorsCanton / globalCabinetsPrivesHorsCanton) * 100 + '%' : '0%' }">
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <!-- Listes des étudiants optimisées -->
      <div class="students-management mt-4">
        <div class="students-header">
          <h2><i class="pi pi-users"></i> Gestion des Étudiants BA24</h2>
          <p class="students-subtitle">Suivi des attributions par catégorie</p>
        </div>

        <div class="students-grid">
          <!-- Lésés -->
          <div class="student-category-card priority">
            <div class="category-header">
              <div class="category-icon">
                <i class="pi pi-exclamation-triangle"></i>
              </div>
              <div class="category-info">
                <h3>Lésés</h3>
                <span class="category-count">{{ leses.length }} étudiant{{ leses.length > 1 ? 's' : '' }}</span>
              </div>
              <div class="category-stats">
                <span class="assigned-count">{{ leses.filter(user => getAssignedPlace(user.id)).length }}</span>
                <span class="stats-label">Assigné{{ leses.filter(user => getAssignedPlace(user.id)).length > 1 ? 's' : '' }}</span>
              </div>
            </div>
            <div class="students-list">
              <div v-for="user in leses" :key="user.id" class="student-item">
                <div class="student-info">
                  <div class="student-avatar">
                    {{ user.Prenom?.charAt(0) }}{{ user.Nom?.charAt(0) }}
                  </div>
                  <div class="student-details">
                    <span class="student-name">{{ user.Prenom }} {{ user.Nom }}</span>
                    <span v-if="getAssignedPlace(user.id)" class="student-assignment">
                      <i class="pi pi-map-marker"></i>
                      {{ getAssignedPlace(user.id) }}
                    </span>
                    <span v-else class="student-unassigned">
                      <i class="pi pi-clock"></i>
                      En attente d'attribution
                    </span>
                  </div>
                </div>
                <div class="student-status">
                  <span v-if="getAssignedPlace(user.id)" class="status-badge assigned">
                    <i class="pi pi-check"></i>
                    Assigné
                  </span>
                  <span v-else class="status-badge pending">
                    <i class="pi pi-hourglass"></i>
                    En attente
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- SAE -->
          <div class="student-category-card sae">
            <div class="category-header">
              <div class="category-icon">
                <i class="pi pi-star"></i>
              </div>
              <div class="category-info">
                <h3>SAE</h3>
                <span class="category-count">{{ saes.length }} étudiant{{ saes.length > 1 ? 's' : '' }}</span>
              </div>
              <div class="category-stats">
                <span class="assigned-count">{{ saes.filter(user => getAssignedPlace(user.id)).length }}</span>
                <span class="stats-label">Assigné{{ saes.filter(user => getAssignedPlace(user.id)).length > 1 ? 's' : '' }}</span>
              </div>
            </div>
            <div class="students-list">
              <div v-for="user in saes" :key="user.id" class="student-item">
                <div class="student-info">
                  <div class="student-avatar">
                    {{ user.Prenom?.charAt(0) }}{{ user.Nom?.charAt(0) }}
                  </div>
                  <div class="student-details">
                    <span class="student-name">{{ user.Prenom }} {{ user.Nom }}</span>
                    <span v-if="getAssignedPlace(user.id)" class="student-assignment">
                      <i class="pi pi-map-marker"></i>
                      {{ getAssignedPlace(user.id) }}
                    </span>
                    <span v-else class="student-unassigned">
                      <i class="pi pi-clock"></i>
                      En attente d'attribution
                    </span>
                  </div>
                </div>
                <div class="student-status">
                  <span v-if="getAssignedPlace(user.id)" class="status-badge assigned">
                    <i class="pi pi-check"></i>
                    Assigné
                  </span>
                  <span v-else class="status-badge pending">
                    <i class="pi pi-hourglass"></i>
                    En attente
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Cas particuliers -->
          <div class="student-category-card special">
            <div class="category-header">
              <div class="category-icon">
                <i class="pi pi-flag"></i>
              </div>
              <div class="category-info">
                <h3>Cas Particuliers</h3>
                <span class="category-count">{{ casparticuliers.length }} étudiant{{ casparticuliers.length > 1 ? 's' : '' }}</span>
              </div>
              <div class="category-stats">
                <span class="assigned-count">{{ casparticuliers.filter(user => getAssignedPlace(user.id)).length }}</span>
                <span class="stats-label">Assigné{{ casparticuliers.filter(user => getAssignedPlace(user.id)).length > 1 ? 's' : '' }}</span>
              </div>
            </div>
            <div class="students-list">
              <div v-for="user in casparticuliers" :key="user.id" class="student-item">
                <div class="student-info">
                  <div class="student-avatar">
                    {{ user.Prenom?.charAt(0) }}{{ user.Nom?.charAt(0) }}
                  </div>
                  <div class="student-details">
                    <span class="student-name">{{ user.Prenom }} {{ user.Nom }}</span>
                    <span v-if="getAssignedPlace(user.id)" class="student-assignment">
                      <i class="pi pi-map-marker"></i>
                      {{ getAssignedPlace(user.id) }}
                    </span>
                    <span v-else class="student-unassigned">
                      <i class="pi pi-clock"></i>
                      En attente d'attribution
                    </span>
                  </div>
                </div>
                <div class="student-status">
                  <span v-if="getAssignedPlace(user.id)" class="status-badge assigned">
                    <i class="pi pi-check"></i>
                    Assigné
                  </span>
                  <span v-else class="status-badge pending">
                    <i class="pi pi-hourglass"></i>
                    En attente
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/common/utils/Navbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dropdown from 'primevue/dropdown';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import { ref, onValue, update } from "firebase/database";
import { db } from '../../../../firebase.js';
import Textarea from 'primevue/textarea';

export default {
  name: "OfferPFP2Places",
  components: {
    Navbar,
    DataTable,
    Column,
    Dropdown,
    Checkbox,
    Button,
    Dialog,
    Textarea
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
    // Options pour le Dropdown des étudiants BA24
    BA24Students() {
      return this.users.filter(user =>
        user.Roles && user.Roles.BA24 === true
      );
    },
    BA24StudentsOptions() {
      let options = this.BA24Students
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
    // Seules les places dont PFP2 est défini et >= 1 sont incluses.
    expandedPFP2() {
      const rows = [];
      this.sortedPlaces.forEach(place => {
        let count = parseInt(place['PFP2-2026']);
        if (!isNaN(count) && count >= 1) {
          if (!this.dynamicSelections[place.IdPlace]) {
            this.dynamicSelections[place.IdPlace] = {};
          }
          if (!this.dynamicPraticienSelections[place.IdPlace]) {
            this.dynamicPraticienSelections[place.IdPlace] = {};
          }
          for (let i = 1; i <= count; i++) {
            const keyEtudiant = `selectedEtudiantBA24PFP2-${i}`;
            const keyPraticien = `selectedPraticiensBA24PFP2-${i}`;
            const dyn = { [keyEtudiant]: this.dynamicSelections[place.IdPlace][keyEtudiant] ?? (place[keyEtudiant] || '') };
            const dynPraticien = { [keyPraticien]: this.dynamicPraticienSelections[place.IdPlace][keyPraticien] ?? (place[keyPraticien] || '') };
            rows.push({
              ...place,
              seatIndex: i,
              selectedOut: place.selectedOut || false,
              [`selectedActiveBA24PFP2-${i}`]: (place[`selectedActiveBA24PFP2-${i}`] !== undefined ? place[`selectedActiveBA24PFP2-${i}`] : false),
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
        const count = parseInt(place['PFP2-2026']);
        return !isNaN(count) && count >= 1;
      }).length;
    },
    totalSelectedOut() {
      return this.expandedPFP2.filter(row => row[`selectedActiveBA24PFP2-${row.seatIndex}`] === true).length;
    },
    totalWithStudentSelected() {
      return this.places.filter(place => {
        const count = parseInt(place['PFP2-2026']);
        let found = false;
        for (let i = 1; i <= count; i++) {
          const key = `selectedEtudiantBA24PFP2-${i}`;
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
        const count = parseInt(place['PFP2-2026']);
        let found = false;
        for (let i = 1; i <= count; i++) {
          const key = `selectedPraticiensBA24PFP2-${i}`;
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
      return this.expandedPFP2.filter(row => this.praticienSelected(row));
    },
    // Liste des utilisateurs par rôle
    leses() {
      return this.users.filter(user => user.Roles && user.Roles.prioritaire === true  && user.Roles.BA24 === true);
    },
    saes() {
      return this.users.filter(user => user.Roles && user.Roles.sae === true && user.Roles.BA24 === true);
    },
    casparticuliers() {
      return this.users.filter(user => user.Roles && user.Roles.casparticulier === true && user.Roles.BA24 === true);
    },
    // Nombre global de places offertes (somme de PFP2)
    totalPlacesOffertes() {
      return this.places.reduce((total, place) => total + (parseInt(place['PFP2-2026']) || 0), 0);
    },
    // Indicateurs par institution selon la catégorie - Comptage des PLACES
    globalInstitutionsValaisanne() {
      return this.places.reduce((total, place) => {
        if (place.CategoryInstitution === 'Institution valaisanne') {
          return total + (parseInt(place['PFP2-2026']) || 0);
        }
        return total;
      }, 0);
    },
    selectedInstitutionsValaisanne() {
      return this.places.reduce((total, place) => {
        if (place.CategoryInstitution === 'Institution valaisanne') {
          const count = parseInt(place['PFP2-2026']) || 0;
          let selectedCount = 0;
          for (let i = 1; i <= count; i++) {
            const dynamicKey = `selectedActiveBA24PFP2-${i}`;
            if (place[dynamicKey] === true) {
              selectedCount++;
            }
          }
          return total + selectedCount;
        }
        return total;
      }, 0);
    },
    globalInstitutionsHorsCanton() {
      return this.places.reduce((total, place) => {
        if (place.CategoryInstitution === 'Institution hors canton') {
          return total + (parseInt(place['PFP2-2026']) || 0);
        }
        return total;
      }, 0);
    },
    selectedInstitutionsHorsCanton() {
      return this.places.reduce((total, place) => {
        if (place.CategoryInstitution === 'Institution hors canton') {
          const count = parseInt(place['PFP2-2026']) || 0;
          let selectedCount = 0;
          for (let i = 1; i <= count; i++) {
            const dynamicKey = `selectedActiveBA24PFP2-${i}`;
            if (place[dynamicKey] === true) {
              selectedCount++;
            }
          }
          return total + selectedCount;
        }
        return total;
      }, 0);
    },
    globalCabinetsPrivesValaisan() {
      return this.places.reduce((total, place) => {
        if (place.CategoryInstitution === 'Cabinet privé valaisan') {
          return total + (parseInt(place['PFP2-2026']) || 0);
        }
        return total;
      }, 0);
    },
    selectedCabinetsPrivesValaisan() {
      return this.places.reduce((total, place) => {
        if (place.CategoryInstitution === 'Cabinet privé valaisan') {
          const count = parseInt(place['PFP2-2026']) || 0;
          let selectedCount = 0;
          for (let i = 1; i <= count; i++) {
            const dynamicKey = `selectedActiveBA24PFP2-${i}`;
            if (place[dynamicKey] === true) {
              selectedCount++;
            }
          }
          return total + selectedCount;
        }
        return total;
      }, 0);
    },
    globalCabinetsPrivesHorsCanton() {
      return this.places.reduce((total, place) => {
        if (place.CategoryInstitution === 'Cabinet privé hors canton') {
          return total + (parseInt(place['PFP2-2026']) || 0);
        }
        return total;
      }, 0);
    },
    selectedCabinetsPrivesHorsCanton() {
      return this.places.reduce((total, place) => {
        if (place.CategoryInstitution === 'Cabinet privé hors canton') {
          const count = parseInt(place['PFP2-2026']) || 0;
          let selectedCount = 0;
          for (let i = 1; i <= count; i++) {
            const dynamicKey = `selectedActiveBA24PFP2-${i}`;
            if (place[dynamicKey] === true) {
              selectedCount++;
            }
          }
          return total + selectedCount;
        }
        return total;
      }, 0);
    }
  },
  methods: {
    // Clé dynamique pour le Dropdown étudiant
    selectedKey(row) {
      return `selectedEtudiantBA24PFP2-${row.seatIndex}`;
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
      return `selectedPraticiensBA24PFP2-${row.seatIndex}`;
    },
    // Vérifie si un praticien est déjà sélectionné pour cette ligne
    praticienSelected(row) {
      const key = this.selectedKeyPraticien(row);
      return row.dynPraticien && row.dynPraticien[key] && row.dynPraticien[key] !== '';
    },
    // Vérifie si un praticien est sélectionné pour cette ligne (vérification de deux clés possibles)
    hasSelectedPraticien(row) {
      const keyPlural = `selectedPraticiensBA24PFP2-${row.seatIndex}`;
      const keySingular = `selectedPraticienBA24PFP2-${row.seatIndex}`;
      const valuePlural = row.dynPraticien && row.dynPraticien[keyPlural] ? row.dynPraticien[keyPlural] : row[keyPlural];
      const valueSingular = row.dynPraticien && row.dynPraticien[keySingular] ? row.dynPraticien[keySingular] : row[keySingular];
      return (valuePlural && valuePlural !== '') || (valueSingular && valueSingular !== '');
    },
    // Récupère le nom du praticien sélectionné
    getSelectedPraticienName(row) {
      const keyPlural = `selectedPraticiensBA24PFP2-${row.seatIndex}`;
      const keySingular = `selectedPraticienBA24PFP2-${row.seatIndex}`;
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
              PFP2: place['PFP2-2026'] || '0',
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
      const propertyName = `selectedEtudiantBA24PFP2-${seatIndex}`;
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
      const propertyName = `selectedPraticiensBA24PFP2-${seatIndex}`;
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
      const dynamicKey = `selectedActiveBA24PFP2-${row.seatIndex}`;
      const placeRef = ref(db, `Places/${row.IdPlace}`);
      update(placeRef, { [dynamicKey]: row[dynamicKey] })
        .catch((error) => {
          console.error("Erreur updatePlaceSelection:", error);
        });
    },
    selectAllOut() {
      this.places.forEach(place => {
        const count = parseInt(place['PFP2-2026']);
        if (count >= 1) {
          for (let i = 1; i <= count; i++) {
            const dynamicKey = `selectedActiveBA24PFP2-${i}`;
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
      const assignedRows = this.expandedPFP2.filter(row => {
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

/* Styles optimisés pour le tableau de bord - Thème BA24 */
.stats-dashboard {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  margin-top: 20px;
}

.stats-header {
  text-align: center;
  margin-bottom: 32px;
}

.stats-header h2 {
  color: white;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.stats-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  margin: 0;
}

.stats-section {
  margin-bottom: 40px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
}

.stats-section h3 {
  color: #667eea;
  font-size: 1.4rem;
  font-weight: 600;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* Grille des cartes étudiants */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  border-left: 4px solid;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.stat-card.primary { border-left-color: #667eea; }
.stat-card.warning { border-left-color: #ff6b6b; }
.stat-card.info { border-left-color: #4ecdc4; }
.stat-card.secondary { border-left-color: #a8edea; }

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
}

.stat-card.primary .stat-icon { background: #667eea; }
.stat-card.warning .stat-icon { background: #ff6b6b; }
.stat-card.info .stat-icon { background: #4ecdc4; }
.stat-card.secondary .stat-icon { background: #a8edea; }

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  line-height: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
  margin-top: 4px;
}

/* Grille des places */
.stats-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: center;
}

.stat-card-large {
  background: white;
  border-radius: 16px;
  padding: 32px;
  display: flex;
  align-items: center;
  gap: 24px;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.15);
  border-left: 6px solid #667eea;
}

.progress-circle {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(#667eea 0deg, #667eea calc(var(--progress, 0) * 3.6deg), #ecf0f1 calc(var(--progress, 0) * 3.6deg));
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.progress-circle::before {
  content: '';
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: white;
  position: absolute;
}

.progress-text {
  font-size: 1.2rem;
  font-weight: 700;
  color: #667eea;
  z-index: 1;
}

.stat-details {
  flex: 1;
}

.stat-main {
  font-size: 2.5rem;
  font-weight: 700;
  color: #667eea;
  line-height: 1;
}

.stat-desc {
  font-size: 1.1rem;
  color: #7f8c8d;
  margin-top: 8px;
}

.stat-summary {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 20px;
}

.summary-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #ecf0f1;
}

.summary-item:last-child {
  border-bottom: none;
}

.summary-label {
  font-weight: 500;
  color: #34495e;
}

.summary-value {
  font-weight: 700;
  font-size: 1.1rem;
  color: #2c3e50;
}

.summary-value.selected {
  color: #667eea;
}

.summary-value.available {
  color: #4ecdc4;
}

/* Styles des institutions */
.institution-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.institution-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
}

.institution-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.institution-header {
  padding: 16px 20px;
  color: white;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 8px;
}

.institution-header.valais { background: linear-gradient(135deg, #667eea, #764ba2); }
.institution-header.external { background: linear-gradient(135deg, #4ecdc4, #44a08d); }
.institution-header.private-valais { background: linear-gradient(135deg, #ff6b6b, #ee5a52); }
.institution-header.private-external { background: linear-gradient(135deg, #a8edea, #fed6e3); color: #2c3e50; }

.institution-metrics {
  padding: 20px;
}

.metric {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.metric-number {
  font-size: 1.8rem;
  font-weight: 700;
  color: #667eea;
}

.metric-separator {
  font-size: 1.5rem;
  color: #bdc3c7;
}

.metric-total {
  font-size: 1.8rem;
  font-weight: 700;
  color: #34495e;
}

.metric-bar {
  width: 100%;
  height: 8px;
  background: #ecf0f1;
  border-radius: 4px;
  overflow: hidden;
}

.metric-progress {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  border-radius: 4px;
  transition: width 0.6s ease;
}

/* Styles pour la gestion des étudiants */
.students-management {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3);
  margin-top: 20px;
}

.students-header {
  text-align: center;
  margin-bottom: 32px;
}

.students-header h2 {
  color: white;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.students-subtitle {
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  margin: 0;
}

.students-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
}

.student-category-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.student-category-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
}

.category-header {
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  color: white;
  font-weight: 600;
}

.student-category-card.priority .category-header {
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
}

.student-category-card.sae .category-header {
  background: linear-gradient(135deg, #4ecdc4, #44a08d);
}

.student-category-card.special .category-header {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
}

.category-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
}

.category-info {
  flex: 1;
}

.category-info h3 {
  margin: 0 0 4px 0;
  font-size: 1.3rem;
}

.category-count {
  font-size: 0.9rem;
  opacity: 0.9;
}

.category-stats {
  text-align: right;
}

.assigned-count {
  font-size: 1.8rem;
  font-weight: 700;
  display: block;
  line-height: 1;
}

.stats-label {
  font-size: 0.8rem;
  opacity: 0.9;
}

.students-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 0 20px 20px 20px;
}

.student-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom: 1px solid #f1f3f4;
  transition: all 0.2s ease;
}

.student-item:hover {
  background: #f8f9fa;
  border-radius: 8px;
}

.student-item:last-child {
  border-bottom: none;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.9rem;
}

.student-details {
  flex: 1;
}

.student-name {
  display: block;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.student-assignment {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: #667eea;
  font-weight: 500;
}

.student-unassigned {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.85rem;
  color: #95a5a6;
  font-style: italic;
}

.student-status {
  margin-left: 12px;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.assigned {
  background: rgba(102, 126, 234, 0.1);
  color: #667eea;
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

/* Scrollbar personnalisée pour les listes */
.students-list::-webkit-scrollbar {
  width: 6px;
}

.students-list::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 3px;
}

.students-list::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 3px;
}

.students-list::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

.recap,
.liste-leses {
  background-color: var(--surface-card);
  padding: 20px;
  border-radius: 8px;
  margin-top: 20px;
}

/* Responsive */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stats-grid-2 {
    grid-template-columns: 1fr;
  }
  
  .institution-stats {
    grid-template-columns: 1fr;
  }
  
  .stats-dashboard {
    padding: 16px;
  }
  
  .stats-section {
    padding: 16px;
  }
  
  .students-grid {
    grid-template-columns: 1fr;
  }
  
  .students-management {
    padding: 16px;
  }
  
  .category-header {
    padding: 16px;
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .category-stats {
    text-align: center;
  }
  
  .student-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .student-status {
    margin-left: 0;
    align-self: flex-end;
  }
}

.praticien-list ul {
  list-style: none;
  padding: 0;
}

.praticien-list li {
  margin-bottom: 0.5rem;
}
</style>