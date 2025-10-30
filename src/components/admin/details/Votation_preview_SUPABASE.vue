<template>
  <div class="container py-5">
    <div class="text-center mb-4">
      <h1 class="mb-3">Preview des votations</h1>
      <div>
        <label class="form-label">Classe : B22</label> <br>
        <label class="form-label">PFP : PFP2</label> <br>
        <label class="form-label">Année académique: 23</label> <br>
        <h3>Nombre d'étudiants ayant voté: {{ nombreEtudiantsVotants }}</h3>
      </div>
    </div>

    <DataTable :value="votations" responsiveLayout="scroll">
      <template #header>
        <div class="table-header">Liste des votations</div>
      </template>
      <Column field="studentName" header="ETUDIANT" />
      <Column v-for="n in 5" :key="'choix-' + n" :header="'Choix ' + n" :body="slotProps => getChoice(slotProps.data, n)" />
    </DataTable>

    <div class="d-flex justify-content-center mt-4">
      <Button @click="algo" label="Lancer l'algo" class="p-button-primary" />
    </div>
  </div>
</template>

<script>
import { db } from '../../../../firebase.js';
import { ref, onValue, get } from "firebase/database";
import { ref as vueRef, onMounted } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import { useInstitutionsStore } from '@/stores/institutionsStore';

export default {
  name: 'VotationPreview',
  components: {
    DataTable,
    Column,
    Button
  },
  setup() {
    const votations = vueRef([]);
    const institutions = vueRef({});
    const placedestages = vueRef({});
    const institutionsStore = useInstitutionsStore();

    const fetchVotations = async () => {
      try {
        const votationRef = ref(db, 'votation/23/PFP2');
        const snapshot = await get(votationRef);
        if (snapshot.exists()) {
          const votationData = snapshot.val();
          votations.value = Object.entries(votationData).map(([studentName, data]) => {
            return {
              studentName: studentName,
              choices: data.choices
            };
          });
          console.log("Votations récupérées :", votations.value);
        } else {
          console.error('Aucune votation trouvée pour 23/PFP2');
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des votations:', error);
      }
    };

    const fetchInstitutions = async () => {
      try {
        await institutionsStore.fetchInstitutions();
        const institutionsArray = institutionsStore.institutions;
        
        // Convertir le tableau en objet indexé par InstitutionId pour compatibilité
        institutions.value = institutionsArray.reduce((acc, inst) => {
          acc[inst.InstitutionId] = inst;
          return acc;
        }, {});
        
        console.log("✅ Institutions récupérées depuis Supabase :", Object.keys(institutions.value).length);
      } catch (error) {
        console.error('❌ Erreur chargement institutions depuis Supabase:', error);
        institutions.value = {};
      }
    };

    const fetchPlacedestages = () => {
      const placedestageRef = ref(db, 'placedestage');
      onValue(placedestageRef, (snapshot) => {
        if (snapshot.exists()) {
          const allStages = snapshot.val();
          const processedStages = {};
          for (const key in allStages) {
            const stage = allStages[key];
            for (const subKey in stage) {
              processedStages[subKey] = stage[subKey];
            }
          }
          placedestages.value = processedStages;
          console.log("Stages traités :", placedestages.value);
        } else {
          console.error('Aucun placedestage trouvé');
          placedestages.value = {};
        }
      });
    };

    const getChoice = (data, index) => {
      const stageId = data.choices[index - 1];
      const institutionId = placedestages.value[stageId]?.idInstitution || 'ID inconnu';
      const institutionName = institutions.value[institutionId]?.Name || 'Nom inconnu';
      const sector = placedestages.value[stageId]?.Sector || 'Secteur inconnu';
      return `${institutionName} - ${sector}`;
    };

    const algo = () => {
      console.log('Lancement de l\'algorithme...');
      // TODO: Implémenter l'algorithme
    };

    onMounted(() => {
      fetchInstitutions();
      fetchPlacedestages();
      fetchVotations();
    });

    return {
      votations,
      nombreEtudiantsVotants: vueRef(0),
      getChoice,
      algo
    };
  }
};
</script>

<style scoped>
.table-header {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
}
</style>
