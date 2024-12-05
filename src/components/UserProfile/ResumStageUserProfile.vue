<template>
  <div class="m-4">
    <!-- Critères Validés -->
    <h5 class="mb-4">Critères Validés</h5>
    <div class="grid m-2">
      <div
        v-for="(value, key) in userProfile"
        :key="key"
        class="col-2 sm:col-4 lg:col-2 flex flex-column align-items-center justify-content-center card w-12 criteria-card"
      >
        <span class="font-bold text-center">{{ key }}</span>
        <i
          :class="{
            'pi pi-check-circle text-green-500': parseInt(value) >= 1,
            'pi pi-times-circle text-red-500': !value || parseInt(value) === 0
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
import { useRoute, useRouter } from "vue-router";
import { getDatabase, ref as dbRef, get } from "firebase/database";
import Button from "primevue/button";

// Références pour les données
const userProfile = ref(null);
const institution = ref(null);

// Référence au routeur pour la navigation
const router = useRouter();

// Définir une image d'avatar par défaut si nécessaire
const defaultAvatar = '../../../public/assets/images/avatar/01.jpg';

// Fonction pour récupérer le profil utilisateur via son ID
const fetchUserProfileById = async (userId) => {
  const db = getDatabase();
  try {
    const studentRef = dbRef(db, `Students/${userId}`);
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
    } else {
      console.error("Aucun profil trouvé pour l'ID :", userId);
      // Optionnel : Rediriger vers une page d'erreur ou afficher un message utilisateur
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données :", error);
  }
};

// Fonction pour naviguer vers la page de l'institution
const navigateToInstitution = () => {
  if (institution.value && institution.value.NomInstitution) {
    // Supposons que chaque institution a un ID unique, stocké quelque part
    // Ici, nous utilisons NomInstitution pour l'exemple, mais idéalement, utilisez un ID unique

    // Exemple de navigation (à adapter selon votre configuration de routes) :
    // router.push({ name: 'InstitutionProfile', params: { id: institutionId } });

    console.log("Navigating to institution page...");
    // Implémentez la navigation réelle ici si vous avez un ID d'institution
  }
};

// Accéder aux paramètres de la route
const route = useRoute();

onMounted(() => {
  const userId = route.params.id; // Récupère l'ID depuis l'URL
  if (userId) {
    fetchUserProfileById(userId); // Charge le profil correspondant à l'ID
  } else {
    console.error("Aucun ID d'utilisateur fourni dans l'URL");
    // Optionnel : Rediriger vers une page d'erreur ou afficher un message utilisateur
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
  display: flex;
  gap: 1rem; /* Ajoute un espace de 1rem entre les boutons */
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

@media (max-width: 600px) {
  /* Sur mobile, ajuster la largeur des cartes */
  .w-12 {
    width: 100% !important;
  }

  /* Ajustements supplémentaires si nécessaire */
  .criteria-card {
    height: auto; /* Permet aux cartes de s'adapter à leur contenu sur mobile */
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
