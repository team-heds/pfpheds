<template>
  <div>
    <div class="grid">
      <div class="col-12">
        <div class="card">
          <h5>Profil de l'utilisateur</h5>
          <div v-if="userProfile && userInfo">
            <p><strong>Nom :</strong> {{ userInfo.Name }}</p>
            <p><strong>Prénom :</strong> {{ userInfo.Forname }}</p>
            <p><strong>Email :</strong> {{ userInfo.Mail }}</p>
            <h5>Critères validés</h5>
            <DataTable :value="[userProfile]" tableStyle="min-width: 50rem">
              <Column field="MSQ" header="MSQ">
                <template #body="slotProps">
                  <i
                    :class="{ 'pi pi-check text-green-500': slotProps.data.MSQ > 0, 'pi pi-times text-red-500': slotProps.data.MSQ === 0 }"></i>
                </template>
              </Column>
              <Column field="SYSINT" header="SYSINT">
                <template #body="slotProps">
                  <i
                    :class="{ 'pi pi-check text-green-500': slotProps.data.SYSINT > 0, 'pi pi-times text-red-500': slotProps.data.SYSINT < 1  }"></i>
                </template>
              </Column>
              <Column field="NEUROGER" header="NEUROGER">
                <template #body="slotProps">
                  <i
                    :class="{ 'pi pi-check text-green-500': slotProps.data.NEUROGER > 0, 'pi pi-times text-red-500': slotProps.data.NEUROGER < 1  }"></i>
                </template>
              </Column>
              <Column field="AIGU" header="AIGU">
                <template #body="slotProps">
                  <i
                    :class="{ 'pi pi-check text-green-500': slotProps.data.AIGU > 0, 'pi pi-times text-red-500': slotProps.data.AIGU < 1 }"></i>
                </template>
              </Column>
              <Column field="REHAB" header="REHAB">
                <template #body="slotProps">
                  <i
                    :class="{ 'pi pi-check text-green-500': slotProps.data.REHAB > 0, 'pi pi-times text-red-500': slotProps.data.REHAB < 1  }"></i>
                </template>
              </Column>
              <Column field="AMBU" header="AMBU">
                <template #body="slotProps">
                  <i
                    :class="{ 'pi pi-check text-green-500': slotProps.data.AMBU > 0, 'pi pi-times text-red-500': slotProps.data.AMBU < 1  }"></i>
                </template>
              </Column>
              <Column field="FR" header="FR">
                <template #body="slotProps">
                  <i
                    :class="{ 'pi pi-check text-green-500': slotProps.data.FR > 0, 'pi pi-times text-red-500': slotProps.data.FR < 1  }"></i>
                </template>
              </Column>
              <Column field="ALL" header="ALL">
                <template #body="slotProps">
                  <i
                    :class="{ 'pi pi-check text-green-500': slotProps.data.ALL > 0, 'pi pi-times text-red-500': slotProps.data.ALL < 1  }"></i>
                </template>
              </Column>
            </DataTable>

          </div>
          <div v-else>
            <p>Chargement des données du profil... ou Profil introuvable.</p>
          </div>
        </div>

        <div class="card mt-4">
          <h5>Anciennes places (PFP)</h5>
          <DataTable :value="[institution]" :rows="1" dataKey="id" :rowHover="true" :loading="loading" showGridlines
            tableStyle="min-width: 50rem">
            <template #empty> Aucune institution disponible. </template>
            <template #loading> Chargement des données de l'institution. Veuillez patienter. </template>
            <Column field="NomInstitution" header="Nom de l'institution" style="min-width: 12rem"></Column>
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

// Variables réactives
const userProfile = ref(null);
const userInfo = ref(null); // Stocker les informations depuis Users
const institution = ref(null); // Variable pour stocker les données de PFP_1
const loading = ref(true);

// Fonction pour récupérer le profil utilisateur depuis Students et Users
const fetchUserProfileByKey = async (key) => {
  const db = getDatabase();
  try {
    console.log('Fetching student profile with key:', key);
    const studentRef = dbRef(db, `Students/${key}`);
    const userRef = dbRef(db, `Users/${key}`);

    // Récupération des informations depuis Students
    const snapshotStudent = await get(studentRef);
    // Récupération des informations depuis Users
    const snapshotUser = await get(userRef);

    if (snapshotStudent.exists() && snapshotUser.exists()) {
      const studentData = snapshotStudent.val();
      const userData = snapshotUser.val();

      userProfile.value = {
        ...studentData,
        id: key
      };

      userInfo.value = {
        Name: userData.Name,
        Forname: userData.Forname,
        Mail: userData.Mail
      };

      console.log('User profile data:', userProfile.value);
      console.log('User info data:', userInfo.value);

      // Récupérer uniquement l'institution liée à PFP_1
      if (studentData.PFP_1) {
        institution.value = {
          NomInstitution: studentData.PFP_1 || 'Nom non disponible',
        };
      } else {
        institution.value = null;
      }
      console.log('Institution PFP_1:', institution.value);
    } else {
      console.error(`User profile not found for key: ${key}`);
    }
  } catch (error) {
    console.error('Error fetching data:', error);
  }
};

// Formater les colonnes (montrer une coche pour 1+ et une croix pour 0)
const formatColumn = (field) => (rowData) => {
  return rowData[field] && rowData[field] > 0
    ? '<i class="pi pi-check text-green-500"></i>'  // coche verte pour 1+
    : '<i class="pi pi-times text-red-500"></i>';  // croix rouge pour 0
};

// Lors de la montée du composant, récupère les données utilisateur et l'institution PFP_1
onMounted(async () => {
  const auth = getAuth();
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userKey = user.uid;
      console.log('Fetching profile and institution for user key:', userKey);

      if (userKey) {
        await fetchUserProfileByKey(userKey);
        loading.value = false;
      } else {
        console.error('Aucune clé utilisateur disponible.');
        loading.value = false;
      }
    } else {
      console.log('No user authenticated');
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
