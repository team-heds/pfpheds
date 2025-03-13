<template>
  <!-- Titre -->

  <!-- Grille des critères validés -->
  <div class="grid m-2 align-items-left justify-content-center flex " v-if="aggregatedCriteria && Object.keys(aggregatedCriteria).length">
    <div
      v-for="(value, key) in aggregatedCriteria"
      :key="key"
      style="height: 77px;"
      class="col-4 sm:col-6 lg:col-4 flex flex-column align-items-center justify-content-center w-3 card criteria-card"
    >
      <span class="font-bold text-center">{{ key }}</span>
      <i
        :class="{
            'pi pi-check-circle text-green-500': value,
            'pi pi-times-circle text-red-500': !value
          }"
        class="text-3xl mt-2"
      ></i>
    </div>
  </div>
  <div v-else>
    <p class="text-secondary">Aucun critère validé.</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, defineProps } from 'vue';
import { getDatabase, ref as dbRef, get } from "firebase/database";

// 1) On reçoit en prop l'ID de l'utilisateur
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
});

// 2) Liste des critères qu'on veut afficher
const criteriaList = [
  "MSQ",
  "SYSINT",
  "NEUROGER",
  "AIGU",
  "REHAB",
  "AMBU",
  "FR",
  "DE"
];

// 3) On stocke localement le profil "Student"
const userProfile = ref(null);

// 4) On calcule aggregatedCriteria (le mapping critère -> booléen)
const aggregatedCriteria = computed(() => {
  const result = {};
  criteriaList.forEach(crit => (result[crit] = false));
  if (userProfile.value && userProfile.value.PFP_valided) {
    for (const placeKey in userProfile.value.PFP_valided) {
      const pfp = userProfile.value.PFP_valided[placeKey];
      criteriaList.forEach(crit => {
        if (pfp[crit] === true) {
          result[crit] = true;
        }
      });
    }
  }
  return result;
});

// 5) Fonction pour charger le profil "Student"
const fetchUserProfileById = async (userId) => {
  const db = getDatabase();
  try {
    const studentRef = dbRef(db, `Students/${userId}`);
    const snapshotStudent = await get(studentRef);
    if (snapshotStudent.exists()) {
      userProfile.value = snapshotStudent.val();
    } else {
      console.error("Aucun profil 'Student' trouvé pour l'ID :", userId);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données :", error);
  }
};

// 6) Au montage, on récupère le profil via userId
onMounted(() => {
  if (props.userId) {
    fetchUserProfileById(props.userId);
  } else {
    console.error("Aucun userId fourni en prop.");
  }
});
</script>

<style scoped>
/* Exemple de styles (ou PrimeFlex) */

/* .p-grid, .p-col-6, etc. => si vous utilisez PrimeFlex 2.x
   ou .flex, .col-6 => si PrimeFlex 3.x */

/* Ex: apparence d'une box */
.criteria-box {
  background-color: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 6px;
  min-height: 80px;
  text-align: center;
  padding: 1rem;
}

/* Couleurs (si besoin) */
.text-green-500 {
  color: var(--green-500);
}
.text-red-500 {
  color: var(--red-500);
}
.text-secondary {
  color: var(--text-secondary-color);
}
</style>
