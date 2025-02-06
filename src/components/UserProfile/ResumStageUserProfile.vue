<template>
  <div class="m-4">
    <!-- Critères Validés (Agrégation des critères de toutes les places de stage) -->
    <h5 class="mb-4">Critères Validés</h5>
    <div class="grid m-2" v-if="aggregatedCriteria && Object.keys(aggregatedCriteria).length">
      <div
        v-for="(value, key) in aggregatedCriteria"
        :key="key"
        class="col-2 sm:col-4 lg:col-2 flex flex-column align-items-center justify-content-center card w-12 criteria-card"
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

    <!-- Anciennes Institutions (basées sur les IDs présents dans PFP_valided) -->
    <h5 class="mb-4">Anciennes Institutions</h5>
    <div class="card w-12" v-if="institutionsList && institutionsList.length">
      <div v-for="inst in institutionsList" :key="inst.InstitutionId" class="institution-card">
        <div class="institution-content">
          <!-- Affiche le nom de l'institution (si la clé 'Name' n'existe pas, on utilise 'NomInstitution') -->
          <h6 class="font-bold">{{ inst.Name || inst.NomInstitution }}</h6>
        </div>
        <div class="action-button">
          <Button
            label="Voir Plus"
            class="p-button-sm p-button-outlined p-button-primary"
            @click="navigateToInstitution(inst.InstitutionId)"
          />
        </div>
      </div>
    </div>
    <div v-else>
      <p class="text-secondary">Aucune institution disponible pour cet utilisateur.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getDatabase, ref as dbRef, get } from "firebase/database";
import Button from "primevue/button";

// Références pour les données
const userProfile = ref(null);
const institutionsList = ref([]); // Liste des institutions associées aux places de PFP_valided

// Référence au routeur pour la navigation
const router = useRouter();

// (Optionnel) Image d'avatar par défaut
const defaultAvatar = '../../../public/assets/images/avatar/01.jpg';

// Liste des critères à agréger
const criteriaList = ["MSQ", "SYSINT", "NEUROGER", "REHAB", "AMBU", "FR", "DE"];

// Propriété calculée qui agrège les critères sur toutes les places de stage
const aggregatedCriteria = computed(() => {
  const result = {};
  criteriaList.forEach(crit => (result[crit] = false));

  if (userProfile.value && userProfile.value.PFP_valided) {
    for (const place in userProfile.value.PFP_valided) {
      const pfp = userProfile.value.PFP_valided[place];
      criteriaList.forEach(crit => {
        if (pfp[crit] === true) {
          result[crit] = true;
        }
      });
    }
  }
  return result;
});

// Fonction pour récupérer le profil utilisateur via son ID depuis Firebase
const fetchUserProfileById = async (userId) => {
  const db = getDatabase();
  try {
    const studentRef = dbRef(db, `Students/${userId}`);
    const snapshotStudent = await get(studentRef);
    if (snapshotStudent.exists()) {
      const studentData = snapshotStudent.val();
      userProfile.value = { ...studentData };

      // Récupérer les institutions associées aux places de stage validées
      if (studentData.PFP_valided) {
        const pfpEntries = Object.values(studentData.PFP_valided);
        const dbPromises = pfpEntries.map(place => {
          const instId = place.ID_PFP;
          // On suppose que l'institution se trouve dans "Institutions/<instId>"
          return get(dbRef(db, `Institutions/${instId}`))
            .then(snapshot => {
              if (snapshot.exists()) {
                return { ...snapshot.val(), InstitutionId: instId };
              } else {
                return null;
              }
            });
        });
        const fetchedInstitutions = await Promise.all(dbPromises);
        institutionsList.value = fetchedInstitutions.filter(inst => inst !== null);
      }
    } else {
      console.error("Aucun profil trouvé pour l'ID :", userId);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données :", error);
  }
};

// Fonction de navigation : utilise la route déjà créée dans votre router.js
const navigateToInstitution = (instId) => {
  if (instId) {
    console.log("Navigation vers l'institution avec ID :", instId);
    // Utilise la route existante nommée "InstitutionView" (ou "InstitutionProfile" selon votre configuration)
    // Ici, d'après votre router.js, on suppose que la route qui affiche le profil d'une institution s'appelle "InstitutionView"
    router.push({ name: 'InstitutionView', params: { id: instId } });
  }
};

const route = useRoute();
onMounted(() => {
  const userId = route.params.id;
  if (userId) {
    fetchUserProfileById(userId);
  } else {
    console.error("Aucun ID d'utilisateur fourni dans l'URL");
  }
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
  height: 80%;
  text-align: center;
}

/* Styles Anciennes Institutions */
.institution-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  background-color: var(--surface-card);
  transition: box-shadow 0.2s, transform 0.2s;
  margin-bottom: 1rem;
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
  display: flex;
  gap: 1rem;
}

/* Couleurs */
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

@media (max-width: 600px) {
  .w-12 {
    width: 100% !important;
  }

  .criteria-card {
    height: auto;
  }

  .institution-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .action-button {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
