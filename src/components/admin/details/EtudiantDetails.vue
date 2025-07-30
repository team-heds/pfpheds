<template>
  <Navbar />
  <div class="filter-menu">
    <div class="p-fluid p-pt-4 p-pb-4">
      <div v-if="currentStudent" class="p-card p-mb-4">
        <h3>Profil de l'étudiant</h3>
        <DataTable :value="[currentStudent]" class="p-datatable-gridlines">
          <Column field="Nom" header="Nom"></Column>
          <Column field="Prenom" header="Prénom"></Column>
          <Column field="Classe" header="Classe"></Column>
          <Column field="responsableDeStage" header="Responsable stage"></Column>
          <Column field="Email" header="E-Mail"></Column>
          <Column field="PFPinfo[selectedPFP]?.Remarque" header="Remarque"></Column>
          <Column field="PFPinfo[selectedPFP]?.selectedStageName" header="Place Sélectionnée"></Column>
        </DataTable>
        <br>
        <div class="p-mt-4">
          <h4>Détails</h4>
          <table class="p-table p-datatable-gridlines">
            <thead>
            <tr>
              <th>Secteur</th>
              <th>Statut</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(value, key) in secteurDetails(currentStudent)" :key="key">
              <td>{{ key }}</td>
              <td>
                <i v-if="value != '0'" class="pi pi-check-circle text-green-500"></i>
                <i v-else class="pi pi-times-circle text-red-500"></i>
              </td>
            </tr>
            </tbody>
          </table>
        </div>

        <!-- Affichage amélioré pour PFP1_info -->
        <div v-if="currentStudent.PFP1_info">
          <h5>PFP1 Details:</h5>
          <table class="p-table p-datatable-gridlines">
            <tr>
              <th>Nom</th>
              <td>{{ currentStudent.PFP1_info.Nom }}</td>
            </tr>
            <tr>
              <th>Lieu</th>
              <td>{{ currentStudent.PFP1_info.Lieu }}</td>
            </tr>
            <tr>
              <th>Langue</th>
              <td>{{ currentStudent.PFP1_info.Langue }}</td>
            </tr>
            <tr>
              <th>Secteurs</th>
              <td>{{ getOtherSecteurs(currentStudent.PFP1_info) }}</td>
            </tr>
          </table>
        </div>

        <!-- Affichage pour PFP2_info -->
        <div v-if="currentStudent.PFP2_info">
          <h5>PFP2 Details:</h5>
          <table class="p-table p-datatable-gridlines">
            <tr>
              <th>Nom</th>
              <td>{{ currentStudent.PFP2_info.Nom }}</td>
            </tr>
            <tr>
              <th>Lieu</th>
              <td>{{ currentStudent.PFP2_info.Lieu }}</td>
            </tr>
            <tr>
              <th>Langue</th>
              <td>{{ currentStudent.PFP2_info.Langue }}</td>
            </tr>
            <tr>
              <th>Secteurs</th>
              <td>{{ getOtherSecteurs(currentStudent.PFP2_info) }}</td>
            </tr>
          </table>
        </div>

        <!-- Affichage pour PFP3_info -->
        <div v-if="currentStudent.PFP3_info">
          <h5>PFP3 Details:</h5>
          <table class="p-table p-datatable-gridlines">
            <tr>
              <th>Nom</th>
              <td>{{ currentStudent.PFP3_info.Nom }}</td>
            </tr>
            <tr>
              <th>Lieu</th>
              <td>{{ currentStudent.PFP3_info.Lieu }}</td>
            </tr>
            <tr>
              <th>Langue</th>
              <td>{{ currentStudent.PFP3_info.Langue }}</td>
            </tr>
            <tr>
              <th>Secteurs</th>
              <td>{{ getOtherSecteurs(currentStudent.PFP3_info) }}</td>
            </tr>
          </table>
        </div>

        <!-- Affichage pour PFP4_info -->
        <div v-if="currentStudent.PFP4_info">
          <h5>PFP4 Details:</h5>
          <table class="p-table p-datatable-gridlines">
            <tr>
              <th>Nom</th>
              <td>{{ currentStudent.PFP4_info.Nom }}</td>
            </tr>
            <tr>
              <th>Lieu</th>
              <td>{{ currentStudent.PFP4_info.Lieu }}</td>
            </tr>
            <tr>
              <th>Langue</th>
              <td>{{ currentStudent.PFP4_info.Langue }}</td>
            </tr>
            <tr>
              <th>Secteurs</th>
              <td>{{ getOtherSecteurs(currentStudent.PFP4_info) }}</td>
            </tr>
          </table>
        </div>
        <br> <br>
        <div v-if="validationMessage" class="p-mt-4">
          <h4>Validation</h4>
          <p>{{ validationMessage }}</p>
        </div>
      </div>
      <div class="p-d-flex p-jc-center p-mt-4">
        <Button label="Retour" class="p-button-primary" @click="goBack" />
      </div>
    </div>
  </div>
