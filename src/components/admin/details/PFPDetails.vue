<template>
  <Navbar />
  <div class="container py-5">
    <div class="text-center mb-4">
      <h1 class="mb-3">Créer une PFP</h1>
      <div class="p-grid p-fluid">
        <div class="p-col-12 p-md-6 p-lg-4">
          <div class="form-group">
            <label for="pfpSelection" class="form-label">Sélectionnez un PFP</label>
            <Dropdown id="pfpSelection" v-model="selectedPFP" @change="filterPlacedestage" :options="pfpOptions" optionLabel="label" placeholder="Tous les PFPs" class="w-full" />
          </div>
        </div>
        <div class="p-col-12 p-md-6 p-lg-4">
          <div class="form-group">
            <label for="classInput" class="form-label">Classe d'Étudiants SAE</label>
            <InputText id="classInput" v-model="classInput" class="w-full" @input="fetchStudents" />
          </div>
        </div>
        <div class="p-col-12 p-md-6 p-lg-4">
          <div class="form-group">
            <label for="dateDebut" class="form-label">Date de début</label>
            <Calendar v-model="dateDebut" class="w-full" dateFormat="yy-mm-dd" showIcon />
          </div>
        </div>
        <div class="p-col-12 p-md-6 p-lg-4">
          <div class="form-group">
            <label for="dateFin" class="form-label">Date de fin</label>
            <Calendar v-model="dateFin" class="w-full" dateFormat="yy-mm-dd" showIcon />
          </div>
        </div>
        <div class="p-col-12 p-md-6 p-lg-4">
          <div class="form-group">
            <label for="anneeAcademique" class="form-label">Année Académique</label>
            <InputText id="anneeAcademique" v-model="anneeAcademique" class="w-full" />
          </div>
        </div>
      </div>

      <DataTable :value="filteredStages" responsiveLayout="scroll">
        <Column field="institutionName" header="Nom Institution" :body="rowData => getInstitutionName(rowData.idInstitution)" />
        <Column field="NpmPractitionerTrainer" header="Praticien Formateur" />
        <Column field="sector" header="Secteur" />
        <Column field="AIGU" header="AIGU">
          <template #body="slotProps">
            <Checkbox v-model="slotProps.data.AIGU" />
          </template>
        </Column>
        <Column field="REA" header="REA">
          <template #body="slotProps">
            <Checkbox v-model="slotProps.data.REA" />
          </template>
        </Column>
        <Column field="MSQ" header="MSQ">
          <template #body="slotProps">
            <Checkbox v-model="slotProps.data.MSQ" />
          </template>
        </Column>
        <Column field="SYSINT" header="SYSINT">
          <template #body="slotProps">
            <Checkbox v-model="slotProps.data.SYSINT" />
          </template>
        </Column>
        <Column field="NEUROGER" header="NEUROGER">
          <template #body="slotProps">
            <Checkbox v-model="slotProps.data.NEUROGER" />
          </template>
        </Column>
        <Column field="AMBU" header="AMBU">
          <template #body="slotProps">
            <Checkbox v-model="slotProps.data.AMBU" />
          </template>
        </Column>
        <Column field="SAE" header="Cas particulier">
          <template #body="slotProps">
            <Checkbox v-model="slotProps.data.SAE" />
          </template>
        </Column>
        <Column field="selectedStudent" header="Étudiant SAE">
          <template #body="slotProps">
            <Dropdown v-if="slotProps.data.SAE" v-model="slotProps.data.selectedStudent" :options="etudiants" optionLabel="name" />
          </template>
        </Column>
      </DataTable>

      <div class="d-flex justify-content-center mt-4">
        <Button @click="createPFP" label="Créer PFP" class="p-button-primary" />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { get, set, ref as dbRef, onValue } from 'firebase/database';
import { db } from '../../../../firebase.js';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Dropdown from 'primevue/dropdown';
import InputText from 'primevue/inputtext';
import Calendar from 'primevue/calendar';
import Checkbox from 'primevue/checkbox';
import Button from 'primevue/button';
import Navbar from '@/components/common/utils/Navbar.vue'

export default {
  name: 'PFPDetails',
  components: {
    Navbar,
    DataTable,
    Column,
    Dropdown,
    InputText,
    Calendar,
    Checkbox,
    Button
  },
  setup() {
    const anneeAcademique = ref('');
    const selectedPFP = ref('');
    const classInput = ref('');
    const dateDebut = ref(null);
    const dateFin = ref(null);
    const filteredStages = ref([]);
    const institutions = ref({});
    const etudiants = ref([]);

    const pfpOptions = [
      { label: 'Tous les PFPs', value: '' },
      { label: 'PFP1A', value: 'PFP1A' },
      { label: 'PFP1B', value: 'PFP1B' },
      { label: 'PFP2', value: 'PFP2' },
      { label: 'PFP3', value: 'PFP3' },
      { label: 'PFP4', value: 'PFP4' }
    ];

    const fetchEtudiants = async () => {
      try {
        const etudiantsRef = dbRef(db, 'etudiants');
        const snapshot = await get(etudiantsRef);
        if (snapshot.exists()) {
          const data = snapshot.val();
          etudiants.value = Object.keys(data).map(key => ({
            id: key,
            name: `${data[key].Prenom} ${data[key].Nom}`,
            ...data[key]
          }));
        } else {
          console.error('Aucun étudiant trouvé');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des étudiants:', error);
      }
    };

    const fetchStages = async () => {
      const stageRef = dbRef(db, `annees_civils/${anneeAcademique.value}/${selectedPFP.value}`);
      const stageSnapshot = await get(stageRef);

      if (stageSnapshot.exists()) {
        const stagesData = stageSnapshot.val();
        filteredStages.value = Object.entries(stagesData).map(([key, value]) => ({ id: key, ...value }));
      } else {
        console.error('No data available');
      }
    };

    const filterPlacedestage = () => {
      fetchStages();
    };

    const createPFP = async () => {
      try {
        const anneePFP = `${anneeAcademique.value}-${selectedPFP.value}`;
        const pfpData = {};
        filteredStages.value.forEach(stage => {
          pfpData[stage.id] = { ...stage };
        });
        const pfpRef = dbRef(db, `lieustage/${anneePFP}`);
        await set(pfpRef, pfpData);
        console.log('PFP créé avec succès:', anneePFP);
      } catch (error) {
        console.error('Erreur lors de la création du PFP:', error);
      }
    };

    const getInstitutionName = (idInstitution) => {
      return institutions.value[idInstitution]?.Name || 'Nom inconnu';
    };

    onMounted(() => {
      fetchEtudiants();

      const institutionsRef = dbRef(db, 'institutions/');
      onValue(institutionsRef, (snapshot) => {
        if (snapshot.exists()) {
          institutions.value = snapshot.val();
        } else {
          console.error('Pas d’institutions disponibles');
          institutions.value = {};
        }
      });
    });

    return {
      anneeAcademique,
      selectedPFP,
      classInput,
      dateDebut,
      dateFin,
      filteredStages,
      institutions,
      etudiants,
      pfpOptions,
      filterPlacedestage,
      createPFP,
      getInstitutionName
    };
  }
};
</script>

<style scoped>
.container {
  background-color: #fff;
  padding: 20px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  margin-top: 20px;
}

.form-group {
  margin-bottom: 20px;
}

.table-header {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}

.p-button-primary {
  background-color: #007bff;
  border: none;
}

.p-button-primary:hover {
  background-color: #0056b3;
}

.w-full {
  width: 100%;
}
</style>
