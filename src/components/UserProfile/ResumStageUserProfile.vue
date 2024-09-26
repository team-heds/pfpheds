<template>
  <div>
    <div class="grid">
      <div class="col-12">
        <div class="card">
          <h5>Profil de l'utilisateur</h5>
          <div v-if="userProfile">
            <p><strong>Nom :</strong> {{ userProfile.Nom }}</p>
            <p><strong>Prénom :</strong> {{ userProfile.Prenom }}</p>
            <p><strong>Classe :</strong> {{ userProfile.Classe }}</p>
            <p><strong>E-Mail :</strong> {{ userProfile.Mail }}</p>
            <p><strong>Répondant.e HES :</strong> {{ userProfile.RepondantHES }}</p>
            <p><strong>Remarque :</strong> {{ userProfile.Remarque }}</p>
            <h5>Détails</h5>
            <DataTable :value="[userProfile]" tableStyle="min-width: 50rem">
              <Column field="MSQ" header="MSQ" :body="formatColumn('MSQ')"></Column>
              <Column field="SYSINT" header="SYSINT" :body="formatColumn('SYSINT')"></Column>
              <Column field="NEUROGER" header="NEURO_GER" :body="formatColumn('NEUROGER')"></Column>
              <Column field="AIGU" header="AIGU" :body="formatColumn('AIGU')"></Column>
              <Column field="REHAB" header="REHAB" :body="formatColumn('REHAB')"></Column>
              <Column field="AMBU" header="AMBU" :body="formatColumn('AMBU')"></Column>
              <Column field="fr" header="FR" :body="formatColumn('FR')"></Column>
              <Column field="all" header="ALL" :body="formatColumn('ALL')"></Column>
            </DataTable>
          </div>
          <div v-else>
            <p>Chargement des données du profil... ou Profil introuvable.</p>
          </div>
        </div>

        <!-- Tableau unique pour les stages -->
        <div class="card mt-4">
          <h5>Stages Précédents</h5>
          <DataTable
            :value="stages"
            :paginator="true"
            :rows="10"
            dataKey="id"
            :rowHover="true"
            :loading="loading"
            showGridlines
            tableStyle="min-width: 50rem"
          >
            <template #empty> Pas de stages disponibles. </template>
            <template #loading> Chargement des données des stages. Veuillez patienter. </template>
            <Column field="NomPlace" header="Institution" style="min-width: 12rem"></Column>
            <Column field="Lieu" header="Lieu" style="min-width: 12rem"></Column>
            <Column field="Langue" header="Langue" style="min-width: 12rem"></Column>
            <Column field="Secteur" header="Secteur" style="min-width: 12rem" :body="secteurTemplate"></Column>
          </DataTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import { getDatabase, ref as dbRef, get } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const stages = ref([]);
const userProfile = ref(null);
const loading = ref(true);

// Function to fetch user profile
const fetchUserProfile = async (userId) => {
  const db = getDatabase();

  try {
    // Fetch from Users database
    const userRef = dbRef(db, `Users/${userId}`);
    const snapshotUser = await get(userRef);

    if (snapshotUser.exists()) {
      const user = snapshotUser.val();
      userProfile.value = {
        id: userId,
        Nom: user.Nom || 'Non spécifié',
        Prenom: user.Prenom || 'Non spécifié',
        Mail: user.Mail || 'Non spécifié',
        Classe: '', // Will be filled from Students database
        RepondantHES: user.RepondantHES || 'Non spécifié',
        Remarque: user.Remarque || 'Non spécifié',
      };

      // Fetch from Students database
      const studentsRef = dbRef(db, `Students/${userId}`);
      const snapshotStudent = await get(studentsRef);

      if (snapshotStudent.exists()) {
        const student = snapshotStudent.val();
        userProfile.value.Classe = student.Class || 'Non spécifié';
        addAllPFPInfoToStages(student, userId);
      } else {
        console.error(`Student data not found for ID: ${userId}`);
      }

      console.log('User profile:', userProfile.value);
    } else {
      userProfile.value = null;
      console.log('User profile not found in Users table');
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
};

// Function to add PFP stages to list
const addAllPFPInfoToStages = (student, studentKey) => {
  const pfpInfos = ['PFP1_info', 'PFP2_info', 'PFP3_info', 'PFP4_info'];
  pfpInfos.forEach((pfp) => {
    if (student[pfp]) {
      stages.value.push({
        id: `${pfp}-${studentKey}`,
        NomPlace: student[pfp].NomPlace || 'N/A',
        Lieu: student[pfp].Lieu || 'N/A',
        Langue: student[pfp].Langue || 'N/A',
        Secteur: getSecteurs(student[pfp]),
      });
    }
  });
  console.log('Stages:', stages.value);
};

// Function to extract sectors (stage details)
const getSecteurs = (info) => {
  const secteurs = [];
  if (info.NEUROGER) secteurs.push('NEUROGER');
  if (info.REHAB) secteurs.push('REHAB');
  if (info.AIGU) secteurs.push('AIGU');
  if (info.MSQ) secteurs.push('MSQ');
  if (info.SYSINT) secteurs.push('SYSINT');
  if (info.AMBU) secteurs.push('AMBU');
  return secteurs.join(', ');
};

// Template for displaying sectors in the table
const secteurTemplate = (rowData) => rowData.Secteur;

// Mounted lifecycle to load profile and stages data
onMounted(async () => {
  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      console.log('User ID:', user.uid); // Log the user ID
      await fetchUserProfile(user.uid);
      loading.value = false;
    } else {
      userProfile.value = null;
      loading.value = false;
    }
  });
});
</script>

<style scoped>
.details-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
}

.details-table th,
.details-table td {
  border: 1px solid #ccc;
  padding: 8px;
  text-align: center;
}

.details-table th {
  background-color: #f4f4f4;
  font-weight: bold;
}

.text-green-500 {
  color: green;
  font-weight: bold;
}

.text-red-500 {
  color: red;
  font-weight: bold;
}
</style>