</template>

<script>
import { db } from '../../../../firebase.js';
import { ref, get } from "firebase/database";
import Navbar from '@/components/common/utils/Navbar.vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';

export default {
  name: "EtudiantDetails",
  components: {
    Navbar,
    DataTable,
    Column,
    Button
  },
  data() {
    return {
      currentStudent: null,
      selectedPFP: 'PFP1', // exemple, cela devrait être défini dynamiquement
      validationMessage: null,
      studentId: this.$route.params.id // Récupérer l'ID de l'étudiant à partir des paramètres de route
    };
  },
  async mounted() {
    await this.fetchStudentData(this.studentId);
  },
  methods: {
    async fetchStudentData(studentId) {
      try {
        const dbRef = ref(db, `students`);
        const snapshot = await get(dbRef);
        if (snapshot.exists()) {
          const studentsData = snapshot.val();
          for (const classKey in studentsData) {
            if (studentsData[classKey][studentId]) {
              this.currentStudent = {
                id: studentId,
                Classe: classKey,
                ...studentsData[classKey][studentId]
              };
              this.checkValidation();
              return;
            }
          }
        }
      } catch (error) {
        console.error('Erreur de récupération des données', error);
      }
    },
    secteurDetails(info) {
      return {
        "FR": info.FR,
        "ALL": info.ALL,
        "AMBU": info.AMBU,
        "AIGU": info.AIGU,
        "MSQ": info.MSQ,
        "SYSINT": info.SYSINT,
        "NEUROGER": info.NEUROGER,
        "REHAB": info.REHAB,
      };
    },
    getOtherSecteurs(info) {
      const excludedKeys = ['ID', 'IDA', 'Lieu','Nom', 'Langue'];
      return Object.keys(info)
        .filter(key => !excludedKeys.includes(key))
        .map(key => key + ': ' + info[key])
        .join(', ');
    },
    checkValidation() {
      if (!this.currentStudent) return;
      const { FR, ALL, AMBU, MSQ, AIGU, SYSINT, NEUROGER, REHAB } = this.currentStudent;
      console.log("FR + "+ FR);
      this.missingFields = [];
      this.languageIssue = null;

      if (FR == "0" && ALL == "0" && AMBU == "0" && MSQ == "0" && SYSINT == "0" && AIGU == "0" && NEUROGER == "0" && REHAB == "0") {
        this.validationMessage = "Toutes les options sont disponibles";
        return;
      }

      if (FR == "0") this.languageIssue = "besoin langue FR";
      if (ALL == "0") this.languageIssue = "besoin langue ALL";
      if (AMBU == "0") this.missingFields.push("AMBU");
      if (MSQ == "0") this.missingFields.push("MSQ");
      if (AIGU == "0") this.missingFields.push("AIGU");
      if (SYSINT == "0") this.missingFields.push("SYSINT");
      if (NEUROGER == "0") this.missingFields.push("NEUROGER");
      if (REHAB == "0") this.missingFields.push("REHAB");

      if (this.languageIssue) {
        this.validationMessage = this.languageIssue;
      } else if (this.missingFields.length > 0) {
        this.validationMessage = `manque ${this.missingFields.join(", ")}`;
      } else {
        this.validationMessage = "Tout validé";
      }
    },
    goBack() {
      this.$router.push({ name: 'EtudiantList' });
    }
  }
};
</script>

<style scoped>
.p-fluid {
  padding: 20px;
}

.table-dark-gray {
  background-color: #343a40;
  color: #fff;
}

.table-dark-gray th,
.table-dark-gray td {
  border-color: #454d55;
}

.text-danger {
  color: red !important;
}

.text-green-500 {
  color: green !important;
}

.text-red-500 {
  color: red !important;
}

.p-table {
  width: 100%;
  border-collapse: collapse;
}

.p-table th,
.p-table td {
  border: 1px solid #ccc;
  padding: 8px;
}

.p-table th {
  background-color: #f4f4f4;
}

.pi-check-circle {
  color: green;
}

.pi-times-circle {
  color: red;
}
</style>