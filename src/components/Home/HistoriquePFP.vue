<template>
  <div class="m-4">
    <Navbar />
    <LeftSidebar />
    <!-- Critères Validés -->
    <h5 class="mb-4">Critères Validés</h5>
    <div
      class="grid m-2"
      v-if="aggregatedCriteria && Object.keys(aggregatedCriteria).length"
    >
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

    <!-- Anciennes Institutions -->
    <h5 class="mb-4">Anciennes Institutions</h5>
    <div class="card w-12" v-if="institutionsList && institutionsList.length">
      <div
        v-for="inst in institutionsList"
        :key="inst.InstitutionId"
        class="institution-card"
      >
        <div class="institution-content">
          <!-- Affichage du nom de l'institution (selon la propriété disponible) -->
          <h6 class="font-bold">{{ inst.Name || inst.NomInstitution }}</h6>
          <!-- Affichage des domaines et critères validés -->
          <p v-if="inst.Domaines && inst.Domaines.length">
            Domaine : {{ inst.Domaines.join(", ") }}
            <span
              v-if="inst.CriteriaValides && inst.CriteriaValides.length"
            >
              | Critères validés : {{ inst.CriteriaValides.join(", ") }}
            </span>
          </p>
        </div>
        <div class="action-button">
          <Button
            label="Voir les détails de l'institution"
            class="p-button-sm p-button-outlined p-button-primary"
            @click="navigateToInstitution(inst.InstitutionId)"
          />
        </div>
      </div>
    </div>
    <div v-else>
      <p class="text-secondary">
        Aucune institution disponible pour cet utilisateur.
      </p>
    </div>
  </div>
  <RightSidebar />
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { getDatabase, ref as dbRef, get } from "firebase/database";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { useRouter } from "vue-router";
import Button from "primevue/button";
import Navbar from "@/components/Utils/Navbar.vue";
import LeftSidebar from '@/components/Bibliotheque/Social/LeftSidebar.vue'
import RightSidebar from '@/components/Bibliotheque/Social/RightSidebar.vue'

// Références pour les données
const userProfile = ref(null);
const institutionsList = ref([]);

// Liste des critères à agréger
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

// Propriété calculée qui agrège les critères sur toutes les places de stage
const aggregatedCriteria = computed(() => {
  const result = {};
  criteriaList.forEach((crit) => (result[crit] = false));
  if (userProfile.value && userProfile.value.PFP_valided) {
    for (const place in userProfile.value.PFP_valided) {
      const pfp = userProfile.value.PFP_valided[place];
      criteriaList.forEach((crit) => {
        if (pfp[crit] === true) {
          result[crit] = true;
        }
      });
    }
  }
  return result;
});

const router = useRouter();

// Fonction pour récupérer le profil utilisateur via son ID depuis Firebase
const fetchUserProfileById = async (userId) => {
  const db = getDatabase();
  try {
    const studentRef = dbRef(db, `Students/${userId}`);
    const snapshotStudent = await get(studentRef);
    if (snapshotStudent.exists()) {
      const studentData = snapshotStudent.val();
      userProfile.value = { ...studentData };

      if (studentData.PFP_valided) {
        const pfpEntries = Object.values(studentData.PFP_valided);
        // Filtrer les places disposant d'un ID d'institution
        const validPfpEntries = pfpEntries.filter(
          (place) => place.ID_PFP
        );

        // Agrégation des domaines et critères validés par institution
        const domainsByInstitution = {};
        const criteriaByInstitution = {};

        validPfpEntries.forEach((place) => {
          const instId = place.ID_PFP;
          if (place.Domaine) {
            if (!domainsByInstitution[instId]) {
              domainsByInstitution[instId] = new Set();
            }
            domainsByInstitution[instId].add(place.Domaine);
          }
          if (!criteriaByInstitution[instId]) {
            criteriaByInstitution[instId] = new Set();
          }
          criteriaList.forEach((crit) => {
            if (place[crit] === true) {
              criteriaByInstitution[instId].add(crit);
            }
          });
        });

        // Récupération des institutions associées aux places validées
        const dbPromises = validPfpEntries.map((place) => {
          const instId = place.ID_PFP;
          return get(dbRef(db, `Institutions/${instId}`))
            .then((snapshot) => {
              if (snapshot.exists()) {
                return { ...snapshot.val(), InstitutionId: instId };
              } else {
                return null;
              }
            });
        });
        const fetchedInstitutions = await Promise.all(dbPromises);
        institutionsList.value = fetchedInstitutions
          .filter((inst) => inst !== null)
          .map((inst) => {
            const domainSet = domainsByInstitution[inst.InstitutionId];
            const criteriaSet = criteriaByInstitution[inst.InstitutionId];
            return {
              ...inst,
              Domaines: domainSet ? Array.from(domainSet) : [],
              CriteriaValides: criteriaSet ? Array.from(criteriaSet) : []
            };
          });
      }
    } else {
      console.error("Aucun profil trouvé pour l'ID :", userId);
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données :", error);
  }
};

// Fonction de navigation vers la page de l'institution
const navigateToInstitution = (instId) => {
  if (instId) {
    console.log("Navigation vers l'institution avec ID :", instId);
    router.push({ name: "InstitutionView", params: { id: instId } });
  }
};

onMounted(() => {
  const auth = getAuth();
  onAuthStateChanged(auth, (user) => {
    if (user) {
      fetchUserProfileById(user.uid);
    } else {
      console.error("Utilisateur non authentifié");
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
