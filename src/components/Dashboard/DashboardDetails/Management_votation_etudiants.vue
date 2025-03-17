<template>
  <div>
    <Navbar />
    <div class="page-title">
      <h1>Management Votation Étudiants</h1>
    </div>
    <div class="container">
      <!-- Tableau récapitulatif d'une seule ligne par étudiant -->
      <DataTable :value="sortedStudentAssignments" class="p-datatable-sm custom-datatable" responsiveLayout="scroll">
        <Column header="Étudiant">
          <template #body="slotProps">
            <span>{{ slotProps.data.studentName }}</span>
          </template>
        </Column>
        <Column header="Institution">
          <template #body="slotProps">
            <span>{{ slotProps.data.institution || 'Aucune affectation' }}</span>
          </template>
        </Column>
        <Column header="Nom de la Place">
          <template #body="slotProps">
            <span>{{ slotProps.data.nomPlace || 'Aucune affectation' }}</span>
          </template>
        </Column>
        <Column header="Critères validés">
          <template #body="slotProps">
            <span>{{ slotProps.data.criteria || 'Aucun' }}</span>
          </template>
        </Column>
        <Column header="Remarque étudiant">
          <template #body="slotProps">
            <span>{{ slotProps.data.remarqueEtudiant || 'Aucune' }}</span>
            <Button icon="pi pi-pencil" class="p-button-text" @click="openRemarkDialog(slotProps.data)" />
          </template>
        </Column>
        <Column header="Remarques places">
          <template #body="slotProps">
            <span>{{ slotProps.data.remarquesPlaces || 'Aucune' }}</span>
          </template>
        </Column>
      </DataTable>

      <!-- Récapitulatif global -->
      <div class="recap surface-card mt-4">
        <h3>Récapitulatif</h3>
        <ul>
          <li>Nombre d'étudiants BA22 : {{ ba22Students.length }}</li>
          <li>Nombre global de places offertes : {{ totalPlacesOffertes }}</li>
        </ul>
      </div>

      <!-- Dialog pour modifier le StudentNote de l'étudiant -->
      <Dialog header="Modifier le StudentNote de l'étudiant" v-model:visible="displayRemarkDialog" modal>
        <div class="remark-dialog">
          <textarea v-model="editedRemarks" rows="5" style="width:100%;" placeholder="Saisir vos remarques ici..."></textarea>
          <div class="dialog-buttons" style="margin-top:1em; text-align:right;">
            <Button label="Annuler" class="p-button-text" @click="cancelRemarkEdit" />
            <Button label="Confirmer" class="p-button-success" @click="confirmRemarkUpdate" />
          </div>
        </div>
      </Dialog>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Utils/Navbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import { ref, onValue, update } from "firebase/database";
import { db } from '../../../../firebase.js';

