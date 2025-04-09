<template>
  <div class="votation-result-profil">
    <br>
    <h5 class="mb-4">Résultats de Votation</h5>
    <div v-if="hasData">
      <!-- Itération sur chaque groupe (ex. BA24) -->
      <div v-for="(votationGroup, groupKey) in filteredVotationData" :key="groupKey" class="votation-group">
        <!-- Itération sur chaque sous-groupe (ex. PFP1A) -->
        <div v-for="(subGroup, subKey) in votationGroup" :key="subKey" class="votation-subgroup">
          <h6 class="subgroup-title">{{ subKey }}</h6>
          <div class="grid m-2">
            <!-- Affichage de chaque résultat filtré -->
            <div v-for="(item, index) in subGroup" :key="index" class="vote-card card p-3">
       


              <p><strong>Institution :</strong> {{ item.Name }}</p>
              <p><strong>Domaine :</strong> {{ item.Domaine }}</p>
              <p><strong>Votre vote :</strong> {{ item.choiceNumber }}</p>
              <p><strong>Nom du PF :</strong> {{ item.choiceNumber }}</p>
              <p><strong>Mail du PF :</strong> {{ item.choiceNumber }}</p>
              <p><strong>Numéro du PF :</strong> {{ item.choiceNumber }}</p>
              <br>
            
              <button><router-link :to="`/institution/${item.IdInstitution}?tab=encadrement`">
                  Voir la page de l'Encadrement étudiant de l'institution
                </router-link>
               </button><br><br>
              <button> Comment contacter PF</button><br>

            </div>
          </div>
        </div>
      </div>
    </div>
    <div v-else>
      <p>Aucun résultat de votation disponible pour cet utilisateur.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { db } from 'root/firebase';
import { ref as dbRef, get } from 'firebase/database';

// Définir la prop userId (l'ID de l'utilisateur sélectionné)
const props = defineProps({
  userId: {
    type: String,
    required: true
  }
});

// Stocke l'ensemble des données de votation depuis Firebase
const votationData = ref({});

// Récupère les données depuis le nœud "/votationResut"
const fetchVotationData = async () => {
  try {
    const votationRef = dbRef(db, 'VotationResult');
    const snapshot = await get(votationRef);
    if (snapshot.exists()) {
      votationData.value = snapshot.val();
    } else {
      console.error("Aucune donnée de votation disponible.");
    }
  } catch (error) {
    console.error("Erreur lors de la récupération des données de votation :", error);
  }
};

onMounted(() => {
  fetchVotationData();
});

// Filtre les résultats pour ne conserver que ceux correspondant à l'utilisateur
const filteredVotationData = computed(() => {
  const result = {};
  const uid = props.userId;
  if (!votationData.value) return result;
  for (const groupKey in votationData.value) {
    const group = votationData.value[groupKey];
    const newGroup = {};
    for (const subKey in group) {
      const filteredArray = group[subKey].filter(
        (item) => item.studentId === uid
      );
      if (filteredArray.length > 0) {
        newGroup[subKey] = filteredArray;
      }
    }
    if (Object.keys(newGroup).length > 0) {
      result[groupKey] = newGroup;
    }
  }
  return result;
});

const hasData = computed(() => Object.keys(filteredVotationData.value).length > 0);
</script>

<style scoped>
.group-title {
  margin-top: 1rem;
  font-size: 1.25rem;
  font-weight: bold;
}

.subgroup-title {
  margin: 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.vote-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 0.75rem;
  background-color: var(--surface-card, #fff);
}
</style>