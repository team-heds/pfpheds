<template>
  <Navbar/>
  <div class="m-4">
    <!-- Critères Validés -->
    <h5 class="mb-4">Critères Validés</h5>
    <div class="grid m-2">
      <div
        v-for="(value, key) in userProfile"
        :key="key"
        class="col-2 sm:col-4 lg:col-2 flex flex-column align-items-center justify-content-center card w-12 criteria-card "
      >
        <span class="font-bold text-center">{{ key }}</span>
        <i
          :class="{
            'pi pi-check-circle text-green-500': value > 0,
            'pi pi-times-circle text-red-500': value === 0
          }"
          class="text-3xl mt-2"
        ></i>
      </div>
    </div>

    <!-- Anciennes Places (PFP) -->
    <h5 class="mb-4">Anciennes Places (PFP)</h5>
    <div class="card w-12">
      <div v-if="institution && institution.NomInstitution" class="institution-card">
        <div class="institution-content">
          <h6 class="font-bold">{{ institution.NomInstitution }}</h6>
        </div>
        <div class="action-button">
          <Button
            label="Voir Plus"
            class="p-button-sm p-button-outlined p-button-primary"
            @click="navigateToInstitution"
          />
        </div>
      </div>
      <div v-else>
        <p class="text-secondary">Aucune institution disponible pour cet utilisateur.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { getDatabase, ref as dbRef, get } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import Button from "primevue/button";
import Navbar from '@/components/Utils/Navbar.vue'

const userProfile = ref(null);
const institution = ref(null);

const fetchUserProfileByKey = async (key) => {
  const db = getDatabase();
  try {
    const studentRef = dbRef(db, `Students/${key}`);
    const snapshotStudent = await get(studentRef);

    if (snapshotStudent.exists()) {
      const studentData = snapshotStudent.val();
      userProfile.value = {
        MSQ: studentData.MSQ || 0,
        SYSINT: studentData.SYSINT || 0,
        NEUROGER: studentData.NEUROGER || 0,
        AIGU: studentData.AIGU || 0,
        REHAB: studentData.REHAB || 0,
        AMBU: studentData.AMBU || 0,
        FR: studentData.FR || 0,
        ALL: studentData.ALL || 0,
      };

      // Récupérer institution liée à PFP_1
      institution.value = studentData.PFP_1
        ? { NomInstitution: studentData.PFP_1 || "Nom non disponible" }
        : null;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

const navigateToInstitution = () => {
  // Naviguer vers la page de l'institution
  console.log("Navigating to institution page...");
};

onMounted(() => {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchUserProfileByKey(user.uid);
    }
  });
});
</script>

<style scoped>
/* Styles Critères Validés */
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.criteria-card {
  height: 80%; /* Hauteur uniforme pour toutes les cartes */
  text-align: center;
}

/* Styles Anciennes Places */
.institution-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  background-color: var(--surface-card);
  transition: box-shadow 0.2s, transform 0.2s;
}

.institution-card:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.institution-content h6 {
  margin: 0;
  font-size: 1.125rem;
  color: var(--text-color);
}

.institution-content p {
  margin: 0.25rem 0 0;
  font-size: 0.875rem;
}

.action-button {
  flex-shrink: 0;
}

/* Colors */
.text-primary {
  color: var(--primary-color);
}

.text-secondary {
  color: var(--text-secondary-color);
}

.text-green-500 {
  color: var(--green-500);
}

.text-red-500 {
  color: var(--red-500);
}

/* Responsive */
@media (max-width: 768px) {
  .text-3xl {
    font-size: 1.5rem;
  }
}
</style>