export default {
  name: "Management_votation_etudiants",
  components: {
    Navbar,
    DataTable,
    Column,
    Dialog,
    Button
  },
  data() {
    return {
      places: [],
      users: [],
      dynamicSelections: {},
      institutions: {}, // données provenant de la table Institutions
      displayRemarkDialog: false,
      selectedAssignment: null, // Objet de l'affectation (ligne étudiant) sélectionnée pour modification
      editedRemarks: ""
    };
  },
  computed: {
    // Filtrer les utilisateurs ayant le rôle BA22
    ba22Students() {
      return this.users.filter(user => user.Roles && user.Roles.BA22 === true);
    },
    // Nombre global de places offertes (somme du champ PFP4)
    totalPlacesOffertes() {
      return this.places.reduce((total, place) => total + (parseInt(place.PFP4) || 0), 0);
    },
    // "Déplie" chaque enregistrement de place en autant de lignes que le nombre indiqué dans PFP4.
    // Chaque ligne contient une propriété 'dyn' où est stockée l'affectation (l'identifiant étudiant)
    expandedPFP4() {
      const rows = [];
      const sortedPlaces = this.places.sort((a, b) => a.NomPlace.localeCompare(b.NomPlace));
      sortedPlaces.forEach(place => {
        const count = parseInt(place.PFP4);
        if (!isNaN(count) && count >= 1) {
          if (!this.dynamicSelections[place.IDPlace]) {
            this.dynamicSelections[place.IDPlace] = {};
          }
          for (let i = 1; i <= count; i++) {
            const keyEtudiant = `selectedEtudiantBA22PFP4-${i}`;
            const value = this.dynamicSelections[place.IDPlace][keyEtudiant] || place[keyEtudiant] || '';
            rows.push({
              ...place,
              seatIndex: i,
              dyn: { [keyEtudiant]: value }
            });
          }
        }
      });
      return rows;
    },
    // Pour chaque étudiant BA22, on agrège les détails de son affectation (s'il y en a) en une seule ligne.
    // "remarqueEtudiant" provient de student.StudentNote (table Users)
    // "remarquesPlaces" agrège les remarques provenant des affectations (table Places)
    studentAssignments() {
      return this.ba22Students.map(student => {
        const assignments = this.expandedPFP4.filter(row => {
          const key = this.selectedKey(row);
          return row.dyn[key] && row.dyn[key] === student.id;
        });
        let institution = "";
        let nomPlace = "";
        let criteria = "";
        let remarquesPlaces = "";
        if (assignments.length > 0) {
          institution = assignments.map(a => this.getInstitutionName(a)).join(" | ");
          nomPlace = assignments.map(a => a.NomPlace).join(" | ");
          criteria = assignments.map(a => this.getCriteriaList(a)).join(" | ");
          remarquesPlaces = assignments.map(a => a.Remarques || "").join(" | ");
        }
        return {
          id: student.id,
          studentName: student.Nom + " " + student.Prenom,
          prenom: student.Prenom,
          nom: student.Nom,
          institution,
          nomPlace,
          criteria,
          remarqueEtudiant: student.StudentNote || "",
          remarquesPlaces,
          assignments
        };
      });
    },
    // Tri final : d'abord les étudiants déjà placés, puis ceux encore à placer,
    // triés par ordre alphabétique du **nom** puis du **prénom**.
    sortedStudentAssignments() {
      const placed = this.studentAssignments.filter(sa => sa.institution && sa.institution.trim() !== "");
      const notPlaced = this.studentAssignments.filter(sa => !sa.institution || sa.institution.trim() === "");
      
      const sortByNomPrenom = (a, b) => {
        const cmp = a.nom.localeCompare(b.nom);
        if (cmp === 0) {
          return a.prenom.localeCompare(b.prenom);
        }
        return cmp;
      };
      
      placed.sort(sortByNomPrenom);
      notPlaced.sort(sortByNomPrenom);
      
      return [...placed, ...notPlaced];
    }
  },
  methods: {
    // Renvoie la clé dynamique associée à une ligne de place
    selectedKey(row) {
      return `selectedEtudiantBA22PFP4-${row.seatIndex}`;
    },
    // Construit une chaîne listant les critères validés par une place
    getCriteriaList(row) {
      const criteria = [];
      if (row.MSQ === true || row.MSQ === "true") criteria.push("MSQ");
      if (row.SYSINT === true || row.SYSINT === "true") criteria.push("SYSINT");
      if (row.NEUROGER === true || row.NEUROGER === "true") criteria.push("NEUROGER");
      if (row.AIGU === true || row.AIGU === "true") criteria.push("AIGU");
      if (row.REHAB === true || row.REHAB === "true") criteria.push("REHAB");
      if (row.AMBU === true || row.AMBU === "true") criteria.push("AMBU");
      if (row.FR === true || row.FR === "true") criteria.push("FR");
      if (row.DE === true || row.DE === "true") criteria.push("DE");
      return criteria.join(", ");
    },
    // Retourne le nom de l'institution à partir de la table Institutions
    getInstitutionName(row) {
      if (row.IDPlace && this.institutions[row.IDPlace]) {
        return this.institutions[row.IDPlace].Name || "-";
      }
      return row.InstitutionName || 'Aucune';
    },
    // Ouvre le dialog pour modifier le StudentNote de l'étudiant
    openRemarkDialog(assignment) {
      this.selectedAssignment = assignment;
      this.editedRemarks = assignment.remarqueEtudiant || "";
      this.displayRemarkDialog = true;
    },
    cancelRemarkEdit() {
      this.displayRemarkDialog = false;
      this.selectedAssignment = null;
      this.editedRemarks = "";
    },
    // Met à jour le StudentNote dans la table Users et rafraîchit les données
    confirmRemarkUpdate() {
      const userRef = ref(db, `Users/${this.selectedAssignment.id}`);
      update(userRef, { StudentNote: this.editedRemarks })
        .then(() => {
          // Rafraîchit les données pour refléter la modification
          this.fetchUsersData();
        })
        .catch(error => console.error("Erreur lors de la mise à jour du StudentNote :", error));
      this.displayRemarkDialog = false;
      this.selectedAssignment = null;
      this.editedRemarks = "";
    },
    // Récupère les places depuis Firebase
    fetchPlacesData() {
      const placesRef = ref(db, 'Places');
      onValue(placesRef, snapshot => {
        const placesData = snapshot.val();
        if (placesData) {
          this.places = Object.keys(placesData).map(key => {
            const place = placesData[key];
            return {
              ...place,
              IdPlace: key,
              InstitutionId: place.InstitutionId || "",
              PFP4: place.PFP4 || '0'
            };
          });
        }
      });
    },
    // Récupère les utilisateurs depuis Firebase
    fetchUsersData() {
      const usersRef = ref(db, 'Users');
      onValue(usersRef, snapshot => {
        const data = snapshot.val() || {};
        this.users = Object.keys(data).map(key => ({ ...data[key], id: key }));
      });
    },
    // Récupère les institutions depuis Firebase
    fetchInstitutionsData() {
      const instRef = ref(db, 'Institutions');
      onValue(instRef, snapshot => {
        const data = snapshot.val() || {};
        this.institutions = data;
      });
    }
  },
  mounted() {
    this.fetchPlacesData();
    this.fetchUsersData();
    this.fetchInstitutionsData();
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

/* Styles pour le dialog de modification du StudentNote */
.remark-dialog textarea {
  resize: vertical;
}
</style>
